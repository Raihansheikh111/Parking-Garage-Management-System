# Reasoning — Parking Management System

## 1. Problem Understanding

The system is designed for a busy, multi-level parking garage where the attendant needs to perform four core operations reliably:

1. Check a vehicle in.
2. Assign a compatible parking spot without double-booking.
3. Check the vehicle out and calculate the correct fee.
4. Quickly find vehicles and review a large parking history.

The design is intentionally **garage-agnostic**. No garage, level, spot count, pricing rule, or vehicle is hardcoded into the application.

The most important principle I followed was:

> **The backend is the source of truth for parking state and business rules. The frontend is responsible for collecting input and presenting results.**

This keeps the system consistent even when multiple users or requests interact with the same garage.

---

# 2. High-Level Architecture

```text
                    ┌──────────────────────────┐
                    │        React + Vite      │
                    │                          │
                    │  Dashboard               │
                    │  Check-in / Check-out    │
                    │  Search / History        │
                    └────────────┬─────────────┘
                                 │
                                 │ REST + JWT
                                 ▼
                    ┌──────────────────────────┐
                    │     Node.js + Express     │
                    │                          │
                    │  Auth                    │
                    │  Garage Management       │
                    │  Spot Allocation         │
                    │  Parking Sessions        │
                    │  Fee Calculation         │
                    │  Search / Pagination     │
                    └────────────┬─────────────┘
                                 │
                                 │ Mongoose
                                 ▼
                    ┌──────────────────────────┐
                    │         MongoDB           │
                    │                          │
                    │  Users                   │
                    │  Garages                 │
                    │  Parking Spots           │
                    │  Parking Sessions        │
                    └──────────────────────────┘
```

The frontend and backend are deliberately separated so that the parking rules remain centralized in the API instead of being duplicated in the UI.

---

# 3. Core Design Approach

I broke the problem into four independent responsibilities:

```text
                    PARKING SYSTEM
                          │
          ┌───────────────┼────────────────┐
          ▼               ▼                ▼
     Configuration     Parking Flow      Queries
          │               │                │
      Garages          Check-in          Search
      Spot Types       Allocation         History
      Pricing          Checkout           Pagination
                       Fee Calculation     Sorting
```

The implementation order was chosen deliberately:

```text
Database
   ↓
Parking Rules
   ↓
REST APIs
   ↓
Authentication
   ↓
Frontend Integration
   ↓
End-to-End Validation
```

This allowed the critical parking logic to be correct before adding UI concerns.

---

# 4. Data Model

The system uses four main entities.

```text
┌──────────────┐
│     User     │
├──────────────┤
│ _id          │
│ name         │
│ email        │
│ passwordHash │
└──────────────┘


┌────────────────────────┐
│        Garage          │
├────────────────────────┤
│ _id                    │
│ name                   │
│ address                │
│ levels                 │
│ pricing                │
│  ├─ firstHour          │
│  ├─ additionalHour    │
│  └─ dailyCap           │
└────────────┬───────────┘
             │
             │ 1 : N
             ▼
┌────────────────────────┐
│     ParkingSpot        │
├────────────────────────┤
│ _id                    │
│ garageId               │
│ level                  │
│ spotNumber             │
│ type                   │
│ status                 │
└────────────┬───────────┘
             │
             │ 1 : N
             ▼
┌────────────────────────┐
│    ParkingSession      │
├────────────────────────┤
│ _id                    │
│ garageId               │
│ spotId                 │
│ plateNumber             │
│ vehicleType             │
│ checkInTime             │
│ checkOutTime            │
│ fee                     │
│ status                  │
└────────────────────────┘
```

### Why separate `ParkingSpot` and `ParkingSession`?

A spot represents **physical infrastructure**.

A session represents **a vehicle's visit**.

This separation allows the system to preserve historical parking records even after a spot becomes available again.

For example:

```text
ParkingSpot
EV-1-01
status = available

        ↑
        │ released after checkout
        │
ParkingSession
EV1234
status = completed
fee = 9
```

The historical session remains stored while the physical spot can immediately be reused.

---

# 5. Vehicle and Spot Compatibility

The assessment explicitly requires EV vehicles to receive EV spots.

I therefore use strict compatibility:

```text
Vehicle Type       Compatible Spot
────────────────────────────────────
compact       →    compact
standard      →    standard
ev            →    ev
```

I intentionally did not invent rules such as allowing a compact vehicle to occupy a standard spot because the specification does not define that behavior.

This makes allocation deterministic and easy to reason about.

---

# 6. Check-In Flow

The check-in operation follows this sequence:

```text
              CHECK-IN REQUEST
                     │
                     ▼
          Normalize plate number
                     │
                     ▼
       Is this plate already active?
              │             │
             YES            NO
              │             │
              ▼             ▼
          Return 409     Find compatible
                         available spot
                              │
                              ▼
                    Atomic spot reservation
                              │
                              ▼
                    Create parking session
                              │
                              ▼
                         Return ticket
```

The request is:

```json
{
  "garageId": "...",
  "plateNumber": "RJ14AB1234",
  "vehicleType": "ev"
}
```

The response contains the assigned session and spot information.

---

# 7. Preventing Double Parking

One of the most important design decisions is how a parking spot is allocated.

A naive implementation might do:

```text
1. Find an available spot.
2. Change its status to occupied.
```

This has a race-condition problem.

Two requests could both execute step 1 before either executes step 2:

```text
Request A ──► Find EV-01 ──► available
Request B ──► Find EV-01 ──► available

Request A ──► occupy EV-01
Request B ──► occupy EV-01
```

That could result in two vehicles being assigned the same spot.

### Solution

I use MongoDB's atomic `findOneAndUpdate`:

```text
Find:
    garageId = requested garage
    type = requested vehicle type
    status = available

Update:
    status = occupied
```

Conceptually:

```text
                    MongoDB
                       │
                       ▼
        ┌──────────────────────────┐
        │ Find available compatible│
        │ spot + occupy atomically  │
        └─────────────┬────────────┘
                      │
              ┌───────┴───────┐
              ▼               ▼
          Success           None
              │               │
              ▼               ▼
       Create session     No space
                              │
                              ▼
                         Return error
```

Because the selection and update happen atomically, two concurrent requests cannot successfully reserve the same available spot.

This is the most important concurrency consideration in the parking allocation flow.

---

# 8. Preventing Duplicate Active Vehicles

A vehicle should not be checked in twice simultaneously.

Before creating a session, the plate is normalized:

```text
" rj14ab1234 "
       ↓
"RJ14AB1234"
```

This prevents differences in casing or accidental whitespace from bypassing duplicate detection.

The database also uses a partial unique index for active sessions.

Conceptually:

```text
Unique only when:

status = "active"
```

Therefore:

```text
RJ14AB1234 → active
RJ14AB1234 → rejected
```

But after checkout:

```text
RJ14AB1234 → completed
RJ14AB1234 → can check in again
```

This allows historical sessions while preventing simultaneous active sessions for the same vehicle.

---

# 9. Fee Calculation

Fee calculation is deliberately kept in the backend.

The frontend never decides how much a vehicle should pay.

The calculation flow is:

```text
check-in time
      │
      ▼
check-out time
      │
      ▼
calculate duration
      │
      ▼
round partial hour upward
      │
      ▼
first hour → firstHour rate
remaining hours → additionalHour rate
      │
      ▼
apply daily cap
      │
      ▼
final fee
```

For example, if:

```text
firstHour       = ₹10
additionalHour  = ₹5
dailyCap        = ₹40
```

Then:

```text
30 minutes
→ 1 billable hour
→ ₹10

1 hour 1 minute
→ 2 billable hours
→ ₹10 + ₹5
→ ₹15

3 hours
→ ₹10 + ₹5 + ₹5
→ ₹20
```

The final result is capped:

```text
finalFee = Math.min(calculatedFee, dailyCap)
```

For this assessment, I interpret the daily cap as the maximum fee for the entire parking session rather than introducing an unspecified multi-day billing model.

This avoids inventing business rules that were not part of the requirement.

---

# 10. Why Fee Calculation Lives in the Backend

The backend calculates the fee because the fee is a business rule.

If both frontend and backend calculated it independently:

```text
Frontend calculation
        +
Backend calculation
        =
Potential inconsistency
```

Instead:

```text
Frontend
   │
   │ "Checkout RJ14AB1234"
   ▼
Backend
   │
   ├── duration
   ├── rounding
   ├── pricing
   └── daily cap
   │
   ▼
Final fee
   │
   ▼
Frontend displays result
```

This gives the system one authoritative source for billing.

---

# 11. Checkout Flow

Checkout follows:

```text
Plate number
     │
     ▼
Find active session
     │
     ├── Not found → 404
     │
     ▼
Calculate duration
     │
     ▼
Calculate fee
     │
     ▼
Complete session
     │
     ▼
Release parking spot
     │
     ▼
Return receipt
```

The receipt contains information such as:

```text
Plate
Spot
Duration
Check-in
Check-out
Fee
Status
```

The completed session remains in MongoDB for historical reporting.

---

# 12. Availability

Availability is derived from the actual parking spot state rather than maintained as a manually incremented counter.

```text
Parking Spots
      │
      ├── available
      └── occupied
             │
             ▼
      Availability API
             │
             ▼
        Dashboard
```

The API supports both overall grouped availability and type-specific availability.

For example:

```text
EV
Total:     10
Available: 6
Occupied:  4
```

This means the dashboard always reflects the current database state.

---

# 13. Search

The attendant needs to quickly locate vehicles by plate.

The search endpoint supports partial plate matching:

```text
GET /api/parking/search?plate=RJ14
```

The input is normalized before searching.

This allows an attendant to search:

```text
RJ14
```

and find:

```text
RJ14AB1234
RJ14CD5678
```

This is intentionally a simple and practical search model for the assessment rather than introducing a separate search engine.

---

# 14. Parking History, Pagination and Sorting

Parking history can become very large over time.

Returning every session on every request would become inefficient:

```text
10 records
→ fine

10,000 records
→ unnecessary response size

1,000,000 records
→ unacceptable
```

Therefore history uses server-side pagination:

```text
GET /api/parking/sessions
    ?page=1
    &limit=10
    &sort=checkInTime
    &order=desc
```

The backend uses:

```text
skip
limit
countDocuments
```

to return:

```text
{
  data: [...],
  pagination: {
    page,
    limit,
    total,
    totalPages
  }
}
```

Sorting is restricted to an explicit whitelist rather than accepting arbitrary database fields.

This keeps the API predictable and avoids exposing uncontrolled query behavior.

---

# 15. Authentication and Security

Authentication was added after the core parking operations.

```text
Register
   │
   ▼
bcrypt password hashing
   │
   ▼
MongoDB
   │
   ▼
Login
   │
   ▼
JWT
   │
   ▼
Frontend localStorage
   │
   ▼
Authorization: Bearer <token>
   │
   ▼
Protected API
```

Passwords are never stored in plaintext.

The database stores:

```text
passwordHash
```

rather than:

```text
password
```

JWTs are signed using the environment-provided `JWT_SECRET` and expire after seven days.

The authentication middleware:

1. Reads the Bearer token.
2. Verifies the JWT.
3. Loads the user.
4. Attaches safe user information to the request.
5. Allows the protected route to continue.

Operational APIs require authentication, while registration, login, and health check remain public.

---

# 16. Frontend Architecture

The frontend follows a simple responsibility structure:

```text
Pages
  │
  ▼
Services
  │
  ▼
Central API Client
  │
  ▼
Express API
```

The main service modules are:

```text
auth.service.js
garage.service.js
spot.service.js
parking.service.js
api.js
```

This prevents individual pages from directly implementing HTTP logic everywhere.

For example:

```text
CheckInPage
     │
     ▼
parking.service.js
     │
     ▼
api.js
     │
     ▼
POST /api/parking/check-in
```

The frontend displays the backend response instead of reimplementing parking rules.

---

# 17. Frontend Authentication State

The frontend stores the authenticated session using:

```text
pms_token
pms_user
pms_garage_id
```

On refresh:

```text
Browser refresh
      │
      ▼
Read stored token
      │
      ▼
Restore authentication state
      │
      ▼
Protected pages remain accessible
```

When the user logs out:

```text
Remove session
      │
      ▼
Clear authentication state
      │
      ▼
Redirect to /login
```

Passwords and password hashes are never stored in frontend storage.

---

# 18. Garage Selection

The application does not assume a fixed garage.

Instead:

```text
GET /api/garages
       │
       ▼
Garage selector
       │
       ▼
Selected garage ID
       │
       ├── Availability
       ├── Check-in
       └── Garage-specific operations
```

This follows the requirement that the application should work for **any garage**, rather than being designed around one hardcoded garage.

---

# 19. Error Handling

The frontend converts API failures into user-facing messages.

Important backend responses include:

```text
400 → Invalid input
401 → Authentication required/invalid
404 → Resource not found
409 → Conflict
500 → Server error
```

The UI does not expose raw backend stack traces to the user.

The general flow is:

```text
API error
    │
    ▼
Service/API layer
    │
    ▼
User-friendly message
    │
    ▼
UI error state
```

---

# 20. Important Trade-offs

Because this was a 2.5-hour assessment, I deliberately optimized for:

```text
Correctness
    ↓
Working core flows
    ↓
Data consistency
    ↓
Security
    ↓
Usability
    ↓
Additional features
```

I avoided introducing unnecessary infrastructure such as:

* Redis
* Docker
* WebSockets
* Redux
* Microservices
* External search engines
* Payment systems
* Notification systems
* AI services

These would increase implementation complexity without improving the required parking workflow.

---

# 21. Transaction Trade-off

The checkout operation involves two important database updates:

```text
1. Complete parking session
2. Release parking spot
```

The current implementation saves the completed session before releasing the spot.

Therefore, in the unlikely event that the second database operation fails, the session could be completed while the spot remains occupied.

A MongoDB transaction could make these operations atomic:

```text
BEGIN TRANSACTION
       │
       ├── complete session
       │
       ├── release spot
       │
       ▼
COMMIT
```

However, transactions introduce deployment requirements such as a MongoDB replica-set configuration.

For this timed assessment, I chose the simpler implementation while explicitly recognizing this consistency trade-off.

---

# 22. Why This Architecture Fits the Problem

The design focuses on the actual risks in the parking domain:

```text
Risk                          Solution
────────────────────────────────────────────────
Double-booked spot            Atomic spot allocation
Duplicate active vehicle      Unique active-session constraint
Incorrect plate matching      Plate normalization
Incorrect fee                 Backend fee service
Overcharging                  Daily cap
Large history                 Pagination
Uncontrolled sorting          Sort whitelist
Unauthorized operations       JWT authentication
Stale availability            Database-backed state
Hardcoded garage              Garage-based configuration
```

This keeps the system small enough for a timed assessment while still addressing the important correctness and consistency requirements.

---

# 23. End-to-End System Flow

The complete operational flow is:

```text
                    ┌──────────────┐
                    │   Attendant  │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Frontend   │
                    └──────┬───────┘
                           │
                     REST + JWT
                           │
                           ▼
                ┌─────────────────────┐
                │   Express Backend   │
                └──────────┬──────────┘
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
          Check-in     Check-out       Search
             │             │             │
             ▼             ▼             ▼
       Spot allocation   Fee service   Session query
             │             │             │
             └─────────────┼─────────────┘
                           ▼
                     ┌───────────┐
                     │  MongoDB  │
                     └───────────┘
```

The backend owns the state, while the frontend provides the interface through which the attendant interacts with that state.

---

# 24. Validation Strategy

The implementation was validated against the real running backend rather than relying only on compilation.

The main flow tested was:

```text
Register
   ↓
Login
   ↓
Create garage
   ↓
Create spots
   ↓
Read availability
   ↓
EV check-in
   ↓
Search plate
   ↓
Checkout
   ↓
Verify fee
   ↓
Verify spot released
   ↓
Read history
```

Authentication and error cases were also checked:

```text
401 Unauthorized
400 Bad Request
404 Not Found
409 Conflict
```

Frontend build validation was also performed to ensure the integrated application can be produced successfully.

---

# 25. Final Design Principle

The most important architectural decision in this project is the separation between **presentation and business rules**.

```text
                 FRONTEND
        "What does the attendant
             want to do?"
                    │
                    ▼
                 BACKEND
        "Is this operation valid?"
                    │
                    ▼
                 DATABASE
        "What is the actual state?"
```

The frontend does not decide:

* which spot is valid,
* whether a vehicle can check in,
* whether a plate is already active,
* how much the vehicle should pay,
* whether a spot is available,
* or whether a session is completed.

Those decisions belong to the backend.

This makes the system easier to reason about, safer against inconsistent state, and easier to extend while keeping the implementation appropriate for a timed assessment.

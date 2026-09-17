# Reasoning

## Problem Understanding

The application will support attendants managing cars in a busy, multi-level parking garage with limited, typed spots and tiered parking fees. The foundation must remain general enough to support any garage rather than hardcoding one location.

## Initial Architecture

```text
React
  ↓
Express REST API
  ↓
MongoDB
```

## Technology Decisions

React and Vite provide a fast, straightforward frontend development workflow. Node.js and Express are a small, familiar foundation for REST APIs, while MongoDB and Mongoose support flexible garage-related data as the domain grows. This stack is suitable for a 2.5-hour timed assessment because it is quick to scaffold and keeps frontend, API, and persistence concerns clear.

## Phase 1 Decisions

The frontend and backend are separated into `client/` and `server/` so each application has its own dependencies, scripts, and deployment boundary. The server source is organized by responsibility (`config`, `controllers`, `middleware`, `models`, `routes`, `services`, and `utils`) so later phases can add functionality without changing the project foundation.

## Further Future Architecture

Later phases beyond the current core backend may add:

- authentication
- frontend workflows
- operational refinements

## Phase 2 Decisions

### Database Schema

The database contains `User`, `Garage`, `ParkingSpot`, and `ParkingSession` models. A garage owns spots and pricing. A parking session references its garage and spot, stores normalized plate data, and records active or completed state. Users are defined for future authentication only; authentication is not implemented in this phase.

### Domain Rules

Vehicle and spot types match exactly: compact vehicles use compact spots, standard vehicles use standard spots, and EV vehicles use EV spots. Check-in reserves a matching available spot with an atomic `findOneAndUpdate`, so concurrent requests cannot successfully claim the same spot. A partial unique index prevents multiple active sessions for one normalized plate, with application validation providing the user-facing conflict response.

### Fees

Fee calculation is deterministic and lives in `fee.service.js`. The first billable hour uses `firstHour`; each later billable hour uses `additionalHour`; partial hours round up. For this assessment, the daily cap is interpreted as the maximum fee for the entire parking session, so the result is `Math.min(calculatedFee, dailyCap)`. This deliberately avoids inventing multi-day billing behavior.

### API Operations

Garage and spot endpoints provide the setup data needed by parking operations. Availability is grouped by type when no type is requested. Session history uses MongoDB `skip`, `limit`, and `countDocuments` for pagination, and sorting is restricted to an explicit field whitelist. Search normalizes input and uses a partial plate match.

### Tradeoffs

The implementation uses straightforward controllers and services rather than adding a validation framework or transaction infrastructure. Spot allocation is atomic and session creation rolls the spot back if it fails. MongoDB must be configured through `server/.env`; the server does not start when `MONGO_URI` is missing or the connection fails.

Checkout saves the completed session before releasing its spot. If the separate spot update fails after the session save, the session can be completed while the spot remains occupied. A MongoDB transaction could make those writes atomic, but this timed assessment keeps the simpler approach and does not introduce transaction infrastructure without a replica-set deployment.

## Phase 3 Decisions

Authentication uses `bcryptjs` to hash passwords before storage and `jsonwebtoken` to issue seven-day tokens signed with the environment-provided `JWT_SECRET`. The authentication middleware validates a Bearer token, loads the user, and attaches safe user information to `req.user` before protected routes run. Registration and login remain public, while all operational garage and parking APIs require authentication.

No RBAC was introduced because the assessment requires identity protection, not roles or permissions. Passwords, password hashes, and tokens are never returned in unsafe responses or logged. Garage ownership was not added to the existing model because the current requirement is authenticated access for any garage and adding ownership would create an unnecessary data migration boundary.
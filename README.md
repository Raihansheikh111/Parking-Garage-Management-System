# Parking Management System

## Overview

Parking Management System is a full-stack application for managing a multi-level parking garage. The backend is the authoritative source of business logic, while the Lovable-generated frontend consumes that API and presents the parking flows in a responsive dashboard UI.

## Tech Stack

Frontend:
- React + Vite
- React Router
- Local storage session handling for JWT auth

Backend:
- Node.js + Express
- MongoDB + Mongoose
- JWT-based authentication

## Project Structure

- `client/` contains the React and Vite frontend application.
- `server/` contains the Express API and MongoDB models, services, controllers, and middleware.
- Root contains shared repository docs and environment configuration.

## Frontend Setup

```bash
cd client
npm install
cp .env.example .env
npm run dev -- --host 0.0.0.0
```

The frontend runs independently on `http://localhost:5173` and communicates with the backend via `VITE_API_URL`.

## Backend Setup

```bash
cd server
npm install
npm run dev
```

The backend runs on `http://localhost:5000`.

## Environment Variables

Create a local `server/.env` file with the required values for MongoDB and JWT secrets. The repository ignores `.env` files and does not track secrets.

Frontend example:

```env
VITE_API_URL=http://localhost:5000/api
```

Server example:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/parking-management
JWT_SECRET=your_local_secret
```

## Frontend Routes

The frontend supports the following routes:

- `/`
- `/login`
- `/register`
- `/dashboard`
- `/check-in`
- `/check-out`
- `/search`
- `/history`

Unauthenticated users are redirected to `/login` when they try to access protected pages.

## How the Frontend Communicates with the Backend

The frontend uses a centralized API client in `client/src/services/api.js`.

- It reads `VITE_API_URL` from the environment.
- It attaches the JWT from `localStorage` as `Authorization: Bearer <token>` for protected requests.
- It uses the backend endpoints directly without mock data or a second API server.

## Health Check

With the backend running, request:

```text
GET /api/health
```

The endpoint returns the current API status.

## Authentication

Register a user with `POST /api/auth/register` using `name`, `email`, and `password`. Passwords must be at least 8 characters and are stored only as bcrypt hashes.

Log in with `POST /api/auth/login` using `email` and `password`. A successful login returns a JWT. Send it on protected requests with:

```text
Authorization: Bearer <token>
```

`POST /api/auth/register`, `POST /api/auth/login`, and `GET /api/health` are public. All garage, spot, availability, check-in, check-out, search, and session-history endpoints require authentication.

## Existing API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | API health check. |
| `POST` | `/api/auth/register` | Create a user account. |
| `POST` | `/api/auth/login` | Authenticate a user and return a JWT. |
| `POST` | `/api/garages` | Create a garage with levels and pricing. |
| `GET` | `/api/garages?page=1&limit=10` | List garages with pagination. |
| `GET` | `/api/garages/:id` | Get one garage. |
| `PUT` | `/api/garages/:id` | Update garage configuration. |
| `POST` | `/api/spots` | Create a parking spot. |
| `GET` | `/api/spots?garageId=&type=&status=&level=` | List spots with optional filters. |
| `GET` | `/api/garages/:garageId/spots/availability?type=ev` | Return availability for one type, or grouped by type when omitted. |
| `POST` | `/api/parking/check-in` | Allocate a compatible spot and create an active session. |
| `POST` | `/api/parking/check-out` | Complete a session and release the spot. |
| `GET` | `/api/parking/search?plate=RJ14` | Search sessions by partial normalized plate. |
| `GET` | `/api/parking/sessions?page=1&limit=10&sort=checkInTime&order=desc` | List session history with pagination and sorting. |
| `GET` | `/api/parking/sessions/:id` | Get a single parking session. |

Successful check-in returns a `session` with the normalized plate, vehicle type, allocated spot, status, and check-in time. Successful checkout returns a `receipt` containing duration and fee information. The frontend only collects input and displays the backend responses.

## Current Status

The backend remains the source of truth and the frontend has been integrated to consume its real endpoints and auth flow without altering the backend architecture.
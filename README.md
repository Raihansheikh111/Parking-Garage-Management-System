# Parking Management System

## Overview

Parking Management System is a full-stack application foundation for managing a multi-level city-centre parking garage. Phase 1 establishes the frontend, backend, database configuration, and development workflow.

## Tech Stack

Frontend:
React + Vite

Backend:
Node.js + Express

Database:
MongoDB + Mongoose

## Project Structure

- `client/` contains the React and Vite frontend application.
- `server/` contains the Express API and reusable MongoDB connection configuration.

## Setup

From the project root, start the frontend:

```bash
cd client
npm install
npm run dev
```

In a separate terminal, start the backend:

```bash
cd server
npm install
npm run dev
```

## Environment Variables

Create `server/.env` locally by copying `server/.env.example`. Add real local values there as needed. Do not commit `.env` or database credentials.

## Health Check

With the backend running, request:

```text
GET /api/health
```

The endpoint returns the current API status.

## Backend APIs

The Phase 2 backend requires a valid `MONGO_URI` in `server/.env`.

## Authentication

Register a user with `POST /api/auth/register` using `name`, `email`, and `password`. Passwords must be at least 8 characters and are stored only as bcrypt hashes.

Log in with `POST /api/auth/login` using `email` and `password`. A successful login returns a JWT. Send it on protected requests with:

```text
Authorization: Bearer <token>
```

`POST /api/auth/register`, `POST /api/auth/login`, and `GET /api/health` are public. All garage, spot, availability, check-in, check-out, search, and session-history endpoints require authentication.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/garages` | Create a garage with levels and pricing. Body: `name`, `address`, `levels`, `pricing`. |
| `GET` | `/api/garages?page=1&limit=10` | List garages with pagination. |
| `GET` | `/api/garages/:id` | Get one garage. |
| `PUT` | `/api/garages/:id` | Update garage configuration. |
| `POST` | `/api/spots` | Create an available spot. Body: `garageId`, `level`, `spotNumber`, `type`. |
| `GET` | `/api/spots?garageId=&type=&status=&level=` | List spots with optional filters. |
| `GET` | `/api/garages/:garageId/spots/availability?type=ev` | Return availability for one type, or grouped by type when omitted. |
| `POST` | `/api/parking/check-in` | Allocate a compatible spot and create an active session. Body: `garageId`, `plateNumber`, `vehicleType`. |
| `POST` | `/api/parking/check-out` | Complete a session and release its spot. Body: `plateNumber`. |
| `GET` | `/api/parking/search?plate=RJ14` | Search sessions by partial normalized plate. |
| `GET` | `/api/parking/sessions?page=1&limit=10&sort=checkInTime&order=desc` | List session history with filters, pagination, and whitelisted sorting. |
| `GET` | `/api/parking/sessions/:id` | Get one parking session. |

Successful check-in returns a `session` containing the normalized plate, vehicle type, allocated spot, status, and check-in time. Successful checkout returns a `receipt` containing the duration and fee.

## Current Status

Phase 3 is implemented. The backend includes the Phase 2 parking functionality plus user registration, bcrypt password hashing, JWT login, authentication middleware, and protected operational APIs. The frontend remains a future phase; authorization roles are intentionally not implemented.
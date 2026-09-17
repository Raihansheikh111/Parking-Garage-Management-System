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

## Current Status

This is Phase 1. Only the project foundation, frontend setup, backend health endpoint, and reusable database connection configuration are implemented. Parking functionality is intentionally not implemented yet.
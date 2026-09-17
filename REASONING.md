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

## Future Architecture

Later phases will add:

- authentication
- garage management
- parking spots
- check-in/check-out
- fee calculation
- EV constraints
- search
- pagination
- sorting
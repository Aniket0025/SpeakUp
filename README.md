# SpeakUp

A full-stack app to practice communication skills with a modern UI. The project has a Next.js client and an Express + MongoDB backend. Authentication uses JWT, and all backend code lives strictly in the `server/` folder.

## Tech Stack
- Frontend: Next.js 16, React 19, Tailwind-based components
- Backend: Node.js, Express 5, MongoDB (Mongoose 9), JWT, bcrypt
- Auth: Email + Password with hashed passwords and Bearer JWT

## Project Structure
```
SpeakUp/
├─ client/            # Next.js app (frontend only)
│  ├─ app/            # Pages (login, register, dashboard, etc.)
│  ├─ components/     # UI components
│  ├─ hooks/          # useAuth (calls backend API)
│  └─ next.config.mjs
├─ server/            # Express API (all backend code here)
│  ├─ config/         # MongoDB connection
│  ├─ controller/     # auth controller
│  ├─ middleware/     # auth middleware
│  ├─ routes/         # /api/auth, /api/user
│  ├─ schema/         # User model
│  ├─ .env            # Backend env vars (not committed)
│  └─ server.js       # Express app entry
└─ README.md
```

## Prerequisites
- Node.js 18+ (recommended)
- A MongoDB connection string (Atlas or local)

## Quick Start

### 1) Backend (server)
1. Create `server/.env` with:
   ```env
   MONGODB_URI=your-mongodb-connection-string
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=some-strong-secret
   ```
2. Install deps and run the server:
   ```bash
   cd server
   npm install
   npm run dev
   ```
   The API should run at: http://localhost:5000

### 2) Frontend (client)
1. (Optional) Create `client/.env.local` if your backend URL is not the default:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
   ```
   If omitted, the client uses `http://localhost:5000` by default.
2. Install deps and start the dev server:
   ```bash
   cd client
   npm install
   npm run dev
   ```
   Open: http://localhost:3000

## API Reference (Backend)
Base URL: `http://localhost:5000`

### POST /api/auth/signup
Create a new user account.
- Body (JSON):
  ```json
  {
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "secret123",
    "role": "user"   // optional, defaults to "user"
  }
  ```
- Responses:
  - 201: `{ user: { id, fullName, email, role }, token }`
  - 409: `{ message: "Email already registered" }`
  - 400: `{ message: "Full Name, Email and Password are required" }` (or validation message)
  - 500: `{ message: "..." }` unexpected error
- Example (curl):
  ```bash
  curl -X POST http://localhost:5000/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{"fullName":"John Doe","email":"john@example.com","password":"secret123"}'
  ```

### POST /api/auth/login
Sign in an existing user.
- Body (JSON):
  ```json
  {
    "email": "john@example.com",
    "password": "secret123"
  }
  ```
- Responses:
  - 200: `{ user: { id, fullName, email, role }, token }`
  - 401: `{ message: "Invalid credentials" }`
  - 400/500: error message

### GET /api/user/me
Get the current user (protected).
- Headers:
  - `Authorization: Bearer <JWT>`
- Response:
  - 200: `{ user: { id, fullName, email, role } }`
  - 401: `{ message: "Unauthorized" }`

## Frontend Auth Flow
- After signup/login, the client stores:
  - `localStorage.speakup_user = { id, fullName, email, role }`
  - `localStorage.speakup_token = <JWT>`
- The dashboard/header read `user.fullName` to display the user’s real name.
- You can change the API base URL with `NEXT_PUBLIC_API_BASE_URL`.

## Scripts
- Server (`/server`):
  - `npm run dev` — start Express with nodemon
  - `npm start` — start Express with Node
- Client (`/client`):
  - `npm run dev` — start Next.js (dev)
  - `npm run build` — build for production
  - `npm start` — start Next.js (prod)

## Production Notes (basic)
- Server: set environment variables (`MONGODB_URI`, `JWT_SECRET`, `PORT`) and run `node server.js`.
- Client: `npm run build && npm start`. Configure `NEXT_PUBLIC_API_BASE_URL` to your deployed API.
- Ensure CORS is configured appropriately if client and server use different domains.

## Troubleshooting
- 500 on signup/login with message about `JWT_SECRET`:
  - Ensure `JWT_SECRET` is set in `server/.env` and restart the server.
- 409 `Email already registered`:
  - Use a different email or delete the existing user record.
- Mongo connection errors:
  - Verify `MONGODB_URI` and allow your IP in MongoDB Atlas.
- Name not showing on dashboard:
  - Make sure signup/login succeeded and `localStorage.speakup_user` is present; then refresh.

## License
This project is for educational/demo purposes. Add a license if you plan to distribute.

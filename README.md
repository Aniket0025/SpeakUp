  # SpeakUp

A full-stack app to practice communication skills with a modern UI. The project has a Next.js client and an Express + MongoDB backend. Authentication uses JWT, and all backend code lives strictly in the `server/` folder.

## Overview

SpeakUp helps learners practise real-world communication scenarios such as Group Discussions (GD) and Extempore speaking. It provides realtime, cross‑device waiting rooms, one‑click entry into a ZegoCloud video meeting, and automatic transcript capture to review performance.

## Who is this for

- Students preparing for campus placements and GD rounds
- Job seekers practising interview GDs and team communication
- Debate clubs and speaking societies that need quick, ad‑hoc rooms
- Trainers/coaches who host live practice sessions for cohorts

## Why this matters (the need)

- Most learners struggle to find consistent practice partners with low setup time.
- Traditional tools are not designed for GD practice (room creation, capacity, countdowns, host controls).
- Realtime, cross‑device reliability is essential so anyone on the same network or remote can join smoothly.
- Transcript capture enables feedback, reflection, and measurable progress.

## Key Features

- Realtime GD waiting room using Socket.IO with REST fallbacks for reliability
- Two modes: Global Matchmaking (auto‑start when full) and Custom Rooms (host‑started)
- Host‑only Start/End controls; participants can Exit/Leave
- Cross‑device support on LAN/WAN; automatic API base URL derivation on the client
- ZegoCloud integration for video/audio meetings (no pre‑join screens)
- Automatic transcript capture via browser speech recognition and server persistence
- Dynamic “Browse Rooms” for open custom rooms
- JWT authentication; MongoDB persistence; graceful reconnect and countdown handling

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
   # ZegoCloud (required for meetings)
   ZEGO_APP_ID=YOUR_APP_ID
   ZEGO_SERVER_SECRET=YOUR_SERVER_SECRET
   # Optional: allow specific origins for Socket.IO (comma‑separated). If unset, dev uses permissive CORS.
   # CLIENT_ORIGIN=http://localhost:3000,http://192.168.1.10:3000
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
   # Binds to all interfaces for cross‑device testing
   npm run dev
   ```
   Open: http://localhost:3000

### 3) Cross‑device testing on the same network

- Find your PC’s LAN IP (Windows PowerShell): `ipconfig` → use the IPv4 address (e.g., `192.168.1.10`).
- On phone/other laptop, open: `http://<PC_IP>:3000` (e.g., `http://192.168.1.10:3000`).
- The client auto‑targets `http://<PC_IP>:5000` for APIs and Socket.IO.
- If the other device can’t connect, allow inbound TCP ports `3000` and `5000` in Windows Firewall.

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

### GD (Group Discussion) endpoints

- POST `/api/gd/rooms` (auth)
  - Create a custom room: `{ roomName, topic, maxParticipants, durationSeconds }`
  - Returns: `{ roomId }`

- POST `/api/gd/rooms/:roomId/join` (auth)
  - Join an existing room (adds participant if space is available)

- GET `/api/gd/rooms/:roomId` (auth)
  - Fetch room status: `{ room, remainingSeconds }`

- GET `/api/gd/rooms` (auth)
  - List rooms with filters: `?status=waiting&mode=custom`
  - Returns minimal info for the “Browse Rooms” feature

- POST `/api/gd/global/join` (auth)
  - Global matchmaking: put caller into a waiting global room (max 6) or create one
  - Returns: `{ roomId }`

- GET `/api/gd/rooms/:roomId/transcript` (auth)
  - Fetch recorded transcript entries after/while a GD

### ZegoCloud token

- GET `/api/zego/token` (auth)
  - Query: `roomID`
  - Returns: `{ token, appID, userID, userName }`

## Frontend Auth Flow
- After signup/login, the client stores:
  - `localStorage.speakup_user = { id, fullName, email, role }`
  - `localStorage.speakup_token = <JWT>`
- The dashboard/header read `user.fullName` to display the user’s real name.
- You can change the API base URL with `NEXT_PUBLIC_API_BASE_URL`.

## Realtime events (Socket.IO)

- `gd:create` → host creates a custom room
- `gd:join` / `gd:get` → join room and fetch latest state
- `gd:start` (host only, custom rooms) → marks room active and starts timer
- `gd:started` → broadcast when room becomes active
- `gd:room` → broadcast updated room snapshot (participants, status)
- `gd:timer` → server tick with remaining seconds
- `gd:countdown` (global mode) → broadcast while room is full before auto‑start
- `gd:end` (host only) → mark completed and kick everyone back to GD page
- `gd:ended` → broadcast that room ended
- `gd:leave` → participant leaves (host is reassigned if needed)
- `gd:transcript:chunk` → append per‑utterance transcript entries

## Scripts
- Server (`/server`):
  - `npm run dev` — start Express with nodemon
  - `npm start` — start Express with Node
- Client (`/client`):
  - `npm run dev` — start Next.js (dev)
  - `npm run build` — build for production
  - `npm start` — start Next.js (prod)

## Production Notes (basic)
- Server: set environment variables (`MONGODB_URI`, `JWT_SECRET`, `PORT`, `ZEGO_APP_ID`, `ZEGO_SERVER_SECRET`) and run `node server.js`.
- Client: `npm run build && npm start`. Configure `NEXT_PUBLIC_API_BASE_URL` to your deployed API.
- Ensure CORS/Socket.IO origins are configured (`CLIENT_ORIGIN`) when client and server use different domains.

## Architecture overview

- Next.js app (client) renders waiting/meet pages and calls REST APIs.
- Express API (server) manages auth, rooms, transcripts, and issues Zego tokens.
- Socket.IO provides realtime updates; REST polling acts as a reliability fallback across networks.
- MongoDB persists rooms, participants, status, transcripts.

## Usage guide (happy path)

1. Sign up or log in.
2. Choose Global Matching (auto) or create/join a Custom Room.
3. In the waiting room:
   - Host sees Start GD (custom) or auto‑start countdown (global).
   - Participants see live list of joined users.
4. When the room starts, everyone is redirected to the Zego meeting.
5. Host can End Meeting; participants can Leave.
6. View transcripts from the meet overlay (if captured).

## Troubleshooting
- 500 on signup/login with message about `JWT_SECRET`:
  - Ensure `JWT_SECRET` is set in `server/.env` and restart the server.
- 409 `Email already registered`:
  - Use a different email or delete the existing user record.
- Mongo connection errors:
  - Verify `MONGODB_URI` and allow your IP in MongoDB Atlas.
- Name not showing on dashboard:
  - Make sure signup/login succeeded and `localStorage.speakup_user` is present; then refresh.
- Cross‑device cannot connect:
   - Open `http://<PC_IP>:3000` on the other device, not `localhost`.
   - Test backend reachability from the other device: `http://<PC_IP>:5000/` should return `{ "status": "ok" }`.
   - Allow Windows Firewall inbound TCP ports `3000` and `5000`.
   - Ensure both devices are on the same Wi‑Fi and not on a guest/isolated network.

## License
This project is for educational/demo purposes. Add a license if you plan to distribute.

# 🚂 RailYatra — Train Ticket Booking System

High-Performance Train Ticket Booking System with **Redis TTL Distributed Concurrency Locking**, **Coach-by-Coach Seat Selection Pagination**, and **Lightning-Fast Startup**.

---

## 📁 Project Structure

```
RailYatra/
├── docker-compose.yml   # Docker configuration for Redis 7
├── package.json         # Root management scripts
├── backend/             # Node.js + Express + MongoDB + Redis API
│   ├── config/          # Redis connection & DB seeder
│   ├── utils/           # Redis TTL lock service (atomic Lua scripts)
│   ├── models/          # Indexed Mongoose schemas (User, Train, Booking)
│   ├── routes/          # Express route handlers
│   ├── middleware/      # JWT auth middleware
│   └── server.js        # Entry point (IPv4 enforced, compression enabled)
│
└── frontend/            # React app
    └── src/
        ├── api/         # Axios instance with JWT interceptor
        ├── context/     # AuthContext (global auth state)
        ├── components/  # Navbar, PrivateRoute, AdminRoute
        ├── pages/       # All page components (Coach-paginated Booking)
        └── styles/      # Global modern styling
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** v18+
- **MongoDB** running locally on `127.0.0.1:27017` (or MongoDB Atlas URI)
- **Redis** (optional but recommended for distributed locking; run locally or via Docker)

---

### 1. Start Redis in Docker (Recommended)

```bash
docker compose up -d redis
```
*Or with Docker CLI:*
```bash
docker run -d --name railyatra-redis -p 6379:6379 redis:alpine
```
> **Note on Resilient Fallback:** If Redis is offline, RailYatra automatically runs with database-level concurrency protection and zero crashes, then seamlessly activates Redis TTL locks when Redis is connected!

---

### 2. Backend Setup

```bash
cd backend
cp .env.example .env     # Review environment settings
npm install
npm run dev              # Starts on http://localhost:5001 (Ultra-fast boot < 150ms)
```

Default Admin User (auto-seeded on first run):
- **Username:** `admin`
- **Password:** `admin123`

---

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm start                # Starts on http://localhost:3000
```

---

## 🔒 Redis TTL Distributed Locking & Concurrency Protection

RailYatra prevents double-booking across simultaneous users using **atomic Redis TTL distributed locks**:
1. When a user requests seats, an atomic Lua script checks seat availability and locks the keys `railyatra:lock:train:{trainId}:seat:{seatId}` with a 60-second TTL.
2. If another user attempts to book the same seat in the same millisecond, Redis rejects the second request instantly with a `409 Conflict` and identifies the conflicting seat.
3. Once MongoDB creates the booking record, the temporary acquisition lock is released and recorded as permanently booked.
4. If a booking fails or is abandoned, Redis TTL automatically expires the hold so seats never stay stuck.

---

## 💺 Coach-by-Coach Seat Selection Pagination

- **Zero Vertical Scroll:** Rather than rendering hundreds of seats vertically, RailYatra paginates seat selection coach by coach (Coach 1, Coach 2, etc.).
- **Coach Navigation:** Previous / Next Coach controls, Coach selector pills, and live availability stats per coach.
- **Cross-Coach Selection:** Select up to 4 seats across different coaches; clicking any selected seat chip in the sidebar jumps directly to that coach.
- **Visual Status & Legend:** Real train aisle layout, Window/Middle/Aisle indicators, live Redis lock indicators ("Held"), and Booked states.

---

## 🗺 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login → returns JWT |
| GET  | `/api/auth/me` | Get current user (protected) |

### Trains
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trains` | List all trains (Redis cached) |
| GET | `/api/trains/:trainNo` | Get train + booked seats + Redis held seats |
| POST | `/api/trains` | Add train (admin) |
| PUT | `/api/trains/:trainNo` | Update train (admin) |
| DELETE | `/api/trains/:trainNo` | Delete train (admin) |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Create booking (Protected by Redis TTL Lock) |
| GET | `/api/bookings/my` | My bookings (lean queries) |
| GET | `/api/bookings/:bookingId` | Get booking by ID |
| PATCH | `/api/bookings/:bookingId/pay` | Mark as paid |
| GET | `/api/bookings` | Admin: all bookings (paginated) |

---

## 🚀 Performance Optimizations Implemented

- **Startup Speed**: Enforced IPv4 resolution (`family: 4` and `127.0.0.1`) to eliminate Node.js v18+ IPv6 DNS timeout delays on macOS.
- **Database Indexing**: Compound indexes on `Booking` (`{ train: 1, seatNumbers: 1 }`), `Train` (`{ source: 1, destination: 1 }`), and `User`.
- **Lean Mongoose Queries**: Uses `.lean()` and selective `.select()` projections across all high-throughput routes.
- **Response Compression**: Express `compression` middleware enabled for gzipped/brotli payload transfers.
- **Frontend O(1) Lookups**: Uses React `useMemo` and ES6 `Set` for instant seat status evaluation.

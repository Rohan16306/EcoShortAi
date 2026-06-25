# EcoSort AI — PocketBase Backend

This directory contains the PocketBase backend for EcoSort AI.

## Quick Start

1. **Download PocketBase** from [pocketbase.io/docs](https://pocketbase.io/docs/) for your OS.
2. Place the `pocketbase.exe` binary in this folder.
3. Run:
   ```bash
   ./pocketbase serve
   ```
4. Open the **Admin UI** at `http://127.0.0.1:8090/_/`
5. Create your first admin account.
6. Import the collections from `pb_schema.json` (Settings → Import Collections).

## Why PocketBase?

Your old Express `server.js` used `fs.writeFileSync('db.json', data)` which **blocks the Node.js event loop**.
Node.js is single-threaded — when User 1's file write is happening, Users 2, 3, and 4 are completely frozen.
With just 4 concurrent users, the event loop panics and crashes.

PocketBase solves this because:
- It uses **SQLite with WAL (Write-Ahead Logging)** — hundreds of concurrent writes without locking.
- It's written in **Go**, which uses goroutines (lightweight threads) — no event loop bottleneck.
- **File uploads stream directly to disk** — no Base64 CPU murder.
- Built-in **rate limiting** and **auth** — no hand-rolled JWT or bcrypt.

## Architecture

```
Frontend (Next.js :3000)
    │
    ├── PocketBase SDK (pocketbase npm package)
    │       │
    │       ▼
    └── PocketBase Server (:8090)
            │
            ├── REST API (auto-generated from collections)
            ├── Realtime (WebSocket subscriptions)
            ├── Auth (email/password, OAuth2)
            ├── File Storage (streaming, no Base64)
            └── SQLite Database (WAL mode, concurrent-safe)
```

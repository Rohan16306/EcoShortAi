# EcoSort Backend

## Run

1. Install dependencies:

```bash
npm.cmd install
```

2. Start server:

```bash
npm.cmd start
```

3. Open app:

- http://localhost:3002

## API endpoints

- `GET /api/health`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)
- `GET /api/data/me` (Bearer token)
- `PUT /api/data/me` (Bearer token)
- `GET /api/stats/global`
- `GET /api/leaderboard?limit=10`
- `GET /api/content/featured`
- `GET /api/community/posts`
- `POST /api/community/posts`
- `GET /community/posts` (alias)
- `POST /community/posts` (alias)
- `POST /api/contact`

## Notes

- Backend storage file: `backend/data/db.json`
- Frontend (`js/app.js`) is now connected to this backend for auth + user data sync.
- Guest mode still works locally in browser storage.


# EcoSort (Ecowaste) Product Requirements Document

## 1. Overview
EcoSort is an application consisting of a frontend interface and a backend service to track eco-friendly waste management, display stats, leaderboard, and provide a community platform for users. 

## 2. Architecture
- **Frontend**: HTML, CSS, JavaScript (`index.html`, `community.html`, `gallery-contact.html`, `goals-mission.html`, `impact.html`, `leaderboard.html`)
- **Backend**: Node.js/Express (`server.js`) connected to frontend (`js/app.js`) for authentication and user data sync. Backend storage uses a local JSON file (`backend/data/db.json`).
- **Features**: Authentication (Signup, Login, Bearer Token), User Data, Global Stats, Leaderboard, Featured Content, Community Posts, Contact.

## 3. API Endpoints
- `GET /api/health` - Check health status
- `POST /api/auth/signup` - User signup
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile (Requires Bearer token)
- `GET /api/data/me` - Get user data (Requires Bearer token)
- `PUT /api/data/me` - Update user data (Requires Bearer token)
- `GET /api/stats/global` - Get global stats
- `GET /api/leaderboard?limit=10` - Get leaderboard
- `GET /api/content/featured` - Get featured content
- `GET /api/community/posts` - Get community posts
- `POST /api/community/posts` - Create community post
- `POST /api/contact` - Submit contact form

## 4. Frontend Routes & Pages
- `/` or `index.html`: Main landing page
- `/community`: Community discussion and posts
- `/gallery-contact`: Gallery and contact form
- `/goals-mission`: Goals and mission statement
- `/impact`: User and global impact statistics
- `/leaderboard`: High scores and top contributors

## 5. Notes
Guest mode works locally via browser storage, falling back from backend connection.

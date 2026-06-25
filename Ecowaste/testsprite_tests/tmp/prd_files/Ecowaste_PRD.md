# EcoSort (Ecowaste) Product Requirements Document

## 1. Product Overview
EcoSort is an eco-waste management platform containing both a frontend client and a backend API. The application lets visitors explore the organization's mission, view impact stats and global leaderboard content, browse community pages, and submit contact information. It connects to a backend service for user authentication, global data tracking, and dynamic community content.

## 2. Core Goals
- Allow users to explore the EcoSort homepage and navigate between site sections.
- Display the organization’s goals, mission, global impact, and leaderboard pages.
- Provide a community section for users to browse and post content.
- Facilitate user authentication (Signup, Login) and profile data management via backend APIs.
- Allow users to submit contact forms.

## 3. Frontend Features (Client)
The frontend is built using standard HTML, CSS, and JavaScript.

**Site Navigation & Routes**:
- **`/` (index.html)**: Main landing page.
- **`/goals-mission`**: Displays the organization's goals and mission.
- **`/impact`**: Shows eco-impact statistics for the platform.
- **`/leaderboard`**: Displays top contributors and score rankings.
- **`/community`**: Allows users to read and create community posts.
- **`/gallery-contact`**: Contains a gallery of images and a contact submission form.

**Interactions**:
- Visitors can view static pages for mission and goals.
- Users can log in or sign up, switching from guest mode to authenticated mode.
- Users can view community posts fetched from the backend.
- Users can submit new community posts.

## 4. Backend Services (API)
The backend is powered by Node.js/Express (`server.js`) and stores data in a local JSON database (`backend/data/db.json`).

**Authentication & User Profiles**:
- `POST /api/auth/signup` - User registration.
- `POST /api/auth/login` - User authentication (issues Bearer Token).
- `GET /api/auth/me` - Retrieve current user profile (Requires token).
- `GET /api/data/me` - Retrieve user-specific data (Requires token).
- `PUT /api/data/me` - Update user-specific data (Requires token).

**Public/Community APIs**:
- `GET /api/stats/global` - Retrieve global impact stats.
- `GET /api/leaderboard?limit=10` - Fetch the top 10 leaderboard users.
- `GET /api/content/featured` - Retrieve featured gallery content.
- `GET /api/community/posts` - Fetch list of community discussions.
- `POST /api/community/posts` - Submit a new community post.
- `POST /api/contact` - Submit a contact message.
- `GET /api/health` - Server health check.

## 5. Technical Requirements & Limitations
- **Guest Mode Fallback**: If backend APIs are unreachable or the user is not logged in, the frontend should still gracefully fall back to local browser storage for guest mode.
- **Authentication**: JWT/Bearer Token must be included in the headers for all protected endpoints (`/api/auth/me`, `/api/data/me`).
- **Data Persistence**: Data is persisted synchronously to a local JSON file (`db.json`); concurrent requests should be handled carefully to avoid data corruption.

## 6. Testing Strategy
- **Frontend Validation**: Ensure that UI navigation flows correctly and that forms (Login, Signup, Contact, Post) execute their relevant validations before calling the backend.
- **API Tests**: Verify that the authentication endpoints issue correct tokens and reject unauthorized access. Test community and leaderboard APIs for correct data retrieval and insertion.
- **Integration Tests**: Verify that the `app.js` file correctly fetches data from `server.js` and updates the DOM dynamically.

> *Note: Initial TestSprite configuration and test plans have been generated for the project.*

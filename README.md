# Hotel Booking Capstone Project

Production-oriented hotel booking platform inspired by Airbnb/OYO, built with a React frontend and a Node.js/Express backend. The project now covers the core capstone requirements across product features, backend APIs, testing, Docker, CI, and bonus capabilities like live availability, reviews, Google Maps, and AI-style recommendations.

## Project Structure

```text
hotel-booking-app/
├── frontend/        React + Vite application
├── backend/         Node.js + Express API
├── tests/           Test index and guidance
├── e2e/             Playwright UI tests
├── load-tests/      k6 performance tests
├── docker-compose.yml
├── docker-compose.prod.yml
└── README.md
```

## Implemented Scope

### Frontend
- Authentication: local signup/login, JWT session persistence, forgot/reset password, Google OAuth continuation flow
- Home page: navbar, hero, featured hotels, destination search, popular destinations, personalized recommendations
- Hotel listing: filters, sorting, pagination, search, responsive cards
- Hotel details: gallery, amenities, policies, reviews, map section, real-time room availability badges
- Booking page: date selection, guest selection, price calculation, Razorpay checkout handoff, booking confirmation
- User dashboard: profile summary, bookings view, cancellation flow, wishlist integration
- Admin UI: dashboards for hotels, users, bookings, and reviews

### Backend
- Auth APIs: register, login, logout, profile, password change, Google OAuth callback flow
- Hotel APIs: CRUD, featured hotels, listing filters, recommendations, availability
- Booking APIs: create, view, cancel, admin listing
- Payment integration: Razorpay order creation, verification, webhook handling, refunds
- Reviews and ratings APIs
- Role-based authorization for user/admin flows
- Error handling, validation, rate limiting, JWT auth, bcrypt password hashing

### Testing
- Backend unit tests with Jest and mocks
- Backend API/integration tests with Supertest + Jest
- UI tests with Playwright, including a capstone coverage spec
- Security tests for common OWASP-style protections
- Load tests with k6

### DevOps
- Dockerfiles for frontend and backend
- Docker Compose for local and production-like setups
- GitHub Actions CI pipeline for lint, build, unit, integration, security, and UI tests

### Bonus Features
- Real-time availability updates with Socket.IO
- Reviews and ratings
- Google Maps support on hotel details
- Recommendation feed on the home page

## Tech Stack

- Frontend: React, Redux Toolkit, React Router, Vite, Socket.IO client
- Backend: Node.js, Express, Mongoose, Sequelize, JWT, Nodemailer, Razorpay, Socket.IO
- Databases: MongoDB and MySQL
- Testing: Jest, Supertest, Playwright, k6
- DevOps: Docker, Docker Compose, GitHub Actions

## Environment Setup

### Backend `.env`

Create `backend/.env` based on `backend/.env.example`.
For Render production setup, use `backend/.env.render.example` as the baseline.

Required local essentials:

```env
NODE_ENV=development
PORT=5000
TRUST_PROXY=false
CLIENT_URL=http://localhost:5173
CLIENT_URLS=
ALLOW_VERCEL_PREVIEWS=false
ALLOW_LOCALHOST_ORIGINS=true
COOKIE_SAMESITE=lax
COOKIE_SECURE=false

MONGODB_URI=mongodb://127.0.0.1:27018/hotel-booking

# For managed MySQL you can set MYSQL_URI instead of host/port/user/password
MYSQL_URI=
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=Sigmora_db
MYSQL_SSL=false
MYSQL_SSL_REJECT_UNAUTHORIZED=false
MYSQL_SSL_CA=
SQL_SCHEMA_SYNC=true
SQL_SCHEMA_ALTER=false

JWT_ACCESS_SECRET=replace_with_secure_access_secret
JWT_REFRESH_SECRET=replace_with_secure_refresh_secret

RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=optional_for_localhost_only_dev

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@hotelbooking.com

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback
```

### Frontend `.env`

Create `frontend/.env` based on `frontend/.env.example`.
For Vercel production env vars, use `frontend/.env.vercel.example`.

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
VITE_GOOGLE_MAPS_KEY=your_google_maps_embed_api_key
```

## Local Run

### 1. Start databases

MongoDB:

```bash
mkdir -p /tmp/sigmora-mongo
mongod --dbpath /tmp/sigmora-mongo --port 27018 --bind_ip 127.0.0.1
```

MySQL:

```bash
mysql.server start
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS Sigmora_db;"
```

### 2. Seed MongoDB demo data

```bash
cd backend
npm install
npm run seed:mongo
```

`seed:mongo` rebuilds the Mongo demo dataset. If you want to preserve the current Mongo data and only populate MySQL, skip this step and run the SQL sync commands below.

### 3. Sync SQL schema and mirror current data into MySQL

```bash
cd backend
npm run db:sync:sql
npm run seed:sql
```

### 4. Start backend

```bash
cd backend
npm install
npm run dev:hybrid
```

### 5. Start frontend

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

App URLs:

- Frontend: `http://127.0.0.1:5173`
- Backend health: `http://localhost:5000/api/health`
- API base: `http://localhost:5000/api/v1`

Separate database commands:

- MongoDB seed only: `cd backend && npm run seed:mongo`
- SQL schema sync only: `cd backend && npm run db:sync:sql`
- SQL mirror seed only: `cd backend && npm run seed:sql` (non-destructive, upserts current Mongo data into MySQL)
- Hybrid backend run: `cd backend && npm run dev:hybrid`

## Testing Commands

### Backend

```bash
cd backend
npm run test:unit
npm run test:integration
npm run test:security
```

### Frontend Build

```bash
cd frontend
npm run build
```

### UI Tests

```bash
cd e2e
npm install
npx playwright install
npm run test:capstone
```

### Load Tests

```bash
k6 run load-tests/k6-config.js
```

## Docker

### Local full-stack compose

Create a root-level `.env` for Docker overrides if you want custom host ports, or use the defaults.

```env
BACKEND_HOST_PORT=5000
FRONTEND_HOST_PORT=80
MONGODB_HOST_PORT=27017
MYSQL_HOST_PORT=3306
REDIS_HOST_PORT=6379
CLIENT_URL=http://localhost
VITE_API_URL=http://localhost/api/v1
```

Build and start the full stack:

```bash
docker compose up --build -d
docker compose ps
```

View logs:

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql
docker compose logs -f mongodb
docker compose logs -f redis
```

If you want to seed demo data inside Docker:

```bash
docker compose exec backend npm run seed
```

If you change `FRONTEND_HOST_PORT`, also update `CLIENT_URL` and `VITE_API_URL` in the root `.env` so the browser app keeps calling the right origin.

Production-like compose:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

### Docker image deployment with managed databases

This repo now supports a cleaner image-based deployment path for managed services like MongoDB Atlas and Aiven MySQL.

1. Copy the template and fill it with your real values:

```bash
cp .env.docker.example .env.docker
```

2. Build the production images locally:

```bash
docker build --target production -t ghcr.io/<your-github-user>/sigmora-backend:latest ./backend
docker build --target production -t ghcr.io/<your-github-user>/sigmora-frontend:latest ./frontend
```

3. Push them to a registry:

```bash
docker login ghcr.io
docker push ghcr.io/<your-github-user>/sigmora-backend:latest
docker push ghcr.io/<your-github-user>/sigmora-frontend:latest
```

4. Start the app containers against Atlas/Aiven using the prebuilt images:

```bash
docker compose --env-file .env.docker -f docker-compose.managed.yml up -d
docker compose --env-file .env.docker -f docker-compose.managed.yml ps
```

5. View logs if needed:

```bash
docker compose --env-file .env.docker -f docker-compose.managed.yml logs -f backend
docker compose --env-file .env.docker -f docker-compose.managed.yml logs -f frontend
docker compose --env-file .env.docker -f docker-compose.managed.yml logs -f redis
```

6. Optional demo seed using the backend image:

```bash
docker compose --env-file .env.docker -f docker-compose.managed.yml --profile demo-data run --rm seed
```

7. Stop the managed deployment:

```bash
docker compose --env-file .env.docker -f docker-compose.managed.yml down
```

Notes:
- The frontend Docker image now reads `VITE_API_URL`, `VITE_RAZORPAY_KEY_ID`, and `VITE_GOOGLE_MAPS_KEY` at container startup, so the same image can be reused across environments.
- The managed compose file intentionally skips MongoDB and MySQL containers because it is meant for Atlas/Aiven-style hosted databases.
- GitHub Actions now publishes backend and frontend images to `ghcr.io/<repo-owner>/sigmora-backend` and `ghcr.io/<repo-owner>/sigmora-frontend` on pushes to `main`.

## Recommended Production Deployment (Aiven + MongoDB + Render + Vercel)

This repository is now prepared for the exact setup below:

- MongoDB: MongoDB Atlas (or any managed MongoDB URI)
- MySQL: Aiven MySQL with SSL
- Backend: Render Web Service (`render.yaml` included)
- Frontend: Vercel (`frontend/vercel.json` included for SPA rewrites)

### 1. Provision managed databases

MongoDB:
- Create a MongoDB Atlas cluster.
- Create a database user and IP/network rule for Render egress.
- Copy a connection string into `MONGODB_URI`.

Aiven MySQL:
- Create an Aiven MySQL service and database (`Sigmora_db` or your preferred DB).
- Copy host, port, username, password.
- Download the Aiven CA certificate.
- Use either:
  - `MYSQL_URI=mysql://...` (recommended), or
  - `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
- Enable SSL:
  - `MYSQL_SSL=true`
  - `MYSQL_SSL_REJECT_UNAUTHORIZED=true`
  - `MYSQL_SSL_CA=<certificate contents>` (or `MYSQL_SSL_CA_BASE64`, or `MYSQL_SSL_CA_PATH`)

### 2. Deploy backend to Render

Option A (recommended): Blueprint deploy from `render.yaml`.
- In Render, create a new Blueprint and point it to this repo.
- Confirm `rootDir=backend`, `buildCommand=npm ci`, `startCommand=npm start`.
- `preDeployCommand` runs `SQL_SCHEMA_SYNC=true npm run db:sync:sql`.

Important backend env vars on Render:
- `NODE_ENV=production`
- `TRUST_PROXY=true`
- `SQL_SCHEMA_SYNC=false` (runtime; pre-deploy handles sync)
- `CLIENT_URL=https://<your-vercel-production-domain>`
- `CLIENT_URLS=https://<your-vercel-production-domain>,https://<your-custom-domain>`
- `ALLOW_VERCEL_PREVIEWS=true` (optional but useful)
- `ALLOW_LOCALHOST_ORIGINS=false`
- `COOKIE_SAMESITE=none`
- `COOKIE_SECURE=true`
- `MONGODB_URI=<atlas-uri>`
- `MYSQL_*` values from Aiven
- JWT, Razorpay, Cloudinary, SMTP, Google OAuth credentials

After deploy:
- Health check should respond at `https://<render-service>.onrender.com/api/health`.
- Set `GOOGLE_CALLBACK_URL=https://<render-service>.onrender.com/api/v1/auth/google/callback`.

### 3. Deploy frontend to Vercel

- Create a Vercel project with `frontend` as the root directory.
- Build command: `npm run build` (auto-detected by Vercel for Vite).
- Output directory: `dist` (auto-detected by Vercel for Vite).
- `frontend/vercel.json` already includes SPA rewrites.

Set frontend env vars in Vercel:

```env
VITE_API_URL=https://<render-service>.onrender.com/api/v1
VITE_RAZORPAY_KEY_ID=<your_razorpay_key_id>
VITE_GOOGLE_MAPS_KEY=<your_google_maps_key>
```

### 4. Final cross-service checks

- From browser devtools, verify API calls go to Render URL and return 2xx/4xx (not CORS blocks).
- Login once, then refresh page and verify session refresh works (cookie-based refresh token).
- Verify Google login flow redirects:
  - Frontend: `/auth/google/callback`
  - Backend callback: `/api/v1/auth/google/callback`
- Test one booking flow end-to-end with live credentials.

## Verification Snapshot

Most recent local verification in this workspace:

- Frontend production build passes
- Backend unit tests pass
- Backend integration tests pass
- Backend security tests pass
- Playwright capstone UI flow passes in Chromium

Some live features still depend on your own runtime services and third-party credentials:

- MongoDB and MySQL must be running locally
- Razorpay keys are required for live checkout
- Google OAuth credentials are required for real Google sign-in
- SMTP credentials are required for real email delivery
- Google Maps key is required for embedded map rendering

## Deliverables

- GitHub-ready repository structure
- Setup guide in this README
- Automated tests across backend, UI, security, and load testing
- Docker deployment assets

Live deployment and demo video remain deployment/publishing tasks outside this local codebase.

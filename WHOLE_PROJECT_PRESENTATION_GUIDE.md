# Sigmora Hotel Booking Platform

## Whole Project Presentation Guide, Repository Map, and Team Explanation Document

This document is a refreshed, project-root version of the presentation guide for the current Sigmora codebase.

It is written to help you:

- understand the project end to end
- explain the project clearly in viva or presentation
- map business features to actual code
- present the architecture, workflows, testing, and deployment story
- divide the explanation naturally among 3 people

This guide is based on the current implementation in this repository.

Important current-state note:

- The platform now works with only **2 effective roles**: `user` and `admin`
- Some older files still contain words like `owner` in their file names for historical reasons, but those modules are now used as admin-side features only
- Kubernetes is not part of the current repo scope
- The project currently supports **MongoDB + MySQL + optional Redis + Docker**

---

## 1. Project Identity

### Project Name

`Sigmora - Hotel Booking Platform`

### Project Type

Full-stack hotel booking web application inspired by Airbnb and OYO style flows.

### One-Line Summary

Sigmora is a production-oriented hotel booking platform where users can discover hotels, view rooms, check availability, book stays, pay online, cancel bookings, receive refunds, chat with the admin team, and where admins can manage the full business from a unified control panel.

### Problem Statement

Most hotel-booking systems split the experience across multiple disconnected systems:

- search and discovery
- inventory checking
- booking and payment
- cancellation and refund handling
- reviews
- customer support
- admin control

Sigmora solves this by combining all of them into one integrated platform with a strong full-stack architecture and deployment-ready setup.

### Main Goal of the Project

To build a capstone-level, near-production web platform that demonstrates:

- polished frontend experience
- scalable backend APIs
- hybrid database usage
- secure authentication and authorization
- payment and refund workflows
- testing coverage across multiple levels
- containerized local deployment
- real-time updates and operational features

---

## 2. Current Implemented Roles

The project now uses **two effective roles only**.

### 1. User

A normal customer who can:

- register and log in
- verify email with OTP
- use forgot-password OTP flow
- browse hotels
- search, filter, and sort hotels
- view hotel details and rooms
- ask the admin team questions about a hotel
- create bookings
- pay through Razorpay
- cancel eligible bookings
- see refund initiation and completion state
- update profile
- use wishlist
- view booking confirmation and receipt
- leave reviews

### 2. Admin

The admin can:

- access admin dashboard
- update admin profile
- manage users
- manage hotels
- upload hotel images
- add rooms
- manage booking statuses
- complete refunds
- moderate reviews
- manage offers and coupons
- access community and reports
- handle support conversations
- receive notifications and email alerts for guest queries

### Role Simplification Note

Although some modules still use names like `OwnerCommunityPage`, `OwnerReportsPage`, `ownerRoutes`, or `ownerController`, those are now treated as **admin-side functionality** in the current product model.

---

## 3. Core Business Capabilities

### Authentication and Identity

- local signup
- local login
- logout
- JWT-based session handling
- refresh token cookie flow
- email OTP verification for new accounts
- forgot password OTP verification
- reset password flow
- Google OAuth callback flow
- profile update for user and admin

### Hotel Discovery

- home page hero and featured areas
- popular destinations
- recommendations
- hotel listing page
- search by hotel, city, state, type, and description
- filters for price, rating, and type
- pagination and sorting
- search suggestion support
- debounced discovery flow

### Hotel Details Experience

- hotel images
- room list
- amenities
- policies
- Google Maps section
- reviews and ratings
- top 3 review display
- see-all review expansion
- support entry point from the selected hotel context

### Booking and Payment

- date selection
- guest count
- availability check
- dynamic pricing
- coupon support
- room hold before payment
- Razorpay order creation
- Razorpay verification
- booking confirmation
- downloadable PDF receipt

### Booking Lifecycle and Refunds

- pending booking state
- inventory hold expiry
- confirmed booking state
- cancellation flow
- refund policy calculation
- refund initiation state
- refund completion state
- refund visibility on booking details

### Admin Operations

- dashboard KPIs
- user management
- hotel management
- room creation and editing
- image upload for hotels
- booking management
- refund processing
- review visibility/moderation
- offers and coupon management
- admin support inbox
- community and reporting modules

### Communication and Notifications

- transactional email flows
- support chat
- real-time notifications
- admin notification badge in navbar
- email alerts for guest support queries

### Quality and Operational Features

- rate limiting
- validation
- JWT security
- bcrypt password hashing
- Redis locking for room booking concurrency
- Socket.IO updates
- cron-based cleanup
- Docker setup
- GitHub Actions CI
- unit, integration, UI, security, and load tests

---

## 4. Actual Tech Stack

### Frontend

- React 18
- Vite
- React Router
- Redux Toolkit
- Axios
- React Hot Toast
- Socket.IO client
- CSS Modules + global CSS

### Backend

- Node.js
- Express
- Mongoose
- Sequelize
- JWT
- bcryptjs
- Nodemailer
- Razorpay
- Redis client
- Socket.IO
- express-validator
- Helmet, HPP, mongo-sanitize, xss-clean

### Databases

- MongoDB as the primary application database
- MySQL as relational mirror/reporting layer
- Redis as booking-lock infrastructure

### Testing

- Jest
- Supertest
- Playwright
- k6
- conceptual pytest examples

### DevOps

- Docker
- Docker Compose
- GitHub Actions

---

## 5. High-Level Architecture

## Frontend Layer

The frontend is responsible for:

- rendering public and protected pages
- managing route-based flows
- storing auth state
- talking to backend APIs
- reacting to real-time socket events
- presenting booking, support, and admin workflows

Main frontend folders:

- `frontend/src/pages/`
- `frontend/src/components/`
- `frontend/src/redux/`
- `frontend/src/api/`
- `frontend/src/context/`
- `frontend/src/utils/`

## Backend Layer

The backend is responsible for:

- authentication
- validation
- hotel and room management
- availability and booking logic
- payment and refund processing
- support and notifications
- email flows
- SQL mirroring
- cron jobs
- socket event broadcasting

Main backend folders:

- `backend/src/controllers/`
- `backend/src/routes/`
- `backend/src/models/`
- `backend/src/services/`
- `backend/src/middleware/`
- `backend/src/utils/`
- `backend/tests/`

## Data Layer

### MongoDB

MongoDB is the primary operational store for:

- users
- hotels
- rooms
- bookings
- reviews
- coupons
- support conversations
- notifications
- newsletter subscribers
- community threads

### MySQL

MySQL is used as a relational mirror and reporting layer through Sequelize for:

- users
- hotels
- rooms
- bookings
- reviews
- coupons
- payments
- notifications

The SQL side helps with:

- reporting
- mirrored analytics
- structured relational inspection in tools like MySQL Workbench

### Redis

Redis is used for:

- distributed locking
- reducing race conditions during room booking
- safer room-hold coordination under concurrent access

Redis is optional for local single-instance development, but is part of the supported architecture.

## Real-Time Layer

Socket.IO is used for:

- notification delivery
- admin notification refresh
- support chat refresh
- hotel catalog updates
- hotel detail refresh
- availability change events

## Deployment Layer

The current repo supports:

- local native development run
- hybrid Mongo + MySQL local run
- Docker Compose full-stack run
- GitHub Actions CI pipeline

---

## 6. Current Project Structure

```text
hotel-booking-app/
├── backend/                  Express API, models, services, tests
├── frontend/                 React + Vite application
├── e2e/                      Playwright end-to-end tests
├── load-tests/               k6 performance tests
├── tests/                    shared testing guide + conceptual pytest examples
├── .github/workflows/        CI workflows
├── docker-compose.yml        local/full-stack Docker setup
├── docker-compose.prod.yml   production-like compose overlay
├── README.md                 setup and runtime guide
└── WHOLE_PROJECT_PRESENTATION_GUIDE.md
```

### Important Note About Removed Scope

This current structure does **not** include Kubernetes in the active project scope.

---

## 7. Repository Map by Functional Area

### Frontend Pages

- `frontend/src/pages/HomePage.jsx`
  Home hero, featured hotels, destinations, recommendations, newsletter, public discovery

- `frontend/src/pages/HotelListingPage.jsx`
  Search, filters, sorting, pagination, hotel results

- `frontend/src/pages/HotelDetailsPage.jsx`
  Hotel details, gallery, reviews, rooms, map, hotel-linked support entry

- `frontend/src/pages/BookingPage.jsx`
  Booking creation flow, coupon application, guest details, pricing summary

- `frontend/src/pages/BookingConfirmationPage.jsx`
  Final booking details, payment state, refund state, receipt download

- `frontend/src/pages/UserDashboardPage.jsx`
  Profile update, booking list, cancellation entry, refund tracking

- `frontend/src/pages/AdminDashboardPage.jsx`
  Admin KPIs and admin profile update

- `frontend/src/pages/AdminHotelsPage.jsx`
  Hotel creation, edit, image upload, room creation, hotel listing management

- `frontend/src/pages/AdminUsersPage.jsx`
  User listing, role control, activation/deactivation, admin-created accounts

- `frontend/src/pages/AdminBookingsPage.jsx`
  Booking list, status change, refund completion dialog

- `frontend/src/pages/AdminReviewsPage.jsx`
  Review visibility and management

- `frontend/src/pages/OffersManagementPage.jsx`
  Offer and coupon management

- `frontend/src/pages/SupportCenterPage.jsx`
  User-admin conversation area and AI assistant entry

- `frontend/src/pages/OwnerCommunityPage.jsx`
  Legacy-named file now used for admin community threads

- `frontend/src/pages/OwnerReportsPage.jsx`
  Legacy-named file now used for admin report views

### Frontend State and API Layer

- `frontend/src/redux/slices/authSlice.js`
- `frontend/src/redux/slices/bookingSlice.js`
- `frontend/src/redux/slices/adminSlice.js`
- `frontend/src/api/authApi.js`
- `frontend/src/api/hotelApi.js`
- `frontend/src/api/bookingApi.js`
- `frontend/src/api/paymentApi.js`
- `frontend/src/api/supportApi.js`
- `frontend/src/api/adminApi.js`
- `frontend/src/api/userApi.js`

### Backend Controllers

- `backend/src/controllers/authController.js`
- `backend/src/controllers/hotelController.js`
- `backend/src/controllers/bookingController.js`
- `backend/src/controllers/paymentController.js`
- `backend/src/controllers/reviewController.js`
- `backend/src/controllers/adminController.js`
- `backend/src/controllers/supportController.js`
- `backend/src/controllers/notificationController.js`
- `backend/src/controllers/ownerController.js`

### Backend Services

- `backend/src/services/bookingLifecycleService.js`
- `backend/src/services/pricingService.js`
- `backend/src/services/refundPolicyService.js`
- `backend/src/services/paymentService.js`
- `backend/src/services/emailService.js`
- `backend/src/services/notificationService.js`
- `backend/src/services/sqlMirrorService.js`
- `backend/src/services/distributedLockService.js`
- `backend/src/services/assistantService.js`

### Backend Models

Primary Mongo models:

- `backend/src/models/User.js`
- `backend/src/models/Hotel.js`
- `backend/src/models/Room.js`
- `backend/src/models/Booking.js`
- `backend/src/models/Review.js`
- `backend/src/models/Coupon.js`
- `backend/src/models/SupportConversation.js`
- `backend/src/models/Notification.js`
- `backend/src/models/NewsletterSubscriber.js`
- `backend/src/models/OwnerCommunityThread.js`

SQL mirror models:

- `backend/src/models/sql/`

---

## 8. Key End-to-End Product Flows

## Flow A: User Registration and Verification

1. User opens the register page
2. User submits name, email, phone, and password
3. Backend validates request
4. User account is created in Mongo and mirrored to SQL
5. OTP is generated and emailed
6. User verifies email through OTP flow
7. User becomes authenticated and is redirected into the app

## Flow B: User Login

1. User enters email and password
2. Backend validates credentials
3. If user is unverified, OTP flow is triggered again
4. If verified, JWT access token and refresh cookie flow are established
5. Frontend stores user state and redirects based on role

## Flow C: Hotel Discovery

1. User lands on home page
2. User explores featured hotels, destinations, offers, and recommendations
3. User navigates to listing page
4. Search, filters, and pagination fetch matching hotels
5. User opens a hotel detail page

## Flow D: Hotel Detail to Support

1. User opens hotel detail page
2. User clicks `Ask Admin Team`
3. The support page opens with hotel context in the URL
4. Starting a conversation creates a hotel-linked support thread
5. The new thread becomes visible for both user and admin
6. Admin receives notification and email alert

## Flow E: Booking and Payment

1. User selects room, dates, and guests
2. Backend checks availability
3. Dynamic pricing and coupon logic are applied
4. Pending booking is created
5. Room hold is placed
6. Frontend requests Razorpay order
7. Payment is completed
8. Backend verifies payment
9. Booking becomes confirmed
10. Receipt and confirmation page become available

## Flow F: Cancellation and Refund

1. User opens dashboard and selects cancel
2. Confirmation dialog appears
3. Booking is cancelled
4. Refund policy is calculated
5. Refund status becomes `initiated` where applicable
6. Admin can complete the refund from booking management
7. Final refund state becomes visible on booking details

## Flow G: Admin Hotel Management

1. Admin opens Hotels from top navbar
2. Existing hotels are shown first
3. Admin clicks `Create New Hotel` or `Edit`
4. Form opens for create or update
5. Hotel data is validated
6. Hotel is created or updated
7. Hotel images are uploaded separately through the same admin flow
8. Updated hotel reflects on user-facing pages

## Flow H: Admin Support and Notifications

1. User sends a hotel-specific question
2. Notification is created for admins
3. Email is sent to admin mailboxes
4. Admin notification badge updates in navbar
5. Admin opens support inbox and replies
6. User sees the updated thread and receives reply communication

---

## 9. Important Business Logic Highlights

### Dual Database Strategy

MongoDB is the operational source of truth.
MySQL mirrors structured business data for reporting and inspection.

### Booking Concurrency

Redis-backed distributed locking is designed to reduce race conditions during room booking.

### Dynamic Pricing

Pricing can increase based on weekend and holiday logic and then combine with coupon discounts.

### Refund Lifecycle

Refund handling is not just a one-step boolean. The system now shows:

- cancellation
- refund amount
- refund initiation
- refund completion

### Image Handling

Hotel images uploaded from the admin form go through the dedicated image upload path and then appear on user-facing hotel views.

### Two-Role Simplification

Even though a few files still have legacy names, the business model is now simplified around:

- users who consume the platform
- admins who operate the full business

This actually makes presentation clearer because access control is easier to explain.

---

## 10. Testing Strategy

The repo includes the requested testing coverage in separate layers.

### 1. Functional API Testing

Location:

- `backend/tests/integration/`

Tools:

- Jest
- Supertest

Covers:

- auth APIs
- hotel APIs
- booking APIs
- status codes
- responses
- validation and error handling

### 2. UI Testing

Location:

- `e2e/tests/`

Tool:

- Playwright

Covers:

- login flow
- signup and OTP flow
- hotel search and navigation
- booking journey
- basic form validation

### 3. Backend Unit Testing

Location:

- `backend/tests/unit/`

Tool:

- Jest

Covers:

- services
- controllers
- middleware
- helpers and utilities

### 4. Pytest Conceptual Layer

Location:

- `tests/pytest/`

Purpose:

- conceptual demonstration of fixtures and mocking patterns

### 5. Load Testing

Location:

- `load-tests/`

Tool:

- k6

Covers:

- concurrent traffic
- response time behavior
- failure thresholds

### 6. Security / OWASP-Oriented Testing

Location:

- `backend/tests/security/`

Covers:

- access control
- validation
- JWT handling
- bcrypt usage
- security headers
- injection hardening
- health and secure middleware behavior

---

## 11. Current Run and Seed Commands

## Local Native Run

### MongoDB

```bash
mkdir -p /tmp/sigmora-mongo
mongod --dbpath /tmp/sigmora-mongo --port 27018 --bind_ip 127.0.0.1
```

### MySQL

```bash
mysql.server start
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS Sigmora_db;"
```

### Seed Mongo Primary Data

```bash
cd backend
npm install
npm run seed:mongo
```

### Sync SQL Schema

```bash
cd backend
npm run db:sync:sql
```

### Mirror Mongo Data Into SQL

```bash
cd backend
npm run seed:sql
```

### Run Backend

```bash
cd backend
npm run dev:hybrid
```

### Run Frontend

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

### Main URLs

- Frontend: `http://127.0.0.1:5173`
- Backend health: `http://localhost:5000/api/health`
- API base: `http://localhost:5000/api/v1`

## Docker Run

Build and start:

```bash
docker compose up --build -d
docker compose ps
```

Logs:

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb
docker compose logs -f mysql
docker compose logs -f redis
```

Seed inside Docker:

```bash
docker compose exec backend npm run seed
```

Stop:

```bash
docker compose down
```

---

## 12. Seeded Credentials Useful for Demo

Current seeded accounts include:

### Admin

- `admin@hotelbooking.com / Admin@123`
- `saurabhccs11@gmail.com / Password@123`

### Users

- `user1@test.com` to `user12@test.com / User@123`

These are useful for demo and presentation walkthroughs.

---

## 13. Why This Project Is Strong for Presentation

This project is strong because it shows both **product completeness** and **engineering depth**.

### Product Completeness

It covers the complete journey:

- account creation
- search and discovery
- hotel evaluation
- booking
- payment
- cancellation
- refund
- support
- admin operations

### Engineering Depth

It also shows strong backend and operations thinking:

- hybrid Mongo + SQL architecture
- Redis locking
- real-time notifications
- payment verification
- refund lifecycle
- cron cleanup
- testing layers
- Docker deployment

### Presentation Advantage

The system is easy to demonstrate because it has:

- clear user journey
- clear admin journey
- visible business logic
- real pages and dashboards
- meaningful non-functional coverage

---

## 14. Suggested 3-Person Presentation Split

The cleanest way to present this project is not by "frontend person" versus "backend person".
It is better to split it by complete business stage.

## Person 1: Entry, Trust, and Discovery

This person should explain:

- project problem and solution
- user signup and login
- OTP verification and recovery flows
- homepage experience
- hotel listing
- search and filters
- hotel details
- reviews
- maps
- wishlist

Best files for this person:

- `frontend/src/pages/RegisterPage.jsx`
- `frontend/src/pages/LoginPage.jsx`
- `frontend/src/pages/OtpVerificationPage.jsx`
- `frontend/src/pages/ForgotPasswordPage.jsx`
- `frontend/src/pages/ResetPasswordPage.jsx`
- `frontend/src/pages/HomePage.jsx`
- `frontend/src/pages/HotelListingPage.jsx`
- `frontend/src/pages/HotelDetailsPage.jsx`
- `backend/src/controllers/authController.js`
- `backend/src/controllers/hotelController.js`

## Person 2: Booking, Payment, and User Journey

This person should explain:

- availability checking
- booking page
- pricing logic
- coupon application
- Razorpay payment flow
- booking confirmation page
- cancellation flow
- refund state
- user dashboard
- profile update
- support initiation from a hotel

Best files for this person:

- `frontend/src/pages/BookingPage.jsx`
- `frontend/src/pages/BookingConfirmationPage.jsx`
- `frontend/src/pages/UserDashboardPage.jsx`
- `frontend/src/pages/SupportCenterPage.jsx`
- `backend/src/controllers/bookingController.js`
- `backend/src/controllers/paymentController.js`
- `backend/src/services/pricingService.js`
- `backend/src/services/refundPolicyService.js`
- `backend/src/services/bookingLifecycleService.js`

## Person 3: Admin, Operations, Testing, and Deployment

This person should explain:

- admin dashboard
- user management
- hotel management
- room creation
- image upload
- booking management
- refund completion
- review moderation
- offers
- community
- reports
- notifications
- email alerts
- Mongo/MySQL/Redis architecture
- tests
- Docker and CI

Best files for this person:

- `frontend/src/pages/AdminDashboardPage.jsx`
- `frontend/src/pages/AdminHotelsPage.jsx`
- `frontend/src/pages/AdminUsersPage.jsx`
- `frontend/src/pages/AdminBookingsPage.jsx`
- `frontend/src/pages/AdminReviewsPage.jsx`
- `frontend/src/pages/OffersManagementPage.jsx`
- `frontend/src/pages/OwnerCommunityPage.jsx`
- `frontend/src/pages/OwnerReportsPage.jsx`
- `backend/src/controllers/adminController.js`
- `backend/src/controllers/supportController.js`
- `backend/src/services/notificationService.js`
- `backend/src/services/emailService.js`
- `docker-compose.yml`
- `tests/README.md`

---

## 15. Suggested Live Demo Flow

If you want a clean demonstration, follow this order:

1. Show home page and explain the product
2. Register or log in as user
3. Open hotel listing and filters
4. Open a hotel detail page
5. Show top reviews and support entry point
6. Create a booking
7. Explain payment and confirmation flow
8. Show dashboard and cancellation/refund status
9. Log in as admin
10. Show admin dashboard
11. Show hotel creation and image upload
12. Show users module
13. Show bookings module and refund completion dialog
14. Show support inbox and notification badge
15. Close with Docker/testing/architecture summary

---

## 16. Likely Viva Questions and Good Answers

### Why did you use both MongoDB and MySQL?

MongoDB is the primary operational store because the domain objects are flexible and nested. MySQL is used as a structured mirror/reporting layer for relational inspection and reporting use cases.

### Why is Redis used here?

Redis helps support distributed locking for room booking so that overlapping users do not easily create race conditions during inventory hold and payment flow.

### Why are some files still named owner if the platform has only user and admin roles?

Those files are legacy-named modules from an earlier design, but they are now reused for admin-side functionality. The effective business roles are only user and admin.

### How is payment secured?

Razorpay order creation and signature verification are handled server-side, and refunds are validated by backend rules before processing.

### How do you handle concurrency in booking?

The system uses room holds plus Redis-backed locking and inventory lifecycle control so that a room is temporarily reserved during the payment window.

### How do you handle refunds?

Cancellation first calculates refund eligibility, marks refund initiation in booking state, and then admin-side refund completion updates the final refund status visible to the user.

### How do you ensure quality?

The project includes API tests, unit tests, security tests, Playwright UI tests, and k6 load tests, plus Docker support and CI automation.

---

## 17. Final Summary

Sigmora is no longer just a basic CRUD hotel project.
It is a complete full-stack booking platform with:

- two-role user/admin model
- polished user journey
- admin business control
- payment and refund lifecycle
- hotel-linked support conversations
- notification and email flows
- hybrid database architecture
- Docker deployment
- layered testing strategy

For presentation, this makes it strong because the project is:

- easy to demonstrate visually
- easy to divide among team members
- technically deep enough to justify architecture choices
- close to a real product rather than a classroom-only prototype


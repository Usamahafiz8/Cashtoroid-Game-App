# Cashtoroid — Technical Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Database Schema](#4-database-schema)
5. [Authentication System](#5-authentication-system)
6. [API Reference](#6-api-reference)
7. [Third-Party Integrations](#7-third-party-integrations)
8. [Business Logic](#8-business-logic)
9. [Frontend Pages](#9-frontend-pages)
10. [Environment Variables](#10-environment-variables)
11. [Deployment & Infrastructure](#11-deployment--infrastructure)
12. [Security Model](#12-security-model)

---

## 1. Project Overview

Cashtoroid is a video-based earning platform where users submit videos from YouTube, TikTok, and Instagram. The platform tracks view counts, ranks users on a leaderboard, and distributes prize money to top performers via cashout requests.

**Core Flow:**
1. User registers and submits video URLs
2. Platform fetches and tracks view counts automatically
3. Users are ranked on a leaderboard by view delta (views gained since last reset)
4. Top-ranked users request cashouts
5. Admins approve/reject cashouts and mark users as paid

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 14.2.29 |
| Language | TypeScript | 5.7.2 |
| UI Library | React | 18.3.1 |
| ORM | Prisma | 5.22.0 |
| Database | PostgreSQL (Neon Cloud) | — |
| Auth | NextAuth v5 + JWT | 5.0.0-beta.25 |
| Validation | Zod | 3.23.8 |
| Password Hashing | bcryptjs | 2.4.3 |
| Email | Nodemailer | 7.0.3 |
| File Storage | Cloudinary | 2.10.0 |
| Cron Jobs | node-cron | 3.0.3 |
| API Docs | Swagger UI React | 5.32.5 |

---

## 3. Project Structure

```
Cashtoroid/
├── app/
│   ├── api/
│   │   ├── auth/                  # Login, logout, OTP, password reset
│   │   ├── register/              # User registration
│   │   ├── videos/                # Video submission & user video list
│   │   ├── leaderboard/           # Rankings, timer, personal rank
│   │   ├── users/                 # Profile, stats, avatar
│   │   ├── cashout/               # Request cashout, history
│   │   ├── tiktok/                # TikTok OAuth flow + video browser
│   │   ├── challenge/             # Current challenge (public)
│   │   ├── admin/                 # All admin-only endpoints
│   │   │   ├── users/
│   │   │   ├── videos/
│   │   │   ├── transactions/
│   │   │   ├── leaderboard/
│   │   │   ├── prize-pool/
│   │   │   ├── challenge/
│   │   │   ├── payouts/
│   │   │   └── mark-paid/
│   │   ├── cron/                  # Scheduled view update endpoint
│   │   └── docs/                  # OpenAPI spec
│   ├── (auth)/                    # Login, register, reset-password pages
│   ├── dashboard/                 # User-facing dashboard screens
│   ├── admin/                     # Admin panel screens
│   └── api-docs/                  # Swagger UI page
├── lib/
│   ├── auth.ts                    # NextAuth configuration
│   ├── auth.config.ts             # Edge-safe auth config
│   ├── prisma.ts                  # Prisma client singleton
│   ├── youtube.ts                 # YouTube Data API v3 integration
│   ├── tiktok.ts                  # TikTok OAuth flow & API calls
│   ├── scraper.ts                 # Instagram/TikTok fallback scraping
│   ├── cloudinary.ts              # Avatar upload to Cloudinary
│   ├── email.ts                   # Email templates (OTP, notifications)
│   ├── leaderboard.ts             # Ranking calculation logic
│   └── validators.ts              # Zod schemas for all request bodies
├── prisma/
│   ├── schema.prisma              # Database models
│   └── seed.ts                    # Initial seed (admin account)
├── types/
│   └── next-auth.d.ts             # Extended NextAuth session types
├── middleware.ts                   # Auth + CORS enforcement
├── next.config.mjs                # Next.js config
└── vercel.json                    # Cron job schedule for Vercel
```

---

## 4. Database Schema

### User
```
id            String   (CUID, primary key)
username      String   (unique)
email         String   (unique)
password      String   (bcrypt hashed)
role          String   ("user" | "admin")
avatarUrl     String?
paypalEmail   String?
payoutInfo    String?
isPaid        Boolean  (default: false)
paidAt        DateTime?
createdAt     DateTime
updatedAt     DateTime
```
Relations: `videos[]`, `transactions[]`, `tiktokAccounts[]`

---

### Video
```
id            String   (CUID, primary key)
url           String   (unique)
platform      String   ("youtube" | "tiktok" | "instagram")
currentViews  Int      (latest fetched count)
baseViews     Int      (snapshot at last leaderboard reset)
status        String   ("pending" | "approved" | "rejected")
isFlagged     Boolean
flagReason    String?
userId        String   (FK → User)
createdAt     DateTime
updatedAt     DateTime
lastViewedAt  DateTime?
```

---

### TikTokAccount
```
id            String   (CUID)
userId        String   (FK → User)
tiktokUserId  String   (unique)
username      String
displayName   String?
avatarUrl     String?
accessToken   String
refreshToken  String?
tokenExpiresAt DateTime?
createdAt     DateTime
updatedAt     DateTime
```

---

### LeaderboardConfig (Singleton)
```
id            String   ("singleton")
periodDays    Int      (reset period in days)
lastReset     DateTime
nextReset     DateTime
```

---

### PrizePool (Singleton)
```
id            String   ("singleton")
totalPool     Float
currency      String   (default: "USD")
tiers         Json     (array of { rank, percentage, amount })
updatedAt     DateTime
```

---

### Transaction
```
id            String   (CUID)
userId        String   (FK → User)
amount        Float
currency      String   (default: "USD")
status        String   ("pending" | "approved" | "rejected")
paypalEmail   String
notes         String?
reviewedBy    String?
reviewedAt    DateTime?
createdAt     DateTime
updatedAt     DateTime
```

---

### Challenge (Singleton)
```
id            String   ("singleton")
title         String
description   String
startDate     DateTime
endDate       DateTime
prizeInfo     String?
rules         String?
isActive      Boolean
createdAt     DateTime
updatedAt     DateTime
```

---

## 5. Authentication System

### Mechanism

Cashtoroid uses **dual authentication** — both JWT Bearer tokens (for API/mobile clients) and NextAuth session cookies (for the web browser).

### Registration & Login Flow

```
Register
  POST /api/register
  → validate input (Zod)
  → check email/username uniqueness
  → hash password (bcrypt, 10 rounds)
  → create User in DB

Login
  POST /api/auth/login
  → validate credentials
  → compare password (bcryptjs.compare)
  → sign JWT (30-day expiry)
  → return { token, user }
```

### JWT Structure
```json
{
  "id": "clxxxx",
  "email": "user@example.com",
  "username": "johndoe",
  "role": "user"
}
```

### Middleware (middleware.ts)

All API requests pass through Next.js middleware:

- **Public routes** (no auth): `/api/register`, `/api/auth/*`, `/api/leaderboard`, `/api/challenge`, `/api/docs`
- **Authenticated routes**: any other `/api/*` — requires valid JWT Bearer token or NextAuth session
- **Admin-only routes**: `/api/admin/*` — requires `role === "admin"` in the JWT

```
Request → Middleware
  → Bearer token? → verify JWT → attach user to request
  → Session cookie? → validate NextAuth session → attach user
  → No auth on protected route → 401
  → Auth valid but non-admin on /api/admin/* → 403
```

### Password Reset (OTP Flow)

```
POST /api/auth/forgot-password   → generate 6-digit OTP, store with 15-min expiry, email user
POST /api/auth/verify-otp        → validate OTP, return reset token
POST /api/auth/reset-password    → reset password using verified OTP token
POST /api/auth/change-password   → change password with current password verification
```

---

## 6. API Reference

### Base URL
```
https://<your-domain>/api
```

### Authentication Header
```
Authorization: Bearer <jwt_token>
```

---

### Auth Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/register` | None | Create new user account |
| POST | `/api/auth/login` | None | Login and receive JWT |
| POST | `/api/auth/logout` | None | Logout (clears session) |
| POST | `/api/auth/forgot-password` | None | Send OTP reset email |
| POST | `/api/auth/verify-otp` | None | Validate OTP |
| POST | `/api/auth/reset-password` | None | Set new password via OTP |
| POST | `/api/auth/change-password` | User | Change password (requires current password) |

---

### Video Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/videos/submit` | User | Submit a video URL (max 5/day) |
| GET | `/api/videos/my-videos` | User | Get user's videos (auto-refreshes views if stale >1hr) |
| GET | `/api/videos/[id]` | User | Get single video details |

**POST /api/videos/submit — Request Body:**
```json
{
  "url": "https://youtube.com/watch?v=xxxxx",
  "platform": "youtube"
}
```

---

### Leaderboard Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/leaderboard` | None | Top 100 users ranked by view delta |
| GET | `/api/leaderboard/me` | User | Authenticated user's rank & score |
| GET | `/api/leaderboard/timer` | None | Time remaining until next reset |

---

### User Profile Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users/me` | User | Get full profile |
| PUT | `/api/users/me` | User | Update profile (username, email, PayPal) |
| GET | `/api/users/me/stats` | User | View stats & leaderboard rank |
| GET | `/api/users/me/avatar` | User | Get avatar URL |
| POST | `/api/users/me/avatar/upload` | User | Upload avatar (multipart form, → Cloudinary) |

---

### Cashout Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/cashout/request` | User | Submit a cashout request |
| GET | `/api/cashout/history` | User | Get cashout transaction history |

**POST /api/cashout/request — Request Body:**
```json
{
  "amount": 50.00,
  "currency": "USD",
  "paypalEmail": "user@paypal.com",
  "notes": "optional note"
}
```

---

### TikTok Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tiktok/auth/url` | User | Get TikTok OAuth authorization URL |
| GET | `/api/tiktok/auth/callback` | User | Handle OAuth callback & save tokens |
| GET | `/api/tiktok/accounts` | User | List linked TikTok accounts |
| GET | `/api/tiktok/accounts/[id]` | User | Get linked account details |
| GET | `/api/tiktok/accounts/[id]/videos` | User | List videos from TikTok account |
| POST | `/api/tiktok/videos/[videoId]/submit` | User | Submit a TikTok video from linked account |

---

### Challenge Endpoint

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/challenge` | None | Get current active challenge |

---

### Admin — Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/users` | Admin | List all users with stats |
| GET | `/api/admin/users/[id]` | Admin | Get single user details |
| PUT | `/api/admin/users/[id]/role` | Admin | Update user role |

---

### Admin — Videos

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/videos` | Admin | List all videos (filter: status, platform) |
| GET | `/api/admin/videos/[id]` | Admin | Get video details |
| PUT | `/api/admin/videos/[id]` | Admin | Update video record |
| POST | `/api/admin/update-status` | Admin | Approve/reject video (sends email) |
| POST | `/api/admin/manual-views` | Admin | Manually set view count |
| POST | `/api/admin/recalculate` | Admin | Force view refresh + leaderboard recalc |

---

### Admin — Transactions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/transactions` | Admin | List all transactions (filter: status) |
| GET | `/api/admin/transactions/[id]` | Admin | Get transaction details |
| POST | `/api/admin/transactions/[id]/approve` | Admin | Approve cashout request |
| POST | `/api/admin/transactions/[id]/reject` | Admin | Reject cashout request |

---

### Admin — Config

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/leaderboard/config` | Admin | Get leaderboard period & reset config |
| PUT | `/api/admin/leaderboard/config` | Admin | Update leaderboard reset schedule |
| GET | `/api/admin/prize-pool` | Admin | Get prize pool config |
| PUT | `/api/admin/prize-pool` | Admin | Update prize pool & tiers |
| GET | `/api/admin/challenge` | Admin | Get challenge config |
| PUT | `/api/admin/challenge` | Admin | Update challenge |

---

### Admin — Payouts

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/payouts` | Admin | Top users by views with payout status |
| POST | `/api/admin/mark-paid` | Admin | Mark user as paid |

---

### Cron Endpoint

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/cron/update-views` | CRON_SECRET header | Run scheduled view update for all videos |

```bash
# Manual trigger
curl -H "x-cron-secret: <CRON_SECRET>" https://<domain>/api/cron/update-views
```

---

## 7. Third-Party Integrations

### YouTube Data API v3
- **File:** `lib/youtube.ts`
- **Purpose:** Fetch live view count for YouTube videos
- **Method:** Extract video ID from URL → `GET https://www.googleapis.com/youtube/v3/videos?part=statistics&id=<videoId>&key=<YOUTUBE_API_KEY>`
- **Trigger:** On video submission (initial count) + hourly on view access + daily cron

### TikTok OAuth 2.0
- **File:** `lib/tiktok.ts`
- **Scopes:** `user.info.basic`, `video.list`
- **Flow:**
  1. User clicks "Connect TikTok" → `/api/tiktok/auth/url` returns authorization URL
  2. User authenticates on TikTok → redirected to `/api/tiktok/auth/callback`
  3. Callback exchanges code for access + refresh tokens → stored in `TikTokAccount`
  4. User browses videos from linked account → selects to submit
- **Token refresh:** Handled automatically before each API call if token is expired

### Cloudinary
- **File:** `lib/cloudinary.ts`
- **Purpose:** Avatar image hosting with auto-crop
- **Config:** `width: 400, height: 400, crop: "fill", gravity: "face"`
- **Upload method:** Stream-based (no temp file)

### Nodemailer (SMTP)
- **File:** `lib/email.ts`
- **Emails sent:**
  - Password reset OTP (6-digit, 15-min expiry)
  - Video approved/rejected notification
  - Cashout approved/rejected notification
  - Payout confirmation

### Instagram (Limited)
- **File:** `lib/scraper.ts`
- **Method:** HTML meta tag parsing — best-effort only
- **Limitation:** Instagram anti-scraping limits effectiveness; manual admin override recommended

---

## 8. Business Logic

### Leaderboard Scoring

```
User Score = SUM(video.currentViews - video.baseViews) for all APPROVED videos
```

- `baseViews` is snapshotted at each leaderboard reset
- `currentViews` is continuously updated
- The delta ensures fairness — everyone starts fresh each period

### Leaderboard Reset

- Period is configurable (default: 7 days)
- On reset: `baseViews` for all approved videos is set to `currentViews`
- `LeaderboardConfig.nextReset` is computed and stored
- Scores effectively return to 0 for all users

### Video Submission Limits

- Maximum **5 video submissions per user per day**
- Same URL cannot be submitted twice (DB unique constraint)
- Platform validation via regex on URL format

### View Update Strategy

```
On /api/videos/my-videos request:
  → For each approved video where lastViewedAt > 1 hour ago:
      → Fetch new view count from platform
      → Update currentViews

Daily cron (/api/cron/update-views):
  → Update currentViews for ALL approved videos
```

TikTok and Instagram views require manual admin update (`/api/admin/manual-views`) due to platform API restrictions.

### Prize Pool Validation

When admin updates prize pool tiers:
- Sum of all tier percentages must equal 100%
- Sum of all tier amounts must equal `totalPool`
- Validated server-side before saving

### Cashout Workflow

```
User → POST /api/cashout/request
  → Creates Transaction (status: "pending")

Admin → POST /api/admin/transactions/[id]/approve
  → Updates Transaction (status: "approved")
  → Sends approval email to user

Admin → POST /api/admin/mark-paid
  → Sets User.isPaid = true, User.paidAt = now
```

---

## 9. Frontend Pages

### Public Pages
| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Login form |
| `/register` | Registration form |
| `/reset-password` | OTP-based password reset flow |
| `/api-docs` | Swagger UI — interactive API documentation |

### User Dashboard (Requires Login)
| Route | Description |
|-------|-------------|
| `/dashboard` | Overview — stats, recent videos, quick actions |
| `/dashboard/videos` | Submit new videos, view submission history |
| `/dashboard/leaderboard` | Live leaderboard with countdown timer |
| `/dashboard/profile` | Edit username, email, PayPal details, avatar |
| `/dashboard/cashout` | Request cashout, view transaction history |
| `/dashboard/challenge` | Current challenge details & rules |
| `/dashboard/tiktok` | Link TikTok accounts, browse & submit TikTok videos |

### Admin Panel (Requires admin role)
| Route | Description |
|-------|-------------|
| `/admin` | Dashboard with platform-wide stats |
| `/admin/users` | User list, promote to admin |
| `/admin/videos` | Video approval queue, manual view updates |
| `/admin/leaderboard` | Configure reset period & schedule |
| `/admin/transactions` | Approve/reject cashout requests |
| `/admin/payouts` | Track payout status per user |
| `/admin/prize-pool` | Configure prize tiers & amounts |
| `/admin/challenge` | Create/edit active challenge |

---

## 10. Environment Variables

Create `.env.local` in the project root:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="your-random-secret-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# YouTube Data API v3
YOUTUBE_API_KEY="AIzaxxxxxx"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="your-api-secret"

# SMTP Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Cashtoroid <no-reply@cashtoroid.com>"

# TikTok OAuth
TIKTOK_CLIENT_KEY="your-tiktok-app-key"
TIKTOK_CLIENT_SECRET="your-tiktok-app-secret"
TIKTOK_REDIRECT_URI="https://yourdomain.com/api/tiktok/auth/callback"

# Cron Job Protection
CRON_SECRET="your-random-cron-secret"

# Admin Seed
ADMIN_EMAIL="admin@cashtoroid.com"
```

---

## 11. Deployment & Infrastructure

### Hosting
- **Platform:** Vercel (recommended)
- **Database:** Neon (serverless PostgreSQL, always-on free tier)
- **Media:** Cloudinary (avatar CDN)

### Vercel Cron Jobs (vercel.json)
```json
{
  "crons": [
    {
      "path": "/api/cron/update-views",
      "schedule": "0 0 * * *"
    }
  ]
}
```
Runs daily at midnight UTC. Protected by `x-cron-secret` header.

### Database Setup
```bash
# Install dependencies
npm install

# Push schema to database
npx prisma db push

# Seed admin account
npx prisma db seed

# (Optional) Open Prisma Studio
npx prisma studio
```

### Production Build
```bash
npm run build
npm start
```

---

## 12. Security Model

### Role-Based Access Control (RBAC)
- `role: "user"` — standard dashboard access
- `role: "admin"` — full admin panel + all user abilities
- Role stored in JWT payload and validated on every admin request

### Input Validation
- All request bodies validated with **Zod schemas** (`lib/validators.ts`)
- Unknown fields are stripped; type coercion prevented
- URL format validated with regex before DB insert

### Password Security
- Hashed with **bcrypt, 10 salt rounds** before storage
- Plain passwords never stored or logged
- OTP for password reset has **15-minute expiry** and is single-use

### API Security
- CORS headers set on all API responses
- Cron endpoint protected by secret header (`CRON_SECRET`)
- No email enumeration on forgot-password (always returns same response)
- Video URLs must be unique — prevents duplicate submissions

### Rate Limiting
- Video submissions capped at **5 per user per day** (enforced in DB query)

### TikTok OAuth
- State parameter used to prevent CSRF attacks
- Access tokens stored encrypted in DB
- Token refresh handled server-side (never exposed to client)

---

*Documentation generated for Cashtoroid — Next.js video earnings platform*
*Last updated: 2026-06-29*

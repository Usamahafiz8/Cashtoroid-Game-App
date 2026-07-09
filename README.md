# Cashtoroid — Content Rewards System

A Next.js 14 MVP for rewarding users based on gameplay video view counts. Users submit TikTok, YouTube, or Instagram video links. The system tracks views, ranks users on a leaderboard, and enables admin-controlled payouts.

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy `.env.local` and fill in real values:
```
DATABASE_URL="postgresql://user:password@localhost:5432/cashtoroid"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
YOUTUBE_API_KEY="your-youtube-data-api-v3-key"
ADMIN_EMAIL="admin@cashtoroid.com"
CRON_SECRET="generate-with: openssl rand -hex 32"
```

### 3. Push database schema
```bash
npx prisma db push
```

### 4. Seed test data
```bash
npx prisma db seed
```
Creates: 1 admin (`admin@cashtoroid.com` / `admin123`), 3 test users (`user1@test.com` / `password123`), and sample videos.

### 5. Start dev server
```bash
npm run dev
```

---

## API Reference

### Public

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/register` | Register a new user |
| POST | `/api/auth/signin` | Sign in (NextAuth) |
| GET | `/api/leaderboard` | Top 100 leaderboard (public) |

**Register** — `POST /api/register`
```json
{ "username": "player1", "email": "user@example.com", "password": "secret123" }
```

---

### Authenticated (requires login)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/videos/submit` | Submit a video |
| GET | `/api/videos/my-videos` | Get your submitted videos |

**Submit Video** — `POST /api/videos/submit`
```json
{ "url": "https://www.youtube.com/watch?v=abc123", "platform": "youtube", "title": "My Clip" }
```
- Limit: 5 submissions per day per user
- Duplicate URLs are rejected

---

### Admin (requires `role = "admin"`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/videos` | All videos (filterable) |
| POST | `/api/admin/update-status` | Approve / reject a video |
| GET | `/api/admin/users` | All users with stats |
| GET | `/api/admin/payouts` | Payout list (top N) |
| POST | `/api/admin/mark-paid` | Mark a user as paid |
| POST | `/api/admin/manual-views` | Manually set view count |
| POST | `/api/admin/recalculate` | Re-fetch views + recalculate |

**Filter videos**: `GET /api/admin/videos?status=pending&platform=youtube`

**Update status** — `POST /api/admin/update-status`
```json
{ "videoId": "cuid...", "status": "approved" }
{ "videoId": "cuid...", "status": "rejected", "flagReason": "Fake views detected" }
```

**Mark paid** — `POST /api/admin/mark-paid`
```json
{ "userId": "cuid..." }
```

**Manual views** — `POST /api/admin/manual-views`
```json
{ "videoId": "cuid...", "views": 52000 }
```

**Payouts list**: `GET /api/admin/payouts?limit=20`

---

### Cron

| Method | Path | Auth Header | Description |
|--------|------|-------------|-------------|
| GET | `/api/cron/update-views` | `x-cron-secret: <CRON_SECRET>` | Trigger view update |

**Trigger manually:**
```bash
curl -H "x-cron-secret: your-cron-secret-token" http://localhost:3000/api/cron/update-views
```

---

## Admin: Promote a user

Run directly on the database:
```sql
UPDATE "User" SET role = 'admin' WHERE email = 'user@example.com';
```

Or via Prisma Studio:
```bash
npx prisma studio
```

---

## TikTok / Instagram view tracking

TikTok and Instagram actively block automated scraping. The scraper (`lib/scraper.ts`) attempts a basic HTML parse but will return `-1` on failure. When that happens:

1. The video's `currentViews` is **not updated** by the cron job.
2. An admin must use `POST /api/admin/manual-views` to set the count manually.

This is the intended fallback for the MVP.

---

## Deployment on Vercel

1. Push the repo to GitHub and import to Vercel.
2. Set all environment variables in Vercel project settings.
3. `vercel.json` already configures the cron job to run every 6 hours:
```json
{ "crons": [{ "path": "/api/cron/update-views", "schedule": "0 */6 * * *" }] }
```
Vercel Cron sends requests with no `x-cron-secret` header by default — update the cron route to also accept Vercel's `Authorization: Bearer <CRON_SECRET>` header if needed, or use a [Vercel Cron secret](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

4. Run migrations after deploy:
```bash
npx prisma db push
```

---

## Earnings display (new design support)

The Unity app's new dashboard/profile screens show dollar earnings computed from view counts. This is driven by `PrizePool.viewRate` (dollars per 1000 approved views) — **set it via `PUT /api/admin/prize-pool` (include a `viewRate` field alongside the existing `totalAmount`/`tiers`) or every earnings figure in the app will show $0.00.** Scoring/ranking itself is still view-count only; there's no likes/comments tracking. `GET /api/users/me` also now returns `avatarUrl` and `lifetimeEarnings` (sum of `approved`-status transactions), and `GET /api/videos/my-videos` / `GET /api/users/me/stats` now include a computed `earnings` field.

## Response Format

All endpoints return:
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "...", "details": [...] }
```

HTTP status codes: `200/201` success, `400` validation, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict, `429` rate limit, `500` server error.

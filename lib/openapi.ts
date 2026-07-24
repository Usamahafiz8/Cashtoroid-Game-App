import type { OpenAPIV3 } from "openapi-types";

const spec: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "Cashtoroid — Content Rewards API",
    version: "1.0.0",
    description:
      "REST API for Cashtoroid, a gameplay video content rewards system. " +
      "Users submit TikTok / YouTube / Instagram video links. " +
      "The system tracks views, ranks users on a leaderboard, and enables admin-controlled payouts.",
    contact: {
      name: "Cashtoroid",
      email: "admin@cashtoroid.com",
    },
  },
  // servers is injected dynamically by /api/docs based on the request host
  servers: [],

  // ─── Shared security scheme ───────────────────────────────────────────────
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "JWT obtained from POST /api/auth/login → data.token. Click Authorize and paste the token.",
      },
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "authjs.session-token",
        description:
          "Session cookie obtained after signing in via POST /api/auth/callback/credentials.",
      },
    },
    schemas: {
      // ── Success wrapper ──────────────────────���───────────────────────────
      SuccessResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: { type: "object" },
        },
      },
      ErrorResponse: {
        type: "object",
        required: ["success", "error"],
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string", example: "Unauthorized" },
          message: { type: "string" },
          details: {
            type: "array",
            items: { type: "object" },
          },
        },
      },

      // ── Auth / User ──────────────────────────────────────────────────────
      RegisterRequest: {
        type: "object",
        required: ["username", "email", "password"],
        properties: {
          username: {
            type: "string",
            minLength: 3,
            maxLength: 20,
            pattern: "^[a-zA-Z0-9_]+$",
            example: "player_one",
          },
          email: { type: "string", format: "email", example: "player@example.com" },
          password: { type: "string", minLength: 6, maxLength: 100, example: "securepass123" },
        },
      },
      RegisterResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Registered successfully" },
          userId: { type: "string", example: "clxxxxxxxxxxxxxx" },
        },
      },

      // ── Videos ───────────────────────────────────────────────────────────
      VideoSubmitRequest: {
        type: "object",
        required: ["url", "platform"],
        properties: {
          url: {
            type: "string",
            format: "uri",
            example: "https://www.youtube.com/watch?v=dQw4w9WgXcZ",
          },
          platform: {
            type: "string",
            enum: ["youtube", "tiktok", "instagram"],
            example: "youtube",
          },
          title: { type: "string", maxLength: 200, example: "My epic gameplay" },
        },
      },
      Video: {
        type: "object",
        properties: {
          id: { type: "string", example: "clxxxxxxxxxxxxxx" },
          url: { type: "string", example: "https://www.youtube.com/watch?v=dQw4w9WgXcZ" },
          platform: { type: "string", enum: ["youtube", "tiktok", "instagram"] },
          title: { type: "string", nullable: true },
          currentViews: { type: "integer", example: 12500 },
          status: { type: "string", enum: ["pending", "approved", "rejected"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      VideoWithUser: {
        allOf: [
          { $ref: "#/components/schemas/Video" },
          {
            type: "object",
            properties: {
              lastCheckedAt: { type: "string", format: "date-time", nullable: true },
              isFlagged: { type: "boolean" },
              flagReason: { type: "string", nullable: true },
              userId: { type: "string" },
              user: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  username: { type: "string" },
                  email: { type: "string" },
                },
              },
            },
          },
        ],
      },

      // ── Leaderboard ───────────────────────────────────────────────────────
      LeaderboardEntry: {
        type: "object",
        properties: {
          rank: { type: "integer", example: 1 },
          username: { type: "string", example: "player_one" },
          avatarUrl: { type: "string", nullable: true, example: "https://cdn.example.com/avatars/wolf.png" },
          totalViews: { type: "integer", example: 250000 },
          videoCount: { type: "integer", example: 3 },
        },
      },

      // ── Admin ─────────────────────────────────────────────────────────────
      AdminUser: {
        type: "object",
        properties: {
          id: { type: "string" },
          username: { type: "string" },
          email: { type: "string" },
          role: { type: "string", enum: ["user", "admin"] },
          isPaid: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          videoCount: { type: "integer" },
          approvedVideoCount: { type: "integer" },
          totalViews: { type: "integer" },
        },
      },
      PayoutEntry: {
        type: "object",
        properties: {
          rank: { type: "integer" },
          userId: { type: "string" },
          username: { type: "string" },
          email: { type: "string" },
          totalViews: { type: "integer" },
          videoCount: { type: "integer" },
          paypalEmail: { type: "string", format: "email", nullable: true, example: "user@paypal.com" },
          payoutInfo: { type: "string", nullable: true, description: "Legacy freeform payout info" },
          isPaid: { type: "boolean" },
          paidAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      UpdateStatusRequest: {
        type: "object",
        required: ["videoId", "status"],
        properties: {
          videoId: { type: "string", example: "clxxxxxxxxxxxxxx" },
          status: { type: "string", enum: ["approved", "rejected"] },
          flagReason: { type: "string", example: "Suspected view manipulation" },
        },
      },
      ManualViewsRequest: {
        type: "object",
        required: ["videoId", "views"],
        properties: {
          videoId: { type: "string", example: "clxxxxxxxxxxxxxx" },
          views: { type: "integer", minimum: 0, example: 75000 },
        },
      },
      MarkPaidRequest: {
        type: "object",
        required: ["userId"],
        properties: {
          userId: { type: "string", example: "clxxxxxxxxxxxxxx" },
        },
      },

      // ── Auth ─────────────────────────────────────────────────────────────────
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "player@example.com" },
          password: { type: "string", example: "securepass123" },
        },
      },
      ChangePasswordRequest: {
        type: "object",
        required: ["currentPassword", "newPassword"],
        properties: {
          currentPassword: { type: "string", example: "oldpass123" },
          newPassword: { type: "string", minLength: 6, example: "newpass456" },
        },
      },
      ForgotPasswordRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email", example: "player@example.com" },
        },
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["email", "otp", "newPassword"],
        properties: {
          email: { type: "string", format: "email", example: "player@example.com" },
          otp: { type: "string", example: "482910", description: "6-digit OTP from the email" },
          newPassword: { type: "string", minLength: 6, example: "newpass456" },
        },
      },
      VerifyOtpRequest: {
        type: "object",
        required: ["email", "otp"],
        properties: {
          email: { type: "string", format: "email", example: "player@example.com" },
          otp: { type: "string", example: "482910", description: "6-digit OTP from the email" },
        },
      },

      // ── Profile ───────────────────────────────────────────────────────────────
      UserProfile: {
        type: "object",
        properties: {
          id: { type: "string", example: "clxxxxxxxxxxxxxx" },
          username: { type: "string", example: "player_one" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["user", "admin"] },
          paypalEmail: { type: "string", format: "email", nullable: true, example: "user@paypal.com", description: "PayPal email used for payouts" },
          payoutInfo: { type: "string", nullable: true, description: "Legacy freeform payout info (deprecated, use paypalEmail)" },
          isPaid: { type: "boolean" },
          paidAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      UpdateProfileRequest: {
        type: "object",
        properties: {
          username: { type: "string", minLength: 3, maxLength: 20, pattern: "^[a-zA-Z0-9_]+$", example: "new_username" },
          email: { type: "string", format: "email", example: "new@example.com" },
          paypalEmail: { type: "string", format: "email", nullable: true, example: "user@paypal.com", description: "PayPal email for receiving payouts" },
          payoutInfo: { type: "string", nullable: true, description: "Legacy freeform payout info (deprecated)" },
        },
      },
      UserStats: {
        type: "object",
        properties: {
          totalVideos: { type: "integer", example: 5 },
          approvedVideos: { type: "integer", example: 3 },
          pendingVideos: { type: "integer", example: 1 },
          rejectedVideos: { type: "integer", example: 1 },
          totalViews: { type: "integer", example: 145000 },
          rank: { type: "integer", nullable: true, example: 7, description: "Leaderboard rank, null if no approved videos" },
        },
      },

      // ── Video patch ───────────────────────────────────────────────────────────
      UpdateVideoRequest: {
        type: "object",
        properties: {
          title: { type: "string", maxLength: 200, example: "Updated title" },
        },
      },

      // ── Admin role ────────────────────────────────────────────────────────────
      UpdateRoleRequest: {
        type: "object",
        required: ["role"],
        properties: {
          role: { type: "string", enum: ["user", "admin"] },
        },
      },

      // ── Leaderboard timer + config ────────────────────────────────────────────
      LeaderboardTimer: {
        type: "object",
        properties: {
          secondsUntilReset: { type: "integer", example: 7940 },
          nextResetAt: { type: "string", format: "date-time" },
          lastResetAt: { type: "string", format: "date-time" },
          periodHours: { type: "integer", example: 24 },
        },
      },
      LeaderboardConfig: {
        type: "object",
        properties: {
          id: { type: "string", example: "singleton" },
          periodHours: { type: "integer", example: 24 },
          lastResetAt: { type: "string", format: "date-time" },
          nextResetAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      LeaderboardConfigRequest: {
        type: "object",
        required: ["periodHours"],
        properties: {
          periodHours: { type: "integer", minimum: 1, maximum: 8760, example: 24, description: "Hours between leaderboard resets" },
          triggerReset: { type: "boolean", example: false, description: "Set true to immediately reset the leaderboard now" },
        },
      },

      // ── TikTok ────────────────────────────────────────────────────────────────
      TikTokAccount: {
        type: "object",
        properties: {
          id: { type: "string" },
          tiktokUserId: { type: "string" },
          username: { type: "string", example: "creator123" },
          displayName: { type: "string", nullable: true },
          avatarUrl: { type: "string", nullable: true },
          tokenExpiresAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      TikTokVideo: {
        type: "object",
        properties: {
          id: { type: "string", description: "TikTok video ID" },
          title: { type: "string", nullable: true },
          coverImageUrl: { type: "string", nullable: true },
          shareUrl: { type: "string" },
          viewCount: { type: "integer" },
          likeCount: { type: "integer" },
          duration: { type: "integer", description: "Duration in seconds" },
          createTime: { type: "integer", description: "Unix timestamp" },
          accountAvatarUrl: { type: "string", nullable: true, description: "Account profile picture to display as thumbnail" },
          accountUsername: { type: "string" },
          accountId: { type: "string", description: "Cashtoroid TikTok account ID" },
        },
      },
      TikTokSubmitRequest: {
        type: "object",
        required: ["accountId"],
        properties: {
          accountId: { type: "string", description: "Cashtoroid TikTokAccount ID that owns this video" },
        },
      },

      // ── Prize Pool ────────────────────────────────────────────────────────────
      PrizeTier: {
        type: "object",
        required: ["rank", "amount"],
        properties: {
          rank: { type: "integer", example: 1 },
          amount: { type: "number", example: 500 },
        },
      },
      PrizePool: {
        type: "object",
        properties: {
          id: { type: "string", example: "singleton" },
          totalAmount: { type: "number", example: 1000 },
          currency: { type: "string", example: "USD" },
          tiers: { type: "array", items: { $ref: "#/components/schemas/PrizeTier" } },
          description: { type: "string", nullable: true },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      PrizePoolRequest: {
        type: "object",
        required: ["totalAmount"],
        properties: {
          totalAmount: { type: "number", minimum: 0, example: 1000 },
          currency: { type: "string", maxLength: 10, example: "USD" },
          tiers: {
            type: "array",
            items: { $ref: "#/components/schemas/PrizeTier" },
            example: [{ rank: 1, amount: 500 }, { rank: 2, amount: 300 }, { rank: 3, amount: 200 }],
          },
          description: { type: "string", nullable: true, example: "Season 1 prize pool" },
        },
      },

      // ── Cashout / Transactions ────────────────────────────────────────────────
      CashoutRequest: {
        type: "object",
        required: ["amount"],
        properties: {
          amount: { type: "number", minimum: 0.01, example: 50 },
          currency: { type: "string", maxLength: 10, example: "USD" },
          paypalEmail: { type: "string", format: "email", example: "user@paypal.com", description: "Override PayPal email for this request. Falls back to profile paypalEmail if omitted." },
          payoutInfo: { type: "string", maxLength: 1000, description: "Legacy override (deprecated, use paypalEmail)" },
        },
      },
      Transaction: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          amount: { type: "number" },
          currency: { type: "string" },
          status: { type: "string", enum: ["pending", "approved", "rejected"] },
          paypalEmail: { type: "string", format: "email", nullable: true, description: "PayPal email snapshotted at request time" },
          payoutInfo: { type: "string", nullable: true, description: "Legacy freeform payout info" },
          adminNote: { type: "string", nullable: true },
          reviewedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      TransactionWithUser: {
        allOf: [
          { $ref: "#/components/schemas/Transaction" },
          {
            type: "object",
            properties: {
              user: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  username: { type: "string" },
                  email: { type: "string" },
                  avatarUrl: { type: "string", nullable: true },
                },
              },
            },
          },
        ],
      },
      TransactionReview: {
        type: "object",
        properties: {
          adminNote: { type: "string", maxLength: 1000, example: "Processed via PayPal" },
        },
      },

      // ── Challenge ─────────────────────────────────────────────────────────────
      Challenge: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string", example: "Asteroid Challenge #1" },
          description: { type: "string" },
          rules: { type: "string" },
          guidelines: { type: "string", nullable: true },
          isActive: { type: "boolean" },
          startDate: { type: "string", format: "date-time", nullable: true },
          endDate: { type: "string", format: "date-time", nullable: true },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ChallengeRequest: {
        type: "object",
        required: ["title", "description", "rules"],
        properties: {
          title: { type: "string", minLength: 1, maxLength: 200, example: "Asteroid Challenge #1" },
          description: { type: "string", example: "Submit your best gameplay clips!" },
          rules: { type: "string", example: "1. Must be original content\n2. Minimum 30 seconds\n3. Must include #Cashtoroid" },
          guidelines: { type: "string", nullable: true, example: "Film in landscape mode for best results." },
          isActive: { type: "boolean", example: true },
          startDate: { type: "string", format: "date-time", nullable: true },
          endDate: { type: "string", format: "date-time", nullable: true },
        },
      },

      // ── Avatar ────────────────────────────────────────────────────────────────
      AvatarRequest: {
        type: "object",
        required: ["avatarUrl"],
        properties: {
          avatarUrl: { type: "string", format: "uri", maxLength: 2000, example: "https://cdn.example.com/avatars/wolf.png" },
        },
      },
    },
  },

  // ─── Tags ───────────────────────────────────���───────────────���────────────
  tags: [
    { name: "Auth", description: "Registration, login, logout, and password management" },
    { name: "Profile", description: "Authenticated user's own profile, avatar, and stats" },
    { name: "Videos", description: "Video submission and retrieval (authenticated)" },
    { name: "Leaderboard", description: "Public leaderboard, personal rank, and reset timer" },
    { name: "TikTok", description: "TikTok account OAuth, video list, and one-click submit" },
    { name: "PrizePool", description: "Active prize pool configuration (public read, admin write)" },
    { name: "Cashout", description: "User cashout requests and transaction history" },
    { name: "Challenge", description: "Active challenge/brief screen content (public read, admin write)" },
    { name: "Admin", description: "Admin-only operations (role: admin)" },
    { name: "Cron", description: "Scheduled view update trigger" },
  ],

  // ─── Paths ─────────────────────────────────────────────────────────────��─
  paths: {
    // ── Auth ───────────────────────────��────────────────────────────────────
    "/api/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        description:
          "Creates a new user account. Username must be 3-20 alphanumeric/underscore characters. " +
          "Returns the new user's ID on success.",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } },
          },
        },
        responses: {
          "201": {
            description: "Registered successfully",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: { $ref: "#/components/schemas/RegisterResponse" },
                      },
                    },
                  ],
                },
              },
            },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "409": { description: "Email or username already taken", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/auth/csrf": {
      get: {
        tags: ["Auth"],
        summary: "Get CSRF token",
        description:
          "**Step 1 of sign-in.** Returns a CSRF token required for the login POST. " +
          "Also sets the `authjs.csrf-token` cookie — you MUST send this cookie back with the login request.",
        responses: {
          "200": {
            description: "CSRF token",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { csrfToken: { type: "string", example: "abc123..." } },
                },
              },
            },
          },
        },
      },
    },

    "/api/auth/callback/credentials": {
      post: {
        tags: ["Auth"],
        summary: "Sign in with email + password",
        description:
          "**Step 2 of sign-in.** Submit credentials along with the CSRF token obtained from " +
          "`GET /api/auth/csrf`. On success, the server sets the `authjs.session-token` cookie " +
          "and redirects (HTTP 302) to `callbackUrl`. All subsequent authenticated requests must " +
          "send this cookie.\n\n" +
          "**Unity tip:** Use `UnityWebRequest` with a cookie container. After this call, store " +
          "the `authjs.session-token` cookie value and send it as a cookie header on every " +
          "authenticated request.",
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                required: ["email", "password", "csrfToken", "callbackUrl"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  csrfToken: { type: "string", description: "Token from GET /api/auth/csrf" },
                  callbackUrl: { type: "string", example: "https://reward-app-one.vercel.app" },
                },
              },
            },
          },
        },
        responses: {
          "302": {
            description:
              "Redirect on success (sets authjs.session-token cookie) or redirect to signin?error= on failure.",
          },
        },
      },
    },

    "/api/auth/session": {
      get: {
        tags: ["Auth"],
        summary: "Get current session",
        description: "Returns the current user session. Returns `null` if not logged in.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": {
            description: "Session object or null",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  nullable: true,
                  properties: {
                    user: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        email: { type: "string" },
                        role: { type: "string", enum: ["user", "admin"] },
                      },
                    },
                    expires: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Leaderboard ─────────────────────────────────────────────────────────
    "/api/leaderboard": {
      get: {
        tags: ["Leaderboard"],
        summary: "Get public leaderboard",
        description:
          "Returns users ranked by total views across all **approved** videos, plus the " +
          "reset timer and current prize pool. Tiebreaker: earliest approved video " +
          "submission date. No authentication required.",
        parameters: [
          {
            name: "limit",
            in: "query",
            required: false,
            description:
              "How many entries to return, 1–100. Defaults to 100. Out-of-range or " +
              "non-integer values fall back to the default rather than erroring.",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 100 },
            example: 10,
          },
        ],
        responses: {
          "200": {
            description: "Leaderboard entries, reset timer, and prize pool",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: { $ref: "#/components/schemas/LeaderboardEntry" },
                        },
                        timer: {
                          type: "object",
                          description: "Countdown to the next leaderboard reset.",
                          properties: {
                            secondsUntilReset: { type: "integer", example: 43200 },
                            nextResetAt: { type: "string", format: "date-time" },
                            lastResetAt: { type: "string", format: "date-time" },
                            periodHours: { type: "integer", example: 24 },
                          },
                        },
                        prizePool: {
                          type: "object",
                          description:
                            "Current prize pool. It has no deadline of its own — it pays out " +
                            "on the leaderboard reset cycle, so endsAt mirrors timer.nextResetAt.",
                          properties: {
                            totalAmount: { type: "number", example: 500 },
                            currency: { type: "string", example: "USD" },
                            tiers: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  rank: { type: "integer", example: 1 },
                                  amount: { type: "number", example: 250 },
                                },
                              },
                            },
                            description: { type: "string", nullable: true },
                            viewRate: {
                              type: "number",
                              description: "Dollars per 1000 approved views",
                              example: 0.5,
                            },
                            endsAt: { type: "string", format: "date-time" },
                            secondsUntilPayout: { type: "integer", example: 43200 },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    // ── Videos ─────────────────────────────────────────────────────────���─────
    "/api/videos/submit": {
      post: {
        tags: ["Videos"],
        summary: "Submit a gameplay video",
        description:
          "Submit a YouTube, TikTok, or Instagram video URL for review. " +
          "The video enters **pending** status until an admin approves it. " +
          "Limits: 5 submissions per user per day (configurable via `DAILY_VIDEO_LIMIT`), " +
          "counted from 00:00 UTC. Duplicate URLs are rejected and do not consume a slot.\n\n" +
          "**URL format requirements:**\n" +
          "- YouTube: `https://www.youtube.com/watch?v=...` or `https://youtu.be/...`\n" +
          "- TikTok: `https://www.tiktok.com/...`\n" +
          "- Instagram: `https://www.instagram.com/reel/...` or `/p/...`",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/VideoSubmitRequest" } },
          },
        },
        responses: {
          "201": {
            description: "Video submitted for review",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            message: { type: "string", example: "Video submitted for review" },
                            videoId: { type: "string", example: "clxxxxxxxxxxxxxx" },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "400": { description: "Validation error or invalid platform URL format", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "409": { description: "URL already submitted", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "429": { description: "Daily limit reached; response includes `data.limit`, `data.used`, and `data.resetsAt`", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/videos/my-videos": {
      get: {
        tags: ["Videos"],
        summary: "Get my submitted videos",
        description: "Returns all videos submitted by the currently authenticated user, newest first.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": {
            description: "List of the user's videos",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: { type: "array", items: { $ref: "#/components/schemas/Video" } },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    // ── Admin ────────────────────────────────────────────────────────────────
    "/api/admin/videos/{id}": {
      delete: {
        tags: ["Admin"],
        summary: "Delete any video (admin)",
        description: "Permanently deletes a video regardless of status or owner. This action is irreversible.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Video CUID" },
        ],
        responses: {
          "200": {
            description: "Video deleted",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { type: "object", properties: { message: { type: "string", example: "Video deleted" } } } } },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Not an admin", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Video not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/admin/videos": {
      get: {
        tags: ["Admin"],
        summary: "List all videos (filterable)",
        description: "Returns all submitted videos with user info. Filter by `status` and/or `platform`.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["pending", "approved", "rejected"] },
            description: "Filter by video status",
          },
          {
            name: "platform",
            in: "query",
            schema: { type: "string", enum: ["youtube", "tiktok", "instagram"] },
            description: "Filter by platform",
          },
        ],
        responses: {
          "200": {
            description: "List of videos",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: { type: "array", items: { $ref: "#/components/schemas/VideoWithUser" } },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Not an admin", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/admin/update-status": {
      post: {
        tags: ["Admin"],
        summary: "Approve or reject a video",
        description:
          "Updates a video's moderation status. When rejecting, you can optionally provide a `flagReason` " +
          "to flag the video and explain why. An email notification is sent to the video owner.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/UpdateStatusRequest" } },
          },
        },
        responses: {
          "200": {
            description: "Status updated",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: { message: { type: "string", example: "Status updated" } },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Not an admin", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Video not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "List all users with stats",
        description:
          "Returns all registered users with their video counts and total approved view counts. " +
          "Sorted by total views descending.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": {
            description: "List of users with stats",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: { type: "array", items: { $ref: "#/components/schemas/AdminUser" } },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Not an admin", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/admin/payouts": {
      get: {
        tags: ["Admin"],
        summary: "Get payout list",
        description:
          "Returns the top N users from the leaderboard enriched with payout info " +
          "(email, payoutInfo, isPaid). Used for manual disbursement.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10, minimum: 1, maximum: 100 },
            description: "How many top users to return (default: 10)",
          },
        ],
        responses: {
          "200": {
            description: "Payout list",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: { type: "array", items: { $ref: "#/components/schemas/PayoutEntry" } },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Not an admin", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/admin/mark-paid": {
      post: {
        tags: ["Admin"],
        summary: "Mark a user as paid",
        description:
          "Sets `isPaid = true` and records `paidAt` timestamp for the specified user. " +
          "A payout confirmation email is sent to the user.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/MarkPaidRequest" } },
          },
        },
        responses: {
          "200": {
            description: "Marked as paid",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: { message: { type: "string", example: "Marked as paid" } },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Not an admin", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "User not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/admin/manual-views": {
      post: {
        tags: ["Admin"],
        summary: "Manually set view count",
        description:
          "Directly sets `currentViews` for a video. Used as the fallback for TikTok and Instagram " +
          "videos where automated scraping fails. Also updates `lastCheckedAt`.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ManualViewsRequest" } },
          },
        },
        responses: {
          "200": {
            description: "Views updated",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            message: { type: "string" },
                            newViews: { type: "integer" },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Not an admin", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Video not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/admin/recalculate": {
      post: {
        tags: ["Admin"],
        summary: "Force re-fetch views and recalculate leaderboard",
        description:
          "Re-runs the view update for all approved videos (same logic as the cron job) " +
          "and returns the updated top-10 leaderboard.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": {
            description: "Recalculation complete",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            message: { type: "string" },
                            leaderboard: {
                              type: "array",
                              items: { $ref: "#/components/schemas/LeaderboardEntry" },
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Not an admin", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    // ── Cron ─────────────────────────────────────────────────────────────────
    "/api/cron/update-views": {
      get: {
        tags: ["Cron"],
        summary: "Trigger automated view update",
        description:
          "Fetches the latest view counts for all approved videos and updates the database. " +
          "YouTube uses the Data API v3. TikTok and Instagram fall back to scraping (returns -1 on failure). " +
          "Public endpoint — no authentication required. On Vercel, this runs automatically every 6 hours.",
        parameters: [],
        responses: {
          "200": {
            description: "View update summary",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            updated: { type: "integer", description: "Number of videos with views refreshed" },
                            failed: { type: "integer", description: "Number of videos where fetch failed (need manual update)" },
                            timestamp: { type: "string", format: "date-time" },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "500": { description: "Server error during update", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    // ── Auth — new endpoints ──────────────────────────────────────────────────
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Validate credentials (REST login)",
        description:
          "Validates email + password and returns basic user info. " +
          "**For a full browser session** also POST to `/api/auth/callback/credentials` with the same credentials plus `csrfToken` and `callbackUrl` (see that endpoint). " +
          "This endpoint is useful for non-browser clients to verify credentials before establishing a session.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
        },
        responses: {
          "200": {
            description: "Credentials valid",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            token: { type: "string", description: "JWT — use as Authorization: Bearer <token>" },
                            id: { type: "string" },
                            username: { type: "string" },
                            email: { type: "string" },
                            role: { type: "string", enum: ["user", "admin"] },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Invalid credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Log out (clear session cookies)",
        description: "Clears all NextAuth session cookies for the current browser session. Requires an active session.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": {
            description: "Logged out",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { type: "object", properties: { message: { type: "string", example: "Logged out successfully" } } } } },
                  ],
                },
              },
            },
          },
          "401": { description: "Not logged in", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/auth/change-password": {
      put: {
        tags: ["Auth"],
        summary: "Change password",
        description: "Updates the authenticated user's password. Requires the current password for verification.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ChangePasswordRequest" } } },
        },
        responses: {
          "200": {
            description: "Password changed",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { type: "object", properties: { message: { type: "string", example: "Password changed successfully" } } } } },
                  ],
                },
              },
            },
          },
          "400": { description: "Validation error or incorrect current password", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request password reset OTP",
        description:
          "Sends a 6-digit OTP to the given email if it belongs to a registered user. " +
          "Always returns success to prevent email enumeration. " +
          "The OTP expires in **15 minutes** and is cleared after a successful reset.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ForgotPasswordRequest" } } },
        },
        responses: {
          "200": {
            description: "Request received (always — even if email is not registered)",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { type: "object", properties: { message: { type: "string" } } } } },
                  ],
                },
              },
            },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/auth/verify-otp": {
      post: {
        tags: ["Auth"],
        summary: "Verify password reset OTP",
        description:
          "Checks that the 6-digit OTP matches the one stored for the given email and has not expired. " +
          "**Does not clear the OTP** — call this before the reset-password step to validate the code in the UI. " +
          "After a successful response, proceed to `POST /api/auth/reset-password` with the same email + OTP.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/VerifyOtpRequest" } } },
        },
        responses: {
          "200": {
            description: "OTP is valid",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { type: "object", properties: { message: { type: "string", example: "OTP verified successfully." } } } } },
                  ],
                },
              },
            },
          },
          "400": {
            description: "No account found / OTP not requested / OTP expired / Incorrect OTP",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password with OTP",
        description:
          "Accepts the email, the 6-digit OTP from the email, and a new password. " +
          "The OTP is verified and the password is updated. " +
          "The OTP is cleared after use and cannot be reused.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ResetPasswordRequest" } } },
        },
        responses: {
          "200": {
            description: "Password reset successfully",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { type: "object", properties: { message: { type: "string" } } } } },
                  ],
                },
              },
            },
          },
          "400": { description: "Invalid or expired token, or validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    // ── Profile ───────────────────────────────────────────────────────────────
    "/api/users/me": {
      get: {
        tags: ["Profile"],
        summary: "Get own profile",
        description: "Returns the full profile of the currently authenticated user including paypalEmail, payoutInfo, and payment status.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": {
            description: "User profile",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { $ref: "#/components/schemas/UserProfile" } } },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
      put: {
        tags: ["Profile"],
        summary: "Update own profile",
        description:
          "Updates the authenticated user's username, email, paypalEmail, and/or payoutInfo. " +
          "All fields are optional — only provided fields are updated. " +
          "Username and email are checked for uniqueness.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateProfileRequest" } } },
        },
        responses: {
          "200": {
            description: "Updated profile",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { $ref: "#/components/schemas/UserProfile" } } },
                  ],
                },
              },
            },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "409": { description: "Username or email already taken", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/users/me/stats": {
      get: {
        tags: ["Profile"],
        summary: "Get own stats",
        description: "Returns the authenticated user's video counts by status, total view count across approved videos, and current leaderboard rank.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": {
            description: "User stats",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { $ref: "#/components/schemas/UserStats" } } },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    // ── Videos — single-record ops ────────────────────────────────────────────
    "/api/videos/{id}": {
      get: {
        tags: ["Videos"],
        summary: "Get a single video",
        description: "Returns full details for one video. Users can only fetch their own videos; admins can fetch any.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Video CUID" },
        ],
        responses: {
          "200": {
            description: "Video details",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { $ref: "#/components/schemas/VideoWithUser" } } },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Trying to access another user's video", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Video not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
      patch: {
        tags: ["Videos"],
        summary: "Edit video title",
        description: "Updates a video's title. Users can only edit their own **pending** videos; admins can edit any video.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Video CUID" },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateVideoRequest" } } },
        },
        responses: {
          "200": {
            description: "Updated video",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { $ref: "#/components/schemas/Video" } } },
                  ],
                },
              },
            },
          },
          "400": { description: "Validation error or video is not pending", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Not the video owner", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Video not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
      delete: {
        tags: ["Videos"],
        summary: "Delete a video",
        description: "Deletes a video permanently. Users can only delete their own **pending** videos; admins can delete any video.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Video CUID" },
        ],
        responses: {
          "200": {
            description: "Video deleted",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { type: "object", properties: { message: { type: "string" } } } } },
                  ],
                },
              },
            },
          },
          "400": { description: "Video is not in pending status (for non-admins)", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Not the video owner", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Video not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    // ── Leaderboard — personal rank ───────────────────────────────────────────
    "/api/leaderboard/me": {
      get: {
        tags: ["Leaderboard"],
        summary: "Get own leaderboard rank",
        description:
          "Returns the authenticated user's current rank, total views, and video count. " +
          "If the user has no approved videos, rank is `null`.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": {
            description: "Personal rank",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            rank: { type: "integer", nullable: true, example: 5 },
                            username: { type: "string", example: "player_one" },
                            totalViews: { type: "integer", example: 145000 },
                            videoCount: { type: "integer", example: 3 },
                            message: { type: "string", nullable: true },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    // ── Admin — single user ops ───────────────────────────────────────────────
    "/api/admin/users/{id}": {
      get: {
        tags: ["Admin"],
        summary: "Get single user with stats",
        description: "Returns full profile + video stats for a specific user.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "User CUID" },
        ],
        responses: {
          "200": {
            description: "User detail",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { $ref: "#/components/schemas/AdminUser" } } },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Not an admin", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "User not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Delete user",
        description: "Permanently deletes a user and **all their videos**. This action is irreversible.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "User CUID" },
        ],
        responses: {
          "200": {
            description: "User deleted",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { type: "object", properties: { message: { type: "string" } } } } },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Not an admin", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "User not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/admin/users/{id}/role": {
      put: {
        tags: ["Admin"],
        summary: "Update user role",
        description: "Promotes or demotes a user between `user` and `admin` roles.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "User CUID" },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateRoleRequest" } } },
        },
        responses: {
          "200": {
            description: "Role updated",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            username: { type: "string" },
                            email: { type: "string" },
                            role: { type: "string", enum: ["user", "admin"] },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Not an admin", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "User not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    // ── Leaderboard — reset timer ─────────────────────────────────────────────
    "/api/leaderboard/timer": {
      get: {
        tags: ["Leaderboard"],
        summary: "Get leaderboard reset countdown",
        description:
          "Returns the number of seconds until the next leaderboard reset plus the server-side `nextResetAt` timestamp. " +
          "Poll this endpoint to drive a live countdown on the app — do NOT use client-side calculation only.",
        responses: {
          "200": {
            description: "Timer info",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { $ref: "#/components/schemas/LeaderboardTimer" } } },
                  ],
                },
              },
            },
          },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    // ── Admin — leaderboard config ────────────────────────────────────────────
    "/api/admin/leaderboard/config": {
      get: {
        tags: ["Admin"],
        summary: "Get leaderboard period config",
        description: "Returns the current leaderboard reset schedule (period hours, last reset, next reset).",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": {
            description: "Current config",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { $ref: "#/components/schemas/LeaderboardConfig" } } },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Not an admin", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
      put: {
        tags: ["Admin"],
        summary: "Update leaderboard period / trigger reset",
        description:
          "Sets the reset period (in hours). If `triggerReset: true`, the leaderboard is reset **immediately**: " +
          "all video `baseViews` are snapped to `currentViews` so the next period starts from zero, " +
          "and `lastResetAt` / `nextResetAt` are updated.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LeaderboardConfigRequest" } } },
        },
        responses: {
          "200": {
            description: "Config updated",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { $ref: "#/components/schemas/LeaderboardConfig" } } },
                  ],
                },
              },
            },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Not an admin", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    // ── TikTok — OAuth ────────────────────────────────────────────────────────
    "/api/tiktok/auth/url": {
      get: {
        tags: ["TikTok"],
        summary: "Get TikTok OAuth URL",
        description:
          "Returns a TikTok authorization URL. Open this URL in a browser or webview to start the OAuth flow. " +
          "After the user grants access, TikTok will redirect to `/api/tiktok/auth/callback`.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": {
            description: "OAuth URL",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            url: { type: "string", format: "uri" },
                            state: { type: "string" },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Server error (check TIKTOK_CLIENT_KEY env var)", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/tiktok/auth/callback": {
      get: {
        tags: ["TikTok"],
        summary: "TikTok OAuth callback",
        description:
          "Handles the redirect from TikTok after the user authorizes. Exchanges the code for tokens, " +
          "fetches the user's TikTok profile, and stores/updates the linked account. " +
          "This URL must be registered as the redirect URI in your TikTok developer app.",
        parameters: [
          { name: "code", in: "query", required: true, schema: { type: "string" } },
          { name: "state", in: "query", required: true, schema: { type: "string" } },
          { name: "error", in: "query", schema: { type: "string" }, description: "Set by TikTok if the user denies authorization" },
        ],
        responses: {
          "200": {
            description: "Account connected",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            message: { type: "string" },
                            accountId: { type: "string" },
                            username: { type: "string" },
                            displayName: { type: "string", nullable: true },
                            avatarUrl: { type: "string", nullable: true },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "400": { description: "Missing params or auth denied", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Token exchange failed", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    // ── TikTok — Accounts ─────────────────────────────────────────────────────
    "/api/tiktok/accounts": {
      get: {
        tags: ["TikTok"],
        summary: "List connected TikTok accounts",
        description: "Returns all TikTok profiles the authenticated user has linked. Supports multiple accounts.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": {
            description: "Account list",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/TikTokAccount" } } } },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/tiktok/accounts/{id}": {
      delete: {
        tags: ["TikTok"],
        summary: "Disconnect a TikTok account",
        description: "Removes the linked TikTok profile. Users can only disconnect their own accounts.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "TikTokAccount CUID" },
        ],
        responses: {
          "200": {
            description: "Disconnected",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { type: "object", properties: { message: { type: "string" } } } } },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Not the account owner", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Account not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/tiktok/accounts/{id}/videos": {
      get: {
        tags: ["TikTok"],
        summary: "List videos from a connected TikTok account",
        description:
          "Fetches public videos from the linked TikTok account via TikTok API. " +
          "Each video includes `accountAvatarUrl` to use as the thumbnail/placeholder in the video list view. " +
          "Supports cursor-based pagination. Token is auto-refreshed if expired.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "TikTokAccount CUID" },
          { name: "cursor", in: "query", schema: { type: "integer", default: 0 }, description: "Pagination cursor returned by previous call" },
        ],
        responses: {
          "200": {
            description: "Video list",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            videos: { type: "array", items: { $ref: "#/components/schemas/TikTokVideo" } },
                            cursor: { type: "integer" },
                            hasMore: { type: "boolean" },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated or TikTok token expired", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Not the account owner", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Account not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/tiktok/videos/{videoId}/submit": {
      post: {
        tags: ["TikTok"],
        summary: "Submit a TikTok video to the active challenge",
        description:
          "One-click submit a TikTok video (from a connected account) to the active challenge. " +
          "The same daily limit (5/day) and duplicate-URL rules apply as the manual submit endpoint.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "videoId", in: "path", required: true, schema: { type: "string" }, description: "TikTok video ID (from the video list)" },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/TikTokSubmitRequest" } } },
        },
        responses: {
          "201": {
            description: "Video submitted for review",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            message: { type: "string" },
                            videoId: { type: "string" },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "400": { description: "Missing accountId", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Not authenticated or TikTok token expired", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "TikTok account not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "409": { description: "Video already submitted", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "429": { description: "Daily submission limit reached", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    // ── Prize Pool ────────────────────────────────────────────────────────────
    "/api/prize-pool": {
      get: {
        tags: ["PrizePool"],
        summary: "Get current prize pool",
        description: "Returns the active prize pool including total amount, currency, and per-rank tier breakdown. Public — no auth required.",
        responses: {
          "200": {
            description: "Prize pool",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { $ref: "#/components/schemas/PrizePool" } } },
                  ],
                },
              },
            },
          },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/admin/prize-pool": {
      get: {
        tags: ["Admin"],
        summary: "Get prize pool (admin)",
        description: "Admin view of the current prize pool configuration.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": {
            description: "Prize pool",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { $ref: "#/components/schemas/PrizePool" } } },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Not an admin", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
      put: {
        tags: ["Admin"],
        summary: "Update prize pool",
        description:
          "Sets the total prize pool amount and per-rank tier distribution. " +
          "Changes are immediately visible to users via `GET /api/prize-pool`.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/PrizePoolRequest" } } },
        },
        responses: {
          "200": {
            description: "Prize pool updated",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { $ref: "#/components/schemas/PrizePool" } } },
                  ],
                },
              },
            },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Not an admin", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    // ── Cashout ───────────────────────────────────────────────────────────────
    "/api/cashout/request": {
      post: {
        tags: ["Cashout"],
        summary: "Submit a cashout request",
        description:
          "Creates a `pending` transaction for admin review. Only one pending request is allowed at a time. " +
          "Requires a PayPal email — resolved from: request body `paypalEmail` → user profile `paypalEmail`. " +
          "Returns 400 if neither is set. The PayPal email is snapshotted onto the transaction at creation time.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CashoutRequest" } } },
        },
        responses: {
          "201": {
            description: "Request submitted",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            message: { type: "string" },
                            transactionId: { type: "string" },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "400": { description: "Validation error or no payout info on file", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "409": { description: "Already has a pending request", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/cashout/history": {
      get: {
        tags: ["Cashout"],
        summary: "Get cashout history",
        description: "Returns the authenticated user's cashout transaction history, newest first.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": {
            description: "Transaction list",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Transaction" } } } },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/admin/transactions": {
      get: {
        tags: ["Admin"],
        summary: "List all cashout transactions",
        description: "Returns all user cashout requests with user details. Filter by `status`.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["pending", "approved", "rejected"] },
            description: "Filter by transaction status",
          },
        ],
        responses: {
          "200": {
            description: "Transaction list",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/TransactionWithUser" } } } },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Not an admin", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/admin/transactions/{id}/approve": {
      post: {
        tags: ["Admin"],
        summary: "Approve a cashout transaction",
        description: "Marks a pending transaction as `approved`. An optional `adminNote` can be added.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Transaction CUID" },
        ],
        requestBody: {
          content: { "application/json": { schema: { $ref: "#/components/schemas/TransactionReview" } } },
        },
        responses: {
          "200": {
            description: "Transaction approved",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { type: "object", properties: { message: { type: "string" }, transaction: { $ref: "#/components/schemas/Transaction" } } } } },
                  ],
                },
              },
            },
          },
          "400": { description: "Transaction is not pending", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Not an admin", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Transaction not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/admin/transactions/{id}/reject": {
      post: {
        tags: ["Admin"],
        summary: "Reject a cashout transaction",
        description: "Marks a pending transaction as `rejected`. An optional `adminNote` explaining the reason can be added.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Transaction CUID" },
        ],
        requestBody: {
          content: { "application/json": { schema: { $ref: "#/components/schemas/TransactionReview" } } },
        },
        responses: {
          "200": {
            description: "Transaction rejected",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { type: "object", properties: { message: { type: "string" }, transaction: { $ref: "#/components/schemas/Transaction" } } } } },
                  ],
                },
              },
            },
          },
          "400": { description: "Transaction is not pending", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Not an admin", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Transaction not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    // ── Challenge / Brief Screen ───────────────────────────────────────────────
    "/api/challenge": {
      get: {
        tags: ["Challenge"],
        summary: "Get active challenge",
        description:
          "Returns the current challenge's title, description, rules, and guidelines. " +
          "This is the data that powers the Brief Screen in the app. No auth required.",
        responses: {
          "200": {
            description: "Active challenge",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { $ref: "#/components/schemas/Challenge" } } },
                  ],
                },
              },
            },
          },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/admin/challenge": {
      get: {
        tags: ["Admin"],
        summary: "Get challenge (admin)",
        description: "Admin view of the current challenge config.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": {
            description: "Challenge",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { $ref: "#/components/schemas/Challenge" } } },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Not an admin", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
      put: {
        tags: ["Admin"],
        summary: "Update challenge / brief screen",
        description:
          "Creates or updates the active challenge. Changes are **instantly** visible to users via `GET /api/challenge`. " +
          "Set `isActive: false` to hide the challenge from the app.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ChallengeRequest" } } },
        },
        responses: {
          "200": {
            description: "Challenge updated",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { $ref: "#/components/schemas/Challenge" } } },
                  ],
                },
              },
            },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Not an admin", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    // ── Avatar ────────────────────────────────────────────────────────────────
    "/api/users/me/avatar/upload": {
      post: {
        tags: ["Profile"],
        summary: "Upload avatar image to Cloudinary",
        description:
          "Uploads an image file to Cloudinary and automatically sets it as the user's in-game avatar. " +
          "Accepts `multipart/form-data` with a single field named `file`. " +
          "Supported types: JPEG, PNG, WebP, GIF. Maximum size: 5 MB. " +
          "Image is cropped to 400×400 face-fill on Cloudinary. " +
          "On success, `user.avatarUrl` is updated automatically.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary", description: "Image file (JPEG, PNG, WebP, or GIF — max 5 MB)" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Avatar uploaded and saved",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            avatarUrl: { type: "string", format: "uri", description: "Cloudinary URL of the uploaded avatar" },
                            user: {
                              type: "object",
                              properties: {
                                id: { type: "string" },
                                username: { type: "string" },
                                avatarUrl: { type: "string" },
                              },
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "400": { description: "No file, unsupported type, or file too large", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Server error or Cloudinary upload failed", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "503": { description: "Cloudinary is not configured on the server (missing or placeholder credentials)", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/users/me/avatar": {
      put: {
        tags: ["Profile"],
        summary: "Update in-game avatar",
        description:
          "Sets the authenticated user's avatar URL. The URL should point to the selected in-game avatar asset. " +
          "This `avatarUrl` is returned on all leaderboard entries.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AvatarRequest" } } },
        },
        responses: {
          "200": {
            description: "Avatar updated",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            username: { type: "string" },
                            avatarUrl: { type: "string" },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
  },
};

export default spec;

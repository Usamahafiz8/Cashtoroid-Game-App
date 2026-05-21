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
          payoutInfo: { type: "string", nullable: true, description: "JSON string: { method, accountNumber, name }" },
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
        required: ["token", "newPassword"],
        properties: {
          token: { type: "string", description: "JWT reset token from the email link" },
          newPassword: { type: "string", minLength: 6, example: "newpass456" },
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
          payoutInfo: { type: "string", nullable: true, description: "JSON string: { method, accountNumber, name }" },
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
          payoutInfo: { type: "string", nullable: true, example: "{\"method\":\"PayPal\",\"accountNumber\":\"user@paypal.com\",\"name\":\"John Doe\"}" },
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
    },
  },

  // ─── Tags ───────────────────────────────────���───────────────���────────────
  tags: [
    { name: "Auth", description: "Registration, login, logout, and password management" },
    { name: "Profile", description: "Authenticated user's own profile and stats" },
    { name: "Videos", description: "Video submission and retrieval (authenticated)" },
    { name: "Leaderboard", description: "Public leaderboard and personal rank" },
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
                  callbackUrl: { type: "string", example: "http://localhost:3000" },
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
        security: [{ cookieAuth: [] }],
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
          "Returns the top 100 users ranked by total views across all **approved** videos. " +
          "Tiebreaker: earliest approved video submission date. No authentication required.",
        responses: {
          "200": {
            description: "Top 100 leaderboard entries",
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
          "Limits: 5 submissions per user per day. Duplicate URLs are rejected.\n\n" +
          "**URL format requirements:**\n" +
          "- YouTube: `https://www.youtube.com/watch?v=...` or `https://youtu.be/...`\n" +
          "- TikTok: `https://www.tiktok.com/...`\n" +
          "- Instagram: `https://www.instagram.com/reel/...` or `/p/...`",
        security: [{ cookieAuth: [] }],
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
          "429": { description: "Daily limit reached (5/day)", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/videos/my-videos": {
      get: {
        tags: ["Videos"],
        summary: "Get my submitted videos",
        description: "Returns all videos submitted by the currently authenticated user, newest first.",
        security: [{ cookieAuth: [] }],
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
    "/api/admin/videos": {
      get: {
        tags: ["Admin"],
        summary: "List all videos (filterable)",
        description: "Returns all submitted videos with user info. Filter by `status` and/or `platform`.",
        security: [{ cookieAuth: [] }],
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
        security: [{ cookieAuth: [] }],
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
        security: [{ cookieAuth: [] }],
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
        security: [{ cookieAuth: [] }],
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
        security: [{ cookieAuth: [] }],
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
        security: [{ cookieAuth: [] }],
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
        security: [{ cookieAuth: [] }],
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
          "Protected by the `x-cron-secret` header. On Vercel, this runs automatically every 6 hours.",
        parameters: [
          {
            name: "x-cron-secret",
            in: "header",
            required: true,
            schema: { type: "string" },
            description: "Must match the `CRON_SECRET` environment variable",
          },
        ],
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
          "401": { description: "Invalid or missing cron secret", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
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
                            id: { type: "string" },
                            username: { type: "string" },
                            email: { type: "string" },
                            role: { type: "string", enum: ["user", "admin"] },
                            message: { type: "string" },
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
        security: [{ cookieAuth: [] }],
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
        security: [{ cookieAuth: [] }],
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
        summary: "Request password reset email",
        description:
          "Sends a password-reset link to the given email address if it belongs to a registered user. " +
          "Always returns success to prevent email enumeration. " +
          "The link contains a signed JWT that expires in **1 hour** and is automatically invalidated once the password is changed.",
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

    "/api/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password with token",
        description:
          "Accepts the JWT token from the reset email and a new password. " +
          "The token is validated and the password is updated. " +
          "The token is single-use — once the password changes, the old token is invalidated.",
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
        description: "Returns the full profile of the currently authenticated user including payoutInfo and payment status.",
        security: [{ cookieAuth: [] }],
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
          "Updates the authenticated user's username, email, and/or payout info. " +
          "All fields are optional — only provided fields are updated. " +
          "Username and email are checked for uniqueness.",
        security: [{ cookieAuth: [] }],
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
        security: [{ cookieAuth: [] }],
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
        security: [{ cookieAuth: [] }],
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
        security: [{ cookieAuth: [] }],
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
        security: [{ cookieAuth: [] }],
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
        security: [{ cookieAuth: [] }],
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
        security: [{ cookieAuth: [] }],
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
        security: [{ cookieAuth: [] }],
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
        security: [{ cookieAuth: [] }],
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
  },
};

export default spec;

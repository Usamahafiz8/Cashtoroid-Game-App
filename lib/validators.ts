import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(100),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6).regex(/^\d{6}$/, "OTP must be 6 digits"),
  newPassword: z.string().min(6).max(100),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6).regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores")
    .optional(),
  email: z.string().email().optional(),
  paypalEmail: z.string().email("Must be a valid PayPal email").optional().nullable(),
  payoutInfo: z.string().max(1000).optional().nullable(),
});

export const updateVideoSchema = z.object({
  title: z.string().max(200).optional(),
});

export const updateRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
});

export const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export const videoSubmitSchema = z.object({
  url: z.string().url(),
  platform: z.enum(["youtube", "tiktok", "instagram"]),
  title: z.string().max(200).optional(),
});

export const updateStatusSchema = z.object({
  videoId: z.string().cuid(),
  status: z.enum(["approved", "rejected"]),
  flagReason: z.string().optional(),
});

export const manualViewsSchema = z.object({
  videoId: z.string().cuid(),
  views: z.number().int().min(0),
});

export const markPaidSchema = z.object({
  userId: z.string().cuid(),
});

// ── Leaderboard ──────────────────────────────────────────────────────────────
export const leaderboardConfigSchema = z.object({
  periodHours: z.number().int().min(1).max(8760),
  triggerReset: z.boolean().optional(),
});

// ── Prize Pool ───────────────────────────────────────────────────────────────
export const prizePoolSchema = z
  .object({
    totalAmount: z.number().min(0),
    currency: z.string().max(10).optional(),
    tiers: z
      .array(
        z.object({
          rank: z.number().int().positive(),
          amount: z.number().min(0),
        })
      )
      .optional(),
    description: z.string().max(1000).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.tiers && val.tiers.length > 0) {
      const sum = val.tiers.reduce((s, t) => s + t.amount, 0);
      // Compare in cents to avoid floating-point drift.
      if (Math.round(sum * 100) !== Math.round(val.totalAmount * 100)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Prize tiers total ${sum} but the pool total is ${val.totalAmount}; they must match exactly.`,
          path: ["tiers"],
        });
      }
    }
  });

// ── Cashout ───────────────────────────────────────────────────────────────────
export const cashoutRequestSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().max(10).optional(),
  paypalEmail: z.string().email("Must be a valid PayPal email").optional(),
  payoutInfo: z.string().max(1000).optional(),
});

export const transactionReviewSchema = z.object({
  adminNote: z.string().max(1000).optional(),
});

// ── Challenge ─────────────────────────────────────────────────────────────────
export const challengeSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(20000),
    rules: z.string().max(20000),
    guidelines: z.string().max(20000).optional().nullable(),
    isActive: z.boolean().optional(),
    // Accept any ISO-ish datetime string (with or without timezone/seconds).
    startDate: z.string().datetime({ offset: true }).optional().nullable(),
    endDate: z.string().datetime({ offset: true }).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.startDate && val.endDate && new Date(val.endDate) < new Date(val.startDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be on or after the start date.",
        path: ["endDate"],
      });
    }
  });

// ── Avatar ────────────────────────────────────────────────────────────────────
export const avatarSchema = z.object({
  avatarUrl: z.string().url().max(2000),
});

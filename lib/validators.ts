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
  token: z.string().min(1),
  newPassword: z.string().min(6).max(100),
});

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores")
    .optional(),
  email: z.string().email().optional(),
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

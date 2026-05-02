import { z } from "zod";

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

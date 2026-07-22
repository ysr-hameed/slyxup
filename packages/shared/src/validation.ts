import { z } from "zod";

export const emailSchema = z.string().email().max(255);
export const passwordSchema = z.string().min(8).max(128);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string(),
  platform: z.string().optional(),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1).max(100).optional(),
  platform: z.string().optional(),
});

export const sendEmailSchema = z.object({
  to: z.array(z.string().email()),
  subject: z.string().min(1).max(998),
  html: z.string().optional(),
  text: z.string().optional(),
  template: z.string().optional(),
  data: z.record(z.unknown()).optional(),
});

export const createCheckoutSchema = z.object({
  plan_id: z.string(),
  user_id: z.string(),
  platform: z.string(),
  success_url: z.string().url(),
  cancel_url: z.string().url(),
});

export const trackEventSchema = z.object({
  name: z.string().min(1).max(100),
  user_id: z.string().optional(),
  platform: z.string(),
  properties: z.record(z.unknown()).optional(),
});

export const uploadFileSchema = z.object({
  key: z.string().min(1).max(500),
  user_id: z.string().optional(),
  platform: z.string(),
});

export function apiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
  });
}

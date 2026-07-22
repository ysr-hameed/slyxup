import { z } from "zod";

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema?: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema ? dataSchema.optional() : z.unknown().optional(),
    error: z.string().optional(),
  });

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
});

export const successResponseSchema = z.object({
  success: z.literal(true),
});

export const paginationSchema = z.object({
  limit: z.coerce.number().optional(),
  offset: z.coerce.number().optional(),
});

export const jwtHeaderSchema = z.object({
  authorization: z.string().describe("Bearer <jwt>"),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().max(100).optional(),
  platform: z.string().default("default"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  platform: z.string().optional(),
});

export const checkoutSchema = z.object({
  priceId: z.string(),
  userId: z.string(),
  platform: z.string().optional(),
  returnUrl: z.string().optional(),
});

export const portalSchema = z.object({
  customerId: z.string(),
  returnUrl: z.string().optional(),
});

export const subscriptionQuerySchema = z.object({
  userId: z.string(),
  platform: z.string().optional(),
});

export const adminRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  secret: z.string(),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

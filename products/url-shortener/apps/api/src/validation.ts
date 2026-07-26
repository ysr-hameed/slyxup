import { z } from "zod";

const BLOCKED_DOMAINS = [
  "malware.example", "phishing.example",
];

const BLOCKED_PATTERNS = [
  /^javascript:/i,
  /^data:/i,
  /^vbscript:/i,
];

export const createUrlSchema = z.object({
  url: z.string().min(1).max(2048).refine((val) => {
    try {
      const url = new URL(val);
      if (!["http:", "https:"].includes(url.protocol)) return false;
      if (BLOCKED_DOMAINS.includes(url.hostname)) return false;
      if (BLOCKED_PATTERNS.some((p) => p.test(val))) return false;
      return true;
    } catch {
      return false;
    }
  }, { message: "Invalid or disallowed URL" }),
  slug: z.string().regex(/^[a-z0-9]{4,12}$/).optional(),
  title: z.string().max(200).optional(),
});

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateUrlInput = z.infer<typeof createUrlSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;

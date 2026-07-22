import type { Context } from "hono";

export interface AuthUser {
  sub: string;
  email: string;
  platform_id: string;
}

export interface AuthContext extends Context {
  get(key: "userId"): string;
  get(key: "userEmail"): string;
  get(key: "platform"): string;
}

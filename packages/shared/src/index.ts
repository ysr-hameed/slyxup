export {
  generateKey,
  generateId,
  generatePublishableKey,
  generateSecretKey,
} from "./utils/keys";
export { validateRedirectUrl, validateOrigin } from "./utils/urls";
export { createAppSchema } from "./validators";
export type Provider = "google" | "github";

export interface Application {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  allowedOrigins: string[];
  redirectUrls: string[];
  publishableKey: string;
  secretKey: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationInput {
  name: string;
  slug: string;
  domain?: string;
  allowedOrigins?: string[];
  redirectUrls?: string[];
  ownerId: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: AuthUser; session: AuthSession }
  | { status: "unauthenticated" };

export type Theme = "light" | "dark" | "system";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

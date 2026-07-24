type CorsOrigin = (origin: string, c: any) => boolean | string;

const ALLOWED_ORIGINS = [
  /^https:\/\/[a-z0-9-]+\.slyxup\.online$/,
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^https?:\/\/[a-z0-9-]+\.slyxup\.pages\.dev$/,
];

export function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_ORIGINS.some((pattern) => pattern.test(origin));
}

export function corsOrigin(origin: string, _c: unknown): string | null {
  if (!origin) return null;
  if (isAllowedOrigin(origin)) return origin;
  return null;
}

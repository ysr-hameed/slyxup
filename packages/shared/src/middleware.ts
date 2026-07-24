// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function requireApiKey(c: any, next: () => Promise<void>) {
  const key = c.req.header("X-API-Key");
  if (!key || key !== c.env?.API_KEY) {
    return c.json({ success: false, error: "Invalid or missing API key" }, 401);
  }
  return next();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function requireAdminKey(c: any, next: () => Promise<void>) {
  const key = c.req.header("X-Admin-Key");
  if (!key || key !== c.env?.ADMIN_KEY) {
    return c.json({ success: false, error: "Invalid or missing admin key" }, 401);
  }
  return next();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function requireJwt(c: any, next: () => Promise<void>) {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return c.json({ success: false, error: "Missing authorization header" }, 401);
  }
  return next();
}

import { SignJWT, jwtVerify } from "jose";

export async function signToken(
  payload: { sub: string; email: string; platform?: string },
  secret: string,
  expiresIn: number = 86400,
): Promise<string> {
  const key = new TextEncoder().encode(secret);
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .sign(key);
}

export async function verifyToken(
  token: string,
  secret: string,
): Promise<{ sub: string; email: string; platform: string } | null> {
  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key);
    return { sub: payload.sub as string, email: payload.email as string, platform: (payload.platform as string) || "default" };
  } catch {
    return null;
  }
}

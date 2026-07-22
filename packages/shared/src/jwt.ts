import type { JwtPayload } from "./types";

function base64UrlEncode(data: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(data)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

async function hmacSha256(secret: string, data: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret).buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", key, encoder.encode(data).buffer as ArrayBuffer);
}

export async function signToken(
  payload: Omit<JwtPayload, "iat" | "exp">,
  secret: string,
  expiresIn: number,
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = { ...payload, iat: now, exp: now + expiresIn };
  const headerEncoded = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)).buffer as ArrayBuffer);
  const payloadEncoded = base64UrlEncode(new TextEncoder().encode(JSON.stringify(tokenPayload)).buffer as ArrayBuffer);
  const signature = await hmacSha256(secret, `${headerEncoded}.${payloadEncoded}`);
  return `${headerEncoded}.${payloadEncoded}.${base64UrlEncode(signature)}`;
}

export async function verifyToken(token: string, secret: string): Promise<JwtPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const headerEncoded = parts[0]!;
  const payloadEncoded = parts[1]!;
  const signatureEncoded = parts[2]!;
  const signature = await hmacSha256(secret, `${headerEncoded}.${payloadEncoded}`);
  const expected = base64UrlEncode(signature);
  if (expected !== signatureEncoded) return null;
  try {
    const decoded = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(payloadEncoded)),
    ) as JwtPayload;
    if (decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}

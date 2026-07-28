function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateKey(prefix: string): string {
  return `${prefix}_${randomHex(24)}`;
}

export function generatePublishableKey(slug: string): string {
  return generateKey(`pk_${slug}`);
}

export function generateSecretKey(slug: string): string {
  return generateKey(`sk_${slug}`);
}

export function generateId(prefix: string): string {
  return `${prefix}_${randomHex(16)}`;
}

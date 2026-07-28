const ALGORITHM = 'AES-GCM'
const IV_LENGTH = 16
const SALT_LENGTH = 32
const KEY_LENGTH = 32
const PBKDF2_ITERATIONS = 100000

function toArrayBuffer(buf: Uint8Array): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b!.toString(16).padStart(2, '0')).join('')
}

function hexToBytes(hex: string): Uint8Array {
  const len = Math.floor(hex.length / 2)
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    const idx = i * 2
    bytes[i] = parseInt(hex.substring(idx, idx + 2), 16)
  }
  return bytes
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary)
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) result |= (a[i] ?? 0) ^ (b[i] ?? 0)
  return result === 0
}

async function deriveBits(secret: string, salt: Uint8Array, bitLength: number): Promise<ArrayBuffer> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', toArrayBuffer(new TextEncoder().encode(secret)),
    'PBKDF2', false, ['deriveBits']
  )
  return await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: toArrayBuffer(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial, bitLength
  )
}

export async function derivePurposeKey(secretKey: string, purpose: string): Promise<string> {
  const keyBytes = base64ToBytes(secretKey)
  const key = await crypto.subtle.importKey(
    'raw', toArrayBuffer(keyBytes),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const signature = await crypto.subtle.sign(
    'HMAC', key, new TextEncoder().encode(purpose)
  )
  return bytesToBase64(new Uint8Array(signature))
}

export async function encrypt(plaintext: string, secretKey: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const rawKey = await deriveBits(secretKey, salt, KEY_LENGTH * 8)
  const key = await crypto.subtle.importKey('raw', rawKey, { name: ALGORITHM }, false, ['encrypt'])
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: toArrayBuffer(iv), tagLength: 128 },
    key, toArrayBuffer(new TextEncoder().encode(plaintext))
  )
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(encrypted), salt.length + iv.length)
  return bytesToBase64(combined)
}

export async function decrypt(ciphertext: string, secretKey: string): Promise<string> {
  const data = base64ToBytes(ciphertext)
  const salt = data.slice(0, SALT_LENGTH)
  const iv = data.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const encrypted = data.slice(SALT_LENGTH + IV_LENGTH)
  const rawKey = await deriveBits(secretKey, salt, KEY_LENGTH * 8)
  const key = await crypto.subtle.importKey('raw', rawKey, { name: ALGORITHM }, false, ['decrypt'])
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: toArrayBuffer(iv), tagLength: 128 },
    key, toArrayBuffer(encrypted)
  )
  return new TextDecoder().decode(decrypted)
}

export async function hashWithSalt(data: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const hash = new Uint8Array(await deriveBits(data, salt, 256))
  return `${bytesToHex(salt)}:${bytesToHex(hash)}`
}

export async function verifyHash(data: string, stored: string): Promise<boolean> {
  try {
    const [saltHex, hashHex] = stored.split(':')
    if (!saltHex || !hashHex) return false
    const salt = hexToBytes(saltHex)
    const storedHash = hexToBytes(hashHex)
    const hash = new Uint8Array(await deriveBits(data, salt, storedHash.length * 8))
    return constantTimeEqual(hash, storedHash)
  } catch { return false }
}

export async function hashToken(token: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return bytesToHex(new Uint8Array(hash))
}

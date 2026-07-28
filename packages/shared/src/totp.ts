const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const TOTP_INTERVAL_MS = 30000
const TOTP_WINDOW = 2
const BACKUP_CODE_COUNT = 10
const BACKUP_CODE_MIN = 100000
const BACKUP_CODE_MAX = 900000
const PBKDF2_ITERATIONS = 100000
const PBKDF2_KEY_LENGTH = 32
const SALT_LENGTH_BYTES = 32

function base32Encode(buffer: Uint8Array): string {
  let bits = ''
  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, '0')
  }
  let result = ''
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5)
    result += BASE32_CHARS[parseInt(chunk, 2)]
  }
  const remainder = bits.length % 5
  if (remainder > 0) {
    const chunk = bits.slice(bits.length - remainder).padEnd(5, '0')
    result += BASE32_CHARS[parseInt(chunk, 2)]
  }
  return result
}

function base32Decode(secret: string): Uint8Array {
  const cleanSecret = secret.replace(/[\s=]/g, '').toUpperCase()
  let bits = ''
  for (const char of cleanSecret) {
    const index = BASE32_CHARS.indexOf(char)
    if (index === -1) continue
    bits += index.toString(2).padStart(5, '0')
  }
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2))
  }
  return new Uint8Array(bytes)
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

function toArrayBuffer(buf: Uint8Array): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}

async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', toArrayBuffer(key),
    { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, toArrayBuffer(message))
  return new Uint8Array(sig)
}

async function computeTOTP(secret: string, timestamp?: number): Promise<string> {
  const time = timestamp ?? Date.now()
  const counter = Math.floor(time / TOTP_INTERVAL_MS)
  const key = base32Decode(secret)
  const counterBytes = new Uint8Array(8)
  let counterValue = counter
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = counterValue & 0xff
    counterValue = Math.floor(counterValue / 256)
  }
  const hash = await hmacSha1(key, counterBytes)
  const lastByte = hash[hash.length - 1]
  const offset = lastByte === undefined ? 0 : lastByte & 0x0f
  const b0 = hash[offset]
  const b1 = hash[offset + 1]
  const b2 = hash[offset + 2]
  const b3 = hash[offset + 3]
  const truncated =
    ((b0 !== undefined ? b0 & 0x7f : 0) << 24) |
    ((b1 !== undefined ? b1 & 0xff : 0) << 16) |
    ((b2 !== undefined ? b2 & 0xff : 0) << 8) |
    (b3 !== undefined ? b3 & 0xff : 0)
  const otp = truncated % 1000000
  return otp.toString().padStart(6, '0')
}

export async function verifyTOTP(secret: string, token: string, window: number = TOTP_WINDOW): Promise<boolean> {
  const now = Date.now()
  for (let i = -window; i <= window; i++) {
    const time = now + (i * TOTP_INTERVAL_MS)
    const expected = await computeTOTP(secret, time)
    if (expected === token) return true
  }
  return false
}

export function generateTOTPSecret(): string {
  const buffer = new Uint8Array(20)
  crypto.getRandomValues(buffer)
  return base32Encode(buffer)
}

export function generateQRCodeURL(email: string, secret: string): string {
  return `otpauth://totp/Slyxup:${encodeURIComponent(email)}?secret=${encodeURIComponent(secret)}&issuer=Slyxup&algorithm=SHA1&digits=6&period=30`
}

export function generateBackupCodes(count: number = BACKUP_CODE_COUNT): string[] {
  const codes: string[] = []
  const values = new Uint32Array(count)
  crypto.getRandomValues(values)
  for (let i = 0; i < count; i++) {
    codes.push((BACKUP_CODE_MIN + ((values[i] ?? 0) % BACKUP_CODE_MAX)).toString())
  }
  return codes
}

export interface HashedBackupCodes {
  hashedCodes: string[]
  salt: string
}

export async function generateHashedBackupCodes(codes: string[]): Promise<HashedBackupCodes> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES))
  const saltHex = bytesToHex(salt)
  const hashedCodes = await Promise.all(codes.map(async code => {
    const keyMaterial = await crypto.subtle.importKey(
      'raw', toArrayBuffer(new TextEncoder().encode(code)),
      'PBKDF2', false, ['deriveBits']
    )
    const hash = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: toArrayBuffer(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-512' },
      keyMaterial, PBKDF2_KEY_LENGTH * 8
    )
    return `${saltHex}:${bytesToHex(new Uint8Array(hash))}`
  }))
  return { hashedCodes, salt: saltHex }
}

export async function verifyBackupCode(stored: HashedBackupCodes, providedCode: string): Promise<{ valid: boolean; remainingCodes: HashedBackupCodes }> {
  if (!stored.hashedCodes || stored.hashedCodes.length === 0) {
    return { valid: false, remainingCodes: stored }
  }
  let foundIndex = -1
  for (let i = 0; i < stored.hashedCodes.length; i++) {
    const parts = (stored.hashedCodes[i] ?? "").split(':')
    const saltHex = parts[0] ?? ""
    const storedHashHex = parts[1] ?? ""
    const salt = hexToBytes(saltHex)
    const keyMaterial = await crypto.subtle.importKey(
      'raw', toArrayBuffer(new TextEncoder().encode(providedCode)),
      'PBKDF2', false, ['deriveBits']
    )
    const hash = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: toArrayBuffer(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-512' },
      keyMaterial, PBKDF2_KEY_LENGTH * 8
    )
    const hashHex = bytesToHex(new Uint8Array(hash))
    if (hashHex === storedHashHex) { foundIndex = i; break }
  }
  if (foundIndex !== -1) {
    return {
      valid: true,
      remainingCodes: { hashedCodes: stored.hashedCodes.filter((_, i) => i !== foundIndex), salt: stored.salt }
    }
  }
  return { valid: false, remainingCodes: stored }
}

export function generateOTP(): string {
  const bytes = new Uint8Array(3)
  crypto.getRandomValues(bytes)
  const num = ((bytes[0] ?? 0) << 16) | ((bytes[1] ?? 0) << 8) | (bytes[2] ?? 0)
  return (num % 900000 + 100000).toString()
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): {
  valid: boolean;
  error?: string;
} {
  if (password.length < 8) return { valid: false, error: "Min 8 characters" };
  if (password.length > 128) return { valid: false, error: "Max 128 characters" };
  return { valid: true };
}

export function validateName(name: string): { valid: boolean; error?: string } {
  if (name.length < 1) return { valid: false, error: "Name is required" };
  if (name.length > 100) return { valid: false, error: "Max 100 characters" };
  return { valid: true };
}

import { describe, it, expect } from "vitest";
import { passwordSchema, emailSchema, loginSchema, registerSchema } from "../src/validation";

describe("emailSchema", () => {
  it("accepts valid emails", () => {
    expect(emailSchema.safeParse("test@example.com").success).toBe(true);
    expect(emailSchema.safeParse("user+tag@slyxup.online").success).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(emailSchema.safeParse("notanemail").success).toBe(false);
    expect(emailSchema.safeParse("").success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("accepts strong passwords", () => {
    expect(passwordSchema.safeParse("StrongPass1").success).toBe(true);
    expect(passwordSchema.safeParse("aBcDefg1").success).toBe(true);
  });

  it("rejects weak passwords", () => {
    expect(passwordSchema.safeParse("short1A").success).toBe(false);
    expect(passwordSchema.safeParse("nouppercase1").success).toBe(false);
    expect(passwordSchema.safeParse("NOLOWERCASE1").success).toBe(false);
    expect(passwordSchema.safeParse("NoNumber!").success).toBe(false);
    expect(passwordSchema.safeParse("").success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid login", () => {
    const result = loginSchema.safeParse({ email: "test@test.com", password: "any" });
    expect(result.success).toBe(true);
  });

  it("rejects missing fields", () => {
    expect(loginSchema.safeParse({}).success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts valid registration", () => {
    const result = registerSchema.safeParse({ email: "test@test.com", password: "StrongPass1", name: "Test" });
    expect(result.success).toBe(true);
  });

  it("rejects weak password", () => {
    const result = registerSchema.safeParse({ email: "test@test.com", password: "weak" });
    expect(result.success).toBe(false);
  });

  it("name is optional", () => {
    const result = registerSchema.safeParse({ email: "test@test.com", password: "StrongPass1" });
    expect(result.success).toBe(true);
  });
});

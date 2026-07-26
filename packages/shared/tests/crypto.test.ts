import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, generateToken, generateId } from "../src/crypto";

describe("generateToken", () => {
  it("returns a 64-char hex string", () => {
    const token = generateToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces unique values", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
  });
});

describe("generateId", () => {
  it("returns a 32-char hex string", () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe("hashPassword / verifyPassword", () => {
  it("hashes and verifies correctly", async () => {
    const hash = await hashPassword("TestPass123");
    expect(hash).toContain(":");
    expect(await verifyPassword("TestPass123", hash)).toBe(true);
    expect(await verifyPassword("WrongPass", hash)).toBe(false);
  });

  it("produces different hashes for same password", async () => {
    const a = await hashPassword("SamePass1");
    const b = await hashPassword("SamePass1");
    expect(a).not.toBe(b);
  });

  it("rejects malformed stored hash", async () => {
    expect(await verifyPassword("test", "invalid")).toBe(false);
    expect(await verifyPassword("test", "onlyonepart")).toBe(false);
  });
});

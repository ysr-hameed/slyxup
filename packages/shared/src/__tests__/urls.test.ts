import { describe, it, expect } from "vitest";
import { validateRedirectUrl, validateOrigin } from "../utils/urls";

describe("validateRedirectUrl", () => {
  it("should match when URL is in the allowed list", () => {
    const result = validateRedirectUrl("https://example.com/callback", [
      "https://example.com",
    ]);
    expect(result).toBe(true);
  });

  it("should reject when URL is not in the allowed list", () => {
    const result = validateRedirectUrl("https://evil.com/callback", [
      "https://example.com",
    ]);
    expect(result).toBe(false);
  });

  it("should reject when the protocol differs", () => {
    const result = validateRedirectUrl("http://example.com/callback", [
      "https://example.com",
    ]);
    expect(result).toBe(false);
  });

  it("should accept when port matches", () => {
    const result = validateRedirectUrl("http://localhost:3000/callback", [
      "http://localhost:3000",
    ]);
    expect(result).toBe(true);
  });

  it("should reject when port differs", () => {
    const result = validateRedirectUrl("http://localhost:4000/callback", [
      "http://localhost:3000",
    ]);
    expect(result).toBe(false);
  });

  it("should return false for malformed URLs", () => {
    const result = validateRedirectUrl("not-a-url", ["https://example.com"]);
    expect(result).toBe(false);
  });
});

describe("validateOrigin", () => {
  it("should match exact origin", () => {
    expect(
      validateOrigin("https://example.com", ["https://example.com"]),
    ).toBe(true);
  });

  it("should reject different origin", () => {
    expect(
      validateOrigin("https://evil.com", ["https://example.com"]),
    ).toBe(false);
  });

  it("should accept wildcard", () => {
    expect(
      validateOrigin("https://anything.com", ["*"]),
    ).toBe(true);
  });

  it("should reject malformed origin", () => {
    expect(
      validateOrigin("", ["https://example.com"]),
    ).toBe(false);
  });

  it("should match when path is present on allowed origin", () => {
    expect(
      validateOrigin("https://example.com/app", ["https://example.com"]),
    ).toBe(true);
  });
});

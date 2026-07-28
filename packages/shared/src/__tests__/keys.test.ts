import { describe, it, expect } from "vitest";
import { generateKey, generateId, generatePublishableKey, generateSecretKey } from "../utils/keys";

describe("generateKey", () => {
  it("should return a key with the given prefix", () => {
    const key = generateKey("prefix");
    expect(key).toMatch(/^prefix_[a-f0-9]+$/);
  });

  it("should produce different keys on successive calls", () => {
    const a = generateKey("prefix");
    const b = generateKey("prefix");
    expect(a).not.toBe(b);
  });
});

describe("generateId", () => {
  it("should return an id with prefix followed by 16 hex bytes (32 chars)", () => {
    const id = generateId("app");
    expect(id).toMatch(/^app_[a-f0-9]{32}$/);
  });

  it("should produce unique ids on successive calls", () => {
    const a = generateId("app");
    const b = generateId("app");
    expect(a).not.toBe(b);
  });
});

describe("generatePublishableKey", () => {
  it("should prefix with pk_<slug>", () => {
    const key = generatePublishableKey("my-app");
    expect(key).toMatch(/^pk_my-app_[a-f0-9]{48}$/);
  });
});

describe("generateSecretKey", () => {
  it("should prefix with sk_<slug>", () => {
    const key = generateSecretKey("my-app");
    expect(key).toMatch(/^sk_my-app_[a-f0-9]{48}$/);
  });

  it("should produce different keys for different slugs", () => {
    const a = generateSecretKey("app-one");
    const b = generateSecretKey("app-two");
    expect(a).not.toBe(b);
  });
});

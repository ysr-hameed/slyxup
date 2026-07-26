import { describe, it, expect } from "vitest";
import { signToken, verifyToken } from "../src/jwt";

const SECRET = "test-secret-key-for-testing";

describe("signToken", () => {
  it("returns a three-part JWT", async () => {
    const token = await signToken({ sub: "user1", email: "test@test.com", platform_id: "" }, SECRET, 3600);
    const parts = token.split(".");
    expect(parts).toHaveLength(3);
  });
});

describe("verifyToken", () => {
  it("verifies a valid token", async () => {
    const token = await signToken({ sub: "user1", email: "test@test.com", platform_id: "" }, SECRET, 3600);
    const payload = await verifyToken(token, SECRET);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe("user1");
    expect(payload!.email).toBe("test@test.com");
  });

  it("rejects expired token", async () => {
    const token = await signToken({ sub: "user1", email: "test@test.com", platform_id: "" }, SECRET, -1);
    const payload = await verifyToken(token, SECRET);
    expect(payload).toBeNull();
  });

  it("rejects token with wrong secret", async () => {
    const token = await signToken({ sub: "user1", email: "test@test.com", platform_id: "" }, SECRET, 3600);
    const payload = await verifyToken(token, "wrong-secret");
    expect(payload).toBeNull();
  });

  it("rejects malformed token", async () => {
    expect(await verifyToken("invalid.token", SECRET)).toBeNull();
    expect(await verifyToken("a.b.c.d", SECRET)).toBeNull();
  });
});

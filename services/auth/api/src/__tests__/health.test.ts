import { describe, it, expect } from "vitest";
import app from "../index";
import { request } from "./setup";

describe("GET /api/health", () => {
  it("should return 200 with status ok", async () => {
    const res = await request(app, "/api/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok", service: "slyxauth" });
  });

  it("should return JSON content type", async () => {
    const res = await request(app, "/api/health");
    expect(res.headers.get("content-type")).toMatch(/application\/json/);
  });
});

describe("CORS headers", () => {
  it("should set CORS headers on GET", async () => {
    const res = await request(app, "/api/health", {
      headers: { origin: "http://localhost:3000" },
    });
    expect(res.headers.get("access-control-allow-origin")).toBeTruthy();
    expect(res.headers.get("access-control-allow-credentials")).toBe("true");
  });

  it("should include allow methods on OPTIONS", async () => {
    const res = await request(app, "/api/health", {
      method: "OPTIONS",
      headers: { origin: "http://localhost:3000" },
    });
    const methods = res.headers.get("access-control-allow-methods");
    expect(methods).toContain("GET");
    expect(methods).toContain("POST");
  });

  it("should allow configured origins", async () => {
    const res = await request(app, "/api/health", {
      headers: { origin: "http://localhost:3000" },
    });
    expect(res.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:3000",
    );
  });

  it("should reject disallowed origins", async () => {
    const res = await request(app, "/api/health", {
      headers: { origin: "https://evil.com" },
    });
    expect(res.headers.get("access-control-allow-origin")).not.toBe(
      "https://evil.com",
    );
  });
});

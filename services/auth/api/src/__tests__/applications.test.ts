import { describe, it, expect, afterEach } from "vitest";
import app from "../index";
import { request, withAuth, withoutAuth } from "./setup";

describe("POST /api/applications", () => {
  afterEach(() => withoutAuth());

  it("should return 401 without session", async () => {
    const res = await request(app, "/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test App", slug: "test-app" }),
    });
    expect(res.status).toBe(401);
  });

  it("should return 400 for invalid data", async () => {
    const auth = withAuth();
    const res = await request(app, "/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: auth.cookie },
      body: JSON.stringify({ name: "X", slug: "" }),
    });
    expect(res.status).toBe(400);
  });

  it("should return 400 for missing slug", async () => {
    const auth = withAuth();
    const res = await request(app, "/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: auth.cookie },
      body: JSON.stringify({ name: "Valid Name" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/applications", () => {
  afterEach(() => withoutAuth());

  it("should return 401 without session", async () => {
    const res = await request(app, "/api/applications");
    expect(res.status).toBe(401);
  });

  it("should return 200 with auth", async () => {
    const auth = withAuth();
    const res = await request(app, "/api/applications", {
      headers: { cookie: auth.cookie },
    });
    expect(res.status).toBe(200);
  });
});

describe("GET /api/applications/:id", () => {
  afterEach(() => withoutAuth());

  it("should return 401 without session", async () => {
    const res = await request(app, "/api/applications/app_123");
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/applications/:id", () => {
  afterEach(() => withoutAuth());

  it("should return 401 without session", async () => {
    const res = await request(app, "/api/applications/app_123", {
      method: "DELETE",
    });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/applications/:id/reveal-secret", () => {
  afterEach(() => withoutAuth());

  it("should return 401 without session", async () => {
    const res = await request(app, "/api/applications/app_123/reveal-secret", {
      method: "POST",
    });
    expect(res.status).toBe(401);
  });
});

import { describe, it, expect, afterEach } from "vitest";
import app from "../index";
import { request, withAuth, withoutAuth } from "./setup";

describe("GET /api/admin/users", () => {
  afterEach(() => withoutAuth());

  it("should return 401 without session", async () => {
    const res = await request(app, "/api/admin/users");
    expect(res.status).toBe(401);
  });

  it("should return 200 with auth", async () => {
    const auth = withAuth();
    const res = await request(app, "/api/admin/users", {
      headers: { cookie: auth.cookie },
    });
    expect(res.status).toBe(200);
  });
});

describe("GET /api/admin/users/:id", () => {
  afterEach(() => withoutAuth());

  it("should return 401 without session", async () => {
    const res = await request(app, "/api/admin/users/user_123");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/admin/sessions", () => {
  afterEach(() => withoutAuth());

  it("should return 401 without session", async () => {
    const res = await request(app, "/api/admin/sessions");
    expect(res.status).toBe(401);
  });

  it("should return 200 with auth", async () => {
    const auth = withAuth();
    const res = await request(app, "/api/admin/sessions", {
      headers: { cookie: auth.cookie },
    });
    expect(res.status).toBe(200);
  });
});

describe("GET /api/admin/audit-logs", () => {
  afterEach(() => withoutAuth());

  it("should return 401 without session", async () => {
    const res = await request(app, "/api/admin/audit-logs");
    expect(res.status).toBe(401);
  });

  it("should return 200 with auth", async () => {
    const auth = withAuth();
    const res = await request(app, "/api/admin/audit-logs", {
      headers: { cookie: auth.cookie },
    });
    expect(res.status).toBe(200);
  });
});

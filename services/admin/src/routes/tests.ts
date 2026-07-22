import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AdminEnv } from "@slyxup/shared-types";
import { generateId, apiResponseSchema } from "@slyxup/shared-utils";
import { createAdminDb, adminSchema, testSchema } from "@slyxup/shared-db";
import { desc, eq } from "drizzle-orm";
import { logger } from "@slyxup/shared-logger";
import { adminAuthMiddleware } from "../middleware/adminAuth";
import type { Context, Next } from "hono";

const route = new OpenAPIHono<{ Bindings: AdminEnv }>();

route.use("*", adminAuthMiddleware as (c: Context, next: Next) => Promise<Response | void>);

const testCaseSchema = z.object({
  name: z.string(),
  endpoint: z.string(),
  method: z.string(),
  body: z.any().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  expectStatus: z.number(),
  expectSuccess: z.boolean().optional(),
});

const testResultSchema = z.object({
  test_name: z.string(),
  passed: z.boolean(),
  response_status: z.number().nullable(),
  response_body: z.string().nullable(),
  error: z.string().nullable(),
});

const summarySchema = z.object({
  passed: z.boolean(),
  total: z.number(),
  passedCount: z.number(),
});

async function runTest(c: { env: AdminEnv }, tc: z.infer<typeof testCaseSchema>): Promise<{ passed: boolean; status: number; body: unknown; error: string | null }> {
  try {
    const url = `${tc.endpoint}`;
    const headers: Record<string, string> = { "Content-Type": "application/json", ...tc.headers };
    const res = await fetch(url, {
      method: tc.method,
      headers,
      body: tc.body ? JSON.stringify(tc.body) : undefined,
    });
    const status = res.status;
    let body: unknown;
    try { body = await res.json(); } catch { body = await res.text(); }
    const bodyObj = body as Record<string, unknown>;
    const passed = status === tc.expectStatus && (tc.expectSuccess === undefined || bodyObj?.success === tc.expectSuccess);
    return { passed, status, body, error: passed ? null : `Expected status ${tc.expectStatus}, got ${status}` };
  } catch (err) {
    return { passed: false, status: 0, body: null, error: err instanceof Error ? err.message : String(err) };
  }
}

const authTestRoute = createRoute({
  method: "post",
  path: "/auth",
  summary: "Run auth integration tests",
  tags: ["Admin"],
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: apiResponseSchema(z.object({
            results: z.array(testResultSchema),
            summary: summarySchema,
          })),
        },
      },
      description: "Test results",
    },
    401: { description: "Unauthorized" },
  },
});

route.openapi(authTestRoute, async (c) => {
  const db = createAdminDb(c.env.DB);
  const adminId = (c as any).get("adminId");
  const base = c.env.AUTH_URL;
  const testEmail = `test-${Date.now()}@slyxup-test.com`;
  const testPassword = "TestPass123!";
  const results: Array<z.infer<typeof testResultSchema>> = [];

  const testPlatform = "test-platform";
  const tests: z.infer<typeof testCaseSchema>[] = [
    { name: "register", endpoint: `${base}/register`, method: "POST", body: { email: testEmail, password: testPassword, platform: testPlatform }, expectStatus: 201, expectSuccess: true },
    { name: "register_duplicate", endpoint: `${base}/register`, method: "POST", body: { email: testEmail, password: testPassword, platform: testPlatform }, expectStatus: 409, expectSuccess: false },
    { name: "login", endpoint: `${base}/login`, method: "POST", body: { email: testEmail, password: testPassword, platform: testPlatform }, expectStatus: 200, expectSuccess: true },
  ];

  let jwt = "";
  for (const tc of tests) {
    const r = await runTest(c, tc);
    results.push({ test_name: tc.name, passed: r.passed, response_status: r.status, response_body: r.body ? JSON.stringify(r.body) : null, error: r.error });
    if (!r.passed) continue;
    const bodyData = r.body as Record<string, unknown>;
    if (tc.name === "login") jwt = ((bodyData?.data as Record<string, unknown>)?.jwt as string) || "";
  }

  if (jwt) {
    const authedTests: z.infer<typeof testCaseSchema>[] = [
      { name: "verify", endpoint: `${base}/verify`, method: "GET", headers: { Authorization: `Bearer ${jwt}` }, expectStatus: 200, expectSuccess: true },
      { name: "me", endpoint: `${base}/me`, method: "GET", headers: { Authorization: `Bearer ${jwt}` }, expectStatus: 200, expectSuccess: true },
      { name: "verify_bad_token", endpoint: `${base}/verify`, method: "GET", headers: { Authorization: "Bearer invalid" }, expectStatus: 401, expectSuccess: false },
      { name: "me_no_auth", endpoint: `${base}/me`, method: "GET", expectStatus: 401, expectSuccess: false },
    ];
    for (const tc of authedTests) {
      const r = await runTest(c, tc);
      results.push({ test_name: tc.name, passed: r.passed, response_status: r.status, response_body: r.body ? JSON.stringify(r.body) : null, error: r.error });
    }
  }

  const allPassed = results.every((r) => r.passed);

  const testRunId = generateId();
  for (const r of results) {
    await db.insert(testSchema.testResults).values({
      id: generateId(),
      testName: r.test_name,
      endpoint: "auth",
      passed: r.passed,
      responseStatus: r.response_status ?? null,
      responseBody: r.response_body,
      error: r.error,
    }).run();
  }

  await db.insert(adminSchema.auditLogs).values({
    id: generateId(),
    adminId,
    action: "run_tests",
    resource: "test_auth",
    details: JSON.stringify({ passed: allPassed, total: results.length, passedCount: results.filter((r) => r.passed).length }),
  }).run();

  logger.info("auth_tests_completed", { adminId, allPassed, total: results.length });

  return c.json({
    success: true,
    data: { results, summary: { passed: allPassed, total: results.length, passedCount: results.filter((r) => r.passed).length } },
  });
});

const paymentTestRoute = createRoute({
  method: "post",
  path: "/payment",
  summary: "Run payment integration tests",
  tags: ["Admin"],
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: apiResponseSchema(z.object({
            results: z.array(testResultSchema),
            summary: summarySchema,
          })),
        },
      },
      description: "Test results",
    },
    401: { description: "Unauthorized" },
  },
});

route.openapi(paymentTestRoute, async (c) => {
  const db = createAdminDb(c.env.DB);
  const adminId = (c as any).get("adminId");
  const base = c.env.PAYMENT_URL;
  const results: Array<z.infer<typeof testResultSchema>> = [];

  const tests: z.infer<typeof testCaseSchema>[] = [
    { name: "checkout_missing_fields", endpoint: `${base}/checkout`, method: "POST", body: {}, expectStatus: 400, expectSuccess: false },
    { name: "subscription_missing_userId", endpoint: `${base}/subscription`, method: "GET", expectStatus: 400, expectSuccess: false },
    { name: "subscription_valid", endpoint: `${base}/subscription?userId=nonexistent&platform=test-platform`, method: "GET", expectStatus: 200, expectSuccess: true },
    { name: "portal_missing_customerId", endpoint: `${base}/portal`, method: "POST", body: {}, expectStatus: 400, expectSuccess: false },
    { name: "webhook_missing_signature", endpoint: `${base}/webhook`, method: "POST", body: { event_type: "transaction.completed" }, expectStatus: 400, expectSuccess: false },
  ];

  for (const tc of tests) {
    const r = await runTest(c, tc);
    results.push({ test_name: tc.name, passed: r.passed, response_status: r.status, response_body: r.body ? JSON.stringify(r.body) : null, error: r.error });
  }

  const allPassed = results.every((r) => r.passed);

  for (const r of results) {
    await db.insert(testSchema.testResults).values({
      id: generateId(),
      testName: r.test_name,
      endpoint: "payment",
      passed: r.passed,
      responseStatus: r.response_status ?? null,
      responseBody: r.response_body,
      error: r.error,
    }).run();
  }

  await db.insert(adminSchema.auditLogs).values({
    id: generateId(),
    adminId,
    action: "run_tests",
    resource: "test_payment",
    details: JSON.stringify({ passed: allPassed, total: results.length, passedCount: results.filter((r) => r.passed).length }),
  }).run();

  logger.info("payment_tests_completed", { adminId, allPassed, total: results.length });

  return c.json({
    success: true,
    data: { results, summary: { passed: allPassed, total: results.length, passedCount: results.filter((r) => r.passed).length } },
  });
});

const resultsRoute = createRoute({
  method: "get",
  path: "/results",
  summary: "Get test results",
  tags: ["Admin"],
  security: [{ Bearer: [] }],
  request: {
    query: z.object({ limit: z.coerce.number().optional() }),
  },
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.any()) } }, description: "Test results" },
    401: { description: "Unauthorized" },
  },
});

route.openapi(resultsRoute, async (c) => {
  const db = createAdminDb(c.env.DB);
  const limit = Math.min(Number(c.req.valid("query").limit) || 50, 200);
  const data = await db.select().from(testSchema.testResults).orderBy(desc(testSchema.testResults.runAt)).limit(limit).all();
  return c.json({ success: true, data });
});

const resultsByEndpointRoute = createRoute({
  method: "get",
  path: "/results/{endpoint}",
  summary: "Get test results by endpoint",
  tags: ["Admin"],
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ endpoint: z.string() }),
    query: z.object({ limit: z.coerce.number().optional() }),
  },
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.any()) } }, description: "Test results" },
    401: { description: "Unauthorized" },
  },
});

route.openapi(resultsByEndpointRoute, async (c) => {
  const { endpoint } = c.req.valid("param");
  const limit = Math.min(Number(c.req.valid("query").limit) || 50, 200);
  const db = createAdminDb(c.env.DB);
  const data = await db.select().from(testSchema.testResults).where(eq(testSchema.testResults.endpoint, endpoint)).orderBy(desc(testSchema.testResults.runAt)).limit(limit).all();
  return c.json({ success: true, data });
});

export default route;

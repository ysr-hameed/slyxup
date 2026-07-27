# @slyxup/logger

Structured JSON logger for Cloudflare Workers with a pre-built Hono error handler. Every log line is a single parseable JSON object.

## Installation

```bash
npm install @slyxup/logger
```

## Usage

```ts
import { logger, createHonoErrorHandler } from "@slyxup/logger";

// Log at different levels
logger.info("user_login", { userId: "abc123", email: "user@example.com" });
logger.warn("rate_limit_exceeded", { ip: "192.168.1.1", path: "/api/auth/login" });
logger.error("db_query_failed", { error: "timeout", query: "SELECT ..." });
logger.debug("request_duration", { ms: 42 });

// Hono error handler middleware
app.onError(createHonoErrorHandler());
```

## API

### `logger`

| Method | Level | Console Output | Use case |
|--------|-------|----------------|----------|
| `debug` | debug | `console.log` | Request timing, verbose internals |
| `info` | info | `console.log` | Business events (login, register, payment) |
| `warn` | warn | `console.warn` | Rate limits, deprecations, recoverable issues |
| `error` | error | `console.error` | DB failures, unhandled errors, unrecoverable state |

Each call outputs a single JSON line:

```json
{"level":"info","message":"user_login","timestamp":"2026-07-26T09:00:00.000Z","userId":"abc123","email":"user@example.com"}
```

All keys in the optional `meta` object are spread into the top-level JSON output alongside `level`, `message`, and `timestamp`.

### `createHonoErrorHandler()`

Returns a Hono `onError` handler that:
1. Logs the error with stack trace, request path, and method
2. Returns `{ success: false, error: "Internal server error" }` with status 500

```ts
import { createHonoErrorHandler } from "@slyxup/logger";

const app = new Hono();
app.onError(createHonoErrorHandler());
```

Works with `any` typed Hono `c` parameter — compatible with both typed and untyped Hono apps.

## Example Worker integration

```ts
import { Hono } from "hono";
import { logger, createHonoErrorHandler } from "@slyxup/logger";

const app = new Hono();

app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  logger.info("request", {
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration: Date.now() - start,
  });
});

app.onError(createHonoErrorHandler());
```

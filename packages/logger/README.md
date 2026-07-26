# @slyxup/logger

Structured JSON logger for Cloudflare Workers and serverless environments.

## Installation

```bash
npm install @slyxup/logger
```

## Usage

```ts
import { logger, createHonoErrorHandler } from "@slyxup/logger";

// Log at different levels
logger.info("user_login", { userId: "abc123", email: "user@example.com" });
logger.warn("rate_limit_exceeded", { ip: "192.168.1.1" });
logger.error("db_query_failed", { error: "timeout", query: "SELECT ..." });
logger.debug("request_duration", { ms: 42 });

// Hono error handler middleware
app.onError(createHonoErrorHandler());
```

## API

### `logger`

| Method | Level   | Console Output |
|--------|---------|----------------|
| `debug` | debug  | `console.log`  |
| `info`  | info   | `console.log`  |
| `warn`  | warn   | `console.warn` |
| `error` | error  | `console.error`|

Each call outputs a single JSON line:

```json
{"level":"info","message":"user_login","timestamp":"2026-07-26T09:00:00.000Z","userId":"abc123","email":"user@example.com"}
```

### `createHonoErrorHandler()`

Returns an error handler for Hono apps that logs the error and returns a 500 response.

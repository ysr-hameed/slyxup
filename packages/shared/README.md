# @slyxup/shared

Shared utilities, types, and helpers used across all Slyxup platform services.

## Installation

```bash
npm install @slyxup/shared
```

## Modules

### Types

```ts
import type { User, Session, JwtPayload, AuthEnv } from "@slyxup/shared";
```

TypeScript interfaces for all platform entities and environment bindings.

### Validation (Zod)

```ts
import { loginSchema, registerSchema, emailSchema, passwordSchema, apiResponseSchema } from "@slyxup/shared";

loginSchema.parse({ email: "user@example.com", password: "Str0ng!" });
```

Schemas include:
| Schema | Description |
|--------|-------------|
| `emailSchema` | Email validation (max 255 chars) |
| `passwordSchema` | Requires 8+ chars, uppercase, lowercase, number |
| `loginSchema` | Email + password + optional platform |
| `registerSchema` | Email + password + optional name + platform |
| `sendEmailSchema` | Email sending payload |
| `createCheckoutSchema` | Paddle checkout payload |
| `trackEventSchema` | Analytics event payload |
| `uploadFileSchema` | File upload metadata |
| `apiResponseSchema(T)` | Generic API response wrapper |

### Crypto

```ts
import { hashPassword, verifyPassword, generateToken, generateId } from "@slyxup/shared";

const hash = await hashPassword("Str0ng!"); // salt:hash format
const ok = await verifyPassword("Str0ng!", hash); // boolean
const token = generateToken(); // 64-char hex
const id = generateId(); // 32-char hex
```

Uses PBKDF2 with 100,000 iterations and SHA-256. Salt is 16 random bytes.

### JWT

```ts
import { signToken, verifyToken } from "@slyxup/shared";

const jwt = await signToken({ sub: userId, email, platform_id: "" }, secret, 900);
const payload = await verifyToken(jwt, secret); // JwtPayload | null
```

Custom HMAC-SHA256 JWT implementation. No external dependencies.

### OpenAPI

```ts
import { setupOpenApi } from "@slyxup/shared";

setupOpenApi(app, {
  title: "My API",
  version: "1.0.0",
  serverUrl: "http://localhost:8000",
  serverDescription: "Local development",
  pathPrefix: "/api/v1",
});
```

Registers an OpenAPI 3.0 JSON endpoint at `{pathPrefix}/openapi.json`.

### Middleware

```ts
import { requireApiKey, requireAdminKey, requireJwt } from "@slyxup/shared";

app.use("*", requireApiKey);
app.use("*", requireAdminKey);
app.use("*", requireJwt);
```

### CORS

```ts
import { corsOrigin, isAllowedOrigin } from "@slyxup/shared";

app.use("*", cors({ origin: corsOrigin }));
```

Allows origins matching `*.slyxup.online`, `*.slyxup.pages.dev`, and localhost.

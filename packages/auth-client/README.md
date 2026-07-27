# @slyxup/auth-client

HTTP client for the Slyxup Auth Service. Handles user registration, login, session management, password management, profile updates, OAuth, and email verification.

## Installation

```bash
npm install @slyxup/auth-client
```

## Usage

```ts
import { createAuthClient } from "@slyxup/auth-client";

const auth = createAuthClient({
  baseUrl: "https://auth.slyxup.online",
  apiKey: "sk-...", // optional, for server-side service-to-service calls
});
```

### Registration & verification

```ts
// Register
const { id, email } = await auth.register({
  email: "user@example.com",
  password: "Str0ng!",
  name: "Jane Doe",
  platform: "url-shortener",  // optional, links user to a product
});

// Verify email (token sent via email)
await auth.verifyEmail("verification-token-from-email");

// Resend verification email
await auth.resendVerification("user@example.com");
```

### Login & session management

```ts
// Login → get JWT (15min) + session token (30d)
const { token, jwt, user } = await auth.login({
  email: "user@example.com",
  password: "Str0ng!",
  platform: "url-shortener",
});
// token = long-lived session token (used for refresh, logout)
// jwt   = short-lived access token (used for API calls)

// List active sessions
const sessions = await auth.listSessions(jwt);
// → [{ id, ip, userAgent, lastSeen, createdAt, expiresAt }]

// Revoke a specific session
await auth.revokeSession(jwt, sessionId);

// Logout (revokes current session)
await auth.logout(jwt);
```

### Profile & account management

```ts
// Get current user
const me = await auth.me(jwt);
// → { id, email, name, avatarUrl, emailVerified }

// Update profile
const updated = await auth.updateProfile(jwt, {
  name: "New Name",
  avatarUrl: "https://...",
});

// Change password
await auth.changePassword(jwt, "CurrentPass1", "NewPass2!");

// Soft-delete account
await auth.deleteAccount(jwt);
```

### Password reset (no auth required)

```ts
// Step 1: Request reset email
await auth.forgotPassword("user@example.com");
// → { message: "If an account with that email exists, a reset link has been sent." }

// Step 2: Reset with token from email
await auth.resetPassword("reset-token-from-email", "NewStr0ng!");
```

## API

### `createAuthClient(config)`

| Config | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | `string` | `https://auth.slyxup.online` | Auth service URL |
| `apiKey` | `string` | — | Service API key (sent as `X-API-Key` header) |

### Methods

| Method | Auth | Parameters | Returns |
|--------|------|-----------|---------|
| `register` | — | `RegisterRequest` | `{ id, email }` |
| `verifyEmail` | — | `token: string` | `{ message }` |
| `resendVerification` | — | `email: string` | `{ message }` |
| `login` | — | `LoginRequest` | `{ token, jwt, user }` |
| `me` | Bearer JWT | `token: string` | `AuthUser` |
| `updateProfile` | Bearer JWT | `token, { name?, avatarUrl? }` | `AuthUser` |
| `deleteAccount` | Bearer JWT | `token: string` | `{ message }` |
| `logout` | Bearer JWT | `token: string` | `void` |
| `listSessions` | Bearer JWT | `token: string` | `SessionInfo[]` |
| `revokeSession` | Bearer JWT | `token, sessionId` | `{ message }` |
| `changePassword` | Bearer JWT | `token, currentPassword, newPassword` | `{ message }` |
| `forgotPassword` | — | `email: string` | `{ message }` |
| `resetPassword` | — | `token, password` | `{ message }` |

### Types

```ts
interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  platform?: string;
}

interface LoginRequest {
  email: string;
  password: string;
  platform?: string;
}

interface LoginResponse {
  token: string;       // session token (30d)
  jwt: string;         // access token (15min)
  user: AuthUser;
}

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl?: string | null;
  emailVerified: boolean;
}

interface SessionInfo {
  id: string;
  ip: string | null;
  userAgent: string | null;
  lastSeen: string | null;
  createdAt: string;
  expiresAt: string;
}
```

## Error handling

All methods throw on non-success responses. The error message comes from the API's `error` field:

```ts
try {
  await auth.login({ email: "bad@example.com", password: "wrong" });
} catch (err) {
  console.error(err.message); // "Invalid email or password"
}
```

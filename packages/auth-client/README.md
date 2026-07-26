# @slyxup/auth-client

HTTP client for the Slyxup Auth Service. Handles user registration, login, session management, and password reset.

## Installation

```bash
npm install @slyxup/auth-client
```

## Usage

```ts
import { createAuthClient } from "@slyxup/auth-client";

const auth = createAuthClient({
  baseUrl: "https://auth.slyxup.online",
  apiKey: "sk-...", // optional, for server-side use
});

// Register
const { id, email, verificationToken } = await auth.register({
  email: "user@example.com",
  password: "Str0ng!",
  name: "Jane Doe",
});

// Verify email
await auth.verifyEmail(verificationToken);

// Login
const { token, jwt, user } = await auth.login({
  email: "user@example.com",
  password: "Str0ng!",
});
// token = long-lived session token (acts as refresh token)
// jwt   = short-lived access token (15 min)

// Get current user
const me = await auth.me(jwt);       // with JWT
const me = await auth.me(token);     // or with session token

// Forgot / reset password
await auth.forgotPassword("user@example.com");
await auth.resetPassword("reset-token-here", "NewStr0ng!");

// Logout
await auth.logout();
```

## API

### `createAuthClient(config)`

| Config      | Type     | Default                     | Description |
|-------------|----------|-----------------------------|-------------|
| `baseUrl`   | `string` | `https://auth.slyxup.online`| Auth service URL |
| `apiKey`    | `string` | —                           | Service API key (`X-API-Key` header) |

### Methods

| Method | Parameters | Returns |
|--------|-----------|---------|
| `register` | `RegisterRequest` | `{ id, email, verificationToken }` |
| `verifyEmail` | `token: string` | `{ message }` |
| `login` | `LoginRequest` | `{ token, jwt, user }` |
| `me` | `token: string` | `AuthUser` |
| `forgotPassword` | `email: string` | `{ message }` |
| `resetPassword` | `token: string, password: string` | `{ message }` |
| `logout` | — | `void` |

# @slyxup/admin-client

HTTP client for the Slyxup Admin API. Manage admin users and audit logs.

## Installation

```bash
npm install @slyxup/admin-client
```

## Usage

```ts
import { createAdminClient } from "@slyxup/admin-client";

const admin = createAdminClient({
  baseUrl: "https://admin.slyxup.online",
  apiKey: "ak-...", // admin key (X-Admin-Key header)
});

// Dashboard stats
const stats = await admin.getDashboard();
// { adminUsers: 5, auditLogs: 1203 }

// List admin users
const users = await admin.listUsers();
// [{ id, email, name, role, created_at }]

// Create admin user
await admin.createUser("admin@example.com", "Admin User", "admin");

// List audit logs
const logs = await admin.listAuditLogs();
// [{ id, admin_id, action, resource, details, platform, created_at }]

// Create audit log entry
await admin.createAuditLog(
  "admin_xyz",
  "user.deleted",
  "users",
  "Deleted user abc123",
  "url-shortener",
);
```

## API

### `createAdminClient(config)`

| Config    | Type     | Default                         | Description |
|-----------|----------|---------------------------------|-------------|
| `baseUrl` | `string` | `https://admin.slyxup.online`   | Admin service URL |
| `apiKey`  | `string` | —                               | Admin API key (sent as `X-Admin-Key`) |

### Methods

| Method | Parameters | Returns |
|--------|-----------|---------|
| `getDashboard` | — | `DashboardStats` |
| `listUsers` | — | `AdminUser[]` |
| `createUser` | `email, name, role?` | `AdminUser` |
| `listAuditLogs` | — | `AuditLogEntry[]` |
| `createAuditLog` | `adminId, action, resource, details?, platform?` | `AuditLogEntry` |

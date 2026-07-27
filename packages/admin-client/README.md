# @slyxup/admin-client

HTTP client for the Slyxup Admin API. Manage admin users and audit logs. Uses `X-Admin-Key` header for auth.

## Installation

```bash
npm install @slyxup/admin-client
```

## Usage

```ts
import { createAdminClient } from "@slyxup/admin-client";

const admin = createAdminClient({
  baseUrl: "https://admin.slyxup.online",
  apiKey: "ak-...", // Admin API key (sent as X-Admin-Key header, NOT X-API-Key)
});
```

### Dashboard

```ts
const stats = await admin.getDashboard();
// → { adminUsers: 5, auditLogs: 1203 }
```

### Users

```ts
// List admin users
const users = await admin.listUsers();
// → [{ id, email, name, role, created_at }]

// Create an admin user
await admin.createUser("admin@example.com", "Admin User", "admin");
// → { id, email, name, role, created_at }
```

### Audit logs

```ts
// List all audit logs
const logs = await admin.listAuditLogs();
// → [{ id, admin_id, action, resource, details, platform, created_at }]

// Create an audit log entry
await admin.createAuditLog(
  "admin_xyz",              // admin_id
  "user.deleted",           // action
  "users",                  // resource
  "Deleted user abc123",    // details (optional)
  "url-shortener",          // platform (optional)
);
// → { id, admin_id, action, resource, details, platform, created_at }
```

## API

### `createAdminClient(config)`

| Config | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | `string` | `https://admin.slyxup.online` | Admin service URL |
| `apiKey` | `string` | — | Admin API key (sent as `X-Admin-Key` header) |

**Important**: Unlike other service clients (which use `X-API-Key`), the admin client sends the `apiKey` as `X-Admin-Key`. This is a separate key for admin access.

### Methods

| Method | Parameters | Returns |
|--------|-----------|---------|
| `getDashboard` | — | `DashboardStats` |
| `listUsers` | — | `AdminUser[]` |
| `createUser` | `email, name, role?` | `AdminUser` |
| `listAuditLogs` | — | `AuditLogEntry[]` |
| `createAuditLog` | `adminId, action, resource, details?, platform?` | `AuditLogEntry` |

### Types

```ts
interface DashboardStats {
  adminUsers: number;
  auditLogs: number;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

interface AuditLogEntry {
  id: string;
  admin_id: string;
  action: string;
  resource: string;
  details: string | null;
  platform: string | null;
  created_at: string;
}
```

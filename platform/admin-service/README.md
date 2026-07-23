# Admin Service — `admin.slyxup.in`

Admin user management and audit logging.

## SDK Usage

```ts
import { createSlyxupClient } from "@slyxup/sdk";

const api = createSlyxupClient({ adminBaseUrl: "https://admin.slyxup.in" });

// Dashboard stats
const stats = await api.admin.getDashboard();
// → { adminUsers: 5, auditLogs: 120 }

// List admin users
const users = await api.admin.listUsers();

// Create admin user
await api.admin.createUser("admin@example.com", "Admin Name", "superadmin");

// Audit logs
const logs = await api.admin.listAuditLogs();

// Create audit log
await api.admin.createAuditLog(
  "admin_id",
  "user.deleted",
  "users",
  "Deleted user abc123",
  "my-app",
);
```

## Database (D1)

`slyxup-admin` — `admin_users`, `audit_logs`

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Stats |
| GET | `/api/admin/users` | List admins |
| POST | `/api/admin/users` | Create admin |
| GET | `/api/admin/audit-logs` | List audit logs |
| POST | `/api/admin/audit-logs` | Create audit log |
| GET | `/api/admin/docs` | Swagger UI |

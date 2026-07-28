"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@slyxup/ui";
import { Badge } from "@slyxup/ui";
import { api, type AdminUser } from "@/lib/api";

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getUsers()
      .then((res) => setUsers(res.data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Manage platform users
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">Loading...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">No users found.</p>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={u.emailVerified ? "success" : "secondary"}>
                      {u.emailVerified ? "Verified" : "Unverified"}
                    </Badge>
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

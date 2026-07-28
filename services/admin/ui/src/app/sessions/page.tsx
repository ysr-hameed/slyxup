"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@slyxup/ui";
import { Badge } from "@slyxup/ui";
import { api, type AdminSession } from "@/lib/api";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSessions()
      .then((res) => setSessions(res.data))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  const activeSessions = sessions.filter(
    (s) => new Date(s.expiresAt).getTime() > Date.now(),
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          View and manage active sessions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Active Sessions ({activeSessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">Loading...</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">No sessions found.</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => {
                const isActive = new Date(s.expiresAt).getTime() > Date.now();
                return (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        User: {s.userId.slice(0, 12)}...
                      </p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        IP: {s.ipAddress ?? "Unknown"} · Agent: {s.userAgent?.slice(0, 40) ?? "Unknown"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={isActive ? "success" : "secondary"}>
                        {isActive ? "Active" : "Expired"}
                      </Badge>
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        Expires: {new Date(s.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

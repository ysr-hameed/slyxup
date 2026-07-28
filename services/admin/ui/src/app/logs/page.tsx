"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@slyxup/ui";
import { Badge } from "@slyxup/ui";
import { Button } from "@slyxup/ui";
import { api, type AuditLog } from "@/lib/api";

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);

  async function loadLogs(newOffset = 0) {
    setLoading(true);
    try {
      const res = await api.getAuditLogs(newOffset);
      setLogs(res.data);
      setOffset(newOffset);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Logs</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Authentication and platform activity logs
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">Loading...</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No log entries yet. Activity will appear here as users interact with the platform.
            </p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <Badge variant="outline" className="shrink-0 mt-0.5">
                    {log.event}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    {log.metadata && (
                      <p className="text-xs font-mono text-[var(--color-muted-foreground)] truncate">
                        {log.metadata}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-[var(--color-muted-foreground)]">
                      {log.userId && <span>User: {log.userId.slice(0, 12)}...</span>}
                      {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-[var(--color-muted-foreground)] shrink-0">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {logs.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={offset === 0}
                onClick={() => loadLogs(Math.max(0, offset - 50))}
              >
                Previous
              </Button>
              <span className="text-xs text-[var(--color-muted-foreground)]">
                Showing {offset + 1}–{offset + logs.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={logs.length < 50}
                onClick={() => loadLogs(offset + 50)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

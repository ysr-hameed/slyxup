"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@slyxup/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@slyxup/ui";
import { Badge } from "@slyxup/ui";
import { api, type Application } from "@/lib/api";

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadApps() {
    try {
      const res = await api.getApplications();
      setApps(res.data);
    } catch {
      setApps([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this application? This cannot be undone.")) return;
    await api.deleteApplication(id);
    setApps((prev) => prev.filter((a) => a.id !== id));
  }

  useEffect(() => {
    loadApps();
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Manage your SlyxUp applications
          </p>
        </div>
        <Link href="/applications/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Application
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">Loading...</p>
          ) : apps.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No applications yet. Create your first one.
            </p>
          ) : (
            <div className="space-y-3">
              {apps.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <Link
                      href={`/applications/${app.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {app.name}
                    </Link>
                    <div className="mt-1 flex items-center gap-3">
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        {app.slug}
                      </span>
                      <Badge variant="secondary">
                        {app.publishableKey.slice(0, 16)}...
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(app.id)}
                  >
                    <Trash2 className="h-4 w-4 text-[var(--color-destructive)]" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

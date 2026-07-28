"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@slyxup/ui";
import { Separator } from "@slyxup/ui";
import { Badge } from "@slyxup/ui";
import { api, type Application } from "@/lib/api";

export default function SettingsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getApplications()
      .then((res) => setApps(res.data))
      .catch(() => setApps([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Platform-wide configuration
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-muted-foreground)]">Platform Name</span>
              <span className="font-medium">SlyxUp</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-muted-foreground)]">Auth URL</span>
              <code className="text-xs">auth.slyxup.in</code>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-muted-foreground)]">Platform URL</span>
              <code className="text-xs">platform.slyxup.in</code>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-muted-foreground)]">Applications</span>
              <span className="font-medium">{loading ? "..." : apps.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-muted-foreground)]">Rate Limiting</span>
              <Badge variant="success">Enabled</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-muted-foreground)]">Session Duration</span>
              <span className="font-medium">7 days</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-muted-foreground)]">Password Min Length</span>
              <span className="font-medium">8 characters</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-muted-foreground)]">CSRF Protection</span>
              <Badge variant="success">Enabled</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

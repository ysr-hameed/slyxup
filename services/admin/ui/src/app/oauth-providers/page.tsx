"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@slyxup/ui";
import { Badge } from "@slyxup/ui";
import { api, type Application } from "@/lib/api";

const PROVIDER_INFO = [
  { name: "Google", icon: "G", color: "text-blue-500" },
  { name: "GitHub", icon: "G", color: "" },
];

export default function OAuthProvidersPage() {
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
        <h1 className="text-2xl font-semibold tracking-tight">OAuth Providers</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Configure social login providers. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
          GITHUB_CLIENT_ID, and GITHUB_CLIENT_SECRET environment variables on the auth
          service to enable providers.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Providers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {PROVIDER_INFO.map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-secondary)] text-sm font-semibold ${p.color}`}>
                  {p.icon}
                </div>
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Configure via environment variables
                  </p>
                </div>
              </div>
              <Badge variant="secondary">
                Configure in Settings
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Callback URLs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
            Configure these callback URLs in your OAuth provider&apos;s dashboard:
          </p>
          <div className="space-y-2">
            <div className="rounded bg-[var(--color-secondary)] p-3">
              <p className="text-xs font-medium mb-1">Google</p>
              <code className="text-xs font-mono break-all">
                {process.env.NEXT_PUBLIC_AUTH_API_URL ?? "http://localhost:8787"}/api/auth/oauth2/google/callback
              </code>
            </div>
            <div className="rounded bg-[var(--color-secondary)] p-3">
              <p className="text-xs font-medium mb-1">GitHub</p>
              <code className="text-xs font-mono break-all">
                {process.env.NEXT_PUBLIC_AUTH_API_URL ?? "http://localhost:8787"}/api/auth/oauth2/github/callback
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@slyxup/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@slyxup/ui";
import { Badge } from "@slyxup/ui";
import { api, type Application } from "@/lib/api";

export default function ApiKeysPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    api.getApplications()
      .then((res) => setApps(res.data))
      .catch(() => setApps([]))
      .finally(() => setLoading(false));
  }, []);

  async function copyKey(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-sm text-[var(--color-muted-foreground)]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          All API keys across your applications
        </p>
      </div>

      {apps.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-sm text-[var(--color-muted-foreground)]">
              No applications yet. Create one to get API keys.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {apps.map((app) => (
            <Card key={app.id}>
              <CardHeader>
                <CardTitle className="text-base">{app.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1">
                    Publishable Key
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-[var(--color-secondary)] px-2 py-1 text-xs font-mono break-all">
                      {app.publishableKey}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyKey(app.publishableKey)}
                    >
                      {copied === app.publishableKey ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                  <Badge variant="secondary">{app.slug}</Badge>
                  <span>Created {new Date(app.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

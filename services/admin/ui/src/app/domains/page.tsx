"use client";

import { useEffect, useState } from "react";
import { Globe, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@slyxup/ui";
import { Badge } from "@slyxup/ui";
import { api, type Application } from "@/lib/api";

export default function DomainsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getApplications()
      .then((res) => setApps(res.data))
      .catch(() => setApps([]))
      .finally(() => setLoading(false));
  }, []);

  const withDomain = apps.filter((a) => a.domain);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Domains</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Custom domains configured for your applications
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured Domains ({withDomain.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">Loading...</p>
          ) : withDomain.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Globe className="h-8 w-8 text-[var(--color-muted-foreground)]" />
              <p className="text-sm text-[var(--color-muted-foreground)]">
                No custom domains configured yet.
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Add a domain when creating or editing an application.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {withDomain.map((app) => (
                <div key={app.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                    <div>
                      <p className="text-sm font-medium">{app.domain}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {app.name} · {app.slug}
                      </p>
                    </div>
                  </div>
                  <a
                    href={app.domain ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] inline-flex items-center gap-1"
                  >
                    Visit <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Without Domain ({apps.length - withDomain.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {apps.filter((a) => !a.domain).length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              All applications have a domain configured.
            </p>
          ) : (
            <div className="space-y-2">
              {apps.filter((a) => !a.domain).map((app) => (
                <div key={app.id} className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary">{app.slug}</Badge>
                  <span className="text-[var(--color-muted-foreground)]">{app.name}</span>
                  <span className="text-xs text-[var(--color-muted-foreground)]">— No domain set</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

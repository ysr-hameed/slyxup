"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { Button } from "@slyxup/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@slyxup/ui";
import { Separator } from "@slyxup/ui";
import { Badge } from "@slyxup/ui";
import { api, type Application } from "@/lib/api";

export default function ApplicationDetailPage() {
  const params = useParams();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    api
      .getApplication(params.id as string)
      .then((res) => setApp(res.data))
      .catch(() => setApp(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function copyToClipboard(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-sm text-[var(--color-muted-foreground)]">Loading...</p>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-8">
        <p className="text-sm text-[var(--color-muted-foreground)]">Application not found.</p>
        <Link href="/applications">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>
    );
  }

  const keyFields = [
    { label: "Application ID", value: app.id },
    { label: "Publishable Key", value: app.publishableKey },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/applications"
          className="mb-4 inline-flex items-center text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to applications
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{app.name}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          <Badge variant="secondary">{app.slug}</Badge>
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {keyFields.map((field) => (
              <div key={field.label}>
                <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
                  {field.label}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 rounded bg-[var(--color-secondary)] px-2 py-1 text-xs font-mono">
                    {field.value}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(field.value, field.label)}
                  >
                    {copiedKey === field.label ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
                Domain
              </p>
              <p className="mt-1 text-sm">
                {app.domain ?? (
                  <span className="text-[var(--color-muted-foreground)]">Not set</span>
                )}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
                Allowed Origins
              </p>
              {app.allowedOrigins.length === 0 ? (
                <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                  None configured
                </p>
              ) : (
                <div className="mt-1 space-y-1">
                  {app.allowedOrigins.map((origin) => (
                    <code
                      key={origin}
                      className="block rounded bg-[var(--color-secondary)] px-2 py-1 text-xs font-mono"
                    >
                      {origin}
                    </code>
                  ))}
                </div>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
                Redirect URLs
              </p>
              {app.redirectUrls.length === 0 ? (
                <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                  None configured
                </p>
              ) : (
                <div className="mt-1 space-y-1">
                  {app.redirectUrls.map((url) => (
                    <code
                      key={url}
                      className="block rounded bg-[var(--color-secondary)] px-2 py-1 text-xs font-mono"
                    >
                      {url}
                    </code>
                  ))}
                </div>
              )}
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-muted-foreground)]">Created</span>
              <span>{new Date(app.createdAt).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

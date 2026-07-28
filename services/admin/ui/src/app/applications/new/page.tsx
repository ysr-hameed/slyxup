"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@slyxup/ui";
import { Input } from "@slyxup/ui";
import { Label } from "@slyxup/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@slyxup/ui";
import { api } from "@/lib/api";

export default function NewApplicationPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [domain, setDomain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleSlug(e: React.ChangeEvent<HTMLInputElement>) {
    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.createApplication({
        name,
        slug,
        domain: domain || undefined,
      });
      router.push(`/applications/${res.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create application");
    } finally {
      setLoading(false);
    }
  }

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
        <h1 className="text-2xl font-semibold tracking-tight">New Application</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Create a new SlyxUp application
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Application Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="My App"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="my-app"
                value={slug}
                onChange={handleSlug}
                required
              />
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Used to generate API keys. Must be unique.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">Domain (optional)</Label>
              <Input
                id="domain"
                placeholder="https://myapp.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-md bg-[var(--color-destructive)]/10 p-3 text-sm text-[var(--color-destructive)]">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Application
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

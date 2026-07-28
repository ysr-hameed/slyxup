"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppWindow, Users, Key, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@slyxup/ui";
import { api, type Application } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getSession()
      .then((session) => {
        if (cancelled) return;
        if (!session) {
          router.push("http://localhost:3000/sign-in");
          return;
        }
        return api.getApplications();
      })
      .then((res) => {
        if (cancelled || !res) return;
        setApps(res.data);
      })
      .catch(() => {
        if (!cancelled) router.push("http://localhost:3000/sign-in");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const stats = [
    { label: "Applications", value: apps.length, icon: AppWindow, color: "text-blue-500" },
    { label: "Users", value: "—", icon: Users, color: "text-green-500" },
    { label: "API Keys", value: apps.length, icon: Key, color: "text-amber-500" },
    { label: "Domains", value: apps.filter((a) => a.domain).length, icon: Globe, color: "text-purple-500" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Overview of your SlyxUp platform
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">Loading...</p>
          ) : apps.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No applications yet.{" "}
              <a href="/applications/new" className="text-[var(--color-foreground)] underline">
                Create your first application
              </a>
            </p>
          ) : (
            <div className="space-y-3">
              {apps.slice(0, 5).map((app) => (
                <a
                  key={app.id}
                  href={`/applications/${app.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-[var(--color-secondary)]"
                >
                  <div>
                    <p className="text-sm font-medium">{app.name}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {app.slug} · Created{" "}
                      {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--color-muted-foreground)]">
                    {app.publishableKey.slice(0, 12)}...
                  </span>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

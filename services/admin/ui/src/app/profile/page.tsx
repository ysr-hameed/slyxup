"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2, User } from "lucide-react";
import { Button } from "@slyxup/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@slyxup/ui";
import { Separator } from "@slyxup/ui";
import { api } from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    api
      .getSession()
      .then((session) => {
        if (!session) return router.push("http://localhost:3000/sign-in");
        setUser(session.user);
      })
      .catch(() => router.push("http://localhost:3000/sign-in"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await api.signOut();
      router.push("http://localhost:3000/sign-in");
    } catch {
      setSigningOut(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-muted-foreground)]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Your account information
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-secondary)]">
              <User className="h-6 w-6 text-[var(--color-muted-foreground)]" />
            </div>
            <div>
              <CardTitle>{user.name}</CardTitle>
              <p className="text-sm text-[var(--color-muted-foreground)]">{user.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-muted-foreground)]">User ID</span>
            <code className="text-xs text-[var(--color-muted-foreground)]">
              {user.id.slice(0, 16)}...
            </code>
          </div>
          <Separator />
          <Button variant="outline" className="w-full" onClick={handleSignOut} disabled={signingOut}>
            {signingOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

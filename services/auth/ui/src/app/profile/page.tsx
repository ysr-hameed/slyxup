"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, User } from "lucide-react";
import { Button } from "@slyxup/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@slyxup/ui";
import { Separator } from "@slyxup/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { authClient } from "@/lib/auth-client";

interface Session {
  id: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);

  useEffect(() => {
    authClient
      .getSession()
      .then((data) => {
        if (!data) return router.push("/sign-in");
        setUser(data.user);
        setSession(data.session);
      })
      .catch(() => router.push("/sign-in"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
      router.push("/sign-in");
    } catch {
      setSigningOut(false);
    }
  }

  async function handleSignOutAll() {
    setSigningOutAll(true);
    try {
      await authClient.revokeAllSessions();
      router.push("/sign-in");
    } catch {
      setSigningOutAll(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-muted-foreground)]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-secondary)]">
                {user.image ? (
                  <img
                    src={user.image}
                    alt=""
                    className="h-14 w-14 rounded-full"
                  />
                ) : (
                  <User className="h-6 w-6 text-[var(--color-muted-foreground)]" />
                )}
              </div>
              <div>
                <CardTitle>{user.name}</CardTitle>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {user.email}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-muted-foreground)]">
                Email verified
              </span>
              <span
                className={
                  user.emailVerified
                    ? "text-green-500"
                    : "text-[var(--color-muted-foreground)]"
                }
              >
                {user.emailVerified ? "Yes" : "No"}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-muted-foreground)]">
                Member since
              </span>
              <span>
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
            {session && (
              <>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-muted-foreground)]">
                    Session ID
                  </span>
                  <span className="font-mono text-xs text-[var(--color-muted-foreground)]">
                    {session.id.slice(0, 12)}...
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            onClick={handleSignOut}
            disabled={signingOut || signingOutAll}
          >
            {signingOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            Sign out
          </Button>
          <Button
            variant="ghost"
            className="text-[var(--color-muted-foreground)]"
            onClick={handleSignOutAll}
            disabled={signingOut || signingOutAll}
          >
            {signingOutAll ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            Sign out of all devices
          </Button>
        </div>
      </div>
    </div>
  );
}

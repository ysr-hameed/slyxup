"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthContext } from "./context";

type BaseUrlConfig = {
  baseUrl?: string;
};

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    function listener(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    }
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

function getAuthUrl(baseUrl?: string) {
  return baseUrl ?? "http://localhost:8787";
}

export function SignInButton({
  baseUrl,
  redirectUrl,
  children,
  ...props
}: BaseUrlConfig & {
  redirectUrl?: string;
  children?: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { status } = useAuthContext();

  if (status === "loading") return null;
  if (status === "authenticated") return null;

  const href = `${getAuthUrl(baseUrl)}/sign-in${redirectUrl ? `?redirect_url=${encodeURIComponent(redirectUrl)}` : ""}`;

  return (
    <a href={href}>
      <button {...props}>
        {children ?? "Sign in"}
      </button>
    </a>
  );
}

export function SignUpButton({
  baseUrl,
  redirectUrl,
  children,
  ...props
}: BaseUrlConfig & {
  redirectUrl?: string;
  children?: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { status } = useAuthContext();

  if (status === "loading") return null;
  if (status === "authenticated") return null;

  const href = `${getAuthUrl(baseUrl)}/sign-up${redirectUrl ? `?redirect_url=${encodeURIComponent(redirectUrl)}` : ""}`;

  return (
    <a href={href}>
      <button {...props}>
        {children ?? "Sign up"}
      </button>
    </a>
  );
}

export function UserButton({
  baseUrl,
  ...props
}: BaseUrlConfig & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { status, user, signOut } = useAuthContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref as React.RefObject<HTMLElement | null>, () => setOpen(false));

  if (status === "loading") return null;
  if (status === "unauthenticated") return null;

  const nameInitials = (user?.name ?? "?")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        {...props}
        onClick={() => setOpen(!open)}
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "1px solid var(--color-border, #e2e8f0)",
          background: "var(--color-secondary, #f1f5f9)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 600,
          ...props.style,
        }}
      >
        {nameInitials}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            marginTop: 4,
            minWidth: 180,
            borderRadius: 8,
            border: "1px solid var(--color-border, #e2e8f0)",
            background: "var(--color-card, white)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--color-border, #e2e8f0)" }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{user?.name}</p>
            <p style={{ margin: 0, fontSize: 11, color: "var(--color-muted-foreground, #64748b)" }}>
              {user?.email}
            </p>
          </div>
          <a
            href={`${getAuthUrl(baseUrl)}/profile`}
            style={{
              display: "block",
              padding: "8px 12px",
              fontSize: 13,
              textDecoration: "none",
              color: "inherit",
              cursor: "pointer",
            }}
            onClick={() => setOpen(false)}
          >
            Profile
          </a>
          <button
            onClick={() => { signOut(); setOpen(false); }}
            style={{
              display: "block",
              width: "100%",
              padding: "8px 12px",
              fontSize: 13,
              border: "none",
              background: "none",
              cursor: "pointer",
              textAlign: "left",
              color: "var(--color-destructive, #ef4444)",
              borderTop: "1px solid var(--color-border, #e2e8f0)",
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function UserProfile({
  baseUrl,
}: BaseUrlConfig) {
  const { status, user, session, signOut } = useAuthContext();

  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthenticated") {
    return (
      <div>
        <p>Not signed in.</p>
        <a href={`${getAuthUrl(baseUrl)}/sign-in`}>
          <button>Sign in</button>
        </a>
      </div>
    );
  }

  const nameInitials = (user?.name ?? "?")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "var(--color-secondary, #f1f5f9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          {nameInitials}
        </div>
        <div>
          <p style={{ fontWeight: 600 }}>{user?.name}</p>
          <p style={{ fontSize: 14, color: "var(--color-muted-foreground, #64748b)" }}>
            {user?.email}
          </p>
        </div>
      </div>
      <div style={{ fontSize: 14 }}>
        <p>Session: {session?.id.slice(0, 12)}...</p>
      </div>
      <button
        onClick={signOut}
        style={{
          padding: "8px 16px",
          borderRadius: 6,
          border: "1px solid var(--color-border, #e2e8f0)",
          background: "var(--color-background, white)",
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        Sign out
      </button>
    </div>
  );
}

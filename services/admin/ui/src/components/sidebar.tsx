"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@slyxup/ui";
import {
  LayoutDashboard,
  AppWindow,
  Users,
  Key,
  Globe,
  Logs,
  Settings,
  User,
  History,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: AppWindow },
  { href: "/users", label: "Users", icon: Users },
  { href: "/sessions", label: "Sessions", icon: History },
  { href: "/api-keys", label: "API Keys", icon: Key },
  { href: "/domains", label: "Domains", icon: Globe },
  { href: "/logs", label: "Logs", icon: Logs },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/profile", label: "Profile", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[var(--sidebar-width)] flex-col border-r bg-[var(--color-background)]">
      <div className="flex h-14 items-center gap-2 border-b px-6">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-foreground)]">
          <span className="text-xs font-bold text-[var(--color-background)]">S</span>
        </div>
        <span className="text-sm font-semibold">SlyxUp Platform</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--color-secondary)] text-[var(--color-foreground)]"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

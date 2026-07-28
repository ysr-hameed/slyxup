"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@slyxup/ui";
import { getTheme, setTheme, applyTheme } from "@/lib/theme";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-9 w-9" />;

  const current = getTheme();
  const isDark =
    current === "dark" ||
    (current === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggle = () => {
    const next = isDark ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    setMounted(false);
    setTimeout(() => setMounted(true), 0);
  };

  return (
    <Button variant="outline" size="icon" onClick={toggle}>
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

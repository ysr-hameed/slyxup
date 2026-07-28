"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@slyxup/ui";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-9 w-9" />;

  const isDark = document.documentElement.classList.contains("dark");

  const toggle = () => {
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("slyxup-theme", isDark ? "light" : "dark");
  };

  return (
    <Button variant="outline" size="icon" onClick={toggle}>
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

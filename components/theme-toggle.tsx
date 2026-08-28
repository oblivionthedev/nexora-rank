"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("theme-toggle size-10 rounded-xl", className)}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={mounted ? `Switch to ${isDark ? "light" : "dark"} mode` : "Change color theme"}
      title={mounted ? `Switch to ${isDark ? "light" : "dark"} mode` : "Change color theme"}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

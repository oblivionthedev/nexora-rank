"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const resourcePages = new Set([
  "activity",
  "applications",
  "automations",
  "communications",
  "operations",
  "ranking",
  "settings",
]);

export function ResourceAutoRefresh() {
  const router = useRouter();
  const pathname = usePathname();
  const resourcePage = resourcePages.has(
    pathname.split("/").filter(Boolean).at(-1) || "",
  );
  useEffect(() => {
    if (!resourcePage) return;
    const refresh = () => {
      if (document.visibilityState === "visible" && navigator.onLine)
        router.refresh();
    };
    const interval = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(interval);
  }, [resourcePage, router]);
  return null;
}

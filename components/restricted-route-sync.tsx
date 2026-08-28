"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function RestrictedRouteSync({ canonicalPath }: { canonicalPath: string }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname !== canonicalPath) router.replace(canonicalPath);
  }, [canonicalPath, pathname, router]);

  return null;
}

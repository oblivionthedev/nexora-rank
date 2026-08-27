import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn("brand-mark", compact && "compact", className)} aria-hidden="true">
      <Image src="/nexora-discord-logo.png" alt="" width={64} height={64} className="h-[72%] w-[72%] object-contain" />
    </span>
  );
}

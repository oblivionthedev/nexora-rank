import { cn } from "@/lib/utils";

export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn("brand-mark", compact && "compact", className)} aria-hidden="true">
      <img
        src="/nexora-discord-logo.png"
        alt=""
        className="h-full w-full rounded-[inherit] object-cover"
      />
    </span>
  );
}

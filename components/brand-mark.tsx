import { cn } from "@/lib/utils";

export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn("brand-mark", compact && "compact", className)} aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <path d="M8.4 23.7V8.3l15.2 15.4V8.3" stroke="currentColor" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8.4 8.3 23.6 23.7" stroke="currentColor" strokeWidth="4.2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

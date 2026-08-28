import { cn } from "@/lib/utils";

export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn("brand-mark", compact && "compact", className)} aria-hidden="true">
      <svg viewBox="0 0 32 32" className="h-[68%] w-[68%]" fill="none">
        <path d="M7 23V9l9 9 9-9v14" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

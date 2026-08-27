import { cn } from "@/lib/utils";

export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn("brand-mark", compact && "compact", className)} aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <path d="M8.4 23.7V8.3l15.2 15.4V8.3" stroke="currentColor" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8.4 8.3 23.6 23.7" stroke="url(#brand-gradient)" strokeWidth="4.2" strokeLinecap="round" />
        <defs><linearGradient id="brand-gradient" x1="8" y1="8" x2="24" y2="24"><stop stopColor="#C4B5FD"/><stop offset="1" stopColor="#60A5FA"/></linearGradient></defs>
      </svg>
    </span>
  );
}

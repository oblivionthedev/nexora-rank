"use client";
import { useActionState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { createDiscordCode, type LinkCodeState } from "@/app/dashboard/[workspaceId]/actions";

const initial: LinkCodeState = {};

function planLabel(value?: string) {
  if (!value) return "Current plan";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function DiscordLinkCode({
  publicId,
  disabled,
}: {
  publicId: string;
  disabled: boolean;
}) {
  const [state, action, pending] = useActionState(createDiscordCode, initial);
  return (
    <div className="mt-5">
      <form action={action}>
        <input type="hidden" name="public_id" value={publicId} />
        <button
          disabled={pending || disabled}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-[#050303] disabled:opacity-40"
        >
          <Link2 className="size-4" />
          {pending ? "Creating secure code…" : "Create plan link code"}
        </button>
      </form>
      {state.code ? (
        <div className="mt-4 rounded-2xl border border-[#d79a9a]/20 bg-[#d79a9a]/7 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-bold text-[#e5b4b4]">
              <Check className="size-4" /> Run this in your Discord server
            </p>
            <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[.12em] text-white/55">
              {planLabel(state.planTier)} plan code
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-black/30 p-3">
            <code className="break-all text-base font-bold text-white sm:text-lg">
              /link {state.code}
            </code>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(`/link ${state.code || ""}`)}
              className="ml-auto shrink-0 rounded-lg p-2 text-white/50 hover:bg-white/5"
              aria-label="Copy link command"
            >
              <Copy className="size-4" />
            </button>
          </div>
          <p className="mt-2 text-xs leading-5 text-white/40">
            Expires in 10 minutes and works once. If the workspace plan changes,
            create a new matching code.
          </p>
        </div>
      ) : null}
      {state.error ? (
        <p className="mt-3 text-sm text-red-200">{state.error}</p>
      ) : null}
    </div>
  );
}

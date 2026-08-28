"use client";

import { useActionState } from "react";
import { Check, Copy, KeyRound, RefreshCw } from "lucide-react";
import { rotateApiKey, type ApiKeyActionState } from "@/app/dashboard/actions";

const initialState: ApiKeyActionState = {};

export function ApiKeyControl({ workspaceId, currentPrefix, disabled = false }: { workspaceId: string; currentPrefix?: string | null; disabled?: boolean }) {
  const [state, action, pending] = useActionState(rotateApiKey, initialState);
  const visibleKey = state.apiKey;
  return (
    <div className="api-key-control">
      <div>
        <p className="microlabel">Private API key</p>
        <p className="mt-2 text-xs leading-6 text-white/48">{disabled ? "Credential changes are locked while this workspace is suspended." : "Exactly 25 characters. Replacing it immediately disables the previous key."}</p>
      </div>
      {visibleKey ? (
        <div className="api-key-reveal" role="status">
          <div><span>Copy now — shown once</span><code>{visibleKey}</code></div>
          <button type="button" aria-label="Copy API key" onClick={() => navigator.clipboard.writeText(visibleKey)}><Copy /></button>
        </div>
      ) : currentPrefix ? <p className="api-key-current"><Check /> Active key starts with <code>{currentPrefix}…</code></p> : null}
      {state.error ? <p className="api-key-error" role="alert">{state.error}</p> : null}
      <form action={action}>
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <button className="pill pill-ghost" type="submit" disabled={pending || disabled}>
          {currentPrefix || visibleKey ? <RefreshCw /> : <KeyRound />}{pending ? "Creating…" : currentPrefix || visibleKey ? "Regenerate API key" : "Create API key"}
        </button>
      </form>
    </div>
  );
}

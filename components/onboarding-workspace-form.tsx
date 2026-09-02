"use client";

import { useState } from "react";
import { Globe2, ShieldCheck, UsersRound } from "lucide-react";
import { saveOnboardingWorkspaceDraft } from "@/app/onboarding/actions";
import { OnboardingSubmitButton } from "@/components/onboarding-submit-button";

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function OnboardingWorkspaceForm({
  communityName,
  communitySlug,
}: {
  communityName?: string | null;
  communitySlug?: string | null;
}) {
  const initialName = communityName?.trim() ?? "";
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(communitySlug?.trim() || makeSlug(initialName));
  const [slugEdited, setSlugEdited] = useState(false);
  const previewName = name.trim() || "Your community";
  const previewSlug = slug.trim() || "your-community";

  return (
    <div className="workspace-builder">
      <form action={saveOnboardingWorkspaceDraft} className="setup-form">
        <label>
          <span>Workspace name</span>
          <input
            name="name"
            required
            minLength={2}
            maxLength={64}
            value={name}
            onChange={(event) => {
              const nextName = event.target.value;
              setName(nextName);
              if (!slugEdited) setSlug(makeSlug(nextName));
            }}
            autoComplete="organization"
            placeholder="Nexora Community"
          />
        </label>
        <label>
          <span>Workspace address</span>
          <div className="setup-slug">
            <small>nexorarank.tech/w/</small>
            <input
              name="slug"
              required
              pattern="[a-z0-9][a-z0-9-]{1,46}[a-z0-9]"
              value={slug}
              onChange={(event) => {
                setSlugEdited(true);
                setSlug(makeSlug(event.target.value));
              }}
              autoCapitalize="none"
              spellCheck={false}
              placeholder="your-community"
            />
          </div>
          <small>
            Generated automatically. You can change it before launch.
          </small>
        </label>
        <OnboardingSubmitButton
          idleLabel="Continue to Roblox"
          pendingLabel="Saving your community…"
          fullWidth
        />
      </form>

      <aside className="workspace-live-preview" aria-label="Workspace preview">
        <div className="workspace-preview-top">
          <span>Live preview</span>
          <i><span /></i>
        </div>
        <div className="workspace-preview-brand">
          <div>{previewName.slice(0, 2).toUpperCase()}</div>
          <span>
            <strong>{previewName}</strong>
            <small>Community operations</small>
          </span>
        </div>
        <div className="workspace-preview-url">
          <Globe2 />
          <span>nexorarank.tech/w/{previewSlug}</span>
        </div>
        <div className="workspace-preview-stats">
          <span><UsersRound /><b>1</b><small>Owner</small></span>
          <span><ShieldCheck /><b>Ready</b><small>Secure</small></span>
        </div>
      </aside>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { createApplicationForm } from "@/app/dashboard/[workspaceId]/actions";
import type { DiscordChannelOption, DiscordRoleOption } from "@/lib/discord-resources";

type FieldType = "short_text" | "long_text" | "select";
type BuilderField = {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: string;
};

const initialField = (id = crypto.randomUUID()): BuilderField => ({
  id,
  label: "",
  type: "long_text",
  required: true,
  options: "",
});

export function ApplicationBuilder({
  publicId,
  roles,
  channels,
}: {
  publicId: string;
  roles: DiscordRoleOption[];
  channels: DiscordChannelOption[];
}) {
  const [fields, setFields] = useState<BuilderField[]>([
    initialField("initial-question"),
  ]);
  const payload = useMemo(
    () =>
      JSON.stringify(
        fields.map((field, index) => ({
          id: `q${index + 1}`,
          label: field.label.trim(),
          type: field.type,
          required: field.required,
          options:
            field.type === "select"
              ? field.options
                  .split(/[,\n]/)
                  .map((option) => option.trim())
                  .filter(Boolean)
                  .slice(0, 20)
              : [],
        })),
      ),
    [fields],
  );

  function update(id: string, patch: Partial<BuilderField>) {
    setFields((current) =>
      current.map((field) => (field.id === id ? { ...field, ...patch } : field)),
    );
  }

  return (
    <form action={createApplicationForm} className="application-builder">
      <input type="hidden" name="public_id" value={publicId} />
      <input type="hidden" name="fields_json" value={payload} />

      <div className="application-builder-grid">
        <label>
          <span>Application name</span>
          <input name="name" required maxLength={80} placeholder="Community Management Team" />
        </label>
        <label>
          <span>Discord role applicants are applying for</span>
          <select name="target_role_id" required disabled={!roles.length}>
            <option value="">{roles.length ? "Choose a server role" : "Connect Discord to load roles"}</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
        </label>
      </div>

      <label>
        <span>Description shown to applicants</span>
        <textarea name="description" required maxLength={1200} placeholder="Explain the position, expectations, and who should apply." />
      </label>

      <div className="application-builder-grid">
        <label>
          <span>New-submission notifications</span>
          <select name="submissions_channel_id">
            <option value="">Do not send submission notifications</option>
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>#{channel.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Publish state</span>
          <select name="status" defaultValue="draft">
            <option value="draft">Draft — private</option>
            <option value="open">Open — accepting responses</option>
            <option value="paused">Paused — link unavailable</option>
          </select>
        </label>
      </div>

      <div className="application-questions-heading">
        <div>
          <strong>Application questions</strong>
          <p>Choose how each answer should be collected.</p>
        </div>
        <button type="button" onClick={() => setFields((current) => [...current, initialField()])}>
          <Plus /> Add question
        </button>
      </div>

      <div className="application-question-list">
        {fields.map((field, index) => (
          <article key={field.id} className="application-question-card">
            <GripVertical aria-hidden="true" />
            <div className="application-question-number">{String(index + 1).padStart(2, "0")}</div>
            <div className="application-question-fields">
              <label>
                <span>Question</span>
                <input value={field.label} onChange={(event) => update(field.id, { label: event.target.value })} required maxLength={180} placeholder="Why do you want to join this team?" />
              </label>
              <label>
                <span>Answer type</span>
                <select value={field.type} onChange={(event) => update(field.id, { type: event.target.value as FieldType })}>
                  <option value="short_text">Short answer</option>
                  <option value="long_text">Long answer</option>
                  <option value="select">Dropdown choice</option>
                </select>
              </label>
              {field.type === "select" ? (
                <label className="application-question-options">
                  <span>Dropdown choices, separated by commas</span>
                  <input value={field.options} onChange={(event) => update(field.id, { options: event.target.value })} required placeholder="Yes, No, Maybe" />
                </label>
              ) : null}
              <label className="application-required-toggle">
                <input type="checkbox" checked={field.required} onChange={(event) => update(field.id, { required: event.target.checked })} />
                <span>Required answer</span>
              </label>
            </div>
            <button type="button" className="application-remove-question" aria-label={`Remove question ${index + 1}`} disabled={fields.length === 1} onClick={() => setFields((current) => current.filter((item) => item.id !== field.id))}>
              <Trash2 />
            </button>
          </article>
        ))}
      </div>

      <button className="application-create-button" type="submit" disabled={!roles.length}>
        Create application
      </button>
    </form>
  );
}

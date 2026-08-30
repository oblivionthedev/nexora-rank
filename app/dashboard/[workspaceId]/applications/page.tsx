import Link from "next/link";
import { ArrowUpRight, CheckCircle2, ClipboardList, FilePlus2, Inbox, Megaphone, PauseCircle, UsersRound } from "lucide-react";
import { ApplicationBuilder } from "@/components/application-builder";
import { CopyField } from "@/components/copy-field";
import { PageHeading } from "@/components/workspace-shell";
import { Empty, Notice, Panel } from "@/components/workspace-operations";
import { listDiscordWorkspaceResources } from "@/lib/discord-resources";
import { nexoraSiteUrl } from "@/lib/site-url";
import type { Json } from "@/lib/supabase/database.types";
import { getWorkspaceControl } from "@/lib/workspace-control";
import { announceApplication, deleteRecord, reviewApplication, setApplicationStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function Applications({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const [{ workspaceId }, query] = await Promise.all([params, searchParams]);
  const { supabase, state } = await getWorkspaceControl(workspaceId);
  const [{ data: forms }, { data: submissions }, resources] = await Promise.all([
    supabase.from("application_forms").select("*").eq("workspace_id", state.workspace.id).order("created_at", { ascending: false }),
    supabase.from("application_submissions").select("*, application_forms(name,target_role_name,target_role_id)").eq("workspace_id", state.workspace.id).order("submitted_at", { ascending: false }).limit(50),
    listDiscordWorkspaceResources(state.workspace.discord_guild_id),
  ]);
  const openCount = forms?.filter((form) => form.status === "open").length ?? 0;
  const pendingCount = submissions?.filter((submission) => ["submitted", "in_review"].includes(submission.status)).length ?? 0;

  return (
    <div className="applications-page">
      <PageHeading eyebrow="Applications" title="Recruit with a real process." description="Build public Discord-authenticated application forms, publish them to your server, and review every response from one queue." />
      <Notice {...query} />

      <section className="application-metrics" aria-label="Application totals">
        <article><ClipboardList /><div><strong>{forms?.length ?? 0}</strong><span>Total forms</span></div></article>
        <article><CheckCircle2 /><div><strong>{openCount}</strong><span>Accepting responses</span></div></article>
        <article><Inbox /><div><strong>{pendingCount}</strong><span>Waiting for review</span></div></article>
        <article><UsersRound /><div><strong>{submissions?.length ?? 0}</strong><span>Recent submissions</span></div></article>
      </section>

      {!resources.available ? (
        <div className="application-connection-warning">
          <PauseCircle />
          <div><strong>Connect the Nexora bot to build forms</strong><p>Discord roles and channels are loaded directly from your connected server so applications always point to real roles.</p></div>
          <Link href={`/dashboard/${workspaceId}/connections`}>Open connections <ArrowUpRight /></Link>
        </div>
      ) : null}

      <div className="mt-6">
        <Panel icon={FilePlus2} title="Create an application" description="Choose a real Discord role, build the questions, and decide where new-submission notifications should arrive.">
          <ApplicationBuilder publicId={workspaceId} roles={resources.roles} channels={resources.channels} />
        </Panel>
      </div>

      <div className="mt-6">
        <Panel icon={ClipboardList} title="Published forms" description="Every form has a permanent Application ID and public link. Open forms can be announced by the Nexora bot.">
          {forms?.length ? (
            <div className="application-form-list">
              {forms.map((form) => {
                const publicUrl = nexoraSiteUrl(`/apply/${form.id}`);
                return (
                  <article key={form.id} className="application-form-card">
                    <header>
                      <div><span className={`application-status ${form.status}`}>{form.status}</span><h3>{form.name}</h3><p>{form.description}</p></div>
                      <div className="application-role"><small>Discord role</small><strong>@{form.target_role_name || "Not selected"}</strong></div>
                    </header>
                    <div className="application-form-identifiers">
                      <CopyField label="Application ID" value={form.id} />
                      <CopyField label="Public link" value={publicUrl} />
                    </div>
                    <div className="application-form-actions">
                      <Link href={`/apply/${form.id}`} target="_blank">Preview form <ArrowUpRight /></Link>
                      <form action={setApplicationStatus}>
                        <input type="hidden" name="public_id" value={workspaceId} />
                        <input type="hidden" name="id" value={form.id} />
                        <input type="hidden" name="status" value={form.status === "open" ? "paused" : "open"} />
                        <button>{form.status === "open" ? "Pause applications" : "Open applications"}</button>
                      </form>
                      {form.status === "open" ? (
                        <form action={announceApplication} className="application-announce-form">
                          <input type="hidden" name="public_id" value={workspaceId} />
                          <input type="hidden" name="id" value={form.id} />
                          <select name="channel_id" defaultValue={form.announcement_channel_id || ""} required aria-label={`Announcement channel for ${form.name}`}>
                            <option value="">Choose announcement channel</option>
                            {resources.channels.map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}
                          </select>
                          <button><Megaphone /> Announce</button>
                        </form>
                      ) : null}
                      {form.status !== "archived" ? (
                        <form action={setApplicationStatus}>
                          <input type="hidden" name="public_id" value={workspaceId} />
                          <input type="hidden" name="id" value={form.id} />
                          <input type="hidden" name="status" value="archived" />
                          <button>Archive</button>
                        </form>
                      ) : null}
                      <form action={deleteRecord} className="application-delete-form">
                        <input type="hidden" name="public_id" value={workspaceId} />
                        <input type="hidden" name="path" value="applications" />
                        <input type="hidden" name="table" value="application_forms" />
                        <input type="hidden" name="id" value={form.id} />
                        <button>Delete</button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : <Empty>No application forms yet. Build your first form above.</Empty>}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel icon={Inbox} title="Review queue" description="Read complete responses, then approve or decline. Approval also assigns the selected Discord role when the bot has permission.">
          {submissions?.length ? (
            <div className="application-submission-list">
              {submissions.map((submission) => {
                const relatedForm = Array.isArray(submission.application_forms) ? submission.application_forms[0] : submission.application_forms;
                const responses = responseEntries(submission.responses);
                const pending = ["submitted", "in_review"].includes(submission.status);
                return (
                  <article key={submission.id} className="application-submission-card">
                    <header>
                      <div className="application-applicant-avatar">{initials(submission.applicant_discord_name || "Discord applicant")}</div>
                      <div><span>{relatedForm?.name || "Application"}</span><h3>{submission.applicant_discord_name || "Discord applicant"}</h3><code>{submission.id}</code></div>
                      <div className={`application-status ${submission.status}`}>{submission.status.replaceAll("_", " ")}</div>
                    </header>
                    <div className="application-response-grid">
                      {responses.map(([question, answer]) => <div key={question}><small>{question}</small><p>{answer}</p></div>)}
                    </div>
                    {pending ? (
                      <form action={reviewApplication} className="application-review-form">
                        <input type="hidden" name="public_id" value={workspaceId} />
                        <input type="hidden" name="id" value={submission.id} />
                        <input name="review_notes" maxLength={1000} placeholder="Optional private review note" />
                        <button name="decision" value="declined" className="decline">Decline</button>
                        <button name="decision" value="approved" className="approve">Approve &amp; assign role</button>
                      </form>
                    ) : submission.review_notes ? <p className="application-review-note">{submission.review_notes}</p> : null}
                  </article>
                );
              })}
            </div>
          ) : <Empty>No applications have been submitted yet.</Empty>}
        </Panel>
      </div>
    </div>
  );
}

function responseEntries(value: Json) {
  if (!value || Array.isArray(value) || typeof value !== "object") return [];
  return Object.entries(value).map(([question, answer]) => [question, String(answer ?? "")]) as Array<[string, string]>;
}

function initials(value: string) {
  return value.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "DA";
}

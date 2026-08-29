import Link from "next/link";
import { CheckCircle2, Clock3, LockKeyhole, ShieldCheck } from "lucide-react";
import { ApplicationDiscordSignIn } from "@/components/application-discord-signin";
import { BrandMark } from "@/components/brand-mark";
import { createClient } from "@/lib/supabase/server";
import { submitPublicApplication } from "./actions";

export const dynamic = "force-dynamic";

type ApplicationField = {
  id: string;
  label: string;
  type: "short_text" | "long_text" | "select";
  required: boolean;
  options?: string[];
};

const errors: Record<string, string> = {
  signin_required: "Sign in with Discord before submitting.",
  discord_required: "A verified Discord connection is required for this application.",
  not_open: "This application is not accepting responses right now.",
  form_invalid: "This application is not configured correctly. Contact the community team.",
  required_answers: "Complete every required question before submitting.",
  invalid_answer: "One of the selected answers is not available.",
  already_submitted: "You have already submitted this application.",
  submit_failed: "Your application could not be saved. Please try again.",
};

export default async function PublicApplication({
  params,
  searchParams,
}: {
  params: Promise<{ formId: string }>;
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const [{ formId }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <ApplicationGate formId={formId} />;

  const [{ data: form }, { data: discord }] = await Promise.all([
    supabase.from("application_forms").select("id,name,description,target_role_name,fields,status,opens_at,closes_at").eq("id", formId).maybeSingle(),
    supabase.from("account_links").select("username,display_name,avatar_url").eq("user_id", user.id).eq("provider", "discord").maybeSingle(),
  ]);
  const fields = normalizeFields(form?.fields);
  const open = Boolean(form && form.status === "open" && (!form.opens_at || new Date(form.opens_at) <= new Date()) && (!form.closes_at || new Date(form.closes_at) > new Date()));

  return (
    <main className="application-portal">
      <header className="application-portal-nav">
        <Link href="/" className="application-portal-brand"><BrandMark compact /><span>Nexora Rank</span></Link>
        <span><ShieldCheck /> Discord verified</span>
      </header>
      <div className="application-portal-layout">
        <aside className="application-portal-summary">
          <p className="application-portal-eyebrow">Community application</p>
          <h1>{form?.name || "Application unavailable"}</h1>
          <p>{form?.description || "This form does not exist or is not available to your account."}</p>
          {form?.target_role_name ? <div className="application-portal-role"><small>Applying for</small><strong>@{form.target_role_name}</strong></div> : null}
          <ul>
            <li><LockKeyhole /><span><strong>Private by default</strong>Your responses are visible only to authorized reviewers.</span></li>
            <li><Clock3 /><span><strong>One submission</strong>Review your answers carefully before sending.</span></li>
          </ul>
        </aside>
        <section className="application-portal-form-card">
          {query.submitted ? (
            <div className="application-submitted-state"><CheckCircle2 /><p>Application received</p><h2>Your responses are with the review team.</h2><span>You can safely close this page. Decisions are handled by the community.</span></div>
          ) : !open ? (
            <div className="application-submitted-state muted"><Clock3 /><p>Applications unavailable</p><h2>This form is not accepting responses.</h2><span>It may be paused, closed, or scheduled for another time.</span></div>
          ) : (
            <form action={submitPublicApplication}>
              <input type="hidden" name="form_id" value={formId} />
              <div className="application-signed-in-as">
                <div>{initials(discord?.display_name || discord?.username || "Discord user")}</div>
                <span><small>Submitting as</small><strong>{discord?.display_name || discord?.username || user.email}</strong></span>
              </div>
              {query.error ? <p className="application-portal-error" role="alert">{errors[query.error] || "Please check the form and try again."}</p> : null}
              <div className="application-public-fields">
                {fields.map((field, index) => (
                  <label key={field.id}>
                    <span><b>{String(index + 1).padStart(2, "0")}</b>{field.label}{field.required ? <em>Required</em> : null}</span>
                    {field.type === "long_text" ? <textarea name={`response_${field.id}`} required={field.required} maxLength={4000} /> : field.type === "select" ? (
                      <select name={`response_${field.id}`} required={field.required}><option value="">Choose an answer</option>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select>
                    ) : <input name={`response_${field.id}`} required={field.required} maxLength={500} />}
                  </label>
                ))}
              </div>
              <button className="application-submit-button">Submit application</button>
              <p className="application-submit-notice">By submitting, you share these responses and your verified Discord profile with the workspace’s authorized application reviewers.</p>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

function ApplicationGate({ formId }: { formId: string }) {
  return <main className="application-portal application-gate"><section><Link href="/" className="application-portal-brand"><BrandMark compact /><span>Nexora Rank</span></Link><p className="application-portal-eyebrow">Secure application portal</p><h1>Continue with Discord to apply.</h1><p>Nexora verifies who is submitting and prevents duplicate applications. Your password is never shared with Nexora or the community.</p><ApplicationDiscordSignIn returnTo={`/apply/${formId}`} /><small>Only your Discord profile and the answers you submit are shared with authorized reviewers.</small></section></main>;
}

function normalizeFields(value: unknown): ApplicationField[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((field) => {
      const candidate = field as ApplicationField;
      return candidate.type === ("text" as ApplicationField["type"])
        ? { ...candidate, type: "long_text" as const }
        : candidate;
    })
    .filter((field) => field.id && field.label);
}
function initials(value: string) { return value.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "DU"; }

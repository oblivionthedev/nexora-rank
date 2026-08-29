"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Check, Clipboard, LoaderCircle, Search } from "lucide-react";
import {
  checkBetaStatus,
  submitBetaApplication,
  type BetaApplyState,
  type BetaStatusState,
} from "@/app/beta/actions";

const applyInitial: BetaApplyState = {};
const statusInitial: BetaStatusState = {};
const statusCopy: Record<string, { label: string; text: string }> = {
  submitted: {
    label: "Submitted",
    text: "Your application is in the queue and has not been reviewed yet.",
  },
  reviewing: {
    label: "Under review",
    text: "The Nexora team is currently reviewing your application.",
  },
  selected: {
    label: "Selected",
    text: "You have been selected for the Nexora Beta. Watch your email for contact details.",
  },
  waitlisted: {
    label: "Waitlisted",
    text: "Your application is still active. A place may open in a later Beta group.",
  },
  declined: {
    label: "Not selected",
    text: "You were not selected for this Beta group, but you may be considered for a future opening.",
  },
};

export function BetaApplicationForm() {
  const [applyState, applyAction, applying] = useActionState(
    submitBetaApplication,
    applyInitial,
  );
  const [statusState, statusAction, checking] = useActionState(
    checkBetaStatus,
    statusInitial,
  );
  const status = statusCopy[statusState.status || "submitted"];
  return (
    <div className="beta-form-stack">
      <section className="beta-form-card" id="apply">
        <div className="beta-form-number">01</div>
        <p className="beta-form-label">Apply for access</p>
        <h2>Tell us who you are.</h2>
        <p>
          Applications are reviewed personally. Use an email address where the
          Nexora team can contact you.
        </p>
        {applyState.success && applyState.code ? (
          <div className="beta-confirmation">
            <span>
              <Check />
            </span>
            <div>
              <b>Application received</b>
              <p>
                Save this private confirmation code. You need it to check your
                selection status.
              </p>
              <button
                type="button"
                onClick={() =>
                  navigator.clipboard.writeText(applyState.code || "")
                }
              >
                <code>{applyState.code}</code>
                <Clipboard />
              </button>
            </div>
          </div>
        ) : (
          <form action={applyAction} className="beta-form">
            <label>
              <span>Full name</span>
              <input
                name="name"
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
                placeholder="Your name"
              />
            </label>
            <label>
              <span>Email address</span>
              <input
                name="email"
                required
                type="email"
                maxLength={254}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>
            <label>
              <span>Age</span>
              <input
                name="age"
                required
                type="number"
                min={13}
                max={100}
                inputMode="numeric"
                placeholder="13+"
              />
            </label>
            <label className="beta-honeypot" aria-hidden="true">
              <span>Company</span>
              <input name="company" tabIndex={-1} autoComplete="off" />
            </label>
            <div className="beta-data-notice">
              <b>What is shared</b>
              <p>
                Your name, email address, and age are stored for Beta review.
                The same three details are sent by the Nexora bot to a private
                Staff Discord channel so the team can review and contact
                selected applicants. Your review status and submission time are
                also stored.
              </p>
            </div>
            <label className="beta-consent">
              <input type="checkbox" name="accept_beta_privacy" required />
              <span>
                I have read and accept the{" "}
                <Link href="/legal/beta-privacy">Beta Privacy Notice</Link>,
                including the private Discord notification described above.
              </span>
            </label>
            <label className="beta-consent">
              <input type="checkbox" name="accept_beta_policy" required />
              <span>
                I am at least 13 and accept the{" "}
                <Link href="/legal/beta-participation">
                  Beta Participation Policy
                </Link>
                .
              </span>
            </label>
            {applyState.error ? (
              <p className="beta-form-error">{applyState.error}</p>
            ) : null}
            <button disabled={applying}>
              {applying ? <LoaderCircle className="animate-spin" /> : null}
              {applying ? "Submitting…" : "Submit Beta application"}
            </button>
          </form>
        )}
      </section>

      <section className="beta-form-card beta-status-card" id="status">
        <div className="beta-form-number">02</div>
        <p className="beta-form-label">Application status</p>
        <h2>See if you were selected.</h2>
        <p>
          Enter the same email address and the private code shown after you
          applied.
        </p>
        <form action={statusAction} className="beta-form">
          <label>
            <span>Application email</span>
            <input
              name="status_email"
              required
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>
          <label>
            <span>Confirmation code</span>
            <input
              name="lookup_code"
              required
              autoCapitalize="characters"
              placeholder="NXB-..."
            />
          </label>
          {statusState.error ? (
            <p className="beta-form-error">{statusState.error}</p>
          ) : null}
          <button disabled={checking}>
            {checking ? <LoaderCircle className="animate-spin" /> : <Search />}
            {checking ? "Checking…" : "Check my status"}
          </button>
        </form>
        {statusState.found ? (
          <div className={`beta-status-result ${statusState.status}`}>
            <span>{status.label}</span>
            <h3>
              {statusState.name}, your application is{" "}
              {status.label.toLowerCase()}.
            </h3>
            <p>{status.text}</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}

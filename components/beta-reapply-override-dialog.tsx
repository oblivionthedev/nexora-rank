"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function BetaReapplyOverrideDialog({
  applicationId,
  applicantName,
  alreadyBypassed,
  action,
}: {
  applicationId: string;
  applicantName: string;
  alreadyBypassed: boolean;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          disabled={alreadyBypassed}
          className="min-h-11 rounded-xl border border-amber-300/20 px-3 text-xs font-bold text-amber-100/80 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {alreadyBypassed ? "Reapply unlocked" : "Bypass 24h wait"}
        </button>
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-[#0b0808] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Unlock early reapplication</DialogTitle>
          <DialogDescription className="leading-6 text-white/50">
            {applicantName} can submit a new Beta application immediately. This
            one-use override is recorded in the Staff audit log.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-4">
          <input type="hidden" name="application_id" value={applicationId} />
          <label className="grid gap-2 text-sm font-bold">
            Reason
            <textarea
              name="bypass_reason"
              required
              minLength={3}
              maxLength={300}
              rows={4}
              placeholder="Why should this applicant reapply early?"
              className="rounded-xl border border-white/10 bg-black/30 p-3 font-normal outline-none focus:border-amber-200/45"
            />
          </label>
          <DialogFooter>
            <button className="min-h-11 rounded-xl bg-white px-5 text-sm font-extrabold text-black">
              Unlock reapplication
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

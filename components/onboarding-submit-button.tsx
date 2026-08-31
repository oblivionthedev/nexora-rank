"use client";

import { useFormStatus } from "react-dom";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OnboardingSubmitButton({
  idleLabel,
  pendingLabel,
  fullWidth = false,
}: {
  idleLabel: string;
  pendingLabel: string;
  fullWidth?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`setup-primary-button ${fullWidth ? "w-full" : ""}`}
    >
      {pending ? (
        <LoaderCircle className="animate-spin" />
      ) : null}
      {pending ? pendingLabel : idleLabel}
      {!pending ? <ArrowRight /> : null}
    </Button>
  );
}

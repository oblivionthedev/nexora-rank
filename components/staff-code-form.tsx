"use client";
import { useActionState } from "react";
import { ArrowRight, KeyRound, LoaderCircle } from "lucide-react";
import { beginStaffSignIn, type StaffCodeState } from "@/app/staff/actions";
const initialState: StaffCodeState = {};
export function StaffCodeForm() {
  const [state, action, pending] = useActionState(beginStaffSignIn, initialState);
  return <form action={action} className="staff-code-form"><label><span>25-character access code</span><div><KeyRound /><input name="staff_code" required minLength={25} maxLength={25} autoComplete="one-time-code" autoCapitalize="characters" spellCheck={false} placeholder="ENTER CODE FROM NEXORA" /></div></label>{state.error ? <p role="alert">{state.error}</p> : null}<button disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}{pending ? "Checking code…" : "Continue to Discord"}</button></form>;
}

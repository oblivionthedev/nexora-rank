import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = request.cookies.get("nexora_staff_code")?.value || "";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !/^[A-Z0-9]{25}$/.test(code))
    return NextResponse.redirect(
      new URL("/staff/login?error=missing_code", url.origin),
    );
  const { data, error } = await supabase.rpc("redeem_staff_access_code", {
    raw_code: code,
  });
  const authorized = (data as { authorized?: boolean } | null)?.authorized;
  if (error || !authorized) {
    await supabase.rpc("report_security_incident", {
      requested_scope: "staff_login",
      requested_target: "/staff/complete",
      requested_details: { reason: error?.message || "invalid_staff_code" },
    });
  }
  const response = NextResponse.redirect(
    new URL(
      !error && authorized ? "/staff" : "/login?error=security_blocked",
      url.origin,
    ),
  );
  if (error || !authorized) await supabase.auth.signOut();
  response.cookies.set("nexora_staff_code", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

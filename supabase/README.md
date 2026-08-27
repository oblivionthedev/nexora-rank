# Nexora Supabase handoff

The migration in `migrations/` is ready for a dedicated Nexora Rank project. Do not apply it to an unrelated production database.

It includes profiles, account links, workspaces and member roles, Discord/Roblox integrations, rank bindings and actions, activity sessions and quotas, applications, automations, audit events, Lemon Squeezy subscription state, and an idempotent webhook ledger.

All exposed tables have row-level security. Browser roles cannot write audit events, subscription state, automation runs, or webhook events. Provider credentials and OAuth tokens must stay in Supabase Vault or server-only environment variables; public JSON settings are explicitly non-secret.

After connecting the correct project:

```bash
npx supabase link --project-ref YOUR_NEXORA_PROJECT_REF
npx supabase db push
npx supabase gen types typescript --linked > lib/supabase/database.types.ts
```

Then configure Discord in Supabase Auth and add the local and production `/auth/callback` URLs.

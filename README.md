# Nexora Rank

Nexora Rank is a modern Roblox community operations platform for group ranking, staff activity, applications, automations, and Discord/Roblox account linking.

This repository contains the production Nexora website, workspace dashboard, Supabase schema, Discord integration, and an approval-ready Roblox OAuth/Open Cloud execution layer.

## Included in this milestone

- Responsive marketing site and product presentation
- Dedicated Discord bot page, downloadable monochrome identity, command catalog, and permission model
- Interactive operations dashboard
- Guided launch center with backend and integration readiness
- Member directory with search and readiness information
- Policy-aware rank action preview
- Activity analytics, sessions, leaderboards, and quotas
- Application forms, review queue, and decision dialogs
- Automation management and safety toggles
- Discord, Roblox, API key, webhook, and SDK integration surfaces
- Searchable audit log
- Workspace, permissions, notification, and safety settings
- Supabase SSR browser/server clients and Discord OAuth callback
- Multi-workspace Postgres migration with RLS, indexes, idempotent webhooks, billing state, and an append-only audit surface
- Accessible dialogs, tabs, dropdown menus, switches, mobile sidebar, and feedback states

## Development

```bash
npm install
npm run dev
```

The app uses the Next.js App Router, React, TypeScript, Tailwind CSS, and the vendored shadcn component set.

Copy `.env.example` to `.env.local`, then attach a dedicated Supabase project:

```bash
npx supabase link --project-ref YOUR_NEXORA_PROJECT_REF
npx supabase db push
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Never place a Supabase secret/service-role key, Discord client secret, Roblox secret, or Lemon Squeezy key in a `NEXT_PUBLIC_` variable.

Set `CRON_SECRET` to a random 32+ byte server-only value in Vercel Production. The daily `/api/cron/roblox-membership` job uses it to authenticate membership checks. Free-plan enforcement is stored separately in `nexora_private.platform_policy` and defaults to disabled while Roblox OAuth is under review. Enable it only after OAuth is approved and the cron path has been verified.

For the separate server-side Roblox Open Cloud flow, set these server-only variables in `.env.local` or Vercel:

- `ROBLOX_CLIENT_ID`
- `ROBLOX_CLIENT_SECRET`
- `ROBLOX_TOKEN_ENCRYPTION_KEY` (optional dedicated 32+ character key; `CRON_SECRET` is the fallback)

The **group-management app** uses `https://www.nexorarank.tech/auth/roblox/callback` and `openid profile group:read group:write`. Keep its existing `ROBLOX_CLIENT_ID` and `ROBLOX_CLIENT_SECRET`. Nexora stores only AES-GCM-encrypted group tokens, refreshes rotating credentials server-side, verifies group ownership, performs rank changes through Open Cloud, re-reads the membership after every mutation, and records the outcome in the workspace audit log. Credential availability is checked server-side; the legacy `NEXT_PUBLIC_ROBLOX_OAUTH_ENABLED` flag is not the activation switch.

Promote, demote, and terminate-to-lowest-rank are ready. Roblox Open Cloud does not currently expose a supported OAuth endpoint for removing a member from a group, so Nexora deliberately does not claim that “Kick” succeeded. Never substitute a `.ROBLOSECURITY` cookie.

In Supabase Auth, enable Discord and add these application callback URLs:

- Local: `http://localhost:3000/auth/callback`
- Production: `https://YOUR_DOMAIN/auth/callback`

### Separate Roblox verification app

The `/verify` page uses a dedicated direct Roblox OAuth flow after Discord sign-in. It does not use a Supabase custom Roblox provider, does not request group permissions, and does not persist verification tokens.

Configure the new app with **only** `openid` and `profile`. Entry link: `https://www.nexorarank.tech/verify`. Privacy: `https://www.nexorarank.tech/legal/privacy`. Terms: `https://www.nexorarank.tech/legal/terms-of-service`.

Register these exact redirect URLs for the domains you use (no trailing slash):

- `https://www.nexorarank.tech/auth/roblox/verify/callback`
- `https://nexorarank.tech/auth/roblox/verify/callback`
- `https://nexora-rank.petrovicdusan350.chatgpt.site/auth/roblox/verify/callback`
- Optional local development: `http://localhost:3000/auth/roblox/verify/callback`

Set server-only `ROBLOX_VERIFICATION_CLIENT_ID` and `ROBLOX_VERIFICATION_CLIENT_SECRET` in each hosting environment. Keep `ROBLOX_VERIFICATION_ENABLED=false` until approval; then set it to `true` and redeploy. The existing `CRON_SECRET` must match the database's server-secret verifier. Apply `separate_roblox_verification_app` before activation. Never reuse or replace the group app's credentials for verification.

Verification uses its own state/PKCE cookies, checks the same signed-in Nexora user on return, and saves only Roblox profile information through a server-authenticated RPC. Existing verified profiles remain valid. A verification-only profile does not create group credentials. Users with an active group connection must verify the same Roblox account, or disconnect their group connection before switching.

After approval, test with a Discord member: `/verify` → Roblox → consent → return → Finish verification. Confirm only profile scopes appear and the Verified role is assigned. Separately test owner group authorization from Connections. Live verification cannot be confirmed until the new app is approved and configured.

## Vercel deployment

The repository includes `vercel.json` so Vercel uses a standard Next.js build. Connect the GitHub repository in Vercel and deploy with the default Node.js runtime.

## Remaining external activation and backend milestones

1. Apply the prepared migration to a dedicated Nexora Supabase project
2. Configure the Discord app, provider credentials, commands, and bot installation
3. Receive Roblox OAuth approval, enable the production flag, and complete a live test with a test group
4. Move immediate rank execution to a durable retry worker when operation volume requires it
5. Add activity SDK ingestion with anti-replay validation
6. Wire dashboard queries and mutations to the prepared tables
7. Activate Lemon Squeezy with an eligible merchant owner and signed webhooks
8. Add rate limiting, incident controls, backups, and monitoring

## Security rules

- Never request or store a `.ROBLOSECURITY` cookie.
- Use official Roblox Open Cloud and OAuth authorization.
- Encrypt refresh tokens and integration secrets at rest.
- Verify Discord, Roblox, and billing webhook signatures.
- Attach actor, policy result, reason, request ID, and outcome to every privileged action.
- Require server-side authorization for every operation; the browser is never the source of truth.

# Nexora Rank

Nexora Rank is a modern Roblox community operations platform for group ranking, staff activity, applications, automations, and Discord/Roblox account linking.

This repository contains the production Nexora website, workspace dashboard, Supabase schema, and Discord integration. Roblox ranking execution remains gated until the official OAuth and Open Cloud approvals are available.

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

In Supabase Auth, enable Discord and add these application callback URLs:

- Local: `http://localhost:3000/auth/callback`
- Production: `https://YOUR_DOMAIN/auth/callback`

For Roblox sign-in, create a Supabase **Custom Provider** with these settings:

- Configuration: Auto-discovery (OIDC)
- Name: `Roblox`
- Identifier: `custom:roblox`
- Issuer URL: `https://apis.roblox.com/oauth/`
- Scopes: `openid profile`
- Email optional: enabled
- PKCE: enabled
- Client ID and Client Secret: copy them from the Roblox OAuth application

Register Supabase's callback URL in the Roblox OAuth application:

- Production: `https://oomtmrfmqnndmwjqdpsj.supabase.co/auth/v1/callback`

The existing `/auth/roblox/callback` URLs belong only to the separate direct Open Cloud flow. They do not replace the Supabase callback used by `custom:roblox` sign-in. Never expose the Roblox client secret in a `NEXT_PUBLIC_` variable.

## Vercel deployment

The repository includes `vercel.json` so Vercel uses a standard Next.js build. Connect the GitHub repository in Vercel and deploy with the default Node.js runtime.

## Remaining backend milestones

1. Apply the prepared migration to a dedicated Nexora Supabase project
2. Configure the Discord app, provider credentials, commands, and bot installation
3. Add Roblox OAuth/Open Cloud group authorization
4. Add a signed job queue for rank operations and retries
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

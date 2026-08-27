# Nexora Rank

Nexora Rank is a modern Roblox community operations platform for group ranking, staff activity, applications, automations, and Discord/Roblox account linking.

This repository currently contains the high-fidelity frontend product foundation. External account authorization and live Roblox/Discord operations are intentionally labeled **Coming soon** until their secure server-side implementations are added.

## Included in this milestone

- Responsive marketing site and product presentation
- Interactive operations dashboard
- Member directory with search and readiness information
- Policy-aware rank action preview
- Activity analytics, sessions, leaderboards, and quotas
- Application forms, review queue, and decision dialogs
- Automation management and safety toggles
- Discord, Roblox, API key, webhook, and SDK integration surfaces
- Searchable audit log
- Workspace, permissions, notification, and safety settings
- Accessible dialogs, tabs, dropdown menus, switches, mobile sidebar, and feedback states

## Development

```bash
npm install
npm run dev
```

The app uses the Next.js App Router, React, TypeScript, Tailwind CSS, and the vendored shadcn component set.

## Vercel deployment

The repository includes `vercel.json` so Vercel uses a standard Next.js build. Connect the GitHub repository in Vercel and deploy with the default Node.js runtime.

## Planned backend milestones

1. PostgreSQL workspace and audit data model
2. Discord OAuth2 identity linking and bot installation
3. Roblox OAuth/Open Cloud group authorization
4. Signed job queue for rank operations and retries
5. Activity SDK ingestion with anti-replay validation
6. Application and automation persistence
7. Lemon Squeezy subscription webhooks
8. Rate limiting, incident controls, backups, and monitoring

## Security rules

- Never request or store a `.ROBLOSECURITY` cookie.
- Use official Roblox Open Cloud and OAuth authorization.
- Encrypt refresh tokens and integration secrets at rest.
- Verify Discord, Roblox, and billing webhook signatures.
- Attach actor, policy result, reason, request ID, and outcome to every privileged action.
- Require server-side authorization for every operation; the browser is never the source of truth.

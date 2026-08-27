# Nexora Discord bot profile

## Bot name

**Nexora**

Use **Nexora Rank** as the application/product name and **Nexora** as the bot's visible username.

## Short description

Roblox ranking, linking, activity, and staff operations—safe, fast, and fully audited.

## Full description

Nexora connects Roblox communities with Discord. Link member identities, manage rank requests with clear permissions, track activity and quotas, review applications, automate routine staff operations, and keep a readable audit record of every privileged action.

Nexora uses official authorization and scoped permissions. It never asks for a Roblox security cookie or a Discord user token.

## Planned command surface

- `/link` — connect the member's Discord identity to the Roblox account they choose
- `/rank` — request a policy-checked promotion, demotion, or set-rank action
- `/activity` — inspect sessions, quota progress, and recent activity
- `/applications` — open and work through the review queue
- `/audit` — search privileged operation history
- `/help` — explain available commands and workspace access

## Discord permissions

Nexora should never request `Administrator`.

- View Channels — only in channels where Nexora is enabled
- Send Messages and Embed Links — for replies, approvals, and receipts
- Manage Roles — optional; only when Discord role sync is enabled

Place the Nexora bot role below server leadership roles and above only the roles it is allowed to synchronize.

## Identity assets

- Discord avatar: `public/nexora-discord-logo.png`
- Browser/app mark: `public/favicon.svg`

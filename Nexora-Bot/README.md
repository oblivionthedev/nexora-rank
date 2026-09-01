# Nexora Bot

The official Node.js Discord bot for Nexora Rank. It can be installed in customer servers, uses the existing Nexora workspace database, and supports secure one-time 10-minute linking codes.

## Included commands

- `/link code` — connects the Discord server to a workspace. The caller needs Discord **Manage Server** permission.
- `/help`, `/ping`, `/status`, `/workspace` — help and workspace health.
- `/user` — inspect a member's connected Discord and Roblox accounts plus workspace access.
- `/setrank` — request a configured rank with Discord autocomplete and an optional reason.
- `/rank request`, `/rank approve`, `/rank cancel`, `/rank roles`, `/rank history` — configured rank request flow.
- `/activity` — activity totals for the caller or a Roblox username.
- `/quota` — configured workspace quotas.
- `/applications list`, `/applications decide` — application review.
- `/audit` — filtered workspace, Roblox, bot, and in-game logs.
- `/login create` — owner-only Staff authorization code delivered privately by DM.
- `/toggle beta` — owner-only live Beta application switch.
- `/verifypanel` — publishes the website-based Discord verification panel.
- `/rules`, `/faq`, `/welcome`, `/getting-started`, `/resources`, `/about` — publish polished official information panels in the current channel. These Staff-only commands require **Manage Server** and work only in the official Nexora server.

All replies are private. Every command reads the workspace status before doing work. A suspended or banned workspace cannot use operational bot commands.

Customer servers receive only the standard workspace commands. `/login`, `/toggle`, `/verifypanel`, and the official channel-format commands are registered only in the official Nexora server and are also blocked by the bot if an old Discord command definition is invoked elsewhere.

## 1. Requirements

- Node.js 22 or newer.
- The Discord bot token for application `1542533178554585099`.
- The Supabase **service role key**. This key is private and must only exist on the bot host.
- The bot must be installed using the invite link already shown in the Nexora dashboard.

The bot only requests the standard `Guilds` gateway intent. Message Content and Server Members privileged intents are not required for this version.

## 2. Add private configuration

Open `config/.env` and add:

```env
DISCORD_TOKEN=your_real_bot_token
SUPABASE_SERVICE_ROLE_KEY=your_real_service_role_key
```

`DISCORD_CLIENT_ID`, `SUPABASE_URL`, and the Nexora site URL are already filled in. Never send or commit `config/.env`. The example file is safe to share.

`DISCORD_GUILD_ID` is retained only to clean up commands from an older test-server deployment. Leave it blank for normal hosting.

## 3. Install and verify

```sh
npm install
npm run check
npm test
```

## 4. Register slash commands

Run this after the first upload and whenever command definitions change:

```sh
npm run register
```

The registration script always publishes standard workspace commands globally and publishes private platform commands only in the official Nexora server. Private server commands update immediately; Discord can take time to synchronize global commands across every server.

## 5. Start the bot

```sh
npm start
```

Hoster settings:

- Build/install command: `npm ci`
- Start command: `npm start`
- Health check: `/healthz`
- Default port: `3001` (or the hoster's `PORT` value)

## Security behavior

- The Discord token and Supabase service key are validated at startup and are never printed.
- The service key is used only by the private Node.js process, never by Discord messages or browser code.
- `/link` claims the single-use, hashed, 10-minute code directly through the private bot database connection, avoiding a fragile website round-trip.
- `/unlink` requires Discord **Manage Server** permission but does not require the server administrator to already be a Nexora workspace member.
- Workspace membership and Nexora role are checked server-side for every operation.
- Suspended and banned workspaces are blocked before mutations.
- Important bot operations write to `workspace_logs` with source `discord`.
- Authorization and Beta controls are available only to Discord user `1515743540259328202` inside the private Staff server.
- Verification buttons open `${NEXORA_SITE_URL}/verify`; role assignment happens only after the website confirms the connected Discord account and server membership.
- Unresolved unauthorized-access incidents are sent to channel `1543907082363867229`, ping role `1543625600919404604`, and repeat every 60 seconds until Staff resolves them.

Nexora Support now runs from the separate `Nexora-Support-Bot` folder with its own Discord application, token, and host.

## Ranking execution

`/rank request` creates a real Nexora rank action and applies the configured approval policy. The Roblox rank worker/Open Cloud executor will process approved actions once that worker is connected. The Discord bot never stores Roblox account passwords or `.ROBLOSECURITY` cookies.

# Nexora Bot

The official Node.js Discord bot for Nexora Rank. It uses slash commands, the existing Nexora workspace database, and the website's secure 10-minute linking flow.

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

All replies are private. Every command reads the workspace status before doing work. A suspended or banned workspace cannot use operational bot commands.

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

For instant command updates during development, put your test server ID in `DISCORD_GUILD_ID`. Leave it blank when registering commands globally for production.

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

With `DISCORD_GUILD_ID` filled in, updates appear only in that server and usually appear immediately. With it blank, commands are registered globally and Discord may take time to show them everywhere.

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
- `/link` uses the existing Nexora website endpoint and its single-use, hashed, 10-minute code.
- Workspace membership and Nexora role are checked server-side for every operation.
- Suspended and banned workspaces are blocked before mutations.
- Important bot operations write to `workspace_logs` with source `discord`.
- Authorization and Beta controls are available only to Discord user `1515743540259328202` inside the private Staff server.
- Unresolved unauthorized-access incidents are sent to channel `1543592799981535302`, ping role `1543625600919404604`, and repeat every 60 seconds until Staff resolves them.

Nexora Support now runs from the separate `Nexora-Support-Bot` folder with its own Discord application, token, and host.

## Ranking execution

`/rank request` creates a real Nexora rank action and applies the configured approval policy. The Roblox rank worker/Open Cloud executor will process approved actions once that worker is connected. The Discord bot never stores Roblox account passwords or `.ROBLOSECURITY` cookies.

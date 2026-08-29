# Nexora Support

Nexora Support is a separate Discord application and deployment from the main Nexora Bot. Members contact it through direct messages; agents reply from private ticket channels.

## Included

- `/setup` creates the Support category, agent role, transcript archive, and action log.
- `/panel` publishes a branded button that directs members to the bot's DMs.
- `/ticket claim`, `/ticket close`, `/ticket rename`, `/ticket add`, and `/ticket remove` organize agent work.
- DM messages and attachments relay in both directions.
- Closing a ticket creates a readable HTML transcript before deleting the channel.
- `/health` reports whether the separate host is connected.

## New host setup

1. Create a separate Discord application and bot for Nexora Support.
2. Enable **Message Content Intent** in the Discord Developer Portal.
3. Invite it with View Channels, Manage Channels, Send Messages, Manage Messages, Embed Links, Attach Files, Read Message History, and Manage Roles.
4. Copy `config/example.env` to `config/.env` on the host and add the separate token, application ID, and Support server ID.
5. Run `npm install`, `npm run register`, and `npm start`.
6. Run `/setup`, give agents the **Nexora Support** role, then publish `/panel`.

Never reuse the main Nexora Bot token for this service.

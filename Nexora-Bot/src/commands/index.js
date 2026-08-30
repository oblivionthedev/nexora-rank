import { activityCommand } from "./activity.js";
import { applicationsCommand } from "./applications.js";
import { auditCommand } from "./audit.js";
import { helpCommand } from "./help.js";
import { linkCommand } from "./link.js";
import { pingCommand } from "./ping.js";
import { quotaCommand } from "./quota.js";
import { rankCommand } from "./rank.js";
import { statusCommand } from "./status.js";
import { workspaceCommand } from "./workspace.js";
import { setupCommand } from "./setup.js";
import { diagnosticsCommand } from "./diagnostics.js";
import { unlinkCommand } from "./unlink.js";
import { setrankCommand } from "./setrank.js";
import { userCommand } from "./user.js";
import { loginCommand } from "./login.js";
import { toggleCommand } from "./toggle.js";
import { verifyPanelCommand } from "./verifypanel.js";
import { channelFormatCommands } from "./channel-formats.js";

export const commands = [
  helpCommand,
  setupCommand,
  diagnosticsCommand,
  unlinkCommand,
  pingCommand,
  linkCommand,
  statusCommand,
  workspaceCommand,
  userCommand,
  auditCommand,
  rankCommand,
  setrankCommand,
  activityCommand,
  quotaCommand,
  applicationsCommand,
  loginCommand,
  toggleCommand,
  verifyPanelCommand,
  ...channelFormatCommands,
];
export const commandMap = new Map(
  commands.map((command) => [command.data.name, command]),
);

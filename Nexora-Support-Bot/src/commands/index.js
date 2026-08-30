import { panelCommand } from "./panel.js";
import { setupCommand } from "./setup.js";
import { ticketCommand } from "./ticket.js";

export const commands = [setupCommand, panelCommand, ticketCommand];
export const commandMap = new Map(
  commands.map((command) => [command.data.name, command]),
);

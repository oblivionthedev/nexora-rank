import { UserError } from "./errors.js";

export async function resolveRobloxUser(username) {
  const response = await fetch("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new UserError("Roblox is unavailable right now. Try again shortly.", "roblox_unavailable");
  const payload = await response.json();
  const user = payload?.data?.[0];
  if (!user) throw new UserError(`Roblox user **${username}** was not found.`, "roblox_user_not_found");
  return { id: String(user.id), username: user.name, displayName: user.displayName };
}

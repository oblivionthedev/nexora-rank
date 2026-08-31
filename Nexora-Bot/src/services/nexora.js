import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { UserError, databaseError } from "../lib/errors.js";
import { resolveRobloxUser } from "../lib/roblox.js";

const roleWeight = { viewer: 0, operator: 1, reviewer: 2, admin: 3, owner: 4 };

function throwIfError(error, message) {
  if (error) throw databaseError(error, message);
}

export function createNexoraService(config, logger) {
  const database = createClient(
    config.supabaseUrl,
    config.supabaseServiceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      realtime: { transport: WebSocket },
      global: { headers: { "X-Client-Info": "nexora-discord-bot/0.1.0" } },
    },
  );

  async function getDiscordIdentity(discordUserId) {
    const { data, error } = await database
      .from("account_links")
      .select("user_id, username, display_name, verified_at")
      .eq("provider", "discord")
      .eq("provider_user_id", discordUserId)
      .maybeSingle();
    throwIfError(
      error,
      "Nexora could not check your connected Discord identity.",
    );
    return data;
  }

  async function getWorkspace(guildId, { allowRestricted = false } = {}) {
    const { data, error } = await database
      .from("workspaces")
      .select(
        "id, public_id, name, roblox_group_id, roblox_group_name, discord_guild_id, discord_guild_name, operational_status, moderation_status, moderation_reason, moderation_expires_at",
      )
      .eq("discord_guild_id", guildId)
      .maybeSingle();
    throwIfError(error, "Nexora could not load this server's workspace.");
    if (!data)
      throw new UserError(
        "This server is not connected to Nexora. An administrator must create a code in the dashboard and run `/link`.",
        "workspace_not_linked",
      );
    if (!allowRestricted && data.operational_status !== "active") {
      const label =
        data.moderation_status === "banned" ? "banned" : "suspended";
      throw new UserError(
        `This Nexora workspace is **${label}**. All bot operations are disabled.`,
        "workspace_restricted",
      );
    }
    return data;
  }

  async function getActor(workspaceId, discordUserId) {
    const { data: link, error: linkError } = await database
      .from("account_links")
      .select("user_id, username, display_name")
      .eq("provider", "discord")
      .eq("provider_user_id", discordUserId)
      .maybeSingle();
    throwIfError(linkError, "Nexora could not verify your connected account.");
    if (!link)
      throw new UserError(
        "Your Discord account is not connected to Nexora. Sign in at the Nexora website first.",
        "account_not_connected",
      );

    const { data: member, error: memberError } = await database
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", link.user_id)
      .maybeSingle();
    throwIfError(memberError, "Nexora could not verify your workspace access.");
    if (!member)
      throw new UserError(
        "You are not a member of this Nexora workspace.",
        "workspace_access_denied",
      );
    return {
      profileId: link.user_id,
      role: member.role,
      username: link.display_name || link.username,
    };
  }

  function requireRole(actor, minimumRoles) {
    const requiredWeight = Math.min(
      ...minimumRoles.map((role) => roleWeight[role]),
    );
    if (
      (roleWeight[actor.role] ?? -1) < requiredWeight &&
      !minimumRoles.includes(actor.role)
    ) {
      throw new UserError(
        `This action requires one of these workspace roles: **${minimumRoles.join(", ")}**.`,
        "insufficient_workspace_role",
      );
    }
  }

  async function context(guildId, discordUserId, roles = ["viewer"]) {
    const workspace = await getWorkspace(guildId);
    const actor = await getActor(workspace.id, discordUserId);
    requireRole(actor, roles);
    return { workspace, actor };
  }

  async function writeLog(
    workspaceId,
    actorId,
    eventType,
    summary,
    metadata = {},
    severity = "info",
  ) {
    const { error } = await database.from("workspace_logs").insert({
      workspace_id: workspaceId,
      source: "discord",
      severity,
      event_type: eventType,
      summary,
      actor_user_id: actorId,
      metadata,
    });
    if (error)
      logger.warn("Could not write workspace log", {
        code: error.code,
        eventType,
        workspaceId,
      });
  }

  async function claimLink({ code, guildId, guildName, discordUserId }) {
    const { data, error } = await database.rpc("claim_discord_link_code", {
      raw_code: code,
      guild_id: guildId,
      guild_name: guildName,
      discord_user_id: discordUserId,
    });
    if (error) {
      const messages = {
        link_code_invalid_or_expired:
          "That link code is invalid or expired. Create a new code in the Nexora dashboard.",
        link_code_plan_changed:
          "That code belongs to an older workspace plan. Create a new plan-matched code in the Nexora dashboard.",
        discord_server_already_linked:
          "This server could not be connected. It may already belong to another workspace.",
        workspace_restricted:
          "That workspace is currently restricted and cannot accept connections.",
      };
      const reason = Object.keys(messages).find((key) =>
        error.message?.includes(key),
      );
      throw new UserError(
        messages[reason] || "Nexora could not link this server. Create a fresh code and try again.",
        reason || error.code || "link_failed",
      );
    }
    return data;
  }

  async function createStaffAccessCode({
    code,
    guildId,
    creatorDiscordId,
    role,
  }) {
    const { data, error } = await database.rpc("bot_create_staff_access_code", {
      raw_code: code,
      guild_id: guildId,
      creator_discord_id: creatorDiscordId,
      requested_role: role,
    });
    throwIfError(error, "Nexora could not create a Staff access code.");
    return data;
  }

  async function setBetaEnabled({ enabled, actorDiscordId }) {
    const { data, error } = await database.rpc("bot_set_beta_enabled", {
      requested_enabled: enabled,
      actor_discord_id: actorDiscordId,
    });
    throwIfError(error, "Nexora could not update the live Beta switch.");
    return data;
  }

  async function setWorkspaceCreationEnabled({ enabled, actorDiscordId }) {
    const { data, error } = await database.rpc(
      "bot_set_workspace_creation_enabled",
      {
        requested_enabled: enabled,
        actor_discord_id: actorDiscordId,
      },
    );
    throwIfError(error, "Nexora could not update workspace creation.");
    return data;
  }

  async function claimSecurityIncidents() {
    const { data, error } = await database.rpc("bot_claim_security_incidents");
    throwIfError(error, "Nexora could not claim security alerts.");
    return Array.isArray(data) ? data : [];
  }

  async function claimDiscordRoleSync() {
    const { data, error } = await database.rpc("bot_claim_discord_role_sync");
    throwIfError(error, "Nexora could not claim Discord role updates.");
    return Array.isArray(data) ? data : [];
  }

  async function completeDiscordRoleSync(queueId, succeeded, failureReason) {
    const { data, error } = await database.rpc("bot_complete_discord_role_sync", {
      queue_id: queueId,
      succeeded,
      failure_reason: failureReason || null,
    });
    throwIfError(error, "Nexora could not complete a Discord role update.");
    return Boolean(data);
  }

  async function workspaceSummary(guildId, discordUserId) {
    const workspace = await getWorkspace(guildId, { allowRestricted: true });
    const actor = await getActor(workspace.id, discordUserId);
    const [{ count: members }, { count: ranks }, { count: sessions }] =
      await Promise.all([
        database
          .from("workspace_members")
          .select("*", { count: "exact", head: true })
          .eq("workspace_id", workspace.id),
        database
          .from("rank_actions")
          .select("*", { count: "exact", head: true })
          .eq("workspace_id", workspace.id),
        database
          .from("activity_sessions")
          .select("*", { count: "exact", head: true })
          .eq("workspace_id", workspace.id),
      ]);
    return {
      workspace,
      actor,
      counts: {
        members: members ?? 0,
        ranks: ranks ?? 0,
        sessions: sessions ?? 0,
      },
    };
  }

  async function disconnectGuild(guildId, discordUserId) {
    const workspace = await getWorkspace(guildId, { allowRestricted: true });
    const identity = await getDiscordIdentity(discordUserId);
    const { error } = await database
      .from("workspaces")
      .update({ discord_guild_id: null, discord_guild_name: null })
      .eq("id", workspace.id);
    throwIfError(error, "Nexora could not disconnect this server.");
    await database
      .from("integrations")
      .update({ status: "disconnected", external_id: null, settings: {} })
      .eq("workspace_id", workspace.id)
      .eq("provider", "discord");
    await writeLog(
      workspace.id,
      identity?.user_id ?? null,
      "discord.disconnected",
      `Discord server ${guildId} disconnected`,
      { guild_id: guildId },
      "warning",
    );
    return workspace;
  }

  async function listLogs(guildId, discordUserId, { source, limit }) {
    const { workspace } = await context(guildId, discordUserId, ["viewer"]);
    let query = database
      .from("workspace_logs")
      .select("id, source, severity, event_type, summary, created_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (source) query = query.eq("source", source);
    const { data, error } = await query;
    throwIfError(error, "Nexora could not load the audit trail.");
    return data ?? [];
  }

  async function inspectLinkedUser(
    guildId,
    actorDiscordUserId,
    targetDiscordUserId,
  ) {
    const { workspace } = await context(guildId, actorDiscordUserId, [
      "viewer",
    ]);
    const { data: discord, error } = await database
      .from("account_links")
      .select("user_id, provider_user_id, username, display_name, verified_at")
      .eq("provider", "discord")
      .eq("provider_user_id", targetDiscordUserId)
      .maybeSingle();
    throwIfError(error, "Nexora could not inspect that account.");
    if (!discord) return { discord: null, roblox: null, workspaceRole: null };
    const [{ data: roblox }, { data: member }] = await Promise.all([
      database
        .from("account_links")
        .select("provider_user_id, username, display_name, verified_at")
        .eq("provider", "roblox")
        .eq("user_id", discord.user_id)
        .maybeSingle(),
      database
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspace.id)
        .eq("user_id", discord.user_id)
        .maybeSingle(),
    ]);
    return { discord, roblox, workspaceRole: member?.role ?? null };
  }

  async function listRankBindings(guildId, discordUserId) {
    const { workspace } = await context(guildId, discordUserId, ["viewer"]);
    const { data, error } = await database
      .from("rank_bindings")
      .select(
        "id, roblox_role_id, roblox_role_name, discord_role_id, requires_approval, cooldown_minutes",
      )
      .eq("workspace_id", workspace.id)
      .order("sort_order");
    throwIfError(error, "Nexora could not load the configured ranks.");
    return data ?? [];
  }

  async function requestRank(
    guildId,
    discordUserId,
    { username, rankName, reason },
  ) {
    const { workspace, actor } = await context(guildId, discordUserId, [
      "operator",
    ]);
    if (!workspace.roblox_group_id)
      throw new UserError(
        "This workspace has no Roblox group connected.",
        "roblox_group_missing",
      );
    const [target, bindings] = await Promise.all([
      resolveRobloxUser(username),
      listRankBindings(guildId, discordUserId),
    ]);
    const binding = bindings.find(
      (item) => item.roblox_role_name.toLowerCase() === rankName.toLowerCase(),
    );
    if (!binding)
      throw new UserError(
        `Rank **${rankName}** is not configured in this workspace. Use \`/rank roles\`.`,
        "rank_not_configured",
      );
    const status = binding.requires_approval ? "pending" : "approved";
    const { data, error } = await database
      .from("rank_actions")
      .insert({
        workspace_id: workspace.id,
        target_roblox_user_id: target.id,
        target_username: target.username,
        requested_by: actor.profileId,
        to_role_id: binding.roblox_role_id,
        to_role_name: binding.roblox_role_name,
        reason,
        status,
        policy_snapshot: {
          source: "discord",
          requested_by_discord_id: discordUserId,
          requires_approval: binding.requires_approval,
        },
      })
      .select("id, status, target_username, to_role_name")
      .single();
    throwIfError(error, "Nexora could not create the rank request.");
    await writeLog(
      workspace.id,
      actor.profileId,
      "rank.requested",
      `Rank requested for ${target.username}`,
      {
        rank_action_id: data.id,
        target_roblox_user_id: target.id,
        to_role_id: binding.roblox_role_id,
      },
      "success",
    );
    return data;
  }

  async function listRankHistory(guildId, discordUserId, limit) {
    const { workspace } = await context(guildId, discordUserId, ["viewer"]);
    const { data, error } = await database
      .from("rank_actions")
      .select("id, target_username, to_role_name, status, reason, requested_at")
      .eq("workspace_id", workspace.id)
      .order("requested_at", { ascending: false })
      .limit(limit);
    throwIfError(error, "Nexora could not load rank history.");
    return data ?? [];
  }

  async function reviewRank(
    guildId,
    discordUserId,
    { actionId, decision, reason },
  ) {
    const { workspace, actor } = await context(guildId, discordUserId, [
      "reviewer",
    ]);
    const { data: existing, error: findError } = await database
      .from("rank_actions")
      .select("id, target_username, to_role_name, status")
      .eq("workspace_id", workspace.id)
      .eq("id", actionId)
      .maybeSingle();
    throwIfError(findError, "Nexora could not load that rank request.");
    if (!existing)
      throw new UserError(
        "That rank request does not exist in this workspace.",
        "rank_request_not_found",
      );
    if (existing.status !== "pending")
      throw new UserError(
        `That rank request is already **${existing.status}**.`,
        "rank_request_closed",
      );
    const nextStatus = decision === "approve" ? "approved" : "cancelled";
    const { error } = await database
      .from("rank_actions")
      .update({
        status: nextStatus,
        reviewed_by: actor.profileId,
        reviewed_at: new Date().toISOString(),
        error_code:
          decision === "cancel" ? reason || "cancelled_by_reviewer" : null,
      })
      .eq("id", existing.id)
      .eq("status", "pending");
    throwIfError(error, "Nexora could not update that rank request.");
    await writeLog(
      workspace.id,
      actor.profileId,
      `rank.${nextStatus}`,
      `Rank request ${nextStatus} for ${existing.target_username}`,
      { rank_action_id: existing.id, reason },
      nextStatus === "approved" ? "success" : "warning",
    );
    return { ...existing, status: nextStatus };
  }

  async function activitySummary(guildId, discordUserId, { username, days }) {
    const { workspace } = await context(guildId, discordUserId, ["viewer"]);
    let target;
    if (username) target = await resolveRobloxUser(username);
    else {
      const { data: discordLink } = await database
        .from("account_links")
        .select("user_id")
        .eq("provider", "discord")
        .eq("provider_user_id", discordUserId)
        .maybeSingle();
      const { data: robloxLink } = await database
        .from("account_links")
        .select("provider_user_id, username, display_name")
        .eq("provider", "roblox")
        .eq(
          "user_id",
          discordLink?.user_id ?? "00000000-0000-0000-0000-000000000000",
        )
        .maybeSingle();
      if (!robloxLink)
        throw new UserError(
          "Connect your Roblox account or provide a Roblox username.",
          "roblox_account_missing",
        );
      target = {
        id: robloxLink.provider_user_id,
        username: robloxLink.username,
        displayName: robloxLink.display_name,
      };
    }
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const { data, error } = await database
      .from("activity_sessions")
      .select("duration_seconds, started_at, ended_at")
      .eq("workspace_id", workspace.id)
      .eq("roblox_user_id", target.id)
      .gte("started_at", since);
    throwIfError(error, "Nexora could not load activity.");
    const seconds = (data ?? []).reduce(
      (total, session) => total + (session.duration_seconds ?? 0),
      0,
    );
    return {
      target,
      days,
      sessions: data?.length ?? 0,
      minutes: Math.floor(seconds / 60),
    };
  }

  async function listQuotas(guildId, discordUserId) {
    const { workspace } = await context(guildId, discordUserId, ["viewer"]);
    const [{ data: quotas, error }, { data: bindings }] = await Promise.all([
      database
        .from("activity_quotas")
        .select("roblox_role_id, minutes_required, period, grace_minutes")
        .eq("workspace_id", workspace.id)
        .order("period"),
      database
        .from("rank_bindings")
        .select("roblox_role_id, roblox_role_name")
        .eq("workspace_id", workspace.id),
    ]);
    throwIfError(error, "Nexora could not load quotas.");
    const names = new Map(
      (bindings ?? []).map((item) => [
        item.roblox_role_id,
        item.roblox_role_name,
      ]),
    );
    return (quotas ?? []).map((quota) => ({
      ...quota,
      roleName:
        names.get(quota.roblox_role_id) || `Role ${quota.roblox_role_id}`,
    }));
  }

  async function listApplications(guildId, discordUserId, status, limit) {
    const { workspace } = await context(guildId, discordUserId, ["reviewer"]);
    let query = database
      .from("application_submissions")
      .select(
        "id, form_id, applicant_roblox_user_id, score, status, submitted_at, application_forms(name)",
      )
      .eq("workspace_id", workspace.id)
      .order("submitted_at", { ascending: false })
      .limit(limit);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    throwIfError(error, "Nexora could not load applications.");
    return data ?? [];
  }

  async function getApplication(guildId, discordUserId, applicationId) {
    const { workspace } = await context(guildId, discordUserId, ["operator"]);
    const { data, error } = await database
      .from("application_forms")
      .select("id,name,description,target_role_name,status")
      .eq("workspace_id", workspace.id)
      .eq("id", applicationId)
      .maybeSingle();
    throwIfError(error, "Nexora could not load that application.");
    if (!data)
      throw new UserError(
        "That Application ID does not belong to this workspace.",
        "application_not_found",
      );
    if (data.status !== "open")
      throw new UserError(
        "Open the application in the dashboard before announcing it.",
        "application_not_open",
      );
    return data;
  }

  async function decideApplication(
    guildId,
    discordUserId,
    { submissionId, decision, notes },
  ) {
    const { workspace, actor } = await context(guildId, discordUserId, [
      "reviewer",
    ]);
    const status = decision === "approve" ? "approved" : "declined";
    const { data, error } = await database
      .from("application_submissions")
      .update({
        status,
        reviewed_by: actor.profileId,
        review_notes: notes || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("workspace_id", workspace.id)
      .eq("id", submissionId)
      .in("status", ["submitted", "in_review"])
      .select(
        "id, status, applicant_discord_user_id, application_forms(target_role_id, target_role_name)",
      )
      .maybeSingle();
    throwIfError(error, "Nexora could not decide that application.");
    if (!data)
      throw new UserError(
        "That application was not found or has already been decided.",
        "application_closed",
      );
    await writeLog(
      workspace.id,
      actor.profileId,
      `application.${status}`,
      `Application ${status}`,
      { submission_id: submissionId, notes },
      status === "approved" ? "success" : "warning",
    );
    return data;
  }

  return {
    getDiscordIdentity,
    claimLink,
    createStaffAccessCode,
    setBetaEnabled,
    setWorkspaceCreationEnabled,
    claimSecurityIncidents,
    claimDiscordRoleSync,
    completeDiscordRoleSync,
    getWorkspace,
    workspaceSummary,
    disconnectGuild,
    listLogs,
    inspectLinkedUser,
    listRankBindings,
    requestRank,
    listRankHistory,
    reviewRank,
    activitySummary,
    listQuotas,
    listApplications,
    getApplication,
    decideApplication,
  };
}

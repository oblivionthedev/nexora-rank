"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Ban,
  MoreHorizontal,
  ShieldCheck,
  Trash2,
  UserMinus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ServerAction = (formData: FormData) => void | Promise<void>;
type WorkspaceMode = "access" | "remove" | null;
type GroupMode = "promote" | "demote" | "terminate" | null;
type RobloxRole = { id: string; name: string; rank: number };

const menuContentClass =
  "min-w-56 rounded-xl border-white/10 bg-[#110c0c] p-1.5 text-white shadow-2xl";
const menuItemClass =
  "min-h-10 rounded-lg px-3 text-sm font-semibold focus:bg-white/8 focus:text-white";
const fieldClass =
  "min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-[#d79a9a]/60";
const submitClass =
  "mt-2 min-h-12 rounded-xl bg-white px-5 text-sm font-extrabold text-black transition hover:bg-[#f1c7c7]";

function MenuButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex size-11 items-center justify-center rounded-xl border border-white/10 text-white/55 transition hover:border-white/20 hover:bg-white/6 hover:text-white"
    >
      <MoreHorizontal className="size-5" />
    </button>
  );
}

export function WorkspaceMemberMenu({
  publicId,
  userId,
  memberName,
  currentRole,
  action,
}: {
  publicId: string;
  userId: string;
  memberName: string;
  currentRole: string;
  action: ServerAction;
}) {
  const [mode, setMode] = useState<WorkspaceMode>(null);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <MenuButton label={`Manage ${memberName}`} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={menuContentClass}>
          <DropdownMenuItem className={menuItemClass} onSelect={() => setMode("access")}>
            <ShieldCheck /> Update access
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/8" />
          <DropdownMenuItem
            className={menuItemClass}
            variant="destructive"
            onSelect={() => setMode("remove")}
          >
            <UserMinus /> Remove from workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={mode !== null} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent className="border-white/10 bg-[#0d0909] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mode === "remove" ? `Remove ${memberName}?` : `Update ${memberName}'s access`}
            </DialogTitle>
            <DialogDescription className="leading-6 text-white/45">
              {mode === "remove"
                ? "Their dashboard access ends immediately. This does not change their Roblox group rank."
                : "Choose the minimum workspace access this person needs."}
            </DialogDescription>
          </DialogHeader>
          <form action={action} className="grid gap-4 pt-2">
            <input type="hidden" name="public_id" value={publicId} />
            <input type="hidden" name="user_id" value={userId} />
            <input type="hidden" name="action" value={mode === "remove" ? "remove" : "role"} />
            {mode === "remove" ? (
              <input type="hidden" name="role" value={currentRole} />
            ) : (
              <label className="grid gap-2 text-sm font-bold">
                Access level
                <select name="role" defaultValue={currentRole} className={fieldClass}>
                  <option value="viewer">Viewer</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="operator">Operator</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
            )}
            <button className={mode === "remove" ? `${submitClass} bg-red-200 text-red-950 hover:bg-red-100` : submitClass}>
              {mode === "remove" ? "Remove member" : "Save access"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function GroupMemberMenu({
  publicId,
  member,
  roles,
  action,
}: {
  publicId: string;
  member: {
    userId: string;
    username: string;
    displayName: string;
    roleId: string;
    roleName: string;
    roleRank: number;
  };
  roles: RobloxRole[];
  action: ServerAction;
}) {
  const [mode, setMode] = useState<GroupMode>(null);
  const choices = roles.filter((role) =>
    mode === "promote" ? role.rank > member.roleRank : role.rank < member.roleRank,
  );
  const canPromote = roles.some((role) => role.rank > member.roleRank);
  const canDemote = roles.some((role) => role.rank < member.roleRank);
  const lowestRole = [...roles].sort((left, right) => left.rank - right.rank)[0];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <MenuButton label={`Manage @${member.username}`} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={menuContentClass}>
          <DropdownMenuItem disabled={!canPromote} className={menuItemClass} onSelect={() => setMode("promote")}>
            <ArrowUp /> Promote
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!canDemote} className={menuItemClass} onSelect={() => setMode("demote")}>
            <ArrowDown /> Demote
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!canDemote} className={menuItemClass} onSelect={() => setMode("terminate")}>
            <Ban /> Terminate to lowest rank
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/8" />
          <DropdownMenuItem disabled className={menuItemClass}>
            <Trash2 /> Kick · unavailable through Roblox OAuth
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={mode !== null} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent className="border-white/10 bg-[#0d0909] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="capitalize">{mode} @{member.username}</DialogTitle>
            <DialogDescription className="leading-6 text-white/45">
              Nexora verifies the result with Roblox before recording this action as complete.
            </DialogDescription>
          </DialogHeader>
          <form action={action} className="grid gap-4 pt-2">
            <input type="hidden" name="public_id" value={publicId} />
            <input type="hidden" name="roblox_user_id" value={member.userId} />
            <input type="hidden" name="roblox_username" value={member.username} />
            <input type="hidden" name="current_role_id" value={member.roleId} />
            <input type="hidden" name="current_role_rank" value={member.roleRank} />
            <input type="hidden" name="group_action" value={mode ?? ""} />
            {mode === "terminate" ? (
              <input type="hidden" name="requested_role_id" value={lowestRole?.id ?? ""} />
            ) : (
              <label className="grid gap-2 text-sm font-bold">
                New Roblox rank
                <select name="requested_role_id" required className={fieldClass} defaultValue="">
                  <option value="" disabled>Choose a rank</option>
                  {choices.map((role) => (
                    <option key={role.id} value={role.id}>{role.name} · rank {role.rank}</option>
                  ))}
                </select>
              </label>
            )}
            <label className="grid gap-2 text-sm font-bold">
              Reason
              <textarea
                name="reason"
                required
                minLength={2}
                maxLength={500}
                rows={4}
                className={`${fieldClass} resize-none py-3`}
                placeholder="Explain why this group action is needed."
              />
            </label>
            <button className={mode === "terminate" ? `${submitClass} bg-red-200 text-red-950 hover:bg-red-100` : submitClass}>
              Confirm {mode}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

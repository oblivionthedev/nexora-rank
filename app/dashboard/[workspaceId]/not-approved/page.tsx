import { redirect } from "next/navigation";
import { getWorkspaceControl } from "@/lib/workspace-control";

export const dynamic = "force-dynamic";

export default async function NotApprovedPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const { state } = await getWorkspaceControl(workspaceId);

  if (state.workspace.moderation_status !== "banned") {
    redirect(`/dashboard/${encodeURIComponent(state.workspace.public_id)}`);
  }

  return null;
}

import { WorkspaceShell } from "@/components/workspace-shell";
import { getWorkspaceControl } from "@/lib/workspace-control";

export default async function WorkspaceLayout({ children, params }: { children: React.ReactNode; params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params; const { state } = await getWorkspaceControl(workspaceId);
  return <WorkspaceShell workspace={state.workspace} settings={state.settings}>{children}</WorkspaceShell>;
}

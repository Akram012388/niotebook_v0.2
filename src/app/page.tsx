import type { ReactElement } from "react";
import { WorkspaceGrid } from "@/ui/layout/WorkspaceGrid";
import { AppShell } from "@/ui/shell/AppShell";

export default function Home(): ReactElement {
  return (
    <AppShell>
      <WorkspaceGrid />
    </AppShell>
  );
}

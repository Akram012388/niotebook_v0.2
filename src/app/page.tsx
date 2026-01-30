import { Suspense, type ReactElement } from "react";
import { AppShell } from "@/ui/shell/AppShell";
import { WorkspaceShell } from "@/ui/layout/WorkspaceShell";
import { AuthGate } from "@/ui/auth/AuthGate";

export default function Home(): ReactElement {
  return (
    <AuthGate>
      <AppShell>
        <Suspense
          fallback={
            <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-border bg-surface-muted text-sm text-text-muted">
              Loading workspace...
            </div>
          }
        >
          <WorkspaceShell />
        </Suspense>
      </AppShell>
    </AuthGate>
  );
}

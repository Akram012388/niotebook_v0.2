import { Suspense, type ReactElement } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/ui/shell/AppShell";
import { WorkspaceShell } from "@/ui/layout/WorkspaceShell";
import { AuthGate } from "@/ui/auth/AuthGate";
import { ForceTheme } from "@/ui/ForceTheme";

type WorkspacePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WorkspacePage({
  searchParams,
}: WorkspacePageProps): Promise<ReactElement> {
  const params = await searchParams;
  const lessonId = params.lessonId;

  if (!lessonId || (Array.isArray(lessonId) && lessonId.length === 0)) {
    redirect("/courses");
  }

  return (
    <AuthGate>
      <ForceTheme theme="light" />
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

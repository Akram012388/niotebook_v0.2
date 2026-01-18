import type { ReactElement } from "react";
import { AppShell } from "@/ui/shell/AppShell";

export default function Home(): ReactElement {
  return (
    <AppShell>
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-sm text-slate-500">
        Workspace shell scaffold (Phase 1).
      </section>
    </AppShell>
  );
}

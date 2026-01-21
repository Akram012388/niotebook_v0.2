import { Suspense, type ReactElement, type ReactNode } from "react";
import { LayoutPresetProvider } from "../layout/LayoutPresetContext";
import { TopNav } from "./TopNav";

type AppShellProps = {
  children: ReactNode;
};

const AppShell = ({ children }: AppShellProps): ReactElement => {
  return (
    <LayoutPresetProvider>
      <div className="flex h-screen flex-col bg-background text-foreground">
        <Suspense
          fallback={
            <div className="border-b border-border bg-surface">
              <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-6 py-4">
                <span className="text-sm font-semibold tracking-tight text-foreground">
                  Niotebook
                </span>
              </div>
            </div>
          }
        >
          <TopNav />
        </Suspense>
        <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-6 py-8 overflow-hidden">
          {children}
        </main>
      </div>
    </LayoutPresetProvider>
  );
};

export { AppShell };

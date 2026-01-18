import type { ReactElement, ReactNode } from "react";
import { LayoutPresetProvider } from "../layout/LayoutPresetContext";
import { TopNav } from "./TopNav";

type AppShellProps = {
  children: ReactNode;
};

const AppShell = ({ children }: AppShellProps): ReactElement => {
  return (
    <LayoutPresetProvider>
      <div className="min-h-screen bg-background text-foreground">
        <TopNav />
        <main className="mx-auto w-full max-w-[1600px] px-6 py-8">
          {children}
        </main>
      </div>
    </LayoutPresetProvider>
  );
};

export { AppShell };

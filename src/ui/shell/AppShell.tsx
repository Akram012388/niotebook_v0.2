import type { ReactElement, ReactNode } from "react";
import { TopNav } from "./TopNav";

type AppShellProps = {
  children: ReactNode;
};

const AppShell = ({ children }: AppShellProps): ReactElement => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopNav />
      <main className="mx-auto w-full max-w-[1600px] px-6 py-8">
        {children}
      </main>
    </div>
  );
};

export { AppShell };

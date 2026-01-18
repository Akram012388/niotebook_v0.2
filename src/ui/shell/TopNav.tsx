import type { ReactElement } from "react";
import { LayoutPresetToggle } from "../layout/LayoutPresetToggle";

const TopNav = (): ReactElement => {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold tracking-tight text-slate-900">
            Niotebook
          </span>
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
          >
            CS50x / Week 1
          </button>
        </div>
        <div className="flex items-center gap-3">
          <LayoutPresetToggle />
          <button
            type="button"
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700"
            aria-label="Toggle theme"
          >
            Light
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700"
          >
            User
          </button>
        </div>
      </div>
    </header>
  );
};

export { TopNav };

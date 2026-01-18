import type { ReactElement } from "react";

const AiPane = (): ReactElement => {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white">
      <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Assistant</p>
          <p className="text-xs text-slate-500">Chat scaffold</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500">
          Live
        </span>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex-1 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
          <p>Ask about the lesson to get started.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs text-slate-400">Compose message...</p>
        </div>
      </div>
    </section>
  );
};

export { AiPane };

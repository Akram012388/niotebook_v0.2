import type { ReactElement } from "react";

const CodePane = (): ReactElement => {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white">
      <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Code workspace</p>
          <p className="text-xs text-slate-500">Editor + output scaffold</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            className="rounded-full border border-slate-200 px-3 py-1 text-slate-700"
          >
            Run
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-200 px-3 py-1 text-slate-700"
          >
            Stop
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-200 px-3 py-1 text-slate-700"
          >
            Clear
          </button>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex-1 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 font-mono text-xs text-slate-500">
          Editor placeholder
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 font-mono text-xs text-slate-100">
          <p className="text-slate-400">$ output</p>
          <p>Hello, world.</p>
        </div>
      </div>
    </section>
  );
};

export { CodePane };

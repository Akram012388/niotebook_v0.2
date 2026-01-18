import type { ReactElement } from "react";

const VideoPane = (): ReactElement => {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white">
      <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Lesson video</p>
          <p className="text-xs text-slate-500">Player scaffold</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500">
          1080p
        </span>
      </header>
      <div className="p-4">
        <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
          Video player placeholder
        </div>
      </div>
    </section>
  );
};

export { VideoPane };

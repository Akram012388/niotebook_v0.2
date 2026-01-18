import type { ReactElement } from "react";

const CodePane = (): ReactElement => {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-border bg-surface">
      <header className="flex items-center justify-between border-b border-border-muted px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Code workspace
          </p>
          <p className="text-xs text-text-muted">Editor + output scaffold</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            className="rounded-full border border-border px-3 py-1 text-text-muted"
          >
            Run
          </button>
          <button
            type="button"
            className="rounded-full border border-border px-3 py-1 text-text-muted"
          >
            Stop
          </button>
          <button
            type="button"
            className="rounded-full border border-border px-3 py-1 text-text-muted"
          >
            Clear
          </button>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex-1 rounded-xl border border-dashed border-border bg-surface-muted p-4 font-mono text-xs text-text-subtle">
          Editor placeholder
        </div>
        <div className="rounded-xl border border-border bg-surface-strong p-4 font-mono text-xs text-surface-strong-foreground">
          <p className="text-text-subtle">$ output</p>
          <p>Hello, world.</p>
        </div>
      </div>
    </section>
  );
};

export { CodePane };

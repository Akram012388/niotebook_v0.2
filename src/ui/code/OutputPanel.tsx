import type { ReactElement } from "react";
import type { RuntimeOutput } from "../../domain/runtime";

type OutputPanelProps = {
  output: RuntimeOutput | null;
};

const OutputPanel = ({ output }: OutputPanelProps): ReactElement => {
  if (!output) {
    return (
      <div className="rounded-xl border border-border bg-surface-strong p-4 font-mono text-xs text-text-subtle">
        $ output
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-strong p-4 font-mono text-xs text-surface-strong-foreground">
      <p className="text-text-subtle">$ output</p>
      {output.stdout ? <p>{output.stdout}</p> : null}
      {output.stderr ? <p className="text-red-300">{output.stderr}</p> : null}
    </div>
  );
};

export { OutputPanel };

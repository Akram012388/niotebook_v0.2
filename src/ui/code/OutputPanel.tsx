import type { ReactElement } from "react";
import type { RuntimeOutput } from "../../domain/runtime";

type OutputPanelProps = {
  output: RuntimeOutput | null;
  variant?: "panel" | "inline";
};

const OutputPanel = ({
  output,
  variant = "panel",
}: OutputPanelProps): ReactElement => {
  if (!output) {
    if (variant === "inline") {
      return <p className="font-mono text-xs opacity-70">$ output</p>;
    }

    return (
      <div className="rounded-xl border border-border bg-surface-strong p-4 font-mono text-xs text-text-subtle">
        $ output
      </div>
    );
  }

  const hasStdout = output.stdout.trim().length > 0;
  const hasStderr = output.stderr.trim().length > 0;

  if (variant === "inline") {
    return (
      <div className="font-mono text-xs">
        <p className="opacity-70">$ output</p>
        {hasStdout ? (
          <pre className="whitespace-pre-wrap">{output.stdout}</pre>
        ) : null}
        {hasStderr ? (
          <pre className="whitespace-pre-wrap text-status-error">
            {output.stderr}
          </pre>
        ) : null}
        {!hasStdout && !hasStderr ? (
          <p className="opacity-70">No output produced.</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-strong p-4 font-mono text-xs text-surface-strong-foreground">
      <p className="text-text-subtle">$ output</p>
      {hasStdout ? (
        <pre className="whitespace-pre-wrap">{output.stdout}</pre>
      ) : null}
      {hasStderr ? (
        <pre className="whitespace-pre-wrap text-status-error">
          {output.stderr}
        </pre>
      ) : null}
      {!hasStdout && !hasStderr ? (
        <p className="text-text-subtle">No output produced.</p>
      ) : null}
    </div>
  );
};

export { OutputPanel };

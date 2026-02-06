import type { ReactElement } from "react";
import type { RuntimeState } from "../../infra/runtime/types";

type RuntimeStatusProps = {
  state: RuntimeState;
  className?: string;
};

const RuntimeStatus = ({
  state,
  className,
}: RuntimeStatusProps): ReactElement => {
  const statusColor =
    state.status === "running"
      ? "bg-status-info"
      : state.status === "ready"
        ? "bg-status-success"
        : state.status === "warming"
          ? "bg-status-warning"
          : state.status === "error"
            ? "bg-status-error"
            : "bg-border";

  return (
    <div
      className={`flex items-center gap-2 text-xs ${
        className ?? "text-text-muted"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${statusColor}`} />
      <span>
        {state.message ??
          `${state.language.toUpperCase()} runtime ${state.status}`}
      </span>
    </div>
  );
};

export { RuntimeStatus };

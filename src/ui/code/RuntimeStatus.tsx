import type { ReactElement } from "react";
import type { RuntimeState } from "../../infra/runtime/types";

type RuntimeStatusProps = {
  state: RuntimeState;
};

const RuntimeStatus = ({ state }: RuntimeStatusProps): ReactElement => {
  const statusColor =
    state.status === "running"
      ? "bg-blue-500"
      : state.status === "ready"
        ? "bg-green-500"
        : state.status === "warming"
          ? "bg-amber-500"
          : state.status === "error"
            ? "bg-red-500"
            : "bg-border";

  return (
    <div className="flex items-center gap-2 text-xs text-text-muted">
      <span className={`h-2 w-2 rounded-full ${statusColor}`} />
      <span>
        {state.message ??
          `${state.language.toUpperCase()} runtime ${state.status}`}
      </span>
    </div>
  );
};

export { RuntimeStatus };

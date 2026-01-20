import type { ReactElement } from "react";
import type { RuntimeState } from "../../infra/runtime/types";

type RuntimeStatusProps = {
  state: RuntimeState;
};

const RuntimeStatus = ({ state }: RuntimeStatusProps): ReactElement => {
  return (
    <div className="flex items-center gap-2 text-xs text-text-muted">
      <span className="h-2 w-2 rounded-full bg-text-subtle" />
      <span>
        {state.message ??
          `${state.language.toUpperCase()} runtime ${state.status}`}
      </span>
    </div>
  );
};

export { RuntimeStatus };

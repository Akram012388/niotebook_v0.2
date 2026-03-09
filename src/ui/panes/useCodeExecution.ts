import { useCallback, useState } from "react";
import {
  clearRuntime,
  runRuntime,
  stopRuntime,
} from "../../infra/runtime/runtimeManager";
import {
  PLOT_SVG_SENTINEL,
  STREAMED_SENTINEL,
} from "../../infra/runtime/runtimeConstants";
import type { RuntimeLanguage, RuntimeState } from "../../infra/runtime/types";
import type { LessonEnvironment } from "../../domain/lessonEnvironment";
import { useFileSystemStore } from "../../infra/vfs/useFileSystemStore";
import { useEditorStore } from "../code/useEditorStore";
import { useTerminalStore } from "../code/terminal/useTerminalStore";
import { renderRPlot } from "./RPlotFrame";

type UseCodeExecutionArgs = {
  activeLanguage: RuntimeLanguage;
  environment: LessonEnvironment;
  terminalActionsDisabled: boolean;
};

type UseCodeExecutionResult = {
  runtimeState: RuntimeState;
  setRuntimeState: (state: RuntimeState) => void;
  isRunning: boolean;
  handleRun: () => Promise<void>;
  handleStop: () => void;
  handleClear: () => void;
};

function useCodeExecution({
  activeLanguage,
  environment,
  terminalActionsDisabled,
}: UseCodeExecutionArgs): UseCodeExecutionResult {
  const [runtimeState, setRuntimeState] = useState<RuntimeState>({
    language: "js",
    status: "idle",
  });

  const terminalIsRunning = useTerminalStore((s) => s.isRunning);
  const isRunning = runtimeState.status === "running" || terminalIsRunning;

  const handleRun = async (): Promise<void> => {
    if (terminalActionsDisabled) return;

    useEditorStore.getState().saveAll();

    const code = useFileSystemStore.getState().getMainFileContent();
    if (!code) return;

    setRuntimeState({
      language: activeLanguage,
      status: "running",
      message: "Running...",
    });

    const termStore = useTerminalStore.getState();
    termStore.write("\x1b[2K\r");
    termStore.writeLn(`\x1b[90m$ run ${activeLanguage}\x1b[0m`);

    const vfs = useFileSystemStore.getState().vfs;

    const formatErrorChunk = (chunk: string): string => {
      const prefix = "\x1b[31m[err]\x1b[0m ";
      const lines = chunk.split("\n");
      return lines
        .map((line, index) => {
          if (line.length === 0 && index === lines.length - 1) {
            return "";
          }
          return prefix + line;
        })
        .join("\n");
    };

    try {
      const result = await runRuntime(activeLanguage, {
        code,
        timeoutMs: environment.runtimeSettings.timeoutMs,
        filesystem: vfs,
        packages: environment.packages,
        onStdout: (chunk: string) => termStore.write(chunk),
        onStderr: (chunk: string) => termStore.write(formatErrorChunk(chunk)),
      });

      // Write remaining buffered output not already streamed
      if (result.stdout && !result.stdout.includes(STREAMED_SENTINEL)) {
        const plotIdx = result.stdout.indexOf(PLOT_SVG_SENTINEL);
        const cleanStdout =
          plotIdx >= 0 ? result.stdout.slice(0, plotIdx) : result.stdout;
        if (cleanStdout) {
          termStore.write(cleanStdout);
        }
      }
      if (result.stderr && !result.stderr.includes(STREAMED_SENTINEL)) {
        termStore.write(formatErrorChunk(result.stderr));
      }

      // Render R plot SVG in the HTML preview pane if present
      if (result.stdout?.includes(PLOT_SVG_SENTINEL)) {
        const svgData = result.stdout.split(PLOT_SVG_SENTINEL)[1];
        if (svgData) {
          renderRPlot(svgData);
        }
      }

      if (result.timedOut) {
        useTerminalStore.getState().setLastRunError("Runtime timed out");
      } else if (result.stderr) {
        useTerminalStore
          .getState()
          .setLastRunError(result.stderr.slice(0, 500));
      } else {
        useTerminalStore.getState().setLastRunError(null);
      }

      setRuntimeState({
        language: activeLanguage,
        status: result.timedOut ? "error" : "ready",
        message: result.timedOut
          ? "Runtime timed out"
          : `${activeLanguage.toUpperCase()} runtime ready`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Runtime failed";
      termStore.write(formatErrorChunk(`${message}\n`));
      useTerminalStore.getState().setLastRunError(message);
      setRuntimeState({
        language: activeLanguage,
        status: "error",
        message: "Runtime failed",
      });
    } finally {
      termStore.writePrompt();
    }
  };

  const handleStop = useCallback((): void => {
    if (terminalActionsDisabled) return;
    stopRuntime(activeLanguage).catch((err) =>
      console.error("[runtime] stop failed", err),
    );
    clearRuntime(activeLanguage);
    useTerminalStore.getState().kill();
    setRuntimeState({
      language: activeLanguage,
      status: "ready",
      message: `${activeLanguage.toUpperCase()} runtime ready`,
    });
  }, [activeLanguage, terminalActionsDisabled]);

  const handleClear = useCallback((): void => {
    if (terminalActionsDisabled) return;
    useTerminalStore.getState().clear({ withPrompt: true });
  }, [terminalActionsDisabled]);

  return {
    runtimeState,
    setRuntimeState,
    isRunning,
    handleRun,
    handleStop,
    handleClear,
  };
}

export { useCodeExecution };
export type { UseCodeExecutionArgs, UseCodeExecutionResult };

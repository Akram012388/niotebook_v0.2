import type {
  RuntimeExecutor,
  RuntimeRunInput,
  RuntimeRunResult,
} from "./types";

const initHtmlExecutor = async (): Promise<RuntimeExecutor> => {
  let currentFrame: HTMLIFrameElement | null = null;

  const init = async (): Promise<void> => {
    return;
  };

  const run = async (input: RuntimeRunInput): Promise<RuntimeRunResult> => {
    const start = performance.now();

    if (currentFrame) {
      currentFrame.remove();
    }

    const frame = document.createElement("iframe");
    frame.sandbox.add("allow-scripts");
    frame.style.width = "100%";
    frame.style.height = "100%";

    const html = input.code;
    frame.srcdoc = html;

    currentFrame = frame;

    const container = document.getElementById("niotebook-runtime-frame");

    if (container) {
      container.innerHTML = "";
      container.appendChild(frame);
    }

    const runtimeMs = Math.round(performance.now() - start);

    return {
      stdout: "",
      stderr: "",
      exitCode: 0,
      runtimeMs,
    };
  };

  const stop = (): void => {
    if (currentFrame) {
      currentFrame.remove();
      currentFrame = null;
    }
  };

  return { init, run, stop };
};

export { initHtmlExecutor };

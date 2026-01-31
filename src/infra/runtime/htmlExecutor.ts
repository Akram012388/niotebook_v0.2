import type {
  RuntimeExecutor,
  RuntimeRunInput,
  RuntimeRunResult,
} from "./types";

const initHtmlExecutor = async (): Promise<RuntimeExecutor> => {
  let currentFrame: HTMLIFrameElement | null = null;
  let currentBlobUrls: string[] = [];

  const clearBlobs = (): void => {
    currentBlobUrls.forEach((url) => URL.revokeObjectURL(url));
    currentBlobUrls = [];
  };

  const init = async (): Promise<void> => {
    return;
  };

  const run = async (input: RuntimeRunInput): Promise<RuntimeRunResult> => {
    const start = performance.now();

    if (currentFrame) {
      currentFrame.remove();
    }
    clearBlobs();

    const frame = document.createElement("iframe");
    frame.sandbox.add("allow-scripts");
    frame.style.width = "100%";
    frame.style.height = "100%";

    const html = input.code;
    const resolvedHtml = input.filesystem
      ? resolveHtmlAssets(html, input.filesystem)
      : html;
    frame.srcdoc = resolvedHtml;

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
      timedOut: false,
    };
  };

  const stop = (): void => {
    if (currentFrame) {
      currentFrame.remove();
      currentFrame = null;
    }
    clearBlobs();
  };

  function resolveHtmlAssets(
    htmlSource: string,
    vfs: import("../vfs/VirtualFS").VirtualFS,
  ): string {
    const parser = new DOMParser();
    const document = parser.parseFromString(htmlSource, "text/html");
    const mainPath = vfs.getMainFilePath() ?? "/project/index.html";

    const isExternal = (value: string): boolean =>
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("data:") ||
      value.startsWith("//");

    const resolvePath = (value: string): string => {
      if (value.startsWith("/")) return value;
      return vfs.resolvePath(mainPath, value);
    };

    const toBlobUrl = (content: string, type: string): string => {
      const blobUrl = URL.createObjectURL(new Blob([content], { type }));
      currentBlobUrls.push(blobUrl);
      return blobUrl;
    };

    document.querySelectorAll("script[src]").forEach((node) => {
      const src = node.getAttribute("src");
      if (!src || isExternal(src)) return;
      const resolved = resolvePath(src);
      const content = vfs.readFile(resolved);
      if (content === null) return;
      node.setAttribute("src", toBlobUrl(content, "text/javascript"));
    });

    document.querySelectorAll("link[rel~='stylesheet']").forEach((node) => {
      const href = node.getAttribute("href");
      if (!href || isExternal(href)) return;
      const resolved = resolvePath(href);
      const content = vfs.readFile(resolved);
      if (content === null) return;
      node.setAttribute("href", toBlobUrl(content, "text/css"));
    });

    const html = document.documentElement?.outerHTML ?? htmlSource;
    return `<!DOCTYPE html>\n${html}`;
  }

  return { init, run, stop };
};

export { initHtmlExecutor };

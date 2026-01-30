/**
 * Sandboxed JavaScript execution via a disposable iframe.
 *
 * Creates an iframe with a blob URL, posts code to it, collects console output
 * via postMessage, and tears it down after execution or timeout.
 *
 * This provides basic DOM isolation — the iframe runs in a separate browsing
 * context with the `sandbox` attribute restricting capabilities.
 *
 * TODO: For stronger isolation, migrate to a Web Worker or a dedicated
 * sandboxed iframe served from a different origin.
 */

type SandboxResult = {
  stdout: string;
  stderr: string;
  timedOut: boolean;
};

type SandboxMessage =
  | { type: "ready" }
  | { type: "stdout"; data: string }
  | { type: "stderr"; data: string }
  | { type: "done" }
  | { type: "error"; message: string };

const SANDBOX_HTML = `<!DOCTYPE html><html><head><script>
"use strict";
window.addEventListener("message", function(e) {
  if (!e.data || e.data.type !== "exec") return;
  var code = e.data.code;
  var origLog = console.log;
  var origErr = console.error;
  var origWarn = console.warn;
  console.log = function() {
    var line = Array.prototype.map.call(arguments, String).join(" ") + "\\n";
    parent.postMessage({ type: "stdout", data: line }, "*");
  };
  console.error = function() {
    var line = Array.prototype.map.call(arguments, String).join(" ") + "\\n";
    parent.postMessage({ type: "stderr", data: line }, "*");
  };
  console.warn = console.error;
  try {
    var fn = new Function(code);
    fn();
    parent.postMessage({ type: "done" }, "*");
  } catch (err) {
    parent.postMessage({ type: "error", message: err instanceof Error ? err.message : String(err) }, "*");
  } finally {
    console.log = origLog;
    console.error = origErr;
    console.warn = origWarn;
  }
});
parent.postMessage({ type: "ready" }, "*");
<\/script></head><body></body></html>`;

function runInSandboxedIframe(
  code: string,
  timeoutMs: number,
  onStdout?: (chunk: string) => void,
  onStderr?: (chunk: string) => void,
): Promise<SandboxResult> {
  return new Promise<SandboxResult>((resolve) => {
    let stdout = "";
    let stderr = "";
    let settled = false;

    const blob = new Blob([SANDBOX_HTML], { type: "text/html" });
    const blobUrl = URL.createObjectURL(blob);

    const iframe = document.createElement("iframe");
    iframe.src = blobUrl;
    iframe.style.cssText = "display:none;width:0;height:0;border:none;";
    iframe.setAttribute("sandbox", "allow-scripts");

    const cleanup = (): void => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      clearTimeout(timer);
      iframe.remove();
      URL.revokeObjectURL(blobUrl);
    };

    const finish = (timedOut: boolean): void => {
      cleanup();
      resolve({ stdout, stderr, timedOut });
    };

    const timer = setTimeout(() => finish(true), timeoutMs);

    const onMessage = (event: MessageEvent<SandboxMessage>): void => {
      if (event.source !== iframe.contentWindow) return;
      const msg = event.data;
      if (!msg || typeof msg !== "object" || !("type" in msg)) return;

      switch (msg.type) {
        case "ready":
          iframe.contentWindow?.postMessage({ type: "exec", code }, "*");
          break;
        case "stdout":
          stdout += msg.data;
          onStdout?.(msg.data);
          break;
        case "stderr":
          stderr += msg.data;
          onStderr?.(msg.data);
          break;
        case "done":
          finish(false);
          break;
        case "error":
          stderr += msg.message + "\n";
          onStderr?.(msg.message + "\n");
          finish(false);
          break;
      }
    };

    window.addEventListener("message", onMessage);
    document.body.appendChild(iframe);
  });
}

export { runInSandboxedIframe };
export type { SandboxResult };

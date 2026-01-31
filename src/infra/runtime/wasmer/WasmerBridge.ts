/**
 * WasmerBridge — postMessage communication between main app and sandbox iframe.
 *
 * The bridge manages the iframe lifecycle, sends commands, and receives
 * streaming stdout/stderr/exit responses.
 */
import type { VirtualFS } from "../../vfs/VirtualFS";
import { serializeVFS } from "./vfsMount";
import type {
  SandboxCommand,
  SandboxResponse,
  WasmerExecResult,
} from "./wasmerTypes";

type BridgeStatus = "idle" | "loading" | "ready" | "error";

type PendingCommand = {
  id: string;
  stdout: string;
  stderr: string;
  onStdout?: (chunk: string) => void;
  onStderr?: (chunk: string) => void;
  resolve: (result: WasmerExecResult) => void;
  reject: (error: Error) => void;
  startTime: number;
};

class WasmerBridge {
  private iframe: HTMLIFrameElement | null = null;
  private status: BridgeStatus = "idle";
  private pending: Map<string, PendingCommand> = new Map();
  private readyPromise: Promise<void> | null = null;
  private readyResolve: (() => void) | null = null;
  private messageHandler:
    | ((event: MessageEvent<SandboxResponse>) => void)
    | null = null;
  private onFsWrite: ((path: string, content: string) => void) | null = null;
  private onFsDelete: ((path: string) => void) | null = null;
  private commandCounter = 0;

  /** Set a callback for when the sandbox writes files back. */
  setFsWriteHandler(handler: (path: string, content: string) => void): void {
    this.onFsWrite = handler;
  }

  /** Set a callback for when the sandbox deletes files. */
  setFsDeleteHandler(handler: (path: string) => void): void {
    this.onFsDelete = handler;
  }

  /** Get current bridge status. */
  getStatus(): BridgeStatus {
    return this.status;
  }

  /** Initialize the bridge by creating and loading the sandbox iframe. */
  async init(container?: HTMLElement): Promise<void> {
    if (this.status === "ready" || this.status === "loading") {
      return this.readyPromise ?? Promise.resolve();
    }

    this.status = "loading";

    this.readyPromise = new Promise<void>((resolve, reject) => {
      this.readyResolve = resolve;

      // Create hidden iframe
      this.iframe = document.createElement("iframe");
      this.iframe.src = "/editor-sandbox";
      this.iframe.style.cssText = "display:none;width:0;height:0;border:none;";
      this.iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");

      // Listen for messages from iframe
      this.messageHandler = (event: MessageEvent<SandboxResponse>) => {
        this.handleMessage(event);
      };
      window.addEventListener("message", this.messageHandler);

      // Timeout
      const timeout = setTimeout(() => {
        if (this.status !== "ready") {
          this.status = "error";
          reject(new Error("Sandbox iframe failed to load within 15s"));
        }
      }, 15_000);

      // Resolve when we get "ready" message (handled in handleMessage)
      const origResolve = this.readyResolve;
      this.readyResolve = () => {
        clearTimeout(timeout);
        origResolve?.();
      };

      (container ?? document.body).appendChild(this.iframe);
    });

    return this.readyPromise;
  }

  /** Send a command to execute in the sandbox. */
  async sendCommand(
    command: string,
    args: string[],
    vfs?: VirtualFS,
    options?: {
      onStdout?: (chunk: string) => void;
      onStderr?: (chunk: string) => void;
      timeoutMs?: number;
    },
  ): Promise<WasmerExecResult> {
    if (this.status !== "ready" || !this.iframe?.contentWindow) {
      throw new Error("Sandbox not ready. Call init() first.");
    }

    const id = `cmd_${String(++this.commandCounter)}_${Date.now()}`;
    const files = vfs ? serializeVFS(vfs) : [];

    return new Promise<WasmerExecResult>((resolve, reject) => {
      const pending: PendingCommand = {
        id,
        stdout: "",
        stderr: "",
        onStdout: options?.onStdout,
        onStderr: options?.onStderr,
        resolve,
        reject,
        startTime: performance.now(),
      };

      this.pending.set(id, pending);

      // Timeout
      if (options?.timeoutMs) {
        setTimeout(() => {
          if (this.pending.has(id)) {
            this.pending.delete(id);
            resolve({
              exitCode: 124,
              stdout: pending.stdout,
              stderr: pending.stderr + "\nProcess timed out",
              runtimeMs: performance.now() - pending.startTime,
            });
          }
        }, options.timeoutMs);
      }

      const msg: SandboxCommand = { type: "run", id, command, args, files };
      this.iframe!.contentWindow!.postMessage(msg, window.location.origin);
    });
  }

  /** Sync VFS files to the sandbox without executing a command. */
  syncFiles(vfs: VirtualFS): void {
    if (!this.iframe?.contentWindow) return;
    const files = serializeVFS(vfs);
    const msg: SandboxCommand = { type: "fs-sync", files };
    this.iframe.contentWindow.postMessage(msg, window.location.origin);
  }

  /** Kill the currently running command. */
  kill(id: string): void {
    if (!this.iframe?.contentWindow) return;
    const msg: SandboxCommand = { type: "kill", id };
    this.iframe.contentWindow.postMessage(msg, window.location.origin);
  }

  /** Tear down the bridge and remove the iframe. */
  destroy(): void {
    if (this.messageHandler) {
      window.removeEventListener("message", this.messageHandler);
      this.messageHandler = null;
    }
    if (this.iframe) {
      this.iframe.remove();
      this.iframe = null;
    }
    this.status = "idle";
    this.pending.clear();
    this.readyPromise = null;
    this.readyResolve = null;
  }

  // ── Private ───────────────────────────────────────────────

  private handleMessage(event: MessageEvent<SandboxResponse>): void {
    // Validate origin — only accept messages from our own origin
    if (event.origin !== window.location.origin) return;
    // Validate source — only accept messages from our iframe
    if (this.iframe && event.source !== this.iframe.contentWindow) return;

    const msg = event.data;
    if (!msg || typeof msg !== "object" || !("type" in msg)) return;

    switch (msg.type) {
      case "ready": {
        this.status = "ready";
        this.readyResolve?.();
        break;
      }

      case "stdout": {
        const pending = this.pending.get(msg.id);
        if (pending) {
          pending.stdout += msg.data;
          pending.onStdout?.(msg.data);
        }
        break;
      }

      case "stderr": {
        const pending = this.pending.get(msg.id);
        if (pending) {
          pending.stderr += msg.data;
          pending.onStderr?.(msg.data);
        }
        break;
      }

      case "exit": {
        const pending = this.pending.get(msg.id);
        if (pending) {
          this.pending.delete(msg.id);
          pending.resolve({
            exitCode: msg.code,
            stdout: pending.stdout,
            stderr: pending.stderr,
            runtimeMs: msg.runtimeMs,
          });
        }
        break;
      }

      case "error": {
        const pending = this.pending.get(msg.id);
        if (pending) {
          pending.stderr += msg.message;
          pending.onStderr?.(msg.message);
        }
        break;
      }

      case "fs-write": {
        this.onFsWrite?.(msg.path, msg.content);
        break;
      }

      case "fs-delete": {
        this.onFsDelete?.(msg.path);
        break;
      }
    }
  }
}

/** Singleton bridge instance. */
let bridgeInstance: WasmerBridge | null = null;

function getWasmerBridge(): WasmerBridge {
  if (!bridgeInstance) {
    bridgeInstance = new WasmerBridge();
  }
  return bridgeInstance;
}

export { WasmerBridge, getWasmerBridge };

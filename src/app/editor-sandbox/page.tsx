"use client";

/**
 * Editor Sandbox — isolated iframe page for Wasmer/WASIX execution.
 *
 * This page runs with COOP/COEP headers (set in next.config.ts for this route only)
 * to enable SharedArrayBuffer support needed by @wasmer/sdk.
 *
 * It is loaded inside a hidden <iframe> by WasmerBridge.ts and communicates
 * with the parent via postMessage. It should never be navigated to directly.
 */

import { useEffect, useState } from "react";

type SandboxStatus = "initializing" | "ready" | "error";

export default function EditorSandboxPage() {
  const [status, setStatus] = useState<SandboxStatus>("initializing");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Only run inside an iframe
    if (window === window.parent) {
      setStatus("error");
      setErrorMsg("This page must be loaded inside an iframe.");
      return;
    }

    async function boot() {
      try {
        const { initSandboxShell } =
          await import("../../infra/runtime/wasmer/wasmerShell");
        await initSandboxShell();
        setStatus("ready");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setStatus("error");
        setErrorMsg(msg);
        console.error("[sandbox] Failed to initialize:", err);
      }
    }

    void boot();
  }, []);

  // This page has no visible UI — it's a headless worker iframe.
  // Status is only shown if someone navigates here directly.
  if (status === "error") {
    return (
      <div style={{ padding: 20, fontFamily: "monospace", color: "var(--status-error)" }}>
        <p>Sandbox Error: {errorMsg}</p>
      </div>
    );
  }

  return null;
}

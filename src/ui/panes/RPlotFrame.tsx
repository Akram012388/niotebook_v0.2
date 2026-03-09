/**
 * R plot frame utility.
 *
 * Renders an R plot SVG into the runtime frame container.
 * The container div (id="niotebook-runtime-frame") is owned by TerminalPanel.
 *
 * Note: a full useRef migration requires TerminalPanel.tsx to accept a forwarded
 * ref for the container — tracked separately as part of the 2C-4 follow-up.
 */
function renderRPlot(svgData: string): void {
  const container = document.getElementById("niotebook-runtime-frame");
  if (!container) {
    console.error(
      "[runtime] R plot container #niotebook-runtime-frame not found",
    );
    return;
  }

  const frame = document.createElement("iframe");
  frame.style.width = "100%";
  frame.style.height = "100%";
  frame.style.border = "none";
  frame.srcdoc = `<!DOCTYPE html><html><head><style>body{margin:0;display:flex;align-items:center;justify-content:center;background:#1C1917;min-height:100vh}svg{max-width:100%;max-height:100vh}</style></head><body>${svgData}</body></html>`;
  container.replaceChildren(frame);
}

export { renderRPlot };

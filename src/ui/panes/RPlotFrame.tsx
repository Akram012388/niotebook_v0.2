/**
 * R plot frame utility.
 *
 * Renders an R plot SVG into the runtime frame container.
 * The container div (id="niotebook-runtime-frame") is owned by TerminalPanel.
 *
 * Security: the iframe sandbox (`allow-same-origin`, no `allow-scripts`) is the
 * primary XSS defense. The DOMParser sanitizer below is defense-in-depth — it
 * strips elements and attributes that should never appear in R plot output.
 */

const SVG_ELEMENT_ALLOWLIST = new Set([
  "svg",
  "g",
  "path",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "text",
  "tspan",
  "textPath",
  "defs",
  "clipPath",
  "mask",
  "pattern",
  "linearGradient",
  "radialGradient",
  "stop",
  "use",
  "symbol",
  "marker",
  "image",
  "title",
  "desc",
  "metadata",
  "style",
]);

const DANGEROUS_ATTR_RE = /^on/i;
const DANGEROUS_URI_RE = /^\s*javascript\s*:/i;

const sanitizeSvgNode = (node: Element): void => {
  const children = Array.from(node.children);
  for (const child of children) {
    if (!SVG_ELEMENT_ALLOWLIST.has(child.localName.toLowerCase())) {
      child.remove();
      continue;
    }

    for (const attr of Array.from(child.attributes)) {
      if (DANGEROUS_ATTR_RE.test(attr.name)) {
        child.removeAttribute(attr.name);
      } else if (
        (attr.name === "href" || attr.name === "xlink:href") &&
        DANGEROUS_URI_RE.test(attr.value)
      ) {
        child.removeAttribute(attr.name);
      }
    }

    sanitizeSvgNode(child);
  }
};

const sanitizeSvg = (svg: string): string => {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");

  if (doc.querySelector("parsererror")) {
    console.warn("[runtime] SVG parse failed during sanitization");
    return "";
  }

  sanitizeSvgNode(doc.documentElement);
  return new XMLSerializer().serializeToString(doc.documentElement);
};

function renderRPlot(svgData: string): void {
  const container = document.getElementById("niotebook-runtime-frame");
  if (!container) {
    console.error(
      "[runtime] R plot container #niotebook-runtime-frame not found",
    );
    return;
  }

  const safeSvg = sanitizeSvg(svgData);

  const frame = document.createElement("iframe");
  frame.style.width = "100%";
  frame.style.height = "100%";
  frame.style.border = "none";
  frame.sandbox.add("allow-same-origin");
  frame.srcdoc = `<!DOCTYPE html><html><head><style>body{margin:0;display:flex;align-items:center;justify-content:center;background:#1C1917;min-height:100vh}svg{max-width:100%;max-height:100vh}</style></head><body>${safeSvg}</body></html>`;
  container.replaceChildren(frame);
}

export { renderRPlot };

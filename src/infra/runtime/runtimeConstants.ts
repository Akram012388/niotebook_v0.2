const RUNTIME_TIMEOUT_MS = 5_000;

/**
 * Sentinel written into stdout/stderr when the output was consumed
 * incrementally via onStdout/onStderr callbacks. Callers that see this
 * value know the real output was already streamed and should not display
 * the field directly.
 */
const STREAMED_SENTINEL = "\x00__streamed__";

/**
 * Reserved sentinel for future inline SVG plot output from Python/R runtimes.
 * Writers embed this prefix so consumers can detect and render the SVG.
 */
const PLOT_SVG_SENTINEL = "\x00__plot_svg__";

export { RUNTIME_TIMEOUT_MS, STREAMED_SENTINEL, PLOT_SVG_SENTINEL };

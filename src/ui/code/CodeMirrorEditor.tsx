"use client";

/**
 * CodeMirror 6 EditorView wrapper.
 *
 * This component is browser-only — it must be loaded via `next/dynamic({ ssr: false })`.
 * It renders a single EditorView whose EditorState is swappable from the parent
 * (for tab switching). The parent provides the initial state; subsequent state
 * updates are communicated via the `onStateChange` callback.
 */
import { useEffect, useRef, type ReactElement } from "react";
import { EditorView } from "@codemirror/view";
import type { EditorState } from "@codemirror/state";

type CodeMirrorEditorProps = {
  /** The CM6 EditorState to display. When this changes identity, the view swaps state. */
  editorState: EditorState;
  /** Called on every document or selection change with the new state. */
  onStateChange: (state: EditorState, docChanged: boolean) => void;
};

const CodeMirrorEditor = ({
  editorState,
  onStateChange,
}: CodeMirrorEditorProps): ReactElement => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  // Create the EditorView once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const view = new EditorView({
      state: editorState,
      parent: containerRef.current,
      dispatch: (tr) => {
        view.update([tr]);
        if (tr.docChanged || tr.selection) {
          onStateChangeRef.current(view.state, tr.docChanged);
        }
      },
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Only run on mount — state swapping handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap EditorState when the parent changes it (tab switch)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    // Only swap if the state identity actually changed
    if (view.state !== editorState) {
      view.setState(editorState);
    }
  }, [editorState]);

  return (
    <div
      ref={containerRef}
      className="min-h-0 flex-1 overflow-hidden"
      role="tabpanel"
      aria-label="Code editor"
      onKeyDown={(e) => {
        // CM6 owns keyboard events when focused — prevent bubbling
        e.stopPropagation();
      }}
    />
  );
};

export default CodeMirrorEditor;
export { CodeMirrorEditor };
export type { CodeMirrorEditorProps };

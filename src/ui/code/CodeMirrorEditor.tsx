"use client";

import { useEffect, useRef, type ReactElement } from "react";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import type { RuntimeLanguage } from "../../infra/runtime/types";
import {
  baseExtensions,
  languageExtension,
  themeExtension,
} from "./codemirrorSetup";

type CodeMirrorEditorProps = {
  value: string;
  language: RuntimeLanguage;
  onChange: (value: string) => void;
  onRun?: () => void;
  className?: string;
};

function isDark(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.getAttribute("data-theme") === "dark";
}

const CodeMirrorEditor = ({
  value,
  language,
  onChange,
  onRun,
  className,
}: CodeMirrorEditorProps): ReactElement => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const langCompartment = useRef(new Compartment());
  const themeCompartment = useRef(new Compartment());
  const keymapCompartment = useRef(new Compartment());
  const isExternalUpdate = useRef(false);
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);

  onChangeRef.current = onChange;
  onRunRef.current = onRun;

  // Create editor on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const runKeymap = keymap.of([
      {
        key: "Mod-Enter",
        run: () => {
          onRunRef.current?.();
          return true;
        },
      },
      {
        key: "Mod-s",
        run: () => true, // prevent default, auto-save handles it
      },
    ]);

    const state = EditorState.create({
      doc: value,
      extensions: [
        ...baseExtensions(),
        langCompartment.current.of(languageExtension(language)),
        themeCompartment.current.of(themeExtension(isDark())),
        keymapCompartment.current.of(runKeymap),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !isExternalUpdate.current) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    // Theme observer
    const observer = new MutationObserver(() => {
      view.dispatch({
        effects: themeCompartment.current.reconfigure(themeExtension(isDark())),
      });
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      observer.disconnect();
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reconfigure language
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: langCompartment.current.reconfigure(languageExtension(language)),
    });
  }, [language]);

  // Sync external value changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return;
    isExternalUpdate.current = true;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
    isExternalUpdate.current = false;
  }, [value]);

  return (
    <div
      ref={containerRef}
      className={`min-h-0 flex-1 overflow-hidden rounded-xl border border-border ${className ?? ""}`}
      data-testid="code-editor"
    />
  );
};

export { CodeMirrorEditor };
export type { CodeMirrorEditorProps };

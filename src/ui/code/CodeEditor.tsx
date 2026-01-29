"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { useMutation, useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import type { CodeSnapshotSummary } from "../../domain/resume";
import { hashString } from "../../infra/hash";
import { useDebouncedValue } from "../../infra/useDebouncedValue";
import type { RuntimeLanguage } from "../../infra/runtime/types";
import { CodeMirrorEditor } from "./CodeMirrorEditor";
import { LanguageTabs } from "./LanguageTabs";

const DEFAULT_CODE_BY_LANGUAGE: Record<RuntimeLanguage, string> = {
  js: "console.log('Hello, CS50');",
  python: "print('Hello, CS50')",
  html: "<h1>Hello, CS50</h1>",
  c: '#include <stdio.h>\n\nint main(void) {\n  printf("Hello, CS50\\n");\n  return 0;\n}\n',
};

type CodeEditorProps = {
  lessonId: string;
  onLanguageChange?: (language: RuntimeLanguage) => void;
  onSnapshot?: (snapshot: CodeSnapshotSummary) => void;
  onRun?: () => void;
};

const CodeEditor = ({
  lessonId,
  onLanguageChange,
  onSnapshot,
  onRun,
}: CodeEditorProps): ReactElement => {
  const [language, setLanguage] = useState<RuntimeLanguage>("js");
  const [code, setCode] = useState(DEFAULT_CODE_BY_LANGUAGE.js);
  const lastHydratedAtRef = useRef<number | null>(null);
  const hydrateTimeoutRef = useRef<number | null>(null);

  const getCodeSnapshotRef = useMemo(
    () =>
      makeFunctionReference<"query">(
        "resume:getCodeSnapshot",
      ) as import("convex/server").FunctionReference<
        "query",
        "public",
        { lessonId: string; language: string },
        CodeSnapshotSummary | null
      >,
    [],
  );

  const upsertSnapshotRef = useMemo(
    () =>
      makeFunctionReference<"mutation">(
        "resume:upsertCodeSnapshot",
      ) as import("convex/server").FunctionReference<
        "mutation",
        "public",
        { lessonId: string; language: string; code: string; codeHash: string },
        CodeSnapshotSummary
      >,
    [],
  );

  const isConvexEnabled = process.env.NEXT_PUBLIC_DISABLE_CONVEX !== "true";

  const snapshot = useQuery(
    getCodeSnapshotRef,
    isConvexEnabled ? { lessonId, language } : "skip",
  );

  const upsertSnapshot = useMutation(upsertSnapshotRef);

  const [localSnapshot, setLocalSnapshot] =
    useState<CodeSnapshotSummary | null>(null);

  const cachedSnapshot = snapshot ?? localSnapshot;

  const debouncedCode = useDebouncedValue(code, 800);

  const fallbackCode = useMemo((): string => {
    return DEFAULT_CODE_BY_LANGUAGE[language];
  }, [language]);

  const hydrateSnapshot = useCallback(
    (summary: CodeSnapshotSummary): void => {
      const nextUpdatedAt = summary.updatedAt ?? Date.now();
      if (lastHydratedAtRef.current === nextUpdatedAt) {
        return;
      }

      lastHydratedAtRef.current = nextUpdatedAt;
      setCode(summary.code);
      onSnapshot?.(summary);
    },
    [onSnapshot],
  );

  useEffect(() => {
    if (hydrateTimeoutRef.current !== null) {
      window.clearTimeout(hydrateTimeoutRef.current);
    }

    const snapshotToUse = snapshot ?? cachedSnapshot;

    hydrateTimeoutRef.current = window.setTimeout(() => {
      if (snapshotToUse) {
        hydrateSnapshot(snapshotToUse);
        return;
      }

      lastHydratedAtRef.current = null;
      setCode(fallbackCode);
    }, 0);

    return () => {
      if (hydrateTimeoutRef.current !== null) {
        window.clearTimeout(hydrateTimeoutRef.current);
      }
    };
  }, [
    cachedSnapshot,
    fallbackCode,
    hydrateSnapshot,
    language,
    lessonId,
    snapshot,
  ]);

  useEffect((): void => {
    onLanguageChange?.(language);
  }, [language, onLanguageChange]);

  const handleLanguageChange = useCallback((next: RuntimeLanguage): void => {
    setLanguage(next);
  }, []);

  const handleCodeChange = useCallback((next: string): void => {
    setCode(next);
  }, []);

  const handleSave = useCallback(async (): Promise<void> => {
    const codeHash = await hashString(code);

    if (!isConvexEnabled) {
      const summary: CodeSnapshotSummary = {
        id: "local-snapshot" as CodeSnapshotSummary["id"],
        userId: "local-user" as CodeSnapshotSummary["userId"],
        lessonId: lessonId as CodeSnapshotSummary["lessonId"],
        language,
        code,
        codeHash,
        updatedAt: Date.now(),
      };

      setLocalSnapshot(summary);
      onSnapshot?.(summary);
      return;
    }

    const summary = await upsertSnapshot({
      lessonId,
      language,
      code,
      codeHash,
    });

    setLocalSnapshot(summary);
    onSnapshot?.(summary);
  }, [code, isConvexEnabled, language, lessonId, onSnapshot, upsertSnapshot]);

  useEffect(() => {
    if (debouncedCode.trim().length === 0) {
      return;
    }

    const persistSnapshot = async (): Promise<void> => {
      const codeHash = await hashString(debouncedCode);

      if (!isConvexEnabled) {
        setLocalSnapshot({
          id: "local-snapshot" as CodeSnapshotSummary["id"],
          userId: "local-user" as CodeSnapshotSummary["userId"],
          lessonId: lessonId as CodeSnapshotSummary["lessonId"],
          language,
          code: debouncedCode,
          codeHash,
          updatedAt: Date.now(),
        });
        return;
      }

      const summary = await upsertSnapshot({
        lessonId,
        language,
        code: debouncedCode,
        codeHash,
      });

      setLocalSnapshot(summary);
    };

    void persistSnapshot();
  }, [debouncedCode, isConvexEnabled, language, lessonId, upsertSnapshot]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <LanguageTabs active={language} onSelect={handleLanguageChange} />
        <button
          type="button"
          onClick={handleSave}
          className="rounded-full border border-border px-3 py-1 text-xs text-text-muted"
        >
          Save snapshot
        </button>
      </div>
      <CodeMirrorEditor
        value={code}
        language={language}
        onChange={handleCodeChange}
        onRun={onRun}
      />
    </div>
  );
};

export { CodeEditor };

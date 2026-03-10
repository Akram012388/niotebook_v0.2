"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, type ReactElement } from "react";

type Provider = "gemini" | "openai" | "anthropic";

const PROVIDER_LABELS: Record<Provider, string> = {
  gemini: "Google Gemini",
  openai: "OpenAI",
  anthropic: "Anthropic",
};

const PROVIDER_PLACEHOLDER: Record<Provider, string> = {
  gemini: "AIza...",
  openai: "sk-proj-...",
  anthropic: "sk-ant-...",
};

type ProviderRowProps = {
  provider: Provider;
  keyHint: string | null;
  isActive: boolean;
  onSetActive: () => void;
};

const ProviderRow = ({
  provider,
  keyHint,
  isActive,
  onSetActive,
}: ProviderRowProps): ReactElement => {
  const saveKey = useAction(api.userApiKeys.save);
  const removeKey = useMutation(api.userApiKeys.remove);

  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (): Promise<void> => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    setSaving(true);
    setError(null);
    try {
      await saveKey({ provider, key: trimmed });
      setEditing(false);
      setInputValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save key.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (): Promise<void> => {
    try {
      await removeKey({ provider });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove key.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter") void handleSave();
    if (e.key === "Escape") {
      setEditing(false);
      setInputValue("");
      setError(null);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-surface px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {keyHint && (
            <button
              type="button"
              onClick={onSetActive}
              disabled={isActive}
              className={`h-3 w-3 rounded-full border-2 transition ${
                isActive
                  ? "border-accent bg-accent"
                  : "border-border bg-transparent hover:border-accent/60"
              }`}
              aria-label={
                isActive
                  ? "Active provider"
                  : `Switch to ${PROVIDER_LABELS[provider]}`
              }
            />
          )}
          <span className="text-sm font-medium text-foreground">
            {PROVIDER_LABELS[provider]}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {keyHint ? (
            <>
              <span className="font-mono text-xs text-text-subtle">
                ••••{keyHint}
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setInputValue("");
                }}
                className="rounded px-1.5 py-0.5 text-xs text-text-muted hover:bg-surface-muted hover:text-foreground transition"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => void handleRemove()}
                className="rounded px-1.5 py-0.5 text-xs text-text-muted hover:bg-surface-muted hover:text-red-500 transition"
              >
                Remove
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded px-1.5 py-0.5 text-xs text-text-muted hover:bg-surface-muted hover:text-foreground transition"
            >
              Add key
            </button>
          )}
        </div>
      </div>

      {editing && (
        <div className="flex flex-col gap-1">
          <div className="flex gap-1.5">
            <input
              type="password"
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={PROVIDER_PLACEHOLDER[provider]}
              className="flex-1 rounded border border-border bg-background px-2 py-1 font-mono text-xs text-foreground outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
            />
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || !inputValue.trim()}
              className="rounded bg-accent px-2 py-1 text-xs font-medium text-white disabled:opacity-50 hover:opacity-90 transition"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setInputValue("");
                setError(null);
              }}
              className="rounded px-2 py-1 text-xs text-text-muted hover:bg-surface-muted transition"
            >
              Cancel
            </button>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
};

const ApiKeySettings = (): ReactElement => {
  const hints = useQuery(api.userApiKeys.listHints);
  const setActiveProvider = useMutation(api.userApiKeys.setActiveProvider);

  const providers: Provider[] = ["gemini", "openai", "anthropic"];

  const getHint = (provider: Provider): string | null =>
    hints?.find((h: { provider: string }) => h.provider === provider)
      ?.keyHint ?? null;

  const isActive = (provider: Provider): boolean =>
    hints?.find(
      (h: { provider: string; isActive: boolean }) => h.provider === provider,
    )?.isActive ?? false;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
        Nio AI Provider
      </p>
      <div className="flex flex-col gap-1.5">
        {providers.map((provider) => (
          <ProviderRow
            key={provider}
            provider={provider}
            keyHint={getHint(provider)}
            isActive={isActive(provider)}
            onSetActive={() => {
              void setActiveProvider({ provider });
            }}
          />
        ))}
      </div>
      <p className="text-xs text-text-subtle leading-relaxed">
        Keys are encrypted and stored securely. Your key is never shown after
        saving.
        <br />
        Get a free Gemini key at{" "}
        <a
          href="https://aistudio.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline-offset-2 hover:underline"
        >
          aistudio.google.com
        </a>
        .
      </p>
    </div>
  );
};

export { ApiKeySettings };

import type { ReactElement } from "react";
import type { RuntimeLanguage } from "../../infra/runtime/types";

type LanguageTabsProps = {
  active: RuntimeLanguage;
  onSelect: (language: RuntimeLanguage) => void;
  /** When provided, only these languages are shown. Defaults to all. */
  allowedLanguages?: RuntimeLanguage[];
};

const ALL_LANGUAGES: RuntimeLanguage[] = ["js", "python", "c", "html", "css"];

const LanguageTabs = ({
  active,
  onSelect,
  allowedLanguages,
}: LanguageTabsProps): ReactElement => {
  const languages = allowedLanguages ?? ALL_LANGUAGES;

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-surface-muted p-1 text-xs text-text-muted">
      {languages.map((language) => (
        <button
          key={language}
          type="button"
          onClick={() => onSelect(language)}
          className={`rounded-full px-3 py-1 ${
            active === language
              ? "bg-surface text-foreground"
              : "text-text-muted"
          }`}
        >
          {language.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export { LanguageTabs };

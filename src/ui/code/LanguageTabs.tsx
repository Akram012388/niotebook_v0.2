import type { ReactElement } from "react";
import type { RuntimeLanguage } from "../../infra/runtime/types";

type LanguageTabsProps = {
  active: RuntimeLanguage;
  onSelect: (language: RuntimeLanguage) => void;
};

const LANGUAGES: RuntimeLanguage[] = ["js", "python", "html", "c"];

const LanguageTabs = ({
  active,
  onSelect,
}: LanguageTabsProps): ReactElement => {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-surface-muted p-1 text-xs text-text-muted">
      {LANGUAGES.map((language) => (
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

const clerkAppearance = {
  variables: {
    colorPrimary: "var(--foreground)",
    colorText: "var(--foreground)",
    colorTextSecondary: "var(--text-muted)",
    colorBackground: "transparent",
    borderRadius: "var(--radius-xl)",
    fontFamily: "var(--font-geist-sans)",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "w-full max-w-none",
    card: "!bg-transparent shadow-none border-none w-full",
    headerTitle:
      "text-xl font-semibold font-[family-name:var(--font-orbitron)]",
    headerSubtitle: "text-sm text-text-muted",
    formButtonPrimary:
      "rounded-lg bg-foreground text-background hover:bg-foreground/90",
    formFieldInput:
      "rounded-lg border border-border bg-surface-muted text-foreground",
    formFieldLabel: "text-sm text-text-muted",
    formFieldErrorText: "text-xs text-status-error mt-1",
    alert: "rounded-lg border border-status-error/20 bg-status-error/5 text-status-error text-sm px-4 py-3",
  },
} as const;

export { clerkAppearance };

const clerkAppearance = {
  variables: {
    colorPrimary: "var(--foreground)",
    colorText: "var(--foreground)",
    colorTextSecondary: "var(--text-muted)",
    colorBackground: "var(--surface)",
    borderRadius: "var(--radius-lg)",
    fontFamily: "var(--font-geist-sans)",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "w-full max-w-none",
    card: "bg-surface border border-border shadow-sm w-full",
    headerTitle:
      "text-xl font-semibold font-[family-name:var(--font-orbitron)]",
    headerSubtitle: "text-sm text-text-muted",
    formButtonPrimary:
      "rounded-lg bg-foreground text-background hover:bg-foreground/90",
    formFieldInput:
      "rounded-lg border border-border bg-surface-muted text-foreground",
    formFieldLabel: "text-sm text-text-muted",
    footer: "rounded-b-xl overflow-hidden",
    footerActionLink: "text-sm text-foreground underline",
  },
} as const;

export { clerkAppearance };

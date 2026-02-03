const clerkAppearance = {
  variables: {
    colorPrimary: "#FAFAFA",
    colorText: "#FAFAFA",
    colorTextSecondary: "#A3A3A3",
    colorBackground: "#171717",
    borderRadius: "0.75rem",
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

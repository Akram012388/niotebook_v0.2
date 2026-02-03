const clerkAppearance = {
  variables: {
    colorPrimary: "#FAFAFA",
    colorText: "#FAFAFA",
    colorTextSecondary: "#A3A3A3",
    colorBackground: "transparent",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-geist-sans)",
  },
  elements: {
    rootBox: "w-full",
    card: "bg-transparent shadow-none p-0 w-full",
    main: "!w-full grow",
    form: "!w-full",
    headerTitle:
      "text-xl font-semibold font-[family-name:var(--font-orbitron)]",
    headerSubtitle: "text-sm text-text-muted",
    formButtonPrimary:
      "!w-full rounded-lg bg-foreground text-background hover:bg-foreground/90",
    formFieldInput:
      "!w-full rounded-lg border border-border bg-surface-muted text-foreground",
    formFieldLabel: "text-sm text-text-muted",
    formFieldRow: "!w-full",
    footer: "!w-full rounded-b-xl overflow-hidden",
    footerActionLink: "text-sm text-foreground underline",
  },
} as const;

export { clerkAppearance };

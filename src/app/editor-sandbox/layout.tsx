/**
 * Sandbox layout — minimal, no providers.
 * COOP/COEP headers are set via next.config.ts route-level headers.
 * This layout intentionally does NOT include Clerk, Convex, or other providers.
 */
export const metadata = {
  title: "Niotebook Editor Sandbox",
  robots: "noindex, nofollow",
};

export default function EditorSandboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import { Providers } from "./providers";
import { DevAuthBypassProvider } from "./DevAuthBypassProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: "700",
});

export const metadata: Metadata = {
  title: "Niotebook — Watch. Code. Learn.",
  description:
    "Your CS lecture just became an IDE. Video + editor + AI in one canvas, zero tab-switching.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/favicons/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Niotebook — Watch. Code. Learn.",
    description:
      "Your CS lecture just became an IDE. Video + editor + AI in one canvas, zero tab-switching.",
    type: "website",
    url: "https://niotebook.com",
    siteName: "Niotebook",
    images: [
      {
        url: "/og/og-image.png",
        width: 1200,
        height: 630,
        alt: "Niotebook — Watch. Code. Learn.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Niotebook — Watch. Code. Learn.",
    description:
      "Your CS lecture just became an IDE. Video + editor + AI in one canvas.",
    images: ["/og/og-image.png"],
  },
};

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const isE2ePreview = process.env.NEXT_PUBLIC_NIOTEBOOK_E2E_PREVIEW === "true";
  const isDevBypass = process.env.NIOTEBOOK_DEV_AUTH_BYPASS === "true";

  // Dynamic import — @clerk/nextjs requires CLERK_SECRET_KEY at module init.
  // When dev auth bypass is active, skip the import entirely to avoid errors.
  let AuthWrapper: React.ComponentType<{ children: ReactNode }> = ({
    children: c,
  }) => <>{c}</>;
  if (!isDevBypass) {
    const { ClerkProviderWrapper } = await import("./ClerkProviderWrapper");
    AuthWrapper = ClerkProviderWrapper;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {isE2ePreview ? <meta name="niotebook-e2e" content="ready" /> : null}
        {/* Preload Pyodide — must match PYODIDE_SCRIPT_URL in pythonExecutor.ts.
            Use rel="preload" (not modulepreload) because pyodide.js is a classic
            script loaded via script.src, not an ES module. */}
        <link
          rel="preload"
          as="script"
          href="https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js"
          crossOrigin="anonymous"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("niotebook.theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}else if(window.matchMedia("(prefers-color-scheme:dark)").matches){document.documentElement.setAttribute("data-theme","dark")}else{document.documentElement.setAttribute("data-theme","light")}}catch(e){document.documentElement.setAttribute("data-theme","light")}})()`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} antialiased bg-background text-foreground nio-pattern`}
      >
        <AuthWrapper>
          <DevAuthBypassProvider bypassEnabled={isDevBypass}>
            <Providers>{children}</Providers>
          </DevAuthBypassProvider>
        </AuthWrapper>
      </body>
    </html>
  );
}

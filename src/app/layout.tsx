import type { Metadata } from "next";
import type { ReactElement, ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import { Providers } from "./providers";
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
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "Niotebook — Watch. Code. Learn.",
  description:
    "Your CS lecture just became an IDE. Video + editor + AI in one canvas, zero tab-switching.",
  openGraph: {
    title: "Niotebook — Watch. Code. Learn.",
    description:
      "Your CS lecture just became an IDE. Video + editor + AI in one canvas, zero tab-switching.",
    type: "website",
    url: "https://niotebook.com",
    siteName: "Niotebook",
  },
  twitter: {
    card: "summary_large_image",
    title: "Niotebook — Watch. Code. Learn.",
    description:
      "Your CS lecture just became an IDE. Video + editor + AI in one canvas.",
  },
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({
  children,
}: RootLayoutProps): ReactElement {
  const isE2ePreview = process.env.NEXT_PUBLIC_NIOTEBOOK_E2E_PREVIEW === "true";

  return (
    <html lang="en">
      <head>
        {isE2ePreview ? <meta name="niotebook-e2e" content="ready" /> : null}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} antialiased bg-background text-foreground`}
      >
        <ClerkProvider>
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}

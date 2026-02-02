import type { ReactElement } from "react";
import Image from "next/image";
import Link from "next/link";

type WordmarkProps = {
  /** Height in pixels — width scales proportionally (aspect ratio ~5.22:1) */
  height?: number;
  className?: string;
};

/**
 * SVG wordmark linked to home. Switches between light/dark variants
 * based on theme. Context-dependent sizing via `height` prop.
 */
export function Wordmark({
  height = 28,
  className,
}: WordmarkProps): ReactElement {
  return (
    <Link
      href="/"
      className={`inline-flex shrink-0 items-center ${className ?? ""}`}
      aria-label="niotebook — home"
    >
      {/* Light theme: dark text wordmark */}
      <Image
        src="/niotebook-wordmark-light.svg"
        alt="niotebook"
        width={Math.round(height * (752 / 144))}
        height={height}
        priority
        className="block dark:hidden"
        style={{ height, width: "auto" }}
      />
      {/* Dark theme: light text wordmark */}
      <Image
        src="/niotebook-wordmark-dark.svg"
        alt="niotebook"
        width={Math.round(height * (752 / 144))}
        height={height}
        priority
        className="hidden dark:block"
        style={{ height, width: "auto" }}
      />
    </Link>
  );
}

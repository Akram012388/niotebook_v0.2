import type { ReactElement } from "react";
import Link from "next/link";

type WordmarkProps = {
  /** Height in pixels — font-size scales proportionally */
  height?: number;
  className?: string;
  /** Link destination — defaults to "/" */
  href?: string;
};

/**
 * Text-based wordmark using Orbitron. The 'i' is rendered in the
 * accent color (terracotta) as a brand mark. Linked to home.
 */
export function Wordmark({
  height = 28,
  className,
  href = "/",
}: WordmarkProps): ReactElement {
  // Orbitron at ~85% of container height for a bolder, more prominent mark
  const fontSize = Math.round(height * 0.85);

  return (
    <Link
      href={href}
      className={`inline-flex shrink-0 items-center ${className ?? ""}`}
      aria-label="niotebook — home"
      style={{ height }}
    >
      <span
        className="font-display tracking-tight leading-none text-foreground"
        style={{ fontSize, fontWeight: 700 }}
      >
        n
        <span className="text-accent" style={{ fontSize: fontSize * 1.05 }}>
          i
        </span>
        otebook
      </span>
    </Link>
  );
}

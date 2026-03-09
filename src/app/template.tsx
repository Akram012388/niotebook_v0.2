"use client";

import dynamic from "next/dynamic";
import { type ReactElement, type ReactNode } from "react";

const PageTransition = dynamic(
  () => import("@/ui/shared/PageTransition").then((m) => m.PageTransition),
  { ssr: false },
);

type TemplateProps = {
  children: ReactNode;
};

export default function Template({ children }: TemplateProps): ReactElement {
  return <PageTransition>{children}</PageTransition>;
}

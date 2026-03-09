"use client";

import dynamic from "next/dynamic";
import { Component, type ReactElement, type ReactNode } from "react";

const PageTransition = dynamic(
  () => import("@/ui/shared/PageTransition").then((m) => m.PageTransition),
  { ssr: false },
);

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { failed: boolean };

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  render(): ReactNode {
    if (this.state.failed) {
      return <>{this.props.children}</>;
    }
    return <PageTransition>{this.props.children}</PageTransition>;
  }
}

type TemplateProps = {
  children: ReactNode;
};

export default function Template({ children }: TemplateProps): ReactElement {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

"use client";

import { type ReactElement, type ReactNode } from "react";

import { SidebarShell } from "@/ui/shell/SidebarShell";

interface CoursesLayoutProps {
  children: ReactNode;
}

export default function CoursesLayout({
  children,
}: CoursesLayoutProps): ReactElement {
  return <SidebarShell>{children}</SidebarShell>;
}

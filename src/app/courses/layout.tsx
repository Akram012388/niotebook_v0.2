import { type ReactElement, type ReactNode } from "react";

import { SiteNav } from "@/ui/shared/SiteNav";
import { CoursesNavActions } from "@/ui/courses/CoursesNavActions";
import { MobileGate } from "@/ui/shared/MobileGate";

interface CoursesLayoutProps {
  children: ReactNode;
}

export default function CoursesLayout({
  children,
}: CoursesLayoutProps): ReactElement {
  return (
    <MobileGate>
      <SiteNav wordmarkHref="/courses">
        <CoursesNavActions />
      </SiteNav>
      <main className="pt-[72px]">{children}</main>
    </MobileGate>
  );
}

import { type ReactElement } from "react";
import { AuthGate } from "@/ui/auth/AuthGate";
import { CoursesPage } from "@/ui/courses/CoursesPage";
import { ForceTheme } from "@/ui/ForceTheme";

export default function CoursesRoute(): ReactElement {
  return (
    <AuthGate>
      <ForceTheme theme="dark" />
      <CoursesPage />
    </AuthGate>
  );
}

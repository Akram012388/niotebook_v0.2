import { type ReactElement } from "react";
import { AuthGate } from "@/ui/auth/AuthGate";
import { CoursesPage } from "@/ui/courses/CoursesPage";

export default function CoursesRoute(): ReactElement {
  return (
    <AuthGate>
      <CoursesPage />
    </AuthGate>
  );
}

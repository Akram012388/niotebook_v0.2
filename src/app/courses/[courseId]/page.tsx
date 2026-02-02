import { type ReactElement } from "react";
import { AuthGate } from "@/ui/auth/AuthGate";
import { CourseDetailPage } from "@/ui/courses/CourseDetailPage";
import { ForceTheme } from "@/ui/ForceTheme";

type CoursePageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function CoursePage({
  params,
}: CoursePageProps): Promise<ReactElement> {
  const { courseId } = await params;

  return (
    <AuthGate>
      <ForceTheme theme="dark" />
      <CourseDetailPage courseId={courseId} />
    </AuthGate>
  );
}

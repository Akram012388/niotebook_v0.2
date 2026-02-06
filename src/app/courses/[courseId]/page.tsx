import { type ReactElement } from "react";
import { AuthGate } from "@/ui/auth/AuthGate";
import { CourseDetailPage } from "@/ui/courses/CourseDetailPage";

type CoursePageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function CoursePage({
  params,
}: CoursePageProps): Promise<ReactElement> {
  const { courseId } = await params;

  return (
    <AuthGate>
      <CourseDetailPage courseId={courseId} />
    </AuthGate>
  );
}

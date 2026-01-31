"use client";

import { memo, type ReactElement, type ReactNode } from "react";

type CourseCarouselProps = {
  title: string;
  children: ReactNode;
};

const CourseCarousel = memo(function CourseCarousel({
  title,
  children,
}: CourseCarouselProps): ReactElement {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
        {children}
      </div>
    </section>
  );
});

export { CourseCarousel };

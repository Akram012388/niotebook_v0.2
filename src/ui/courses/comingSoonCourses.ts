type ComingSoonCourse = {
  title: string;
  provider: string;
};

const COMING_SOON_COURSES: readonly ComingSoonCourse[] = [
  { title: "MIT 6.006", provider: "MIT OpenCourseWare" },
  { title: "Stanford CS106A", provider: "Stanford" },
  { title: "Google IT Support Certificate", provider: "Google" },
  { title: "Meta Frontend Developer", provider: "Meta" },
  { title: "freeCodeCamp Web Dev", provider: "freeCodeCamp" },
  { title: "Khan Academy Computing", provider: "Khan Academy" },
];

export { COMING_SOON_COURSES };
export type { ComingSoonCourse };

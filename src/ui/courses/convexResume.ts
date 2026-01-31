import { makeFunctionReference } from "convex/server";
import type { ResumeEntry } from "../../../convex/resume";

type ResumeDataReference = import("convex/server").FunctionReference<
  "query",
  "public",
  Record<string, never>,
  ResumeEntry[]
>;

const getResumeDataRef = makeFunctionReference<"query">(
  "resume:getResumeData",
) as ResumeDataReference;

export { getResumeDataRef };

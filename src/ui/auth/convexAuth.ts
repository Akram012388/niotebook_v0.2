import { makeFunctionReference } from "convex/server";

type UpsertUserReference = import("convex/server").FunctionReference<
  "mutation",
  "public",
  Record<string, never>,
  { userId: string; role: "admin" | "user" }
>;

const upsertUserRef = makeFunctionReference<"mutation">(
  "users:upsertUser",
) as UpsertUserReference;

type MeReference = import("convex/server").FunctionReference<
  "query",
  "public",
  Record<string, never>,
  { role: "admin" | "user" } | null
>;

const meRef = makeFunctionReference<"query">("users:me") as MeReference;

export { upsertUserRef, meRef };

import { makeFunctionReference } from "convex/server";

type UpsertUserReference = import("convex/server").FunctionReference<
  "mutation",
  "public",
  { inviteBatchId?: string },
  { userId: string; role: "admin" | "user" }
>;

const upsertUserRef = makeFunctionReference<"mutation">(
  "users:upsertUser",
) as UpsertUserReference;

export { upsertUserRef };

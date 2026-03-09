/**
 * Shared MutationCtx type alias for Convex backend helper functions.
 *
 * Both mutations and internal helpers need a typed `ctx` parameter.
 * Rather than repeating the three-step type derivation in every file,
 * import MutationCtx from here.
 *
 * Usage:
 *   import type { MutationCtx } from "./lib/mutationCtx";
 */

import { mutation } from "../_generated/server";

type MutationDefinition = Parameters<typeof mutation>[0];

type MutationConfig = Extract<
  MutationDefinition,
  { handler: (...args: never[]) => unknown }
>;

type MutationCtx = Parameters<MutationConfig["handler"]>[0];

export type { MutationCtx };

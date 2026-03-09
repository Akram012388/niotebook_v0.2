/**
 * Shared MutationCtx type alias for Convex backend helper functions.
 *
 * Both mutations and internal helpers need a typed `ctx` parameter.
 * Rather than repeating the import path in every file, import MutationCtx here.
 *
 * Usage:
 *   import type { MutationCtx } from "./lib/mutationCtx";
 */

export type { MutationCtx } from "../_generated/server";

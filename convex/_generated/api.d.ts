/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as chat from "../chat.js";
import type * as content from "../content.js";
import type * as crons from "../crons.js";
import type * as events from "../events.js";
import type * as feedback from "../feedback.js";
import type * as idUtils from "../idUtils.js";
import type * as ingest from "../ingest.js";
import type * as lessonCompletions from "../lessonCompletions.js";
import type * as lib_crypto from "../lib/crypto.js";
import type * as lib_mutationCtx from "../lib/mutationCtx.js";
import type * as maintenance from "../maintenance.js";
import type * as rateLimits from "../rateLimits.js";
import type * as resume from "../resume.js";
import type * as seed from "../seed.js";
import type * as transcripts from "../transcripts.js";
import type * as userApiKeys from "../userApiKeys.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  auth: typeof auth;
  chat: typeof chat;
  content: typeof content;
  crons: typeof crons;
  events: typeof events;
  feedback: typeof feedback;
  idUtils: typeof idUtils;
  ingest: typeof ingest;
  lessonCompletions: typeof lessonCompletions;
  "lib/crypto": typeof lib_crypto;
  "lib/mutationCtx": typeof lib_mutationCtx;
  maintenance: typeof maintenance;
  rateLimits: typeof rateLimits;
  resume: typeof resume;
  seed: typeof seed;
  transcripts: typeof transcripts;
  userApiKeys: typeof userApiKeys;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

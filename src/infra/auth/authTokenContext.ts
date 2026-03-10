"use client";

import { createContext, useContext } from "react";

/**
 * Function signature for getting an auth token (matches Clerk's getToken).
 * Returns null when no provider is available (dev auth bypass).
 */
type GetTokenFn = (opts?: { template?: string }) => Promise<string | null>;

const noopGetToken: GetTokenFn = async () => null;

/**
 * Provides getToken to components that need auth tokens (e.g. SSE chat).
 * Populated by ConvexWithClerk when Clerk is active; falls back to noop.
 */
const AuthTokenContext = createContext<GetTokenFn>(noopGetToken);

function useAuthToken(): GetTokenFn {
  return useContext(AuthTokenContext);
}

export { AuthTokenContext, useAuthToken };

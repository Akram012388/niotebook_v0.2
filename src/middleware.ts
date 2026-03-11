import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from "next/server";

type NextMiddleware = (
  request: NextRequest,
  event: NextFetchEvent,
) => Response | Promise<Response>;

const isDevBypass = process.env.NIOTEBOOK_DEV_AUTH_BYPASS === "true";

let cachedClerkHandler: NextMiddleware | undefined;

async function getClerkHandler(): Promise<NextMiddleware> {
  if (!cachedClerkHandler) {
    // Finding 1 fix: guard the dynamic import so a cold-start failure
    // (missing CLERK_SECRET_KEY, package resolution error, etc.) produces
    // a logged, descriptive error instead of a silent edge-runtime 500.
    // We deliberately do NOT assign cachedClerkHandler before throwing so
    // the next request can retry rather than fast-pathing to broken state.
    let clerkModule: typeof import("@clerk/nextjs/server");
    try {
      clerkModule = await import("@clerk/nextjs/server");
    } catch (err) {
      console.error(
        "[middleware] Failed to import @clerk/nextjs/server. " +
          "Ensure CLERK_SECRET_KEY is set and the package is installed.",
        err,
      );
      throw new Error(
        "Authentication service unavailable: Clerk middleware could not be loaded.",
      );
    }

    const { clerkMiddleware, createRouteMatcher } = clerkModule;
    const isProtectedRoute = createRouteMatcher([
      "/workspace",
      "/workspace/(.*)",
      "/admin",
      "/admin/(.*)",
    ]);

    // Finding 3 note: `clerkMiddleware` returns a type that is structurally
    // compatible with NextMiddleware but not directly assignable due to
    // Clerk's branded NextResponse subtype. The double cast is required
    // until upstream resolves the type incompatibility between
    // @clerk/nextjs middleware and next/server types.
    cachedClerkHandler = clerkMiddleware(async (auth, request) => {
      if (isProtectedRoute(request)) {
        // Finding 2 fix: guard URL construction — request.url is always an
        // absolute URL in Edge middleware under normal conditions, but a
        // malformed base (e.g. reverse proxy stripping the scheme) would
        // throw a TypeError and silently crash the callback before
        // auth.protect() is called.
        let unauthenticatedUrl: string;
        try {
          unauthenticatedUrl = new URL("/sign-in", request.url).href;
        } catch {
          console.warn(
            `[middleware] Could not build absolute unauthenticatedUrl from ` +
              `request.url="${request.url}". Falling back to "/sign-in".`,
          );
          unauthenticatedUrl = "/sign-in";
        }
        await auth.protect({ unauthenticatedUrl });
      }
    }) as unknown as NextMiddleware;
  }
  return cachedClerkHandler;
}

// Dev auth bypass skips Clerk middleware — authentication is handled by
// the Convex backend dev bypass user (convex/auth.ts).
export default async function middleware(
  request: NextRequest,
  event: NextFetchEvent,
) {
  if (isDevBypass) {
    return NextResponse.next();
  }
  const handler = await getClerkHandler();
  return handler(request, event);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};

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
    const { clerkMiddleware, createRouteMatcher } =
      await import("@clerk/nextjs/server");
    const isProtectedRoute = createRouteMatcher([
      "/workspace",
      "/workspace/(.*)",
      "/admin",
      "/admin/(.*)",
    ]);
    cachedClerkHandler = clerkMiddleware(async (auth, request) => {
      if (isProtectedRoute(request)) {
        await auth.protect();
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

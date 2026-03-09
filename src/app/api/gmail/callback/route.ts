import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/infra/email/gmailClient";

/** GET /api/gmail/callback — OAuth callback from Google. Exchanges code for tokens. */
export const GET = async (request: NextRequest): Promise<Response> => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stateSecret = process.env.GMAIL_OAUTH_STATE_SECRET;
  if (stateSecret) {
    const state = request.nextUrl.searchParams.get("state");
    if (state !== stateSecret) {
      return NextResponse.json({ error: "Invalid state" }, { status: 403 });
    }
  }

  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.json(
      { error: `OAuth error: ${error}` },
      { status: 400 },
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: "Missing authorization code" },
      { status: 400 },
    );
  }

  try {
    await exchangeCodeForTokens(code);
    return NextResponse.json({
      status: "authenticated",
      message:
        "Gmail authorization successful! niotebook@gmail.com is now connected.",
    });
  } catch {
    return NextResponse.json(
      { error: "OAuth callback failed" },
      { status: 500 },
    );
  }
};

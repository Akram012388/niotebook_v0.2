import { type NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/infra/email/gmailClient";

/** GET /api/gmail/callback — OAuth callback from Google. Exchanges code for tokens. */
export const GET = async (request: NextRequest): Promise<Response> => {
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
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Token exchange failed: ${message}` },
      { status: 500 },
    );
  }
};

import { NextResponse } from "next/server";
import { getAuthUrl, isAuthenticated } from "@/infra/email/gmailClient";

/** GET /api/gmail/auth — Redirects to Google OAuth consent screen. */
export const GET = async (): Promise<Response> => {
  const alreadyAuth = await isAuthenticated();
  if (alreadyAuth) {
    return NextResponse.json({
      status: "already_authenticated",
      message: "Gmail is already authenticated. Visit /api/gmail/status for details.",
    });
  }

  const url = getAuthUrl();
  return NextResponse.redirect(url);
};

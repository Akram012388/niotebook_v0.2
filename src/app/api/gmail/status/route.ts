import { NextResponse } from "next/server";
import { isAuthenticated } from "@/infra/email/gmailClient";
import { listLabels } from "@/infra/email/gmailService";

/** GET /api/gmail/status — Check Gmail connection status. */
export const GET = async (): Promise<Response> => {
  const authed = await isAuthenticated();

  if (!authed) {
    return NextResponse.json({
      authenticated: false,
      message: "Gmail not connected. Visit /api/gmail/auth to authorize.",
    });
  }

  try {
    const labels = await listLabels();
    const inbox = labels.find((l) => l.id === "INBOX");

    return NextResponse.json({
      authenticated: true,
      account: "niotebook@gmail.com",
      inbox: {
        total: inbox?.messagesTotal ?? 0,
        unread: inbox?.messagesUnread ?? 0,
      },
      labels: labels.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({
      authenticated: true,
      account: "niotebook@gmail.com",
      error: `Failed to fetch account info: ${message}`,
    });
  }
};

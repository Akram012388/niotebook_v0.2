import { type NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/infra/email/gmailService";

/** POST /api/gmail/send — Send an email from niotebook@gmail.com. */
export const POST = async (request: NextRequest): Promise<Response> => {
  try {
    const body = await request.json();

    const { to, subject, body: emailBody, cc, bcc, isHtml } = body as {
      to?: string;
      subject?: string;
      body?: string;
      cc?: string;
      bcc?: string;
      isHtml?: boolean;
    };

    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, body" },
        { status: 400 },
      );
    }

    const messageId = await sendEmail({
      to,
      subject,
      body: emailBody,
      cc,
      bcc,
      isHtml,
    });

    return NextResponse.json({ success: true, messageId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

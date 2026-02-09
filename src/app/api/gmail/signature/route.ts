import { type NextRequest, NextResponse } from "next/server";
import { getSignature, setSignature } from "@/infra/email/gmailService";

/** GET /api/gmail/signature — Get the current email signature. */
export const GET = async (): Promise<Response> => {
  try {
    const signature = await getSignature();
    return NextResponse.json({ signature });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

/** POST /api/gmail/signature — Set the email signature. Body: { html: string }. */
export const POST = async (request: NextRequest): Promise<Response> => {
  try {
    const body = await request.json();
    const { html } = body as { html?: string };

    if (!html) {
      return NextResponse.json(
        { error: "Missing required field: html" },
        { status: 400 },
      );
    }

    await setSignature(html);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

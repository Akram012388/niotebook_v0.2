import { type NextRequest, NextResponse } from "next/server";
import {
  listMessages,
  getMessage,
  markAsRead,
  markAsUnread,
  archiveMessage,
  trashMessage,
} from "@/infra/email/gmailService";

/** GET /api/gmail/messages — List messages. Query params: q, labelIds, maxResults, pageToken. */
export const GET = async (request: NextRequest): Promise<Response> => {
  try {
    const { searchParams } = request.nextUrl;

    const result = await listMessages({
      query: searchParams.get("q") ?? undefined,
      labelIds: searchParams.get("labelIds")?.split(",") ?? undefined,
      maxResults: searchParams.has("maxResults")
        ? Number(searchParams.get("maxResults"))
        : undefined,
      pageToken: searchParams.get("pageToken") ?? undefined,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

/** POST /api/gmail/messages — Perform actions on a message: get, markRead, markUnread, archive, trash. */
export const POST = async (request: NextRequest): Promise<Response> => {
  try {
    const body = await request.json();
    const { action, messageId } = body as {
      action?: string;
      messageId?: string;
    };

    if (!action || !messageId) {
      return NextResponse.json(
        { error: "Missing required fields: action, messageId" },
        { status: 400 },
      );
    }

    switch (action) {
      case "get": {
        const msg = await getMessage(messageId);
        return NextResponse.json(msg);
      }
      case "markRead": {
        await markAsRead(messageId);
        return NextResponse.json({ success: true });
      }
      case "markUnread": {
        await markAsUnread(messageId);
        return NextResponse.json({ success: true });
      }
      case "archive": {
        await archiveMessage(messageId);
        return NextResponse.json({ success: true });
      }
      case "trash": {
        await trashMessage(messageId);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

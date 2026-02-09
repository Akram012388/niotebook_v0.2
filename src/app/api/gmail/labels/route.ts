import { type NextRequest, NextResponse } from "next/server";
import {
  listLabels,
  createLabel,
  modifyMessage,
} from "@/infra/email/gmailService";

/** GET /api/gmail/labels — List all Gmail labels. */
export const GET = async (): Promise<Response> => {
  try {
    const labels = await listLabels();
    return NextResponse.json({ labels });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

/** POST /api/gmail/labels — Create a label or apply labels to a message. */
export const POST = async (request: NextRequest): Promise<Response> => {
  try {
    const body = await request.json();
    const { action } = body as { action?: string };

    if (action === "create") {
      const { name } = body as { name?: string };
      if (!name) {
        return NextResponse.json(
          { error: "Missing required field: name" },
          { status: 400 },
        );
      }
      const label = await createLabel(name);
      return NextResponse.json(label);
    }

    if (action === "apply") {
      const { messageId, addLabelIds, removeLabelIds } = body as {
        messageId?: string;
        addLabelIds?: string[];
        removeLabelIds?: string[];
      };

      if (!messageId) {
        return NextResponse.json(
          { error: "Missing required field: messageId" },
          { status: 400 },
        );
      }

      await modifyMessage(messageId, addLabelIds ?? [], removeLabelIds ?? []);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Missing or unknown action. Use 'create' or 'apply'." },
      { status: 400 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

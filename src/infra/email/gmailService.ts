/**
 * Gmail service — high-level operations using raw fetch (no googleapis).
 *
 * All API calls go through gmailFetch/peopleFetch from gmailClient.ts
 * which handles auth, token refresh, and error propagation.
 */

import { gmailFetch, peopleFetch } from "./gmailClient";
import type {
  GmailApiLabel,
  GmailApiLabelList,
  GmailApiMessage,
  GmailApiMessageList,
  GmailApiPayloadPart,
  GmailApiSendAs,
  GmailLabel,
  GmailListParams,
  GmailListResult,
  GmailMessage,
  GmailMessageSummary,
  SendEmailParams,
} from "./types";

const NIOTEBOOK_EMAIL = "niotebook@gmail.com";

// ---------------------------------------------------------------------------
// Send
// ---------------------------------------------------------------------------

/** Send an email from niotebook@gmail.com. */
export const sendEmail = async (params: SendEmailParams): Promise<string> => {
  const headers = [
    `From: ${NIOTEBOOK_EMAIL}`,
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: ${params.isHtml ? "text/html" : "text/plain"}; charset=utf-8`,
  ];

  if (params.cc) headers.push(`Cc: ${params.cc}`);
  if (params.bcc) headers.push(`Bcc: ${params.bcc}`);
  if (params.replyToMessageId) {
    headers.push(`In-Reply-To: ${params.replyToMessageId}`);
    headers.push(`References: ${params.replyToMessageId}`);
  }

  const raw = encodeBase64Url(
    `${headers.join("\r\n")}\r\n\r\n${params.body}`,
  );

  const res = await gmailFetch("/messages/send", {
    method: "POST",
    body: JSON.stringify({ raw }),
  });
  const data = (await res.json()) as { id?: string };
  return data.id ?? "";
};

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/** List messages with optional search query and label filters. */
export const listMessages = async (
  params: GmailListParams = {},
): Promise<GmailListResult> => {
  const searchParams = new URLSearchParams();
  if (params.query) searchParams.set("q", params.query);
  if (params.labelIds) {
    for (const id of params.labelIds) searchParams.append("labelIds", id);
  }
  searchParams.set("maxResults", String(params.maxResults ?? 20));
  if (params.pageToken) searchParams.set("pageToken", params.pageToken);

  const res = await gmailFetch(`/messages?${searchParams}`);
  const data = (await res.json()) as GmailApiMessageList;
  const messages = data.messages ?? [];

  const summaries: GmailMessageSummary[] = await Promise.all(
    messages.map(async (msg) => {
      const detail = await gmailFetch(
        `/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
      );
      const d = (await detail.json()) as GmailApiMessage;
      const h = d.payload?.headers ?? [];
      const get = (name: string) =>
        h.find((x) => x.name.toLowerCase() === name.toLowerCase())?.value ?? "";

      return {
        id: d.id,
        threadId: d.threadId,
        snippet: d.snippet,
        subject: get("Subject"),
        from: get("From"),
        date: get("Date"),
        labelIds: d.labelIds ?? [],
        isUnread: (d.labelIds ?? []).includes("UNREAD"),
      };
    }),
  );

  return {
    messages: summaries,
    nextPageToken: data.nextPageToken,
    resultSizeEstimate: data.resultSizeEstimate ?? 0,
  };
};

/** Get a single message by ID with full body content. */
export const getMessage = async (messageId: string): Promise<GmailMessage> => {
  const res = await gmailFetch(`/messages/${messageId}?format=full`);
  const d = (await res.json()) as GmailApiMessage;

  const h = d.payload?.headers ?? [];
  const get = (name: string) =>
    h.find((x) => x.name.toLowerCase() === name.toLowerCase())?.value ?? "";

  return {
    id: d.id,
    threadId: d.threadId,
    snippet: d.snippet,
    subject: get("Subject"),
    from: get("From"),
    to: get("To"),
    date: get("Date"),
    body: extractBody(d.payload),
    labelIds: d.labelIds ?? [],
    isUnread: (d.labelIds ?? []).includes("UNREAD"),
  };
};

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

/** List all labels in the Gmail account. */
export const listLabels = async (): Promise<GmailLabel[]> => {
  const res = await gmailFetch("/labels");
  const data = (await res.json()) as GmailApiLabelList;
  const labels = data.labels ?? [];

  // Fetch detailed counts for each label
  const detailed = await Promise.all(
    labels.map(async (label) => {
      const detail = await gmailFetch(`/labels/${label.id}`);
      const d = (await detail.json()) as GmailApiLabel;
      return {
        id: d.id,
        name: d.name,
        type: (d.type === "system" ? "system" : "user") as "system" | "user",
        messagesTotal: d.messagesTotal ?? 0,
        messagesUnread: d.messagesUnread ?? 0,
      };
    }),
  );

  return detailed;
};

/** Create a new label. */
export const createLabel = async (name: string): Promise<GmailLabel> => {
  const res = await gmailFetch("/labels", {
    method: "POST",
    body: JSON.stringify({
      name,
      labelListVisibility: "labelShow",
      messageListVisibility: "show",
    }),
  });
  const d = (await res.json()) as GmailApiLabel;
  return {
    id: d.id,
    name: d.name,
    type: "user",
    messagesTotal: 0,
    messagesUnread: 0,
  };
};

// ---------------------------------------------------------------------------
// Modify
// ---------------------------------------------------------------------------

/** Add or remove labels from a message. */
export const modifyMessage = async (
  messageId: string,
  addLabelIds: string[],
  removeLabelIds: string[],
): Promise<void> => {
  await gmailFetch(`/messages/${messageId}/modify`, {
    method: "POST",
    body: JSON.stringify({ addLabelIds, removeLabelIds }),
  });
};

/** Mark a message as read. */
export const markAsRead = async (messageId: string): Promise<void> => {
  await modifyMessage(messageId, [], ["UNREAD"]);
};

/** Mark a message as unread. */
export const markAsUnread = async (messageId: string): Promise<void> => {
  await modifyMessage(messageId, ["UNREAD"], []);
};

/** Archive a message (remove from INBOX). */
export const archiveMessage = async (messageId: string): Promise<void> => {
  await modifyMessage(messageId, [], ["INBOX"]);
};

/** Trash a message. */
export const trashMessage = async (messageId: string): Promise<void> => {
  await gmailFetch(`/messages/${messageId}/trash`, { method: "POST" });
};

// ---------------------------------------------------------------------------
// Signature
// ---------------------------------------------------------------------------

/** Set the Gmail signature for niotebook@gmail.com. */
export const setSignature = async (signatureHtml: string): Promise<void> => {
  await gmailFetch(`/settings/sendAs/${encodeURIComponent(NIOTEBOOK_EMAIL)}`, {
    method: "PUT",
    body: JSON.stringify({ signature: signatureHtml }),
  });
};

/** Get the current Gmail signature. */
export const getSignature = async (): Promise<string> => {
  const res = await gmailFetch(
    `/settings/sendAs/${encodeURIComponent(NIOTEBOOK_EMAIL)}`,
  );
  const data = (await res.json()) as GmailApiSendAs;
  return data.signature ?? "";
};

// ---------------------------------------------------------------------------
// Profile Photo
// ---------------------------------------------------------------------------

/** Set the Google Account profile photo from raw PNG bytes. */
export const setProfilePhoto = async (photoBytes: Buffer): Promise<void> => {
  const photoBase64 = photoBytes
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await peopleFetch(":updateContactPhoto", {
    method: "PATCH",
    body: JSON.stringify({ photoBytes: photoBase64 }),
  });
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const extractBody = (
  payload: GmailApiMessage["payload"] | undefined,
): string => {
  if (!payload) return "";

  // Simple message with body directly on payload
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  // Multipart — prefer text/plain, fall back to text/html
  if (payload.parts) {
    const plain = payload.parts.find((p) => p.mimeType === "text/plain");
    if (plain?.body?.data) return decodeBase64Url(plain.body.data);

    const html = payload.parts.find((p) => p.mimeType === "text/html");
    if (html?.body?.data) return decodeBase64Url(html.body.data);

    // Nested multipart
    for (const part of payload.parts) {
      const nested = extractBodyFromPart(part);
      if (nested) return nested;
    }
  }

  return "";
};

const extractBodyFromPart = (part: GmailApiPayloadPart): string => {
  if (part.body?.data) return decodeBase64Url(part.body.data);
  if (part.parts) {
    for (const sub of part.parts) {
      const result = extractBodyFromPart(sub);
      if (result) return result;
    }
  }
  return "";
};

/** UTF-8 safe base64url encode (handles non-ASCII like em-dash, emoji, etc.) */
const encodeBase64Url = (text: string): string =>
  Buffer.from(text, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

/** UTF-8 safe base64url decode. */
const decodeBase64Url = (data: string): string => {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
};

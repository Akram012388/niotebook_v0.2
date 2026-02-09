/**
 * Gmail service — high-level operations for send, read, search, and label management.
 */

import { google } from "googleapis";
import { getAuthenticatedClient, getGmailApi } from "./gmailClient";
import type {
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
  const gmail = await getGmailApi();

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

  const raw = Buffer.from(`${headers.join("\r\n")}\r\n\r\n${params.body}`)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw, threadId: params.replyToMessageId ? undefined : undefined },
  });

  return response.data.id ?? "";
};

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/** List messages with optional search query and label filters. */
export const listMessages = async (
  params: GmailListParams = {},
): Promise<GmailListResult> => {
  const gmail = await getGmailApi();

  const response = await gmail.users.messages.list({
    userId: "me",
    q: params.query,
    labelIds: params.labelIds,
    maxResults: params.maxResults ?? 20,
    pageToken: params.pageToken,
  });

  const messages = response.data.messages ?? [];

  const summaries: GmailMessageSummary[] = await Promise.all(
    messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "metadata",
        metadataHeaders: ["Subject", "From", "Date"],
      });

      const headers = detail.data.payload?.headers ?? [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
          ?.value ?? "";

      return {
        id: detail.data.id ?? "",
        threadId: detail.data.threadId ?? "",
        snippet: detail.data.snippet ?? "",
        subject: getHeader("Subject"),
        from: getHeader("From"),
        date: getHeader("Date"),
        labelIds: detail.data.labelIds ?? [],
        isUnread: (detail.data.labelIds ?? []).includes("UNREAD"),
      };
    }),
  );

  return {
    messages: summaries,
    nextPageToken: response.data.nextPageToken ?? undefined,
    resultSizeEstimate: response.data.resultSizeEstimate ?? 0,
  };
};

/** Get a single message by ID with full body content. */
export const getMessage = async (messageId: string): Promise<GmailMessage> => {
  const gmail = await getGmailApi();

  const detail = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const headers = detail.data.payload?.headers ?? [];
  const getHeader = (name: string) =>
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ??
    "";

  const body = extractBody(detail.data.payload);

  return {
    id: detail.data.id ?? "",
    threadId: detail.data.threadId ?? "",
    snippet: detail.data.snippet ?? "",
    subject: getHeader("Subject"),
    from: getHeader("From"),
    to: getHeader("To"),
    date: getHeader("Date"),
    body,
    labelIds: detail.data.labelIds ?? [],
    isUnread: (detail.data.labelIds ?? []).includes("UNREAD"),
  };
};

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

/** List all labels in the Gmail account. */
export const listLabels = async (): Promise<GmailLabel[]> => {
  const gmail = await getGmailApi();

  const response = await gmail.users.labels.list({ userId: "me" });
  const labels = response.data.labels ?? [];

  const detailed = await Promise.all(
    labels.map(async (label) => {
      const detail = await gmail.users.labels.get({
        userId: "me",
        id: label.id!,
      });
      return {
        id: detail.data.id ?? "",
        name: detail.data.name ?? "",
        type: (detail.data.type === "system" ? "system" : "user") as
          | "system"
          | "user",
        messagesTotal: detail.data.messagesTotal ?? 0,
        messagesUnread: detail.data.messagesUnread ?? 0,
      };
    }),
  );

  return detailed;
};

/** Create a new label. */
export const createLabel = async (name: string): Promise<GmailLabel> => {
  const gmail = await getGmailApi();

  const response = await gmail.users.labels.create({
    userId: "me",
    requestBody: {
      name,
      labelListVisibility: "labelShow",
      messageListVisibility: "show",
    },
  });

  return {
    id: response.data.id ?? "",
    name: response.data.name ?? "",
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
  const gmail = await getGmailApi();

  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: { addLabelIds, removeLabelIds },
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
  const gmail = await getGmailApi();
  await gmail.users.messages.trash({ userId: "me", id: messageId });
};

// ---------------------------------------------------------------------------
// Signature
// ---------------------------------------------------------------------------

/** Set the Gmail signature for niotebook@gmail.com. */
export const setSignature = async (signatureHtml: string): Promise<void> => {
  const gmail = await getGmailApi();

  await gmail.users.settings.sendAs.update({
    userId: "me",
    sendAsEmail: NIOTEBOOK_EMAIL,
    requestBody: { signature: signatureHtml },
  });
};

/** Get the current Gmail signature. */
export const getSignature = async (): Promise<string> => {
  const gmail = await getGmailApi();

  const response = await gmail.users.settings.sendAs.get({
    userId: "me",
    sendAsEmail: NIOTEBOOK_EMAIL,
  });

  return response.data.signature ?? "";
};

// ---------------------------------------------------------------------------
// Profile Photo
// ---------------------------------------------------------------------------

/** Set the Google Account profile photo from a local PNG file. */
export const setProfilePhoto = async (photoBytes: Buffer): Promise<void> => {
  const auth = await getAuthenticatedClient();
  const people = google.people({ version: "v1", auth });

  const photoBase64 = photoBytes
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await people.people.updateContactPhoto({
    resourceName: "people/me",
    requestBody: { photoBytes: photoBase64 },
  });
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type GmailPayloadPart = {
  mimeType?: string | null;
  body?: { data?: string | null; size?: number | null } | null;
  parts?: GmailPayloadPart[] | null;
};

const extractBody = (payload: GmailPayloadPart | undefined | null): string => {
  if (!payload) return "";

  // Simple message with body directly on payload
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8");
  }

  // Multipart — prefer text/plain, fall back to text/html
  if (payload.parts) {
    const plainPart = payload.parts.find((p) => p.mimeType === "text/plain");
    if (plainPart?.body?.data) {
      return Buffer.from(plainPart.body.data, "base64").toString("utf-8");
    }

    const htmlPart = payload.parts.find((p) => p.mimeType === "text/html");
    if (htmlPart?.body?.data) {
      return Buffer.from(htmlPart.body.data, "base64").toString("utf-8");
    }

    // Nested multipart
    for (const part of payload.parts) {
      const nested = extractBody(part);
      if (nested) return nested;
    }
  }

  return "";
};

/** Gmail API integration types. */

export type GmailTokens = {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
};

export type GmailMessage = {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
  labelIds: string[];
  isUnread: boolean;
};

export type GmailMessageSummary = {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
  labelIds: string[];
  isUnread: boolean;
};

export type GmailLabel = {
  id: string;
  name: string;
  type: "system" | "user";
  messagesTotal: number;
  messagesUnread: number;
};

export type SendEmailParams = {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  replyToMessageId?: string;
  isHtml?: boolean;
};

export type GmailListParams = {
  query?: string;
  labelIds?: string[];
  maxResults?: number;
  pageToken?: string;
};

export type GmailListResult = {
  messages: GmailMessageSummary[];
  nextPageToken?: string;
  resultSizeEstimate: number;
};

/** Raw Gmail API response shapes (subset we use). */
export type GmailApiMessageList = {
  messages?: { id: string; threadId: string }[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
};

export type GmailApiHeader = {
  name: string;
  value: string;
};

export type GmailApiPayloadPart = {
  mimeType?: string;
  body?: { data?: string; size?: number };
  parts?: GmailApiPayloadPart[];
};

export type GmailApiMessage = {
  id: string;
  threadId: string;
  snippet: string;
  labelIds?: string[];
  payload?: {
    headers?: GmailApiHeader[];
    mimeType?: string;
    body?: { data?: string; size?: number };
    parts?: GmailApiPayloadPart[];
  };
};

export type GmailApiLabel = {
  id: string;
  name: string;
  type: string;
  messagesTotal?: number;
  messagesUnread?: number;
};

export type GmailApiLabelList = {
  labels?: GmailApiLabel[];
};

export type GmailApiSendAs = {
  signature?: string;
};

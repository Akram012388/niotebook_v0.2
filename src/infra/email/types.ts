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

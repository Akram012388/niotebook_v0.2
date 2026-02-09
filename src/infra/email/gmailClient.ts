/**
 * Gmail OAuth2 client — handles authentication and token management.
 *
 * Tokens are stored in `.gmail-tokens.json` at the project root.
 * This file is gitignored and should never be committed.
 */

import { google } from "googleapis";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { GmailTokens } from "./types";

const TOKENS_PATH = join(process.cwd(), ".gmail-tokens.json");

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.settings.basic",
];

const getEnvOrThrow = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

const createOAuth2Client = () => {
  return new google.auth.OAuth2(
    getEnvOrThrow("GMAIL_CLIENT_ID"),
    getEnvOrThrow("GMAIL_CLIENT_SECRET"),
    getEnvOrThrow("GMAIL_REDIRECT_URI"),
  );
};

/** Generate the Google OAuth consent URL. */
export const getAuthUrl = (): string => {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
};

/** Exchange authorization code for tokens and persist them. */
export const exchangeCodeForTokens = async (
  code: string,
): Promise<GmailTokens> => {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);
  await saveTokens(tokens as GmailTokens);
  return tokens as GmailTokens;
};

/** Get an authenticated OAuth2 client (auto-refreshes expired tokens). */
export const getAuthenticatedClient = async () => {
  const tokens = await loadTokens();
  if (!tokens) {
    throw new Error(
      "Gmail not authenticated. Visit /api/gmail/auth to authorize.",
    );
  }

  const client = createOAuth2Client();
  client.setCredentials(tokens);

  // Auto-refresh if token is expired or about to expire (5 min buffer)
  if (tokens.expiry_date && tokens.expiry_date < Date.now() + 5 * 60 * 1000) {
    const { credentials } = await client.refreshAccessToken();
    const updated: GmailTokens = {
      ...tokens,
      access_token: credentials.access_token ?? tokens.access_token,
      expiry_date: credentials.expiry_date ?? tokens.expiry_date,
    };
    await saveTokens(updated);
    client.setCredentials(updated);
  }

  return client;
};

/** Get an authenticated Gmail API instance. */
export const getGmailApi = async () => {
  const auth = await getAuthenticatedClient();
  return google.gmail({ version: "v1", auth });
};

/** Check if tokens exist (i.e., Gmail is authenticated). */
export const isAuthenticated = async (): Promise<boolean> => {
  const tokens = await loadTokens();
  return tokens !== null;
};

const loadTokens = async (): Promise<GmailTokens | null> => {
  try {
    const raw = await readFile(TOKENS_PATH, "utf-8");
    return JSON.parse(raw) as GmailTokens;
  } catch {
    return null;
  }
};

const saveTokens = async (tokens: GmailTokens): Promise<void> => {
  await writeFile(TOKENS_PATH, JSON.stringify(tokens, null, 2), "utf-8");
};

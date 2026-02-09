/**
 * Gmail OAuth2 client — handles authentication and token management.
 *
 * Uses google-auth-library for OAuth2 (lightweight, no OOM).
 * All Gmail API calls use raw fetch — no googleapis package.
 *
 * Tokens are stored in `.gmail-tokens.json` at the project root (gitignored).
 */

import { OAuth2Client } from "google-auth-library";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { GmailTokens } from "./types";

const TOKENS_PATH = join(process.cwd(), ".gmail-tokens.json");

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";
const PEOPLE_API = "https://people.googleapis.com/v1/people/me";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.settings.basic",
];

const getEnvOrThrow = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
};

const createOAuth2Client = () =>
  new OAuth2Client(
    getEnvOrThrow("GMAIL_CLIENT_ID"),
    getEnvOrThrow("GMAIL_CLIENT_SECRET"),
    getEnvOrThrow("GMAIL_REDIRECT_URI"),
  );

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
  const gmailTokens: GmailTokens = {
    access_token: tokens.access_token ?? "",
    refresh_token: tokens.refresh_token ?? "",
    scope: tokens.scope ?? "",
    token_type: tokens.token_type ?? "Bearer",
    expiry_date: tokens.expiry_date ?? 0,
  };
  await saveTokens(gmailTokens);
  return gmailTokens;
};

/** Get a valid access token (auto-refreshes if expired). */
export const getAccessToken = async (): Promise<string> => {
  const tokens = await loadTokens();
  if (!tokens) {
    throw new Error(
      "Gmail not authenticated. Run: bun run scripts/gmail.ts auth",
    );
  }

  // Return existing token if still valid (5 min buffer)
  if (tokens.expiry_date > Date.now() + 5 * 60 * 1000) {
    return tokens.access_token;
  }

  // Refresh expired token
  const client = createOAuth2Client();
  client.setCredentials(tokens);
  const { credentials } = await client.refreshAccessToken();
  const updated: GmailTokens = {
    ...tokens,
    access_token: credentials.access_token ?? tokens.access_token,
    expiry_date: credentials.expiry_date ?? tokens.expiry_date,
  };
  await saveTokens(updated);
  return updated.access_token;
};

/** Check if tokens exist (i.e., Gmail is authenticated). */
export const isAuthenticated = async (): Promise<boolean> => {
  const tokens = await loadTokens();
  return tokens !== null;
};

/**
 * Authenticated fetch against Gmail API.
 * Path is relative to /gmail/v1/users/me (e.g., "/messages", "/labels").
 */
export const gmailFetch = async (
  path: string,
  options: RequestInit = {},
): Promise<Response> => {
  const token = await getAccessToken();
  const url = `${GMAIL_API}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gmail API ${response.status}: ${body}`);
  }
  return response;
};

/**
 * Authenticated fetch against Google People API.
 * Path is relative to /v1/people/me (e.g., ":updateContactPhoto").
 */
export const peopleFetch = async (
  path: string,
  options: RequestInit = {},
): Promise<Response> => {
  const token = await getAccessToken();
  const url = `${PEOPLE_API}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`People API ${response.status}: ${body}`);
  }
  return response;
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

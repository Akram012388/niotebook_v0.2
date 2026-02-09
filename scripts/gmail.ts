#!/usr/bin/env bun
/**
 * Gmail CLI — thin wrapper for manual use and OAuth flow.
 *
 * Usage:
 *   bun run scripts/gmail.ts auth          — Open OAuth consent URL
 *   bun run scripts/gmail.ts status        — Check connection status
 *   bun run scripts/gmail.ts inbox [n]     — List n recent inbox messages (default: 10)
 *   bun run scripts/gmail.ts unread        — List unread messages
 *   bun run scripts/gmail.ts read <id>     — Read a specific message
 *   bun run scripts/gmail.ts search <q>    — Search messages
 *   bun run scripts/gmail.ts send          — Send (reads JSON from stdin)
 *   bun run scripts/gmail.ts labels        — List all labels
 *   bun run scripts/gmail.ts signature     — Get current signature
 *
 * For full programmatic access, import from src/infra/email/gmailService.ts.
 */

import { getAuthUrl, isAuthenticated } from "../src/infra/email/gmailClient";
import {
  getMessage,
  getSignature,
  listLabels,
  listMessages,
  sendEmail,
} from "../src/infra/email/gmailService";

const [command, ...args] = process.argv.slice(2);

const print = (data: unknown) => console.log(JSON.stringify(data, null, 2));

const commands: Record<string, () => Promise<void>> = {
  auth: async () => {
    const authed = await isAuthenticated();
    if (authed) {
      console.log("Already authenticated. Use 'status' to check details.");
      return;
    }
    const url = getAuthUrl();
    console.log("Open this URL to authorize Gmail:\n");
    console.log(url);
  },

  status: async () => {
    const authed = await isAuthenticated();
    if (!authed) {
      console.log("Not authenticated. Run: bun run scripts/gmail.ts auth");
      return;
    }
    const labels = await listLabels();
    const inbox = labels.find((l) => l.id === "INBOX");
    print({
      authenticated: true,
      account: "niotebook@gmail.com",
      inbox: {
        total: inbox?.messagesTotal ?? 0,
        unread: inbox?.messagesUnread ?? 0,
      },
      labels: labels.length,
    });
  },

  inbox: async () => {
    const n = args[0] ? parseInt(args[0], 10) : 10;
    const result = await listMessages({
      labelIds: ["INBOX"],
      maxResults: n,
    });
    print(result);
  },

  unread: async () => {
    const result = await listMessages({ query: "is:unread" });
    print(result);
  },

  read: async () => {
    const id = args[0];
    if (!id) {
      console.error("Usage: gmail.ts read <messageId>");
      process.exit(1);
    }
    const msg = await getMessage(id);
    print(msg);
  },

  search: async () => {
    const query = args.join(" ");
    if (!query) {
      console.error("Usage: gmail.ts search <query>");
      process.exit(1);
    }
    const result = await listMessages({ query });
    print(result);
  },

  send: async () => {
    // Read JSON from stdin: { to, subject, body, cc?, bcc?, isHtml? }
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(Buffer.from(chunk as Uint8Array));
    }
    const input = Buffer.concat(chunks).toString("utf-8");
    const params = JSON.parse(input);
    const id = await sendEmail(params);
    print({ success: true, messageId: id });
  },

  labels: async () => {
    const labels = await listLabels();
    print(labels);
  },

  signature: async () => {
    const sig = await getSignature();
    print({ signature: sig });
  },
};

const run = async () => {
  if (!command || !(command in commands)) {
    console.log("Gmail CLI — available commands:");
    console.log(
      "  auth, status, inbox, unread, read, search, send, labels, signature",
    );
    console.log("\nRun with --help or see scripts/gmail.ts for usage.");
    process.exit(command ? 1 : 0);
  }
  await commands[command]();
};

run().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});

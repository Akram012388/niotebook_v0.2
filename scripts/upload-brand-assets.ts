/**
 * One-off script: upload brand assets to Vercel Blob for use in Gmail signature.
 * Run: bun run scripts/upload-brand-assets.ts
 */

import { put } from "@vercel/blob";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = process.cwd();

const ASSETS = [
  {
    localPath: "branding/email/niotebook-email-sig.png",
    blobName: "brand/niotebook-email-sig.png",
  },
  {
    localPath: "branding/social/profile/profile-pic.png",
    blobName: "brand/profile-pic.png",
  },
  {
    localPath: "branding/logos/nio-mark/accent/nio-mark-accent-2x.png",
    blobName: "brand/nio-mark-accent-2x.png",
  },
  {
    localPath: "branding/logos/wordmark/dark/wordmark-dark-2x.png",
    blobName: "brand/wordmark-dark-2x.png",
  },
];

const main = async () => {
  console.log("Uploading brand assets to Vercel Blob...\n");

  for (const asset of ASSETS) {
    const filePath = join(ROOT, asset.localPath);
    const buffer = await readFile(filePath);

    const blob = await put(asset.blobName, buffer, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    console.log(`  ${asset.blobName} → ${blob.url}`);
  }

  console.log("\nDone!");
};

main().catch(console.error);

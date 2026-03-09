import { cronJobs } from "convex/server";
import { api, internal } from "./_generated/api";

const crons = cronJobs();

crons.cron(
  "preview-data-cleanup",
  "0 2 * * *",
  api.maintenance.cleanupPreviewData,
);

crons.cron(
  "rateLimits-ttl-cleanup",
  "0 3 * * *",
  internal.maintenance.cleanupStaleRateLimits,
);

crons.cron(
  "frames-ttl-cleanup",
  "0 4 * * *",
  internal.maintenance.cleanupStaleFrames,
);

export default crons;

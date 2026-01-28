import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

crons.cron(
  "preview-data-cleanup",
  "0 2 * * *",
  api.maintenance.cleanupPreviewData,
);

export default crons;

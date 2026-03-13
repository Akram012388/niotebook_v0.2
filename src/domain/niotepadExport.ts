import type { NiotepadEntryData, NiotepadPage } from "@/domain/niotepad";

/* ------------------------------------------------------------------ */
/*  todayIso                                                          */
/* ------------------------------------------------------------------ */

/** Returns the current date as a YYYY-MM-DD string. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/*  slugify                                                           */
/* ------------------------------------------------------------------ */

/** Lowercase, replace non-alphanum with hyphens, collapse multiples, trim.
 *  Returns "notes" for empty input. */
function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "notes";
}

/* ------------------------------------------------------------------ */
/*  formatVideoTime                                                   */
/* ------------------------------------------------------------------ */

/** Convert seconds to M:SS format (e.g., 185 → "3:05"). */
function formatVideoTime(seconds: number): string {
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/*  buildEntryMarkdown                                                */
/* ------------------------------------------------------------------ */

/** Format a single niotepad entry as markdown. */
function buildEntryMarkdown(entry: NiotepadEntryData): string {
  switch (entry.source) {
    case "manual":
      return entry.content;

    case "video": {
      const timePart =
        entry.videoTimeSec !== null
          ? `**${formatVideoTime(entry.videoTimeSec)}**`
          : null;
      const titlePart = entry.metadata.lectureTitle ?? "";
      const header = [timePart, titlePart].filter(Boolean).join(" — ");
      return `${header}\n\n${entry.content}`;
    }

    case "code": {
      const lang = entry.metadata.language ?? "";
      const fence = `\`\`\`${lang}\n${entry.content}\n\`\`\``;
      if (entry.metadata.filePath) {
        return `${fence}\n\n*Code — ${entry.metadata.filePath}*`;
      }
      return fence;
    }

    case "chat": {
      return `\`\`\`\n${entry.content}\n\`\`\`\n\n*Assistant*`;
    }
  }
}

/* ------------------------------------------------------------------ */
/*  buildPageMarkdown                                                 */
/* ------------------------------------------------------------------ */

/** Full single-page export as markdown. */
function buildPageMarkdown(page: NiotepadPage): string {
  const lines: string[] = [];
  lines.push(`# ${page.title}`);
  lines.push("");
  lines.push(`> Exported from Niotebook — ${todayIso()}`);
  lines.push("");

  if (page.entries.length === 0) {
    lines.push("No entries yet.");
  } else {
    const entryBlocks = page.entries.map((e) => buildEntryMarkdown(e));
    lines.push(entryBlocks.join("\n\n---\n\n"));
  }

  lines.push("");
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/*  buildAllPagesMarkdown                                             */
/* ------------------------------------------------------------------ */

/** Multi-page export as a single markdown document. */
function buildAllPagesMarkdown(
  pages: NiotepadPage[],
  courseTitle?: string,
): string {
  const lines: string[] = [];
  const heading = courseTitle ? `${courseTitle} — All Notes` : "All Notes";
  lines.push(`# ${heading}`);
  lines.push("");
  lines.push(`> Exported from Niotebook — ${todayIso()}`);
  lines.push("");

  for (const page of pages) {
    lines.push(`## ${page.title}`);
    lines.push("");

    if (page.entries.length === 0) {
      lines.push("No entries yet.");
    } else {
      const entryBlocks = page.entries.map((e) => buildEntryMarkdown(e));
      lines.push(entryBlocks.join("\n\n---\n\n"));
    }

    lines.push("");
  }

  return lines.join("\n");
}

export {
  slugify,
  formatVideoTime,
  buildEntryMarkdown,
  buildPageMarkdown,
  buildAllPagesMarkdown,
  todayIso,
};

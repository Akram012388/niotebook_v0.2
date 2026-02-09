/** Sources from which entries can be pushed. */
type NiotepadEntrySource = "manual" | "code" | "chat" | "video";

/** Metadata attached to each entry depending on source. */
type NiotepadEntryMetadata = {
  /** Chat message ID if pushed from AiPane. */
  chatMessageId?: string;

  /** File path if pushed from CodePane. */
  filePath?: string;

  /** Programming language if pushed from CodePane. */
  language?: string;

  /** Transcript time range if from video bookmark. */
  transcriptRange?: [startSec: number, endSec: number];

  /** Code snapshot hash at capture time. */
  codeHash?: string;

  /** Lecture title at push time (self-contained for offline rendering). */
  lectureTitle?: string;

  /** Lecture number at push time. */
  lectureNumber?: number | null;
};

/** A single niotepad entry. */
type NiotepadEntryData = {
  /** Unique ID (crypto.randomUUID). */
  id: string;

  /** How this entry was created. */
  source: NiotepadEntrySource;

  /** Markdown content. Always editable. */
  content: string;

  /** Unix ms -- when the entry was first created. */
  createdAt: number;

  /** Unix ms -- last edit time. */
  updatedAt: number;

  /** Video position at capture time (null for manual entries). */
  videoTimeSec: number | null;

  /** The page (lecture) this entry belongs to. */
  pageId: string;

  /** Source-specific metadata. */
  metadata: NiotepadEntryMetadata;
};

/** A page in the notebook, scoped to a lecture. */
type NiotepadPage = {
  /** Unique page ID (crypto.randomUUID). */
  id: string;

  /** The lessonId this page is scoped to. */
  lessonId: string;

  /** Human-readable label (e.g., "Lecture 3: Algorithms"). */
  title: string;

  /** Lecture number for ordering. Null for "General" page. */
  lectureNumber: number | null;

  /** Entries on this page, ordered chronologically. */
  entries: NiotepadEntryData[];

  /** Unix ms -- when this page was created. */
  createdAt: number;
};

/** Top-level persistence snapshot. */
type NiotepadSnapshot = {
  pages: NiotepadPage[];
  version: 1;
};

/** Parameters for creating a new entry (ID and timestamps are auto-generated). */
type AddEntryParams = {
  source: NiotepadEntrySource;
  content: string;
  pageId: string;
  videoTimeSec: number | null;
  metadata: NiotepadEntryMetadata;
};

export type {
  AddEntryParams,
  NiotepadEntryData,
  NiotepadEntryMetadata,
  NiotepadEntrySource,
  NiotepadPage,
  NiotepadSnapshot,
};

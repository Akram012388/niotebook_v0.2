export type NiotepadEntrySource = "chat" | "code" | "video" | "manual";

export type NiotepadEntry = {
  id: string;
  source: NiotepadEntrySource;
  content: string;
  createdAt: number;
  updatedAt: number;
  videoTimeSec: number | null;
  lessonId: string;
  metadata: {
    chatMessageId?: string;
    filePath?: string;
    language?: string;
    transcriptRange?: [number, number];
    codeHash?: string;
  };
};

export type NiotepadSnapshot = {
  lessonId: string;
  entries: NiotepadEntry[];
  version: 1;
};

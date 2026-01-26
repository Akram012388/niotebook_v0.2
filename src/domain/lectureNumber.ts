type LectureNumberInput = {
  subtitlesUrl?: string;
  transcriptUrl?: string;
  title?: string;
  order?: number;
};

const extractLectureNumber = (value: string | undefined): number | null => {
  if (!value) {
    return null;
  }

  const patterns = [
    /\/lectures\/(\d+)\//i,
    /\/lecture\/(\d+)\//i,
    /\/weeks\/(\d+)\//i,
    /\blecture\s*(\d+)\b/i,
    /\bweek\s*(\d+)\b/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) {
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
};

const resolveLectureNumber = (input: LectureNumberInput): number | null => {
  const fromSubtitles = extractLectureNumber(input.subtitlesUrl);
  if (fromSubtitles !== null) {
    return fromSubtitles;
  }

  const fromTranscript = extractLectureNumber(input.transcriptUrl);
  if (fromTranscript !== null) {
    return fromTranscript;
  }

  const fromTitle = extractLectureNumber(input.title);
  if (fromTitle !== null) {
    return fromTitle;
  }

  return input.order ?? null;
};

export type { LectureNumberInput };
export { extractLectureNumber, resolveLectureNumber };

import { useCallback, useEffect, useRef, useState } from "react";
import { useNiotepadStore } from "../../infra/niotepad/useNiotepadStore";
import type { AddEntryParams } from "../../domain/niotepad";

/** The subset of AddEntryParams the caller provides (pageId is resolved by the hook). */
type BookmarkEntry = Omit<AddEntryParams, "pageId">;

/**
 * Manages the bookmark-to-niotepad interaction shared by CodePane and AiPane.
 *
 * Handles: page resolution, addEntry, bookmarkSaved flash state, and timer cleanup.
 * The caller builds the entry (source, content, videoTimeSec, metadata) and passes
 * it to handleBookmark — the hook handles everything else.
 */
function useBookmarkConfirm(
  lessonId: string,
  lectureLabel: string,
): {
  bookmarkSaved: boolean;
  handleBookmark: (entry: BookmarkEntry) => void;
} {
  const [bookmarkSaved, setBookmarkSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBookmark = useCallback(
    (entry: BookmarkEntry): void => {
      try {
        const store = useNiotepadStore.getState();
        const pageId = store.getOrCreatePage(lessonId, lectureLabel);
        const params: AddEntryParams = { ...entry, pageId };
        store.addEntry(params);
      } catch (err) {
        console.error("[niotepad] bookmark failed", err);
        return;
      }

      setBookmarkSaved(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setBookmarkSaved(false);
        timerRef.current = null;
      }, 1500);
    },
    [lessonId, lectureLabel],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { bookmarkSaved, handleBookmark };
}

export { useBookmarkConfirm };
export type { BookmarkEntry };

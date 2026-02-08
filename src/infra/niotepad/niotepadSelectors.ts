import type { NiotepadEntryData } from "../../domain/niotepad";
import type { NiotepadState } from "./useNiotepadStore";

/**
 * All entries for the active page, filtered by source filters and search query.
 * When activePageId is null ("All" view), entries from every page are flattened
 * and returned in chronological order.
 *
 * Search uses multi-term AND matching (every whitespace-separated term must
 * appear somewhere in the entry's searchable text).
 */
function selectFilteredEntries(
  state: Pick<NiotepadState, "pages" | "activePageId" | "sourceFilters" | "searchQuery">,
): NiotepadEntryData[] {
  // 1. Gather entries for the active page (or all pages)
  const page = state.activePageId
    ? state.pages.find((p) => p.id === state.activePageId)
    : null;

  const entries: NiotepadEntryData[] = page
    ? page.entries
    : state.pages.flatMap((p) => p.entries);

  // 2. Apply source filter (empty array = show all)
  const afterSource =
    state.sourceFilters.length > 0
      ? entries.filter((e) => state.sourceFilters.includes(e.source))
      : entries;

  // 3. Apply search query (multi-term AND)
  const trimmed = state.searchQuery.trim();
  if (!trimmed) return afterSource;

  const terms = trimmed.toLowerCase().split(/\s+/).filter(Boolean);

  return afterSource.filter((entry) => {
    const searchable = [
      entry.content,
      entry.metadata.lectureTitle ?? "",
      entry.metadata.filePath ?? "",
      entry.metadata.language ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return terms.every((term) => searchable.includes(term));
  });
}

/** Total entry count across all pages. */
function selectTotalEntryCount(state: NiotepadState): number {
  return state.pages.reduce((sum, p) => sum + p.entries.length, 0);
}

/** Entry count for the active page, or total if "All" view (activePageId is null). */
function selectActivePageEntryCount(state: NiotepadState): number {
  if (!state.activePageId) return selectTotalEntryCount(state);
  const page = state.pages.find((p) => p.id === state.activePageId);
  return page?.entries.length ?? 0;
}

export {
  selectActivePageEntryCount,
  selectFilteredEntries,
  selectTotalEntryCount,
};

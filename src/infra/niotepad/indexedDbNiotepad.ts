import type { IDBPDatabase } from "idb";
import { openDB } from "idb";

import type { NiotepadSnapshot } from "../../domain/niotepad";

const DB_NAME = "niotebook-niotepad";
const DB_VERSION = 1;
const STORE_NAME = "pads";

type NiotepadDatabase = IDBPDatabase<{
  pads: {
    key: string;
    value: string;
  };
}>;

let dbPromise: Promise<NiotepadDatabase> | null = null;

function getDb(): Promise<NiotepadDatabase> {
  if (!dbPromise) {
    dbPromise = openDB<{
      pads: {
        key: string;
        value: string;
      };
    }>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

async function loadSnapshot(
  lessonId: string,
): Promise<NiotepadSnapshot | null> {
  try {
    const db = await getDb();
    const data = await db.get(STORE_NAME, lessonId);
    if (!data) return null;
    return JSON.parse(data) as NiotepadSnapshot;
  } catch (error) {
    console.warn("[Niotepad] IndexedDB read failed:", error);
    return null;
  }
}

async function saveSnapshot(
  lessonId: string,
  snapshot: NiotepadSnapshot,
): Promise<void> {
  try {
    const db = await getDb();
    await db.put(STORE_NAME, JSON.stringify(snapshot), lessonId);
  } catch (error) {
    console.warn(
      "[Niotepad] IndexedDB write failed, running in-memory only:",
      error,
    );
  }
}

export { loadSnapshot, saveSnapshot };

import type { IDBPDatabase } from "idb";
import { openDB } from "idb";

import type { NiotepadSnapshot } from "../../domain/niotepad";

const DB_NAME = "niotebook-niotepad";
/**
 * IndexedDB schema version for the Niotepad store.
 * Current schema: { notebooks: IDBObjectStore (out-of-line keys, string key = notebook ID, value: serialized NiotepadSnapshot) }
 * To bump: increment this constant and add a migration branch in onupgradeneeded.
 */
const DB_VERSION = 1;
const STORE_NAME = "notebooks";
const NOTEBOOK_KEY = "notebook-v1";

type NiotepadDatabase = IDBPDatabase<{
  notebooks: {
    key: string;
    value: string;
  };
}>;

function isNiotepadSnapshot(v: unknown): v is NiotepadSnapshot {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return r.version === 1 && Array.isArray(r.pages);
}

let dbPromise: Promise<NiotepadDatabase> | null = null;

function getDb(): Promise<NiotepadDatabase> {
  if (!dbPromise) {
    dbPromise = openDB<{
      notebooks: {
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

async function saveNotebook(snapshot: NiotepadSnapshot): Promise<void> {
  try {
    const db = await getDb();
    await db.put(STORE_NAME, JSON.stringify(snapshot), NOTEBOOK_KEY);
  } catch (error) {
    console.warn(
      "[Niotepad] IndexedDB write failed, running in-memory only:",
      error,
    );
  }
}

async function loadNotebook(): Promise<NiotepadSnapshot | null> {
  try {
    const db = await getDb();
    const data = await db.get(STORE_NAME, NOTEBOOK_KEY);
    if (!data) return null;
    const parsed: unknown = JSON.parse(data);
    if (!isNiotepadSnapshot(parsed)) {
      console.warn("[Niotepad] IndexedDB corrupted data, discarding.");
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn("[Niotepad] IndexedDB read failed:", error);
    return null;
  }
}

async function deleteNotebook(): Promise<void> {
  try {
    const db = await getDb();
    await db.delete(STORE_NAME, NOTEBOOK_KEY);
  } catch (error) {
    console.warn("[Niotepad] IndexedDB delete failed:", error);
  }
}

export { deleteNotebook, loadNotebook, saveNotebook };

import type { IDBPDatabase } from "idb";
import { openDB } from "idb";

import type { VFSSnapshotNode } from "./VirtualFS";

const DB_NAME = "niotebook-vfs";
const DB_VERSION = 1;
const STORE_NAME = "projects";

type VFSDatabase = IDBPDatabase<{
  projects: {
    key: string;
    value: string;
  };
}>;

let dbPromise: Promise<VFSDatabase> | null = null;

function getDb(): Promise<VFSDatabase> {
  if (!dbPromise) {
    dbPromise = openDB<{
      projects: {
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

async function saveProject(
  key: string,
  snapshot: VFSSnapshotNode,
): Promise<void> {
  try {
    const db = await getDb();
    await db.put(STORE_NAME, JSON.stringify(snapshot), key);
  } catch (error) {
    console.warn(
      "[VFS] IndexedDB write failed, running in-memory only:",
      error,
    );
  }
}

async function loadProject(key: string): Promise<VFSSnapshotNode | null> {
  try {
    const db = await getDb();
    const data = await db.get(STORE_NAME, key);
    if (!data) return null;
    return JSON.parse(data) as VFSSnapshotNode;
  } catch (error) {
    console.warn("[VFS] IndexedDB read failed:", error);
    return null;
  }
}

async function deleteProject(key: string): Promise<void> {
  try {
    const db = await getDb();
    await db.delete(STORE_NAME, key);
  } catch (error) {
    console.warn("[VFS] IndexedDB delete failed:", error);
  }
}

async function listProjects(): Promise<string[]> {
  try {
    const db = await getDb();
    return (await db.getAllKeys(STORE_NAME)) as string[];
  } catch (error) {
    console.warn("[VFS] IndexedDB list failed:", error);
    return [];
  }
}

export { deleteProject, listProjects, loadProject, saveProject };

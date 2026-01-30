import type { RuntimeLanguage } from "../runtime/types";

type VFSNodeKind = "file" | "directory";

type VFSFile = {
  kind: "file";
  name: string;
  path: string;
  content: string;
  language: RuntimeLanguage | null;
  createdAt: number;
  updatedAt: number;
};

type VFSDirectory = {
  kind: "directory";
  name: string;
  path: string;
  children: Map<string, VFSNode>;
  createdAt: number;
};

type VFSNode = VFSFile | VFSDirectory;

type VFSEventType = "create" | "update" | "delete" | "rename";

type VFSEvent = {
  type: VFSEventType;
  path: string;
  node?: VFSNode;
};

export type {
  VFSDirectory,
  VFSEvent,
  VFSEventType,
  VFSFile,
  VFSNode,
  VFSNodeKind,
};

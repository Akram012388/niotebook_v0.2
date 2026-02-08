import type { ComponentType } from "react";
import type { IconProps } from "@phosphor-icons/react";
import {
  ChatCircleDots,
  Code,
  Terminal,
  PlayCircle,
  Notepad,
  Layout,
  FolderOpen,
  SidebarSimple,
  Question,
} from "@phosphor-icons/react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Shortcut {
  /** Display label, e.g., "⌘K" */
  label: string;
  /** Description of what the shortcut does (if tool has multiple) */
  action?: string;
}

interface HelpEntry {
  id: string;
  name: string;
  description: string;
  icon: ComponentType<IconProps>;
  shortcuts?: Shortcut[];
  /** CSS selector to locate the target element for pulse */
  targetSelector?: string;
  /** Category for potential future filtering */
  category:
    | "editor"
    | "terminal"
    | "video"
    | "chat"
    | "niotepad"
    | "layout"
    | "filetree"
    | "control";
}

// ---------------------------------------------------------------------------
// Entries
// ---------------------------------------------------------------------------

const HELP_ENTRIES: HelpEntry[] = [
  {
    id: "chat",
    name: "AI Chat (Nio)",
    description: "Ask Nio about the lesson, code, or transcript",
    icon: ChatCircleDots,
    shortcuts: [{ label: "\u2318K" }],
    targetSelector: '[data-help-target="chat"]',
    category: "chat",
  },
  {
    id: "editor",
    name: "Code Editor",
    description: "Write and execute code in multiple languages",
    icon: Code,
    shortcuts: [{ label: "\u2318S", action: "run" }],
    targetSelector: '[data-help-target="editor"]',
    category: "editor",
  },
  {
    id: "terminal",
    name: "Terminal",
    description: "View code output and interact with the shell",
    icon: Terminal,
    shortcuts: [{ label: "\u2318`", action: "focus" }],
    targetSelector: '[data-help-target="terminal"]',
    category: "terminal",
  },
  {
    id: "video",
    name: "Video Player",
    description: "Watch the lesson video with synced transcript",
    icon: PlayCircle,
    shortcuts: [
      { label: "Space", action: "play/pause" },
      { label: "\u2190/\u2192", action: "seek" },
    ],
    targetSelector: '[data-help-target="video"]',
    category: "video",
  },
  {
    id: "niotepad",
    name: "Niotepad",
    description:
      "Your personal notebook \u2014 capture notes, code, and insights",
    icon: Notepad,
    shortcuts: [{ label: "\u2318J" }],
    targetSelector: '[data-help-target="niotepad"]',
    category: "niotepad",
  },
  {
    id: "layout",
    name: "Layout Presets",
    description: "Switch between workspace arrangements",
    icon: Layout,
    shortcuts: [
      { label: "\u23181" },
      { label: "\u23182" },
      { label: "\u23183" },
    ],
    targetSelector: '[data-help-target="layout"]',
    category: "layout",
  },
  {
    id: "filetree",
    name: "File Tree",
    description: "Browse and manage project files",
    icon: FolderOpen,
    targetSelector: '[data-help-target="filetree"]',
    category: "filetree",
  },
  {
    id: "control",
    name: "Control Center",
    description: "Navigate courses and lessons",
    icon: SidebarSimple,
    targetSelector: '[data-help-target="control"]',
    category: "control",
  },
  {
    id: "help",
    name: "Help",
    description: "You are here \u2014 workspace guide and shortcuts",
    icon: Question,
    shortcuts: [{ label: "\u2318/" }],
    category: "control",
  },
];

export { HELP_ENTRIES };
export type { HelpEntry, Shortcut };

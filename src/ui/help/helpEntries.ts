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
  shortcuts?: Shortcut[];
  /** CSS selector to locate the target element for spotlight */
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
    shortcuts: [{ label: "\u2318K" }],
    targetSelector: '[data-help-target="chat"]',
    category: "chat",
  },
  {
    id: "editor",
    name: "Code Editor",
    description: "Write and execute code in multiple languages",
    shortcuts: [{ label: "\u2318S", action: "run" }],
    targetSelector: '[data-help-target="editor"]',
    category: "editor",
  },
  {
    id: "terminal",
    name: "Terminal",
    description: "View code output and interact with the shell",
    shortcuts: [{ label: "\u2318`", action: "focus" }],
    targetSelector: '[data-help-target="terminal"]',
    category: "terminal",
  },
  {
    id: "video",
    name: "Video Player",
    description: "Watch the lesson video with synced transcript",
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
    shortcuts: [{ label: "\u2318J" }],
    targetSelector: '[data-help-target="niotepad"]',
    category: "niotepad",
  },
  {
    id: "layout",
    name: "Layout Presets",
    description: "Switch between workspace arrangements",
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
    targetSelector: '[data-help-target="filetree"]',
    category: "filetree",
  },
  {
    id: "control",
    name: "Control Center",
    description: "Navigate courses and lessons",
    targetSelector: '[data-help-target="control"]',
    category: "control",
  },
  {
    id: "help",
    name: "Help",
    description: "You are here \u2014 workspace guide and shortcuts",
    shortcuts: [{ label: "\u2318/" }],
    category: "control",
  },
];

export { HELP_ENTRIES };
export type { HelpEntry, Shortcut };

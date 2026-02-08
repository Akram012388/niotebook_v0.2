interface TourStep {
  id: string;
  name: string;
  shortcut?: string;
  targetSelector: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "layout",
    name: "Layout Presets",
    shortcut: "\u23181-3",
    targetSelector: '[data-help-target="layout"]',
  },
  {
    id: "control",
    name: "Control Center",
    targetSelector: '[data-help-target="control"]',
  },
  {
    id: "video",
    name: "Video Player",
    shortcut: "Space",
    targetSelector: '[data-help-target="video"]',
  },
  {
    id: "editor",
    name: "Code Editor",
    shortcut: "\u2318S",
    targetSelector: '[data-help-target="editor"]',
  },
  {
    id: "terminal",
    name: "Terminal",
    shortcut: "\u2318`",
    targetSelector: '[data-help-target="terminal"]',
  },
  {
    id: "chat",
    name: "AI Chat (Nio)",
    shortcut: "\u2318K",
    targetSelector: '[data-help-target="chat"]',
  },
  {
    id: "filetree",
    name: "File Tree",
    targetSelector: '[data-help-target="filetree"]',
  },
  {
    id: "niotepad",
    name: "Niotepad",
    shortcut: "\u2318J",
    targetSelector: '[data-help-target="niotepad"]',
  },
];

export { TOUR_STEPS };
export type { TourStep };

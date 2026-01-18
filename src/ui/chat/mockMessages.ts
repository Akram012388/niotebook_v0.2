import type { ChatMessage } from "./chatTypes";

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    role: "assistant",
    content:
      "Let’s walk through the lesson step by step. What part of the video should we focus on?",
    badge: "Lesson • 12:34",
  },
  {
    id: "m2",
    role: "user",
    content: "Can you explain why the loop exits early?",
    badge: "Lesson • 13:12",
  },
];

export { MOCK_MESSAGES };

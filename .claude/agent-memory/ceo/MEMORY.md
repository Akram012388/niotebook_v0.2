# CEO Agent Memory

## Strategic Decisions (Feb 2026)
- Board survival strategy completed: `docs/strategy/board-meeting-ceo-survival-strategy.md`
- Core thesis: Win through specificity, speed, and open-source -- not feature parity
- Audacious play: Open Learning Runtime protocol (Course Pack Spec + embeddable widget + community registry)
- NEVER pursue: paid ads, VC before 10K users, server-side execution, content creation, non-CS subjects

## Competitive Intelligence (Feb 2026)
- Google = #1 threat (NotebookLM + Gemini + Colab + Classroom, 10M+ students)
- Google Gemini Guided Learning (2026) integrates YouTube videos + adaptive AI -- closest to our value prop
- CS50 Duck is a direct competitor in our #1 vertical; CS50 prohibits other AI tools in academic honesty policy
- YouLearn AI is closest startup competitor (YouTube video + AI chat)
- Replit pivoting to enterprise/vibe-coding, less education-focused
- Khan Academy Khanmigo grew to 700K+ users, $4/month, Google partnership for AI
- Microsoft Copilot free for students, 20M users, but IDE-focused not lecture-aware

## Product Architecture Insights
- Nio context builder: `nioContextBuilder.ts` (306 lines) + `nioPrompt.ts` (71 lines)
- 3-layer transcript fallback: Convex DB -> SRT files -> YouTube API
- 7 WASM runtimes: JS, Python, C, HTML, CSS, SQL, R (all client-side)
- 9 environment presets for CS50 course variants
- AI failover: Gemini primary -> Groq fallback with first-token timeout detection
- Zero server-side execution = near-zero marginal COGS per user

## Key Risks
- CS50 academic honesty policy prohibits non-CS50 AI tools
- Google could build "YouTube + Gemini + Colab" integration in one quarter
- Solo founder bottleneck on execution speed

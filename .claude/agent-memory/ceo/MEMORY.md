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

## Marketing & Distribution Docs (Feb 2026)
- Brand strategy: `docs/marketing/brand-strategy.md` (positioning, voice, competitive comparison, messaging framework)
- Content strategy: `docs/marketing/content-strategy.md` (5 product videos with scripts, 16-week blog SEO calendar, social/YouTube/community plans)
- Earned media playbook: `docs/marketing/earned-media-playbook.md` (PH launch, HN strategy, press targets, 30+ YouTuber outreach targets with subscriber counts)
- Channel strategy: `docs/distribution/channel-strategy.md` (12 channels ranked, CS community map with subscriber counts, university outreach, browser extension plan)
- Partnership playbook: `docs/distribution/partnership-playbook.md` (OCW providers, creators, universities with outreach templates)
- Platform expansion roadmap: `docs/distribution/platform-expansion-roadmap.md` (15 courses prioritized across MIT/Stanford/Berkeley, runtime expansion plan, quarterly targets)

## Key Market Data (Feb 2026)
- CS50 total enrollments: 7.1M+; 1,000 on-campus Harvard students/semester
- r/learnprogramming: ~4.2M members; r/csMajors: ~424K; r/cs50: ~200K
- freeCodeCamp YouTube: 11.4M subs; Mosh: 4.9M; Fireship: 4M+; Bro Code: 3M
- CS50 YouTube: 1.88M subs; Stanford YouTube: 1.9M subs
- MIT OCW: 2,500+ courses, 300M visits/year
- Class Central: 1,000+ free CS courses from top 60 universities
- Product Hunt 2025-2026: only "Featured" products get traffic; authentic demos > polished videos

## Key Risks
- CS50 academic honesty policy prohibits non-CS50 AI tools
- Google could build "YouTube + Gemini + Colab" integration in one quarter
- Solo founder bottleneck on execution speed

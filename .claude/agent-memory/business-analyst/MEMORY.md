# Business Analyst Agent Memory

## Key Reports Written
- `docs/strategy/board-meeting-analyst-competitive-threat.md` -- Sherlock risk & defensibility analysis (2026-02-08)

## Critical Competitive Intelligence (as of 2026-02-08)

### Highest Threats to Niotebook
1. **Google (LearnLM + YouTube + Colab)** -- Sherlock probability 7/10. LearnLM is pedagogy-tuned AI, already integrated into YouTube. $30M education AI commitment. Free Gemini for students through 2026.
2. **Scrimba** -- Sherlock probability 7/10. Already merges video + IDE ("scrim" format). YC-backed, 120K MAU, $1.9M revenue. Closest architectural competitor.
3. **Coursera Coach** -- Sherlock probability 6/10. Already has video + AI tutor + Socratic dialogue. 1M+ Coach users. Powered by Gemini.

### CS50-Specific Risk
- CS50 itself builds AI tools: CS50 Duck (chatbot), help50, design50, style50 -- all VS Code extensions + web apps
- edX owns CS50 distribution. edX Xpert already provides AI tutoring.
- Niotebook's entire content catalog depends on CS50 open licensing.

### Market Structure
- Porter's Five Forces: 4.2/5 hostile. Very unattractive for venture-scale business.
- Buyer power EXTREME (students, free alternatives everywhere, zero switching costs)
- Substitutes VERY HIGH (YouTube + VS Code + ChatGPT is the default)

### Sherlocking Survival Patterns
- Survivors had: massive user base, revenue, cross-platform, enterprise/B2B, community/network effects
- Casualties had: tiny user base, zero revenue, single-platform, single feature, no community
- Niotebook maps to casualty profile on 6/8 indicators
- HBR: only 11.3% of startups fail specifically due to Big Tech replication; more common: market fit (42%), cash (29%), team (23%)

### Key Numbers
- Codecademy: acquired by Skillsoft ~$525M, 50M+ learners
- Khan Academy Khanmigo: 700K users (up from 68K), $4/mo pricing
- Replit: $222M raised, 10x revenue growth 2025, 30M+ devs
- Coursera: public, $1.5B+ revenue, 148M+ learners
- Scrimba: ~$940K raised, 120K MAU, $1.9M revenue 2024
- Brilliant: ~$90M raised, 10M+ learners

## Niotebook Ground Truth (from codebase)
- 7 runtime executors: JS, Python, C, HTML, CSS, SQL, R
- Context builder: lesson ID + video time + transcript window (+/-60s) + code + language + file name + hash + last error
- AI prompt: Socratic, refuses off-topic, hints not answers, references timestamps
- 9 env presets: cs50x-c, cs50x-python, cs50p-python, cs50w-js, cs50w-html, cs50ai-python, cs50sql-sql, cs50r, sandbox
- Schema: courses, lessons, chapters, transcriptSegments, users, invites, frames, lessonCompletions, codeSnapshots, chatThreads, chatMessages, events, feedback, rateLimits
- Stack: Next.js 16, React 19, Convex, Clerk, Pyodide, Wasmer, Gemini/Groq

## Strategic Recommendations (Priority Order)
1. URGENT: Remove invite gate, get to 10K+ users in 90 days
2. Expand content beyond CS50 (MIT OCW, Stanford, Berkeley)
3. Build community features (timestamp discussions, study groups, shared notebooks)
4. Secure institutional partnership (CS50 endorsement)
5. Generate any revenue (validates willingness to pay)

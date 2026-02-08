# Niotebook Board Meeting: Survival Strategy & Future Vision

**Date:** February 8, 2026
**Author:** CEO Office
**Classification:** Internal -- Board Eyes Only
**Agenda:** "What's the future of Niotebook and how does it survive the Sherlocked existential crisis?"

---

## Executive Summary

Niotebook is a unified video-lectures + live-code-editor + AI-tutor platform for CS students. We are a solo-founder, invite-only alpha with zero revenue, competing in a space where Google, Microsoft, Replit, Khan Academy, Coursera, Codecademy, and JetBrains are all aggressively deploying AI across their education stacks.

**The honest assessment:** Our core value proposition -- "watch, code, learn in one tab" -- is technically replicable by any incumbent within 6-12 months. Google's NotebookLM already turns documents and YouTube videos into interactive study experiences. Replit already combines code execution with AI tutoring. Microsoft already gives students free Copilot + Codespaces. Khan Academy's Khanmigo already does Socratic AI tutoring for $4/month.

**The survival thesis:** We do not win by having features incumbents cannot build. We win by doing something incumbents **will not** do -- obsessively serving a narrow audience (CS students learning from open courseware) with a depth of integration and pedagogical intentionality that is architecturally impossible for platforms optimizing for billions of general users. Our defense is not a wall. It is speed, specificity, and the compound interest of a passionate community that feels ownership over the product.

**The one audacious play:** Become the open-source "learning runtime" for CS courseware -- an embeddable, community-governed platform that any university, bootcamp, or content creator can deploy alongside their existing videos. Not a product. A **protocol** for interactive CS learning.

---

## Part 1: Competitive Landscape (February 2026)

### Google (Threat Level: CRITICAL)

| Asset | Status | Relevance to Niotebook |
|-------|--------|----------------------|
| **NotebookLM** | Free for all education users, 35+ languages, mind maps, audio/video overviews, quizzes, flashcards, LMS integrations (Canvas, Schoology, Classroom) | Directly overlaps our "learn from existing content + AI tutor" positioning |
| **Gemini in Classroom** | Expanding to higher ed, Gemini 3 Pro free for students, app-in-Gemini for Classroom tasks | Distribution we cannot match |
| **Google Colab** | AI-first redesign with Gemini 2.5 Flash as agentic coding partner, free Colab Pro for students | Overlaps our code execution + AI tutoring for Python/data science |
| **Gemini Guided Learning** | Rolled out in 2026, adapts to student struggles, integrates YouTube videos for explanations | This is the closest direct threat -- video + AI + adaptive learning |
| **Khan Academy partnership** | Gemini models powering Khan's Writing Coach | Google + Khan combined is our worst nightmare scenario |

**Why Google is the #1 existential threat:** They have the distribution (10M+ students on Gemini for Education in 1,000+ US institutions), the AI models (Gemini 3 Pro free for students), the content ecosystem (YouTube), the collaboration tools (Classroom), and the coding environment (Colab). If Google decided to build "Watch a CS50 lecture in YouTube while Gemini explains concepts and Colab runs your code" as a first-party experience, we would be redundant overnight.

**Why Google probably will not build exactly what we build:** Google optimizes for billions of users across all subjects. They will never build CS50-specific environment presets with `cs50.h` header support, Wasmer WASM C compilation in-browser, or a Socratic AI prompt specifically tuned to refuse off-topic questions and redirect to the active lecture. Specificity is our shield against generality.

Sources:
- [Google BETT 2026 Gemini/Classroom Updates](https://blog.google/products-and-platforms/products/education/bett-2026-gemini-classroom-updates/)
- [AI-First Google Colab](https://developers.googleblog.com/new-ai-first-google-colab-now-available-to-everyone/)
- [NotebookLM for Education](https://workspaceupdates.googleblog.com/2025/08/notebooklm-is-now-available-to-all.html)
- [Colab for Higher Education](https://blog.google/products-and-platforms/products/education/colab-higher-education/)

### Microsoft (Threat Level: HIGH)

| Asset | Status | Relevance to Niotebook |
|-------|--------|----------------------|
| **GitHub Copilot** | 20M users, 90% of Fortune 100, free for students, multi-model (GPT-5.1, Claude Opus 4.5, Gemini 3 Pro) | Sets the bar for AI coding assistance that students already use |
| **VS Code + Agent Mode** | Agent skills, parallel subagents, multi-agent orchestration in Jan 2026 update | Professional-grade AI coding that makes our CodeMirror editor look toy-like |
| **Codespaces** | Free Pro-level access for students via Student Developer Pack | Cloud dev environments students already know |
| **GitHub Education** | Free certifications, workshops, student pack | Distribution + brand trust we lack |

**Why Microsoft is dangerous but not fatal:** Microsoft's tools are IDE-first, built for professional developers. They are not optimized for the "watch a lecture video while coding along" workflow. VS Code does not embed YouTube players. Copilot does not know what your professor just said at timestamp 42:17. Their tools are powerful but context-blind to the educational video experience.

Sources:
- [VS Code AI Agent Skills](https://visualstudiomagazine.com/articles/2026/01/12/vs-code-december-2025-update-puts-ai-agent-skills-front-and-center.aspx)
- [Agents Took Over VS Code in 2025](https://visualstudiomagazine.com/articles/2025/11/05/microsoft-details-how-agents-took-over-vs-code-in-2025.aspx)
- [GitHub Student Developer Pack](https://education.github.com/pack)

### Replit (Threat Level: MODERATE-HIGH)

| Asset | Status | Relevance to Niotebook |
|-------|--------|----------------------|
| **Replit Agent + Ghostwriter** | $252.8M ARR, 5M+ apps created in 2025, 38% student user base | Closest competitor in "browser-based code + AI" |
| **Mobile Agent** | Ship apps from phone via chat | Innovation pace we must respect |
| **Pricing** | Free tier available but limited; Core plan $25/month | Our free model is a differentiator |

**Why Replit is a threat but not a Sherlock scenario:** Replit is pivoting hard toward enterprise and "vibe coding" (build apps from natural language). Their education play is a retention strategy, not their growth engine. They have no video lecture integration, no transcript-aware AI, and no courseware curation. They are building for builders, not for learners. Different jobs to be done.

Sources:
- [Replit Statistics 2026](https://www.index.dev/blog/replit-usage-statistics)
- [Replit AI Review 2025](https://sider.ai/blog/ai-tools/replit-ai-review-is-ghostwriter-and-agents-worth-it-in-2025)

### Khan Academy / Khanmigo (Threat Level: HIGH)

| Asset | Status | Relevance to Niotebook |
|-------|--------|----------------------|
| **Khanmigo** | 700K+ users (up from 68K), 380+ district partners, $4/month, Socratic AI tutoring | Closest to our pedagogical philosophy |
| **Coding support** | Reviews code in JS, HTML, Python, SQL within Khan courses | Direct feature overlap |
| **Google partnership** | Gemini models powering Khan's AI features | Massive AI infrastructure at nonprofit pricing |
| **Multi-modal** | Image uploads, speech-to-text, 10+ languages | Features we lack |

**Why Khan Academy is the most philosophically similar threat:** Khan shares our belief in Socratic AI tutoring -- guide students to answers, do not hand them solutions. Their AI reviews code and makes suggestions. They have CS content. But Khan's coding education is tied to their own curriculum and exercises. They do not curate external courseware. They do not offer multi-language WASM runtimes for C, R, or SQL. And their coding environment is not a real IDE -- it is an exercise widget.

Sources:
- [Khanmigo for Learners](https://www.khanmigo.ai/learners)
- [Khanmigo Math & Tutoring Updates](https://blog.khanacademy.org/khanmigo-math-computation-and-tutoring-updates/)

### Coursera & Codecademy (Threat Level: MODERATE)

Both are adding AI features (AI Learning Assistant, code autocomplete, AI hints) but remain course-marketplace models. They create or license proprietary content and charge $15-40/month. Neither offers real-time video-code synchronization or transcript-aware AI tutoring. They are competitors in the "learn to code" space but not direct threats to our specific architecture.

Sources:
- [Coursera 2026 Learning Trends](https://blog.coursera.org/2026s-fastest-growing-skills-and-top-learning-trends-from-2025/)
- [Codecademy AI Features](https://help.codecademy.com/hc/en-us/articles/23400751016859-AI-Features-available-on-Codecademy)

### JetBrains Academy (Threat Level: MODERATE)

In-IDE courses with AI-powered hints, 120+ courses, free for students. Strong for Python/Java/Kotlin learners. But tied to JetBrains IDEs (desktop apps), no video integration, no open courseware curation.

Sources:
- [JetBrains Academy AI Features](https://blog.jetbrains.com/education/2025/04/03/jetbrains-academy-plugin-2025-3-ai-features/)
- [JetBrains Student Pack](https://blog.jetbrains.com/education/2025/08/12/jetbrains-student-pack/)

### CS50's Own AI (Threat Level: EXISTENTIAL for CS50 vertical)

CS50 has built the **CS50 Duck** -- their own AI tool integrated into the course. They prohibit other AI tools in their Academic Honesty Policy. This means our #1 content source (CS50) is actively building a competing AI experience and discouraging alternatives.

Source: [CS50x 2026](https://cs50.harvard.edu/x/)

### Emerging Players

**YouLearn AI** -- AI tutor that understands PDFs, videos, and lectures. Allows interaction with YouTube videos through AI chat. This is the closest direct competitor to our video + AI integration model.

**Jungle** -- Transforms learning materials (including YouTube videos) into practice questions with spaced repetition. Different approach but similar input sources.

---

## Part 2: Feature Defensibility Assessment

### Easily Replicable (0-6 months for an incumbent)

| Feature | Who Could Copy It | Difficulty |
|---------|-------------------|-----------|
| Three-pane layout (video + code + chat) | Anyone with frontend engineers | Trivial |
| YouTube video embedding | Anyone | Trivial |
| AI chat with streaming SSE | Everyone already has this | Trivial |
| Code editor (CodeMirror) | Open-source, anyone can embed | Trivial |
| Course catalog with progress tracking | Standard edtech feature | Easy |
| Dark/light theme toggle | Standard | Trivial |

### Moderately Defensible (6-18 months, requires intentional effort)

| Feature | Why It Is Harder Than It Looks | Current State in Codebase |
|---------|-------------------------------|--------------------------|
| **Context-aware AI (Nio)** | Requires tight integration of video timestamp + transcript window + code snapshot + error output into every AI request. Not just "AI chat" -- it is a pedagogical context assembly pipeline (`nioContextBuilder.ts`) with budget management, oldest-message dropping, transcript truncation, and code truncation. | Fully built: system prompt in `nioPrompt.ts`, context builder with char budgeting, prompt injection neutralization, multi-source transcript fallback (Convex DB, SRT files, YouTube API) |
| **Multi-source transcript resolution** | Three-layer fallback: Convex DB segments, SRT subtitle files, YouTube transcript API. Most competitors would just use one source. | Built in `route.ts` with `fetchTranscriptWindow`, `fetchSubtitleWindow`, `fetchYoutubeTranscriptWindow` |
| **Socratic refusal policy** | AI explicitly refuses off-topic requests and redirects to lesson content. Most AI coding tools try to answer everything. Being opinionated about pedagogy is a feature. | Enforced in `nioPrompt.ts` with explicit refusal patterns |
| **AI provider failover** | Gemini primary with Groq fallback, first-token timeout detection, automatic failover with event logging. | Built in `route.ts` with `shouldFallbackBeforeFirstToken`, dual-provider streaming |
| **Course-specific environment presets** | 9 presets (cs50x-c, cs50x-python, cs50p-python, cs50w-js, cs50w-html, cs50ai-python, cs50sql-sql, cs50r, sandbox) with per-course starter files, compiler flags, package configs, timeout settings. | `envPresets.ts` with full preset definitions per CS50 course variant |

### Genuinely Defensible (requires deep domain expertise + sustained effort)

| Feature | Why Incumbents Cannot/Will Not Replicate | Current State |
|---------|----------------------------------------|---------------|
| **7 in-browser WASM runtimes** | JS (`new Function`), Python (Pyodide), C (Wasmer WASM in sandboxed iframe with COOP/COEP), HTML/CSS (iframe preview), SQL (sql.js/WASM), R (webR). Zero server-side containers. All client-side. This is genuinely hard engineering. Google Colab runs server-side. Replit runs server-side. Codecademy runs server-side. Running C code via Wasmer in a sandboxed iframe with virtual filesystem mounting is non-trivial. | Full executor implementations: `jsExecutor.ts`, `pythonExecutor.ts`, `cExecutor.ts`, `htmlExecutor.ts`, `cssExecutor.ts`, `sqlExecutor.ts`, `rExecutor.ts` with `WasmerBridge.ts` for C compilation |
| **Virtual filesystem with IndexedDB persistence** | In-memory tree synced to IndexedDB via Zustand store. Multi-file editing with tabs and file tree sidebar. VFS mounts into Wasmer for C compilation. This powers the "real IDE feel" without any server. | `src/infra/vfs/` with full implementation |
| **Deep CS50 courseware integration** | Not just "here is CS50 on YouTube." Environment presets include `cs50.h` header support, `-lcs50` compiler flags, course-specific packages (`cs50` Python library, `numpy` for CS50AI). The AI knows the lecture number, the transcript window, and can reference what the professor said at a specific timestamp. | Schema: lessons with `environmentConfig`, `transcriptSegments` with time-indexed lookup, `chapters` for structural navigation |
| **Pedagogical AI architecture** | Nio is not a chatbot with a system prompt bolted on. It is a structured context assembly pipeline: lesson metadata + lecture number + video timestamp + transcript window + code snapshot with hash + error output + conversation history, all budget-managed to fit within token limits. The AI is opinionated: it refuses off-topic requests, uses Socratic questioning, provides minimal diffs not full solutions, and ends every response with a "Next step." | `nioContextBuilder.ts` (306 lines of pure domain logic), `nioPrompt.ts` (71 lines of pedagogical system prompt) |

---

## Part 3: Seven Bold Survival Strategies

### Strategy 1: OWN THE CS50 VERTICAL COMPLETELY, THEN EXPAND

**The play:** Instead of trying to support all CS courses, become the undeniably best way to learn CS50 -- period. Better than the CS50 website. Better than the CS50 Duck. Better than watching on YouTube with a separate IDE open.

**Why incumbents cannot do this:** Google, Microsoft, and Replit serve everyone. They will never build CS50-specific environment presets with `cs50.h`, `-lcs50` compiler flags, or starter files that match each week's problem set. Khan Academy has its own curriculum and will not curate Harvard's. CS50's own tools are built by TFs and teaching staff, not product engineers obsessed with UX.

**Specific actions:**
1. Build problem-set-specific workspaces for every CS50x week (Mario, Cash, Credit, Readability, etc.) with starter code, test cases, and AI hints tuned to common mistakes.
2. Add CS50 `check50` and `style50` integration -- run the official CS50 linters/checkers in-browser or via API.
3. Create a "Lecture Companion" mode where the AI proactively summarizes key concepts as the video plays (opt-in), creating a living study guide.
4. Map every CS50 lecture to chapters, key concepts, and common student questions. Pre-seed Nio with knowledge of typical CS50 student struggles.
5. Once CS50 is dominant, replicate the playbook for MIT OCW 6.001, Stanford CS106A/B, and other top open courseware.

**Cost:** Sweat equity. Zero dollars. Maximum effort.

### Strategy 2: BUILD THE COMMUNITY MOAT THAT CORPORATIONS CANNOT

**The play:** Create a student community around niotebook that generates network effects incumbents structurally cannot replicate because they do not have the culture or incentive structure.

**Why incumbents cannot do this:** Google, Microsoft, and Coursera are platforms with millions of anonymous users. They cannot build tight-knit CS learning communities because their incentive is to scale, not to deepen. Replit has a community but it is builder-focused, not learner-focused.

**Specific actions:**
1. **Cohort learning:** Let students form study groups around a CS50 cohort. They see each other's progress. They can share code snapshots (not solutions -- scaffolds and approaches) through Nio-mediated channels.
2. **Student-generated annotations:** Let students pin comments to specific timestamps in lecture videos. "This is where I got confused about pointers" becomes shared knowledge for the next cohort.
3. **Leaderboard-free progress:** Show progress without competitive rankings. Use completion streaks, not scores. The goal is encouragement, not competition.
4. **Discord/community integration:** Build in the open. Share development progress. Let students vote on features. Make them feel like co-owners.
5. **Office Hours with Nio:** Weekly themed AI office hours where Nio focuses on that week's CS50 problem set. Creates a cadence and habit loop.

**Cost:** Time to build features + time to cultivate community. Zero ad spend.

### Strategy 3: ZERO-DOLLAR INFRASTRUCTURE AS COMPETITIVE ADVANTAGE

**The play:** Our entire architecture runs client-side. No containers. No GPU servers. No per-user compute costs. This is not just an engineering choice -- it is a business model weapon.

**Why this matters:** Google Colab charges for GPU time. Replit charges $25/month because they run containers. Codespaces has usage limits. Every competitor with server-side execution has a COGS problem that scales linearly with users. We do not. Our marginal cost per user is approximately $0 for code execution (WASM in-browser) + pennies for AI API calls.

**Specific actions:**
1. Stay client-side for execution. Never build server containers. This keeps our cost structure fundamentally different from competitors.
2. Negotiate volume pricing or use free-tier AI APIs aggressively. Gemini offers generous free tiers. Groq is fast and cheap. Use both.
3. If we ever need revenue, we can offer premium at prices that undercut everyone because our COGS are near-zero. A $2/month premium tier is viable for us but suicidal for Replit or Codespaces.
4. Use this cost advantage to stay free longer than anyone expects. Free is the ultimate growth hack for students.

**Cost:** Already built. Maintain the architecture discipline.

### Strategy 4: SPEED AS STRATEGY -- SHIP WHAT MATTERS FASTER THAN COMMITTEES CAN APPROVE IT

**The play:** Akram, as a solo founder, can ship a feature in a day that would take Google three quarters of planning, privacy review, and legal approval. This speed advantage is real, measurable, and compounds over time.

**Why incumbents cannot do this:** Google's NotebookLM team has to coordinate with YouTube, Classroom, Colab, and Gemini teams. Microsoft's Copilot team has to align with VS Code, GitHub, and Azure. Khan Academy has to go through pedagogical review boards. We have one person who understands the entire stack and can deploy in minutes.

**Specific actions:**
1. Ship weekly. Every Friday, one visible improvement lands for users.
2. Build a public changelog that students can see. Make shipping a brand trait.
3. When a competitor announces something, have our version live within 48 hours (if it aligns with our mission). Not a copy -- our take on the concept, tailored for our users.
4. Use the speed to experiment aggressively. A/B test AI prompt variations. Try new UI layouts. Kill features that do not move engagement metrics. Iterate like a maniac.

**Cost:** Akram's time and energy. The most valuable currency we have.

### Strategy 5: MAKE NIO THE BEST CS TEACHING ASSISTANT ON THE PLANET

**The play:** The AI is our product. Not the video player (YouTube does that). Not the code editor (VS Code does that). The AI that knows what you are watching, what you are coding, what error you just hit, and what the professor said 30 seconds ago -- that is the 10x experience nobody else has assembled.

**Why incumbents cannot match this easily:** Copilot does not know you are watching a lecture. ChatGPT does not know your professor just explained hash tables. Khanmigo knows Khan content but not CS50 lectures. Google Colab's Gemini knows your notebook but not the YouTube video playing in another tab. Nio is the only AI that has simultaneous context across video, code, and errors.

**Specific actions:**
1. Expand the context window. Currently limited to approximately 3,072 tokens / 12K chars. Push toward 8K-16K context to include more transcript history and longer code files.
2. Add error pattern recognition. When a student hits a segfault in C, Nio should know the top 5 causes for CS50 students and guide through them systematically.
3. Build a "Nio memory" per student. Track which concepts they have struggled with across sessions. Reference past struggles in new conversations. "Last week you had trouble with pointers -- this week's malloc topic builds on that."
4. Add proactive interventions. If a student has been stuck on the same error for 5 minutes without asking Nio, offer help. "I noticed you have been getting a segfault. Want me to take a look at your code?"
5. Integrate Nio with code execution output. When the student runs code and it fails, Nio should automatically see the error and be ready to help without the student having to copy-paste.

**Cost:** AI API costs (manageable with current providers), engineering time for context expansion and student memory.

### Strategy 6: OPEN-SOURCE THE CORE, MONETIZE THE ECOSYSTEM

**The play:** Open-source the niotebook runtime (the three-pane workspace, WASM executors, VFS, and context-builder). Let anyone deploy it. Build a community of contributors. Monetize through hosted services (managed AI, analytics, content curation) or a marketplace.

**Why this is powerful:** An open-source learning runtime has no single point of failure. It cannot be Sherlocked because it IS the platform. Google cannot acquire an open-source project. They can only build on top of it or compete with it. And competing with a free, community-maintained tool is expensive and thankless.

**Why incumbents will not do this:** They cannot open-source their education tools because those tools are bundled with proprietary platforms (Classroom, GitHub, Replit's infrastructure). Open-sourcing is antithetical to their business models.

**Specific actions:**
1. Extract the core runtime into a standalone package: `@niotebook/runtime` (WASM executors, VFS, context builder).
2. Create an embeddable widget: `<niotebook-workspace>` that any website can drop in next to a YouTube embed.
3. Build a "course pack" format -- a JSON/YAML spec for defining courses with video IDs, transcript sources, environment presets, and AI tutor configurations.
4. Invite university CS departments to adopt and customize. Offer free setup help.
5. Build a contributor community around the open-source core. Accept PRs for new language runtimes (Go, Rust, Java), new course packs, and UX improvements.

**Cost:** Time to extract and package. Community management effort. But this creates a moat that is nearly impossible to break.

### Strategy 7: BECOME THE DEFAULT COMPANION APP FOR OPEN COURSEWARE

**The play:** Position niotebook not as a standalone platform but as the "missing companion" for any open CS courseware. MIT OCW has videos but no coding environment. Stanford Online has lectures but no AI tutor. CS50 has tools but they are fragmented. Niotebook unifies the experience for ANY open courseware.

**Why this is a massive market:** There are thousands of free CS courses on YouTube, MIT OCW, Stanford Online, edX, and university websites. Billions of views, zero integration. Every student watching these videos is tab-switching between YouTube, their IDE, and ChatGPT. We are the product that eliminates that friction.

**Specific actions:**
1. Build a "Quick Start" flow: paste a YouTube playlist URL, and niotebook auto-creates a course with lessons, transcript extraction, and environment detection.
2. Create a browser extension that detects CS lecture videos on YouTube and offers a "Open in Niotebook" button.
3. Partner with open courseware programs directly. Offer niotebook as a free recommended companion tool. Universities love free tools that improve student outcomes.
4. Build an API that content creators can use to generate niotebook-compatible course packs from their existing YouTube playlists.

**Cost:** Engineering time for URL-to-course pipeline and browser extension. Partnership outreach. Zero dollars.

---

## Part 4: THE ONE AUDACIOUS 10x PLAY

### Niotebook as the Open Learning Runtime for CS Education

Here is the vision: Niotebook is not an app. It is a **protocol**.

Every CS course on the internet today is a collection of disconnected artifacts: video lectures on YouTube, slides on a university website, problem sets in PDFs, coding environments in separate tools, AI tutoring in yet another tab. The student is the integration layer. They are the ones doing the work of stitching it all together.

**We build the integration layer and we open-source it.**

The `niotebook runtime` becomes a standard that any content creator, university, or bootcamp can adopt:

1. **Course Pack Spec:** An open format for defining a CS course: video IDs, transcript sources, environment presets (language, starter files, compiler flags, packages), AI tutor configuration (system prompt extensions, topic boundaries), and progress milestones.

2. **Embeddable Runtime:** A web component (`<niotebook-workspace course="cs50x-2026.json">`) that any website can embed. MIT OCW drops it on their course page. A YouTube creator puts it on their website. A bootcamp integrates it into their LMS.

3. **Community Course Registry:** An open registry where anyone can publish course packs. "CS50x 2026" by the niotebook community. "MIT 6.001 2025" by a contributor. "Traversy Media JavaScript Course" by a fan. The community curates quality.

4. **Pluggable AI Backend:** The runtime ships with a default AI configuration (Nio system prompt + Socratic pedagogy) but supports custom AI backends. A university can plug in their own fine-tuned model. A bootcamp can add domain-specific knowledge.

5. **Student Data Sovereignty:** All student data (code snapshots, progress, chat history) stays client-side in IndexedDB or in a student-controlled backend. No vendor lock-in. Students own their learning data.

**Why this is defensible:**
- Once 50 course packs exist in the registry, the network effect is self-sustaining. Each new course attracts students. Each student creates demand for more courses.
- Open-source means the community maintains and improves the runtime. Akram does not have to do everything alone.
- The protocol becomes a standard. Standardization is the strongest moat in technology. HTTP cannot be Sherlocked. Markdown cannot be Sherlocked. An open learning runtime cannot be Sherlocked.
- Universities adopt free, open tools. They resist proprietary vendor lock-in. This plays directly into institutional procurement psychology.

**Why incumbents will not do this:**
- Google will not open-source NotebookLM.
- Microsoft will not open-source Copilot.
- Khan Academy will not open-source Khanmigo.
- Replit will not open-source Ghostwriter.

They are all building walled gardens. We build the commons.

**Execution roadmap:**
- **Month 1-2:** Extract the runtime core. Publish on GitHub. Write documentation. Define the Course Pack Spec v0.1.
- **Month 3-4:** Build the embeddable widget. Create 5 course packs (CS50x, CS50P, CS50W, CS50AI, CS50SQL) as reference implementations.
- **Month 5-6:** Launch the community registry. Invite 10 university CS departments to pilot. Start accepting contributor PRs.
- **Month 7-12:** Grow the registry to 50+ courses. Build the browser extension. Establish partnerships with 3-5 open courseware programs.

**Revenue model (when ready):**
- Free: Open-source runtime + community course packs + client-side AI (bring your own API key).
- Hosted: Managed niotebook with Nio AI included, student analytics, and progress sync across devices. $2-5/month for students (we can price this low because our COGS are near-zero).
- Institutional: University deployment with admin dashboards, LTI integration, and custom AI configuration. Usage-based pricing.

---

## Part 5: Immediate Action Items (Next 30 Days)

| Priority | Action | Owner | Deadline |
|----------|--------|-------|----------|
| P0 | Expand Nio's context window from 3K to 8K tokens | Akram | Week 2 |
| P0 | Build problem-set-specific workspaces for CS50x Weeks 1-3 | Akram | Week 3 |
| P0 | Add proactive error detection (Nio auto-sees runtime errors) | Akram | Week 2 |
| P1 | Create public changelog page on niotebook.com | Akram | Week 1 |
| P1 | Design Course Pack Spec v0.1 (JSON schema) | Akram | Week 4 |
| P1 | Ship "paste YouTube playlist URL to create course" feature | Akram | Week 4 |
| P2 | Open GitHub repo for niotebook runtime core | Akram | Week 4 |
| P2 | Write blog post: "Why We Are Open-Sourcing the Learning Runtime" | Akram | Week 4 |
| P2 | Set up Discord for early community | Akram | Week 1 |

---

## Part 6: What We Will NOT Do

These are deliberate strategic exclusions. Saying no is as important as saying yes.

1. **We will NOT spend money on paid advertising.** If the product is not good enough to grow through word of mouth, the product is not good enough yet.
2. **We will NOT raise venture capital until we have 10,000 active users.** Premature fundraising dilutes Akram's ownership for zero benefit. The product needs users before it needs money.
3. **We will NOT build our own course content.** We curate the best open courseware. Creating content is a different business with different economics. Stay in our lane.
4. **We will NOT try to serve all subjects.** We are CS education. Maybe data science adjacent. Never chemistry or history or literature. Depth over breadth.
5. **We will NOT copy CS50 Duck or Khanmigo.** We study them, learn from them, and then build something architecturally superior. Their AI is bolted onto existing platforms. Ours is the platform.
6. **We will NOT build server-side code execution.** Our client-side WASM architecture is a structural cost advantage. The moment we spin up containers, we inherit the same COGS problem as every competitor.

---

## Closing: The Survival Equation

Niotebook survives the Sherlocked scenario by being something an incumbent structurally cannot become: a focused, opinionated, community-owned learning runtime for CS education built by someone who cares more about CS students than about quarterly revenue targets.

The math is simple:

- **Incumbents optimize for:** Revenue per user across billions of users.
- **We optimize for:** Learning outcomes per session for CS students watching open courseware.

These are different optimization functions. They produce different products. And as long as we remain obsessively focused on ours, we occupy a space that is genuinely painful for incumbents to enter -- not because they lack the technology, but because they lack the incentive and the focus.

The one thing that kills us is not Google or Microsoft or Replit. The one thing that kills us is if we stop shipping, stop listening to students, and stop being the product that someone builds when they genuinely love solving this problem.

Sales cure all. But earned sales -- from a product so good that students tell their classmates about it -- cure everything.

Let's get to work.

---

*Document prepared for niotebook board meeting, February 2026.*
*All competitive intelligence sourced from public announcements and product pages as of February 8, 2026.*

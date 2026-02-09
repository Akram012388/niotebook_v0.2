# Niotebook Content Strategy

**Date:** February 9, 2026
**Author:** CEO Office
**Classification:** Internal -- Marketing Execution
**Status:** Living Document (update monthly)

---

## Executive Summary

Niotebook's content strategy is built on one principle from the board meeting survival plan: **we earn our audience, we never buy it.** Every piece of content serves one of three goals: (1) demonstrate the product's value in a way that cannot be faked, (2) capture organic search traffic from CS students already looking for help, or (3) establish Akram as a credible voice in the CS education space.

Our content engine has five pillars: product demo videos, SEO-targeted blog content, social media presence, YouTube SEO for CS education long-tail keywords, and community engagement. Total budget: zero dollars. Total requirement: Akram's time and the product itself.

The content strategy is sequenced. Videos first (they are the most shareable, most convincing proof that the product works). Blog second (compounds over time via SEO). Social third (amplifies the first two). Community fourth (builds relationships that no content can replace).

The target market is massive: 7.1 million CS50 enrollees alone, 4.2 million r/learnprogramming members, and 1,000+ free CS courses from the world's top universities. Our content must be the bridge between students and the product.

---

## 1. The Five Product Videos Plan

These five videos are the foundation of all marketing efforts. They are referenced in the board meeting CEO survival strategy as a priority. Each video should be 2-5 minutes, screen-recorded with voiceover, showing real product usage. No agency production. Authenticity beats polish.

### Video 1: "What If Your CS Lecture Had a Code Editor Built In?"

**Purpose:** Hero video. First impression. The "aha moment" video. This is the single most important piece of marketing content we will ever create.

**Script Outline:**

```
[0:00-0:15] THE PAIN
- Split screen: student with YouTube in one tab, VS Code in another, ChatGPT in a third
- Mouse frantically switching between them
- Voiceover: "This is how 7.1 million CS50 students learn. Three tabs. Zero context.
  Your AI has no idea what the professor just said."

[0:15-0:30] THE REVEAL
- Smooth transition to: Niotebook. One tab.
- Lecture playing on the left. Code editor on the right. Nio chat below.
- Voiceover: "What if they didn't have to?"

[0:30-1:00] THE AHA MOMENT
- Show a real CS50 moment: professor explains arrays in C
- Student pauses, types code in the editor, hits a bug
- Student asks Nio: "What's wrong with my array?"
- Nio responds referencing the lecture: "At 12:34, the professor mentioned that
  arrays in C are zero-indexed. Your loop starts at 1..."
- Voiceover: "Nio reads the lecture transcript. It sees your code. It catches your errors.
  All at the same time."

[1:00-1:20] THE BREADTH
- Quick montage: Python running, SQL query executing, HTML preview rendering
- Voiceover: "7 languages. Zero setup. Everything runs in your browser."

[1:20-1:30] THE CLOSE
- Full workspace view, dark mode
- Text overlay: "watch. code. learn."
- Voiceover: "Niotebook. Free for students. niotebook.com"
```

**Duration:** 90 seconds
**SEO Keywords:** cs50 study tool, cs50 coding environment, learn cs online, cs lecture companion, cs50 online ide
**Distribution:** YouTube (primary), Product Hunt gallery, landing page hero, Twitter/X, Reddit launch posts, LinkedIn
**Thumbnail:** Dark-mode workspace screenshot with large text: "Your CS lecture is broken"

### Video 2: "Nio Knows What Your Professor Just Said"

**Purpose:** Demonstrate the AI context-awareness differentiator. This is the feature no competitor has.

**Script Outline:**

```
[0:00-0:20] SETUP
- Student watching CS50 Lecture 5, professor explains pointers
- Voiceover: "You're watching CS50. The professor starts talking about pointers.
  You're confused. You need help."

[0:20-0:50] THE COMPARISON
- LEFT SIDE: Student opens ChatGPT, types "explain pointers in C"
- ChatGPT gives generic answer (no lecture context)
- RIGHT SIDE: Same student, same moment, but in Niotebook
- Asks Nio: "What did the professor mean about pointers?"
- Nio responds: "At 34:12, Professor Malan explained that a pointer stores a
  memory address. Your variable 'p' on line 5 needs to be initialized before
  you dereference it..."

[0:50-1:20] THE DEBUGGING MOMENT
- Student writes pointer code, gets a segfault
- Nio automatically sees the error
- Nio: "Segfault on line 8. You're dereferencing 'p' before calling malloc().
  The professor covered this at 36:45..."
- Student fixes the code, it runs

[1:20-1:40] THE CLOSE
- Side-by-side: ChatGPT's generic answer vs Nio's lecture-grounded answer
- Text: "Generic AI vs. Lecture-aware AI"
- Voiceover: "Nio knows your lecture. ChatGPT doesn't."
- CTA: niotebook.com
```

**Duration:** 2 minutes
**SEO Keywords:** ai tutor for cs50, cs50 ai help, context-aware ai tutor, cs lecture ai assistant, cs50 pointers help
**Distribution:** YouTube, Reddit (r/cs50, r/learnprogramming), Twitter/X, Product Hunt

### Video 3: "7 Languages, Zero Setup, One Browser Tab"

**Purpose:** Demonstrate the technical depth. Appeal to both students and developers.

**Script Outline:**

```
[0:00-0:10] HOOK
- Voiceover: "No terminal. No Docker. No WSL. No 'install this first.'
  Open your browser. Start coding."

[0:10-0:30] C (Wasmer WASM)
- Write hello.c with #include <cs50.h>
- Compile and run in browser
- Voiceover: "C compiles via Wasmer WASM. With cs50.h support built in."

[0:30-0:50] PYTHON (Pyodide)
- Write a Python script with numpy import
- Run instantly
- Voiceover: "Python via Pyodide. NumPy, CS50 library, all pre-loaded."

[0:50-1:05] SQL (sql.js)
- Query a sample database
- Results display inline
- Voiceover: "SQL with instant query results."

[1:05-1:20] HTML/CSS (iframe preview)
- Write HTML, see live preview
- Voiceover: "HTML and CSS with live preview."

[1:20-1:35] JAVASCRIPT + R
- Quick cuts of JS and R running
- Voiceover: "JavaScript, R, and more. Seven languages total."

[1:35-1:50] CS50 CONTEXT
- Show environment preset switching: cs50x-c -> cs50x-python -> cs50sql-sql
- Voiceover: "CS50 Week 1? C with cs50.h. Week 6? Python. Week 7? SQL.
  The right environment, automatically."

[1:50-2:00] CLOSE
- Text: "From C to SQL. No setup required."
- CTA: niotebook.com
```

**Duration:** 2 minutes
**SEO Keywords:** run c in browser, python in browser no install, online code editor for cs50, browser ide for students, compile c online, wasmer wasm
**Distribution:** YouTube, Hacker News, r/programming, r/webdev, dev Twitter/X

### Video 4: "How I Built a CS Learning Workspace as a Solo Developer"

**Purpose:** Founder story. Authenticity play. Hacker News bait. Indie Hackers catnip.

**Script Outline:**

```
[0:00-0:30] THE ORIGIN
- Akram on camera (or voiceover with code scrolling):
  "I was a CS student who spent more time setting up my coding environment
  than actually learning. VS Code in one tab. YouTube in another. ChatGPT
  in a third. None of them knew about each other. So I built the tool I
  wished existed."

[0:30-1:30] THE ARCHITECTURE
- Walk through the stack: "Next.js 16, React 19, TypeScript strict"
- Show 7 WASM runtimes: "JavaScript runs via new Function(). Python via
  Pyodide. C via Wasmer in a sandboxed iframe with COOP/COEP headers."
- Show nioContextBuilder.ts briefly: "306 lines of pure domain logic that
  assembles video timestamp, transcript window, code snapshot, and runtime
  errors into a single AI prompt."
- Show the failover: "Gemini primary, Groq fallback, with first-token
  timeout detection."

[1:30-2:30] THE ECONOMICS
- "Here's the part that makes this sustainable: everything runs in your
  browser. No server containers. No GPU servers. Our cost per user is
  54 cents a month. Replit spends $3-5 per user on containers. We spend
  zero on code execution."
- Show Convex backend: "Real-time sync, auth, progress tracking -- all
  on the free tier at our current scale."

[2:30-3:30] THE MISSION
- "There are 7.1 million students enrolled in CS50 alone. 1,000+ free
  CS courses from top universities. And the tooling around all of this
  open courseware is stuck in 2010. I want to change that."
- Show the vision: Course Pack Spec, embeddable widget, open-source runtime
- "One person. One mission. The best way to learn CS from open courseware."

[3:30-3:45] CLOSE
- "Try it free at niotebook.com. All feedback goes directly to me.
  I am the entire team."
```

**Duration:** 3-4 minutes
**SEO Keywords:** solo developer project, building an edtech startup, wasm code execution browser, building with next.js and convex, indie developer, side project showcase
**Distribution:** YouTube, Hacker News (Show HN), r/webdev, r/SideProject (~200K), Indie Hackers, dev.to, LinkedIn

### Video 5: "CS50 in Niotebook: A Full Walkthrough"

**Purpose:** Long-form tutorial. The "see the whole experience" video. SEO magnet for CS50 searches.

**Script Outline:**

```
[0:00-0:30] INTRO
- "This is the complete CS50 experience in Niotebook. From course catalog
  to code execution to AI tutoring. Let me show you everything."

[0:30-2:00] COURSE CATALOG AND SETUP
- Open niotebook.com. Show the course catalog.
- Select CS50x 2026. Browse lessons by week.
- Open Week 1: "This is CS50" with David Malan.
- Tour the workspace: video pane, code pane, AI chat pane.

[2:00-4:00] LEARNING WITH VIDEO + CODE
- Watch Professor Malan introduce C.
- Pause at the "hello world" section.
- Write hello.c in the editor. Note the cs50.h support.
- Compile and run. "Hello, world!" appears in terminal.
- Ask Nio: "Can you explain what #include does?"
- Nio responds with lecture-grounded explanation.

[4:00-5:30] DEBUGGING WITH NIO
- Write a more complex program. Introduce a bug intentionally.
- Run code. See the error.
- Nio automatically detects the error and offers guidance.
- Follow Nio's Socratic hints to fix the bug.
- "Notice how Nio didn't give me the answer -- it guided me to find it."

[5:30-6:30] MULTI-COURSE NAVIGATION
- Switch to Week 6 (Python). Show environment preset changing automatically.
- Write a Python script. Import cs50 library. Run it.
- Switch to Week 7 (SQL). Run a SQL query.
- "Same workspace. Different languages. The right tools for each week."

[6:30-7:30] PROGRESS AND FEATURES
- Show progress tracking across lessons.
- Show the virtual filesystem (multi-file editing).
- Show the transcript panel syncing with video.

[7:30-8:00] CLOSE
- "This is how 7.1 million CS50 students should be learning.
  Try it free at niotebook.com."
```

**Duration:** 7-8 minutes
**SEO Keywords:** cs50 tutorial 2026, how to learn cs50, cs50 study guide, cs50 online learning, cs50 walkthrough, cs50 coding environment
**Distribution:** YouTube (optimize for CS50 search), landing page, email drip for new signups

### Video Production Priorities and Timeline

| Priority | Video | Title | Deadline | Effort |
|----------|-------|-------|----------|--------|
| P0 | Video 1 | "What If Your CS Lecture Had a Code Editor Built In?" | Week 2 | 1 day recording + 1 day editing |
| P0 | Video 2 | "Nio Knows What Your Professor Just Said" | Week 3 | 1 day total |
| P1 | Video 3 | "7 Languages, Zero Setup, One Browser Tab" | Week 4 | 1 day total |
| P1 | Video 4 | "How I Built a CS Learning Workspace as a Solo Developer" | Week 5 | 2 days total |
| P2 | Video 5 | "CS50 in Niotebook: A Full Walkthrough" | Week 6 | 2 days total |

**Production notes:**
- Screen recording with OBS (free). Voiceover with a decent USB mic ($30-50).
- No fancy editing. Clean cuts, clear narration, real product usage. Authenticity beats production value. (Product Hunt data from 2025-2026 confirms: authentic screen recordings outperform polished agency videos.)
- Each video should have a 3-second end card: "watch. code. learn. -- niotebook.com"
- Upload to YouTube with full SEO optimization (see Section 4).
- Create 15-second and 30-second cuts of Video 1 for Twitter/X and TikTok.

---

## 2. Blog / Content Calendar

### 2.1 Content Pillars

| Pillar | Purpose | SEO Value | Example Topics |
|--------|---------|-----------|---------------|
| **CS Learning Guides** | Capture organic search from students seeking help | HIGH -- targets intent-rich queries | "How to Set Up Your CS50 Environment in 2026", "Understanding Pointers in C" |
| **Product Updates** | Public changelog, transparency, build-in-public credibility | LOW (direct SEO) but builds trust | "Week 12: We Added SQL Execution", "How Nio's Context Builder Works" |
| **Technical Deep Dives** | Attract developer audience, establish technical credibility | MEDIUM -- targets dev queries | "Running C in the Browser with Wasmer WASM", "Building a Context-Aware AI for Education" |
| **Open Courseware Advocacy** | Position as champion of free CS education, linkable content | HIGH -- shareable, linkable | "The Best Free CS Courses in 2026", "Why Open Courseware Needs Better Tooling" |

### 2.2 SEO-Targeted Blog Posts (First 16 Weeks)

Each post targets a specific search query cluster that CS students are actively searching for. Estimated search volumes are based on keyword research tools and competitor analysis.

| Week | Title | Target Keywords | Est. Monthly Volume | Intent |
|------|-------|----------------|-------------------|--------|
| 1 | "The Best Way to Study CS50 in 2026" | cs50 study guide 2026, how to learn cs50, cs50 tips | 5K-10K | Students starting CS50 |
| 2 | "CS50 Problem Set 1 Guide: Mario, Cash, Credit" | cs50 pset 1 help, cs50 mario, cs50 cash | 2K-5K | Students stuck on Week 1 |
| 3 | "How to Run C Code in Your Browser (No Terminal Required)" | run c online, c compiler browser, compile c online | 10K-50K | Technical + student overlap |
| 4 | "Understanding Pointers in C: The CS50 Student's Guide" | c pointers explained, cs50 pointers, pointers for beginners | 5K-20K | Highest-confusion CS50 topic |
| 5 | "5 Free CS Courses That Are Better Than Most Bootcamps" | free cs courses 2026, best free programming courses, cs50 alternatives | 10K-50K | Listicle for broad organic traffic |
| 6 | "Why We Built an AI That Refuses to Give You the Answer" | socratic ai tutor, ai for learning, ai tutoring for cs | 1K-5K | Thought leadership + differentiation |
| 7 | "CS50 Week 6: Transitioning from C to Python" | cs50 python, cs50 week 6, c vs python cs50 | 2K-5K | Students at the C-to-Python transition |
| 8 | "Running Python in the Browser with Pyodide: A Technical Deep Dive" | pyodide tutorial, python wasm, python in browser | 5K-10K | Developer audience |
| 9 | "How to Actually Finish an Online CS Course (Completion Data)" | online course completion rate, how to finish cs50, mooc completion | 5K-20K | Students who dropped off |
| 10 | "The 10 Most Common CS50 Errors (and How to Fix Them)" | cs50 segfault, cs50 common errors, cs50 help | 2K-5K | Students debugging |
| 11 | "Building a Context-Aware AI Tutor: Architecture Deep Dive" | ai tutor architecture, context-aware ai, building ai for education | 1K-5K | Technical audience, HN material |
| 12 | "Open Courseware Deserves Better Tools" | open courseware, mit ocw, free university courses | 5K-10K | Advocacy piece, shareable |
| 13 | "CS50 vs MIT OCW 6.0001: Which Should You Take?" | cs50 vs mit, best intro cs course, mit ocw vs cs50 | 2K-5K | Comparison piece, high intent |
| 14 | "The Solo Developer's Guide to Building with WASM" | wasm tutorial, webassembly browser, wasmer guide | 5K-10K | Developer audience, HN-shareable |
| 15 | "What Makes a Good AI Tutor? Lessons from Building Nio" | ai tutor design, educational ai, ai in education | 1K-5K | Thought leadership |
| 16 | "Stanford CS106A/B vs CS50: A Student's Comparison" | stanford cs106a, cs106b, stanford vs harvard cs | 2K-5K | Expands beyond CS50 audience |

### 2.3 Content Production Standards

- **Length:** 1,500-3,000 words for SEO posts. 500-1,000 for changelogs.
- **Format:** Markdown, published on niotebook.com/blog (Next.js static pages).
- **Images:** Annotated screenshots of Niotebook showing the specific topic. No stock photos.
- **CTA:** Every post ends with "Try it in Niotebook" with a link to the relevant course/lesson.
- **Frequency:** One post per week minimum. Changelogs whenever something ships.
- **Quality bar:** Every post should teach something useful even if the reader never uses Niotebook. Value first, product second.
- **Internal linking:** Every post links to at least 2 other blog posts and 1 product page.

---

## 3. Social Media Strategy

### 3.1 Platform Prioritization

| Platform | Priority | Audience | Content Type | Posting Cadence | Why This Priority |
|----------|----------|----------|-------------|-----------------|-------------------|
| **Twitter/X** | P0 | Developers, CS students, edtech community | Product demos (GIFs/clips), build-in-public, CS tips | 3-5x/week | Fast iteration, developer community, viral potential |
| **Reddit** | P0 | CS students (r/cs50 ~200K, r/learnprogramming ~4.2M, r/csMajors ~424K) | Helpful answers + subtle product mentions, launch posts | 2-3x/week (comments), launches as needed | Highest-intent CS student audience |
| **YouTube** | P1 | CS students searching for help | Product videos, CS concept explainers, tutorials | 1-2x/month (quality over quantity) | Long-tail SEO, compound growth |
| **LinkedIn** | P2 | Professors, edtech industry, potential partners | Thought leadership, milestone announcements | 1-2x/week | University and partnership outreach |
| **TikTok** | P3 | Gen Z CS students | Short product demos, "day in the life of a CS student" | Experimental, 1-2x/week if traction | Youngest demographic, viral format |
| **Discord** | P0 | Early adopters, community members | Real-time support, feature discussions, feedback | Daily presence | Core community, feedback loop |

### 3.2 Twitter/X Content Mix

| Content Type | Frequency | Example |
|-------------|-----------|---------|
| **Product demos** (GIF/video clips) | 2x/week | Screen recording: "Nio just debugged my segfault by reading the lecture transcript. Here is what that looks like." [15s GIF] |
| **Build-in-public updates** | 1-2x/week | "Shipped SQL execution this week. Here is how sql.js WASM works in the browser. Thread:" |
| **CS education takes** | 1x/week | "7.1 million students have enrolled in CS50. Most of them are still tab-switching between YouTube, VS Code, and ChatGPT. There has to be a better way." |
| **Technical insights** | 1x/week | "TIL: Running C code in the browser via Wasmer WASM in a sandboxed iframe with COOP/COEP headers. Here's how the cross-origin isolation works:" |
| **Engagement / replies** | Daily | Reply to CS50, freeCodeCamp, coding education threads with genuine help. Never spam. |

**Twitter/X growth playbook:**
1. Follow and engage with: CS50 (@cs50), freeCodeCamp (@faborjez, @osaborjez), Fireship (@firaborjez), coding education accounts
2. Quote-tweet interesting CS education discussions with genuine takes
3. Thread technical deep dives (WASM, AI context building) -- threads get 3-5x engagement vs single tweets
4. Pin the hero video (Video 1) to the profile

### 3.3 Reddit Engagement Strategy

Reddit is the single most important social channel for reaching CS students. The approach must be genuine value-first, never promotional spam.

**Target Subreddits (with member counts):**

| Subreddit | Members | Approach |
|-----------|---------|----------|
| r/cs50 | ~200K | Answer student questions. Share CS50-specific tips. Mention Niotebook only when directly relevant. |
| r/learnprogramming | ~4.2M | Share helpful CS learning content. Link to blog posts that teach something useful. |
| r/csMajors | ~424K | Career + learning advice. CS education tool discussions. |
| r/compsci | ~2.3M | Technical content, open courseware discussion, algorithm explainers. |
| r/programming | ~4M+ | Technical deep dives, architecture posts, WASM content. |
| r/webdev | ~2.4M | WASM technical content, Next.js architecture posts, browser-based execution. |
| r/SideProject | ~200K | Founder story, build-in-public updates, solo dev journey. |
| r/cscareerquestions | ~1M+ | Learning resource recommendations, CS education discussions. |

**Reddit rules of engagement:**
1. Be a genuine contributor first. Answer questions without mentioning Niotebook for weeks before any product mention.
2. When mentioning the product, it should be in context: "I built a tool for this" or "I use X for this" -- never "Check out our product!"
3. Follow each subreddit's self-promotion rules exactly. Most allow 10% self-promotion / 90% genuine contribution.
4. The launch posts (Product Hunt, Show HN) can be cross-posted to relevant subreddits with appropriate framing.
5. **Never delete negative feedback.** Respond thoughtfully to criticism. The community will respect honesty.

### 3.4 Social Media Metrics to Track

| Metric | Target (Month 3) | Target (Month 6) | Target (Month 12) |
|--------|-------------------|-------------------|-------------------|
| Twitter/X followers | 500 | 2,000 | 5,000 |
| YouTube subscribers | 200 | 1,000 | 3,000 |
| YouTube total views | 5,000 | 25,000 | 100,000 |
| Reddit karma in target subs | 1,000+ | 5,000+ | 10,000+ |
| Discord members | 100 | 500 | 1,500 |
| Blog monthly visitors (organic) | 1,000 | 5,000 | 15,000 |
| Blog posts published | 12 | 24 | 48 |

---

## 4. YouTube SEO Strategy

YouTube is where CS students already are. CS50 lectures alone have tens of millions of views. Our YouTube strategy targets the long-tail keywords that students search for when they are stuck -- the exact moment they need Niotebook most.

### 4.1 YouTube Channel Setup

- **Channel name:** Niotebook
- **Channel description:** "The workspace where CS lectures come alive. Video + Code + AI in one tab. watch. code. learn."
- **Channel art:** Dark-mode screenshot of the three-pane workspace.
- **Playlists:**
  - "Niotebook Product Demos" (the 5 core videos)
  - "CS50 Study Companion" (topic-specific help videos)
  - "Technical Deep Dives" (WASM, AI architecture, build-in-public)
  - "CS Concept Explainers" (short videos on confusing CS topics)
  - "Open Courseware Reviews" (comparing and reviewing free CS courses)

### 4.2 Long-Tail Keyword Targets

These are the searches CS students make when they are stuck -- the exact moment they need Niotebook most.

| Keyword Cluster | Monthly Volume (est.) | Video Title | Difficulty |
|----------------|----------------------|-------------|-----------|
| cs50 pointers explained | 1K-5K | "CS50 Pointers in C: Watch This Before You Get a Segfault" | Low |
| cs50 pset help | 1K-5K | "How to Approach CS50 Problem Sets (Without Cheating)" | Low |
| how to learn cs50 | 5K-10K | "The Best Way to Study CS50 in 2026" | Medium |
| run c code online | 10K-50K | "Run C Code in Your Browser -- No Terminal, No Setup" | Medium |
| python vs c programming | 5K-10K | "C to Python: What CS50 Students Need to Know" | Medium |
| learn algorithms for beginners | 10K-50K | "Introduction to Algorithms: A CS Student's Survival Guide" | High |
| cs50 ai tutor | 500-1K | "Meet Nio: The AI That Knows What Your CS50 Professor Just Said" | Low |
| online code editor for students | 1K-5K | "The Best Online Code Editor for CS Students in 2026" | Medium |
| cs50 segfault | 1K-5K | "Why Your CS50 Code Segfaults (And How to Fix It)" | Low |
| cs50 week 1 tutorial | 2K-5K | "CS50 Week 1 Complete Guide: C, Hello World, and Your First Bug" | Low |
| mit ocw computer science | 1K-5K | "MIT OCW CS Courses: The Complete Guide for Self-Learners" | Medium |
| free computer science courses 2026 | 5K-10K | "The 5 Best Free CS Courses You Should Take in 2026" | High |

### 4.3 Video SEO Checklist

Every YouTube video must include:

- [ ] Title with primary keyword in first 60 characters
- [ ] Description: 200+ words with primary keyword in first sentence, link to niotebook.com, timestamps
- [ ] Tags: 10-15 relevant tags including course names, language names, "CS tutorial"
- [ ] Custom thumbnail: dark-mode workspace screenshot with large, readable text overlay
- [ ] End screen: subscribe prompt + link to next video + link to niotebook.com
- [ ] Pinned comment: brief product pitch + link + "What topic should I cover next?"
- [ ] Chapters (timestamps) for videos over 3 minutes
- [ ] Closed captions (auto-generated is fine for English; review for accuracy)
- [ ] Cards linking to related videos at relevant moments

### 4.4 YouTube Growth Flywheel

```
Student searches "cs50 pointers help"
  -> Finds our video explaining pointers
    -> Video shows Nio helping debug pointer code in Niotebook
      -> Student clicks link to try Niotebook
        -> Student loves it, tells classmate
          -> Classmate searches, finds more of our videos
            -> Flywheel spins
```

### 4.5 Competitive YouTube Landscape

These channels dominate CS education YouTube. We are not competing with them -- we are creating a complementary category (CS learning tooling).

| Channel | Subscribers | Content Type | Niotebook Angle |
|---------|------------|--------------|-----------------|
| freeCodeCamp | 11.4M | Full-length free courses | Partner opportunity: guest article or featured tool |
| Programming with Mosh | 4.9M | Polished beginner courses | Different format, no overlap |
| Fireship | 4M+ | Quick explainers, "100 seconds" | Could feature Niotebook architecture |
| Bro Code | 3M | Free full courses | Student audience overlap |
| Traversy Media | 2.4M | Web dev tutorials | WASM/technical content overlap |
| Computerphile | 2.41M | Academic CS topics | Same audience, different format |
| CS50 (Harvard) | 1.88M | CS50 lectures | THE content source we wrap |
| Stanford | 1.9M | Stanford lectures | Future content source |

---

## 5. Community Content Strategy

### 5.1 Reddit Engagement Plan

**Goal:** Become a recognized, helpful presence in CS learning subreddits before any launch.

**Phase 1 (Weeks 1-4): Build credibility (ZERO product mentions)**
- Post 3-5 genuinely helpful answers per week in r/cs50, r/learnprogramming, r/csMajors
- Share CS learning tips and resources (not Niotebook -- other resources too)
- Akram's account should feel like a CS education enthusiast, not a marketer
- Target: 500+ total karma from helpful answers

**Phase 2 (Weeks 5-8): Soft product mentions**
- When answering relevant questions ("what tools do you use for CS50?"), naturally mention Niotebook
- Share blog posts that are genuinely useful (not thinly veiled product pitches)
- Cross-post the founder story video to r/SideProject and r/webdev
- Target: 1,500+ total karma, 5+ organic product mentions

**Phase 3 (Week 9+): Launch posts**
- Dedicated launch post in r/cs50: "I built a free study companion for CS50 -- video + code + AI in one tab"
- Cross-post to r/learnprogramming, r/csMajors
- Be present in comments for 24-48 hours answering every question
- Target: 500+ upvotes on launch post, 100+ signups from Reddit

### 5.2 Discord Community Plan

**Goal:** Build a tight-knit early community that provides feedback, finds bugs, and becomes evangelists.

**Server structure:**
- #general -- open discussion
- #show-your-code -- students share what they built
- #nio-feedback -- AI tutor feedback and suggestions
- #feature-requests -- voted feature requests
- #bug-reports -- bug reporting channel
- #cs50-help -- course-specific help
- #changelog -- automated from GitHub/deployment
- #introductions -- new member welcomes

**Growth targets:**
- Month 1: 50 members (from alpha invites)
- Month 3: 200 members (from launch traffic)
- Month 6: 500 members (from organic growth)
- Month 12: 1,500 members

**Community engagement rules:**
- Akram personally responds to every message for the first 3 months
- Weekly "What are you learning?" threads
- Monthly feature vote polls
- Every bug report gets acknowledged within 24 hours

### 5.3 Stack Overflow Engagement

**Goal:** Establish Niotebook/Akram as a recognized contributor in CS education tags.

- Answer questions tagged with: [cs50], [python], [c], [beginner], [learning]
- Never mention Niotebook in answers (Stack Overflow community enforces this strictly)
- Profile bio links to Niotebook -- let curious people find it organically
- Long-term play: build SO reputation that creates credibility when people Google "who built Niotebook"
- Target: 500+ SO reputation by Month 6

### 5.4 Hacker News Engagement

**Goal:** Build a profile as a thoughtful contributor before launching.

- Comment on AI-in-education threads, edtech discussions, WASM posts, solo developer stories
- Share genuinely interesting technical content (blog posts about WASM, AI context building)
- When Show HN launches: have a history of engagement, not a brand new account
- Target: 100+ HN karma before launch

### 5.5 Dev.to and Hashnode

**Goal:** Syndicate technical blog posts to reach additional developer audiences.

- Cross-post technical deep dives (WASM, AI architecture) to dev.to
- Tag appropriately: #webdev, #ai, #education, #wasm
- Engage with comments
- Include canonical URL pointing back to niotebook.com/blog for SEO

---

## 6. Content Calendar Template (Rolling 4-Week)

| Week | Blog Post | Video | Social (Twitter) | Community |
|------|-----------|-------|-------------------|-----------|
| **Week 1** | "Best Way to Study CS50 in 2026" | Record Video 1 (Hero) | 3 build-in-public tweets | Answer 5 Reddit questions |
| **Week 2** | "CS50 Pset 1 Guide" | Publish Video 1, Record Video 2 | 2 demos + 2 CS tips | Answer 5 Reddit questions |
| **Week 3** | "Run C Code in Your Browser" | Publish Video 2, Record Video 3 | 2 demos + 1 thread | Share blog in r/learnprogramming |
| **Week 4** | "Understanding Pointers" | Publish Video 3, Record Video 4 | 2 demos + 2 engagement | Cross-post Video 4 to r/SideProject |

---

## 7. Content Metrics and KPIs

| Metric | Definition | Target (Month 3) | Target (Month 6) | Target (Month 12) |
|--------|-----------|-------------------|-------------------|-------------------|
| **Organic blog traffic** | Monthly unique visitors from search | 1,000 | 5,000 | 15,000 |
| **YouTube views (total)** | Cumulative views across all videos | 5,000 | 25,000 | 100,000 |
| **YouTube subscribers** | Channel subscribers | 200 | 1,000 | 3,000 |
| **Blog-to-signup conversion** | Users who visit blog then sign up | 3% | 5% | 5% |
| **Video-to-signup conversion** | Users who watch then sign up | 2% | 4% | 4% |
| **Reddit referral traffic** | Monthly visitors from Reddit | 500 | 2,000 | 5,000 |
| **Content pieces published** | Blog + video total | 15 | 35 | 70 |
| **Avg time on blog post** | Engagement quality signal | 3 min | 4 min | 4 min |
| **Blog backlinks** | External sites linking to our content | 10 | 50 | 150 |

---

## 8. What We Will NOT Do

1. **We will NOT create generic "learn to code" content.** The internet does not need another Python tutorial. We create content that is specific to the Niotebook experience and the open courseware ecosystem.

2. **We will NOT pay for promoted posts or sponsored content.** If the content is not good enough to spread organically, the content is not good enough yet.

3. **We will NOT create content for non-CS subjects.** Stay in our lane. CS education. Maybe data science adjacent. Nothing else.

4. **We will NOT publish low-quality content to hit a cadence.** One excellent post per week beats three mediocre ones. Quality compounds; volume does not.

5. **We will NOT outsource content creation.** Akram's authentic voice and technical depth are the brand. Ghostwritten content would be obvious and damaging.

6. **We will NOT chase trending topics unrelated to our mission.** No AI hype pieces, no cryptocurrency takes, no "top 10 programming languages" clickbait.

---

*The best content strategy is a great product that people want to talk about. Every piece of content should make someone say "I need to try this" -- not because we told them to, but because they saw something genuinely useful.*

# Organic Growth Playbook

**Date:** 2026-02-09
**Classification:** Strategic / Internal
**Analyst:** Business Intelligence (Claude Agent)
**Related:** `docs/customer-acquisition/cac-modeling.md` (CAC model), `docs/customer-acquisition/user-personas.md` (target personas)

---

## Executive Summary

- **Niotebook's organic growth must generate 5,000-15,000 signups in 6 months to reach survival threshold.** This is achievable through a coordinated campaign across CS student communities (r/cs50: ~200K+ members, r/learnprogramming: 4.3M members, CS50 Discord: 186K+ members, freeCodeCamp forum: 250K+ members) combined with launch events (Product Hunt, Hacker News).
- **The SEO opportunity is significant but slow.** CS-related queries ("CS50 help", "learn programming", "coding tutorial") collectively represent millions of monthly searches. Long-tail keywords ("CS50 problem set help", "CS50 AI tutor") are low-competition and high-intent. SEO will take 3-6 months to ramp but becomes the dominant organic channel by Month 12.
- **Referral program should target a K-factor of 0.2-0.5.** SaaS companies rarely achieve true virality (K>1); realistic targets for a niche edtech product are 0.2-0.5, meaning every 2-5 users brings in 1 additional user. This amplifies all other channels by 20-50%.
- **Growth experiments should follow a rigorous test-measure-decide cadence.** Every experiment gets 2 weeks, a specific hypothesis, a quantified success metric, and a kill/scale decision.

---

## Methodology

### Data Sources
- Reddit community sizes from [GummySearch](https://gummysearch.com/r/learnprogramming/) and direct subreddit observations
- CS50 community data from [CS50 official communities page](https://cs50.harvard.edu/x/communities/)
- freeCodeCamp statistics from [freeCodeCamp news](https://www.freecodecamp.org/news/freecodecamp-2022-usage-statistics/), [Wikipedia](https://en.wikipedia.org/wiki/FreeCodeCamp)
- SEO methodology from [First Page Sage](https://firstpagesage.com/seo-blog/average-saas-conversion-rates/), [SEOmator](https://seomator.com/blog/zero-volume-keywords)
- Viral coefficient benchmarks from [First Round Review](https://review.firstround.com/glossary/k-factor-virality/), [Saxifrage](https://www.saxifrage.xyz/post/k-factor-benchmarks), [MetricHQ](https://www.metrichq.org/marketing/viral-coefficient/)
- Stack Overflow 2025 Developer Survey from [survey.stackoverflow.co](https://survey.stackoverflow.co/2025)
- Influencer marketing benchmarks from [Influencer Marketing Hub](https://influencermarketinghub.com/youtube-influencer-rates/), [Awisee](https://awisee.com/blog/youtube-influencer-cpm/)

---

## 1. CS Student Community Map

### 1.1 Primary Communities (Highest ROI for Niotebook)

| Community | Size | Platform | Relevance | Engagement Quality | Priority |
|-----------|------|----------|-----------|-------------------|----------|
| **r/cs50** | ~200K+ subscribers (est.) | Reddit | DIRECT. Current CS50 students seeking help, study partners, tool recommendations | High -- active Q&A, project sharing, tool discussions | P0 |
| **CS50 Discord** | 186,054 members | Discord | DIRECT. Real-time Q&A, problem set help, study groups | Very high -- real-time, high engagement | P0 |
| **r/learnprogramming** | 4.3M members | Reddit | HIGH. Beginners looking for learning tools and resources | Medium -- broad audience, but high volume | P0 |
| **freeCodeCamp Forum** | 250K+ members | Discourse | HIGH. Learners seeking coding education tools and support | Medium-high -- serious learners, detailed discussions | P1 |
| **CS50 Ed (official Q&A)** | Unknown (Harvard-hosted) | Ed Platform | DIRECT but risky. Official CS50 discussion forum | Very high but risky -- may violate CS50 community norms | P2 (observe only) |
| **r/computerscience** | ~400K+ subscribers (est.) | Reddit | MODERATE. More academic, less tool-oriented | Medium | P1 |
| **r/programming** | ~5M+ subscribers (est.) | Reddit | LOW-MODERATE. Professional developers, not learners | Low for niotebook's audience | P2 |

### 1.2 Secondary Communities (Broader Reach)

| Community | Size | Platform | Relevance | Priority |
|-----------|------|----------|-----------|----------|
| **freeCodeCamp YouTube** | 10M subscribers | YouTube | Comments on CS-related videos | P2 |
| **Stack Overflow** (Python, C, SQL tags) | 18M+ registered users, 82% visit weekly | Q&A | Too far down-funnel; learners go here for specific errors | P3 |
| **r/csMajors** | ~200K+ subscribers (est.) | Reddit | CS students discussing courses, tools, career | P1 |
| **r/OMSCS** | ~50K+ subscribers (est.) | Reddit | Georgia Tech online CS students | P2 |
| **Dev.to** | 1M+ community members | Blog platform | Developers sharing learning experiences | P2 |
| **Hacker News** | ~500K+ unique daily readers (est.) | Forum | Developer tool launches | P1 (launch event) |
| **Product Hunt** | ~15M monthly visitors (est.) | Launch platform | New tool discovery | P1 (launch event) |
| **Indie Hackers** | ~100K+ members (est.) | Forum | Bootstrapper community, tool discovery | P2 |

### 1.3 CS50-Adjacent YouTube Channels (Partnership Targets)

These channels have audiences that overlap significantly with Niotebook's target users. Partnership could mean sponsorship, cross-promotion, or co-created content.

| Channel | Subscribers (est.) | Content Focus | Partnership Potential |
|---------|-------------------|---------------|---------------------|
| **CS50 (official)** | 1M+ | CS50 lectures, shorts, explainers | Extremely high but requires relationship with David Malan |
| **The Coding Train** | 1.8M+ | Creative coding tutorials | Medium -- different audience (creative coders) |
| **Fireship** | 3M+ | Quick tech explainers | Medium-low -- audience is professional devs |
| **Tech With Tim** | 1.3M+ | Python tutorials, beginner-friendly | High -- overlapping audience |
| **Traversy Media** | 2.2M+ | Web dev tutorials, CS fundamentals | Medium -- web dev focus but many beginners |
| **CS Dojo** | 1.9M+ | CS fundamentals, interview prep | High -- CS student audience |
| **Programming with Mosh** | 3.7M+ | Beginner programming courses | High -- strong beginner overlap |
| **Bro Code** | 2.5M+ | Beginner programming tutorials | High -- entry-level audience |

**Estimated cost for micro-influencer partnerships (10K-50K subscriber channels):** $50-$1,200 per video integration ([Influencer Marketing Hub](https://influencermarketinghub.com/youtube-influencer-rates/))

---

## 2. SEO & Content Strategy

### 2.1 Target Keyword Categories

Based on what CS students actually search for ([Stack Overflow 2025 Survey](https://survey.stackoverflow.co/2025), [JetBrains CS Learning Curve](https://blog.jetbrains.com/research/2025/10/computer-science-learning-curve/)):

**Category 1: CS50-Specific (Highest Intent, Lowest Competition)**

| Keyword (Estimated) | Monthly Volume (Est.) | Competition | Intent | Niotebook Fit |
|---------------------|----------------------|-------------|--------|---------------|
| "CS50 help" | 1,000-5,000 | Low | Transactional | Perfect |
| "CS50 problem set" | 5,000-10,000 | Low | Navigational | Perfect |
| "CS50 AI tutor" | 100-500 | Very low | Transactional | Perfect |
| "CS50 study companion" | 50-200 | Very low | Transactional | Perfect |
| "CS50 coding environment" | 100-500 | Very low | Transactional | Perfect |
| "CS50 Mario solution hints" | 500-2,000 | Low | Transactional | High |
| "CS50 pset tips" | 500-1,000 | Low | Transactional | High |

**Category 2: Learn Programming (High Volume, Higher Competition)**

| Keyword (Estimated) | Monthly Volume (Est.) | Competition | Intent | Niotebook Fit |
|---------------------|----------------------|-------------|--------|---------------|
| "learn programming online" | 50,000-100,000 | Very high | Informational | Medium |
| "learn C programming" | 20,000-50,000 | High | Informational | Medium |
| "learn Python free" | 100,000+ | Very high | Informational | Medium |
| "best way to learn coding" | 30,000-80,000 | Very high | Informational | Medium |
| "coding tutorial for beginners" | 50,000+ | Very high | Informational | Low |

**Category 3: AI Learning Tools (Emerging, Low Competition)**

| Keyword (Estimated) | Monthly Volume (Est.) | Competition | Intent | Niotebook Fit |
|---------------------|----------------------|-------------|--------|---------------|
| "AI coding tutor" | 1,000-5,000 | Medium | Transactional | Perfect |
| "AI programming help" | 5,000-10,000 | Medium | Transactional | High |
| "AI study companion coding" | 100-500 | Very low | Transactional | Perfect |
| "learn to code with AI" | 5,000-15,000 | Medium | Informational | High |

**Note:** All volume estimates are approximate. Actual data requires tools like Google Keyword Planner, Ahrefs, or SEMrush. Niotebook should use Google Keyword Planner (free with Google Ads account) to validate these estimates. The keyword landscape in AI-assisted learning is evolving rapidly, and early entries can capture emerging terms before competition rises.

### 2.2 Content Calendar (First 3 Months)

| Week | Article Title | Target Keyword | Type | Word Count |
|------|--------------|----------------|------|-----------|
| 1 | "The Best Way to Study CS50 in 2026" | CS50 help, CS50 study | Pillar | 2,500 |
| 2 | "CS50 Problem Set Tips: Week 1 (Scratch & C)" | CS50 pset tips | Tutorial | 1,500 |
| 3 | "Why an AI Tutor is Better Than ChatGPT for Learning CS" | AI coding tutor | Thought leadership | 2,000 |
| 4 | "CS50 Problem Set Tips: Week 2 (Arrays)" | CS50 Week 2 help | Tutorial | 1,500 |
| 5 | "Watch, Code, Learn: How Niotebook Combines Video and Code" | learn programming online | Product story | 2,000 |
| 6 | "CS50 Problem Set Tips: Week 3 (Algorithms)" | CS50 algorithms help | Tutorial | 1,500 |
| 7 | "5 Free Tools Every CS50 Student Needs in 2026" | CS50 tools | Listicle | 1,500 |
| 8 | "How to Learn C Programming from Scratch (with AI Help)" | learn C programming | Guide | 2,500 |
| 9 | "CS50 Problem Set Tips: Week 4 (Memory)" | CS50 memory, pointers | Tutorial | 1,500 |
| 10 | "From Zero to First Program: Learning Python with CS50P" | learn Python CS50 | Guide | 2,000 |
| 11 | "CS50 Problem Set Tips: Week 5 (Data Structures)" | CS50 data structures | Tutorial | 1,500 |
| 12 | "The Open Courseware Revolution: Learn CS for Free in 2026" | free CS courses online | Thought leadership | 2,500 |

**Expected SEO ramp:** Month 1-2: 50-200 organic visits/month. Month 3-4: 500-1,500/month. Month 6: 2,000-5,000/month. Month 12: 10,000-20,000/month (with consistent publishing).

### 2.3 Technical SEO Requirements

1. **Blog infrastructure:** Add a `/blog` route to the Next.js app (or use a subdomain like blog.niotebook.com). Each post should have proper meta tags, OG images, and structured data.
2. **Sitemap and robots.txt:** Already handled by Next.js defaults, but verify.
3. **Page speed:** Ensure blog pages load in <2 seconds. Do not load Pyodide/WASM on blog pages.
4. **Internal linking:** Every blog post should link to the signup page and to related posts.
5. **Landing pages:** Create dedicated landing pages for key intents: `/cs50`, `/learn-python`, `/ai-tutor`.

---

## 3. Community Seeding Playbook

### 3.1 Principles

1. **Add value first.** Never post "check out my product." Instead, answer a question, share a useful tip, and mention Niotebook as one of several tools that helped.
2. **Be a community member, not a marketer.** Akram should already be active in r/cs50 and CS50 Discord, helping people with problem sets and sharing insights, before ever mentioning Niotebook.
3. **Respond to pain points.** When someone posts "I keep tab-switching between YouTube and VS Code" or "I wish CS50 had a better coding environment," that is the moment to share Niotebook.
4. **Show, do not tell.** Screenshots, GIFs, and short video demos (Loom, screen recordings) are 3-5x more effective than text descriptions.
5. **Track everything.** Use unique UTM parameters for every community post: `?utm_source=reddit&utm_medium=community&utm_campaign=rcs50_feb26`.

### 3.2 Platform-Specific Tactics

#### Reddit (r/cs50, r/learnprogramming)

| Tactic | Format | Frequency | Expected Reach |
|--------|--------|-----------|---------------|
| Answer CS50 help questions with genuine help + subtle tool mention | Comment | 3-5x/week | 100-500 views/comment |
| "Show and Tell" post with demo video/GIF | Post | 1x/month | 2,000-10,000 views |
| "I built a CS50 study companion -- feedback?" | Post | 1x (launch) | 5,000-20,000 views |
| AMA: "Solo founder building an AI learning tool, AMA" | Post | 1x | 3,000-15,000 views |

**Rules:** Reddit self-promotion guidelines require 90% community contribution, 10% self-promotion. Violating this leads to bans and community backlash.

#### CS50 Discord (186K+ members)

| Tactic | Channel | Frequency | Notes |
|--------|---------|-----------|-------|
| Help students with problem sets in #help channels | Various | Daily | Build reputation first |
| Share Niotebook as "a tool I find helpful" in #tools or #resources | #resources | 1x/month | Only after establishing community presence |
| Offer to demo in a voice channel "office hours" | Voice | 1x/month | High engagement, builds trust |

**Risk:** CS50 may have policies against promoting third-party tools, especially AI tutors (CS50 Academic Honesty Policy restricts AI tools). Akram should review CS50's community guidelines before posting and position Niotebook as a study companion, not a homework solver.

#### freeCodeCamp Forum (250K+ members)

| Tactic | Format | Frequency | Notes |
|--------|--------|-----------|-------|
| Contribute answers in #help threads | Reply | 2-3x/week | Build karma |
| Post in #project-feedback with Niotebook as a project | Post | 1x | Frame as "I built this" |
| Write a tutorial post that naturally references Niotebook | Post | 1x/quarter | High-quality, long-form |

### 3.3 Launch Event Playbook

#### Product Hunt Launch

**Preparation (2-4 weeks before):**
1. Create a "Ship" page on Product Hunt to build an audience pre-launch
2. Prepare 5-6 high-quality screenshots/GIFs showing the 3-pane workspace, AI in action, and code execution
3. Write a compelling tagline: "Watch CS lectures, code along, and get AI help -- all in one tab"
4. Recruit 10-20 early users to upvote and leave genuine reviews on launch day
5. Prepare a "maker comment" explaining the story, the problem, and asking for feedback

**Launch Day:**
1. Post at 12:01 AM PST (PH resets daily)
2. Engage with every comment within 1 hour
3. Cross-promote on Twitter/X, Reddit, Discord
4. Have a special offer ready ("first 100 PH users get lifetime free Pro")

**Expected results:** 200-500 upvotes, 3,000-8,000 website visits, 300-800 signups (based on median featured product benchmarks)

#### Hacker News "Show HN"

**Post Title Options:**
- "Show HN: I built an AI tutor that watches CS50 lectures with you while you code"
- "Show HN: Niotebook -- watch, code, learn in one tab (CS50 + AI tutor + code editor)"
- "Show HN: A unified workspace that puts CS50 video, code editor, and AI tutor side by side"

**Post Body Template:**
```
Hi HN, I'm Akram. I built Niotebook because I was tired of tab-switching between
YouTube, VS Code, and ChatGPT while studying CS50.

Niotebook puts the video, code editor, and an AI tutor (Nio) in one browser tab.
The key differentiator: Nio knows what you're watching. It reads the lecture
transcript at the current timestamp, sees your code, sees your errors, and helps
you learn -- without giving away answers (Socratic method).

- 7 in-browser language runtimes (Python, C, JS, SQL, R, HTML/CSS) -- no server
  containers, all WASM
- Covers all CS50 courses (CS50x, CS50P, CS50W, CS50AI, CS50SQL, CS50R)
- Free and open (the content is all open courseware)

Stack: Next.js 16, React 19, Convex, Clerk, Pyodide, Wasmer, Gemini/Groq

Would love feedback on the UX, especially the AI tutoring experience.

[link]
```

**Expected results:** If it reaches the front page -- 6,000-20,000 visits, 600-2,000 signups. If it does not -- 200-500 visits, 20-50 signups.

---

## 4. Referral Program Design

### 4.1 Viral Coefficient Targets

| Metric | Industry Benchmark | Niotebook Target | Source |
|--------|-------------------|-----------------|--------|
| K-factor (viral coefficient) | 0.2 typical B2B SaaS ([Saxifrage](https://www.saxifrage.xyz/post/k-factor-benchmarks)) | 0.3-0.5 | |
| Invites sent per user (i) | 1.5-3.0 | 2.0 | |
| Invite conversion rate (c) | 10-30% for well-designed programs ([Kurve](https://kurve.co.uk/blog/app-referral-marketing-k-factor-viral-retention)) | 15-25% | |
| K = i x c | Varies | 2.0 x 0.20 = **0.40** | |
| Viral cycle time | Days to months | 7-14 days (study cadence) | |

**What K=0.4 means:** For every 10 users, 4 additional users join through referrals. This amplifies all other acquisition channels by 40%. Over 3 viral cycles, 100 initial users become 100 + 40 + 16 + 6 = **162 users** total.

### 4.2 Referral Mechanism Design

**Structure:** Double-sided incentive (both referrer and referee benefit)

| Role | Incentive | Cost to Niotebook |
|------|-----------|-------------------|
| **Referrer** | 1 week of free Pro access per successful referral | ~$0.12 in AI API costs (7 days of Pro-tier AI usage) |
| **Referee** | 1 week of free Pro access upon signup via referral link | ~$0.12 in AI API costs |
| **Total cost per referral** | | **~$0.24** |

**Why product-value incentives beat cash:**
- Cash referral bonuses attract low-quality signups who sign up for the reward, not the product ([First Round Review](https://review.firstround.com/glossary/k-factor-virality/))
- Product-value incentives (free Pro access) attract users who actually want the product
- Dropbox's famously successful referral program used extra storage (product value), not cash
- Cost is miniscule ($0.24 per referral) vs. $5-$50 for cash incentives

**Implementation requirements:**
1. Unique referral link per user (e.g., `niotebook.com/ref/abc123`)
2. Tracking in Convex: who referred whom, when, conversion status
3. Automatic Pro access activation upon successful referral
4. Dashboard showing referral count and earned rewards
5. Share buttons for common platforms (WhatsApp, Discord, Twitter, copy link)

### 4.3 Natural Viral Loops (Product-Driven)

Beyond formal referral programs, Niotebook has natural viral potential:

| Loop | Trigger | Mechanism | K Contribution |
|------|---------|-----------|---------------|
| **Study group sharing** | Student tells classmate about Niotebook | Word of mouth | 0.1-0.2 |
| **"I use Niotebook for CS50" social posts** | Student shares progress/screenshot | Social proof | 0.05-0.1 |
| **Professor recommendation** | TA or professor suggests Niotebook in class | Institutional endorsement | 0.5-2.0 (batch acquisition) |
| **Code snapshot sharing** | Student shares code they wrote in Niotebook | Product embed / backlink | 0.05 |

### 4.4 Referral Program Metrics

| Metric | Definition | Target | Measurement |
|--------|-----------|--------|-------------|
| Referral share rate | % of active users who share referral link | > 10% | Convex events |
| Referral conversion rate | % of clicked referral links that convert to signups | > 20% | UTM + Convex |
| K-factor | Invites sent x conversion rate | > 0.3 | Calculated weekly |
| Viral cycle time | Average days between user signup and their referral's signup | < 14 days | Convex timestamps |
| Referral LTV vs. organic LTV | Revenue from referred users vs. organically acquired | Parity or higher | Stripe cohort analysis |

---

## 5. Growth Experiment Framework

### 5.1 Experiment Design Template

Every growth experiment must follow this structure:

```
EXPERIMENT: [Name]
HYPOTHESIS: If we [action], then [metric] will [change] by [amount]
            because [reasoning].
DURATION: [X weeks]
SAMPLE SIZE: [N users]
SUCCESS METRIC: [Specific KPI with target value]
KILL CRITERIA: [Metric level at which we stop the experiment]
SCALE CRITERIA: [Metric level at which we invest more]
```

### 5.2 Experiment Backlog (Prioritized)

| # | Experiment | Hypothesis | Duration | Success Metric | Kill | Scale |
|---|-----------|-----------|----------|----------------|------|-------|
| 1 | **Remove invite gate** | Removing the invite gate will increase weekly signups from ~0 to 50+ | 2 weeks | > 50 signups/week | N/A (permanent change) | If > 100/week, accelerate community seeding |
| 2 | **Onboarding tutorial** | A guided first-session tutorial (open CS50 video, write hello world, ask Nio) will increase activation from est. 30% to 45% | 2 weeks | Activation rate > 40% | < 25% (onboarding hurts) | > 50% (double down on guided experience) |
| 3 | **r/cs50 Show and Tell post** | A demo post on r/cs50 will generate 500+ signups | 1 week | > 200 signups attributed to r/cs50 | < 50 signups | > 500 signups (repeat monthly) |
| 4 | **Product Hunt launch** | PH launch will generate 300+ signups in 1 week | 1 week | > 200 signups, 5+ paying users in 30 days | < 100 signups | > 500 signups (lever for subsequent launches) |
| 5 | **Referral program V1** | Adding referral links will generate K-factor > 0.2 | 4 weeks | K > 0.15 | K < 0.05 (no one shares) | K > 0.3 (invest in referral UX) |
| 6 | **Blog post: "Best Way to Study CS50"** | SEO-optimized post will generate 100+ organic visits/month within 3 months | 12 weeks | > 50 organic visits/month by week 8 | < 10 visits/month after 8 weeks | > 200/month (publish weekly) |
| 7 | **Email drip for inactive signups** | Re-engagement email 3 days after signup (for users who signed up but never activated) will recover 10% of churned signups | 2 weeks | > 5% reactivation rate | < 2% | > 15% (expand email program) |
| 8 | **Landing page A/B: "CS50 companion" vs generic** | A CS50-specific landing page will convert 30% better than the generic page | 2 weeks | > 20% improvement in visitor-to-signup | < 5% improvement | > 30% (create course-specific landing pages for all courses) |

### 5.3 Experiment Decision Framework

After each experiment:

| Result | Decision | Next Action |
|--------|----------|-------------|
| Metric exceeds Scale criteria | **SCALE**: Increase investment, automate, repeat | Allocate more time/budget; document playbook |
| Metric between Kill and Scale | **ITERATE**: Modify hypothesis, run variant | Change one variable, re-run for 2 more weeks |
| Metric below Kill criteria | **KILL**: Stop immediately, document learnings | Post-mortem: why did it fail? What did we learn? |

### 5.4 Weekly Growth Review Cadence

Every Monday, review:
1. **Active experiments:** Status, interim metrics, any needed adjustments
2. **Completed experiments:** Final results, decision (kill/iterate/scale)
3. **New experiments:** Prioritize next 1-2 experiments from backlog
4. **Key metrics:** WAU, signup rate, activation rate, referral K-factor
5. **Channel performance:** Which community/content piece drove the most signups this week?

---

## 6. Word-of-Mouth Amplification

### 6.1 Triggers for Word-of-Mouth

Based on Jonah Berger's STEPPS framework (Social Currency, Triggers, Emotion, Public, Practical Value, Stories):

| STEPPS Element | Niotebook Application |
|---------------|----------------------|
| **Social Currency** | "I use this cool AI tool that watches lectures with me" -- makes the student feel like an insider |
| **Triggers** | Every time a student opens YouTube for a CS50 lecture, they should think of Niotebook |
| **Emotion** | The "aha moment" when Nio references what the professor just said creates genuine surprise and delight |
| **Public** | Make usage visible: shareable progress badges, "Powered by Niotebook" watermark on shared code snapshots |
| **Practical Value** | Saves time (no tab switching), better grades (focused studying), less frustration (AI helps when stuck) |
| **Stories** | "I was stuck on CS50 Week 4 (pointers) for days. Then I tried Niotebook and Nio walked me through it in 20 minutes by referencing exactly what Malan said at 42:17." |

### 6.2 Moments to Prompt Sharing

Identify and instrument the moments when users are most likely to share:

| Moment | Emotion | Prompt |
|--------|---------|--------|
| First successful code execution after being stuck | Relief + accomplishment | "You solved it! Share your progress with a classmate?" |
| Nio references the exact lecture timestamp | Surprise + delight | "Pretty cool, right? Know someone taking CS50 who would love this?" |
| Completing a lesson | Accomplishment | "Lesson complete! Invite a study partner to learn together." |
| After 5+ AI interactions in one session | Deep engagement | (End-of-session): "You had a great study session. Want to bring a friend next time?" |

---

## 7. Timeline and Milestones

### 7.1 90-Day Organic Growth Plan

| Week | Focus | Actions | Target Signups (Cumulative) |
|------|-------|---------|---------------------------|
| 1-2 | **Foundation** | Remove invite gate. Implement UTM tracking. Set up analytics. Create landing page. | 50-100 |
| 3-4 | **Community Seeding: Round 1** | Post on r/cs50, r/learnprogramming. Join CS50 Discord actively. | 200-500 |
| 5-6 | **Launch: Product Hunt** | Execute PH launch playbook. Cross-promote. | 600-1,500 |
| 7-8 | **Launch: Hacker News** | Execute Show HN playbook. Engage with all comments. | 1,000-3,000 |
| 9-10 | **Content: Blog Launch** | Publish first 3-4 blog posts. Begin SEO ramp. | 1,200-3,500 |
| 11-12 | **Referral + Iterate** | Launch referral program. Run first re-engagement emails. Optimize based on funnel data. | 1,500-5,000 |

### 7.2 6-Month Growth Targets

| Metric | Bear | Base | Bull |
|--------|------|------|------|
| Total signups | 3,000 | 8,000 | 20,000 |
| MAU | 600 | 2,000 | 6,000 |
| Paying users | 24 | 100 | 360 |
| MRR | $192 | $799 | $2,876 |
| Organic traffic (monthly) | 1,000 | 3,000 | 10,000 |
| K-factor (referral) | 0.1 | 0.3 | 0.5 |
| Blog posts published | 6 | 12 | 24 |
| Community posts made | 20 | 50 | 100 |

---

## 8. Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Reddit posts get flagged as spam/self-promotion | Medium | High (banned from key community) | Follow 90/10 rule; add genuine value first; use alternate account with organic history |
| CS50 Discord moderators remove Niotebook mentions | Medium | Medium | Build reputation as helpful community member first; frame as "student project" not "product" |
| HN post fails to reach front page | High (60%+) | Medium | Prepare multiple post attempts with different angles; HN is lottery-like |
| SEO takes longer than expected to ramp | High (common) | Low-medium | SEO is a long-term play; community seeding provides short-term volume |
| Referral K-factor below 0.1 | Medium | Low | Iterate on incentive design; may indicate product is not "shareable" enough yet |
| Community backlash ("another AI tool replacing learning") | Low-Medium | High | Position as study companion, not replacement; emphasize Socratic method and refusal to give answers |

---

## Appendix: Community Post Templates

### Template A: "I Built This" Post (r/cs50 or r/learnprogramming)

```
Title: I built a free study companion for CS50 that puts the video, code editor,
and AI tutor in one tab

Hey everyone! I'm a developer who took CS50 a while back and was frustrated with
the constant tab-switching between YouTube, my IDE, and ChatGPT. So I built
Niotebook -- it puts the CS50 lecture video, a code editor (with C, Python, JS,
SQL, and more), and an AI tutor all in one browser tab.

The cool part: the AI tutor actually knows what's happening in the lecture. It
reads the transcript at whatever timestamp you're at, sees your code, and sees
your errors. It uses the Socratic method -- it won't give you answers, but it'll
guide you through the reasoning.

It's free and I'd love feedback from current CS50 students. What would make this
more useful for you?

[link with UTM: niotebook.com?utm_source=reddit&utm_medium=post&utm_campaign=rcs50_launch]
```

### Template B: Helpful Comment + Subtle Mention

```
[Replying to someone asking for help with CS50 pointers]

Great question! Pointers are one of the trickiest parts of CS50. Here's how I
think about it: [genuine helpful explanation].

One tool I've been using is Niotebook (niotebook.com) -- it lets you watch the
CS50 lecture and code side by side, and the AI tutor knows what part of the
lecture you're on. Might help for this specific topic since Malan explains
pointers really well in the Week 4 lecture starting around 45:00.
```

---

*This playbook should be treated as a living document. Update it monthly based on actual performance data. Kill tactics that do not work. Double down on tactics that exceed targets. The goal is not to execute every tactic perfectly -- it is to find the 2-3 channels that reliably produce signups and invest disproportionately in those.*

# Niotebook Partnership Playbook

**Date:** February 9, 2026
**Author:** CEO Office
**Classification:** Internal -- Business Development
**Status:** Living Document (update as partnerships develop)

---

## Executive Summary

Partnerships are how a solo-founder operation punches above its weight. We cannot hire a sales team. We cannot build relationships at scale. But we can identify the 10-15 partners where a single relationship creates disproportionate value -- and then obsess over making those partnerships work.

Niotebook's partnership strategy targets three categories: (1) open courseware providers whose content we wrap and enhance, (2) CS education creators whose audiences are our exact target users, and (3) university programs that can deploy us directly to students. Each category has different value propositions, different outreach approaches, and different success metrics.

The core principle: **every partnership must create value for the partner first.** We are asking people to trust their reputation and their audience with our product. We earn that trust by making their content more accessible, their students more successful, and their reach more impactful -- at zero cost to them.

---

## 1. Partnership Categories

### 1.1 Category Map

```
                        High Reach, Low Intent
                              |
                    YouTube Creators   Platform Partners
                              |            (YouTube, LMS)
                              |
    Easy to Activate --------+-------- Hard to Activate
                              |
               CS Education   |   Open Courseware Providers
               Communities    |   University CS Departments
                              |
                        Low Reach, High Intent
```

**Reading the map:** Start with the lower-left quadrant (easy to activate, high intent). CS education communities and smaller creators are the quickest wins. Open courseware providers and university departments are the highest-value targets but require more time and credibility to activate.

---

## 2. Open Courseware Providers

### 2.1 Why They Matter

These are the organizations that produce the lecture content we wrap. A partnership with any of them means: (1) legitimacy ("recommended by MIT OCW"), (2) content access and quality guarantees, (3) potential to be built into the official course experience.

### 2.2 Target Partners

| Provider | Content Scale | Our Value Proposition | Risk Level | Priority |
|----------|--------------|----------------------|-----------|----------|
| **Harvard CS50 (David Malan)** | 7.1M enrollees, 10 courses | Best study companion for CS50 students. Socratic AI aligned with academic integrity. | HIGH (academic honesty policy) | P0 |
| **MIT OpenCourseWare** | 2,500+ courses, 300M visits/year | Interactive learning layer for MIT OCW CS courses. Zero cost to MIT. | MEDIUM | P0 |
| **Stanford Engineering Everywhere** | CS106A/B, CS161, CS231n | Browser-based coding environment for Stanford CS lectures. | MEDIUM | P1 |
| **UC Berkeley Webcasts** | CS61A/B/C, Data 100, CS188 | Same as MIT/Stanford -- interactive complement to video lectures. | MEDIUM | P1 |
| **freeCodeCamp** | 11.4M YouTube subscribers, thousands of hours | Complementary tool for freeCodeCamp tutorials. Community alignment on free education. | LOW | P0 |
| **OpenStax (Rice University)** | Textbook replacement courseware | Add interactive coding exercises alongside OpenStax CS textbooks. | LOW | P2 |
| **Carnegie Mellon OLI** | Open Learning Initiative courses | Interactive companion for CMU's structured courseware. | MEDIUM | P2 |
| **edX (2U)** | 40M+ learners | LTI integration for edX CS courses. | HIGH (corporate, complex) | P3 |
| **Coursera** | 130M+ learners | LTI integration for Coursera CS courses. | HIGH (corporate, complex) | P3 |

### 2.3 Value Proposition for Open Courseware Providers

**What we offer them:**

1. **Enhanced engagement:** Students who use Niotebook alongside their lectures code along in real time instead of passively watching. This increases completion rates (the #1 metric OCW providers care about).

2. **Zero cost:** Client-side execution means no server infrastructure for the provider. No hosting burden. No API costs passed along.

3. **Academic integrity alignment:** Nio uses Socratic questioning and explicitly refuses to provide complete solutions to graded work. This is not ChatGPT with a wrapper -- it is a pedagogically designed teaching assistant. The system prompt (`nioPrompt.ts`) enforces this at the AI level.

4. **Course-specific customization:** We build Course Packs with environment presets tailored to their exact toolchain. CS50 students get `cs50.h` support, the correct compiler flags, and starter files. MIT 6.0001 students would get Python 3 with specific library versions.

5. **Brand enhancement:** Their lectures, better tooling. We never create competing content. We amplify what they have already built.

**What we ask from them:**

1. **Permission:** Explicit blessing to wrap their content (most is already Creative Commons, but official endorsement matters).
2. **Recommendation:** A link on their course page, a mention in their syllabus, or a listing in their "recommended tools" section.
3. **Feedback:** Access to a professor or TA who can provide pedagogical feedback on our AI's behavior.

### 2.4 Outreach Templates

#### Template: Open Courseware Provider (Academic)

**Subject:** Free interactive companion for [Course Name] -- zero cost, zero infrastructure

```
Dear [Name],

I am the developer of Niotebook, a free browser-based workspace that combines
video lectures with a live code editor and a context-aware AI teaching
assistant.

We have built [Course Name] support into Niotebook with environment presets
tailored to your course toolchain. Students can watch your lectures and code
alongside them in the same browser tab, with an AI tutor that reads the lecture
transcript and provides Socratic guidance.

Key technical details:
- 7 in-browser language runtimes (C, Python, JS, HTML/CSS, SQL, R) via WASM
- All execution is client-side -- zero server infrastructure required
- The AI explicitly refuses to provide complete solutions to graded assignments
- Environment presets include [specific details: cs50.h, compiler flags, etc.]

Our goal is to make your excellent course content even more accessible by giving
students a structured, active learning environment instead of the typical
YouTube + VS Code + ChatGPT tab-switching workflow.

This is completely free -- for you and for students. We do not charge for the
tool, and there is no cost for the infrastructure.

Would you be open to a 15-minute demo? I would love to show you how it works
with your course content specifically.

Best regards,
Akram
niotebook.com
```

#### Template: Content Creator (YouTube)

**Subject:** Built a free tool for your students -- would love your feedback

```
Hi [Name],

I am Akram, a solo developer who built Niotebook -- a browser-based workspace
where your students can watch your [course/tutorial] videos alongside a live
code editor and an AI tutor that knows the lecture context.

I have been a fan of your [specific video/series] -- [genuine specific comment
about what you liked and learned].

The AI reads your video's transcript at the current timestamp, so when a student
asks "what did you mean by [concept]?", it gives context-grounded answers, not
generic ChatGPT responses.

I am not looking for a sponsorship. I am genuinely asking: would you try it and
let me know if it would help your students? If you think it is useful, a mention
would mean the world. If not, your honest feedback would be just as valuable.

[Direct link to their content in Niotebook, or niotebook.com]

Best,
Akram
```

#### Template: University CS Department

**Subject:** Free CS learning companion for your students -- no IT infrastructure needed

```
Dear Professor [Name] / Dear [Department Name],

I am the developer of Niotebook, a free browser-based tool that helps CS
students learn more effectively from video lectures by combining the lecture
video, a multi-language code editor, and a context-aware AI teaching assistant
in one browser tab.

Our AI teaching assistant (Nio) is specifically designed to support learning
rather than shortcut it:
- Uses Socratic questioning to guide students to answers
- Refuses to provide complete solutions to problem-set-style tasks
- References specific moments in the lecture transcript
- Runs entirely in the browser with zero server infrastructure

We currently support CS50 course variants with course-specific environment
presets, and we are expanding to other major CS courses including MIT OCW
and Stanford Engineering Everywhere.

If you are interested, I would be happy to create a custom Course Pack
specifically configured for your [course name] -- mapping your video lectures,
setting up the right language environments, and configuring starter files.

No cost. No infrastructure burden on your IT team. No student data beyond
standard analytics.

Would a 15-minute demo be useful?

Best regards,
Akram
niotebook.com
```

---

## 3. CS Education Creator Partnerships

### 3.1 Partnership Tiers

| Tier | Creator Size | Approach | Expected Value | Time Investment |
|------|-------------|----------|---------------|-----------------|
| **Tier 1** | 1M+ subscribers | Personal email/DM, offer early access + custom demo link | 1,000-10,000 signups if featured | 2-3 hours per outreach |
| **Tier 2** | 100K-1M subscribers | Email, offer guest article/collaboration | 200-2,000 signups if featured | 1-2 hours per outreach |
| **Tier 3** | 10K-100K subscribers | Social engagement, offer cross-promotion | 50-500 signups if featured | 30 min per outreach |

### 3.2 What We Offer Creators

1. **Enhanced learning experience for their audience:** Their students get a better coding environment alongside their videos. This makes the creator's content more valuable.

2. **Co-branded Course Pack:** We create a Course Pack specifically for their course/tutorial series, featuring their branding and course structure within Niotebook.

3. **Usage data:** Anonymized data about how students interact with their content in Niotebook (time spent, most-paused moments, common errors). This helps creators improve their teaching.

4. **Cross-promotion:** We feature their content in our course catalog, driving our users to their videos.

5. **Guest content opportunities:** They can write for our blog or appear in our videos, reaching our audience.

### 3.3 What We Ask From Creators

1. **Try the product honestly.** No obligation to mention it.
2. **If they like it:** A mention in a video description, a dedicated review video, or a social media post.
3. **If they do not:** Honest feedback on what would make it worth mentioning.
4. **Never:** We never ask for paid promotions. The mention must be genuine.

### 3.4 Creator Outreach Sequence

| Day | Action |
|-----|--------|
| Day 1 | Follow on Twitter/X. Engage genuinely with their recent content (reply, quote-tweet). |
| Day 3-5 | Like and comment on 2-3 of their YouTube videos with thoughtful, non-promotional comments. |
| Day 7 | Send initial outreach email/DM (use template above). Include a personalized demo link. |
| Day 14 | If no response: one gentle follow-up. "Wanted to make sure this didn't get lost..." |
| Day 21+ | If still no response: move on. Try again in 3 months with a product update hook. |
| If they respond positively | Send product access + personalized tour GIF + offer to create a custom Course Pack for their content. |

### 3.5 Partnership Success Metrics

| Metric | Per Partnership |
|--------|----------------|
| Creator tries the product | Minimum success |
| Creator gives private feedback | Good |
| Creator mentions in video description | Great |
| Creator creates dedicated content | Exceptional |
| Creator's audience signups (tracked via UTM) | The real KPI |

---

## 4. University Program Partnerships

### 4.1 Partnership Models

| Model | Description | Value to University | Effort Level | Timeline |
|-------|-------------|--------------------|--------------|----|
| **Informal recommendation** | Professor mentions Niotebook as a study resource | LOW -- just a mention | LOW | 1-2 months |
| **Syllabus listing** | Niotebook listed as a recommended tool in the official syllabus | MEDIUM -- reaches all students | MEDIUM | 1 semester |
| **Custom Course Pack** | We build a tailored configuration for their specific course | HIGH -- matched toolchain | HIGH | 2-3 months |
| **TA training integration** | TAs are trained to use and recommend Niotebook during office hours | VERY HIGH -- multiplied reach | VERY HIGH | 1 semester |
| **LMS integration** | Niotebook embedded within Canvas/Moodle as an LTI tool | MAXIMUM -- mandatory tool | MAXIMUM | 6-12 months |

### 4.2 Pilot Program Structure

For any university partner willing to pilot:

**Phase 1: Setup (2 weeks)**
- Create custom Course Pack matching their syllabus
- Configure environment presets for their specific toolchain
- Add their video content (if available on YouTube/public platforms)
- Set up analytics to track usage

**Phase 2: Soft launch (4 weeks)**
- Professor mentions Niotebook to students as optional
- Collect usage data and student feedback
- Weekly check-in with professor/TA contact

**Phase 3: Evaluation (2 weeks)**
- Compile usage report: how many students used it, which features, engagement patterns
- Student satisfaction survey (5 questions, Google Form)
- Meeting with professor to discuss results

**Phase 4: Scale decision**
- If positive: expand to official recommendation, additional courses, LMS integration discussion
- If mixed: iterate based on feedback, try again next semester
- If negative: thank them, learn, improve

### 4.3 What Universities Care About

Understanding what motivates university decision-makers is critical:

| Decision Maker | Primary Concern | How We Address It |
|----------------|----------------|-------------------|
| **Professor** | Student learning outcomes, reduced office hours burden | Nio handles first-line debugging help. Socratic approach supports learning. |
| **TA** | Fewer repetitive questions, better-prepared students | Students arrive to office hours having already worked through the problem with Nio. |
| **Department Chair** | Reputation, student satisfaction, cost | Free tool, no infrastructure. Looks innovative without risk. |
| **IT / EdTech** | Security, data privacy, infrastructure burden | Client-side execution = zero server requirements. No PII collection. |
| **Students** | "Does this actually help me learn?" | The product answers this question in 5 minutes of use. |

---

## 5. Co-Marketing Opportunities

### 5.1 Joint Content

| Opportunity | Partner Type | What We Create Together | Distribution |
|------------|-------------|------------------------|--------------|
| **Guest blog post** | Open courseware provider | "How [Provider] Students Are Learning with Niotebook" | Both blogs, social |
| **Joint video** | YouTube creator | Creator reviews/demos Niotebook with their course content | Creator's channel + ours |
| **Case study** | University | "How [University]'s CS101 Improved Engagement with Niotebook" | Both websites, press |
| **Webinar** | Open courseware provider | "Active Learning in Open Courseware: Tools and Techniques" | Both email lists |
| **Conference co-presentation** | University professor | "AI-Assisted Learning in Intro CS: A Pilot Study" | SIGCSE, ITiCSE |

### 5.2 Cross-Promotion Mechanics

**For YouTube creators:**
- Their video links to Niotebook with UTM tracking: `niotebook.com?utm_source=youtube&utm_campaign=[creator-name]`
- We feature their courses in our catalog with their branding
- We mention them in our YouTube videos and blog posts

**For universities:**
- Their course page links to Niotebook with a custom landing page: `niotebook.com/[university-course]`
- We create a branded Course Pack with their university's course structure
- We provide anonymized usage reports they can use in grant proposals and teaching evaluations

**For open courseware providers:**
- Their course listing on Niotebook links back to their official course page
- We never host their content -- we link to their YouTube/edX/official platform
- We credit them prominently in all marketing materials

### 5.3 Co-Marketing Calendar

| Quarter | Activity | Partner Type | Goal |
|---------|----------|-------------|------|
| Q1 2026 | Launch with CS50 focus | Harvard CS50 (aspirational) | Validation |
| Q1 2026 | freeCodeCamp guest article | freeCodeCamp | Awareness in open education community |
| Q2 2026 | Creator outreach wave 1 | Tier 1 YouTubers (5-10) | 2-3 authentic mentions |
| Q2 2026 | University pilot launch | 2-3 universities | Real-world validation |
| Q3 2026 | Case study publication | University pilot partner | Credibility for more partnerships |
| Q3 2026 | SIGCSE paper submission | University professor partner | Academic credibility |
| Q4 2026 | Creator outreach wave 2 | Tier 2 YouTubers (10-15) | Sustained awareness |
| Q4 2026 | LMS integration pilot | Canvas or Moodle | Platform distribution |

---

## 6. Partnership Red Lines

These are non-negotiable principles for all partnerships:

1. **We never pay for mentions or endorsements.** If the product is not good enough to earn a recommendation, we fix the product.

2. **We never share student data with partners** beyond what students have explicitly consented to. Privacy is not a feature -- it is a foundation.

3. **We never claim a partnership that does not exist.** "Used by students at Harvard" is only acceptable if Harvard students actually use it voluntarily. "Partnered with Harvard" requires an explicit agreement.

4. **We never create competing content.** We curate and enhance existing content. We do not produce our own CS lectures, tutorials, or courses. Partners' content is sacred.

5. **We never lock content behind a paywall that the original creator made free.** If a lecture is free on YouTube, it is free in Niotebook. Always.

6. **We always link back to the original content source.** Credit and traffic flow back to the content creator. We are additive, never extractive.

7. **We terminate partnerships that require compromising pedagogical integrity.** If a partner wants us to give students direct answers or bypass learning, we decline.

---

## 7. Partnership Pipeline Tracker

### 7.1 Pipeline Template

| Partner | Category | Stage | Last Contact | Next Action | Owner | Priority |
|---------|----------|-------|-------------|-------------|-------|----------|
| | | Identified / Researched / Outreach Sent / In Discussion / Piloting / Active / Declined | | | | P0/P1/P2 |

### 7.2 Pipeline Stages

1. **Identified:** We know who they are and why they matter.
2. **Researched:** We understand their content, audience, pain points, and decision-making process.
3. **Outreach Sent:** Initial email/DM sent.
4. **In Discussion:** They responded and we are in active conversation.
5. **Piloting:** They are trying the product or running a student pilot.
6. **Active:** Partnership is live and generating value.
7. **Declined:** They said no. Revisit in 3-6 months with product updates.

---

*The best partnerships feel like inevitabilities -- two entities that obviously should be working together, finally doing so. Niotebook wraps the best free CS lectures in the world. The creators of those lectures deserve better tooling for their students. That is the pitch. That is the partnership. That is the inevitability we are building toward.*

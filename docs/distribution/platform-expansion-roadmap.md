# Niotebook Platform Expansion Roadmap

**Date:** February 9, 2026
**Author:** CEO Office
**Classification:** Internal -- Product Strategy
**Status:** Living Document (update quarterly)

---

## Executive Summary

Niotebook currently supports Harvard's CS50 course family: CS50x, CS50P, CS50W, CS50AI, CS50SQL, and CS50R -- six course variants with nine environment presets. This gives us access to a pool of 7.1 million enrolled students. That is a strong beachhead, but it is also a single point of failure.

This document charts the expansion from CS50-only to a multi-university, multi-course platform that covers the most popular free CS courses in the world. The strategy is deliberate: expand to courses that (1) have the largest free online audiences, (2) use programming languages we already support (C, Python, JS, HTML/CSS, SQL, R), (3) have video lectures on YouTube or a public platform, and (4) do not require new runtime capabilities we cannot build quickly.

By the end of 2026, Niotebook should support 15-20 courses across 5+ universities, covering an addressable audience of 20+ million cumulative online enrollments.

The constraint is clear: one developer, limited time. Every course we add must be worth the effort. The ranking below reflects brutal prioritization.

---

## 1. Current State: CS50 Ecosystem

### 1.1 Supported Courses

| Course | Preset ID | Primary Language | Enrollment (est.) | Status |
|--------|-----------|-----------------|-------------------|--------|
| CS50x (Intro to CS) | cs50x-c, cs50x-python | C, Python | 7.1M cumulative | LIVE |
| CS50P (Python) | cs50p-python | Python | 1M+ cumulative | LIVE |
| CS50W (Web Programming) | cs50w-js, cs50w-html | JS, HTML/CSS | 500K+ cumulative | LIVE |
| CS50AI (AI with Python) | cs50ai-python | Python | 500K+ cumulative | LIVE |
| CS50SQL (Databases) | cs50sql-sql | SQL | 300K+ cumulative | LIVE |
| CS50R (R) | cs50r | R | 100K+ cumulative | LIVE |

**Total addressable with current content:** ~9.5M cumulative enrollments

### 1.2 Current Technical Capabilities

| Capability | Status | Notes |
|-----------|--------|-------|
| C execution (Wasmer WASM) | LIVE | Sandboxed iframe with COOP/COEP headers |
| Python execution (Pyodide) | LIVE | NumPy, CS50 library, standard library |
| JavaScript execution | LIVE | `new Function()` executor |
| HTML/CSS rendering | LIVE | Iframe preview |
| SQL execution (sql.js) | LIVE | SQLite in browser |
| R execution (webR) | LIVE | Basic R environment |
| YouTube video integration | LIVE | Embedded player with transcript sync |
| Transcript extraction | LIVE | 3-layer fallback: Convex DB -> SRT -> YouTube API |
| Environment presets | LIVE | 9 presets for CS50 variants |
| Virtual filesystem | LIVE | In-memory tree + IndexedDB persistence |

---

## 2. Course Expansion Roadmap

### 2.1 Expansion Criteria

Each potential course is evaluated on five dimensions:

| Criterion | Weight | Rationale |
|-----------|--------|-----------|
| **Online enrollment** | 30% | Larger audience = more potential users per hour of effort |
| **Language support** | 25% | Do we already support the required languages? |
| **Video availability** | 20% | Are lecture videos freely available on YouTube/public platform? |
| **Content license** | 15% | Is the content CC-licensed or otherwise permissive? |
| **Cultural cachet** | 10% | Does association with this course boost our credibility? |

### 2.2 Course Expansion Priority Ranking

#### Tier 1: Immediate Expansion (Q1-Q2 2026) -- Highest Impact, Lowest Effort

These courses use languages we already support, have massive online audiences, and have videos freely available on YouTube.

| Priority | Course | University | Primary Language | Est. Online Enrollment | Video Source | Effort to Add |
|----------|--------|-----------|-----------------|----------------------|-------------|---------------|
| **E1** | **MIT 6.0001 / 6.100A: Intro to CS and Programming Using Python** | MIT | Python | 2M+ (edX) | MIT OCW YouTube | 1 week |
| **E2** | **MIT 6.006: Introduction to Algorithms** | MIT | Python | 1M+ (OCW views) | MIT OCW YouTube | 1 week |
| **E3** | **Stanford CS106A: Programming Methodology (Python)** | Stanford | Python | 500K+ (views) | Stanford YouTube | 1 week |
| **E4** | **Stanford CS106B: Programming Abstractions (C++)** | Stanford | C++ (needs C++ support or C fallback) | 500K+ (views) | Stanford YouTube | 2 weeks (if C++ needed) |
| **E5** | **UC Berkeley CS61A: Structure and Interpretation of Programs** | Berkeley | Python | 500K+ (public webcasts) | YouTube / Berkeley Webcasts | 1 week |

**Rationale for Tier 1:** All five courses are landmark intro CS courses with massive audiences. E1-E3 and E5 use Python (already supported). E4 uses C++ which may require additional runtime support, but C could serve as a partial fallback for many exercises.

**Combined Tier 1 addressable audience: ~4.5M+ cumulative enrollments**

**Effort for all 5 courses: ~6 weeks of dedicated work**

What "adding a course" means:
1. Create Convex records for the course, lessons, and video IDs
2. Build transcript database (auto-extract from YouTube)
3. Define environment preset(s) with starter files, language config, and compiler flags
4. Build course-specific library support (e.g., MIT's `pytutor` library if applicable)
5. Test the end-to-end flow: video -> code -> Nio context
6. Write course page content for the catalog

#### Tier 2: Short-Term Expansion (Q2-Q3 2026) -- Strong Impact, Moderate Effort

| Priority | Course | University | Primary Language | Est. Online Enrollment | Effort |
|----------|--------|-----------|-----------------|----------------------|--------|
| **E6** | **MIT 6.046J: Design and Analysis of Algorithms** | MIT | Python / Pseudocode | 500K+ | 1 week |
| **E7** | **UC Berkeley CS61B: Data Structures** | Berkeley | Java | 300K+ | 2-3 weeks (needs Java runtime) |
| **E8** | **Stanford CS161: Design and Analysis of Algorithms** | Stanford | Python | 300K+ | 1 week |
| **E9** | **MIT 6.042J: Mathematics for Computer Science** | MIT | N/A (math-focused) | 500K+ | 1 week (sandbox mode, no runtime needed) |
| **E10** | **University of Helsinki MOOC.fi: Java Programming** | Helsinki | Java | 200K+ | 2-3 weeks (needs Java runtime) |

**Tier 2 trade-off:** E7 and E10 require a Java runtime. Adding Java via browser WASM (e.g., TeaVM or CheerpJ) is a significant engineering investment. If Java is too costly, these courses slide to Tier 3 or get cut.

**Combined Tier 2 addressable audience: ~1.8M+ cumulative enrollments**

#### Tier 3: Medium-Term Expansion (Q3-Q4 2026) -- Strategic Expansion

| Priority | Course | University | Primary Language | Est. Online Enrollment | Notes |
|----------|--------|-----------|-----------------|----------------------|-------|
| **E11** | **freeCodeCamp Web Development Curriculum** | freeCodeCamp | JS, HTML/CSS | 11.4M (YouTube subs) | Requires mapping to video-based lessons from freeCodeCamp YouTube |
| **E12** | **Stanford CS231n: Deep Learning for Computer Vision** | Stanford | Python (+ PyTorch) | 300K+ | Needs heavy Python library support (NumPy, PyTorch via Pyodide) |
| **E13** | **MIT 18.06: Linear Algebra** | MIT | Python (NumPy) / MATLAB | 1M+ | Math-heavy, Python via NumPy works for most exercises |
| **E14** | **Georgia Tech CS1301: Intro to Computing (Python)** | Georgia Tech | Python | 500K+ (edX) | Large OMSCS pipeline audience |
| **E15** | **Michigan EECS183 / SI 106: Intro to CS** | Michigan | Python | 300K+ | Coursera presence |

**Combined Tier 3 addressable audience: ~13M+ cumulative enrollments (freeCodeCamp dominates)**

#### Tier 4: Long-Term / Opportunistic (2027+)

| Course | University | Why Wait |
|--------|-----------|----------|
| Princeton COS 126 | Princeton | Smaller audience, less video availability |
| CMU 15-112: Fundamentals of Programming | CMU | Proprietary content, less OCW presence |
| Oxford CS courses | Oxford | Adopted CS50, could partner directly |
| Caltech CS 1/2 | Caltech | Smaller enrollment |
| Any non-English CS course | Various | Internationalization required first |

### 2.3 Expansion Decision Flowchart

```
Is the course CS, data science, or directly adjacent?
  NO  -> Do not add. Stay in lane.
  YES ->
    Are video lectures freely available on YouTube or a public platform?
      NO  -> Do not add (for now). Wait for permission or alternative.
      YES ->
        Does the course use languages we already support?
          YES -> Tier 1 or 2. Add it.
          NO  ->
            Is the language widely demanded? (Java, C++, Go, Rust)
              YES -> Evaluate runtime engineering cost. If < 3 weeks, add runtime + course.
              NO  -> Skip.
```

---

## 3. Runtime Expansion Requirements

### 3.1 Current Runtime Support

| Language | Runtime | Status | Notes |
|---------|---------|--------|-------|
| C | Wasmer WASM | LIVE | Sandboxed iframe, COOP/COEP |
| Python | Pyodide WASM | LIVE | NumPy, CS50 library |
| JavaScript | `new Function()` | LIVE | No Node.js APIs |
| HTML/CSS | Iframe preview | LIVE | Live rendering |
| SQL | sql.js WASM | LIVE | SQLite dialect |
| R | webR WASM | LIVE | Basic statistical computing |

### 3.2 Runtimes Needed for Expansion

| Language | Needed For | WASM Runtime Options | Effort Estimate | Priority |
|---------|-----------|---------------------|-----------------|----------|
| **C++** | Stanford CS106B, many DS/Algorithms courses | Emscripten, Wasmer (C++ toolchain) | 2-3 weeks | P1 |
| **Java** | Berkeley CS61B, Helsinki MOOC.fi, many university courses | CheerpJ, TeaVM, or JWebAssembly | 3-4 weeks | P2 |
| **Go** | Some systems courses | TinyGo WASM target | 1-2 weeks | P3 |
| **Rust** | Growing in systems education | rustc WASM target (already excellent) | 1-2 weeks | P3 |
| **MATLAB/Octave** | MIT 18.06, many engineering courses | GNU Octave WASM (experimental) | 3-4 weeks | P3 |

**C++ is the highest-priority new runtime.** It unlocks Stanford CS106B and many algorithms courses that use C++. The effort is moderate because Wasmer/Emscripten already have C++ toolchain support.

**Java is the second priority** but the highest effort. It unlocks Berkeley CS61B (a very popular course) and many university intro CS courses that use Java. CheerpJ is the most mature option for running Java in the browser.

### 3.3 Runtime Expansion Timeline

| Quarter | New Runtimes | Courses Unlocked |
|---------|-------------|-----------------|
| Q2 2026 | C++ (via Emscripten/Wasmer) | Stanford CS106B, various DS/Algo courses |
| Q3 2026 | Java (via CheerpJ, experimental) | Berkeley CS61B, Helsinki MOOC.fi, many university courses |
| Q4 2026+ | Evaluate Go, Rust based on demand | Systems programming courses |

---

## 4. Platform Reach Targets by Quarter

### 4.1 Quarterly Milestones

| Quarter | Courses Supported | Universities | Languages | Addressable Audience | Active Users Target |
|---------|------------------|-------------|-----------|---------------------|-------------------|
| **Q1 2026 (Now)** | 6 (CS50 family) | 1 (Harvard) | 7 (C, Python, JS, HTML, CSS, SQL, R) | 9.5M | 500 (alpha) |
| **Q2 2026** | 11 (+ MIT, Stanford, Berkeley) | 4 | 7 (+C++ possible) | 14M | 2,000 |
| **Q3 2026** | 16 (+ Tier 2 courses) | 5 | 8 (+C++, Java WIP) | 16M | 5,000 |
| **Q4 2026** | 20 (+ freeCodeCamp, Tier 3) | 6+ | 8-9 | 25M+ | 10,000 |
| **Q1 2027** | 25+ | 8+ | 9-10 | 30M+ | 20,000 |

### 4.2 Key Milestones

| Milestone | Target Date | Significance |
|-----------|-------------|--------------|
| **First non-CS50 course live** | End of Q1 2026 | Proves we are not a "CS50-only" tool |
| **3 universities represented** | Mid Q2 2026 | Multi-university credibility |
| **10 courses live** | End of Q2 2026 | Real course catalog, not a demo |
| **C++ runtime live** | Q2 2026 | Unlocks Stanford and algorithms courses |
| **Java runtime experimental** | Q3 2026 | Unlocks Berkeley and many university courses |
| **20 courses live** | End of Q4 2026 | Meaningful course catalog for "any CS student" pitch |
| **First university partnership** | Q2 2026 | Institutional validation |
| **Course Pack Spec published** | Q3 2026 | Community can contribute courses |

---

## 5. International Expansion Considerations

### 5.1 Current State: English-Only

All current content is in English. The product UI is in English. The AI (Nio) responds in English. This is the right starting point because:
- CS50 is taught in English
- MIT OCW, Stanford, Berkeley lectures are in English
- English is the lingua franca of CS education worldwide
- Many international students take these courses in English

### 5.2 International Demand Signals

| Region | CS Education Landscape | Demand Signal | Priority |
|--------|----------------------|---------------|----------|
| **India** | Massive CS student population, heavy YouTube usage, price-sensitive | 500M+ internet users, CS is the #1 degree choice, free tools win | HIGH |
| **Latin America** | Growing CS education, Portuguese/Spanish needed | freeCodeCamp has large Spanish-speaking community | MEDIUM |
| **Europe** | Strong university systems, multilingual | Helsinki MOOC.fi (English), TU Delft OCW | MEDIUM |
| **Africa** | Rapidly growing tech ecosystem, mobile-first | ALX Africa, Andela pipeline | LOW (mobile optimization needed first) |
| **Southeast Asia** | Growing tech hubs (Vietnam, Philippines, Indonesia) | English proficiency varies; subtitles help | LOW |

### 5.3 Internationalization Roadmap

**Phase 1 (2026): English content, international accessibility**
- Ensure the product works well on international internet connections (CDN, asset optimization)
- Support YouTube auto-generated subtitle extraction in any language
- Nio can already respond in multiple languages (Gemini supports 100+ languages)
- No UI translation yet -- English only
- Focus: India (largest English-speaking CS student market outside US/UK)

**Phase 2 (2027): Community-contributed translations**
- Course Pack Spec allows community members to contribute courses in any language
- UI translation via i18n framework (react-intl or similar)
- Priority languages: Spanish, Portuguese, Hindi, Mandarin (by CS student population)
- Partner with international CS education organizations (e.g., CS50 is offered at Oxford, Yale)

**Phase 3 (2028+): Localized content partnerships**
- Partner with non-English open courseware providers
- Japan: University of Tokyo OCW
- India: NPTEL (National Programme on Technology Enhanced Learning, 150M+ enrollments)
- China: Tsinghua, Peking University open courses (complex due to platform restrictions)
- Brazil: USP, Unicamp open courses

### 5.4 International Expansion Principles

1. **English first, always.** Do not dilute focus on the English-speaking market until we have 10,000+ active users.
2. **Community-driven translation.** We do not translate. Our community does. We provide the framework.
3. **Course Pack Spec is the key.** An open specification for course configurations means anyone in the world can add courses in their language.
4. **India is the first international market.** Largest English-speaking CS student population, price-sensitive (free product wins), heavy YouTube usage for CS education.
5. **Mobile optimization before international expansion.** Many international students access content primarily on mobile. The current desktop-first workspace needs responsive design improvements before international push.

---

## 6. Competitive Moat Through Expansion

### 6.1 Why Breadth Matters

Every course we add creates a new surface area for discovery. A student searching for "MIT 6.0001 study tool" or "Stanford CS106A coding environment" finds us instead of building another tab-switching workflow. Each course is a keyword, a community, a professor, a TA, and thousands of students who might discover Niotebook.

### 6.2 Network Effects

```
More courses -> More students -> More community content -> More Course Packs
  -> More courses -> ... (flywheel)
```

The Course Pack Spec is the critical enabler. Once we publish an open specification, community members can contribute courses we never would have prioritized. A student in Brazil adds USP's intro CS course. A professor in India adds NPTEL's data structures course. Each addition makes the platform more valuable for everyone.

### 6.3 Defensibility Timeline

| Timeframe | Defensibility Source |
|-----------|---------------------|
| **Months 1-6** | Specificity (CS50 deep integration no one else has) |
| **Months 6-12** | Breadth (15-20 courses, multi-university) |
| **Months 12-18** | Community (Course Pack contributions, user-generated config) |
| **Months 18-24** | Protocol (Open Learning Runtime standard, embeddable widget) |
| **Months 24+** | Network effects (community + content + users = switching cost) |

---

## 7. What We Will NOT Expand Into

1. **Non-CS courses.** No business courses, no humanities, no general education. CS education is our entire identity. Data science and statistics are the only adjacent territories.

2. **Courses without video lectures.** Niotebook's core experience is video + code + AI. Text-only courses or courses without public video content do not fit our model.

3. **Paid/proprietary courses.** We wrap free, open courseware. We do not wrap Coursera paid courses, Udemy courses, or bootcamp content. Free content, free tools. That is the principle.

4. **Courses requiring hardware access.** Robotics courses, IoT courses, or anything that needs physical devices. Browser-only execution is a feature, not a limitation.

5. **Graduate-level research courses.** Our target is beginner-to-intermediate CS students. Advanced research seminars with no coding component are out of scope.

---

## 8. Expansion Effort Estimation

### 8.1 Per-Course Setup Effort

| Task | Effort (first course in a series) | Effort (subsequent courses, same university) |
|------|----------------------------------|---------------------------------------------|
| Research course structure (videos, syllabus, tools) | 4 hours | 2 hours |
| Create Convex records (course, lessons, video IDs) | 4 hours | 3 hours |
| Extract/import transcripts | 2 hours | 1 hour |
| Define environment preset | 4 hours | 1 hour (reuse base) |
| Create starter files | 2 hours | 1 hour |
| Build course-specific library support | 4-8 hours | 0-4 hours |
| Test end-to-end flow | 4 hours | 2 hours |
| Write catalog page content | 2 hours | 1 hour |
| **Total** | **26-30 hours (~1 week)** | **11-15 hours (~2-3 days)** |

### 8.2 Total Expansion Effort (2026)

| Phase | Courses | Estimated Effort | Timeline |
|-------|---------|-----------------|----------|
| Tier 1 (5 courses) | MIT 6.0001, MIT 6.006, Stanford CS106A, Stanford CS106B, Berkeley CS61A | 6-8 weeks | Q1-Q2 2026 |
| Tier 2 (5 courses) | MIT 6.046J, Berkeley CS61B, Stanford CS161, MIT 6.042J, Helsinki MOOC.fi | 6-8 weeks | Q2-Q3 2026 |
| C++ Runtime | New runtime capability | 2-3 weeks | Q2 2026 |
| Java Runtime (experimental) | New runtime capability | 3-4 weeks | Q3 2026 |
| Tier 3 (5 courses) | freeCodeCamp, Stanford CS231n, MIT 18.06, Georgia Tech CS1301, Michigan EECS183 | 6-8 weeks | Q3-Q4 2026 |
| **Total** | **15 new courses + 2 runtimes** | **~24-31 weeks of effort** | **Full year 2026** |

This is aggressive for a solo developer. The key trade-off: every week spent on expansion is a week not spent on product features (analytics, collaboration, assessment). The Course Pack Spec (allowing community contributions) is the escape hatch -- it turns expansion from a solo effort into a community effort.

---

*The goal is not to support every CS course in the world. The goal is to support the courses that matter most to the most students, with an open specification that lets the community handle the long tail. We win through curation, not comprehensiveness. The 20 most popular free CS courses cover 80% of the students we want to reach. Focus there first. Let the community build the rest.*

# Business Analyst Agent Memory

## Key Reports Written
- `docs/strategy/board-meeting-analyst-competitive-threat.md` -- Sherlock risk & defensibility analysis (2026-02-08)
- `docs/customer-acquisition/cac-modeling.md` -- CAC model, funnel benchmarks, channel ROI (2026-02-09)
- `docs/customer-acquisition/organic-growth-playbook.md` -- Community map, SEO, referral, experiments (2026-02-09)
- `docs/customer-acquisition/user-personas.md` -- 5 personas with JTBD, RICE prioritization (2026-02-09)
- `docs/administration/incorporation-guide.md` -- Jurisdiction comparison, Delaware C-Corp path (2026-02-09)
- `docs/administration/licensing-compliance.md` -- CC BY-NC-SA risk, GDPR, COPPA, YouTube TOS (2026-02-09)
- `docs/administration/operational-checklist.md` -- 23-item pre-launch checklist, compliance calendar (2026-02-09)

## Critical Competitive Intelligence (as of 2026-02-08)

### Highest Threats to Niotebook
1. **Google (LearnLM + YouTube + Colab)** -- Sherlock probability 7/10
2. **Scrimba** -- Sherlock probability 7/10. Closest architectural competitor.
3. **Coursera Coach** -- Sherlock probability 6/10

### CS50-Specific Risk
- CS50 licensed CC BY-NC-SA 4.0. NonCommercial clause is CRITICAL legal risk for paid tier.
- CS50 builds its own AI tools (Duck, help50). edX Xpert provides AI tutoring.
- MIT OCW uses same CC BY-NC-SA license. Stanford courses are NOT openly licensed.

## CAC & Unit Economics Benchmarks (as of 2026-02-09)

### EdTech CAC Ranges
- Consumer edtech (mass market): ~$42 CAC (Source: Financial Models Lab)
- Consumer edtech (targeted): $100-$150 CAC
- B2B edtech (institutional): $1,143 CAC (Source: UserMaven)
- Referral-acquired: $141-$200 (Source: Genesys Growth)
- Industry-wide CAC rising 40-60% since 2023 (Source: ScaleXP)

### Funnel Benchmarks
- Visitor-to-signup: 2-5% average, 10%+ top performers
- Signup-to-activation: 25-60%
- EdTech free trial-to-paid: ~24.8%
- Freemium-to-paid: 5-8%
- EdTech CAC payback: 3.8 months (fastest SaaS vertical)

### LTV:CAC Benchmarks
- Organic channels: ~4:1 LTV:CAC
- Paid channels: ~2.5:1 LTV:CAC
- EdTech benchmark: 3.5:1 to 5:1
- Healthy minimum: 3:1

## Community Sizes (Key Acquisition Channels)
- r/learnprogramming: 4.3M members
- CS50 Discord: 186K+ members
- r/cs50: ~200K+ subscribers (est.)
- freeCodeCamp Forum: 250K+ members
- freeCodeCamp YouTube: 10M subscribers
- Stack Overflow: 18M+ users, 82% visit weekly

## CS Learner Demographics (JetBrains Survey, 18K respondents)
- 69% under 30, 84% male, 62% single, 80% no children
- Motivation: 46% challenge/hobby, 41% salary, 34% remote work
- 66% of under-29 use AI assistants
- Python most popular language for learners
- 30% struggle with courses lacking practical exercises

## Persona Prioritization (RICE-scored)
1. P0: Self-Study CS50 Student ("Alex") -- RICE 518
2. P1: Career Changer ("Priya") -- RICE 336
3. P1: International Learner ("Wei") -- RICE 392
4. P2: CS Teaching Assistant ("Jordan") -- RICE 150 (hub user)
5. P2: Hobbyist Tinkerer ("Sam") -- RICE 210 (highest LTV)

## Legal & Compliance Critical Findings
- CS50 CC BY-NC-SA 4.0: NonCommercial clause is biggest legal risk
- YouTube embedding permitted under API TOS (updated Aug 2025)
- Gemini FREE tier uses data for training (GDPR issue) -- must use paid tier for EU users
- Groq: does NOT use data for training, ZDR available
- Clerk: DPF certified, GDPR-compliant DPA
- Convex: DPA available (March 2024)
- COPPA: likely does not apply (college audience) but add age gate
- "niotebook" not found on USPTO -- name available for trademark

## Incorporation Recommendation
- Delaware C-Corp via Stripe Atlas ($500)
- 83(b) election CRITICAL (30-day deadline after stock issuance)
- Franchise tax: use Assumed Par Value method (NOT Authorized Shares)
- Total Year 1 cost: ~$2,500 (recommended path)

## Strategic Recommendations (Priority Order)
1. URGENT: Remove invite gate, get to 10K+ users in 90 days
2. Publish Privacy Policy + TOS before public launch
3. Email CS50 team for commercial use permission
4. Incorporate (Delaware C-Corp via Stripe Atlas)
5. Expand content beyond CS50 (MIT OCW has same license terms)
6. Build community features (study groups, shared notebooks)
7. File trademark ITU application for "niotebook"

## Vibe Mode Research (2026-02-09)
See `vibe-mode-research.md` for full findings.

### Key Insight
Vibe coders suffer "learning debt" -- they build with AI but can't understand/debug.
The product gap: short concept video + micro-challenge + AI tutor = "aha moment" loop.

### Vibe Coder Dopamine Loop
- Variable-ratio reinforcement (like slot machines) -- 64% describe vibe coding as "magical"
- "Dark flow" / "junk flow" (fast.ai) -- counterfeit productivity
- 11% of vibe coding sessions end in total project abandonment

### Knowledge Gaps (Tier 0 -- what breaks vibe-coded apps)
async/await, state management, APIs, databases, scope/closures, CSS layout, auth flows

### Optimal Content Format
- 3-5 min video = 83% completion (vs 20-30% long-form)
- Microlearning = 50% more engagement, 17% more effective knowledge transfer
- "Aha moments" trigger same neural reward as food/substances (Drexel 2020 study)
- Duolingo streaks: 7-day streak users are 3.6x more likely to stay long-term

### Embeddable Content Sources (YouTube embed, legally clean)
- Fireship "100 Seconds" (2 min, Standard YT License)
- CS50 Shorts (5-15 min, CC BY-NC-SA -- embed OK, NC clause for monetization)
- 3Blue1Brown (10-25 min, Standard YT License)
- ByteByteGo (5-15 min, Standard YT License)
- NeetCode (10-20 min, Standard YT License)
- The Coding Train (10-30 min, Standard YT License / some CC)
- freeCodeCamp (varies, check per video)

### No Direct Competitor
No product combines: curated video + AI tutor + in-browser code challenge + streak.
Scrimba closest but no AI tutor. Brilliant no video/code. Duolingo not programming.

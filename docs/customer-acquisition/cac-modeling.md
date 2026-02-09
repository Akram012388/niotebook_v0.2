# Customer Acquisition Cost (CAC) Modeling

**Date:** 2026-02-09
**Classification:** Strategic / Internal
**Analyst:** Business Intelligence (Claude Agent)
**Related:** `docs/strategy/board-meeting-cfo-financial-survivability.md` (unit economics), `docs/customer-acquisition/organic-growth-playbook.md` (organic tactics)

---

## Executive Summary

- **Niotebook's optimal acquisition strategy is organic-first, paid-never (for now).** At $0 marketing budget with a solo founder, paid acquisition is structurally unviable. Organic channels (SEO, community seeding, content marketing, Product Hunt/HN launches) can realistically deliver 5,000-15,000 signups in the first 6 months at near-zero CAC.
- **Consumer edtech CAC benchmarks range from $42 (mass-market) to $150+ (targeted).** Niotebook's target of CS students watching open courseware is narrow enough that paid ads would be inefficient ($50-$150 CAC) but organic channels should be highly efficient ($0-$5 CAC) because the audience self-selects into communities (r/cs50, CS50 Discord, etc.).
- **The critical conversion funnel bottleneck will be signup-to-active, not visit-to-signup.** EdTech benchmarks show 2-5% visit-to-signup and 25-60% signup-to-active. Niotebook's "aha moment" (AI tutor understanding what you're watching) requires reaching video + code + AI interaction, which has significant activation friction.
- **LTV:CAC ratio of 10:1+ is achievable through organic channels** at the recommended $7.99/mo price point (LTV ~$160 at 5% churn). This assumes CAC stays under $16, which is realistic for organic-only acquisition.
- **Recommended channel mix:** 70% community seeding (Reddit, Discord, forums), 15% SEO/content, 10% launch events (PH, HN), 5% referrals. Total Year 1 budget: $0-$500.

---

## Methodology

### Data Sources
- EdTech CAC benchmarks from [First Page Sage](https://firstpagesage.com/reports/average-cac-for-startups-benchmarks/), [UserMaven](https://usermaven.com/blog/average-customer-acquisition-cost), [Financial Models Lab](https://financialmodelslab.com/blogs/kpi-metrics/niche-market-software-development)
- SaaS conversion rate benchmarks from [First Page Sage](https://firstpagesage.com/seo-blog/average-saas-conversion-rates/), [UserPilot](https://userpilot.com/blog/b2b-saas-funnel-conversion-benchmarks/), [Pathmonk](https://pathmonk.com/what-is-the-average-free-to-paid-conversion-rate-saas/)
- LTV:CAC ratio benchmarks from [Phoenix Strategy Group](https://www.phoenixstrategy.group/blog/ltvcac-ratio-saas-benchmarks-and-insights), [Data-Mania](https://www.data-mania.com/blog/cac-benchmarks-for-b2b-tech-startups-2025/)
- Niotebook unit economics from `docs/strategy/board-meeting-cfo-financial-survivability.md` (CFO report, 2026-02-08)

### Frameworks
- Full-funnel conversion modeling (impressions through paying user)
- Channel-by-channel CAC with ROI projections
- LTV:CAC analysis with sensitivity testing
- Budget allocation optimization under zero-capital constraint

---

## 1. Industry CAC Benchmarks

### 1.1 EdTech CAC by Segment

| Segment | CAC Range | Source |
|---------|-----------|--------|
| Consumer edtech (mass-market, e.g., Duolingo) | $42 | [Financial Models Lab](https://financialmodelslab.com/blogs/kpi-metrics/niche-market-software-development) |
| Consumer edtech (targeted, e.g., coding platforms) | $100-$150 | Estimate based on Codecademy/Brilliant positioning |
| B2B edtech (institutional sales) | $1,143 | [UserMaven](https://usermaven.com/blog/average-customer-acquisition-cost) |
| Referral-acquired users (cross-industry) | $141-$200 | [Genesys Growth](https://genesysgrowth.com/blog/customer-acquisition-cost-benchmarks-for-marketing-leaders) |
| Organic-acquired users (SEO/content) | $0-$15 | Estimate based on content cost amortization |

### 1.2 SaaS CAC Trends (2025-2026)

CAC across SaaS has risen 40-60% since 2023 and 222% over eight years ([ScaleXP](https://www.scalexp.com/blog-saas-benchmarks-cac-payback-2025/)). The median new CAC ratio is now $2.00 per $1 of new ARR, meaning it costs $2 to acquire $1 of annual revenue ([Proven SaaS](https://proven-saas.com/benchmarks/cac-payback-benchmarks)).

**Implication for Niotebook:** Rising industry CAC makes organic acquisition even more critical. Niotebook cannot afford $2 per $1 ARR -- at $95.88 annual revenue per user ($7.99/mo), that would mean $192 CAC per paying user, which is absurd for a bootstrapped solo project.

### 1.3 CAC Payback Period Benchmarks

| Segment | Median CAC Payback | Source |
|---------|-------------------|--------|
| B2C apps | 4.2 months | [ScaleXP](https://www.scalexp.com/blog-saas-benchmarks-cac-payback-2025/) |
| EdTech | 3.8 months | [Financial Models Lab](https://financialmodelslab.com/blogs/kpi-metrics/niche-market-software-development) |
| B2B SaaS | 8.6 months | [ScaleXP](https://www.scalexp.com/blog-saas-benchmarks-cac-payback-2025/) |
| All SaaS median | 6.8 months | [ScaleXP](https://www.scalexp.com/blog-saas-benchmarks-cac-payback-2025/) |

EdTech has the fastest payback period across all SaaS verticals. At $7.99/mo ARPU and $0-$5 organic CAC, Niotebook's payback would be under 1 month -- exceptional economics if achieved.

---

## 2. Channel-by-Channel CAC Model

### 2.1 Channel Definitions and Cost Assumptions

| Channel | Description | Cost Components | Est. CAC (per signup) | Est. CAC (per paying user at 4% conversion) |
|---------|-------------|-----------------|----------------------|---------------------------------------------|
| **Community Seeding** | Posts on r/cs50, r/learnprogramming, CS50 Discord, freeCodeCamp forum | Akram's time (valued at $0 cash, $50/hr opportunity cost) | $0 cash / ~$2 opportunity | $0 cash / ~$50 opportunity |
| **SEO / Content** | Blog posts targeting "CS50 help", "learn programming", "coding AI tutor" keywords | Akram's writing time; hosting already covered | $0 cash / ~$5 opportunity | $0 cash / ~$125 opportunity |
| **Launch Events** | Product Hunt, Hacker News Show HN, Indie Hackers | Preparation time + possible $79 PH Ship fee | $0.02-$0.10 per signup | $0.50-$2.50 per paying user |
| **Referral Program** | In-product referral mechanism (refer a friend, get premium features) | Development time + potential feature cost | $0 cash / feature cost amortized | $0 cash per paying user |
| **YouTube Micro-Influencers** | Sponsorship with 10K-50K subscriber coding channels | $50-$1,200 per video | $5-$20 per signup | $125-$500 per paying user |
| **Paid Social (Reddit/Twitter)** | Targeted ads to CS student demographics | $3-$8 CPM, $1-$3 CPC | $10-$30 per signup | $250-$750 per paying user |
| **Paid Search (Google)** | Bidding on "CS50 help", "learn programming online" | $2-$8 CPC, 3-5% landing conversion | $40-$160 per signup | $1,000-$4,000 per paying user |
| **Institutional Outreach** | Direct outreach to CS professors, TAs, university clubs | Akram's time, travel if needed | $0 cash | $0 cash (but potentially 50+ users per conversion) |

### 2.2 Channel ROI Ranking

| Rank | Channel | Cash CAC (Paying User) | ROI (LTV/CAC) | Recommended Priority |
|------|---------|----------------------|---------------|---------------------|
| 1 | Community Seeding | $0 | Infinite | PRIMARY |
| 2 | Launch Events | $0.50-$2.50 | 64:1 - 320:1 | HIGH |
| 3 | Referral Program | $0 | Infinite | HIGH (after 500+ users) |
| 4 | SEO / Content | $0 | Infinite (long-term) | MEDIUM (slow ramp) |
| 5 | Institutional Outreach | $0 | Infinite (high effort) | MEDIUM |
| 6 | YouTube Micro-Influencers | $125-$500 | 0.3:1 - 1.3:1 | LOW (not yet) |
| 7 | Paid Social | $250-$750 | 0.2:1 - 0.6:1 | NOT RECOMMENDED |
| 8 | Paid Search | $1,000-$4,000 | 0.04:1 - 0.16:1 | NOT RECOMMENDED |

**Key insight:** At current scale (pre-revenue, solo founder), only channels 1-5 are viable. Paid acquisition (channels 6-8) becomes rational only after achieving positive unit economics and $5K+ MRR, which provides a marketing budget of $500-$1,000/month.

---

## 3. Full Funnel Conversion Model

### 3.1 Funnel Stage Definitions

| Stage | Definition | EdTech Benchmark | Niotebook Estimate | Rationale |
|-------|-----------|------------------|-------------------|-----------|
| **Impressions** | Saw a mention, ad, or link | -- | -- | Top of funnel |
| **Visits** | Landed on niotebook.com | 10-20% CTR from community posts | 15% | High-intent communities |
| **Signups** | Created account (Clerk auth) | 2-5% visitor-to-signup | 8-12% | Strong value prop for target audience; invite-gate removed |
| **Activated** | Completed first AI interaction with video + code | 25-60% signup-to-active | 30-40% | Significant friction (must choose course, open video, write code, ask AI) |
| **Retained (Day 7)** | Returned within 7 days | 15-30% for edtech | 20-25% | Dependent on content quality |
| **Converted (Paying)** | Upgraded to paid plan | 5-8% freemium-to-paid ([First Page Sage](https://firstpagesage.com/seo-blog/saas-freemium-conversion-rates/)) | 4-6% | Student price sensitivity |

### 3.2 Funnel Math: Community Seeding Example (r/cs50)

Modeling one high-quality post on r/cs50 (estimated 200K+ subscribers):

| Stage | Count | Conversion Rate | Notes |
|-------|-------|-----------------|-------|
| Impressions (post views) | 5,000 | -- | Top 10% post performance on r/cs50 |
| Clicks to niotebook.com | 750 | 15% CTR | High-intent subreddit |
| Signups | 75 | 10% visitor-to-signup | Compelling landing page assumed |
| Activated (first AI + video + code) | 26 | 35% activation | Requires good onboarding |
| Retained Day 7 | 6 | 22% of activated | Early-stage product |
| Converted to paid | 2 | 4% of activated | 12-month horizon |
| **Cash CAC** | **$0** | -- | Time cost only |
| **Revenue (annual)** | **$192** | 2 users x $7.99 x 12 | -- |

### 3.3 Funnel Math: Product Hunt Launch

| Stage | Count | Conversion Rate | Notes |
|-------|-------|-----------------|-------|
| Impressions (PH page views) | 15,000 | -- | Median featured product range |
| Clicks to niotebook.com | 3,000 | 20% CTR | PH audiences click through |
| Signups | 300 | 10% | Tech-savvy audience |
| Activated | 105 | 35% | Good onboarding |
| Retained Day 7 | 25 | 24% | Slightly higher (PH users are experimenters) |
| Converted to paid | 8 | ~3% of activated | PH users are deal-seekers |
| **Cash CAC** | **~$10** | $79 PH Ship fee / 8 | -- |
| **Revenue (annual)** | **$767** | 8 users x $7.99 x 12 | -- |

### 3.4 Funnel Math: Hacker News "Show HN"

| Stage | Count | Conversion Rate | Notes |
|-------|-------|-----------------|-------|
| Impressions (HN front page) | 30,000 | -- | Front-page Show HN gets 30-100K views |
| Clicks to niotebook.com | 6,000 | 20% CTR | HN clicks aggressively |
| Signups | 600 | 10% | Dev tool converts well on HN |
| Activated | 180 | 30% | HN users try then bounce quickly |
| Retained Day 7 | 36 | 20% | Lower retention (less target-audience aligned) |
| Converted to paid | 11 | ~2% of activated | HN audience is price-resistant |
| **Cash CAC** | **$0** | Free to post | -- |
| **Revenue (annual)** | **$1,054** | 11 users x $7.99 x 12 | -- |

---

## 4. LTV:CAC Analysis

### 4.1 LTV Calculation

From the CFO report (verified from codebase):
- ARPU: $7.99/month
- Monthly churn (base case): 5%
- LTV = ARPU / churn = $7.99 / 0.05 = **$159.80**

Sensitivity:

| Churn Rate | LTV | Change from Base |
|-----------|-----|-----------------|
| 3% (optimistic) | $266.33 | +67% |
| 5% (base) | $159.80 | -- |
| 8% (pessimistic) | $99.88 | -38% |
| 10% (crisis) | $79.90 | -50% |

### 4.2 LTV:CAC Ratios by Channel

| Channel | CAC (Paying User) | LTV:CAC Ratio | Verdict |
|---------|-------------------|---------------|---------|
| Community Seeding | $0-$2 (cash) | 80:1 - Infinite | Excellent |
| Referral Program | $0 (cash) | Infinite | Excellent |
| Launch Events (PH/HN) | $0-$10 | 16:1 - Infinite | Excellent |
| SEO / Content | $0-$5 (cash) | 32:1 - Infinite | Excellent (slow build) |
| Institutional Outreach | $0 (cash) | Infinite | Excellent (high effort per conversion) |
| YouTube Micro-Influencers | $125-$500 | 0.3:1 - 1.3:1 | Unviable at current scale |
| Paid Social | $250-$750 | 0.2:1 - 0.6:1 | Unviable |
| Paid Search | $1,000-$4,000 | 0.04:1 - 0.16:1 | Catastrophic |

**Benchmark:** Sustainable growth requires LTV:CAC of at least 3:1 ([Phoenix Strategy Group](https://www.phoenixstrategy.group/blog/ltvcac-ratio-saas-benchmarks-and-insights)). EdTech benchmark is 3.5:1 to 5:1 depending on maturity. Above 5:1 suggests underinvestment in growth.

**Niotebook's position:** Organic channels deliver astronomically high LTV:CAC ratios because CAC is near-zero. This is typical for pre-scale startups and is not sustainable evidence -- it reflects the founder's uncompensated labor. The real question is whether these organic channels can generate *volume*, not whether they are *efficient*.

### 4.3 Organic vs. Paid LTV:CAC (Industry Data)

| Acquisition Type | Average LTV:CAC Ratio | Source |
|-----------------|----------------------|--------|
| Organic-skewed | 4:1 | [First Page Sage](https://firstpagesage.com/seo-blog/the-saas-ltv-to-cac-ratio-fc/) |
| Paid-only | 2.5:1 | [First Page Sage](https://firstpagesage.com/seo-blog/the-saas-ltv-to-cac-ratio-fc/) |
| Blended (typical SaaS) | 3:1 | [Phoenix Strategy Group](https://www.phoenixstrategy.group/blog/ltvcac-ratio-saas-benchmarks-and-insights) |

Organic channels deliver 60% better LTV:CAC than paid channels. This further validates Niotebook's organic-first strategy.

---

## 5. Budget Allocation & Channel Mix

### 5.1 Phase 1: $0 Budget (Months 0-6)

| Channel | % of Effort | Expected Signups | Expected Paying Users | Cash Cost |
|---------|------------|------------------|-----------------------|-----------|
| Community Seeding | 50% | 1,500-3,000 | 30-90 | $0 |
| Launch Events (PH + HN) | 20% | 800-2,000 | 15-40 | $0-$79 |
| SEO / Content | 15% | 200-800 | 4-20 | $0 |
| Institutional Outreach | 10% | 100-500 | 5-25 | $0 |
| Referral Program | 5% | 50-200 | 2-10 | $0 |
| **TOTAL** | **100%** | **2,650-6,500** | **56-185** | **$0-$79** |

**Revenue projection (Month 6):**
- Bear: 56 paying users x $7.99 = $447/month MRR
- Base: 120 paying users x $7.99 = $959/month MRR
- Bull: 185 paying users x $7.99 = $1,478/month MRR

### 5.2 Phase 2: Revenue-Funded Budget (Months 6-12)

Assuming $1,000/month MRR, allocate 20% ($200/month) to growth:

| Channel | Monthly Budget | Expected Signups/mo | Expected Paying Users/mo |
|---------|---------------|---------------------|--------------------------|
| Community Seeding (ongoing) | $0 | 200-400 | 5-12 |
| SEO / Content (scaling) | $0 | 100-300 | 3-9 |
| YouTube Micro-Influencers | $100-$150 | 20-60 | 1-3 |
| Referral Program (incentivized) | $50 | 50-100 | 2-5 |
| Launch Events (secondary) | $0 | 50-100 | 1-3 |
| **TOTAL** | **$150-$200** | **420-960** | **12-32** |

### 5.3 Phase 3: Growth Budget (Months 12-18)

Assuming $5,000/month MRR, allocate 25% ($1,250/month) to growth:

| Channel | Monthly Budget | Expected Signups/mo | Expected Paying Users/mo |
|---------|---------------|---------------------|--------------------------|
| Community + Organic | $0 | 300-500 | 8-15 |
| SEO / Content (full blog) | $200 | 200-500 | 6-15 |
| YouTube Influencers (mid-tier) | $500-$700 | 100-300 | 4-12 |
| Referral Program | $100 | 100-200 | 4-10 |
| Paid Social (testing) | $250-$300 | 50-100 | 2-4 |
| **TOTAL** | **$1,050-$1,300** | **750-1,600** | **24-56** |

---

## 6. Blended CAC Projections

### 6.1 By Scenario Over 18 Months

| Metric | Bear | Base | Bull |
|--------|------|------|------|
| Total signups (18 months) | 5,000 | 15,000 | 40,000 |
| Total paying users (Month 18) | 200 | 800 | 2,500 |
| Total cash spent on acquisition | $500 | $2,000 | $8,000 |
| **Blended CAC (per signup)** | **$0.10** | **$0.13** | **$0.20** |
| **Blended CAC (per paying user)** | **$2.50** | **$2.50** | **$3.20** |
| MRR (Month 18) | $1,597 | $6,392 | $19,975 |
| LTV:CAC Ratio | 64:1 | 64:1 | 50:1 |

### 6.2 When Paid Acquisition Becomes Rational

Paid acquisition (Google Ads, social ads) becomes rational when:

1. **Organic channels are saturated** -- community posts yield diminishing returns, SEO keywords are captured
2. **MRR exceeds $5,000** -- providing $1,000+/month marketing budget
3. **Unit economics are validated** -- churn is confirmed at <5%, LTV is confirmed at >$100
4. **CAC payback is under 6 months** -- paid CAC of <$48 (6 months x $7.99)

**Estimated timeline:** Month 12-18 for Phase 3 experimentation, Month 18+ for meaningful paid spend.

---

## 7. Sensitivity Analysis

### 7.1 Impact of Conversion Rate on CAC

Assuming 10,000 signups (base case community + launch channel):

| Freemium-to-Paid Rate | Paying Users | Blended CAC (at $1,000 spend) | LTV:CAC |
|-----------------------|-------------|------------------------------|---------|
| 2% | 200 | $5.00 | 32:1 |
| 4% (base) | 400 | $2.50 | 64:1 |
| 6% (optimistic) | 600 | $1.67 | 96:1 |
| 8% (exceptional) | 800 | $1.25 | 128:1 |

### 7.2 Impact of Churn on LTV:CAC

| Monthly Churn | LTV | CAC (base $2.50) | LTV:CAC | Verdict |
|--------------|-----|-------------------|---------|---------|
| 3% | $266 | $2.50 | 106:1 | Outstanding |
| 5% | $160 | $2.50 | 64:1 | Outstanding |
| 8% | $100 | $2.50 | 40:1 | Excellent |
| 10% | $80 | $2.50 | 32:1 | Strong |
| 15% | $53 | $2.50 | 21:1 | Still strong |

**Even at 15% monthly churn (catastrophic for most SaaS), organic CAC delivers 21:1 LTV:CAC.** The organic-first strategy is robust across all reasonable churn scenarios.

### 7.3 Impact of ARPU on Channel Viability

If Niotebook prices lower (e.g., $4.99) or higher (e.g., $12.99):

| ARPU | LTV (5% churn) | Max Viable Paid CAC (3:1) | Max Viable Paid CAC (5:1) |
|------|----------------|--------------------------|--------------------------|
| $4.99 | $99.80 | $33.27 | $19.96 |
| $7.99 | $159.80 | $53.27 | $31.96 |
| $9.99 | $199.80 | $66.60 | $39.96 |
| $12.99 | $259.80 | $86.60 | $51.96 |

At $7.99 ARPU, the maximum viable paid CAC (for 3:1 ratio) is ~$53 per paying user. This means Niotebook could eventually afford paid social ($10-$30 per signup, $250-$750 per paying user) only if conversion rates are significantly above benchmark (>20% freemium-to-paid), which is unrealistic.

**Conclusion:** Paid acquisition remains structurally unviable at current pricing. To enable paid acquisition, Niotebook would need either (a) much higher ARPU via institutional/B2B pricing, or (b) much higher conversion rates through product-led growth.

---

## 8. Recommended KPIs

### 8.1 Acquisition Metrics to Track

| KPI | Definition | Target (Month 6) | Target (Month 12) | Measurement |
|-----|-----------|-------------------|--------------------|----|
| **Blended CAC** | Total acquisition spend / new paying users | < $5 | < $10 | Monthly Stripe + spend tracking |
| **CAC Payback Period** | CAC / monthly ARPU | < 1 month | < 2 months | Calculated |
| **LTV:CAC Ratio** | LTV / blended CAC | > 10:1 | > 5:1 | Calculated (will normalize as paid channels added) |
| **Visitor-to-Signup Rate** | Signups / unique visitors | > 8% | > 10% | PostHog or similar |
| **Signup-to-Activation Rate** | Users who complete first AI+video+code / total signups | > 30% | > 40% | Convex events table |
| **Free-to-Paid Conversion** | Paying users / total MAU | > 3% | > 5% | Stripe + Convex |
| **Channel Attribution** | Which channel each signup came from | Track for all channels | Optimize top 3 | UTM params + referrer tracking |

### 8.2 Early Warning Thresholds

| Metric | Green | Yellow | Red |
|--------|-------|--------|-----|
| Signup-to-Activation | > 35% | 20-35% | < 20% |
| Free-to-Paid | > 4% | 2-4% | < 2% |
| CAC Payback | < 2 months | 2-6 months | > 6 months |
| LTV:CAC | > 5:1 | 3-5:1 | < 3:1 |

---

## 9. Recommendations

### Immediate (This Month)

1. **Remove the invite gate.** Every day behind an invite wall is a day of zero acquisition. The invite system serves no purpose at this stage -- the product needs users, not exclusivity.

2. **Implement UTM tracking and referrer capture.** Before any acquisition effort, instrument the signup flow to capture `utm_source`, `utm_medium`, `utm_campaign`, and HTTP referrer. Without this, channel attribution is impossible.

3. **Define the activation event in the analytics schema.** "Activated" = user has (a) opened a lesson video, (b) written code in the editor, and (c) sent at least one message to Nio. Track this as a composite event in the Convex `events` table.

### Short-Term (Months 1-3)

4. **Execute the community seeding playbook** (see `docs/customer-acquisition/organic-growth-playbook.md`). Target r/cs50, r/learnprogramming, CS50 Discord. Budget: $0. Expected: 1,000-3,000 signups.

5. **Prepare and execute Product Hunt and Hacker News launches.** Craft compelling narratives. "I built a CS50 study companion that puts video, code, and an AI tutor in one tab" is a strong Show HN headline. Expected: 500-2,000 additional signups.

6. **Build a basic referral mechanism.** "Share Niotebook with a classmate, both get 1 week of free Pro." Expected cost: near-zero (1 week of free AI per referral = $0.12 in API costs). Expected: 50-200 referred signups.

### Medium-Term (Months 3-6)

7. **Publish 2-4 SEO-optimized blog posts per month.** Target queries: "CS50 help", "learn C programming", "CS50 problem set tips", "best way to study CS50". Expected organic traffic ramp: 500-2,000 monthly visitors by Month 6.

8. **Begin institutional outreach.** Contact 5-10 CS professors who teach courses using open courseware. Offer Niotebook as a free recommended companion tool. One successful partnership could yield 50-200 students per semester.

9. **Track and optimize the signup-to-activation funnel.** This is the highest-leverage metric. A 10% improvement in activation rate (from 30% to 40%) is equivalent to acquiring 33% more signups at zero additional cost.

---

## Appendix A: Comparison with Competitor Acquisition Strategies

| Company | Primary Acquisition | Est. CAC | Strategy Notes |
|---------|-------------------|----------|----------------|
| Duolingo | Organic + viral (gamification, streaks, social) | ~$42 | K-factor driven; product IS the growth engine |
| Khan Academy | SEO + brand + partnerships | ~$5-$15 (nonprofit, donated media) | Non-profit = donated Google Ad Grants ($10K/mo) |
| Codecademy | Paid search + SEO + freemium | ~$50-$100 (est.) | Heavy Google Ads on coding keywords |
| Brilliant | Creator partnerships + paid social | $8-$12 (partnership), $35-$50 (paid) | YouTube sponsorships are primary channel |
| Replit | Product-led growth + community + education | ~$10-$30 (est.) | Education-as-acquisition strategy |
| Coursera | SEO + university partnerships + brand | ~$30-$80 (B2C), $500+ (B2B) | University credentialing drives organic |
| Scrimba | Community + YouTube channel + content | ~$10-$25 (est.) | Strong YouTube presence, free content funnel |

Source: Estimates based on competitor pricing, public financial data, and industry benchmarks. Exact CAC figures are not publicly disclosed for most companies.

## Appendix B: Funnel Instrumentation Requirements

To accurately track CAC, Niotebook needs the following instrumentation:

1. **Landing page analytics:** Visitor count, source, time on page (PostHog, Plausible, or similar)
2. **Signup source tracking:** UTM params stored in Convex `users` table at account creation
3. **Activation event tracking:** Composite event in `events` table (video_opened + code_written + ai_message_sent)
4. **Conversion tracking:** Stripe webhook integration logging upgrade events with user ID
5. **Cohort analysis:** Weekly cohort tracking of signup -> activation -> retention -> conversion

---

*This model uses industry benchmarks and reasonable estimates. All projections should be updated monthly with actual data once the invite gate is removed and real acquisition begins. The model is only as good as the assumptions, and assumptions are only as good as the data that replaces them.*

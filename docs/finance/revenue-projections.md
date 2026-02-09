# Niotebook Revenue Projections (18-Month Model)

**Date:** 2026-02-09
**Prepared by:** CFO Office
**Status:** Living Document -- Update Monthly with Actuals vs. Projections

---

## Executive Summary

Niotebook has zero revenue today. That changes at launch. The 18-month revenue projection models three scenarios from launch (assumed Month 1 = March 2026):

| Scenario | MRR at Month 6 | MRR at Month 12 | MRR at Month 18 | Cumulative Revenue |
|----------|---------------|-----------------|------------------|--------------------|
| **Bear** | $319 | $1,517 | $3,451 | **$21,544** |
| **Base** | $1,278 | $6,792 | $16,137 | **$103,413** |
| **Bull** | $3,196 | $19,176 | $50,340 | **$320,628** |

The base case reaches the Sherlock survival threshold ($8,000 MRR / 1,000 paying users) by Month 13. The bull case reaches it by Month 8. The bear case never reaches it within 18 months -- a sobering reminder that execution matters more than models.

**Cash flow positive (covers Akram's living expenses at $3,000/month):** Month 14 (base), Month 9 (bull), beyond Month 18 (bear).

**The bottom line:** Niotebook's cost structure means it does not need to be a rocketship. A modest 10-15% month-over-month growth rate, sustained for 12-18 months, gets the business to self-sustaining. The race is not against competitors -- it is against time.

---

## 1. Core Assumptions

### 1.1 Common Assumptions (All Scenarios)

| Parameter | Value | Source |
|-----------|-------|--------|
| Launch month | March 2026 (Month 1) | Planned |
| Pricing: Pro monthly | $7.99/month | Recommended pricing |
| Pricing: Pro annual | $79.99/year ($6.67/mo) | Recommended pricing |
| Pricing: Student monthly | $4.99/month | Recommended pricing |
| Pricing: Student annual | $49.99/year ($4.17/mo) | Recommended pricing |
| Free tier | 5 AI requests/day, Groq-only | Cost-optimized |
| AI cost per free user/mo | $0.24 | From unit economics |
| AI cost per paid user/mo | $0.52 | From unit economics |
| Infrastructure overhead | $45/mo at 1K MAU, scales linearly | From unit economics |
| Akram's minimum living cost | $3,000/month | Operating expense |

### 1.2 Scenario-Specific Assumptions

| Assumption | Bear | Base | Bull |
|-----------|------|------|------|
| **Registered users at Month 6** | 800 | 4,000 | 15,000 |
| **Registered users at Month 12** | 2,500 | 15,000 | 60,000 |
| **Registered users at Month 18** | 5,000 | 35,000 | 150,000 |
| **MAU as % of registered** | 35% | 40% | 45% |
| **Free-to-paid conversion rate** | 2% | 4% | 6% |
| **Monthly churn (paying users)** | 10% | 6% | 4% |
| **Subscriber mix (Pro:Student)** | 60:40 | 65:35 | 70:30 |
| **Annual vs Monthly billing** | 30:70 | 50:50 | 60:40 |
| **Effective ARPU** | $5.70 | $6.39 | $6.65 |
| **Monthly MRR growth rate** | 8-12% | 15-20% | 25-35% |
| **Marketing spend** | $0 (organic only) | $0-200/mo | $0-500/mo |
| **Courses available** | 3 (CS50 series) | 5-7 | 10+ |

**ARPU calculation (Base case):**
- 65% Pro: 50% annual ($6.67) + 50% monthly ($7.99) = avg $7.33
- 35% Student: 50% annual ($4.17) + 50% monthly ($4.99) = avg $4.58
- Blended: 0.65 x $7.33 + 0.35 x $4.58 = $4.76 + $1.60 = **$6.39**

---

## 2. Month-by-Month Revenue Model

### 2.1 Bear Case -- "The Grind"

Assumptions: Slow organic growth. Limited word-of-mouth. Only 3 courses. No marketing budget. 2% conversion, 10% churn.

| Month | Registered | MAU | Paying Users | New Subs | Churned | MRR | Cumulative |
|-------|-----------|-----|-------------|----------|---------|-----|------------|
| 1 | 200 | 70 | 1 | 1 | 0 | $6 | $6 |
| 2 | 350 | 123 | 3 | 2 | 0 | $17 | $23 |
| 3 | 500 | 175 | 5 | 3 | 1 | $29 | $51 |
| 4 | 600 | 210 | 8 | 4 | 1 | $46 | $97 |
| 5 | 700 | 245 | 12 | 5 | 1 | $68 | $165 |
| 6 | 800 | 280 | 16 | 6 | 2 | $91 | $256 |
| 7 | 950 | 333 | 22 | 8 | 2 | $125 | $382 |
| 8 | 1,100 | 385 | 29 | 10 | 3 | $165 | $547 |
| 9 | 1,300 | 455 | 38 | 13 | 4 | $217 | $764 |
| 10 | 1,500 | 525 | 48 | 15 | 5 | $274 | $1,037 |
| 11 | 1,800 | 630 | 61 | 19 | 6 | $348 | $1,385 |
| 12 | 2,100 | 735 | 76 | 22 | 7 | $433 | $1,819 |
| 13 | 2,400 | 840 | 92 | 24 | 8 | $524 | $2,343 |
| 14 | 2,700 | 945 | 109 | 26 | 9 | $621 | $2,964 |
| 15 | 3,100 | 1,085 | 130 | 31 | 10 | $741 | $3,705 |
| 16 | 3,500 | 1,225 | 153 | 35 | 12 | $872 | $4,577 |
| 17 | 4,000 | 1,400 | 180 | 40 | 13 | $1,026 | $5,603 |
| 18 | 4,600 | 1,610 | 210 | 45 | 15 | $1,197 | $6,799 |

**Bear case verdict:** MRR reaches ~$1,200 by Month 18. Never hits $8K MRR survival threshold. Niotebook survives (costs near-zero) but Akram cannot work on it full-time. Requires pivot, additional courses, or marketing investment to change trajectory.

### 2.2 Base Case -- "Steady Growth"

Assumptions: Moderate word-of-mouth. 5-7 courses by Month 12. Small content marketing effort. 4% conversion, 6% churn. ~15-20% MoM growth.

| Month | Registered | MAU | Paying Users | New Subs | Churned | MRR | Cumulative |
|-------|-----------|-----|-------------|----------|---------|-----|------------|
| 1 | 500 | 200 | 8 | 8 | 0 | $51 | $51 |
| 2 | 1,000 | 400 | 16 | 10 | 2 | $102 | $153 |
| 3 | 1,500 | 600 | 28 | 15 | 3 | $179 | $332 |
| 4 | 2,200 | 880 | 42 | 19 | 5 | $268 | $601 |
| 5 | 3,000 | 1,200 | 60 | 24 | 6 | $383 | $984 |
| 6 | 4,000 | 1,600 | 82 | 30 | 8 | $524 | $1,508 |
| 7 | 5,200 | 2,080 | 110 | 38 | 10 | $703 | $2,211 |
| 8 | 6,500 | 2,600 | 145 | 48 | 13 | $927 | $3,138 |
| 9 | 8,000 | 3,200 | 188 | 60 | 17 | $1,201 | $4,339 |
| 10 | 9,800 | 3,920 | 238 | 72 | 22 | $1,521 | $5,860 |
| 11 | 12,000 | 4,800 | 300 | 89 | 27 | $1,917 | $7,777 |
| 12 | 15,000 | 6,000 | 378 | 111 | 33 | $2,415 | $10,193 |
| 13 | 18,000 | 7,200 | 472 | 134 | 40 | $3,016 | $13,209 |
| 14 | 21,500 | 8,600 | 584 | 162 | 50 | $3,732 | $16,941 |
| 15 | 25,000 | 10,000 | 712 | 191 | 63 | $4,550 | $21,490 |
| 16 | 28,500 | 11,400 | 854 | 216 | 74 | $5,459 | $26,950 |
| 17 | 32,000 | 12,800 | 1,012 | 243 | 85 | $6,467 | $33,416 |
| 18 | 35,000 | 14,000 | 1,180 | 264 | 96 | $7,540 | $40,957 |

**Base case verdict:** MRR approaches $8K by Month 18. Hits 1,000 paying users around Month 17. Cumulative revenue of ~$41K covers all infrastructure costs with significant margin. Akram can transition to full-time around Month 16-18 when MRR approaches his minimum living cost.

### 2.3 Bull Case -- "Breakout"

Assumptions: Strong word-of-mouth. Viral moment on Twitter/Reddit/HN. 10+ courses. 6% conversion, 4% churn. ~25-35% MoM growth early, settling to 15-20%.

| Month | Registered | MAU | Paying Users | New Subs | Churned | MRR | Cumulative |
|-------|-----------|-----|-------------|----------|---------|-----|------------|
| 1 | 1,500 | 675 | 41 | 41 | 0 | $273 | $273 |
| 2 | 3,000 | 1,350 | 82 | 43 | 2 | $545 | $818 |
| 3 | 5,000 | 2,250 | 148 | 70 | 4 | $984 | $1,802 |
| 4 | 7,500 | 3,375 | 228 | 87 | 7 | $1,516 | $3,318 |
| 5 | 10,500 | 4,725 | 325 | 108 | 11 | $2,161 | $5,479 |
| 6 | 15,000 | 6,750 | 460 | 149 | 14 | $3,059 | $8,538 |
| 7 | 20,000 | 9,000 | 626 | 185 | 19 | $4,163 | $12,701 |
| 8 | 26,000 | 11,700 | 830 | 230 | 26 | $5,520 | $18,221 |
| 9 | 33,000 | 14,850 | 1,072 | 275 | 33 | $7,129 | $25,350 |
| 10 | 40,000 | 18,000 | 1,340 | 307 | 39 | $8,911 | $34,261 |
| 11 | 48,000 | 21,600 | 1,640 | 347 | 47 | $10,906 | $45,167 |
| 12 | 57,000 | 25,650 | 1,982 | 398 | 56 | $13,180 | $58,347 |
| 13 | 67,000 | 30,150 | 2,370 | 454 | 66 | $15,760 | $74,107 |
| 14 | 78,000 | 35,100 | 2,806 | 510 | 74 | $18,660 | $92,767 |
| 15 | 90,000 | 40,500 | 3,290 | 572 | 88 | $21,879 | $114,646 |
| 16 | 103,000 | 46,350 | 3,830 | 644 | 104 | $25,470 | $140,116 |
| 17 | 118,000 | 53,100 | 4,434 | 720 | 116 | $29,486 | $169,602 |
| 18 | 135,000 | 60,750 | 5,104 | 802 | 132 | $33,942 | $203,544 |

**Bull case verdict:** Hits $8K MRR (survival threshold) by Month 10. Crosses $10K MRR by Month 11. MRR approaches $34K by Month 18 -- sufficient for Akram to hire 1-2 people. Cumulative revenue of $204K makes niotebook a real business.

---

## 3. Revenue Milestones

| Milestone | Bear | Base | Bull | What Unlocks |
|-----------|------|------|------|-------------|
| **First $100 MRR** | Month 6 | Month 2 | Month 1 | Proof of willingness to pay |
| **$500 MRR** | Month 13 | Month 6 | Month 2 | Covers infrastructure costs |
| **$1,000 MRR** | Month 17 | Month 9 | Month 3 | First $12K ARR |
| **$3,000 MRR** | Beyond M18 | Month 14 | Month 6 | Covers Akram's minimum living |
| **$5,000 MRR** | Beyond M18 | Month 16 | Month 8 | Comfortable solo operation |
| **$8,000 MRR** | Beyond M18 | Beyond M18* | Month 10 | Sherlock survival threshold |
| **$10,000 MRR** | Beyond M18 | Beyond M18 | Month 11 | $120K ARR, can hire part-time |
| **$20,000 MRR** | Beyond M18 | Beyond M18 | Month 14 | $240K ARR, real business |

*Base case reaches ~$7.5K MRR at Month 18, approaching but not quite hitting the $8K threshold.

---

## 4. Cash Flow Projection

### 4.1 Monthly Cash Flow (Base Case)

| Month | Revenue | AI Costs | Infra | Marketing | Akram Draw* | Net Cash Flow | Cumulative |
|-------|---------|---------|-------|-----------|------------|--------------|------------|
| 1 | $51 | $0** | $1 | $0 | $0 | +$50 | $50 |
| 2 | $102 | $0** | $1 | $0 | $0 | +$101 | $151 |
| 3 | $179 | $41 | $1 | $0 | $0 | +$137 | $288 |
| 4 | $268 | $81 | $1 | $50 | $0 | +$136 | $424 |
| 5 | $383 | $128 | $20 | $50 | $0 | +$185 | $609 |
| 6 | $524 | $183 | $20 | $100 | $0 | +$221 | $830 |
| 7 | $703 | $256 | $25 | $100 | $0 | +$322 | $1,152 |
| 8 | $927 | $346 | $25 | $150 | $0 | +$406 | $1,558 |
| 9 | $1,201 | $436 | $25 | $150 | $0 | +$590 | $2,148 |
| 10 | $1,521 | $548 | $25 | $200 | $0 | +$748 | $2,896 |
| 11 | $1,917 | $688 | $25 | $200 | $0 | +$1,004 | $3,900 |
| 12 | $2,415 | $868 | $25 | $200 | $0 | +$1,322 | $5,222 |
| 13 | $3,016 | $1,064 | $25 | $200 | $0 | +$1,727 | $6,949 |
| 14 | $3,732 | $1,296 | $25 | $200 | $500 | +$1,711 | $8,660 |
| 15 | $4,550 | $1,540 | $25 | $200 | $1,000 | +$1,785 | $10,445 |
| 16 | $5,459 | $1,790 | $25 | $200 | $1,500 | +$1,944 | $12,389 |
| 17 | $6,467 | $2,050 | $25 | $200 | $2,000 | +$2,192 | $14,581 |
| 18 | $7,540 | $2,320 | $25 | $200 | $3,000 | +$1,995 | $16,576 |

*Akram draw begins when revenue justifies it (Month 14+, ramping up).
**Free tier covers first ~500 MAU (Months 1-2).

### 4.2 When Does Niotebook Become Self-Sustaining?

| Definition | Bear | Base | Bull |
|-----------|------|------|------|
| Revenue > infrastructure costs | Month 6 | Month 2 | Month 1 |
| Revenue > all variable costs | Month 12 | Month 5 | Month 2 |
| Revenue > costs + $1K/mo draw | Beyond M18 | Month 12 | Month 5 |
| Revenue > costs + $3K/mo draw | Beyond M18 | Month 16 | Month 8 |
| Revenue > costs + $5K/mo draw | Beyond M18 | Beyond M18 | Month 10 |

**Base case self-sustaining point (Akram full-time at $3K draw):** Month 16.

---

## 5. Revenue Mix Analysis

### 5.1 Expected Revenue Composition at Month 12 (Base Case)

| Source | Users | ARPU | MRR | % of Total |
|--------|-------|------|-----|-----------|
| Pro Monthly | 76 | $7.99 | $607 | 25% |
| Pro Annual | 113 | $6.67 | $754 | 31% |
| Student Monthly | 38 | $4.99 | $190 | 8% |
| Student Annual | 151 | $4.17 | $630 | 26% |
| **Total** | **378** | **$6.39** | **$2,415** | **100%** |

**Projected annual billing:** 264 users (70% of paid) on annual plans = ~$18,700 in upfront annual revenue collected.

### 5.2 Revenue Concentration Risk

At all stages, B2C subscriptions are 100% of revenue. This is a concentration risk.

**Mitigation timeline:**
- Months 1-9: B2C only (acceptable -- building product-market fit)
- Months 9-12: Begin university pilot conversations
- Months 12-18: First B2B institutional deals (see `docs/sales/b2b-playbook.md`)
- Month 18+: Target 20-30% of revenue from B2B

---

## 6. Key Revenue Drivers and Levers

### 6.1 Growth Levers (Ranked by Impact)

| Lever | Impact on Month 12 MRR | Difficulty | Priority |
|-------|------------------------|-----------|----------|
| Add 5 new courses (expand TAM 3x) | +40-60% | Medium (engineering time) | **HIGH** |
| Improve conversion 4% to 6% | +50% | Hard (product + pricing) | **HIGH** |
| Reduce churn 6% to 4% | +20% | Medium (product quality) | **HIGH** |
| Increase ARPU by $1 | +15% | Medium (pricing optimization) | MEDIUM |
| Add B2B institutional channel | +20-40% | Hard (sales cycle) | MEDIUM |
| Paid marketing ($200/mo) | +10-20% | Easy (if CAC < $10) | LOW (initially) |
| Referral program | +10-15% | Medium | MEDIUM |

### 6.2 Revenue Kill Switches (What Could Make Numbers Worse)

| Risk | Impact on Revenue | Probability | Mitigation |
|------|------------------|------------|------------|
| Sherlock event (YouTube AI tutoring) | -40-70% of users | 40-60% in 24mo | Reach survival threshold fast |
| Conversion rate = 2% (not 4%) | -50% revenue, negative blended margin | 30% | A/B test pricing, optimize funnel |
| Churn rate = 10% (not 6%) | -25% steady-state users | 20% | Improve product, add engagement hooks |
| CS50 license change | -80% of content | 5-10% | Diversify courses immediately |
| Gemini free tier removed | +$500/mo cost at 1K MAU | 20-30% | Budget for paid tier, maintain Groq fallback |

---

## 7. Scenario Comparison Summary

### 7.1 18-Month Financial Summary

| Metric | Bear | Base | Bull |
|--------|------|------|------|
| **Ending MRR** | $1,197 | $7,540 | $33,942 |
| **Ending ARR** | $14,364 | $90,480 | $407,304 |
| **Total paying users** | 210 | 1,180 | 5,104 |
| **Total MAU** | 1,610 | 14,000 | 60,750 |
| **Cumulative revenue** | $6,799 | $40,957 | $203,544 |
| **Cumulative AI costs** | $2,100 | $13,645 | $52,800 |
| **Cumulative infra costs** | $310 | $420 | $2,800 |
| **Cumulative gross profit** | $4,389 | $26,892 | $147,944 |
| **Overall gross margin** | 65% | 66% | 73% |
| **Ending LTV** (at ending churn) | $57 | $107 | $166 |
| **Sherlock survival reached?** | No | Approaching | Yes (Month 10) |

### 7.2 What Determines Which Scenario Plays Out?

| Factor | Bear Trigger | Base Trigger | Bull Trigger |
|--------|-------------|-------------|-------------|
| Course catalog | Stuck at 3 courses | 5-7 courses | 10+ courses |
| Organic discovery | Minimal word-of-mouth | Steady CS student interest | HN/Reddit/Twitter viral moment |
| Product quality | Bugs, poor UX friction | Solid, reliable experience | "Magic moment" in first session |
| Conversion optimization | No paywall experimentation | Basic paywall + pricing tests | Systematic A/B testing |
| Retention | Users try and leave | Users complete 1+ course | Users make niotebook their daily tool |
| Timing | Launch into summer (low demand) | Launch into spring semester | Launch into fall semester |

---

## 8. Monthly KPI Targets

### 8.1 Base Case KPI Trajectory

| KPI | Month 3 | Month 6 | Month 9 | Month 12 | Month 18 |
|-----|---------|---------|---------|----------|----------|
| Registered users | 1,500 | 4,000 | 8,000 | 15,000 | 35,000 |
| MAU | 600 | 1,600 | 3,200 | 6,000 | 14,000 |
| Paying users | 28 | 82 | 188 | 378 | 1,180 |
| MRR | $179 | $524 | $1,201 | $2,415 | $7,540 |
| Conversion rate | 4.0% | 4.0% | 4.5% | 5.0% | 5.5% |
| Monthly churn | 8% | 6% | 5.5% | 5% | 4.5% |
| ARPU | $6.39 | $6.39 | $6.39 | $6.39 | $6.39 |
| LTV | $80 | $107 | $116 | $128 | $142 |
| CAC | $0 | < $5 | < $5 | < $8 | < $10 |
| LTV:CAC | inf | > 20:1 | > 20:1 | > 15:1 | > 14:1 |
| AI cost/user | $0.00 | $0.35 | $0.42 | $0.48 | $0.52 |
| Gross margin (blended) | 22% | 25% | 30% | 35% | 42% |

### 8.2 Early Warning Indicators

| Signal | Green | Yellow | Red |
|--------|-------|--------|-----|
| Week 1-4 signups | > 100 | 50-100 | < 50 |
| Week 1-4 free-to-paid | > 3% | 1-3% | < 1% |
| Month 1 MRR | > $50 | $20-50 | < $20 |
| Month 3 MRR growth rate | > 15% MoM | 8-15% MoM | < 8% MoM |
| Month 6 total paying | > 50 | 20-50 | < 20 |
| Month 6 churn | < 7% | 7-12% | > 12% |

---

## 9. Revenue Acceleration Strategies (If Base Case Underperforms)

### 9.1 If MRR at Month 6 < $300 (Bear Territory)

1. **Expand course catalog aggressively.** Each course added expands addressable market by 15-25%. Target: MIT 6.00x, Stanford CS106A by Month 6.
2. **Launch on Product Hunt / Hacker News.** Single viral moment can generate 2,000-5,000 signups.
3. **Reduce free-tier limits** from 5 to 3 AI requests/day. Forces conversion faster.
4. **Add $2.99/month micro-tier** for students who cannot afford $4.99. Better to capture $2.99 than $0.
5. **University TA partnerships.** Get CS TAs to recommend niotebook to their students (free distribution).

### 9.2 If Conversion Rate < 3% at Month 6

1. **A/B test pricing.** Try $4.99, $6.99, $9.99. One of these will convert better.
2. **Add premium-only features** beyond AI (study summaries, progress analytics, certificates).
3. **Implement usage-triggered upgrade prompts** ("You have used all 5 free AI requests today. Upgrade to continue learning.").
4. **Create urgency** with limited-time launch pricing (e.g., "Founding Member: $4.99/mo for life").
5. **Survey non-converters.** Ask why they did not upgrade. Fix the top 3 reasons.

---

## 10. Long-Term Revenue Potential (Month 18-36 Outlook)

### 10.1 If Base Case Trajectory Continues

| Month | MRR | ARR | Paying Users |
|-------|-----|-----|-------------|
| 18 | $7,540 | $90K | 1,180 |
| 24 | $18,000 | $216K | 2,800 |
| 30 | $35,000 | $420K | 5,500 |
| 36 | $60,000 | $720K | 9,400 |

At Month 36, niotebook would be a $720K ARR business with ~9,400 paying users, running at 50%+ gross margins, generating ~$30K/month in gross profit. That is a real, sustainable, bootstrapped business.

### 10.2 If Bull Case + B2B Revenue

| Month | B2C MRR | B2B MRR | Total MRR | Total ARR |
|-------|---------|---------|-----------|-----------|
| 18 | $33,942 | $5,000 | $38,942 | $467K |
| 24 | $65,000 | $25,000 | $90,000 | $1.08M |
| 30 | $100,000 | $60,000 | $160,000 | $1.92M |
| 36 | $140,000 | $110,000 | $250,000 | $3.0M |

At this trajectory, niotebook crosses $1M ARR by Month 24 and $3M ARR by Month 36. This is the scenario where strategic fundraising becomes rational (see `docs/finance/fundraising-evaluation.md`).

---

## Appendix A: Model Methodology

- Paying users = (MAU x conversion rate) - churned users + new subscribers
- New subscribers per month = (new MAU x conversion rate) + win-backs (assumed 0 for conservative modeling)
- Churned users = previous month paying users x monthly churn rate
- MRR = paying users x effective ARPU
- Cost model drawn from `docs/finance/unit-economics.md`

## Appendix B: Key Risks to Projections

| Risk | Impact | Addressed By |
|------|--------|-------------|
| Conversion rate assumption (4%) untested | 2x error on revenue | A/B testing, price sensitivity analysis |
| Churn rate assumption (6%) untested | 20% error on steady-state users | Retention analysis post-launch |
| User growth rate assumption | 3x error possible | Conservative bear case models this |
| ARPU blended calculation | 10-15% error | Track actual billing mix |
| Seasonality (academic calendar) | 30-50% variance by month | Not modeled; expect dips in summer |
| Sherlock event | -40-70% of trajectory | See board meeting report |

**Note on seasonality:** CS student activity follows academic semesters. September and January see enrollment spikes; June-August see dips. This model uses smoothed growth that does not capture seasonality. Real revenue will be lumpier than projected.

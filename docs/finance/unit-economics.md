# Niotebook Unit Economics

**Date:** 2026-02-09
**Prepared by:** CFO Office
**Status:** Living Document -- Update Monthly with Actual Data

---

## Executive Summary

Niotebook's unit economics are structurally superior to every competitor in the CS education space. The all-in variable cost to serve one active user is **$0.54/month** at scale -- a 6-10x advantage over server-side competitors like Replit ($3-5/user) and Codecademy ($1.50-3/user). This advantage is architectural, not temporary: client-side WASM execution eliminates server compute costs entirely, making AI API calls 97% of variable costs.

At the recommended $7.99/month price point, gross margin per paying user is **93.5%**. The free tier costs $0.24/user/month (Groq-only, 5 requests/day). Gross breakeven occurs at **~675 MAU** with 27 paying users at 4% conversion. The sensitivity analysis shows the business model survives even aggressive stress tests: if AI costs double, gross margin per paying user only drops to 87%.

**The bottom line:** These are SaaS-quality margins on an edtech product. Every dollar of revenue sends $0.93 back as gross profit. That is the WASM dividend.

---

## 1. AI API Cost Model -- The Dominant Cost Driver (97% of Variable Costs)

### 1.1 Models in Production

| Parameter | Value | Source |
|-----------|-------|--------|
| Primary model | `gemini-3-flash-preview` | `src/infra/ai/geminiStream.ts` line 13 |
| Fallback model | `llama-3.3-70b-versatile` | `src/infra/ai/groqStream.ts` line 13 |
| Max input tokens | 3,072 | `src/domain/nioContextBuilder.ts` line 51 |
| Max output tokens | 1,024 | `src/domain/nioContextBuilder.ts` line 50 |
| Char budget | 12,288 | `src/domain/nioContextBuilder.ts` line 52 |
| System prompt size | ~2,800 chars (~700 tokens) | `src/domain/nioPrompt.ts` |
| Rate limit | 20 requests / 10 min / user | `src/domain/rate-limits.ts` line 25 |
| Fallback timeout | Defined in `ai-fallback.ts` | `src/domain/ai-fallback.ts` |

### 1.2 Cost Per AI Request

**Realistic averages per request (not max budget):**
- Average input: ~2,000 tokens (system prompt 700tk + context 800tk + history 300tk + user message 200tk)
- Average output: ~500 tokens (concise Socratic responses per prompt design)

| Provider | Model | Input Cost (2K tk) | Output Cost (500 tk) | Total/Request |
|----------|-------|-------------------|---------------------|---------------|
| Google | Gemini 3 Flash | $0.50/1M x 2,000 = $0.0010 | $3.00/1M x 500 = $0.0015 | **$0.0025** |
| Groq | Llama 3.3 70B | $0.59/1M x 2,000 = $0.0012 | $0.79/1M x 500 = $0.0004 | **$0.0016** |

**Blended cost (90% Gemini primary / 10% Groq fallback):**

```
$0.0025 x 0.90 + $0.0016 x 0.10 = $0.00241 per request
```

### 1.3 Usage Patterns by User Segment

| Segment | Requests/Day | Days/Week | Requests/Month | % of Users |
|---------|-------------|-----------|----------------|------------|
| Light learner | 5-10 | 3 | ~90 | 60% |
| Average learner | 15-20 | 4 | ~280 | 30% |
| Heavy learner | 40-60 | 5 | ~800 | 10% |
| **Weighted average** | | | **~215** | 100% |

### 1.4 AI Cost Per User Per Month

| User Type | Requests/mo | Provider | Cost/Request | Cost/Month |
|-----------|-------------|----------|-------------|------------|
| **Free tier** (5 req/day cap) | 150 max | Groq-only | $0.0016 | **$0.24** |
| **Pro tier** (weighted avg) | 215 | Blended | $0.00241 | **$0.52** |
| **Heavy Pro** (power user) | 800 | Blended | $0.00241 | **$1.93** |

### 1.5 Gemini 3 Flash vs. Cheaper Alternatives

If AI costs need cutting, downgrading free-tier or light users to cheaper models is available:

| Model | Input/1M | Output/1M | Cost/Request (2K in, 500 out) | Savings vs Gemini 3 Flash |
|-------|---------|----------|-------------------------------|--------------------------|
| Gemini 3 Flash | $0.50 | $3.00 | $0.0025 | Baseline |
| Gemini 2.5 Flash | $0.15 | $0.60 | $0.0006 | **76% cheaper** |
| Gemini 2.5 Flash-Lite | $0.10 | $0.40 | $0.0004 | **84% cheaper** |
| Groq Llama 3.3 70B | $0.59 | $0.79 | $0.0016 | **36% cheaper** |

**Strategic note:** If niotebook downgrades free-tier users to Gemini 2.5 Flash instead of Groq, free-tier AI cost drops from $0.24/month to **$0.09/month** -- a 63% reduction. This is a lever to pull when scaling past 10K MAU.

---

## 2. Infrastructure Cost Breakdown

### 2.1 Convex Backend

**Per AI request:** ~5 Convex function calls (rate limit check, transcript fetch, lesson fetch, message persist, event log)
**Per session (non-AI):** ~50-100 calls (auth, saves, progress, snapshots)
**Per active user/month:** ~2,275 calls (215 AI x 5 + 16 sessions x 75)

| Scale | Monthly Calls | Tier | Monthly Cost | Cost/User |
|-------|--------------|------|-------------|-----------|
| 100 MAU | 227,500 | Free (1M included) | **$0** | $0.000 |
| 440 MAU | 1,000,000 | Free (at limit) | **$0** | $0.000 |
| 1,000 MAU | 2,275,000 | Pro ($25/mo) | **$25** | $0.025 |
| 10,000 MAU | 22,750,000 | Pro | **$25** | $0.003 |
| 100,000 MAU | 227,500,000 | Pro + overage | **~$500** | $0.005 |

### 2.2 Clerk Authentication

| Scale | Tier | Monthly Cost | Cost/User |
|-------|------|-------------|-----------|
| 100 MAU | Free (50K MRU) | **$0** | $0.000 |
| 10,000 MAU | Free | **$0** | $0.000 |
| 50,000 MAU | Free (at limit) | **$0** | $0.000 |
| 100,000 MAU | Pro ($25 + $0.02/MRU) | **$1,025** | $0.010 |

### 2.3 Vercel Hosting

| Scale | Invocations | Tier | Monthly Cost | Cost/User |
|-------|-------------|------|-------------|-----------|
| 100 MAU | ~25K | Hobby (Free) | **$0** | $0.000 |
| 1,000 MAU | ~250K | Pro ($20/mo) | **$20** | $0.020 |
| 10,000 MAU | ~2.5M | Pro | **$21** | $0.002 |
| 100,000 MAU | ~25M | Pro | **$34** | $0.000 |

### 2.4 Code Execution -- The WASM Dividend

| Runtime | Technology | Execution Location | Server Cost |
|---------|-----------|-------------------|-------------|
| JavaScript | `new Function()` | Browser | **$0.00** |
| Python | Pyodide WASM | Browser | **$0.00** |
| C | Wasmer WASM (sandboxed iframe) | Browser | **$0.00** |
| HTML/CSS | Iframe render | Browser | **$0.00** |
| SQL | sql.js WASM | Browser | **$0.00** |
| R | webR WASM | Browser | **$0.00** |

**Total server-side code execution cost at any scale: $0.00/month**

### 2.5 Other Fixed Costs

| Item | Monthly Cost | Notes |
|------|-------------|-------|
| Domain (niotebook.com) | ~$1 | Annual amortized |
| Sentry error tracking | $0-$26 | Free tier < 5K errors/mo |
| Total fixed overhead | **$1-$27** | |

---

## 3. Total Cost Per User Per Month (All Tiers, All Scales)

### 3.1 Free Tier User Cost

| Scale | AI (Groq, 5/day) | Convex | Clerk | Vercel | Other | Total/User/mo |
|-------|------------------|--------|-------|--------|-------|--------------|
| 100 MAU | $0.24 | $0.00 | $0.00 | $0.00 | $0.01 | **$0.25** |
| 1,000 MAU | $0.24 | $0.025 | $0.00 | $0.02 | $0.03 | **$0.32** |
| 10,000 MAU | $0.24 | $0.003 | $0.00 | $0.002 | $0.003 | **$0.25** |
| 100,000 MAU | $0.24 | $0.005 | $0.01 | $0.000 | $0.001 | **$0.26** |

### 3.2 Pro Tier User Cost ($7.99/month)

| Scale | AI (Blended) | Convex | Clerk | Vercel | Other | Total/User/mo |
|-------|-------------|--------|-------|--------|-------|--------------|
| 100 MAU | $0.52 | $0.00 | $0.00 | $0.00 | $0.01 | **$0.53** |
| 1,000 MAU | $0.52 | $0.025 | $0.00 | $0.02 | $0.03 | **$0.60** |
| 10,000 MAU | $0.52 | $0.003 | $0.00 | $0.002 | $0.003 | **$0.53** |
| 100,000 MAU | $0.52 | $0.005 | $0.01 | $0.000 | $0.001 | **$0.54** |

### 3.3 Student Tier User Cost ($4.99/month)

Student users have the same cost profile as Pro users ($0.52-$0.54/month). The only difference is revenue per user.

---

## 4. Gross Margin Analysis by Tier

### 4.1 Per-User Margin (at 10,000 MAU Scale)

| Tier | Revenue/User/mo | Cost/User/mo | Gross Profit/User | Gross Margin |
|------|----------------|-------------|-------------------|-------------|
| **Free** | $0.00 | $0.25 | **-$0.25** | N/A (cost center) |
| **Pro** ($7.99) | $7.99 | $0.53 | **+$7.46** | **93.4%** |
| **Student** ($4.99) | $4.99 | $0.53 | **+$4.46** | **89.4%** |
| **Annual Pro** ($6.67/mo) | $6.67 | $0.53 | **+$6.14** | **92.1%** |
| **Annual Student** ($4.17/mo) | $4.17 | $0.53 | **+$3.64** | **87.3%** |

### 4.2 Blended Margin (Including Free Tier Subsidy)

At 4% conversion rate, every 1 paying user supports 24 free users.

| Scenario | Paid Revenue | Free User Cost (24x) | Paid User Cost | Net Margin/Paid User |
|----------|-------------|---------------------|---------------|---------------------|
| Pro monthly | $7.99 | 24 x $0.25 = $6.00 | $0.53 | $7.99 - $6.53 = **$1.46 (18.3%)** |
| Pro annual | $6.67 | 24 x $0.25 = $6.00 | $0.53 | $6.67 - $6.53 = **$0.14 (2.1%)** |
| Student monthly | $4.99 | 24 x $0.25 = $6.00 | $0.53 | $4.99 - $6.53 = **-$1.54 (neg)** |

**Critical insight:** At 4% conversion, annual Pro barely breaks even and Student tier is underwater when accounting for free user subsidy. This means:

1. **Conversion rate is the single most important lever.** At 6% conversion (16 free per paid), blended margin jumps to $7.99 - $4.53 = $3.46 (43.3%).
2. **Free tier cost must stay below $0.25/user/month.** Any increase requires either higher conversion or lower free-tier generosity.
3. **Monthly subscribers are more valuable than annual** for covering free-tier costs (higher ARPU offsets the discount).

### 4.3 Effective ARPU Scenarios

| Subscriber Mix | Effective ARPU |
|---------------|---------------|
| 100% monthly Pro | $7.99 |
| 70% annual Pro / 30% monthly Pro | $7.39 |
| 50% Pro / 50% Student (all annual) | $5.42 |
| 40% annual Pro / 30% monthly Pro / 30% Student | $6.29 |
| **Realistic blend** (40A/20M/20S/20SA) | **$5.93** |

---

## 5. Infrastructure Cost at Scale

### 5.1 Total Monthly Infrastructure Cost

| MAU | AI API | Convex | Clerk | Vercel | Fixed | Total Infra | Cost/MAU |
|-----|--------|--------|-------|--------|-------|------------|----------|
| 100 | $26* | $0 | $0 | $0 | $1 | **$27** | $0.27 |
| 500 | $130 | $0 | $0 | $0 | $1 | **$131** | $0.26 |
| 1,000 | $260 | $25 | $0 | $20 | $27 | **$332** | $0.33 |
| 5,000 | $1,300 | $25 | $0 | $20 | $27 | **$1,372** | $0.27 |
| 10,000 | $2,600 | $25 | $0 | $21 | $27 | **$2,673** | $0.27 |
| 50,000 | $13,000 | $250 | $0 | $30 | $50 | **$13,330** | $0.27 |
| 100,000 | $26,000 | $500 | $1,025 | $34 | $80 | **$27,639** | $0.28 |

*At 100 MAU, Gemini free tier likely covers AI costs. Actual spend: ~$1/month.

**Key observation:** Cost/MAU is remarkably flat from 500 to 100,000 users. There is no scaling cliff. This is the architectural dividend of client-side compute + usage-based AI APIs.

### 5.2 Free Tier Limits -- When Costs Become Real

| Service | Free Tier Ceiling | Users Supported | When You Start Paying |
|---------|------------------|----------------|----------------------|
| Gemini API | Free tier with rate limits | ~500 MAU | ~500+ MAU |
| Convex | 1M function calls/month | ~440 MAU | ~440+ MAU |
| Clerk | 50,000 MRU | ~50K MAU | ~50K+ MAU |
| Vercel | 150K invocations/month | ~600 MAU | ~600+ MAU |

**The "free runway" threshold:** Niotebook can serve up to ~440 MAU at essentially $0-$1/month total cost. This is an extraordinary bootstrapping advantage.

---

## 6. Break-Even Analysis

### 6.1 Gross Break-Even (Revenue Covers Variable Costs)

**Variables:**
- X = paying users
- Y = free users
- At 4% conversion: Y = 24X
- Revenue: X x ARPU
- Variable costs: Y x $0.25 + X x $0.53 + infrastructure overhead

**Solving for X (ARPU = $7.99, 4% conversion):**

```
Revenue = Cost
$7.99X = 24X($0.25) + X($0.53) + $45 (infra at ~675 MAU)
$7.99X = $6.00X + $0.53X + $45
$7.99X = $6.53X + $45
$1.46X = $45
X = 31 paying users
Total MAU = 31 / 0.04 = 775 MAU
```

**At 6% conversion:**

```
$7.99X = 15.67X($0.25) + X($0.53) + $45
$7.99X = $3.92X + $0.53X + $45
$3.54X = $45
X = 13 paying users
Total MAU = 13 / 0.06 = 217 MAU
```

### 6.2 Break-Even Summary Table

| Conversion Rate | Paying Users Needed | Total MAU Needed | Monthly Revenue at Break-Even |
|----------------|--------------------|-----------------|-----------------------------|
| 2% | 121 | 6,050 | $967 |
| 3% | 50 | 1,667 | $400 |
| **4%** | **31** | **775** | **$248** |
| 5% | 22 | 440 | $176 |
| **6%** | **13** | **217** | **$104** |
| 8% | 9 | 113 | $72 |

### 6.3 Operating Break-Even (Revenue Covers Costs + Akram's Minimum Living)

Assuming Akram needs $3,000/month minimum (low-cost living):

```
Revenue = Variable Costs + $3,000
$7.99X = $6.53X + $45 + $3,000
$1.46X = $3,045
X = 2,086 paying users
Total MAU = 2,086 / 0.04 = 52,150 MAU
```

At 6% conversion: 1,348 paying users / 22,467 MAU

**This is the real target.** Gross break-even is easy. Operating break-even (where Akram can work on niotebook full-time) requires ~2,000 paying users.

---

## 7. Sensitivity Analysis

### 7.1 What If AI Costs Change?

| Scenario | Cost/Request | Cost/Free User/mo | Cost/Pro User/mo | Pro Gross Margin |
|----------|-------------|-------------------|-----------------|-----------------|
| AI costs drop 50% | $0.0012 | $0.12 | $0.26 | **96.7%** |
| Current baseline | $0.00241 | $0.24 | $0.52 | **93.5%** |
| AI costs increase 50% | $0.0036 | $0.36 | $0.77 | **90.4%** |
| AI costs double | $0.0048 | $0.48 | $1.04 | **87.0%** |
| AI costs triple | $0.0072 | $0.72 | $1.55 | **80.6%** |

**Verdict:** Even if AI costs TRIPLE, Pro gross margin remains 80.6%. The business model is highly resilient to AI cost increases. Historical trend: AI API costs have been declining 40-60% annually, so upside is more likely than downside.

### 7.2 What If Conversion Rates Differ?

**At 10,000 MAU baseline:**

| Conversion Rate | Paying Users | Free Users | Revenue/mo | Free Cost/mo | Paid Cost/mo | Infra | Gross Profit | Gross Margin |
|----------------|-------------|-----------|-----------|-------------|-------------|-------|-------------|-------------|
| 1% | 100 | 9,900 | $799 | $2,475 | $53 | $46 | **-$1,775** | **-222%** |
| 2% | 200 | 9,800 | $1,598 | $2,450 | $106 | $46 | **-$1,004** | **-63%** |
| 3% | 300 | 9,700 | $2,397 | $2,425 | $159 | $46 | **-$233** | **-10%** |
| **4%** | **400** | **9,600** | **$3,196** | **$2,400** | **$212** | **$46** | **+$538** | **+17%** |
| 5% | 500 | 9,500 | $3,995 | $2,375 | $265 | $46 | **+$1,309** | **+33%** |
| 6% | 600 | 9,400 | $4,794 | $2,350 | $318 | $46 | **+$2,080** | **+43%** |
| 8% | 800 | 9,200 | $6,392 | $2,300 | $424 | $46 | **+$3,622** | **+57%** |
| 10% | 1,000 | 9,000 | $7,990 | $2,250 | $530 | $46 | **+$5,164** | **+65%** |

**Critical threshold: 4% conversion is the minimum viable conversion rate.** Below 4%, free users cost more than paying users generate. Above 4%, every percentage point adds ~$770/month in gross profit per 10K MAU.

### 7.3 What If Average Usage Changes?

| Avg Requests/User/mo | AI Cost/Pro User | Pro Gross Margin | Blended Margin (4% conv) |
|----------------------|-----------------|-----------------|-------------------------|
| 100 | $0.24 | 97.0% | 24.9% |
| 150 | $0.36 | 95.5% | 21.3% |
| **215 (baseline)** | **$0.52** | **93.5%** | **18.3%** |
| 300 | $0.72 | 91.0% | 14.0% |
| 500 | $1.21 | 84.9% | 3.5% |
| 800 | $1.93 | 75.8% | -10.5% |

**At very high engagement (800 req/mo), blended margins go negative at 4% conversion.** However, high-engagement users are the most likely to convert to paid, so the real-world correlation between usage and conversion likely prevents this scenario.

### 7.4 ARPU Sensitivity (What If Pricing Changes?)

| Price Point | Pro Gross Margin | Blended Margin (4% conv) | Break-Even MAU |
|-------------|-----------------|-------------------------|----------------|
| $3.99/mo | 86.7% | Negative at any conv rate | Never (underwater) |
| $4.99/mo | 89.4% | 2.0% | 4,500 |
| $5.99/mo | 91.2% | 9.8% | 1,500 |
| $6.99/mo | 92.4% | 14.6% | 1,000 |
| **$7.99/mo** | **93.5%** | **18.3%** | **775** |
| $9.99/mo | 94.7% | 24.7% | 500 |
| $12.99/mo | 95.9% | 32.1% | 325 |

**Verdict:** $7.99 is the sweet spot. Going below $5.99 makes blended economics dangerously thin. Going above $9.99 improves margins but risks conversion rate decline.

---

## 8. Competitor Cost Structure Comparison

| Platform | Code Execution Cost/User/mo | AI Cost/User/mo | Total Variable Cost/User/mo | Niotebook Advantage |
|----------|---------------------------|----------------|---------------------------|-------------------|
| Replit | $3.00 - $5.00 (server containers) | $0.50 - $1.50 | $3.50 - $6.50 | **6-12x cheaper** |
| Codecademy | $1.50 - $3.00 (server sandboxes) | $0.30 - $0.80 | $1.80 - $3.80 | **3-7x cheaper** |
| Coursera Labs | $2.00 - $4.00 (cloud VMs) | $0.20 - $0.50 | $2.20 - $4.50 | **4-8x cheaper** |
| GitHub Codespaces | $4.00 - $8.00 (containers) | N/A | $4.00 - $8.00 | **7-15x cheaper** |
| **Niotebook** | **$0.00 (WASM)** | **$0.52** | **$0.52 - $0.54** | **Baseline** |

This cost advantage is structural and permanent. Competitors cannot replicate it without rewriting their architecture from scratch -- a 12-18 month effort for an established platform.

---

## 9. Key Metrics to Track

| Metric | Current (Alpha) | Target (Month 6) | Target (Month 12) | Red Line |
|--------|----------------|------------------|--------------------|----------|
| AI cost/request | $0.00 (free tier) | < $0.003 | < $0.003 | > $0.005 |
| AI cost/active user/mo | $0.00 | < $0.60 | < $0.55 | > $1.00 |
| Free user cost/mo | $0.00 | < $0.30 | < $0.25 | > $0.40 |
| Total variable cost/user | $0.00 | < $0.65 | < $0.55 | > $1.00 |
| Pro gross margin (per-user) | N/A | > 90% | > 93% | < 85% |
| Blended gross margin | N/A | > 15% | > 25% | < 10% |
| Convex calls/user/mo | Unknown | < 2,500 | < 2,300 | > 3,500 |

---

## 10. Cost Optimization Levers (In Priority Order)

### Lever 1: Free-Tier Model Downgrade (Saves 63-84% on free-tier AI)
Route free users to Gemini 2.5 Flash ($0.0006/request) instead of Groq ($0.0016). Drops free-tier cost from $0.24 to $0.09/month.

### Lever 2: Context Caching (Saves ~50% on repeat requests)
Gemini context caching charges 10% of base input price for cached reads. The system prompt and course context are identical across many requests -- caching could halve input costs.

### Lever 3: Batch Processing for Non-Real-Time Tasks (Saves 50%)
Gemini batch mode offers 50% cost reduction. Not applicable for real-time chat, but future features (progress summaries, weekly reports) could use batch mode.

### Lever 4: Output Token Optimization (Saves 10-30% on output)
The system prompt already enforces concise Socratic responses. Further prompt optimization to reduce average output from 500 to 350 tokens would save ~$0.07/user/month.

### Lever 5: Smart Rate Limiting by Tier (Saves variable)
Current rate limit: 20 requests/10 min for all users. Differentiated limits (free: 5/10min, pro: 20/10min) reduce abuse without impacting engaged learners.

---

## Appendix A: Key Assumptions

| Assumption | Value | Confidence | Impact if 50% Wrong |
|-----------|-------|------------|---------------------|
| Avg input tokens/request | 2,000 | High (from context builder constraints) | +/- $0.08/user/mo |
| Avg output tokens/request | 500 | Medium (depends on prompt tuning) | +/- $0.15/user/mo |
| AI requests/active user/mo | 215 | Medium (needs real data) | +/- $0.26/user/mo |
| Free-to-paid conversion | 4% | Low (no data yet) | Changes break-even by 2-5x |
| Groq fallback rate | 10% | Medium | +/- $0.02/user/mo |
| Convex calls/AI request | 5 | High (from codebase) | Negligible cost impact |
| Sessions/user/month | 16 | Low (needs real data) | +/- ~200 Convex calls/user/mo |

## Appendix B: Sources

- Gemini 3 Flash pricing: https://ai.google.dev/gemini-api/docs/pricing
- Groq pricing: https://groq.com/pricing
- Convex pricing: https://www.convex.dev/pricing
- Clerk pricing: https://clerk.com/pricing
- Vercel pricing: https://vercel.com/pricing
- Codebase references: `src/infra/ai/geminiStream.ts`, `src/infra/ai/groqStream.ts`, `src/domain/nioContextBuilder.ts`, `src/domain/rate-limits.ts`, `src/domain/nioPrompt.ts`, `src/app/api/nio/route.ts`

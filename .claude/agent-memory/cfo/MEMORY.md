# CFO Memory -- Key Financial Data

## Unit Economics (Feb 2026)
- AI cost per request (Gemini 3 Flash paid): $0.0025 (2K input, 500 output tokens avg)
- AI cost per request (Groq Llama 3.3 70B): $0.0016
- Blended AI cost per request (90/10 split): $0.00241
- Average AI requests per active user/month: 215
- AI cost per active user/month: $0.52
- Free tier user AI cost (5 req/day, Groq-only): $0.24/month
- Total variable cost per user at scale: $0.54/month
- WASM code execution cost: $0.00 (all client-side)
- Cost optimization lever: Gemini 2.5 Flash = $0.0006/req (76% cheaper than 3 Flash)

## Infrastructure Free Tier Limits
- Gemini: Free tier with rate limits (sufficient for <500 MAU)
- Convex: 1M function calls/month free (sufficient for <440 MAU)
- Clerk: 50,000 MRUs free (sufficient for <50K MAU)
- Vercel: 150K invocations free (sufficient for <600 MAU)

## Pricing Strategy (Recommended: Freemium)
- Free tier: 5 AI requests/day, Groq-only, all courses
- Pro: $7.99/month ($79.99/year)
- Student: $4.99/month ($49.99/year) with .edu verification
- Founding Member: $4.99/month for life (first 100 subscribers)
- Gross breakeven: ~775 MAU (31 paying users at 4% conversion)
- Operating breakeven (Akram $3K/mo): ~2,086 paying users
- Sherlock survival threshold: 1,000 paying users / $8,000 MRR

## Revenue Projections (18-Month, Base Case)
- Month 6: $524 MRR, 82 paying users
- Month 12: $2,415 MRR, 378 paying users
- Month 18: $7,540 MRR, 1,180 paying users
- Cumulative revenue (18mo): $40,957
- Self-sustaining ($3K draw): Month 16

## Key Models & Rates (from codebase)
- Primary AI: gemini-3-flash-preview (src/infra/ai/geminiStream.ts:13)
- Fallback AI: llama-3.3-70b-versatile (src/infra/ai/groqStream.ts:13)
- Token budget: 3,072 input / 1,024 output max (nioContextBuilder.ts:50-51)
- Rate limit: 20 requests per 10 minutes per user (rate-limits.ts:25)
- System prompt: ~2,800 chars (nioPrompt.ts)
- Convex calls per AI request: ~5

## Competitor Price Points (Updated Feb 2026)
- Khan/Khanmigo: $4/mo ($44/yr); Districts: $35/student/yr
- Codecademy Plus: $14.99/mo annual; Pro: $19.99/mo annual
- Brilliant: $10.79/mo annual ($27.99 monthly)
- Coursera Plus: $33.25/mo annual ($59 monthly)
- Replit Core: $20/mo annual ($25 monthly); New Pro: $100/mo
- DataCamp Premium: ~$13/mo annual ($43 monthly); Student: $149/yr

## B2B Institutional Pricing
- Classroom (10-49 seats): $4.99/seat/mo
- Department (50-199 seats): $3.99/seat/mo
- Campus (200-999 seats): $2.99/seat/mo
- B2B LTV:CAC estimate: 45:1 (PLG model)

## Key Documents
- Board report: docs/strategy/board-meeting-cfo-financial-survivability.md (2026-02-08)
- Unit economics: docs/finance/unit-economics.md (2026-02-09)
- Revenue projections: docs/finance/revenue-projections.md (2026-02-09)
- Fundraising evaluation: docs/finance/fundraising-evaluation.md (2026-02-09)
- Pricing strategy: docs/sales/pricing-strategy.md (2026-02-09)
- B2B playbook: docs/sales/b2b-playbook.md (2026-02-09)
- Conversion optimization: docs/sales/conversion-optimization.md (2026-02-09)

## Critical Sensitivities
- 4% conversion is minimum viable (below this, free users cost more than paid generate)
- Each 1% conversion improvement = $770/mo gross profit per 10K MAU
- AI cost tripling still yields 80.6% Pro gross margin
- Annual Pro at 4% conversion barely breaks even on blended basis (2.1% margin)
- $7.99 price floor: below $5.99, blended economics dangerously thin

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

## Infrastructure Free Tier Limits
- Gemini: Free tier with rate limits (sufficient for <500 MAU)
- Convex: 1M function calls/month free (sufficient for <440 MAU)
- Clerk: 50,000 MRUs free (sufficient for <50K MAU)
- Vercel: 150K invocations free (sufficient for <600 MAU)

## Pricing Strategy (Recommended: Freemium)
- Free tier: 5 AI requests/day, Groq-only, all courses
- Pro: $7.99/month ($79.99/year)
- Student: $4.99/month with .edu verification
- Gross breakeven: ~675 MAU (27 paying users at 4% conversion)
- Sherlock survival threshold: 1,000 paying users / $8,000 MRR

## Key Models & Rates (from codebase)
- Primary AI: gemini-3-flash-preview
- Fallback AI: llama-3.3-70b-versatile
- Token budget: 3,072 input / 1,024 output max
- Rate limit: 20 requests per 10 minutes per user
- System prompt: ~2,800 chars

## Competitor Price Points
- Khan/Khanmigo: $4/mo (AI tutor, no code)
- Codecademy Plus: $17.49/mo annual
- Brilliant: $13.49/mo annual
- Coursera Plus: $33.25/mo annual
- Replit Core: $20/mo annual

## Board Report
- Full report: docs/strategy/board-meeting-cfo-financial-survivability.md
- Date: 2026-02-08

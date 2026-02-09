# Operational Checklist

**Date:** 2026-02-09
**Classification:** Administrative / Internal
**Analyst:** Business Intelligence (Claude Agent)
**Related:** `docs/administration/incorporation-guide.md`, `docs/administration/licensing-compliance.md`

---

## Executive Summary

- **Niotebook has 23 critical operational items to complete before public launch and paid tier.** These span legal, financial, brand protection, and infrastructure domains. Most can be completed in 2-4 weeks by a solo founder with $1,000-$3,000 budget.
- **The highest-priority items are: (1) privacy policy and terms of service, (2) incorporation, (3) business bank account, and (4) CS50 permission request.** These are prerequisites for accepting payments and operating legally.
- **Trademark search for "niotebook" returned no results on USPTO,** suggesting the name is likely available for trademark registration. However, "notebook" is a common English word, and the deliberate misspelling may face examiner scrutiny. Recommend filing an intent-to-use (ITU) trademark application before public launch.
- **Domain portfolio is minimal.** Secure niotebook.com (if not already owned), key variants, and common misspellings.
- **Annual compliance calendar has 6-8 recurring deadlines** depending on jurisdiction, requiring a tracking system (even a simple calendar reminder).

---

## 1. Pre-Launch Legal Checklist

### 1.1 Critical Path Items (Must Complete Before Public Launch)

| # | Item | Status | Priority | Est. Cost | Est. Time | Dependencies |
|---|------|--------|----------|-----------|-----------|-------------|
| 1 | **Draft and publish Privacy Policy** | NOT DONE | P0 | $0 (DIY template) - $1,000 (attorney review) | 1-2 days | None |
| 2 | **Draft and publish Terms of Service** | NOT DONE | P0 | $0 (DIY template) - $1,000 (attorney review) | 1-2 days | None |
| 3 | **Add CS50 attribution to all lesson pages** | NOT DONE | P0 | $0 | 2 hours | None |
| 4 | **Incorporate (Delaware C-Corp via Stripe Atlas)** | NOT DONE | P0 | $500 | 3-5 days | Decision to incorporate |
| 5 | **Obtain EIN from IRS** | NOT DONE | P0 | $0 | Same day | Incorporation (#4) |
| 6 | **File 83(b) election** | NOT DONE | P0 (30-day deadline) | $0 | 1 day | Founder stock issuance (#4) |
| 7 | **Open business bank account (Mercury)** | NOT DONE | P0 | $0 | 1-4 weeks | EIN (#5), Certificate of Incorporation (#4) |
| 8 | **Set up Stripe for payments** | NOT DONE | P1 | $0 | 1-2 hours | Bank account (#7) |
| 9 | **Register as foreign corporation in home state** | NOT DONE | P1 | $100-$500 | 1-2 weeks | Incorporation (#4) |
| 10 | **Add age verification (date of birth) at signup** | NOT DONE | P1 | $0 | 4 hours | None |
| 11 | **Implement cookie consent banner for EU users** | NOT DONE | P1 | $0 | 4-8 hours | None |
| 12 | **Email CS50 team requesting permission for commercial use** | NOT DONE | P0 | $0 | 30 minutes + wait | None |
| 13 | **Review YouTube embed compliance** | NOT DONE | P1 | $0 | 2 hours | None |

### 1.2 Pre-Revenue Items (Before Accepting First Payment)

| # | Item | Status | Priority | Est. Cost | Est. Time | Dependencies |
|---|------|--------|----------|-----------|-----------|-------------|
| 14 | **Add subscription/billing terms to TOS** | NOT DONE | P1 | $0 | 4 hours | TOS (#2), Stripe (#8) |
| 15 | **Implement refund policy** | NOT DONE | P1 | $0 | 2 hours | Stripe (#8) |
| 16 | **Set up bookkeeping (Wave or QuickBooks)** | NOT DONE | P1 | $0-$50/month | 2 hours | Bank account (#7) |
| 17 | **Document data retention policy** | NOT DONE | P2 | $0 | 2 hours | Privacy Policy (#1) |
| 18 | **Implement user account deletion** | NOT DONE | P2 | $0 | 1-2 days | GDPR compliance |

---

## 2. Business Insurance

### 2.1 Insurance Considerations

| Insurance Type | Needed? | When? | Estimated Cost | Coverage |
|---------------|---------|-------|---------------|---------|
| **General Liability** | Recommended | Before public launch | $300-$600/year | Bodily injury, property damage, personal injury claims |
| **Professional Liability (E&O)** | Recommended | Before paid tier | $500-$1,500/year | Errors and omissions, professional negligence (e.g., AI gives wrong advice that leads to academic consequences) |
| **Cyber Liability** | Consider | When handling 1,000+ users | $500-$2,000/year | Data breaches, cyber attacks, data loss |
| **Directors & Officers (D&O)** | Not needed | When raising VC or adding board members | $2,000-$10,000/year | Personal liability of directors/officers |

**Recommendation for current stage:** General Liability ($300-$600/year) provides baseline protection. Professional Liability is worth considering before the paid tier launches -- Niotebook's AI tutor could theoretically give incorrect guidance that impacts a student's academic standing, and an E&O policy provides protection against such claims.

### 2.2 Where to Get Insurance

| Provider | Type | Best For | Website |
|---------|------|---------|---------|
| Hiscox | Small business, professional liability | Solo founders, freelancers | hiscox.com |
| Next Insurance | General liability, E&O | Small businesses, tech startups | nextinsurance.com |
| Vouch | Startup-specific coverage | VC-backed startups | vouch.us |
| Embroker | Tech E&O, cyber | Growth-stage tech companies | embroker.com |

---

## 3. Accounting & Tax

### 3.1 Bookkeeping Setup

| Task | Tool | Cost | Priority |
|------|------|------|----------|
| Track all business expenses | Wave (free) or QuickBooks ($30/mo) | $0-$30/month | P1 |
| Separate personal and business expenses | Business bank account (Mercury) | $0 | P0 |
| Track subscription revenue | Stripe Dashboard + accounting integration | $0 | P1 |
| Save receipts for all business expenses | Expensify ($5/mo) or manual folder | $0-$5/month | P2 |

### 3.2 Tax Obligations (Delaware C-Corp)

| Tax | Rate | Due Date | Filing |
|-----|------|----------|--------|
| **Federal corporate income tax** | 21% of net income | March 15 (or Sept 15 with extension) | Form 1120 |
| **Delaware franchise tax** | $175-$400/year (APV method) | March 1 | Delaware Annual Report |
| **State corporate income tax** (home state) | Varies by state | Varies | State form |
| **Sales tax** | May apply to SaaS in some states | Monthly or quarterly | State-specific |
| **Payroll tax** (if paying yourself W-2) | 7.65% employer share | Per pay period | Form 941 |

### 3.3 SaaS Sales Tax

SaaS sales tax is a complex and evolving area. As of 2025-2026:

| State | SaaS Taxable? | Rate | Notes |
|-------|-------------|------|-------|
| Most US states | Varies | 4-10% | ~30 states tax SaaS; others exempt it |
| EU (VAT) | YES | 17-27% | Must collect VAT from EU customers |
| UK (VAT) | YES | 20% | Must register for UK VAT if revenue exceeds threshold |

**Simplification options:**
- **Stripe Tax:** Automatically calculates and collects sales tax/VAT for all transactions ($0.50/transaction)
- **Paddle / Lemon Squeezy:** Merchant of Record handles all tax compliance (included in their 5% fee)

**Recommendation:** At current scale (zero revenue), do not worry about SaaS sales tax. When revenue begins, use Stripe Tax ($0.50/transaction is negligible at low volume) or a Merchant of Record service. Revisit when revenue exceeds $10K/month.

### 3.4 When to Hire an Accountant

| Revenue Level | Accounting Approach | Estimated Cost |
|--------------|-------------------|---------------|
| $0-$1,000/month | DIY with Wave/QuickBooks | $0-$30/month |
| $1,000-$5,000/month | Part-time bookkeeper | $200-$500/month |
| $5,000-$25,000/month | CPA firm (Bench, Pilot, or local) | $500-$1,500/month |
| $25,000+/month | Full-service CFO/accounting | $2,000-$5,000/month |

---

## 4. Trademark Considerations

### 4.1 "Niotebook" Trademark Analysis

**USPTO search for "niotebook" returned no results,** which is a positive signal that the name is available for registration. However, several considerations apply:

| Factor | Analysis |
|--------|---------|
| **Availability** | No existing trademark for "niotebook" found. Strong signal for availability. |
| **Distinctiveness** | "Niotebook" is a deliberate misspelling of "notebook" -- a common English word. The misspelling adds some distinctiveness, but the close similarity to "notebook" may face examiner scrutiny under the "primarily merely descriptive" or "primarily geographically descriptively misdescriptive" grounds. |
| **Similar marks** | "Notebook" is used by many brands across multiple industries. The examiner may compare against existing "notebook" marks. Key question: is "niotebook" distinct enough from "notebook"? |
| **Class** | Trademark would be filed in International Class 9 (computer software) and/or Class 42 (SaaS, software services). |
| **Geographic** | US (USPTO) priority; Madrid Protocol for international if needed later. |

### 4.2 Trademark Registration Path

| Step | Action | Cost | Timeline |
|------|--------|------|----------|
| 1 | **Conduct comprehensive trademark search** (beyond USPTO -- state registers, common law marks, domain names) | $0 (DIY via USPTO TESS) or $300-$1,000 (professional search) | 1-3 days |
| 2 | **File Intent-to-Use (ITU) application** with USPTO | $250 per class (TEAS Plus) or $350 per class (TEAS Standard) | 30 minutes to file |
| 3 | **Wait for USPTO examination** | $0 | 6-12 months |
| 4 | **Respond to any office actions** (examiner objections) | $0 (DIY) or $500-$2,000 (attorney) | 3-6 months |
| 5 | **Publication for opposition** (30-day window for others to oppose) | $0 | 30 days |
| 6 | **File Statement of Use** (after actually using the mark in commerce) | $100 per class | Within 6 months of Notice of Allowance (extensions available) |
| **Total** | | **$350-$1,500** (DIY) or **$1,500-$4,000** (attorney) | **12-18 months** |

### 4.3 Trademark Recommendations

1. **File an ITU application promptly.** An ITU establishes your priority date (the date you filed), even before you are using the mark in commerce. This protects against others registering the name while Niotebook is in alpha.

2. **Consider using a trademark attorney.** The "descriptive vs. suggestive" analysis for "niotebook" (misspelling of "notebook") is nuanced. An attorney can assess the likelihood of approval and prepare arguments for distinctiveness.

3. **Document your use of the mark.** Keep records of when "niotebook" was first used in commerce (website launch date, first user signup, first social media post). This evidence is needed for the Statement of Use filing.

4. **Use the TM symbol (TM)** on marketing materials now. You can use TM without registration. The (R) symbol requires actual registration. Using TM puts others on notice of your claim.

---

## 5. Domain Portfolio

### 5.1 Domains to Secure

| Domain | Purpose | Priority | Estimated Cost |
|--------|---------|----------|---------------|
| **niotebook.com** | Primary domain | P0 (critical) | Already owned (assumed) |
| **niotebook.app** | Mobile/modern alternative | P1 | ~$14/year |
| **niotebook.io** | Tech/developer alternative | P1 | ~$30/year |
| **niotebook.dev** | Developer community | P2 | ~$12/year |
| **niotebook.org** | Community/educational use | P2 | ~$10/year |
| **getniotebook.com** | Marketing landing page | P2 | ~$12/year |
| **niotebook.co** | Short alternative | P2 | ~$25/year |
| **nio.education** | Brand extension | P3 | ~$15/year |

### 5.2 Common Misspelling Domains

| Domain | Misspelling Type | Priority |
|--------|-----------------|----------|
| **notebook.com** | Correct spelling | NOT AVAILABLE (owned by major company) |
| **niotbook.com** | Missing 'e' | P3 |
| **niotebok.com** | Transposed letters | P3 |

**Recommendation:** Secure niotebook.com (P0), niotebook.app (P1), and niotebook.io (P1) at minimum. Total cost: ~$56/year. The misspelling domains are low priority -- redirect them to the primary domain if acquired.

---

## 6. Communications & Infrastructure

### 6.1 Company Email Setup

| Option | Cost | Features | Recommendation |
|--------|------|----------|---------------|
| **Google Workspace** | $7.20/user/month | Gmail, Drive, Calendar, Meet | RECOMMENDED for solo founder; professional @niotebook.com email |
| **Microsoft 365** | $6/user/month | Outlook, OneDrive, Teams | Alternative |
| **Zoho Mail** | $1/user/month (or free for 5 users) | Email, basic office suite | Budget option |
| **Custom SMTP + alias** | $0 | Forward @niotebook.com to personal email | Minimal but functional |

**Recommended setup:**
1. Google Workspace Starter ($7.20/month) for akram@niotebook.com
2. Create aliases: support@niotebook.com, hello@niotebook.com, legal@niotebook.com, privacy@niotebook.com
3. Set up SPF, DKIM, and DMARC records for email deliverability

### 6.2 Critical Communication Channels

| Channel | Purpose | Priority | Tool |
|---------|---------|----------|------|
| **Support email** | User support requests | P0 | support@niotebook.com (Google Workspace) |
| **Privacy email** | GDPR data subject access requests | P0 | privacy@niotebook.com (alias) |
| **Legal email** | Legal notices, DMCA, etc. | P1 | legal@niotebook.com (alias) |
| **Status page** | Service availability communication | P1 | Betterstack (free tier) or Instatus |
| **Blog** | Product updates, SEO content | P1 | Built into Next.js app or Substack |
| **Social media** | Brand presence, community engagement | P2 | Twitter/X: @niotebook, GitHub: niotebook |

---

## 7. Annual Compliance Calendar

### 7.1 Recurring Deadlines

| Month | Deadline | Filing | Estimated Cost |
|-------|----------|--------|---------------|
| **January** | Beneficial Ownership Information report (if required) | FinCEN BOI report | $0 |
| **March 1** | Delaware franchise tax + annual report | Delaware Division of Corporations | $175-$400 |
| **March 15** | Federal corporate income tax (Form 1120) or extension request (Form 7004) | IRS | $0 (DIY) or $500-$2,000 (CPA) |
| **April 15** | Personal income tax (founder's individual return) | IRS Form 1040 | $0 (DIY) or $200-$500 (CPA) |
| **June** | Review and update Privacy Policy and TOS | Internal | $0 |
| **September 15** | Extended corporate tax return due (if extension filed) | IRS Form 1120 | Included in CPA fee |
| **October** | Domain renewals | Domain registrar | $50-$100 |
| **December** | Annual insurance review and renewal | Insurance provider | $300-$1,500 |
| **Quarterly** | Estimated tax payments (if profitable) | IRS Form 1120-W | Amount based on estimated tax |
| **Quarterly** | Review third-party service terms for changes | Internal | $0 |

### 7.2 Setting Up Compliance Reminders

**Recommendation:** Use Google Calendar (included with Google Workspace) to create recurring annual/quarterly reminders for all compliance deadlines. Set reminders 30 days and 7 days before each deadline.

---

## 8. Operational Priority Matrix

### 8.1 Do This Week (P0)

| Item | Action | Time | Cost |
|------|--------|------|------|
| Email CS50 team | Request explicit permission for commercial use of embedded content | 30 min | $0 |
| Draft Privacy Policy | Use a template (Termly, Iubenda, or GetTerms.io generate compliant policies) | 2-4 hours | $0-$99 |
| Draft Terms of Service | Use a template + customize for edtech/AI tutoring | 2-4 hours | $0-$99 |
| Add CS50 attribution | Add "Course content by Harvard CS50, CC BY-NC-SA 4.0" to lesson pages | 1 hour | $0 |

### 8.2 Do This Month (P1)

| Item | Action | Time | Cost |
|------|--------|------|------|
| Incorporate | Submit Stripe Atlas application (Delaware C-Corp) | 1 day + 3-5 day processing | $500 |
| File 83(b) | Send certified mail to IRS within 30 days of stock issuance | 1 hour | $10 (certified mail) |
| Bank account | Open Mercury account after EIN received | 1-4 weeks | $0 |
| Age verification | Add date-of-birth check at Clerk signup | 4 hours | $0 |
| Cookie consent | Implement consent banner for EU users | 4-8 hours | $0 |
| Google Workspace | Set up @niotebook.com email | 1 hour | $7.20/month |
| Bookkeeping | Set up Wave (free) and start tracking expenses | 2 hours | $0 |

### 8.3 Do Within 3 Months (P2)

| Item | Action | Time | Cost |
|------|--------|------|------|
| Trademark ITU | File Intent-to-Use trademark application | 2 hours (DIY) | $250-$350 |
| Domain portfolio | Register niotebook.app and niotebook.io | 30 min | ~$44/year |
| Insurance | Get general liability quote and possibly E&O | 1-2 hours | $300-$1,500/year |
| Stripe setup | Connect Stripe to bank account, configure subscription plans | 2-4 hours | $0 |
| User data deletion | Implement GDPR-compliant account deletion | 1-2 days | $0 |
| Status page | Set up Betterstack status page | 1 hour | $0 (free tier) |

### 8.4 Do Within 6 Months (P3)

| Item | Action | Time | Cost |
|------|--------|------|------|
| IP attorney consultation | Review CC BY-NC-SA commercial use question | 1-2 meetings | $500-$2,000 |
| CPA engagement | Find a startup-friendly CPA for annual tax filing | Research + engagement | $500-$2,000/year |
| Data export feature | Implement user data portability (GDPR Right to Access) | 2-3 days | $0 |
| Privacy Impact Assessment | Conduct PIA for AI processing of student data | 2-3 days | $0 (internal) |
| Foreign corporation registration | Register in home state (if not Delaware) | 1-2 hours | $100-$500 |

---

## 9. Total Cost Summary

### 9.1 One-Time Setup Costs

| Item | Cost |
|------|------|
| Incorporation (Stripe Atlas) | $500 |
| Foreign corporation registration | $100-$500 |
| Trademark ITU application | $250-$350 |
| Domain portfolio (first year) | $56-$100 |
| Privacy/TOS generation tools | $0-$200 |
| **Total one-time** | **$906-$1,650** |

### 9.2 Annual Recurring Costs

| Item | Annual Cost |
|------|-----------|
| Google Workspace (1 user) | $86 |
| Domain renewals | $56-$100 |
| Delaware franchise tax | $175-$400 |
| Registered agent | $50-$200 |
| Insurance (general liability) | $300-$600 |
| Bookkeeping software | $0-$360 |
| **Total annual recurring** | **$667-$1,746** |

### 9.3 Grand Total (First Year)

| Scenario | Year 1 Total |
|----------|-------------|
| **Minimal (DIY everything)** | ~$1,573 |
| **Recommended (Stripe Atlas + basic services)** | ~$2,500 |
| **Comprehensive (add attorney consultations)** | ~$5,000-$7,000 |

---

## Appendix A: Template Resources

| Document | Free Template Source | Paid/Professional Source |
|---------|---------------------|------------------------|
| Privacy Policy | Termly (free generator), GetTerms.io | Iubenda ($29/year), attorney ($500-$1,000) |
| Terms of Service | TermsFeed (free generator) | Attorney ($500-$1,000) |
| Cookie Policy | Cookiebot (free for small sites) | OneTrust (enterprise) |
| Data Processing Agreement | GDPR.eu (free template) | Attorney ($500-$1,000) |

## Appendix B: Key Government Resources

| Resource | URL | Purpose |
|---------|-----|---------|
| Delaware Division of Corporations | corp.delaware.gov | Incorporation, annual report, franchise tax |
| IRS EIN Application | irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online | EIN (free, same-day) |
| USPTO TESS (Trademark Search) | tmsearch.uspto.gov | Search existing trademarks |
| USPTO TEAS (Trademark Filing) | etas.uspto.gov | File trademark applications |
| FinCEN BOI Reporting | fincen.gov/boi | Beneficial Ownership Information reports |

## Appendix C: Founder Personal Checklist

| Item | Done? | Notes |
|------|-------|-------|
| Separate personal and business finances | [ ] | Use different bank accounts; never mix |
| Track all business expenses from day one | [ ] | Even before incorporation |
| Keep all receipts (digital or physical) | [ ] | 7-year retention for tax purposes |
| Document all founder equity decisions | [ ] | Written records of stock issuance, vesting |
| Set calendar reminders for all deadlines | [ ] | See compliance calendar above |
| Save copies of all legal filings | [ ] | Certificate of Incorporation, 83(b), EIN letter |
| Review insurance needs annually | [ ] | Coverage should scale with risk |

---

*This checklist is a living document. Update it as items are completed and new requirements are identified. Check off items as they are done. Revisit quarterly to ensure nothing has been missed and to account for changes in legal requirements.*

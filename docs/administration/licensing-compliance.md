# Licensing & Compliance Guide

**Date:** 2026-02-09
**Classification:** Administrative / Internal
**Analyst:** Business Intelligence (Claude Agent)
**Disclaimer:** This document provides general research and analysis. It is NOT legal advice. Consult a licensed attorney specializing in intellectual property, privacy law, and education technology before making compliance decisions.

---

## Executive Summary

- **CS50 content is licensed under CC BY-NC-SA 4.0, which explicitly prohibits commercial use.** If Niotebook charges users, using CS50 content (transcripts, lecture references, course structure) may violate the NonCommercial clause. This is the most critical legal risk facing the business model. Mitigation: Niotebook does not host or redistribute CS50 content -- it embeds YouTube videos (permitted by YouTube TOS) and provides AI tutoring that references concepts taught in public lectures.
- **YouTube embedding is permitted under YouTube's API Terms of Service** with specific restrictions: no ad blocking, no overlay elements obscuring the player, no nested iframes to circumvent policies, minimum 200x200px viewport, and compliance with YouTube developer policies (updated August 2025).
- **GDPR applies if any user accesses Niotebook from the EU/EEA**, which is likely given CS50's global audience. Key requirements: privacy notice, lawful basis for processing, data minimization, right to erasure, and Data Processing Agreements with Clerk, Convex, and AI providers.
- **COPPA generally does not apply** because Niotebook targets college-age CS students (18+), but a neutral age-gating mechanism is recommended to confirm users are 13+ at signup.
- **All third-party services (Clerk, Convex, Gemini, Groq) have published DPAs and privacy policies** that are compatible with GDPR compliance, though the Gemini free tier uses data for model training -- Niotebook should migrate to paid Gemini API (or use Groq) before processing EU user data at scale.

---

## Methodology

### Data Sources
- CS50 license from [cs50.harvard.edu/x/2025/license/](https://cs50.harvard.edu/x/2025/license/)
- YouTube API Terms of Service from [developers.google.com](https://developers.google.com/youtube/terms/api-services-terms-of-service), Developer Policies from [developers.google.com](https://developers.google.com/youtube/terms/developer-policies)
- MIT OCW license from [ocw.mit.edu](https://ocw.mit.edu/pages/privacy-and-terms-of-use/)
- GDPR requirements from [ComplyDog](https://complydog.com/blog/edtech-saas-compliance-student-privacy-gdpr-implementation), [SecurePrivacy](https://secureprivacy.ai/blog/student-data-privacy-governance), [Gutenberg Technology](https://blog.gutenberg-technology.com/en/gdpr-in-edtech-what-you-need-to-know)
- COPPA 2025 amendments from [Promise Legal](https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/), [Federal Register](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule)
- Clerk DPA from [clerk.com/legal/dpa](https://clerk.com/legal/dpa)
- Convex DPA from [convex.dev/legal/dpa](https://www.convex.dev/legal/dpa/v2024-03-21)
- Gemini API terms from [ai.google.dev](https://ai.google.dev/gemini-api/terms), data logging policy from [ai.google.dev](https://ai.google.dev/gemini-api/docs/logs-policy)
- Groq data policy from [console.groq.com](https://console.groq.com/docs/your-data), privacy policy from [groq.com/privacy-policy](https://groq.com/privacy-policy)

---

## 1. Content Licensing Analysis

### 1.1 CS50 License: CC BY-NC-SA 4.0

CS50x (2021-2026) is consistently licensed under **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International** (CC BY-NC-SA 4.0).

| License Term | What It Means | Niotebook Implication |
|-------------|---------------|----------------------|
| **Attribution (BY)** | Must credit CS50/Harvard and indicate if changes were made | Niotebook must clearly attribute CS50 content. "Powered by Harvard's CS50 open courseware" or similar. |
| **NonCommercial (NC)** | May NOT use the material for commercial purposes | **CRITICAL RISK.** If Niotebook charges users, does using CS50 content constitute "commercial use"? See analysis below. |
| **ShareAlike (SA)** | Derivative works must use the same CC BY-NC-SA license | If Niotebook creates derivative works (e.g., modified transcripts, AI-generated summaries of lectures), those must be shared under the same license. |

#### The NonCommercial Question

This is Niotebook's most significant legal ambiguity. The CC BY-NC-SA 4.0 license defines "NonCommercial" as:

> "Not primarily intended for or directed towards commercial advantage or monetary compensation."

**Arguments that Niotebook IS commercial use:**
- Niotebook charges a subscription fee ($7.99/month)
- The CS50 content (video embeds, transcript references) is integral to the product value
- Users pay for access to AI tutoring that references CS50 material
- This appears to be "directed towards monetary compensation"

**Arguments that Niotebook is NOT commercial use:**
- Niotebook does not host, copy, modify, or redistribute CS50 content
- YouTube videos are embedded via YouTube's own embed player (YouTube handles distribution and monetization)
- Transcripts are fetched from YouTube's public API or generated from public video audio
- Niotebook's value is in the AI tutoring integration and code execution environment, not in the CS50 content itself
- CS50's own communities page says: "If you are a teacher, you are welcome to adopt or adapt these materials for your own course, per the license."
- The content itself remains freely accessible; Niotebook adds a tooling layer

**Legal precedent:** The CC wiki notes that "commercial use" is interpreted broadly and context-dependent. A court or rights holder could go either way.

#### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Harvard/CS50 sends cease-and-desist | LOW (10-20%) | CRITICAL | Do not host or redistribute CS50 content; embed only via YouTube; attribute properly; seek explicit permission |
| CC BY-NC-SA license enforced against Niotebook | LOW (5-15%) | HIGH | Legal counsel review of the specific use case; consider seeking a license exception from CS50 |
| CS50 Academic Honesty Policy conflict | MEDIUM (20-40%) | MEDIUM | Emphasize that Nio is Socratic and refuses to provide answers; position as "study companion" not "homework solver" |

#### Recommended Actions

1. **Seek explicit permission from CS50/David Malan.** Email the CS50 team explaining what Niotebook does, how it uses their content (embedding only, not hosting), and ask for an explicit blessing or license exception. This is the cleanest path to eliminating legal risk.

2. **Ensure Niotebook does not host, copy, or redistribute CS50 content.** Video embedding via YouTube's embed player is clearly within YouTube's TOS. Transcript data fetched from YouTube's public API is a gray area -- consider using only YouTube's provided transcripts (via iframe) rather than storing them in Convex.

3. **Add clear attribution.** Every lesson page should display: "Course content by Harvard CS50, licensed under CC BY-NC-SA 4.0. Niotebook is not affiliated with Harvard University or CS50."

4. **Consult an IP attorney** before launching the paid tier. The NC clause interpretation is fact-specific and may depend on the jurisdiction.

### 1.2 MIT OpenCourseWare License: CC BY-NC-SA

MIT OCW uses the same CC BY-NC-SA license as CS50, with identical NonCommercial restrictions.

| Requirement | Detail |
|-------------|--------|
| Attribution | Must credit MIT and the specific faculty member |
| NonCommercial | Same restriction as CS50 -- commercial use prohibited |
| ShareAlike | Derivatives must use same license |
| "All Rights Reserved" content | Some MIT OCW materials (especially third-party content within courses) are NOT under CC and cannot be used |

**Implication:** Expanding to MIT OCW courses faces the same NonCommercial challenge. The embedding approach (YouTube + AI layer) should apply equally.

### 1.3 Stanford Online: NOT Open Licensed

Stanford's free online courses do NOT use Creative Commons licensing. They are distributed through Coursera and edX under those platforms' proprietary terms of service. Stanford content cannot be reused, remixed, or curated in the same way as CS50 or MIT OCW.

**Implication:** Niotebook cannot wrap Stanford courses the same way it wraps CS50. If Stanford lectures are on YouTube, Niotebook could potentially link to them, but curating them into structured courses would require explicit partnership.

### 1.4 YouTube Video Embedding

YouTube's API Terms of Service (updated August 28, 2025) and Developer Policies govern embedding.

| Requirement | Niotebook Status | Action Needed |
|-------------|-----------------|---------------|
| Minimum viewport: 200x200px | COMPLIANT (video pane is larger) | None |
| No overlays obscuring player or controls | REVIEW NEEDED | Ensure no UI elements overlap the YouTube iframe |
| No ad blocking | COMPLIANT (ads play normally in embedded player) | None |
| No nested iframes to circumvent policies | REVIEW NEEDED | Niotebook's workspace uses iframes -- verify the YouTube player is not in a nested iframe hierarchy designed to obscure the source |
| Privacy-enhanced mode available | NOT IMPLEMENTED | Consider using `youtube-nocookie.com` domain for embeds to reduce tracking |
| Child-directed content self-designation | NOT NEEDED (target audience is 18+) | Consider adding age verification at signup |
| Do not replicate YouTube | COMPLIANT (Niotebook is a learning tool, not a video platform) | None |
| API credentials must not be shared | REVIEW NEEDED | Ensure YouTube API keys are in environment variables, not in client-side code |

---

## 2. Data Privacy & GDPR

### 2.1 Does GDPR Apply to Niotebook?

**Yes, almost certainly.** GDPR applies to any organization that processes personal data of individuals in the EU/EEA, regardless of where the organization is based. Given that:
- CS50 has learners from 150+ countries
- Niotebook is accessible globally via the web
- EU residents will inevitably sign up

Niotebook must comply with GDPR from launch.

### 2.2 GDPR Compliance Requirements

| Requirement | Current State | Action Needed | Priority |
|-------------|--------------|---------------|----------|
| **Privacy Policy** | NOT PUBLISHED | Draft and publish a comprehensive privacy policy | P0 |
| **Lawful Basis for Processing** | NOT DOCUMENTED | Document the lawful basis for each data processing activity | P0 |
| **Data Minimization** | PARTIALLY MET | Review what data is collected and ensure only necessary data is captured | P1 |
| **Right to Erasure (Right to be Forgotten)** | NOT IMPLEMENTED | Implement user account deletion that removes all data from Convex | P1 |
| **Right to Access (Data Portability)** | NOT IMPLEMENTED | Implement data export feature (code snapshots, chat history, progress) | P2 |
| **Data Processing Agreements** | PARTIALLY IN PLACE | Verify DPAs with all sub-processors (Clerk, Convex, Gemini, Groq, Vercel) | P1 |
| **Cookie Consent** | NOT IMPLEMENTED | Implement cookie consent banner for EU users | P1 |
| **Data Breach Notification** | NOT PLANNED | Establish a breach notification process (72-hour deadline under GDPR) | P2 |
| **Privacy Impact Assessment** | NOT CONDUCTED | Conduct for AI processing of student data | P2 |

### 2.3 What Data Does Niotebook Collect?

Based on codebase analysis (`convex/schema.ts`):

| Data Category | Tables | Personal Data? | Lawful Basis (Recommended) |
|--------------|--------|---------------|---------------------------|
| User identity | `users` | YES (name, email, Clerk ID) | Contractual necessity (account creation) |
| Learning progress | `frames`, `lessonCompletions` | YES (linked to user) | Legitimate interest (service delivery) |
| Code snapshots | `codeSnapshots` | YES (user-created content) | Contractual necessity |
| Chat messages | `chatThreads`, `chatMessages` | YES (conversation content) | Contractual necessity |
| Video progress | `events` | YES (usage tracking) | Legitimate interest (service improvement) |
| Feedback | `feedback` | YES (user-submitted) | Consent |
| Invites | `invites` | YES (email addresses) | Consent |
| Rate limits | `rateLimits` | YES (linked to user) | Legitimate interest (abuse prevention) |

### 2.4 Third-Party Data Processors

| Service | Role | DPA Available? | GDPR-Compliant? | Data Sent | Key Terms |
|---------|------|---------------|-----------------|-----------|-----------|
| **Clerk** | Authentication provider | YES ([clerk.com/legal/dpa](https://clerk.com/legal/dpa)) | YES (DPF certified, SCCs) | Name, email, auth tokens | Clerk acts as processor; compliant with EU-US data transfers via Data Privacy Framework |
| **Convex** | Database & backend | YES ([convex.dev/legal/dpa](https://www.convex.dev/legal/dpa/v2024-03-21)) | YES (DPA covers GDPR obligations) | All application data | Convex stores data in US; DPA covers international transfers |
| **Google Gemini API** | AI model provider | YES (Google Cloud DPA) | CONDITIONAL | User prompts, code snippets, chat context | **FREE TIER: Google uses data for model training.** PAID TIER: Google does NOT use data for training. Retention: 55 days for abuse monitoring. |
| **Groq API** | AI model provider (fallback) | YES ([console.groq.com](https://console.groq.com/docs/legal/customer-data-processing-addendum)) | YES (DPA available) | User prompts, code snippets, chat context | Groq does NOT use inputs/outputs for training. Zero Data Retention (ZDR) available as opt-in. Data stored in US (GCP). |
| **Vercel** | Hosting provider | YES (Vercel DPA) | YES | Server-side rendered pages, API requests | Standard hosting provider terms |
| **YouTube** | Video embedding | YES (YouTube API TOS) | YES (Google's infrastructure) | Video playback data, user interaction | YouTube collects playback data; privacy-enhanced mode available |

#### Critical Issue: Gemini Free Tier and GDPR

**The Gemini free tier sends user data (prompts containing student code, chat messages, and lecture context) to Google, where it may be used for model training and reviewed by human annotators.** This is a potential GDPR violation if:
- The student has not consented to their data being used for AI training
- The student is an EU resident

**Mitigation options:**
1. **Migrate to paid Gemini API** before processing significant EU user data (paid tier does NOT use data for training)
2. **Use Groq exclusively** for EU users (Groq never uses data for training; ZDR available)
3. **Add explicit consent** in the privacy policy: "Your conversations with Nio may be processed by AI providers; by using the service, you consent to this processing"
4. **Implement geographic routing** to send EU user requests only to Groq (GDPR-safe) and non-EU requests to Gemini free tier

### 2.5 Privacy Policy Requirements

A compliant privacy policy must include:

| Section | Content |
|---------|---------|
| **Identity & Contact** | Niotebook Inc. (or Akram's name if not yet incorporated), contact email |
| **Data Collected** | Enumerated list of all data categories (see table above) |
| **Purpose of Processing** | For each data category, the specific purpose (e.g., "authentication", "AI tutoring", "progress tracking") |
| **Lawful Basis** | For each purpose, the GDPR lawful basis (consent, contractual necessity, legitimate interest) |
| **Data Sharing** | List of all third-party processors (Clerk, Convex, Gemini, Groq, Vercel) with purpose |
| **International Transfers** | Disclosure that data is transferred to the US; mechanism (DPF, SCCs) |
| **Retention Periods** | How long each data type is retained and when it is deleted |
| **User Rights** | Right to access, rectify, erase, restrict, port, and object to processing |
| **Contact for Requests** | Email address for data subject access requests (DSARs) |
| **Cookie Policy** | What cookies are set (Clerk auth, Convex session), purpose, duration |
| **Children** | Statement that the service is not intended for children under 13 (or 16 in some EU countries) |
| **Changes** | How users will be notified of policy changes |

### 2.6 Cookie Consent

Niotebook likely sets the following cookies:

| Cookie | Source | Purpose | Consent Required? |
|--------|--------|---------|-------------------|
| Clerk session cookie | Clerk | Authentication | No (strictly necessary) |
| Convex session | Convex | Backend connection | No (strictly necessary) |
| YouTube cookies | YouTube embed | Video playback, analytics | YES (non-essential, set by third party) |
| Any analytics cookies | PostHog/Plausible (if added) | Usage analytics | YES |

**Recommendation:** Implement a cookie consent banner that:
- Allows essential cookies without consent (authentication, backend)
- Requires opt-in for YouTube cookies and analytics
- Uses `youtube-nocookie.com` embed domain to reduce YouTube tracking
- Provides a link to the full cookie policy

---

## 3. COPPA Compliance

### 3.1 Does COPPA Apply to Niotebook?

COPPA applies to websites and online services that are:
- Directed to children under 13, OR
- Have actual knowledge that they are collecting data from children under 13

**Niotebook assessment:**
- Target audience: College-age CS students (18+)
- Content: Harvard CS50 university courseware (college-level material)
- Marketing: Not directed at children
- No cartoon characters, no gamification targeting minors

**Conclusion:** COPPA **likely does not apply** to Niotebook because it is not directed to children and the content is college-level. However, some CS50 learners could be high school students (15-17), and a very small number could be under 13.

### 3.2 Recommended COPPA Precautions

Even though COPPA likely does not apply, implement these precautions:

| Precaution | Implementation | Priority |
|-----------|---------------|----------|
| Add age verification at signup | Neutral age gate: "What is your date of birth?" (not "Are you over 13?") per 2025 COPPA amendments | P1 |
| Block users under 13 | If date of birth indicates under 13, do not create account | P1 |
| Add Terms of Service clause | "Niotebook is intended for users aged 13 and older. By creating an account, you confirm you are at least 13 years old." | P0 |
| Do not market to minors | No advertising on platforms or in communities targeting children | P0 |

### 3.3 COPPA 2025 Amendment Timeline

| Date | Requirement |
|------|------------|
| June 23, 2025 | Amended COPPA rule effective |
| April 22, 2026 | Full compliance deadline for most provisions |

Key 2025 changes relevant to Niotebook:
- "Mixed audience" sites must implement age gating
- Age gating must be "neutral" (no defaulting to an adult age)
- Enhanced parental notice requirements if collecting data from under-13 users
- Biometric data now classified as personal information

Since Niotebook is not a mixed-audience or child-directed site, these amendments primarily serve as awareness items, not compliance obligations.

---

## 4. Terms of Service Requirements

### 4.1 Key TOS Provisions

| Provision | Content | Priority |
|-----------|---------|----------|
| **Eligibility** | Must be 13+ (or 16+ for some EU jurisdictions) | P0 |
| **Account Security** | User responsible for maintaining account credentials | P0 |
| **Acceptable Use** | No abuse of AI (prompt injection, generating harmful content); no sharing of CS50 problem set solutions | P0 |
| **Academic Honesty** | Niotebook encourages learning, not cheating; Nio provides guidance, not answers; users are responsible for complying with their institution's academic honesty policies | P0 |
| **Intellectual Property** | User retains ownership of code they write; Niotebook does not claim ownership of user content | P0 |
| **Content Attribution** | CS50 content is owned by Harvard; MIT OCW content is owned by MIT; Niotebook is a third-party tool, not affiliated with these institutions | P0 |
| **Subscription Terms** | Billing, cancellation, refund policy | P1 (before paid launch) |
| **Service Availability** | No guarantee of uptime; service provided "as is" | P1 |
| **Limitation of Liability** | Standard limitation clause | P1 |
| **Dispute Resolution** | Governing law (Delaware if C-Corp), arbitration clause | P1 |
| **Modification** | Right to modify TOS with notice | P0 |

---

## 5. Data Retention Policy

### 5.1 Recommended Retention Periods

| Data Type | Retention Period | Justification | Deletion Mechanism |
|-----------|-----------------|---------------|-------------------|
| User account data | Until account deletion + 30 days | Contractual necessity | User-initiated deletion or admin |
| Chat messages | 1 year from creation | Service improvement; user reference | Automated deletion job |
| Code snapshots | Until account deletion | User owns their code | Cascade on account deletion |
| Progress data (frames, completions) | Until account deletion | User progress tracking | Cascade on account deletion |
| Event logs (analytics) | 90 days | Usage analytics, debugging | Automated deletion job |
| Rate limit records | 24 hours | Abuse prevention | TTL-based expiration |
| Feedback | 2 years | Product improvement | Manual review and deletion |
| AI API logs (Gemini/Groq) | 55 days (Gemini), configurable (Groq) | Provider retention for abuse monitoring | Provider-managed |

### 5.2 User Data Deletion Process

When a user requests account deletion (required under GDPR Right to Erasure):

1. Verify user identity (email confirmation)
2. Delete all records from: `users`, `chatThreads`, `chatMessages`, `codeSnapshots`, `frames`, `lessonCompletions`, `events`, `feedback`, `rateLimits`
3. Request deletion from Clerk (user authentication data)
4. Confirm deletion to user via email
5. Retain minimal record (anonymized deletion timestamp) for compliance auditing
6. Complete within 30 days (GDPR requirement)

---

## 6. Compliance Roadmap

### 6.1 Before Public Launch (P0)

| Item | Action | Effort |
|------|--------|--------|
| Privacy Policy | Draft and publish at `/privacy` | 1-2 days |
| Terms of Service | Draft and publish at `/terms` | 1-2 days |
| Age verification | Add date-of-birth check at signup (block under 13) | 0.5 days |
| CS50 attribution | Add attribution text to all lesson pages | 0.5 days |
| YouTube embed compliance | Review iframe implementation for TOS compliance | 0.5 days |

### 6.2 Before Paid Launch (P1)

| Item | Action | Effort |
|------|--------|--------|
| Cookie consent banner | Implement for EU users | 1-2 days |
| Gemini tier migration | Switch to paid Gemini API for EU users (or route to Groq) | 1 day |
| Subscription terms | Add billing, cancellation, refund terms to TOS | 1 day |
| Payment processor DPA | Review Stripe's DPA and ensure compliance | 0.5 days |
| CS50 permission | Send formal request to CS50 team for commercial use blessing | Time-dependent (relationship) |

### 6.3 Within 6 Months (P2)

| Item | Action | Effort |
|------|--------|--------|
| User data export | Implement data portability (export all user data as JSON/CSV) | 2-3 days |
| User account deletion | Implement full account deletion workflow | 1-2 days |
| Data retention automation | Build automated deletion jobs for expired data | 1-2 days |
| Privacy Impact Assessment | Conduct PIA for AI processing of student data | 2-3 days |
| IP attorney consultation | Review CC BY-NC-SA commercial use question with IP attorney | External (cost: $500-$2,000) |

---

## 7. Risk Register

| Risk | Probability | Impact | Mitigation | Status |
|------|------------|--------|-----------|--------|
| CS50 claims commercial use violation | LOW (10-20%) | CRITICAL | Seek explicit permission; do not host content; embed only | OPEN |
| GDPR complaint from EU user | LOW (5-10%) | HIGH | Publish privacy policy; implement data deletion; use paid AI APIs | OPEN |
| YouTube API access revoked | VERY LOW (1-5%) | CRITICAL | Comply with all TOS provisions; do not modify player | OPEN |
| COPPA complaint (under-13 user) | VERY LOW (1-5%) | MEDIUM | Age gate at signup; block under-13 | OPEN |
| Gemini free tier data used in training | MEDIUM (30-50%) | MEDIUM | Migrate to paid tier or route EU users to Groq | OPEN |
| CS50 Academic Honesty Policy conflict | MEDIUM (20-40%) | LOW-MEDIUM | Emphasize Socratic method; add disclaimer | OPEN |
| Third-party service changes terms | LOW (10-20%) | MEDIUM | Monitor TOS changes; maintain provider alternatives | OPEN |

---

## Appendix A: Creative Commons License Quick Reference

| License | Commercial Use? | Derivatives? | ShareAlike? |
|---------|----------------|-------------|------------|
| CC BY | Yes | Yes | No |
| CC BY-SA | Yes | Yes | Yes |
| CC BY-NC | NO | Yes | No |
| **CC BY-NC-SA** (CS50, MIT OCW) | **NO** | Yes | Yes |
| CC BY-ND | Yes | No | No |
| CC BY-NC-ND | No | No | No |

## Appendix B: GDPR Penalties

| Tier | Maximum Fine | Violations |
|------|-------------|-----------|
| Lower tier | EUR 10M or 2% of global annual revenue | Violations of records, security, or impact assessment obligations |
| Upper tier | EUR 20M or 4% of global annual revenue | Violations of core principles, consent, data subject rights, or international transfer rules |

For a pre-revenue startup, the financial risk is minimal (fines are proportional to revenue). The reputational risk is more significant -- a GDPR violation could destroy trust with the student community.

## Appendix C: Key Legal Contacts to Establish

| Need | Who to Contact | Estimated Cost |
|------|---------------|---------------|
| IP attorney (CC license review) | Small firm or solo practitioner specializing in copyright/CC | $500-$2,000 for initial consultation |
| Privacy attorney (GDPR/COPPA review) | Privacy-focused law firm | $1,000-$3,000 for policy review |
| General startup attorney | Startup-focused firm (Cooley, Wilson Sonsini, Gunderson) or local equivalent | $2,000-$5,000 for initial setup |
| CS50 team (permission request) | cs50@harvard.edu or David Malan directly | $0 (email) |

---

*This document reflects research conducted in February 2026. Laws, platform terms of service, and regulatory guidance change frequently. Monitor updates to GDPR enforcement, COPPA amendments, YouTube API TOS, and Creative Commons interpretations. Revisit this document quarterly.*

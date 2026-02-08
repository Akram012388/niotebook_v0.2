# Landing Page Plan — niotebook

> **Status:** IMPLEMENTED (Redesign v2, merged to main 2026-02-08)
> **Author:** Jarvis
> **Date:** 2026-01-30
> **Route:** `/` (public) — workspace moves to `/workspace`
> **Reference:** [claude.com/product/claude-code](https://claude.com/product/claude-code)
> **Brand:** "niotebook" — always lowercase, always one word

---

## Design Philosophy

**North star:** The Claude Code product page. What makes it work:

- Massive white space. Lets the product breathe.
- One hero statement that tells you everything in 6 words or fewer.
- A live product demo (animated terminal) that sells without explaining.
- Minimal navigation. No hamburger menus, no mega dropdowns.
- Sections separated by space, not borders or cards.
- Dark/light aware. Matches the user's system preference.
- Typography-first. The text IS the design.

**niotebook adaptation:** Same energy, but for education. The product is a learning workspace, not a coding tool. The demo should show the synchronized Video + Code + AI experience — that's the moat.

---

## Page Structure

### 1. Navbar (sticky)

- Left: `niotebook` wordmark (lowercase, Geist Sans, font-semibold)
- Right: `Log in` text link + `Get started` button (solid accent)
- Clean, minimal. No other links in alpha. Maybe "About" later.
- Transparent background, becomes `bg-surface/80 backdrop-blur` on scroll

### 2. Hero Section

- **Headline:** One powerful line. Options to brainstorm:
  - "Learn CS. For real."
  - "Watch. Code. Learn."
  - "The CS50 workspace."
  - "Where lectures become code."
  - "Your notebook for computer science."
- **Subheadline:** One sentence explaining what it is:
  - "Watch Harvard's CS50 lectures, code along in a real editor, and get AI help — all in one place."
- **CTA:** Single button — `Start learning` (solid accent, large)
- **No secondary CTA.** One action. One focus.
- Generous vertical padding (py-32 to py-40). Let it breathe.

### 3. Product Demo (the money shot)

- Full-width screenshot or embedded preview of the 3-pane workspace
- Shows: YouTube lecture playing | Code editor with syntax highlighting | AI chat with a contextual response
- **Option A:** Static high-quality screenshot with subtle shadow/glow
- **Option B:** Animated — shows the workspace in action (video playing, code typing, AI responding). More impressive but heavier.
- **Option C:** Interactive embed — actual mini workspace (most impressive, most complex)
- **Recommendation for alpha:** Option A (screenshot) with a subtle CSS animation (fade-in + slight upward motion on scroll). Ship fast, upgrade later.
- Wrapped in a browser chrome frame (rounded corners, dots, URL bar) for that "this is a real app" feel
- Below the hero, spanning ~80-90% width, with a gentle `shadow-2xl` and `rounded-xl`

### 4. Value Pillars (3 columns)

Three pillars that explain the "why." Clean icons (Phosphor icons, matching existing codebase), bold label, one-line description.

| Icon    | Pillar             | Description                                                                                 |
| ------- | ------------------ | ------------------------------------------------------------------------------------------- |
| 🎬 Play | **Watch lectures** | Harvard's CS50 courses, beautifully embedded. Pick up where you left off.                   |
| ⌨️ Code | **Code along**     | Real editor with syntax highlighting, terminal, and multi-file support. Run code instantly. |
| 🤖 AI   | **Get unstuck**    | AI tutor synced to your video timestamp and code. Context-aware help, not generic answers.  |

Layout: `grid-cols-3` on desktop, `grid-cols-1` stacked on... wait, desktop only. So just `grid-cols-3`, centered, max-width constrained.

### 5. The Differentiator (single statement section)

One bold statement that separates niotebook from everything else. Full-width centered text.

> **"Not another chatbot. A workspace."**

or

> **"Your video, your code, your AI — in sync."**

Small paragraph below: "Most learning platforms give you videos OR a code editor OR an AI chatbot. niotebook gives you all three, synchronized in real-time. When you're at minute 12:34 of a lecture, your AI tutor knows exactly what you're learning."

### 6. How It Works (3 steps)

Simple numbered steps with subtle connecting line:

1. **Pick a course** — Start with Harvard's CS50x, CS50P, CS50W, or CS50 AI.
2. **Watch and code** — Lecture plays on the left. Editor + terminal on the right. Switch layouts as you need.
3. **Ask for help** — The AI tutor knows your video timestamp, your code, and your course. It's like office hours, 24/7.

### 7. Course Catalog (optional for alpha)

Grid of available courses with thumbnails. Could be as simple as:

- CS50x 2026 — Introduction to Computer Science
- CS50P — Programming with Python
- CS50W — Web Programming
- CS50 AI — Artificial Intelligence

Each card: course thumbnail (YouTube playlist image), title, subtitle, lesson count. Click → goes to workspace with that course selected.

### 8. Footer

- Left: `niotebook` wordmark + "© 2026"
- Right: minimal links — `About` | `GitHub` (if open source) | `Contact`
- Or even simpler: just the wordmark and copyright. Alpha doesn't need more.

---

## Design Tokens (matching existing app)

Already defined in `globals.css`:

| Token                 | Light                    | Dark                     |
| --------------------- | ------------------------ | ------------------------ |
| `--background`        | `#f4f3ee` (Pampas)       | `#1c1917` (Charcoal)     |
| `--foreground`        | `#1c1917`                | `#f4f3ee`                |
| `--surface`           | `#faf9f7`                | `#252220`                |
| `--surface-muted`     | `#edeae4`                | `#2e2a27`                |
| `--accent`            | `#c15f3c` (Crail)        | `#da7756` (Terracotta)   |
| `--accent-foreground` | `#ffffff`                | `#1c1917`                |
| `--text-muted`        | `#78716c`                | `#a8a29e`                |

**Fonts:** Geist Sans (body) + Geist Mono (code accents) + Orbitron (wordmark only) — already imported in the app.

> **Note:** Orbitron is used exclusively for the wordmark. All landing headings use Geist Sans (`font-sans`), NOT `font-display` (Orbitron).

**The palette uses warm terracotta accents** — inspired by Claude.ai/code. The content (YouTube thumbnails, code syntax colors) provides additional color. The dedicated `--accent: #c15f3c` gives interactive elements a warm, distinctive feel.

---

## Technical Architecture

### Route Structure

Currently `/` renders the workspace directly. For the landing page:

- `/` — Landing page (public, no auth required)
- `/workspace` — The actual workspace (auth required after Clerk ships)
- `/login` — Clerk sign-in

This means:

1. Create `src/app/(landing)/page.tsx` — landing page
2. Create `src/app/(landing)/layout.tsx` — landing layout (no workspace shell, no sidebar)
3. Move workspace to `src/app/workspace/page.tsx` (or use route groups)
4. Update redirects: authenticated users hitting `/` could auto-redirect to `/workspace`

### Components to Create

- `src/ui/landing/LandingNav.tsx` — minimal navbar
- `src/ui/landing/HeroSection.tsx` — headline + CTA
- `src/ui/landing/ProductDemo.tsx` — workspace screenshot in browser frame
- `src/ui/landing/ValuePillars.tsx` — 3-column features
- `src/ui/landing/Differentiator.tsx` — bold statement section
- `src/ui/landing/HowItWorks.tsx` — 3 steps
- `src/ui/landing/CourseCatalog.tsx` — course grid (optional for alpha)
- `src/ui/landing/LandingFooter.tsx` — minimal footer

### Animation Strategy

- **Framer Motion** (`framer-motion`) for scroll-triggered fade-in animations and hero stagger sequences
- `whileInView` with `viewport: { once: true, amount: 0.2 }` for section entries
- Hero uses staggered `opacity:0, y:N → opacity:1, y:0` entrance animations
- Keep it tasteful. This is premium, not flashy.

> **Note:** The original plan called for "CSS only" animations, but `framer-motion` was adopted during implementation for richer scroll-triggered effects and stagger control.

### Responsive (Desktop-only)

Per Akram's directive: viewports below 1024px get a friendly "niotebook is best experienced on desktop" message. Landing page is the exception — it should look good on mobile too for shareability (someone shares the link on Twitter, opens on phone). But the workspace redirect is desktop-only.

**Landing page responsive strategy:**

- Desktop (1024px+): Full 3-column layouts, large hero
- Tablet (768-1023px): 2-column where needed, slightly smaller hero
- Mobile (<768px): Single column, stacked. Still looks good. CTA still prominent.
- When they click "Get started" on mobile → friendly "best on desktop" message

---

## Clarifying Questions for Akram

1. **Headline preference?** I listed several options. Which vibe resonates?
   - Punchy/short: "Learn CS. For real."
   - Descriptive: "The CS50 workspace."
   - Action-oriented: "Watch. Code. Learn."
   - Poetic: "Where lectures become code."

2. **Product screenshot:** Should I capture one from the actual running app, or do you want to provide/design a specific hero image? I can generate a mock workspace screenshot.

3. **Auth flow on landing:** When Clerk auth is live, should `/` show the landing page to everyone (even logged-in users), or auto-redirect authenticated users to `/workspace`?

4. **Course catalog on landing?** Include it for alpha, or keep the landing page purely aspirational (hero + features + CTA)?

5. **The brand — any tagline?** Something like "niotebook — the learning workspace" or just the wordmark alone?

6. **Dark mode on landing?** Follow system preference, or force light mode for the landing page (more common for SaaS landing pages)?

---

## Estimated Effort

| Component                                               | Hours         |
| ------------------------------------------------------- | ------------- |
| Route restructuring (`/` → landing, `/workspace` → app) | 2             |
| LandingNav                                              | 1             |
| HeroSection                                             | 2             |
| ProductDemo (screenshot + browser frame)                | 3             |
| ValuePillars                                            | 1             |
| Differentiator                                          | 0.5           |
| HowItWorks                                              | 1.5           |
| CourseCatalog (optional)                                | 2             |
| LandingFooter                                           | 0.5           |
| Scroll animations                                       | 1.5           |
| Desktop-only gate                                       | 1             |
| Polish + responsive                                     | 2             |
| **Total**                                               | **~18 hours** |

---

## References

- **Primary:** [claude.com/product/claude-code](https://claude.com/product/claude-code) — minimal, typography-driven, product-demo-centered
- **Secondary:** [linear.app](https://linear.app) — monochrome palette, premium feel, bold statements
- **Secondary:** [notion.so](https://notion.so) — clean hero, product screenshot, value props
- **Secondary:** [vercel.com](https://vercel.com) — developer-focused, dark-first, animated demos

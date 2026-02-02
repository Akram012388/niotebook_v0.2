# Niotebook Brand Asset Creation Checklist

## Brand Profile Summary

- **Personality:** Developer-serious (Linear/Vercel tier)
- **Palette:** Monochrome + acid green accent
- **Typeface:** Orbitron (geometric/square)
- **Logomark:** `nio` — same typeface crop
- **Gray bar:** Present on all variants (scaled/adapted per context)
- **Modes:** Light and dark variants for everything
- **Primary tool:** Figma (vector, components, batch export)
- **Secondary tool:** Photoshop (pixel-hinting small icons, raster touch-ups)

---

## Phase 1: Figma Setup

### 1. Create the Figma project

- New Figma file: **"niotebook — Brand System"**
- Pages:
  - `Color & Type` — token definitions
  - `Logo System` — master components
  - `Social` — platform-specific frames
  - `App Icons` — PWA/mobile exports
  - `Brand Guide` — shareable reference page

### 2. Define color styles

Create local styles (not just fills) so every frame pulls from one source:

| Style name | Hex | Usage |
|---|---|---|
| `nio/black` | `#0A0A0A` | Primary bg, text on light |
| `nio/white` | `#FAFAFA` | Text on dark, light bg |
| `nio/gray-900` | `#171717` | Surfaces (dark mode) |
| `nio/gray-700` | `#404040` | Gray bar (dark mode) |
| `nio/gray-400` | `#A3A3A3` | Gray bar (light mode), secondary text |
| `nio/gray-100` | `#F5F5F5` | Surfaces (light mode) |
| `nio/green` | `#00FF66` | Primary accent |
| `nio/green-dim` | `#00CC52` | Accent on light bg (AA compliant) |

- Test `#00FF66` on `#0A0A0A` and `#FAFAFA` in a contrast checker frame — aim for WCAG AA minimum (4.5:1 for text)

### 3. Define text styles

| Style name | Font | Weight | Size (reference) |
|---|---|---|---|
| `nio/logo` | Orbitron | Bold (700) | — (scales per context) |
| `nio/heading` | Geist Sans | Semi-Bold (600) | 24/32/40 |
| `nio/body` | Geist Mono | Regular (400) | 14/16 |

- Install Orbitron via Google Fonts (Figma auto-loads it if signed in)

---

## Phase 2: Logo System (Figma components)

### 4. Build the wordmark component

- Frame: auto-layout, hug contents
- Text layer: "niotebook" → Orbitron Bold
- Rectangle behind text (the gray bar):
  - Height = **40% of cap height**
  - Width = text width + **8% overshoot** on each side
  - Fill: `nio/gray-700`
  - Corner radius: 0
- Group text + bar → create **component**
- Name: `Logo/Wordmark`
- Add **variants**:
  - `Mode=Light` — text `nio/black`, bar `nio/gray-700`
  - `Mode=Dark` — text `nio/white`, bar `nio/gray-400`

### 5. Build the nio mark component

- Text layer: "nio" → Orbitron Bold
- Gray bar with same proportional system (40% cap height, 8% overshoot)
- Create component: `Logo/NioMark`
- Variants:
  - `Mode=Light` — text `nio/black`, bar `nio/gray-700`
  - `Mode=Dark` — text `nio/white`, bar `nio/gray-400`
  - `Mode=Accent` — text `nio/green`, bar `nio/gray-900`
- Test inside a rounded square (radius ~22%) for app icon context — bar should touch or nearly touch edges
- Check the `i` tracking at small sizes — Orbitron's `i` can feel tight against `o`, adjust letter-spacing +1–2% if needed

### 6. Define the gray bar system

- Document in a frame on the `Brand Guide` page:
  - Bar height = 40% of cap height
  - Horizontal overshoot = 8% beyond first and last letter
  - Always a vector rectangle (never rasterized)
  - Opacity: 100% in all variants (color changes, not opacity)

---

## Phase 3: Export Variants (Figma batch export)

### 7. Logo exports

Select each variant component, add export settings in the right panel:

| Variant | Export settings | Destination |
|---|---|---|
| Wordmark Light | SVG, PNG @1x, @2x, @4x | `logos/wordmark/light/` |
| Wordmark Dark | SVG, PNG @1x, @2x, @4x | `logos/wordmark/dark/` |
| NioMark Light | PNG @1x at 512, 256, 128, 64 | `logos/nio-mark/light/` |
| NioMark Dark | Same sizes | `logos/nio-mark/dark/` |
| NioMark Accent | Same sizes | `logos/nio-mark/accent/` |

- For SVG: ensure "Outline Text" is checked (or flatten text to vector first)
- Naming convention: `niotebook-wordmark-light@2x.png`, `nio-mark-dark-256.png`

### 8. Small icon exports (32px, 16px) → Photoshop handoff

Figma cannot pixel-hint effectively at 16px. For these sizes:

1. Export nio mark at **64px PNG** from Figma
2. Open in Photoshop at 200% zoom
3. Image → Image Size → 32px, then 16px (Nearest Neighbor resampling)
4. Manually nudge pixels: turn off anti-aliasing, adjust individual pixels for clarity
5. Save to `logos/nio-mark/{light,dark,accent}/`

### 9. Favicon set

From the nio mark, create a Figma frame for each:

| Asset | Frame size | Notes |
|---|---|---|
| `favicon-32x32.png` | 32×32 | Use Photoshop pixel-hinted version |
| `favicon-16x16.png` | 16×16 | Use Photoshop pixel-hinted version |
| `apple-touch-icon.png` | 180×180 | Nio mark centered, ~20px padding |
| `android-chrome-192x192.png` | 192×192 | Same approach |
| `android-chrome-512x512.png` | 512×512 | Direct Figma export is fine |

- `favicon.ico` (contains 16+32): use a CLI tool or realfavicongenerator.net to bundle after exporting the PNGs

---

## Phase 4: Social Platform Assets (Figma frames)

### 10. OG / social sharing image

- Frame: **1200×630px** on the `Social` page
- Fill: `nio/black`
- Place wordmark-dark instance, centered, ~60% frame width
- **80px+ padding** on all sides — platforms crop unpredictably
- Export: `social/og/og-image.png`

### 11. Profile pictures

- Frame: **400×400px**
- Draw a circle guide (non-exported) touching all edges
- Place nio mark centered — 15% margin from circle edge
- Export as PNG, copy to `social/profile/` and each platform folder

### 12. Platform banners

Create one frame per platform on the `Social` page:

| Platform | Frame size | Layout | Export to |
|---|---|---|---|
| X/Twitter | 1500×500 | Wordmark left-aligned ~40% width, bar extends, bg `nio/black` | `social/twitter/` |
| LinkedIn | 1584×396 | Same concept, wider crop | `social/linkedin/` |
| GitHub | 1280×640 | Wordmark centered | `social/github/` |
| Discord | 960×540 | Wordmark centered | `social/discord/` |
| YouTube | 2560×1440 | Wordmark centered in safe area (inner 1546×423) | `social/youtube/` |
| Facebook | 820×312 | Wordmark centered | `social/facebook/` |
| Instagram | 1080×1080 | Nio mark centered, minimal | `social/instagram/` |
| TikTok | 1080×1920 | Nio mark upper-third, tagline below | `social/tiktok/` |
| ProductHunt | 1270×760 | Wordmark + tagline centered | `social/producthunt/` |

- **Rule**: Keep all text/logos within the center 60% — edges get cropped on mobile
- Use Figma's layout grid to mark the safe zone on each frame

### 13. README badge / shield

- Frame: ~200×28px
- Nio mark (16px) + "niotebook" text in Orbitron Regular, monochrome
- Export as SVG → `icons/badge/niotebook-badge.svg`

---

## Phase 5: App & Email

### 14. App icon (PWA/Electron)

- Frame: **1024×1024px** on the `App Icons` page
- Rounded rectangle background (radius ~180px), fill `nio/black`
- Place nio mark accent variant, centered
- Export master: `icons/app/app-icon-1024.png`
- Add export presets for platform sizes: 512, 192, 180, 152, 144, 120, 96, 72, 48
- For iOS/Android-specific grids, use a Figma community template

### 15. Email signature

- Frame: **300px wide**, auto-height
- Wordmark only, no gray bar
- Test on a white rectangle (email clients handle transparency poorly)
- Export: `email/niotebook-email-sig.png`

---

## Phase 6: Brand Guide Page (in Figma)

### 16. Build the shareable brand guide

On the `Brand Guide` page, create sections:

- **Colors** — swatches with hex/style names
- **Typography** — font specimens
- **Logo** — all variants at reference size with clear space overlay
- **Gray bar** — proportion diagram
- **Do's and Don'ts** — side by side examples (correct vs incorrect usage)
- **Minimum sizes** — wordmark 120px, nio mark 16px
- **Backgrounds** — approved placement (solid black, white, near-neutral only)

This page doubles as a living spec — link it from `branding/README.md`.

---

## Workflow Summary

```
Figma: colors → text styles → logo components (with variants)
     → batch export all vector/large raster assets
     → social frames → app icons → brand guide page

Photoshop: 32px + 16px pixel-hinting only
         → favicon ICO bundling
```

## Figma Tips

- **Use components + variants** — one source of truth, swap modes instantly
- **Batch export**: select multiple frames → Export panel → export all at once
- **Layout grids**: add to banner frames to visualize safe zones
- **Outline text** before SVG export to avoid font dependency issues
- **Name layers cleanly** — export filenames derive from layer names in Figma
- **Test on real backgrounds**: paste a screenshot of the niotebook UI as a locked background layer and place logo instances on top

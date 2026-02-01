# Niotebook Brand Asset Creation Checklist

## Brand Profile Summary

- **Personality:** Developer-serious (Linear/Vercel tier)
- **Palette:** Monochrome + acid green accent (`#00FF66` range)
- **Typeface:** Orbitron (geometric/square)
- **Logomark:** `nio` — same typeface crop
- **Gray bar:** Present on all variants (scaled/adapted per context)
- **Modes:** Light and dark variants for everything

---

## Phase 1: Core Identity

### 1. Finalize the color tokens

- Pick exact hex values: black, white, 2-3 grays, and acid green
- Create a Photoshop swatch group called "niotebook" — all files pull from the same source
- Test the green on both `#000000` and `#FFFFFF` backgrounds for contrast (WCAG AA minimum)

### 2. Build the logo master file (PSD)

- Create one PSD at 4000x4000px, 300dpi
- Use Smart Objects for each logo variant so edits propagate
- Layer structure:
  - `wordmark-light` (black text, gray bar, transparent bg)
  - `wordmark-dark` (white text, lighter gray bar, transparent bg)
  - `nio-mark-light`
  - `nio-mark-dark`
- Convert Orbitron text to shapes (Type → Convert to Shape) for final versions — prevents font-missing issues and allows per-letter kerning with direct selection tool

### 3. Design the `nio` logomark

- Type "nio" in Orbitron Bold, same weight as the wordmark
- Add the gray bar behind it, proportionally scaled
- Test inside a rounded square (for app icon contexts) — bar should touch or nearly touch edges
- The `i` in "nio" may need 1-2px tracking adjustment — at small sizes Orbitron's `i` can feel too tight against `o`

### 4. Create the gray bar system

- Define the bar's exact proportions relative to text: % of cap height, horizontal overshoot
- Document this for consistency across wordmark and nio mark
- Use a shape layer (not rasterized) for the bar so it scales cleanly

---

## Phase 2: Export Variants

### 5. Logo exports (from the master PSD)

| Variant | Sizes | Format | Notes |
|---|---|---|---|
| Wordmark light | SVG + PNG @1x,2x,4x | PNG-24 transparent | For light backgrounds |
| Wordmark dark | SVG + PNG @1x,2x,4x | PNG-24 transparent | For dark backgrounds |
| Wordmark on gray bar | PNG @1x,2x,4x | PNG-24 | The "hero" version with bar as bg |
| nio mark light | 512, 256, 128, 64, 32, 16px | PNG-24 transparent | Test legibility at every size |
| nio mark dark | Same sizes | PNG-24 transparent | |
| nio mark (green accent) | Same sizes | PNG-24 transparent | For special use (loading states, active indicators) |

- Use Photoshop's **Export As** (not Save for Web) — handles color profiles better for modern screens. Check "Convert to sRGB".

### 6. Favicon set

- From the `nio` mark, export:
  - `favicon.ico` (contains 16x16 + 32x32)
  - `favicon-32x32.png`
  - `favicon-16x16.png`
  - `apple-touch-icon.png` (180x180)
  - `android-chrome-192x192.png`
  - `android-chrome-512x512.png`
- At 16px, simplify aggressively — manually pixel-hint the `nio` letters. Turn off anti-aliasing and nudge pixels by hand.

### 7. OG / social sharing image

- `og-image.png` — 1200x630px
- Wordmark centered, gray bar, dark background (`#0A0A0A`), subtle grid or no decoration
- Add 80px+ padding on all sides — social platforms crop unpredictably

---

## Phase 3: Social Platform Assets

### 8. Profile pictures (all platforms)

- 400x400px circle-safe crop of the `nio` mark
- Export for: GitHub, X/Twitter, Discord, LinkedIn, ProductHunt
- Place the mark inside a circle guide and ensure nothing touches the edges — platforms apply their own circular mask

### 9. Banner images

| Platform | Size | Notes |
|---|---|---|
| X/Twitter | 1500x500 | Wordmark left-aligned, bar extends, minimal |
| LinkedIn | 1584x396 | Same concept, wider crop |
| GitHub | 1280x640 | Repo social preview |
| Discord | 960x540 | Server banner |

- Keep text in the center 60% — edges get cropped on mobile

### 10. README badge / shield

- Small inline SVG badge: `nio` mark + "niotebook" text, monochrome
- For GitHub README headers

---

## Phase 4: App & Email

### 11. App icon (PWA/Electron)

- 1024x1024 master, `nio` mark in rounded square
- Green accent version as an option
- Export iOS + Android sizes via a template (search "app icon template PSD")

### 12. Email signature

- 300px wide max, PNG with transparency
- Wordmark only, no bar (email clients handle transparency poorly — test on white)

---

## Phase 5: Documentation

### 13. Create `branding/README.md` brand guide

- Color codes, font name + weight, spacing rules, clear space requirements
- Do's and don'ts (minimum size, don't rotate, don't recolor, etc.)
- Keep it minimal but precise

---

## General Photoshop Tips

- **Pixel-align everything.** View → Snap To → Pixels. Half-pixel misalignment causes blurry edges at small sizes.
- **Use artboards** in the master PSD — one per variant. Export all sizes from one file.
- **Test on real backgrounds.** Drop exports onto a screenshot of the actual niotebook UI (both light and dark) before finalizing.
- **Gray bar opacity** may need to differ between light and dark variants — what looks subtle on white may disappear on dark.

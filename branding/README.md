# Niotebook Brand Guidelines

> The interactive notebook for learning to code alongside video.

---

## Color Tokens

| Token          | Hex       | Usage                                              |
| -------------- | --------- | -------------------------------------------------- |
| **Black**      | `#0A0A0A` | Primary background, text on light                  |
| **White**      | `#FAFAFA` | Primary text on dark, light backgrounds            |
| **Gray 900**   | `#171717` | Surfaces, cards (dark mode)                        |
| **Gray 700**   | `#404040` | The gray bar element                               |
| **Gray 400**   | `#A3A3A3` | Secondary text, borders                            |
| **Gray 100**   | `#F5F5F5` | Surfaces (light mode)                              |
| **Acid Green** | `#00FF66` | Primary accent — active states, highlights, CTAs   |
| **Green Dim**  | `#00CC52` | Accent on light backgrounds (AA contrast on white) |

### CSS Custom Properties

```css
:root {
  --nio-black: #0a0a0a;
  --nio-white: #fafafa;
  --nio-gray-900: #171717;
  --nio-gray-700: #404040;
  --nio-gray-400: #a3a3a3;
  --nio-gray-100: #f5f5f5;
  --nio-green: #00ff66;
  --nio-green-dim: #00cc52;
}
```

---

## Typography

| Element                 | Font                | Weight          | Notes                                 |
| ----------------------- | ------------------- | --------------- | ------------------------------------- |
| **Logomark / Wordmark** | Orbitron            | Bold (700)      | Converted to outlines in final assets |
| **UI Headings**         | System / Geist Sans | Semi-Bold (600) | —                                     |
| **UI Body / Code**      | Geist Mono          | Regular (400)   | Monospace throughout                  |

---

## Logo

### Wordmark

The full "niotebook" text set in Orbitron Bold with the signature gray bar.

- **Light variant** — dark text on transparent (for light backgrounds)
- **Dark variant** — light text on transparent (for dark backgrounds)

### nio Mark

The compact `nio` logomark for small contexts: favicons, app icons, profile pictures.

- **Light**, **Dark**, and **Accent** (green) variants available
- At sizes below 32px, use the pixel-hinted version

### The Gray Bar

A horizontal bar sits behind/below the text. Proportions:

- Height: **40% of cap height**
- Horizontal overshoot: **8% beyond first and last letter**
- Color: `--nio-gray-700` (dark mode) / `--nio-gray-400` (light mode)

---

## Clear Space & Minimum Size

- **Clear space**: 1× the height of the `n` in "nio" on all sides
- **Minimum wordmark width**: 120px
- **Minimum nio mark size**: 16px (use pixel-hinted version)

---

## Usage Rules

### Do

- Use provided assets at their original proportions
- Place on solid backgrounds (black, white, or near-neutral)
- Use the accent green variant only for interactive/active states

### Don't

- Rotate, skew, or stretch the logo
- Recolor the logo outside the defined palette
- Place on busy or patterned backgrounds
- Remove or modify the gray bar
- Display the wordmark below minimum size
- Add drop shadows, glows, or outlines

---

## Directory Structure

```
branding/
├── README.md              ← this file
├── logos/
│   ├── wordmark/
│   │   ├── light/         ← SVG + PNG @1x, 2x, 4x (light bg)
│   │   └── dark/          ← SVG + PNG @1x, 2x, 4x (dark bg)
│   └── nio-mark/
│       ├── light/         ← 512 → 16px PNGs
│       ├── dark/
│       └── accent/        ← green variant
├── favicons/              ← .ico, apple-touch-icon, android-chrome
├── social/
│   ├── profile/           ← 400x400 circle-safe crops (shared)
│   ├── banners/           ← cross-platform banners (shared)
│   ├── og/                ← 1200x630 open graph image
│   ├── github/            ← repo social preview (1280x640)
│   ├── twitter/           ← profile pic, header (1500x500)
│   ├── discord/           ← server icon, banner (960x540)
│   ├── linkedin/          ← profile pic, banner (1584x396)
│   ├── youtube/           ← channel icon, banner (2560x1440), thumbnails
│   ├── instagram/         ← profile pic (320x320), posts (1080x1080), stories (1080x1920)
│   ├── tiktok/            ← profile pic, video covers (1080x1920)
│   ├── facebook/          ← profile pic (170x170), cover (820x312), posts
│   └── producthunt/       ← launch assets, gallery images
├── icons/
│   ├── app/               ← 1024x1024 master + platform exports
│   └── badge/             ← inline SVG badge for READMEs
├── email/                 ← 300px-wide wordmark PNG
└── docs/
    └── checklist.md       ← production asset creation checklist
```

---

## Usage Examples

### Open Graph Meta Tags

```html
<meta property="og:image" content="/branding/social/og/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:title" content="Niotebook" />
<meta
  property="og:description"
  content="The interactive notebook for learning to code alongside video."
/>
```

### GitHub README Badge

```markdown
![niotebook](./branding/icons/badge/niotebook-badge.svg)
```

### Favicon HTML

```html
<link rel="icon" href="/favicons/favicon.ico" sizes="32x32" />
<link rel="icon" href="/favicons/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/favicons/apple-touch-icon.png" />
<link rel="manifest" href="/favicons/site.webmanifest" />
```

---

## Asset Production

See [`docs/checklist.md`](./docs/checklist.md) for the full Photoshop-based production workflow covering all export sizes, formats, and platform requirements.

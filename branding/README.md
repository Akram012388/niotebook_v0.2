# Niotebook Brand System v2

> The interactive notebook for learning to code alongside video.

## Source of Truth

All brand assets are generated from the **Figma Brand Plugin** at
[`tools/figma-brand-plugin/`](../tools/figma-brand-plugin/).

Open any Figma file, import the plugin via `manifest.json`, and run
**Build All** to generate the complete brand system:

- **Design tokens** (Figma Variables with Light/Dark modes)
- **Color & text styles** bound to variables
- **Logo system** (wordmark + nio mark + badge)
- **Social assets** (11 platforms)
- **App icons & favicons**
- **Brand guide page**

Export assets from Figma into this directory using the structure below.

## Brand Identity

### Wordmark

**"niotebook"** in Orbitron Bold. The character **i** is always
terracotta; all other characters follow the theme mode.

| Mode   | Text color | "i" color          |
| ------ | ---------- | ------------------ |
| Light  | `#1c1917`  | `#c15f3c` (accent) |
| Dark   | `#f4f3ee`  | `#da7756` (accent) |
| Accent | `#c15f3c`  | `#c15f3c` (accent) |

### Color Palette (Warm Terracotta)

| Token             | Light     | Dark      | Usage                 |
| ----------------- | --------- | --------- | --------------------- |
| background        | `#f4f3ee` | `#1c1917` | Page background       |
| foreground        | `#1c1917` | `#f4f3ee` | Primary text          |
| surface           | `#faf9f7` | `#252220` | Cards, panels         |
| surface-muted     | `#edeae4` | `#2e2a27` | Inputs, code blocks   |
| surface-strong    | `#1c1917` | `#141210` | High-contrast surface |
| border            | `#ddd8d0` | `#3a3531` | Default border        |
| border-muted      | `#edeae4` | `#2e2a27` | Subtle divider        |
| text-muted        | `#78716c` | `#a8a29e` | Secondary text        |
| accent            | `#c15f3c` | `#da7756` | CTAs, active states   |
| accent-foreground | `#ffffff` | `#1c1917` | Text on accent        |
| accent-hover      | `#a8512f` | `#e8906e` | Hover/pressed         |
| status-success    | `#5a8a5e` | `#6da072` | Success               |
| status-warning    | `#b5882c` | `#d4a748` | Warning               |
| status-error      | `#c24b3a` | `#e06b5a` | Error                 |
| status-info       | `#5b7fa5` | `#7a9fc0` | Info                  |

### Typography

| Element         | Font       | Weight     |
| --------------- | ---------- | ---------- |
| Logo / Wordmark | Orbitron   | Bold (700) |
| UI Headings     | Geist Sans | SemiBold   |
| UI Body         | Geist Sans | Regular    |
| Code            | Geist Mono | Regular    |

## Directory Structure

After exporting from Figma, organize assets as:

```
branding/
  README.md              <- this file
  logos/
    wordmark/
      light/             <- SVG + PNG @1x, 2x, 4x
      dark/
    nio-mark/
      light/
      dark/
      accent/
  icons/
    app/                 <- 1024px master + platform sizes
    badge/               <- README badge SVG + PNG
    favicon/             <- 16, 32, 180, 192, 512px
  social/
    og/                  <- 1200x630
    twitter/             <- 1500x500
    linkedin/            <- 1584x396
    github/              <- 1280x640
    discord/             <- 960x540
    youtube/             <- 2560x1440
    facebook/            <- 820x312
    instagram/           <- 1080x1080
    tiktok/              <- 1080x1920
    producthunt/         <- 1270x760
    profile/             <- 400x400
  email/                 <- 300px signature
```

## Usage

### OG Meta Tags

```html
<meta property="og:image" content="/branding/social/og/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

### README Badge

```markdown
![niotebook](./branding/icons/badge/niotebook-badge.svg)
```

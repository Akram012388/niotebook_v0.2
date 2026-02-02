# Niotebook Figma Brand Plugin

Figma plugin that programmatically builds the entire Niotebook brand system — color styles, text styles, logo components with variants, social media frames, app icons, favicons, and a brand guide page.

## Prerequisites

- **Figma Desktop** (plugins run in the desktop app)
- **Fonts installed**: Orbitron (via Google Fonts), Geist Sans, Geist Mono
- **Bun** (or npm/pnpm)

## Setup

```bash
cd tools/figma-brand-plugin
bun install
bun run build
```

## Install in Figma

1. Open Figma Desktop
2. Go to **Plugins → Development → Import plugin from manifest…**
3. Select `tools/figma-brand-plugin/manifest.json`

## Usage

Open any Figma file, then run the plugin from **Plugins → Development → Niotebook Brand System**.

### Commands

| Command | What it creates |
|---|---|
| **Build All** | Everything below |
| **Colors & Text Styles** | 8 paint styles (`nio/*`) + 3 text style families |
| **Logo System** | Wordmark (Light/Dark) + Nio Mark (Light/Dark/Accent) components + badge |
| **Social Assets** | 11 platform frames (OG, Twitter, LinkedIn, GitHub, Discord, YouTube, Facebook, Instagram, TikTok, ProductHunt, profile pic) |
| **App Icons & Favicons** | 1024px master icon + favicon frames (180, 192, 512, 32, 16) + email sig |
| **Brand Guide Page** | Color swatches, typography specimens, rules reference |

### Exporting Assets

After running the plugin, use Figma's batch export:

1. Select all frames on a page (Ctrl/Cmd+A)
2. Open the **Export** panel (right sidebar)
3. Click **Export [N] layers**
4. Save to the corresponding `branding/` directories

## Development

```bash
bun run watch  # Rebuilds on file changes
```

Edit source files in `src/`, then reload the plugin in Figma (Ctrl/Cmd+Alt+P).

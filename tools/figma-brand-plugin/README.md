# Niotebook Figma Brand Plugin (v2)

Figma plugin that programmatically builds the entire Niotebook v2 brand system — design token variables with light/dark modes, color & text styles, logo components with variants, social media frames, app icons, favicons, and a dual-theme brand guide page.

## Prerequisites

- **Figma Desktop** (plugins run in the desktop app)
- **Figma Pro** (required for multi-mode variables — light/dark switching)
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

| Command                        | What it creates                                                                                           |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| **Build All**                  | Everything below                                                                                          |
| **Design Tokens (Variables)**  | ~30 semantic color variables (Light + Dark modes) + 5 border-radius variables                             |
| **Colors & Text Styles**       | Design tokens + paint styles bound to variables + 5 text style families                                   |
| **Logo System**                | Wordmark (Light/Dark) + Nio Mark (Light/Dark/Accent) components + badge                                   |
| **Social Assets**              | 11 platform frames (OG, Twitter, LinkedIn, GitHub, Discord, YouTube, Facebook, Instagram, TikTok, ProductHunt, profile pic) |
| **App Icons & Favicons**       | 1024px master icon + favicon frames (180, 192, 512, 32, 16) + email sig                                  |
| **Brand Guide Page**           | Dual-theme color swatches, typography specimens, rules reference, token map                               |

### Design Token Structure

The plugin creates two Figma Variable Collections:

**Niotebook/Color** (Light + Dark modes)
- `backgrounds/` — background, foreground, surface, surface-muted, surface-strong, surface-strong-foreground
- `borders/` — border, border-muted
- `text/` — text-muted, text-subtle
- `accent/` — accent, accent-foreground, accent-muted, accent-border, accent-hover
- `status/` — status-success, status-warning, status-error, status-info
- `workspace/` — workspace-editor, workspace-sidebar, workspace-terminal, workspace-tabbar, workspace-border, workspace-border-muted, workspace-text, workspace-text-muted, workspace-accent, workspace-accent-muted

**Niotebook/Size** (Default mode)
- `radius/` — radius-sm (6px), radius-md (8px), radius-lg (12px), radius-xl (16px), radius-full (9999px)

### Switching Themes in Figma

After running the plugin, any frame or component can switch between Light and Dark modes:
1. Select a frame
2. In the right sidebar, find **Layer** section
3. Click the mode dropdown next to **Niotebook/Color**
4. Switch between **Light** and **Dark**

### Exporting Assets

After running the plugin, use Figma's batch export:

1. Select all frames on a page (Ctrl/Cmd+A)
2. Open the **Export** panel (right sidebar)
3. Click **Export [N] layers**
4. Save to the corresponding directories

## Development

```bash
bun run watch  # Rebuilds on file changes
```

Edit source files in `src/`, then reload the plugin in Figma (Ctrl/Cmd+Alt+P).

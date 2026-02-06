# niotebook Design System v2.0

> Inspired by Claude.ai/code + Claude Cowork macOS

---

## Core Principles

1. **Calm & Focused** — Reduce visual noise, let content breathe
2. **Premium Feel** — Every pixel should feel intentional
3. **Warm Dark Mode** — Not cold/sterile, but cozy and professional
4. **Subtle Depth** — Use shadows and layering sparingly but effectively

---

## Color Palette

### Backgrounds (Layered System)

```css
--bg-base:        #1a1a1a;   /* Deepest background */
--bg-surface:     #232323;   /* Cards, panels */
--bg-elevated:    #2a2a2a;   /* Modals, dropdowns, hover states */
--bg-hover:       #333333;   /* Interactive hover */
--bg-active:      #3d3d3d;   /* Active/selected state */
```

### Text Colors

```css
--text-primary:   #f5f5f5;   /* Main content, headings */
--text-secondary: #a3a3a3;   /* Supporting text, labels */
--text-muted:     #737373;   /* Placeholder, disabled */
--text-inverse:   #1a1a1a;   /* Text on light backgrounds */
```

### Accent Colors

```css
--accent-primary:    #d97706;   /* Orange/amber — primary actions */
--accent-hover:      #f59e0b;   /* Lighter on hover */
--accent-subtle:     rgba(217, 119, 6, 0.15);  /* Accent backgrounds */

--accent-success:    #22c55e;   /* Green — success states */
--accent-warning:    #eab308;   /* Yellow — warnings */
--accent-error:      #ef4444;   /* Red — errors */
--accent-info:       #3b82f6;   /* Blue — info */
```

### Borders

```css
--border-default:    #2e2e2e;   /* Subtle dividers */
--border-strong:     #404040;   /* More visible borders */
--border-focus:      #d97706;   /* Focus rings */
```

---

## Typography

### Font Stack

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace;
```

### Type Scale

| Name      | Size   | Weight | Line Height | Use Case |
|-----------|--------|--------|-------------|----------|
| `xs`      | 11px   | 400    | 1.4         | Badges, captions |
| `sm`      | 13px   | 400    | 1.5         | Secondary text, labels |
| `base`    | 14px   | 400    | 1.6         | Body text |
| `md`      | 15px   | 500    | 1.5         | Emphasized body |
| `lg`      | 17px   | 600    | 1.4         | Section headers |
| `xl`      | 20px   | 600    | 1.3         | Page titles |
| `2xl`     | 24px   | 700    | 1.2         | Hero text |

### Font Weights

```css
--font-normal:   400;
--font-medium:   500;
--font-semibold: 600;
--font-bold:     700;
```

---

## Spacing Scale

Based on 4px grid:

```css
--space-0:    0;
--space-1:    4px;
--space-2:    8px;
--space-3:    12px;
--space-4:    16px;
--space-5:    20px;
--space-6:    24px;
--space-8:    32px;
--space-10:   40px;
--space-12:   48px;
--space-16:   64px;
```

### Component Spacing Guidelines

| Context              | Padding        | Gap           |
|----------------------|----------------|---------------|
| Page padding         | 24-32px        | —             |
| Card padding         | 16-20px        | —             |
| Button padding       | 8px 16px       | 8px (icons)   |
| Input padding        | 10px 12px      | —             |
| List items           | 12px 16px      | 4px           |
| Section gap          | —              | 24-32px       |

---

## Border Radius

```css
--radius-none:   0;
--radius-sm:     4px;    /* Buttons, inputs */
--radius-md:     8px;    /* Cards, modals */
--radius-lg:     12px;   /* Large containers */
--radius-xl:     16px;   /* Hero sections */
--radius-full:   9999px; /* Pills, avatars */
```

---

## Shadows

Subtle, warm shadows — not harsh:

```css
--shadow-sm:   0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md:   0 4px 6px rgba(0, 0, 0, 0.25), 0 1px 3px rgba(0, 0, 0, 0.2);
--shadow-lg:   0 10px 15px rgba(0, 0, 0, 0.3), 0 4px 6px rgba(0, 0, 0, 0.2);
--shadow-xl:   0 20px 25px rgba(0, 0, 0, 0.35), 0 8px 10px rgba(0, 0, 0, 0.2);

/* Glow for focus states */
--shadow-focus: 0 0 0 2px var(--bg-base), 0 0 0 4px var(--accent-primary);
```

---

## Transitions

Consistent, snappy animations:

```css
--duration-fast:   100ms;
--duration-normal: 150ms;
--duration-slow:   250ms;

--ease-default:    cubic-bezier(0.4, 0, 0.2, 1);
--ease-in:         cubic-bezier(0.4, 0, 1, 1);
--ease-out:        cubic-bezier(0, 0, 0.2, 1);
--ease-bounce:     cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Default Transition

```css
transition: all var(--duration-normal) var(--ease-default);
```

---

## Component Specifications

### Buttons

**Primary Button**
```css
.btn-primary {
  background: var(--accent-primary);
  color: var(--text-inverse);
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  font-weight: var(--font-medium);
  font-size: 14px;
  transition: all var(--duration-normal) var(--ease-default);
}
.btn-primary:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
}
```

**Secondary Button**
```css
.btn-secondary {
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  /* Same padding/radius as primary */
}
.btn-secondary:hover {
  background: var(--bg-hover);
  border-color: var(--border-strong);
}
```

**Ghost Button**
```css
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}
.btn-ghost:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
```

### Cards

```css
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-5);
}
.card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
}
```

### Inputs

```css
.input {
  background: var(--bg-base);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  color: var(--text-primary);
  font-size: 14px;
}
.input:focus {
  border-color: var(--accent-primary);
  box-shadow: var(--shadow-focus);
  outline: none;
}
.input::placeholder {
  color: var(--text-muted);
}
```

### Sidebar Navigation

```css
.nav-item {
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 14px;
  transition: all var(--duration-fast) var(--ease-default);
}
.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.nav-item.active {
  background: var(--accent-subtle);
  color: var(--accent-primary);
}
```

---

## Icons

- **Style:** Outline/stroke icons (not filled)
- **Size:** 16px (sm), 20px (md), 24px (lg)
- **Stroke Width:** 1.5-2px
- **Library Recommendation:** Lucide Icons or Heroicons (outline)

---

## Micro-interactions

### Hover States
- Subtle background color shift
- Optional: slight translateY(-1px) lift for clickable cards
- Border color intensifies

### Focus States
- Remove default outline
- Add custom focus ring (2px accent color with gap)

### Loading States
- Skeleton screens with subtle shimmer animation
- Spinner: simple rotating circle, not complex

### Transitions to Implement
- Page transitions: subtle fade (150ms)
- Modal: fade + slight scale from 0.95 to 1
- Dropdown: fade + translateY from -4px to 0
- Toast: slide in from bottom-right

---

## Tailwind Config

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Backgrounds
        'nio-base': '#1a1a1a',
        'nio-surface': '#232323',
        'nio-elevated': '#2a2a2a',
        'nio-hover': '#333333',
        'nio-active': '#3d3d3d',

        // Text
        'nio-text': '#f5f5f5',
        'nio-text-secondary': '#a3a3a3',
        'nio-text-muted': '#737373',

        // Accent
        'nio-accent': '#d97706',
        'nio-accent-hover': '#f59e0b',

        // Borders
        'nio-border': '#2e2e2e',
        'nio-border-strong': '#404040',

        // Status
        'nio-success': '#22c55e',
        'nio-warning': '#eab308',
        'nio-error': '#ef4444',
        'nio-info': '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'nio-sm': '4px',
        'nio-md': '8px',
        'nio-lg': '12px',
      },
      boxShadow: {
        'nio-sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'nio-md': '0 4px 6px rgba(0, 0, 0, 0.25), 0 1px 3px rgba(0, 0, 0, 0.2)',
        'nio-lg': '0 10px 15px rgba(0, 0, 0, 0.3), 0 4px 6px rgba(0, 0, 0, 0.2)',
        'nio-focus': '0 0 0 2px #1a1a1a, 0 0 0 4px #d97706',
      },
      transitionDuration: {
        'fast': '100ms',
        'normal': '150ms',
        'slow': '250ms',
      },
    },
  },
}
```

---

## File Structure for Implementation

```
src/
├── styles/
│   ├── globals.css         # CSS variables, base styles
│   └── components.css      # Reusable component classes (optional)
├── components/
│   ├── ui/                  # Primitive components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   └── ...
│   └── layout/             # Layout components
│       ├── Sidebar.tsx
│       ├── Header.tsx
│       └── PageContainer.tsx
```

---

## Next Steps

1. [ ] Update `tailwind.config.js` with new design tokens
2. [ ] Create base component library (`Button`, `Card`, `Input`)
3. [ ] Design Dashboard/Home mockup
4. [ ] Design Course Browser mockup
5. [ ] Design Settings mockup
6. [ ] Apply theme to Learning Workspace

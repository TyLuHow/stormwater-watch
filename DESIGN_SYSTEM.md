# Stormwater Watch - Mission Control Design System

## Overview

The Stormwater Watch platform features a "mission control" design aesthetic that commands attention, tells the story of California's water quality, and respects the craft of environmental advocacy. This document outlines the design philosophy, color system, typography, animations, and component patterns.

---

## Design Philosophy

### Core Principles

1. **Command Attention** - When environmental advocates open this at 6am with coffee, it should feel like a mission control center. Data should be clear, urgent when needed, and immediately actionable.

2. **Tell the Story of Water** - The design reflects California's watersheds, rainfall patterns, and the consequence of pollution. Blues and teals evoke water; earth tones ground us in the California landscape.

3. **Respect the Craft** - This platform serves people who've dedicated their lives to environmental protection. The design is sophisticated, professional, and worthy of their commitment.

4. **Surprise Thoughtfully** - Microinteractions reward attention. Hover states reveal details. Animations feel intentional, not gratuitous.

---

## Color System

### Philosophy
Colors are defined using **OKLCH** for perceptual uniformity and better color mixing. Each color has semantic meaning tied to water quality and environmental advocacy.

### Light Mode Palette

```css
--background: oklch(0.98 0.002 240);        /* Clean slate for data clarity */
--foreground: oklch(0.15 0.01 240);         /* High contrast text */
--primary: oklch(0.45 0.15 240);            /* Deep water blue - commands attention */
--accent: oklch(0.65 0.12 200);             /* Watershed teal - interactive elements */
--destructive: oklch(0.55 0.22 25);         /* Pollution alert red */
```

### Dark Mode Palette (Default)

```css
--background: oklch(0.12 0.01 240);         /* Command center black */
--foreground: oklch(0.95 0.01 240);         /* Bright readable text */
--primary: oklch(0.60 0.18 220);            /* Bright water blue */
--accent: oklch(0.55 0.15 200);             /* Glowing teal */
--destructive: oklch(0.60 0.25 25);         /* Bright alert red */
```

### Data Visualization Colors

```css
--chart-1: oklch(0.60 0.20 220);            /* Deep ocean blue */
--chart-2: oklch(0.65 0.18 200);            /* Watershed teal */
--chart-3: oklch(0.70 0.15 150);            /* Sierra forest green */
--chart-4: oklch(0.75 0.15 80);             /* Valley gold */
--chart-5: oklch(0.65 0.25 25);             /* Alert red */
```

### Semantic Water Quality Colors

```css
--water-clean: oklch(0.70 0.15 200);        /* Clean water - teal */
--water-warning: oklch(0.70 0.18 60);       /* Warning - amber */
--water-danger: oklch(0.55 0.22 25);        /* Danger - red */
--water-critical: oklch(0.35 0.15 25);      /* Critical - dark red */
```

---

## Typography

### Fonts

- **Primary**: Geist (sans-serif) - Modern, highly legible, excellent for data display
- **Monospace**: Geist Mono - For code, technical data, and timestamps

### Scale

```css
h1: 4xl-6xl (clamp), font-bold, tracking-tight, line-height: 1.1
h2: 3xl-4xl (clamp), font-bold, tracking-tight, line-height: 1.2
h3: 2xl-3xl, font-semibold, tracking-tight
```

### Font Features

```css
font-feature-settings: "cv02", "cv03", "cv04", "cv11";
```

Enables stylistic alternates for improved readability in data-heavy contexts.

---

## Animations & Microinteractions

### Slide In (Bottom)
```css
@keyframes slide-in-bottom {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
/* Usage: className="slide-in-bottom" */
/* Stagger with: style={{ animationDelay: "0.1s" }} */
```

**Purpose**: Progressive disclosure of content as user scrolls. Creates sense of loading mission-critical data.

### Fade In Scale
```css
@keyframes fade-in-scale {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
/* Usage: className="fade-in-scale" */
```

**Purpose**: Subtle zoom on cards and important data points. Draws eye to key metrics.

### Pulse Glow
```css
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 currentColor; opacity: 1; }
  50% { box-shadow: 0 0 20px 4px currentColor; opacity: 0.8; }
}
/* Usage: className="pulse-glow" */
```

**Purpose**: Alerts and critical notifications. Creates urgency without being annoying.

### Shimmer (Loading State)
```css
@keyframes shimmer {
  to { left: 100%; }
}
/* Usage: className="shimmer" */
```

**Purpose**: Loading states that feel intentional. Shows system is working, not frozen.

### Gradient Shift (Hero Sections)
```css
@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
/* Usage: className="gradient-shift" */
```

**Purpose**: Subtle animated gradients for hero sections. Creates sense of movement and life.

---

## Utility Classes

### Glass Morphism

```css
.glass          /* bg-card/80 backdrop-blur-xl border-border/50 */
.glass-strong   /* bg-card/90 backdrop-blur-2xl border-border/70 */
```

**Usage**: Overlay panels, modals, floating cards. Creates depth and hierarchy.

### Data Grid Background

```css
.data-grid      /* Subtle grid pattern for technical sections */
```

**Usage**: Dashboard backgrounds, data tables. Evokes mission control aesthetic.

### Text Gradient

```css
.text-gradient  /* Blue to teal gradient for emphasis */
```

**Usage**: Headlines, important callouts. "Command Center" in hero.

### Badges

```css
.badge-critical /* Red alert badge */
.badge-warning  /* Amber warning badge */
.badge-clean    /* Teal success badge */
```

**Usage**: Status indicators, severity levels, water quality classifications.

---

## Component Patterns

### Stats Cards

**Design**: Large, bold numbers. Icon in colored background circle. Subtle background pattern. Hover: scale(1.02) + shadow.

**Purpose**: At-a-glance metrics. Should be scannable in <3 seconds.

**Implementation**:
- 5-column grid on desktop
- 2-column on tablet
- 1-column on mobile
- Icons: 24px in 48px colored circle
- Number: 4xl font-bold
- Label: uppercase tracking-wider text-xs
- Alert state: pulse-glow border-destructive

### Map Component

**Design**: Dark Mapbox style. Custom circular markers with glow. Enhanced popups with dark background.

**Purpose**: Show geographic distribution of violations. Critical sites immediately visible.

**Implementation**:
- Markers: 24-28px circles
- Critical: #dc2626 (red) + larger size
- Active: #ea580c (orange)
- Hover: scale(1.3) + enhanced shadow
- Popup: Dark background, facility details, "View Details" CTA

### Regional Hotspots

**Design**: Ranked list with horizontal bars. Animated width on load.

**Purpose**: Show top counties by violation count. Immediate visibility into problem areas.

**Implementation**:
- Top 8 counties
- Rank number + county name
- Horizontal bar (relative width)
- Hover: bg-muted/50 transition

### Hero Section

**Design**: Gradient background. Animated "Live Monitoring" indicator. Large headline with text-gradient.

**Purpose**: Set tone. This is serious, mission-critical work.

**Implementation**:
- Animated pulse dot
- "LIVE MONITORING" uppercase tracking-wide
- 5xl-6xl headline
- Staggered slide-in animations

---

## Accessibility

### WCAG AA Compliance

- **Color Contrast**: All text meets 4.5:1 minimum (normal text), 3:1 (large text)
- **Focus States**: Visible focus rings on all interactive elements
- **Motion**: Respects `prefers-reduced-motion`
- **Semantics**: Proper heading hierarchy, ARIA labels where needed

### Keyboard Navigation

- All interactive elements accessible via keyboard
- Logical tab order
- Skip links for main content

### Screen Readers

- Alt text on all images/icons with meaning
- ARIA labels on data visualizations
- Semantic HTML (main, nav, article, etc.)

---

## Responsive Breakpoints

```
mobile:   < 640px
tablet:   640px - 1024px
desktop:  > 1024px
xl:       > 1280px
```

### Mobile-First Approach

All layouts start mobile, progressively enhance for larger screens.

**Key Responsive Patterns**:
- Stats: 1 col → 2 col → 5 col
- Map + Hotspots: Stacked → Side-by-side (xl)
- Typography: Clamp for fluid scaling

---

## Dark Mode First

The platform defaults to **dark mode** for several reasons:

1. **Mission Control Aesthetic**: Dark interfaces feel more serious, focused
2. **Data Clarity**: Charts and visualizations pop against dark backgrounds
3. **Reduced Eye Strain**: Environmental advocates work long hours; dark mode is easier on eyes
4. **Map Integration**: Dark Mapbox style integrates seamlessly

Light mode is available but not emphasized.

---

## Performance Considerations

### Animations

- Use `transform` and `opacity` (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left` (triggers layout)
- All animations < 500ms (feel snappy, not sluggish)

### CSS Custom Properties

- Define colors once, reference everywhere
- Easy theme switching
- Reduced bundle size

### Code Splitting

- Map component lazy-loaded
- Animations only applied when in viewport
- Heavy components below fold load after initial paint

---

## Future Enhancements

### Potential Additions

1. **Animated Map Layers**: Show rainfall patterns, watershed flows
2. **Real-Time Data Ticker**: Live updates of new violations (WebSocket)
3. **3D Terrain View**: Show elevation, watershed topography
4. **Time-Lapse Animations**: Violation trends over time
5. **Celebration Moments**: Subtle animation when violations decrease

### Accessibility Improvements

1. **Voice Navigation**: For hands-free operation in field
2. **High Contrast Mode**: For low-vision users
3. **Internationalization**: Spanish language support for California

---

## Deployment Checklist

Before deploying design changes:

- [x] Type check passes (`npm run type-check`)
- [ ] Lint passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] All animations tested across browsers
- [ ] Dark mode verified
- [ ] Mobile responsive checked
- [ ] Accessibility audit (Lighthouse)
- [ ] Performance audit (Core Web Vitals)

---

## Maintenance

### Updating Colors

1. Edit CSS custom properties in `app/globals.css`
2. Use OKLCH color picker: https://oklch.com
3. Maintain 4.5:1 contrast for text
4. Test in both light and dark modes

### Adding Animations

1. Define @keyframes in `app/globals.css` utilities layer
2. Create utility class (e.g., `.slide-in-left`)
3. Document in this file
4. Test with `prefers-reduced-motion`

### Component Styling

1. Use Tailwind utilities first
2. Extract to component-specific CSS if repeated
3. Document any custom patterns here

---

## Credits

Design System: Claude Code with Anthropic's Claude Sonnet 4.5
Typography: Geist by Vercel
Colors: OKLCH for perceptual uniformity
Inspiration: NASA mission control, environmental advocacy, California watersheds

---

**Remember**: This is not a dashboard. This is a movement. Design accordingly.

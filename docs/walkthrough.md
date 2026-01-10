# Portfolio Walkthrough

## Overview

Bilal Ahmad's portfolio featuring immersive 3D animations, scroll-driven interactions, and a dynamic sun/moon theme system.

---

## Iteration 1: Sun/Moon Theme System

### Burning Paper Reveal
- Screen starts pitch black
- Sun/moon fades in at top
- Descends while fire effect spreads
- Website content reveals through the burn

### Theme Toggle
- **Double-click** sun/moon to switch themes
- Time-based auto-detection (6AM-6PM = light)
- Theme persists in localStorage

### Atmospheric Background
- **Light theme**: Sky gradient, clouds, mountains
- **Dark theme**: Stars, nebula, aurora

![Hero section with moon](C:/Users/bilaa/.gemini/antigravity/brain/40c4bb2f-0661-4335-8907-937cc7c0b6a3/hero_section_moon_1767962851706.png)

---

## Iteration 2: Scroll-Driven Projects

### Scroll Flow
1. Hero → Scroll indicator appears
2. Scroll → Batman logo spins in
3. Continue → "My Projects" title reveals
4. Scroll → Road descends into view
5. Scroll → Batmobile moves across screen
6. Scroll → 8 project cards appear alternating sides

### 3D Models
| Model | Animation |
|-------|-----------|
| Batman Logo | Spin in/out on scroll |
| Road | Descends from above |
| Batmobile | Moves left→right with scroll |

![My Projects section](C:/Users/bilaa/.gemini/antigravity/brain/40c4bb2f-0661-4335-8907-937cc7c0b6a3/projects_title_section_1767962880876.png)

![Project card with road](C:/Users/bilaa/.gemini/antigravity/brain/40c4bb2f-0661-4335-8907-937cc7c0b6a3/project_cards_view_1767962905053.png)

---

## Demo Recording

![Full scroll demo](C:/Users/bilaa/.gemini/antigravity/brain/40c4bb2f-0661-4335-8907-937cc7c0b6a3/projects_section_demo_1767962824987.webp)

---

## Run Locally

```bash
cd d:\Download\portfolio
npx -y serve .
# Open http://localhost:3000
```

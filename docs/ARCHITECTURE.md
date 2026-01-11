# Architecture Overview

## Core Components

### 1. Three.js Scenes

The portfolio uses **two separate Three.js scenes**:

#### Main Scene (Hero/Projects)
- **Canvas**: `#three-canvas`
- **Models**: Sun (`sun.glb`), Moon (`moon_planet.glb`), Batmobile (`batmobile.glb`)
- **Behavior**: 
  - Sun/Moon switch based on theme
  - Batmobile appears in projects section with scroll-based movement

#### Space Scene (Education Section)
- **Canvas**: `#space-canvas`
- **Model**: Star cluster (`space.glb`)
- **Behavior**:
  - Initialized lazily when education section enters viewport
  - Camera zooms in/out based on scroll progress
  - Fades out when leaving education section

### 2. Scroll Animation System

Uses **GSAP ScrollTrigger** for all scroll-based animations:

```javascript
ScrollTrigger.create({
    trigger: element,
    start: 'top 80%',   // Earlier for mobile
    end: 'bottom top',
    scrub: 1.5,         // Smooth interpolation
    onEnter: () => { /* show */ },
    onLeaveBack: () => { /* hide */ }
});
```

### 3. Theme System

```javascript
// Theme priority:
// 1. localStorage override
// 2. Time-based (6am-6pm = light)
const savedTheme = localStorage.getItem('portfolio-theme-override');
const timeBasedTheme = getTimeBasedTheme();
currentTheme = savedTheme || timeBasedTheme;
```

### 4. Performance Optimizations

| Optimization | Implementation |
|--------------|----------------|
| Mouse throttling | 100ms throttle on raycaster |
| Passive listeners | `{ passive: true }` on scroll/mouse |
| RAF batching | Scroll handler uses requestAnimationFrame |
| GPU hints | `will-change: transform, opacity` |
| Scrub smoothing | `scrub: 1.5` for animations |

## Key Functions

| Function | Purpose |
|----------|---------|
| `init()` | Main initialization |
| `setupScene()` | Creates Three.js scene |
| `loadModels()` | Loads sun/moon models |
| `initSpaceScene()` | Creates education 3D scene |
| `animateSpace()` | Render loop for space |
| `setupEducationScrollAnimations()` | Education scroll triggers |
| `setupAboutSectionTrigger()` | About section triggers |

## CSS Architecture

### Custom Properties
```css
:root {
    --font-primary: 'Outfit', sans-serif;
    --font-display: 'Space Grotesk', sans-serif;
}

[data-theme="light"] { /* light theme colors */ }
[data-theme="dark"] { /* dark theme colors */ }
```

### Education Section Colors
- **Base text**: White-gold `#fff8e7`
- **Dark theme accent**: Lavender `#a5b4fc`
- **Light theme accent**: Gold `#d4a000`
- **All text**: Dark outlines for visibility

## Mobile Considerations

- Sun/moon hide trigger at `top 80%` (earlier)
- Immediate `visible = false` for reliability
- No split-apart effect on education items
- Reduced 3D model scales

# Architecture Overview

## Core Components

### 1. Three.js Scenes

The portfolio uses **two separate Three.js scenes**:

#### Main Scene (Hero/Projects)
- **Canvas**: `#three-canvas`
- **Models**: Sun (`sun.glb`), Moon (`moon.glb`), Batmobile (`batmobile.glb`)
- **Behavior**: 
  - Sun/Moon switch based on theme
  - Batmobile appears in projects section with scroll-based rotation

#### Space Scene (Education Section)
- **Canvas**: `#space-canvas`
- **Model**: Star cluster (`space.glb`)
- **Behavior**:
  - Initialized when education section enters viewport
  - Camera zooms in/out based on scroll progress
  - Fades out when leaving education section

### 2. Scroll Animation System

Uses **GSAP ScrollTrigger** for all scroll-based animations:

```javascript
ScrollTrigger.create({
    trigger: element,
    start: 'top 80%',
    end: 'bottom top',
    onEnter: () => { /* show */ },
    onLeave: () => { /* hide */ },
    onEnterBack: () => { /* show again */ },
    onLeaveBack: () => { /* hide again */ }
});
```

### 3. Theme System

```javascript
// Theme determination priority:
// 1. localStorage override
// 2. Time-based (6am-7pm = light, else dark)

const savedTheme = localStorage.getItem('portfolio-theme-override');
const timeBasedTheme = getTimeBasedTheme();
currentTheme = savedTheme || timeBasedTheme;
```

## Key Functions

| Function | Purpose |
|----------|---------|
| `init()` | Main initialization |
| `setupScene()` | Creates Three.js scene |
| `loadModels()` | Loads all 3D models |
| `initSpaceScene()` | Creates education section 3D scene |
| `animateSpace()` | Render loop for space scene |
| `setupEducationScrollAnimations()` | Education section scroll triggers |
| `setupAboutSectionTrigger()` | About section scroll triggers |

## CSS Architecture

### Custom Properties
```css
:root {
    --primary: #6366f1;
    --bg-primary: #0f0f1a;
    --text-primary: #ffffff;
    /* ... */
}

[data-theme="light"] {
    --primary: #ff6b35;
    --bg-primary: #fafafa;
    --text-primary: #1a1a2e;
    /* ... */
}
```

### Section Z-Index Layers
- Loading overlay: 9999
- Theme toggle: 1001
- Three.js canvas: 0
- Education section: 500
- Space canvas: 0 (fixed position)

## Performance Considerations

1. **Lazy Loading**: Space scene only initializes when education section enters viewport
2. **Pixel Ratio Limit**: `Math.min(window.devicePixelRatio, 2)` for performance
3. **Mobile Optimizations**: Reduced scale for 3D models, no split effect on mobile
4. **Fallback Stars**: If `space.glb` fails to load, procedural stars are generated

# Bilal Ahmad Portfolio

A stunning, immersive portfolio website featuring 3D elements, smooth scroll animations, and multiple interactive sections.

## 🚀 Features

### Hero Section
- Animated greeting with theme-aware styling
- 3D celestial bodies (Sun/Moon) that switch with theme
- Social links (LinkedIn, GitHub)
- Download resume button + About Me link

### Projects Section
- 11 project cards with unique styling per project
- 3D Batmobile model as background
- Hover effects and smooth transitions
- Separate `projects.html` for full project gallery

### Education & Experience Section
- Immersive 3D space background (`space.glb`)
- Scroll-driven zoom in/out animation through star cluster
- 6 items: 2 education + 2 experience + 2 certifications
- Text with dark outlines for visibility on space background
- **Minimalist color scheme**: White-gold base with lavender/gold accents

### About Me Section
- Clean, minimal design with gradient background
- Theme-aware colors (purple for dark, orange for light)
- Centered flowing paragraphs with highlighted keywords

## 🛠️ Tech Stack

- **HTML5** - Semantic markup with SEO meta tags
- **CSS3** - Custom properties, gradients, glassmorphism
- **JavaScript** - ES6+, async/await, ES modules
- **Three.js** - 3D rendering (sun, moon, batmobile, space)
- **GSAP** - Scroll animations via ScrollTrigger
- **Google Fonts** - Outfit, Space Grotesk

## 📁 Project Structure

```
portfolio/
├── index.html          # Main landing page
├── projects.html       # Full projects gallery
├── css/
│   └── styles.css      # All styles
├── js/
│   └── main.js         # All JavaScript logic
├── assets/
│   ├── sun.glb         # 3D sun model
│   ├── moon_planet.glb # 3D moon model
│   ├── batmobile.glb   # 3D batmobile model
│   ├── space.glb       # 3D star cluster model
│   └── *.jpg/png       # Project images
├── docs/               # Documentation
├── _headers            # Netlify security headers
├── vercel.json         # Vercel configuration
├── robots.txt          # SEO crawling rules
├── sitemap.xml         # SEO sitemap
└── .gitignore          # Git exclusions
```

## 🚀 Getting Started

1. Clone the repository
2. Run a local server:
   ```bash
   npx -y serve .
   ```
3. Open `http://localhost:3000` in your browser

## 🎨 Themes

The site supports **light** and **dark** themes:
- Automatic switching based on time of day (6AM-6PM = light)
- Manual toggle via double-clicking sun/moon
- Theme preference saved to localStorage

## ⚡ Performance Optimizations

- **Throttled mouse events** (100ms) to reduce jank
- **Passive scroll listeners** with RAF batching
- **GSAP scrub values** of 1.5 for smooth animations
- **CSS will-change** hints for GPU acceleration
- **Resource preloading** for critical CSS

## 📱 Responsive Design

Fully responsive across:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

## 🔒 Security & SEO

- Security headers for Netlify and Vercel
- Open Graph and Twitter Card meta tags
- robots.txt and sitemap.xml
- Skip navigation link for accessibility

## 🚀 Deployment

**Vercel**: Select "Other" for framework, push to GitHub
**Netlify**: Connect GitHub repo, auto-deploys on push
**GitHub Pages**: Enable in repo settings

## 📄 License

© 2026 Bilal Ahmad. All rights reserved.

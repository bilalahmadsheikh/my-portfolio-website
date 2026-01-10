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
- Text appears far away, grows, then splits apart as you scroll through

### About Me Section
- Clean, minimal design with gradient background
- Theme-aware colors (purple for dark, orange for light)
- Centered flowing paragraphs with highlighted keywords

## 🛠️ Tech Stack

- **HTML5** - Semantic markup
- **CSS3** - Custom properties, gradients, glassmorphism
- **JavaScript** - ES6+, async/await
- **Three.js** - 3D rendering (sun, moon, batmobile, space)
- **GSAP** - Scroll animations via ScrollTrigger
- **Google Fonts** - Inter, Playfair Display

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
│   ├── moon.glb        # 3D moon model
│   ├── batmobile.glb   # 3D batmobile model
│   ├── space.glb       # 3D star cluster model
│   └── *.jpg/png       # Project images
├── docs/               # Documentation
└── _headers            # Netlify security headers
```

## 🚀 Getting Started

1. Clone or download the repository
2. Run a local server:
   ```bash
   npx -y serve .
   ```
3. Open `http://localhost:3000` in your browser

## 🎨 Themes

The site supports **light** and **dark** themes:
- Automatic switching based on time of day
- Manual toggle via theme button
- Theme preference saved to localStorage

## 📱 Responsive Design

Fully responsive across:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

## 🔒 Security

- `rel="noopener noreferrer"` on all external links
- Security headers configured for Netlify (`_headers`) and Vercel (`vercel.json`)

## 📄 License

© 2026 Bilal Ahmad. All rights reserved.

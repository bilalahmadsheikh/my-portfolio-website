# Customization Guide

## Education Section Text Colors

### Current Color Scheme
```css
/* Base text: White-gold */
color: #fff8e7;

/* Dark theme accent (degree, bold) */
color: #a5b4fc;  /* Lavender */

/* Light theme accent (degree, bold) */
color: #d4a000;  /* Gold */
```

### Text Outline for Visibility
All education text has dark outlines for visibility on space background:
```css
text-shadow: 
    -2px -2px 0 #0a0a1a,
    2px -2px 0 #0a0a1a,
    -2px 2px 0 #0a0a1a,
    2px 2px 0 #0a0a1a;
```

---

## Adding Education/Experience Items

### 1. Add HTML in `index.html`
```html
<div class="education-item" data-education="7">
    <div class="education-left">
        <h3 class="education-school">Name</h3>
        <p class="education-degree">Role/Degree</p>
        <p class="education-years">Date Range</p>
    </div>
    <div class="education-right">
        <p class="education-story">Description...</p>
    </div>
</div>
```

### 2. Update JS item count
```javascript
const numItems = 7; // Was 6, now 7
```

### 3. Increase section height
```css
.education-section { min-height: 1500vh; }
.education-container { min-height: 1500vh; }
```

---

## Changing Theme Colors

### About Section (Dark)
```css
.about-section {
    background: linear-gradient(135deg, #0f0f1a, #1a1a2e, #16213e);
}
.about-name { color: gradient(#ffffff, #a5b4fc, #818cf8); }
.about-text strong { color: #a5b4fc; }
```

### About Section (Light)
```css
[data-theme="light"] .about-section {
    background: linear-gradient(135deg, #fff5f0, #ffeee5, #ffe4d4);
}
[data-theme="light"] .about-text strong { color: #ff6b35; }
```

---

## Deployment

### Vercel
1. Select "Other" for framework
2. Leave build command empty
3. Push to GitHub, auto-deploys

### Netlify
1. Connect GitHub repo
2. Uses `_headers` for security

### GitHub Pages
1. Settings → Pages → Enable
2. Branch: main, folder: root

---

## Updating Personal Info

| Location | What to Update |
|----------|----------------|
| `index.html` | Name, tagline, social links |
| `index.html` | About section bio |
| `index.html` | Education items |
| `projects.html` | Project cards |
| `sitemap.xml` | Your domain URL |
| `robots.txt` | Your sitemap URL |

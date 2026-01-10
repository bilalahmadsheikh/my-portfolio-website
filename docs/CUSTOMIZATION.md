# Customization Guide

## Adding New Projects

### 1. Add to `projects.html`

Add a new card inside `.gallery-grid`:

```html
<article class="gallery-card" data-project="12">
    <div class="card-glow"></div>
    <div class="card-content">
        <span class="project-number">12</span>
        <h3 class="project-name">Project Name</h3>
        <p class="project-type">Category</p>
        <p class="project-desc">Description here...</p>
        <div class="project-tech">
            <span>Tech1</span>
            <span>Tech2</span>
        </div>
        <a href="https://link.com" target="_blank" rel="noopener noreferrer" 
           class="project-link">View Project →</a>
    </div>
</article>
```

### 2. Add CSS Styling

In `projects.html` `<style>` section:

```css
.gallery-card[data-project="12"] {
    background: linear-gradient(135deg, #color1 0%, #color2 100%);
}

.gallery-card[data-project="12"] .project-link {
    background: rgba(r, g, b, 0.2);
    color: #accentColor;
}

.gallery-card[data-project="12"] .project-number {
    color: rgba(r, g, b, 0.3);
}
```

---

## Adding Education/Experience Items

### 1. Add HTML in `index.html`

Inside `.education-container`:

```html
<div class="education-item" data-education="7">
    <div class="education-left">
        <h3 class="education-school">Company/Institution Name</h3>
        <p class="education-degree">Role/Degree</p>
        <p class="education-location">Location (optional)</p>
        <p class="education-years">Date Range</p>
    </div>
    <div class="education-right">
        <p class="education-story">Your story with <strong>highlighted keywords</strong>...</p>
    </div>
</div>
```

### 2. Update JavaScript

In `main.js`, update `numItems`:

```javascript
const numItems = 7; // Was 6, now 7
```

### 3. Increase Section Height

In `styles.css`, update both occurrences:

```css
.education-section {
    min-height: 1500vh; /* Add ~200vh per item */
}

.education-container {
    min-height: 1500vh;
}
```

---

## Changing Theme Colors

### Dark Theme (default)
In `:root` at top of `styles.css`:

```css
:root {
    --primary: #6366f1;      /* Purple accent */
    --primary-light: #818cf8;
    --bg-primary: #0f0f1a;   /* Dark background */
}
```

### Light Theme
In `[data-theme="light"]`:

```css
[data-theme="light"] {
    --primary: #ff6b35;      /* Orange accent */
    --primary-light: #ff8c5a;
    --bg-primary: #fafafa;   /* Light background */
}
```

---

## Replacing 3D Models

1. Add new `.glb` file to `assets/`
2. Update path in `main.js`:

```javascript
loader.load('assets/your-model.glb', (gltf) => {
    // Handle model
});
```

3. Adjust scale and position as needed

---

## Updating Personal Info

### Hero Section
In `index.html`, update:
- Name in `.hero-title`
- Tagline in `.hero-tagline`
- Resume file path in download button

### About Section
Update paragraphs in `.about-text`

### Social Links
Update URLs in `.social-links`

### Footer
Update copyright in `.site-footer`

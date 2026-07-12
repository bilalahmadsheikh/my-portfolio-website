// Applies the saved/time-based theme before first paint to avoid flash.
// With data-preload-models on the script tag, it also starts downloading the
// theme's celestial GLB immediately — long before the Three.js module graph resolves.
(function () {
    var savedTheme = localStorage.getItem('portfolio-theme-override');
    var hour = new Date().getHours();
    var timeBasedTheme = (hour >= 6 && hour < 18) ? 'light' : 'dark';
    var theme = savedTheme || timeBasedTheme;
    document.documentElement.setAttribute('data-theme', theme);

    if (document.currentScript && document.currentScript.hasAttribute('data-preload-models')) {
        var link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'fetch';
        link.crossOrigin = 'anonymous';
        link.href = theme === 'light' ? 'assets/sun.glb' : 'assets/moon_planet.glb';
        document.head.appendChild(link);
    }
}());

// Applies the saved/time-based theme before first paint to avoid flash
(function () {
    var savedTheme = localStorage.getItem('portfolio-theme-override');
    var hour = new Date().getHours();
    var timeBasedTheme = (hour >= 6 && hour < 18) ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme || timeBasedTheme);
}());

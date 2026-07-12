/**
 * Bilal Ahmad's Portfolio - Main JavaScript
 * Three.js Sun/Moon Theme System with Burning Paper Reveal
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ========================================
// CONFIGURATION
// ========================================
const CONFIG = {
    // Time-based theme (6AM - 6PM = day)
    DAY_START_HOUR: 6,
    DAY_END_HOUR: 18,

    // Animation durations (ms)
    INITIAL_DELAY: 150,
    CELESTIAL_FADE_DURATION: 450,
    CELESTIAL_DESCENT_DURATION: 2200,
    BURN_REVEAL_DURATION: 2600,
    SWAP_DURATION: 1000,

    // 3D Model positions - RESPONSIVE
    getCelestialPosition: () => {
        const isMobile = window.innerWidth < 768;
        const isTablet = window.innerWidth < 1024;

        if (isMobile) {
            return { x: 1.5, y: 4, z: -5 };  // Moved left for mobile
        } else if (isTablet) {
            return { x: 4.2, y: 4.3, z: -5 };
        } else {
            return { x: 4.5, y: 3, z: -5 };
        }
    },

    CELESTIAL_START_Y_OFFSET: 6,  // How far above final position to start

    // Sizes - RESPONSIVE (smaller for mobile/tablet)
    getSunScale: () => {
        const isMobile = window.innerWidth < 768;
        const isTablet = window.innerWidth < 1024;

        if (isMobile) return 0.10;  // Slightly smaller for mobile
        if (isTablet) return 0.15;
        return 0.18;
    },
    getMoonScale: () => {
        const isMobile = window.innerWidth < 768;
        const isTablet = window.innerWidth < 1024;

        if (isMobile) return 0.5;  // Slightly smaller for mobile
        if (isTablet) return 0.8;
        return 1;
    },

    // Rotation speed
    ROTATION_SPEED: 0.005,

    // Storage key
    THEME_STORAGE_KEY: 'portfolio-theme-override'
};

// Respect the user's motion preference — long cinematic intros are skipped
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ========================================
// STATE
// ========================================
let scene, camera, renderer;
let sunModel, moonModel;
let batmobileModel;  // Projects section model
let currentTheme = 'light';
let isAnimating = false;
let raycaster, mouse;

// Loading and visibility state flags
let modelsLoaded = false;
let projectModelsLoaded = false;
let scrollTriggersReady = false;  // Track if scroll animations are ready
let batmobileVisible = false;  // Track batmobile visibility for scrub bounds
let inProjectsSection = false;  // Track if we're in projects section

// ========================================
// INITIALIZATION
// ========================================
async function init() {
    const loadingOverlay = document.getElementById('loading-overlay');

    // Determine initial theme FIRST
    const savedTheme = localStorage.getItem(CONFIG.THEME_STORAGE_KEY);
    const timeBasedTheme = getTimeBasedTheme();
    currentTheme = savedTheme || timeBasedTheme;

    // Apply theme immediately
    document.documentElement.setAttribute('data-theme', currentTheme);

    // Setup Three.js scene
    setupScene();
    setupCamera();
    setupRenderer();
    setupLighting();

    // Setup raycaster
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Load ONLY sun/moon first — small files needed for the intro animation.
    // Batmobile loads in the background while the ~4s intro plays.
    await loadModels();
    modelsLoaded = true;

    // The real intro is ready — cancel the black-screen failsafe (see index.html)
    if (window.__pgFailsafe) clearTimeout(window.__pgFailsafe);

    // Setup interactions and parallax
    setupClickHandler();
    setupParallaxBackground();

    // Pre-render one frame to ensure GPU has hero assets ready
    renderer.render(scene, camera);

    // Start animation loop
    animate();

    // Hide loading overlay immediately — user sees clean black screen briefly
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }

    // Load batmobile + setup scroll triggers in the background.
    // The intro takes ~3s, giving plenty of time before the user can scroll to projects.
    const projectSetupPromise = preloadProjectModels().then(async () => {
        projectModelsLoaded = true;
        await setupProjectsSection();
        scrollTriggersReady = true;
    }).catch(console.error);

    await delay(CONFIG.INITIAL_DELAY);

    // Play intro animation while batmobile loads in background
    await playBurningPaperIntro();

    setTimeout(showThemeHint, 1500);

    // Ensure project setup finishes (should already be done by now)
    await projectSetupPromise;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================
// THREE.JS SETUP
// ========================================
function setupScene() {
    scene = new THREE.Scene();
    scene.background = null;
}

function setupCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
}

function setupRenderer() {
    const canvas = document.getElementById('three-canvas');
    renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Cap device pixel ratio harder on mobile — retina x3 rendering is wasted battery
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    window.addEventListener('resize', onWindowResize);
}

function setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);

    const sunLight = new THREE.DirectionalLight(0xffdd88, 2);
    sunLight.position.set(5, 5, 5);
    scene.add(sunLight);

    const pos = CONFIG.getCelestialPosition();
    const glowLight = new THREE.PointLight(0xff8844, 3, 30);
    glowLight.position.set(pos.x, pos.y, pos.z + 3);
    scene.add(glowLight);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    updateCelestialPositions();
    updateBatmobileScale();
}

// Update batmobile scale on resize
function updateBatmobileScale() {
    if (batmobileModel && batmobileVisible) {
        const scale = getBatmobileScale();
        batmobileModel.scale.set(scale, scale, scale);
    }
}

function updateCelestialPositions() {
    const pos = CONFIG.getCelestialPosition();

    if (sunModel) {
        sunModel.position.x = pos.x;
        sunModel.position.z = pos.z;
        sunModel.scale.setScalar(CONFIG.getSunScale());
    }
    if (moonModel) {
        moonModel.position.x = pos.x;
        moonModel.position.z = pos.z;
        moonModel.scale.setScalar(CONFIG.getMoonScale());
    }
}

// ========================================
// MODEL LOADING
// ========================================
function setupCelestialModel(gltfScene, name, scale, pos, startY) {
    const model = gltfScene;
    model.scale.setScalar(scale);
    model.position.set(pos.x, startY, pos.z);
    model.visible = false;  // Completely hidden until the intro reveals it
    model.name = name;

    model.traverse((child) => {
        if (child.isMesh) {
            child.material = child.material.clone();
            child.material.transparent = true;
            child.material.opacity = 0;
        }
    });
    scene.add(model);
    return model;
}

async function loadModels() {
    const loader = new GLTFLoader();
    const pos = CONFIG.getCelestialPosition();
    const startY = pos.y + CONFIG.CELESTIAL_START_Y_OFFSET;
    const isDay = currentTheme === 'light';

    // Only the theme's active model gates the intro; the other one
    // loads in the background and is only needed if the user toggles.
    const activeUrl = isDay ? './assets/sun.glb' : './assets/moon_planet.glb';
    const inactiveUrl = isDay ? './assets/moon_planet.glb' : './assets/sun.glb';

    try {
        const gltf = await loader.loadAsync(activeUrl);
        const model = setupCelestialModel(
            gltf.scene,
            isDay ? 'sun' : 'moon',
            isDay ? CONFIG.getSunScale() : CONFIG.getMoonScale(),
            pos, startY
        );
        if (isDay) sunModel = model; else moonModel = model;
    } catch (error) {
        console.error('Failed to load celestial model:', error);
    }

    loader.loadAsync(inactiveUrl).then((gltf) => {
        const model = setupCelestialModel(
            gltf.scene,
            isDay ? 'moon' : 'sun',
            isDay ? CONFIG.getMoonScale() : CONFIG.getSunScale(),
            pos, startY
        );
        if (isDay) moonModel = model; else sunModel = model;
    }).catch((error) => {
        console.error('Failed to load celestial model:', error);
    });
}

// ========================================
// BURNING PAPER INTRO - SYNCED WITH CONTENT
// ========================================
async function playBurningPaperIntro() {
    const isDay = currentTheme === 'light';
    const activeModel = isDay ? sunModel : moonModel;
    const inactiveModel = isDay ? moonModel : sunModel;
    const overlay = document.getElementById('sunrise-overlay');
    const mainContent = document.getElementById('main-content');

    // Ensure inactive model stays hidden
    if (inactiveModel) {
        inactiveModel.visible = false;
        setModelOpacity(inactiveModel, 0);
    }

    // Get responsive position
    const pos = CONFIG.getCelestialPosition();
    const startY = pos.y + CONFIG.CELESTIAL_START_Y_OFFSET;
    const endY = pos.y;

    // Reduced motion — or the failsafe already revealed the page —
    // skip the cinematic intro and show everything instantly
    if (REDUCED_MOTION || window.__introFallback) {
        if (activeModel) {
            activeModel.position.set(pos.x, endY, pos.z);
            setModelOpacity(activeModel, 1);
            activeModel.visible = true;
        }
        document.body.classList.remove('theme-loading');
        overlay.classList.add('revealed');
        mainContent.style.opacity = '1';
        mainContent.style.transform = 'none';
        mainContent.classList.add('visible');
        updateThemeUI(currentTheme);
        return;
    }

    // Setup active model - start HIDDEN and at top
    if (activeModel) {
        activeModel.position.set(pos.x, startY, pos.z);
        setModelOpacity(activeModel, 0);
        activeModel.visible = true;  // Now make visible but with 0 opacity
    }

    // Prepare content for reveal (will fade in during burn).
    // Disable the CSS transition while JS drives opacity per frame,
    // otherwise every update lags 1s behind and the reveal smears.
    document.body.classList.remove('theme-loading');
    mainContent.style.transition = 'none';
    mainContent.style.opacity = '0';
    mainContent.style.transform = 'translateY(20px)';

    // Step 1: Quick fade in celestial at top
    await fadeInCelestialBody(activeModel, CONFIG.CELESTIAL_FADE_DURATION);

    // Step 2: ALL AT ONCE - descent + burn + content reveal
    await Promise.all([
        descendCelestialBody(activeModel, startY, endY),
        burningPaperReveal(overlay, isDay),
        revealContentGradually(mainContent)
    ]);

    // Final cleanup - restore the stylesheet transition
    mainContent.classList.add('visible');
    mainContent.style.transition = '';
    mainContent.style.opacity = '';
    mainContent.style.transform = '';
    updateThemeUI(currentTheme);
}

function setModelOpacity(model, opacity) {
    if (!model) return;
    model.traverse((child) => {
        if (child.isMesh && child.material) {
            child.material.opacity = opacity;
        }
    });
}

function fadeInCelestialBody(model, duration = CONFIG.CELESTIAL_FADE_DURATION) {
    return new Promise((resolve) => {
        if (!model) { resolve(); return; }

        const startTime = performance.now();

        function animateFade() {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutCubic(progress);

            setModelOpacity(model, eased);

            if (progress < 1) {
                requestAnimationFrame(animateFade);
            } else {
                resolve();
            }
        }

        animateFade();
    });
}

function descendCelestialBody(model, startY, endY) {
    return new Promise((resolve) => {
        if (!model) { resolve(); return; }

        const startTime = performance.now();
        const duration = CONFIG.CELESTIAL_DESCENT_DURATION;

        function animateDescent() {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutQuart(progress);

            model.position.y = startY + (endY - startY) * eased;

            if (progress < 1) {
                requestAnimationFrame(animateDescent);
            } else {
                resolve();
            }
        }

        animateDescent();
    });
}

function burningPaperReveal(overlay, isDay) {
    return new Promise((resolve) => {
        const startTime = performance.now();
        const duration = CONFIG.BURN_REVEAL_DURATION;

        // Get responsive burn origin
        const isMobile = window.innerWidth < 768;
        const burnOriginX = isMobile ? '70%' : '85%';
        const burnOriginY = isMobile ? '20%' : '12%';

        const burnColor = isDay
            ? 'rgba(255, 120, 50, 0.8)'
            : 'rgba(100, 80, 200, 0.6)';

        const emberColor = isDay
            ? 'rgba(255, 200, 100, 0.5)'
            : 'rgba(150, 130, 255, 0.4)';

        function animateBurn() {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeInOutQuad(progress);

            const radius = eased * 250;
            const burnEdge = radius + 5;
            const emberEdge = radius + 15;
            const charEdge = radius + 30;

            overlay.style.background = `
                radial-gradient(
                    ellipse at ${burnOriginX} ${burnOriginY},
                    transparent ${radius}%,
                    ${burnColor} ${burnEdge}%,
                    ${emberColor} ${emberEdge}%,
                    rgba(50, 30, 20, 0.9) ${charEdge}%,
                    #000000 ${charEdge + 20}%
                )
            `;

            if (progress > 0.1 && progress < 0.9) {
                const glowIntensity = Math.sin(progress * Math.PI) * 30;
                overlay.style.boxShadow = `inset 0 0 ${glowIntensity}px ${isDay ? 'rgba(255,150,50,0.3)' : 'rgba(100,100,200,0.3)'}`;
            }

            if (progress < 1) {
                requestAnimationFrame(animateBurn);
            } else {
                overlay.style.transition = 'opacity 0.5s ease-out';
                overlay.classList.add('revealed');
                setTimeout(resolve, 500);
            }
        }

        animateBurn();
    });
}

// Content reveals IN SYNC with burn - starts partway through
function revealContentGradually(mainContent) {
    return new Promise((resolve) => {
        const startTime = performance.now();
        // Content reveal starts after 30% of burn and finishes with it
        const delayPercent = 0.3;
        const duration = CONFIG.BURN_REVEAL_DURATION * (1 - delayPercent);
        const delayMs = CONFIG.BURN_REVEAL_DURATION * delayPercent;

        setTimeout(() => {
            function animateContent() {
                const elapsed = performance.now() - startTime - delayMs;
                const progress = Math.min(Math.max(elapsed / duration, 0), 1);
                const eased = easeOutCubic(progress);

                mainContent.style.opacity = eased;
                mainContent.style.transform = `translateY(${20 * (1 - eased)}px)`;

                if (progress < 1) {
                    requestAnimationFrame(animateContent);
                } else {
                    resolve();
                }
            }
            animateContent();
        }, delayMs);
    });
}

// ========================================
// THEME SYSTEM
// ========================================
function getTimeBasedTheme() {
    const hour = new Date().getHours();
    return (hour >= CONFIG.DAY_START_HOUR && hour < CONFIG.DAY_END_HOUR) ? 'light' : 'dark';
}

function updateThemeUI(theme) {
    const celestialName = document.getElementById('celestial-name');
    if (celestialName) {
        celestialName.textContent = theme === 'light' ? 'sun' : 'moon';
    }

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
        metaTheme.setAttribute('content', theme === 'light' ? '#f8f9fc' : '#0a0a0f');
    }
}

async function toggleTheme() {
    if (isAnimating) return;
    isAnimating = true;

    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    hideThemeHint();
    await swapCelestialBodies(newTheme);

    document.documentElement.setAttribute('data-theme', newTheme);
    currentTheme = newTheme;
    updateThemeUI(newTheme);
    localStorage.setItem(CONFIG.THEME_STORAGE_KEY, newTheme);

    isAnimating = false;
    setTimeout(showThemeHint, 2000);
}

function swapCelestialBodies(newTheme) {
    return new Promise((resolve) => {
        const outgoingModel = newTheme === 'dark' ? sunModel : moonModel;
        const incomingModel = newTheme === 'dark' ? moonModel : sunModel;

        if (!outgoingModel || !incomingModel) {
            resolve();
            return;
        }

        const pos = CONFIG.getCelestialPosition();
        const startTime = performance.now();
        const centerY = pos.y;
        const exitY = centerY - 10;
        const enterY = centerY + 10;

        incomingModel.visible = true;
        incomingModel.position.set(pos.x, enterY, pos.z);
        setModelOpacity(incomingModel, 0);

        function animateSwap() {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / CONFIG.SWAP_DURATION, 1);
            const eased = easeInOutCubic(progress);

            outgoingModel.position.y = centerY + (exitY - centerY) * eased;
            setModelOpacity(outgoingModel, 1 - eased);

            incomingModel.position.y = enterY + (centerY - enterY) * eased;
            setModelOpacity(incomingModel, eased);

            if (progress < 1) {
                requestAnimationFrame(animateSwap);
            } else {
                outgoingModel.visible = false;
                setModelOpacity(incomingModel, 1);
                resolve();
            }
        }

        animateSwap();
    });
}

// ========================================
// CLICK HANDLING - DOUBLE CLICK ONLY
// ========================================
function setupClickHandler() {
    const canvas = document.getElementById('three-canvas');

    canvas.addEventListener('dblclick', onCanvasDoubleClick, false);

    let lastTapTime = 0;
    canvas.addEventListener('touchend', (event) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTapTime;

        if (tapLength < 300 && tapLength > 0) {
            if (event.changedTouches.length > 0) {
                const touch = event.changedTouches[0];
                mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
                checkIntersection();
            }
        }
        lastTapTime = currentTime;
    }, false);

    canvas.addEventListener('mousemove', onCanvasMouseMove, { passive: true });
}

function onCanvasDoubleClick(event) {
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    checkIntersection();
}

// Throttled mouse move to reduce jank during scroll
let lastMouseMoveTime = 0;
const MOUSE_MOVE_THROTTLE = 100; // ms

function onCanvasMouseMove(event) {
    const now = performance.now();
    if (now - lastMouseMoveTime < MOUSE_MOVE_THROTTLE) return;
    lastMouseMoveTime = now;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const objectsToTest = getClickableObjects();
    const intersects = raycaster.intersectObjects(objectsToTest, true);

    const canvas = document.getElementById('three-canvas');
    canvas.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
}

function getClickableObjects() {
    const objects = [];
    if (sunModel && sunModel.visible) objects.push(sunModel);
    if (moonModel && moonModel.visible) objects.push(moonModel);
    return objects;
}

function checkIntersection() {
    raycaster.setFromCamera(mouse, camera);

    const objectsToTest = getClickableObjects();
    const intersects = raycaster.intersectObjects(objectsToTest, true);

    if (intersects.length > 0) {
        toggleTheme();
    }
}

// ========================================
// UI HELPERS
// ========================================
function showThemeHint() {
    const hint = document.getElementById('theme-hint');
    if (hint) hint.classList.add('visible');
}

function hideThemeHint() {
    const hint = document.getElementById('theme-hint');
    if (hint) hint.classList.remove('visible');
}

// ========================================
// ANIMATION LOOP
// ========================================
let heroCanvasHasContent = true;

function animate() {
    requestAnimationFrame(animate);

    const sunVisible = sunModel && sunModel.visible;
    const moonVisible = moonModel && moonModel.visible;
    const batVisible = batmobileModel && batmobileModel.visible;

    // Nothing on screen (e.g. education/about sections) — skip the GPU entirely,
    // clearing the canvas once so no stale frame lingers
    if (!sunVisible && !moonVisible && !batVisible) {
        if (heroCanvasHasContent) {
            renderer.clear();
            heroCanvasHasContent = false;
        }
        return;
    }
    heroCanvasHasContent = true;

    if (sunVisible) {
        sunModel.rotation.y += CONFIG.ROTATION_SPEED;
    }
    if (moonVisible) {
        moonModel.rotation.y += CONFIG.ROTATION_SPEED;
    }

    renderer.render(scene, camera);
}

// ========================================
// EASING FUNCTIONS
// ========================================
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// ========================================
// PARALLAX BACKGROUND SYSTEM
// ========================================
function setupParallaxBackground() {
    createStars();
    createClouds();
    createParticles();
    createShootingStars();
    setupParallaxScroll();
}

function createStars() {
    const starsContainer = document.getElementById('stars-far');
    if (!starsContainer) return;

    const starCount = window.innerWidth < 768 ? 90 : 150;

    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';

        const size = Math.random() * 3 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        star.style.animationDuration = `${2 + Math.random() * 2}s`;

        starsContainer.appendChild(star);
    }
}

function createClouds() {
    const cloudsFar = document.getElementById('clouds-far');
    const cloudsMid = document.getElementById('clouds-mid');

    if (cloudsFar) {
        for (let i = 0; i < 8; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'cloud';

            const width = 150 + Math.random() * 200;
            const height = 50 + Math.random() * 80;

            cloud.style.width = `${width}px`;
            cloud.style.height = `${height}px`;
            cloud.style.left = `${Math.random() * 100}%`;
            cloud.style.top = `${10 + Math.random() * 30}%`;
            cloud.style.animationDelay = `${-Math.random() * 60}s`;
            cloud.style.opacity = 0.3 + Math.random() * 0.3;

            cloudsFar.appendChild(cloud);
        }
    }

    if (cloudsMid) {
        for (let i = 0; i < 5; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'cloud';

            const width = 200 + Math.random() * 300;
            const height = 80 + Math.random() * 100;

            cloud.style.width = `${width}px`;
            cloud.style.height = `${height}px`;
            cloud.style.left = `${Math.random() * 100}%`;
            cloud.style.top = `${20 + Math.random() * 40}%`;
            cloud.style.animationDelay = `${-Math.random() * 80}s`;
            cloud.style.opacity = 0.2 + Math.random() * 0.2;

            cloudsMid.appendChild(cloud);
        }
    }
}

function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;

    const particleCount = window.innerWidth < 768 ? 18 : 30;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        const size = 2 + Math.random() * 4;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        // Drift is a pure CSS animation (see @keyframes particleDrift) —
        // no per-frame JS, fully GPU-composited
        particle.style.setProperty('--drift-x', `${(Math.random() - 0.5) * 40}vw`);
        particle.style.setProperty('--drift-y', `${-(30 + Math.random() * 50)}vh`);
        particle.style.animationDuration = `${18 + Math.random() * 22}s`;
        particle.style.animationDelay = `${-Math.random() * 20}s`;

        particlesContainer.appendChild(particle);
    }
}

function createShootingStars() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;

    for (let i = 0; i < 3; i++) {
        const shootingStar = document.createElement('div');
        shootingStar.className = 'shooting-star';
        shootingStar.style.left = `${20 + Math.random() * 60}%`;
        shootingStar.style.top = `${10 + Math.random() * 40}%`;
        shootingStar.style.animationDelay = `${i * 5 + Math.random() * 3}s`;
        shootingStar.style.animationDuration = `${3 + Math.random() * 2}s`;

        particlesContainer.appendChild(shootingStar);
    }
}

function setupParallaxScroll() {
    const layers = document.querySelectorAll('.parallax-layer[data-speed]');
    const canvas = document.getElementById('three-canvas');
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                const heroHeight = window.innerHeight;

                // Toggle canvas pointer-events based on scroll position
                if (canvas) {
                    if (scrollY < heroHeight * 0.8) {
                        canvas.style.pointerEvents = 'auto';
                    } else {
                        canvas.style.pointerEvents = 'none';
                    }
                }

                layers.forEach(layer => {
                    const speed = parseFloat(layer.dataset.speed);
                    const yOffset = scrollY * speed;
                    layer.style.transform = `translateY(${yOffset}px)`;
                });

                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    // Initialize canvas pointer-events based on initial scroll position
    if (canvas) {
        canvas.style.pointerEvents = window.scrollY < window.innerHeight * 0.8 ? 'auto' : 'none';
    }
}

// ========================================
// BUTTON HANDLERS
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    const exploreBtn = document.getElementById('explore-btn');
    if (exploreBtn) {
        exploreBtn.addEventListener('click', () => {
            // Smooth scroll to projects section
            const projectsSection = document.getElementById('projects-section');
            if (projectsSection) {
                projectsSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    const contactBtn = document.getElementById('contact-btn');
    if (contactBtn) {
        contactBtn.addEventListener('click', () => {
        });
    }
});

// ========================================
// PROJECTS SECTION - GSAP SCROLL ANIMATIONS
// ========================================
async function setupProjectsSection() {
    // Wait for GSAP to be available
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.warn('GSAP not loaded, skipping projects animations');
        return;
    }

    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // Configure ScrollTrigger for smooth performance
    ScrollTrigger.config({
        ignoreMobileResize: true
    });


    // Pre-setup all animations
    setupProjectIntroAnimation();
    setupBatmobileScrollAnimation();
    setupProjectCardsAnimation();
    setupScrollIndicatorHide();

    // Pre-calculate all trigger positions
    ScrollTrigger.refresh(true);

}

// Preload and PRE-POSITION all project assets for instant display
async function preloadProjectModels() {
    const loader = new GLTFLoader();

    try {
        // Load Batmobile
        const batmobileResult = await loader.loadAsync('./assets/batmobile_armored.glb');
        batmobileModel = batmobileResult.scene;

        // Get responsive scale based on screen size
        const batmobileScale = getBatmobileScale();

        // PRE-POSITION: Start completely off-screen left (not visible at all)
        batmobileModel.scale.set(batmobileScale, batmobileScale, batmobileScale);
        batmobileModel.position.set(-15, -4.8, -5);  // Way off-screen left
        batmobileModel.rotation.y = -Math.PI / 2;  // Face RIGHT
        batmobileModel.visible = false;

        // Pre-compile materials for GPU - prevents loading stutter
        batmobileModel.traverse((child) => {
            if (child.isMesh) {
                child.frustumCulled = false;  // Always render when visible
                if (child.material) {
                    child.material.needsUpdate = true;
                }
            }
        });

        scene.add(batmobileModel);

        // Force GPU to compile the model by rendering once
        batmobileModel.visible = true;
        renderer.render(scene, camera);
        batmobileModel.visible = false;


    } catch (error) {
        console.error('Error preloading project models:', error);
    }
}

// Get responsive batmobile scale based on screen size
function getBatmobileScale() {
    const width = window.innerWidth;
    if (width <= 480) return 0.45;     // Small mobile — smaller so it doesn't dominate the screen
    if (width <= 768) return 0.65;     // Mobile
    if (width <= 1024) return 1.4;     // Tablet
    return 1.8;                         // Desktop
}

function setupProjectIntroAnimation() {
    const projectIntro = document.getElementById('project-intro');
    const introContainer = document.querySelector('.intro-container');
    const navGuide = document.getElementById('projects-nav-guide');

    if (!projectIntro) return;

    // Show/hide the "Scroll down to browse projects" nav guide
    if (navGuide) {
        ScrollTrigger.create({
            trigger: '#road-scene',
            start: 'top 60%',
            end: 'bottom bottom',
            onEnter: () => navGuide.classList.add('visible'),
            onLeave: () => navGuide.classList.remove('visible'),
            onEnterBack: () => navGuide.classList.add('visible'),
            onLeaveBack: () => navGuide.classList.remove('visible'),
        });
    }

    // Hide sun/moon when entering projects section
    ScrollTrigger.create({
        trigger: '#projects-section',
        start: 'top 80%',  // Earlier trigger for mobile
        end: 'bottom top',
        onEnter: () => {
            inProjectsSection = true;
            // Hide sun/moon immediately and animate
            if (sunModel) {
                sunModel.visible = false;
                gsap.set(sunModel.scale, { x: 0, y: 0, z: 0 });
            }
            if (moonModel) {
                moonModel.visible = false;
                gsap.set(moonModel.scale, { x: 0, y: 0, z: 0 });
            }
        },
        onLeave: () => {
            // Scrolled past projects section entirely
            inProjectsSection = false;
        },
        onEnterBack: () => {
            // Coming back into projects from below
            inProjectsSection = true;
            // Keep sun/moon hidden
            if (sunModel) {
                sunModel.visible = false;
                gsap.set(sunModel.scale, { x: 0, y: 0, z: 0 });
            }
            if (moonModel) {
                moonModel.visible = false;
                gsap.set(moonModel.scale, { x: 0, y: 0, z: 0 });
            }
        },
        onLeaveBack: () => {
            // Scrolling back to hero section - restore sun/moon
            inProjectsSection = false;
            const activeModel = currentTheme === 'light' ? sunModel : moonModel;
            if (activeModel) {
                const scale = currentTheme === 'light' ? CONFIG.getSunScale() : CONFIG.getMoonScale();
                activeModel.visible = true;
                setModelOpacity(activeModel, 1);
                gsap.to(activeModel.scale, {
                    x: scale,
                    y: scale,
                    z: scale,
                    duration: 0.4,
                    ease: 'power2.out'
                });
            }
        }
    });

    // Title Animation
    ScrollTrigger.create({
        trigger: projectIntro,
        start: 'top 40%',
        end: 'bottom 60%',
        onEnter: () => {
            // Show intro container
            if (introContainer) {
                gsap.to(introContainer, {
                    opacity: 1,
                    scale: 1,
                    duration: 0.6,
                    ease: 'power2.out'
                });
            }
        },
        onLeave: () => {
            // Fade out when scrolling past intro
            if (introContainer) {
                gsap.to(introContainer, { opacity: 0.3, duration: 0.3 });
            }
        },
        onEnterBack: () => {
            if (introContainer) {
                gsap.to(introContainer, { opacity: 1, scale: 1, duration: 0.4 });
            }
        },
        onLeaveBack: () => {
            // Hide when leaving projects section (scrolling back to hero)
            if (introContainer) {
                gsap.to(introContainer, { opacity: 0, scale: 0.8, duration: 0.2 });
            }
        }
    });
}

function setupBatmobileScrollAnimation() {
    const roadScene = document.getElementById('road-scene');
    const batmobileContainer = document.getElementById('batmobile-container');

    if (!roadScene || !batmobileModel) return;

    const batmobileScale = getBatmobileScale();

    // Batmobile visibility control - INSTANT show/hide, no animation delay
    ScrollTrigger.create({
        trigger: roadScene,
        start: 'top 70%',
        end: 'bottom 20%',
        onEnter: () => {
            batmobileVisible = true;
            batmobileModel.visible = true;
            batmobileModel.scale.set(batmobileScale, batmobileScale, batmobileScale);
            if (batmobileContainer) batmobileContainer.classList.add('visible');
        },
        onLeave: () => {
            batmobileVisible = false;
            batmobileModel.visible = false;
            if (batmobileContainer) batmobileContainer.classList.remove('visible');
        },
        onEnterBack: () => {
            batmobileVisible = true;
            batmobileModel.visible = true;
            batmobileModel.scale.set(batmobileScale, batmobileScale, batmobileScale);
            if (batmobileContainer) batmobileContainer.classList.add('visible');
        },
        onLeaveBack: () => {
            batmobileVisible = false;
            batmobileModel.visible = false;
            if (batmobileContainer) batmobileContainer.classList.remove('visible');
        }
    });

    // Batmobile SLIDES IN from completely off-screen left, then drives across
    ScrollTrigger.create({
        trigger: roadScene,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5,  // Smoother scrolling
        onUpdate: (self) => {
            if (batmobileModel && batmobileVisible) {
                const progress = self.progress;
                // Start way off-screen left (-15), slide in and drive to right (+6)
                // First 20% of scroll: slide into view from -15 to -4
                // Remaining 80%: drive across screen from -4 to +6
                let xPos;
                if (progress < 0.20) {
                    // Slide in phase - from completely off-screen
                    xPos = -15 + (progress / 0.20) * 11;  // -15 to -4
                } else {
                    // Driving phase
                    const driveProgress = (progress - 0.20) / 0.80;
                    xPos = -4 + (driveProgress * 10);  // -4 to +6
                }
                batmobileModel.position.x = xPos;
                // Keep very low on screen with slight bobbing
                batmobileModel.position.y = -4.8 + Math.sin(progress * Math.PI * 8) * 0.02;
                // Very subtle rotation to simulate suspension
                batmobileModel.rotation.z = Math.sin(progress * Math.PI * 12) * 0.008;
            }
        }
    });
}

function setupProjectCardsAnimation() {
    const landmarks = document.querySelectorAll('.project-landmark');
    const roadScene = document.getElementById('road-scene');

    if (!roadScene || landmarks.length === 0) {
        console.error('Missing road scene or landmarks');
        return;
    }


    // CRITICAL FIX: Move all landmarks to body so they're truly fixed
    // Remove them from .landmarks-container
    landmarks.forEach(landmark => {
        document.body.appendChild(landmark);
    });

    // Add "Read more" toggle on mobile so users can read full descriptions
    if (window.innerWidth <= 768) {
        landmarks.forEach(landmark => {
            const desc = landmark.querySelector('.project-desc');
            if (!desc) return;
            const btn = document.createElement('button');
            btn.className = 'read-more-btn';
            btn.textContent = 'Read more';
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const expanded = desc.classList.toggle('expanded');
                btn.textContent = expanded ? 'Read less' : 'Read more';
            });
            desc.insertAdjacentElement('afterend', btn);
        });
    }

    const totalProjects = landmarks.length;
    const projectStartProgress = 0.15;
    const projectScrollRange = 1 - projectStartProgress;

    // Initialize all cards - start off-screen right with FIXED positioning
    landmarks.forEach((landmark, index) => {
        // Force position fixed (in case CSS is overridden)
        landmark.style.position = 'fixed';
        landmark.style.top = '50%';
        landmark.style.left = '0';
        landmark.style.right = 'auto';
        landmark.style.bottom = 'auto';
        landmark.style.transform = 'translateX(100vw) translateY(-50%)';
        landmark.style.opacity = '0';
        landmark.style.zIndex = '30';
        landmark.style.pointerEvents = 'none';
    });

    ScrollTrigger.create({
        trigger: roadScene,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5,  // Smoother scrolling
        onUpdate: (self) => {
            const progress = self.progress;

            // Wait for batmobile to slide in
            if (progress < projectStartProgress) {
                landmarks.forEach(landmark => {
                    landmark.style.position = 'fixed';
                    landmark.style.top = '50%';
                    landmark.style.transform = 'translateX(100vw) translateY(-50%)';
                    landmark.style.opacity = '0';
                    landmark.style.pointerEvents = 'none';
                });
                return;
            }

            // Calculate which project is active
            const projectProgress = (progress - projectStartProgress) / projectScrollRange;
            const activeIndex = Math.min(
                Math.floor(projectProgress * totalProjects),
                totalProjects - 1
            );

            // Calculate local progress within current project (0 to 1)
            const progressPerProject = 1 / totalProjects;
            const currentProjectStart = activeIndex * progressPerProject;
            const localProgress = (projectProgress - currentProjectStart) / progressPerProject;
            const clampedProgress = Math.max(0, Math.min(1, localProgress));

            landmarks.forEach((landmark, index) => {
                // Ensure fixed positioning on every update
                landmark.style.position = 'fixed';
                landmark.style.top = '50%';
                landmark.style.left = '0';
                landmark.style.right = 'auto';
                landmark.style.bottom = 'auto';

                // Responsive start position - mobile screens need full-width animation
                const isMobile = window.innerWidth <= 768;
                const isSmallMobile = window.innerWidth <= 480;

                if (index === activeIndex) {
                    // Active card: slide in from fully off-screen right → sweep across → exit left
                    let startX, endX;
                    if (isSmallMobile) {
                        startX = 100;  // Left edge starts at right viewport edge — fully off-screen
                        endX = -80;    // Exit fully to left
                    } else if (isMobile) {
                        startX = 100;  // Fully off-screen right
                        endX = -80;    // Exit fully to left
                    } else {
                        startX = 100;  // Start far right for desktop
                        endX = -100;
                    }
                    const xPercent = startX + (clampedProgress * (endX - startX));

                    // Fade at the sweep edges so cards dissolve in/out instead of popping
                    let cardOpacity = 1;
                    if (clampedProgress < 0.12) {
                        cardOpacity = clampedProgress / 0.12;
                    } else if (clampedProgress > 0.88) {
                        cardOpacity = (1 - clampedProgress) / 0.12;
                    }

                    landmark.style.transform = `translateX(${xPercent}vw) translateY(-50%)`;
                    landmark.style.opacity = Math.max(0, Math.min(1, cardOpacity)).toFixed(3);
                    landmark.style.pointerEvents = 'auto';
                    landmark.classList.add('active');
                } else if (index < activeIndex) {
                    // Previous cards: off-screen left
                    landmark.style.transform = 'translateX(-100vw) translateY(-50%)';
                    landmark.style.opacity = '0';
                    landmark.style.pointerEvents = 'none';
                    landmark.classList.remove('active');
                } else {
                    // Future cards: off-screen right
                    landmark.style.transform = 'translateX(100vw) translateY(-50%)';
                    landmark.style.opacity = '0';
                    landmark.style.pointerEvents = 'none';
                    landmark.classList.remove('active');
                }
            });
        },
        onLeave: () => {
            // Hide all when leaving projects section
            landmarks.forEach(landmark => {
                landmark.style.transform = 'translateX(100vw) translateY(-50%)';
                landmark.style.opacity = '0';
                landmark.style.pointerEvents = 'none';
                landmark.classList.remove('active');
            });
        },
        onLeaveBack: () => {
            // Reset all when scrolling back above projects
            landmarks.forEach(landmark => {
                landmark.style.position = 'fixed';
                landmark.style.top = '50%';
                landmark.style.transform = 'translateX(100vw) translateY(-50%)';
                landmark.style.opacity = '0';
                landmark.style.pointerEvents = 'none';
                landmark.classList.remove('active');
            });
        },
        onEnterBack: () => {
            // Re-initialize when coming back from below
            landmarks.forEach(landmark => {
                landmark.style.position = 'fixed';
                landmark.style.top = '50%';
                landmark.style.pointerEvents = 'none';
            });
        }
    });
}

function setupScrollIndicatorHide() {
    const scrollIndicator = document.getElementById('scroll-indicator');

    if (scrollIndicator) {
        ScrollTrigger.create({
            trigger: '#projects-section',
            start: 'top 90%',
            onEnter: () => gsap.to(scrollIndicator, { opacity: 0, duration: 0.3 }),
            onLeaveBack: () => gsap.to(scrollIndicator, { opacity: 1, duration: 0.3 })
        });
    }
}

// ========================================
// JOURNEY TOUR - hands-free auto-scroll through the education section
// ========================================
let tourActive = false;
let tourRafId = null;
let tourLastTs = 0;
let railDots = [];
const TOUR_SPEED = 300;           // px/s cruise through the chapters
const TOUR_APPROACH_SPEED = 2600; // px/s glide from the gate to the section

function stopJourneyTour() {
    if (!tourActive) return;
    tourActive = false;
    document.body.classList.remove('auto-touring');
    if (tourRafId !== null) {
        cancelAnimationFrame(tourRafId);
        tourRafId = null;
    }
    removeTourInterrupts();
}

// Any manual input hands control back to the user
function tourInterrupt() {
    stopJourneyTour();
}

function addTourInterrupts() {
    window.addEventListener('wheel', tourInterrupt, { passive: true });
    window.addEventListener('touchstart', tourInterrupt, { passive: true });
    window.addEventListener('keydown', tourInterrupt);
}

function removeTourInterrupts() {
    window.removeEventListener('wheel', tourInterrupt);
    window.removeEventListener('touchstart', tourInterrupt);
    window.removeEventListener('keydown', tourInterrupt);
}

function startJourneyTour() {
    const section = document.getElementById('education-section');
    if (!section || tourActive) return;

    tourActive = true;
    document.body.classList.add('auto-touring');
    addTourInterrupts();
    tourLastTs = 0;

    function step(ts) {
        if (!tourActive) return;
        if (!tourLastTs) tourLastTs = ts;
        const dt = Math.min((ts - tourLastTs) / 1000, 0.05);
        tourLastTs = ts;

        const sectionTop = section.offsetTop;
        const target = sectionTop + section.offsetHeight - window.innerHeight;
        const current = window.scrollY;
        // Fast glide until the section starts, then a slow cinematic cruise
        const speed = current < sectionTop - 4 ? TOUR_APPROACH_SPEED : TOUR_SPEED;
        const next = Math.min(current + speed * dt, target);

        // 'instant' sidesteps the page's smooth scroll-behavior per frame
        window.scrollTo({ top: next, behavior: 'instant' });

        if (next >= target - 1) {
            stopJourneyTour();
            return;
        }
        tourRafId = requestAnimationFrame(step);
    }

    tourRafId = requestAnimationFrame(step);
}

function updateJourneyRail(progress) {
    if (!railDots.length) return;
    const idx = Math.min(railDots.length - 1, Math.floor(progress * railDots.length));
    railDots.forEach((dot, i) => dot.classList.toggle('active', i === idx));
}

function setJourneyRailVisible(visible) {
    const rail = document.getElementById('journey-rail');
    if (rail) rail.classList.toggle('visible', visible);
}

document.addEventListener('DOMContentLoaded', () => {
    railDots = Array.from(document.querySelectorAll('.journey-rail .rail-dot'));

    const autoplayBtn = document.getElementById('journey-autoplay');
    if (autoplayBtn) autoplayBtn.addEventListener('click', startJourneyTour);

    const tourPill = document.getElementById('tour-pill');
    if (tourPill) tourPill.addEventListener('click', stopJourneyTour);

    // Click a chapter dot to glide straight to that chapter
    railDots.forEach((dot) => {
        dot.addEventListener('click', () => {
            const section = document.getElementById('education-section');
            if (!section) return;
            stopJourneyTour();
            const idx = parseInt(dot.dataset.chapter, 10) || 0;
            const scrollable = section.offsetHeight - window.innerHeight;
            const top = section.offsetTop + ((idx + 0.45) / railDots.length) * scrollable;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });
});

// ========================================
// EDUCATION SECTION - SPACE SCENE
// ========================================
let spaceScene, spaceCamera, spaceRenderer;
let spaceModel;
let spaceAnimationId = null;
let educationScrollProgress = 0;

// The space render loop only runs while the education section is on screen
function startSpaceLoop() {
    if (spaceAnimationId === null && spaceRenderer) {
        spaceAnimationId = requestAnimationFrame(animateSpace);
    }
}

function stopSpaceLoop() {
    if (spaceAnimationId !== null) {
        cancelAnimationFrame(spaceAnimationId);
        spaceAnimationId = null;
    }
}

async function initSpaceScene() {
    const spaceCanvas = document.getElementById('space-canvas');
    if (!spaceCanvas) return;

    // Create separate scene for space
    spaceScene = new THREE.Scene();

    // Camera with deep perspective - start further out
    spaceCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    spaceCamera.position.set(0, 0, 100);

    // Renderer
    spaceRenderer = new THREE.WebGLRenderer({
        canvas: spaceCanvas,
        antialias: true,
        alpha: true
    });
    spaceRenderer.setSize(window.innerWidth, window.innerHeight);
    spaceRenderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.5 : 2));

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    spaceScene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 5, 5);
    spaceScene.add(directionalLight);

    // Load space model
    try {
        const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
        const loader = new GLTFLoader();

        loader.load('assets/space.glb', (gltf) => {
            spaceModel = gltf.scene;
            spaceModel.scale.set(25, 25, 25);  // Larger model
            spaceModel.position.set(0, 0, 0);   // Center it
            spaceScene.add(spaceModel);

            startSpaceLoop();
        }, undefined, () => {
            createFallbackStars();
            startSpaceLoop();
        });
    } catch (error) {
        createFallbackStars();
        startSpaceLoop();
    }

    // Handle resize
    window.addEventListener('resize', () => {
        if (spaceCamera && spaceRenderer) {
            spaceCamera.aspect = window.innerWidth / window.innerHeight;
            spaceCamera.updateProjectionMatrix();
            spaceRenderer.setSize(window.innerWidth, window.innerHeight);
        }
    });
}

function createFallbackStars() {
    // Create multiple layers of stars for depth
    for (let layer = 0; layer < 3; layer++) {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 2000;
        const positions = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 1000;
            positions[i + 1] = (Math.random() - 0.5) * 1000;
            positions[i + 2] = -50 - layer * 200 - Math.random() * 400;
        }

        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.5 + layer * 0.3,
            transparent: true,
            opacity: 1 - layer * 0.2
        });

        const stars = new THREE.Points(starGeometry, starMaterial);
        stars.userData.layer = layer;
        spaceScene.add(stars);
    }
}

function animateSpace() {
    if (spaceAnimationId === null) return;  // loop was stopped
    spaceAnimationId = requestAnimationFrame(animateSpace);

    if (spaceModel) {
        // Model stays FIXED at center - no position changes
        spaceModel.rotation.y += 0.0002;  // Gentle rotation only

        // Zoom loops match number of items (6 zoom in/out cycles for 6 items)
        const numItems = 6; // Beaconhouse, GIKI, Corbis Soft, ZYP, AWS, ChatGPT
        const fullCycle = educationScrollProgress * numItems; // One full zoom cycle per item
        const cyclePhase = fullCycle % 2; // 0-2, repeats (zoom in then out)

        let cameraZ;
        if (cyclePhase < 1) {
            // First half: ZOOM IN (far to deep)
            cameraZ = 120 - cyclePhase * 220; // 120 → -100
        } else {
            // Second half: ZOOM OUT from where zoom in ended
            cameraZ = -100 + (cyclePhase - 1) * 220; // -100 → 120
        }
        spaceCamera.position.z = cameraZ;

        // Camera positioned to zoom through center of cluster
        spaceCamera.position.x = 20;
        spaceCamera.position.y = 30;

        // Camera looks straight ahead at same X/Y
        spaceCamera.lookAt(20, 30, cameraZ - 100);
    }

    // Move star layers at different speeds for parallax
    spaceScene.children.forEach(child => {
        if (child.type === 'Points' && child.userData.layer !== undefined) {
            const speed = 1 + child.userData.layer * 0.5;
            child.position.z = (educationScrollProgress * 200 * speed) % 600 - 300;
        }
    });

    if (spaceRenderer && spaceScene && spaceCamera) {
        spaceRenderer.render(spaceScene, spaceCamera);
    }
}

function setupEducationScrollAnimations() {
    const educationSection = document.getElementById('education-section');
    const educationItems = document.querySelectorAll('.education-item');

    if (!educationSection || educationItems.length === 0) return;

    // Hide batmobile and show space when entering education section
    ScrollTrigger.create({
        trigger: educationSection,
        start: 'top 80%',
        end: 'bottom top',
        onEnter: () => {
            educationSection.classList.add('active');
            setJourneyRailVisible(true);
            // Hide batmobile
            if (batmobileModel) {
                gsap.to(batmobileModel.position, { y: -20, duration: 1, ease: 'power2.in' });
                gsap.to(batmobileModel, { visible: false, duration: 0, delay: 1 });
            }
            // Initialize space scene if not already
            if (!spaceScene) {
                initSpaceScene();
            }
            startSpaceLoop();
            // Show space canvas
            const spaceCanvas = document.getElementById('space-canvas');
            if (spaceCanvas) {
                gsap.to(spaceCanvas, { opacity: 1, duration: 0.5 });
            }
        },
        onLeave: () => {
            educationSection.classList.remove('active');
            setJourneyRailVisible(false);
            stopSpaceLoop();
        },
        onEnterBack: () => {
            educationSection.classList.add('active');
            setJourneyRailVisible(true);
            startSpaceLoop();
            // Show space canvas when coming back from about section
            const spaceCanvas = document.getElementById('space-canvas');
            if (spaceCanvas) {
                gsap.to(spaceCanvas, { opacity: 1, duration: 0.5 });
            }
        },
        onLeaveBack: () => {
            educationSection.classList.remove('active');
            setJourneyRailVisible(false);
            stopSpaceLoop();
            // Hide space canvas when scrolling up out of education section
            const spaceCanvas = document.getElementById('space-canvas');
            if (spaceCanvas) {
                gsap.to(spaceCanvas, { opacity: 0, duration: 0.5 });
            }
            // Show batmobile again
            if (batmobileModel) {
                batmobileModel.visible = true;
                gsap.to(batmobileModel.position, { y: -4.8, duration: 1, ease: 'power2.out' });
            }
        }
    });

    // Track overall scroll progress for space zoom
    ScrollTrigger.create({
        trigger: educationSection,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5,  // Smoother interpolation
        onUpdate: (self) => {
            educationScrollProgress = self.progress;
            updateJourneyRail(self.progress);
        }
    });

    // Animate each education/experience item - start VERY small, grow, then fly past
    const totalItems = educationItems.length;
    const itemScrollSpace = 1 / totalItems; // Equal space for each item (33% for 3 items)

    educationItems.forEach((item, index) => {
        const leftPanel = item.querySelector('.education-left');
        const rightPanel = item.querySelector('.education-right');

        const startProgress = index * itemScrollSpace;
        const endProgress = startProgress + itemScrollSpace;

        ScrollTrigger.create({
            trigger: educationSection,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1.5,  // Smoother interpolation
            onUpdate: (self) => {
                const globalProgress = self.progress;

                // Calculate local progress for this item
                let localProgress = 0;
                if (globalProgress >= startProgress && globalProgress <= endProgress) {
                    localProgress = (globalProgress - startProgress) / itemScrollSpace;
                } else if (globalProgress > endProgress) {
                    localProgress = 1;
                }

                // Only show during this item's time
                const isActive = globalProgress >= startProgress && globalProgress <= endProgress + 0.1;

                // Visibility - fade in fast, stay visible, fade out as it passes
                let opacity = 0;
                if (localProgress < 0.15) {
                    opacity = localProgress / 0.15;  // Fade in
                } else if (localProgress < 0.85) {
                    opacity = 1;  // Fully visible
                } else {
                    opacity = (1 - localProgress) / 0.15;  // Fade out
                }

                item.style.opacity = isActive ? opacity : 0;
                item.classList.toggle('visible', isActive && opacity > 0.1);

                // Scale: start VERY small (0.1 = far away), grow to 1, then HUGE (3+ = passing by)
                let scale;
                if (localProgress < 0.5) {
                    // Approaching: 0.1 → 1.0
                    scale = 0.1 + localProgress * 1.8;
                } else {
                    // Passing: 1.0 → 3.0+ (gets bigger as it passes you)
                    scale = 1.0 + (localProgress - 0.5) * 4;
                }

                // Split apart - gap INCREASES on desktop only
                // On mobile, no split - just scale
                const isMobile = window.innerWidth < 768;
                const splitAmount = isMobile ? 0 : localProgress * 300; // No split on mobile

                // Apply scale to the whole item (maintaining center position)
                item.style.transform = `translate(-50%, -50%) scale(${scale})`;

                // Apply split to individual panels (desktop only)
                if (leftPanel) {
                    leftPanel.style.transform = isMobile ? '' : `translateX(-${splitAmount}px)`;
                }
                if (rightPanel) {
                    rightPanel.style.transform = isMobile ? '' : `translateX(${splitAmount}px)`;
                }
            }
        });
    });
}

// Initialize education animations after main init
document.addEventListener('DOMContentLoaded', () => {
    // Wait for GSAP and ScrollTrigger to be available
    const checkGSAP = setInterval(() => {
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            clearInterval(checkGSAP);
            setTimeout(() => {
                setupEducationScrollAnimations();
                setupAboutSectionTrigger();
            }, 500);
        }
    }, 100);
});

// Hide space canvas when entering about section
function setupAboutSectionTrigger() {
    const aboutSection = document.getElementById('about-section');
    const spaceCanvas = document.getElementById('space-canvas');
    const educationSection = document.getElementById('education-section');

    if (!aboutSection) return;

    ScrollTrigger.create({
        trigger: aboutSection,
        start: 'top 90%',
        end: 'bottom top',
        onEnter: () => {
            // Hide space canvas and stop its render loop
            if (spaceCanvas) {
                gsap.to(spaceCanvas, { opacity: 0, duration: 0.5 });
            }
            stopSpaceLoop();
            // Remove active class from education section
            if (educationSection) {
                educationSection.classList.remove('active');
            }
        },
        onLeaveBack: () => {
            // Show space canvas when scrolling back
            if (spaceCanvas) {
                gsap.to(spaceCanvas, { opacity: 1, duration: 0.5 });
            }
            startSpaceLoop();
            // Re-add active class
            if (educationSection) {
                educationSection.classList.add('active');
            }
        }
    });
}

// ========================================
// START APPLICATION
// ========================================
init().catch(console.error);

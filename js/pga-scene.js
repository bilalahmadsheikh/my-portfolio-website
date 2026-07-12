/**
 * Project Golden Age — ambient 3D hero scenes
 * Two procedural scenes (zero asset downloads):
 *   data-scene="astrolabe" — nested golden rings + core (startup page)
 *   data-scene="vault"     — wireframe vault + orbiting data shards (gulaq page)
 * Theme-aware, pauses off-screen, respects prefers-reduced-motion.
 */

import * as THREE from 'three';

const canvas = document.getElementById('pga-canvas');
if (canvas) {
    initScene(canvas);
}

function palette() {
    const light = document.documentElement.getAttribute('data-theme') === 'light';
    return light
        ? {
            metal: 0x9a6f0a, emissive: 0x5e4406, glow: 0xc79510,
            particles: 0xa87b10, lineOpacity: 0.45, metalOpacity: 0.45,
            coreOpacity: 0.5, ambient: 1.1, point: 1.6
        }
        : {
            metal: 0xe8b923, emissive: 0x4a3608, glow: 0xffd166,
            particles: 0xf0c94a, lineOpacity: 0.85, metalOpacity: 0.92,
            coreOpacity: 0.85, ambient: 0.55, point: 2.2
        };
}

function initScene(canvas) {
    const kind = canvas.dataset.scene || 'astrolabe';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new THREE.WebGLRenderer({
        canvas, antialias: true, alpha: true, powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    const colors = palette();

    const ambient = new THREE.AmbientLight(0xfff4d6, colors.ambient);
    scene.add(ambient);
    const keyLight = new THREE.PointLight(0xffd166, colors.point, 40);
    keyLight.position.set(4, 3, 6);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0xff9a3c, colors.point * 0.6, 40);
    rimLight.position.set(-5, -2, 3);
    scene.add(rimLight);

    const group = new THREE.Group();
    // Sit slightly behind the focal plane so hero text keeps full contrast
    group.position.z = kind === 'vault' ? -1.8 : -1.2;
    if (kind === 'astrolabe') {
        // Compose beside the text (echoes the homepage sun/moon), not behind it
        const isMobile = window.innerWidth < 768;
        group.position.x = isMobile ? 0 : 3.2;
        group.position.y = isMobile ? 2.1 : 0.3;
        group.scale.setScalar(isMobile ? 0.55 : 0.8);
    }
    scene.add(group);

    const metalMat = new THREE.MeshStandardMaterial({
        color: colors.metal, metalness: 0.92, roughness: 0.3,
        emissive: colors.emissive, emissiveIntensity: 0.4,
        transparent: true, opacity: colors.metalOpacity
    });
    const coreMat = new THREE.MeshStandardMaterial({
        color: colors.metal, metalness: 0.85, roughness: 0.2,
        emissive: colors.glow, emissiveIntensity: 0.32, flatShading: true,
        transparent: true, opacity: colors.coreOpacity
    });
    const lineMat = new THREE.LineBasicMaterial({
        color: colors.glow, transparent: true, opacity: colors.lineOpacity
    });
    const pointsMat = new THREE.PointsMaterial({
        color: colors.particles, size: 0.035, transparent: true,
        opacity: 0.8, sizeAttenuation: true
    });

    // Ember/star field shared by both scenes
    const starCount = 380;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
        const r = 3.4 + Math.random() * 3.4;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi) - 1.5;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(starGeo, pointsMat);
    scene.add(stars);

    let rings = [];
    let core = null;
    let orbiters = [];

    if (kind === 'vault') {
        // Outer wireframe vault + tilted inner cage
        const outerBox = new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.BoxGeometry(2.7, 2.7, 2.7)), lineMat);
        const innerBox = new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.BoxGeometry(1.75, 1.75, 1.75)), lineMat);
        innerBox.rotation.set(Math.PI / 4, Math.PI / 4, 0);
        group.add(outerBox, innerBox);
        rings = [outerBox, innerBox];

        // Glowing core — the vault's heart
        core = new THREE.Mesh(new THREE.OctahedronGeometry(0.78, 0), coreMat);
        group.add(core);

        // Orbiting data shards
        const shardGeo = new THREE.BoxGeometry(1, 1, 1);
        const addOrbitRing = (count, radius, tilt, speed) => {
            for (let i = 0; i < count; i++) {
                const shard = new THREE.Mesh(shardGeo, metalMat);
                const s = 0.06 + Math.random() * 0.09;
                shard.scale.setScalar(s);
                group.add(shard);
                orbiters.push({
                    mesh: shard, radius, tilt, speed,
                    phase: (i / count) * Math.PI * 2,
                    spin: Math.random() * 0.02 + 0.005
                });
            }
        };
        addOrbitRing(14, 2.5, 0.35, 0.28);
        addOrbitRing(20, 3.3, -0.6, -0.18);
    } else {
        // Astrolabe — three nested rings on distinct axes
        const mkRing = (radius, tube, rx, rz) => {
            const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 20, 120), metalMat);
            ring.rotation.set(rx, 0, rz);
            group.add(ring);
            return ring;
        };
        rings = [
            mkRing(2.75, 0.028, Math.PI / 2.15, 0.15),
            mkRing(2.2, 0.05, Math.PI / 3, -0.5),
            mkRing(1.62, 0.024, Math.PI / 1.6, 0.9)
        ];

        core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.72, 0), coreMat);
        group.add(core);
    }

    // ── Sizing ──
    function resize() {
        const w = canvas.clientWidth || window.innerWidth;
        const h = canvas.clientHeight || window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', () => { resize(); renderOnce(); });

    // ── Mouse parallax ──
    let targetRX = 0, targetRY = 0;
    if (!reducedMotion) {
        window.addEventListener('mousemove', (e) => {
            targetRY = ((e.clientX / window.innerWidth) - 0.5) * 0.5;
            targetRX = ((e.clientY / window.innerHeight) - 0.5) * 0.35;
        }, { passive: true });
    }

    // ── Theme reactivity ──
    const themeObserver = new MutationObserver(() => {
        const c = palette();
        metalMat.color.setHex(c.metal);
        metalMat.emissive.setHex(c.emissive);
        metalMat.opacity = c.metalOpacity;
        coreMat.color.setHex(c.metal);
        coreMat.emissive.setHex(c.glow);
        coreMat.opacity = c.coreOpacity;
        lineMat.color.setHex(c.glow);
        lineMat.opacity = c.lineOpacity;
        pointsMat.color.setHex(c.particles);
        ambient.intensity = c.ambient;
        keyLight.intensity = c.point;
        rimLight.intensity = c.point * 0.6;
        renderOnce();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // ── Animation loop with off-screen pause ──
    let running = false;
    let rafId = null;
    let t = 0;

    function frame() {
        if (!running) { rafId = null; return; }
        rafId = requestAnimationFrame(frame);
        t += 0.008;

        if (kind === 'vault') {
            rings[0].rotation.y += 0.0022;
            rings[0].rotation.x += 0.0009;
            rings[1].rotation.y -= 0.0031;
            core.rotation.y += 0.008;
            const pulse = 1 + Math.sin(t * 1.8) * 0.06;
            core.scale.setScalar(pulse);
            for (const o of orbiters) {
                const a = o.phase + t * o.speed * 4;
                o.mesh.position.set(
                    Math.cos(a) * o.radius,
                    Math.sin(a) * o.radius * Math.sin(o.tilt),
                    Math.sin(a) * o.radius * Math.cos(o.tilt) * 0.55
                );
                o.mesh.rotation.x += o.spin;
                o.mesh.rotation.y += o.spin * 0.7;
            }
        } else {
            rings[0].rotation.z += 0.0016;
            rings[0].rotation.y += 0.0007;
            rings[1].rotation.z -= 0.0021;
            rings[1].rotation.x += 0.0009;
            rings[2].rotation.z += 0.0028;
            core.rotation.y -= 0.0035;
            core.rotation.x += 0.0012;
        }

        stars.rotation.y += 0.00035;
        group.rotation.x += (targetRX - group.rotation.x) * 0.045;
        group.rotation.y += (targetRY - group.rotation.y) * 0.045;

        renderer.render(scene, camera);
    }

    function renderOnce() {
        renderer.render(scene, camera);
    }

    function start() {
        if (reducedMotion) { renderOnce(); return; }
        if (!running) {
            running = true;
            if (rafId === null) rafId = requestAnimationFrame(frame);
        }
    }

    function stop() {
        running = false;
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    const visObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => entry.isIntersecting ? start() : stop());
    }, { threshold: 0.05 });
    visObserver.observe(canvas);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop();
        else if (canvas.getBoundingClientRect().bottom > 0) start();
    });

    start();
}

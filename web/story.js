'use strict';

// Scroll motion budget. The spectacular WAAPI entry in app.js owns only
// .phone-entrance; this timeline alone owns .phone-story after that handoff.
const STORY_MOTION = Object.freeze({
    reading: Object.freeze({ x: 0, scale: 1, rotationX: 0, rotationY: 0, rotation: 0 }),
    readingYOffset: -.05,
    desktopShift: Object.freeze({ viewportRatio: .095, min: 100, max: 140 }),
    // Positions relative to the desktop shift; compact screens always stay centered.
    scenes: Object.freeze([0, -1, 1, .18, 1]),
    transitionZoom: 1.06, // Space fitting can suppress this additional zoom.
    transitionTilt: 3,
    transitionLead: .22,
    zoomInDuration: .54,
    zoomOutDuration: .4,
    screenFadeDuration: .4,
    headlineTravel: 14,
    cardTravel: 28,
    cardDuration: .42
});
// Retain approved departure/arrival positions and the native pin geometry.
const FIRST_DEPARTURE = Object.freeze({ idleRatio: .7, heroFadeEnd: 1.55 });

// One GSAP timeline owns every scroll-driven transform. No parallel scroll loop.
function initStory({ onScroll = () => {} } = {}) {
    const story = document.querySelector('.story');
    const viewport = story?.querySelector('.cinema-viewport');
    const panels = [...document.querySelectorAll('.story-scene')];
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    const noop = { setPaused() {} };
    if (!story || !viewport || !panels.length || !gsap || !ScrollTrigger) return noop;

    gsap.registerPlugin(ScrollTrigger);
    const phone = story.querySelector('.phone-story');
    const screens = ['home', 'map', 'news'].map(name => story.querySelector('.screen-' + name));
    const controls = [...story.querySelectorAll('[data-scene]')];
    const caption = document.getElementById('hero-phone-caption');
    const screenRole = story.querySelector('.phone-screen');
    const ambientBlue = story.querySelector('.ambient-blue');
    const ambientTeal = story.querySelector('.ambient-teal');
    const map = story.querySelector('.closing-map');
    const media = gsap.matchMedia();
    let trigger;
    let timeline;
    let adminPaused = false;
    let active = -1;
    let entryHandedOff = false;

    function restoreDocument() {
        story.classList.remove('is-cinematic');
        story.removeAttribute('data-scene');
        caption.textContent = 'Inicio · Demostración de la app';
        screenRole.setAttribute('aria-label', 'Inicio · Demostración de la app');
        panels.forEach(panel => {
            panel.inert = false;
            panel.removeAttribute('aria-hidden');
        });
    }

    function synchronizePause() {
        if (!trigger) return;
        if (adminPaused || document.hidden) {
            // false preserves pin geometry, so opening the modal cannot shift the page.
            trigger.disable(false);
            timeline.pause();
        } else {
            trigger.enable(false, false);
            trigger.update();
        }
    }

    function navigateTo(index, behavior = 'smooth') {
        if (!trigger || index < 0 || index >= panels.length) return false;
        window.scrollTo({
            top: trigger.start + ((index * 2 + 1.4) / timeline.duration()) * (trigger.end - trigger.start),
            behavior
        });
        return true;
    }

    function handleClick(event) {
        const button = event.target.closest?.('[data-scene]');
        if (button && story.contains(button)) {
            navigateTo(Number(button.dataset.scene));
            return;
        }
        const anchor = event.target.closest?.('a[href^="#"]');
        if (!anchor || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        const index = panels.findIndex(panel => '#' + panel.id === anchor.getAttribute('href'));
        if (index < 0 || !trigger) return;
        event.preventDefault();
        navigateTo(index);
        window.history.replaceState(null, '', '#' + panels[index].id);
    }

    function handleHash() {
        const index = panels.findIndex(panel => '#' + panel.id === window.location.hash);
        if (index >= 0 && navigateTo(index, 'instant')) window.requestAnimationFrame(() => {
            trigger?.update();
            trigger?.getTween()?.progress(1);
        });
    }

    media.add({
        motion: '(prefers-reduced-motion: no-preference)',
        compact: '(max-width: 900px)',
        enoughHeight: '(min-height: 600px)'
    }, match => {
        if (!match.conditions.motion || !match.conditions.enoughHeight) return;
        const compact = match.conditions.compact;
        const width = () => window.innerWidth;
        const height = () => window.innerHeight;
        const y = amount => () => height() * amount;
        const desktopShift = () => Math.min(STORY_MOTION.desktopShift.max,
            Math.max(STORY_MOTION.desktopShift.min, width() * STORY_MOTION.desktopShift.viewportRatio));
        const poseCache = new Map();
        let layoutKey;
        const updateLayout = () => {
            poseCache.clear();
            // Reserve actual phone width in text/map columns too, especially in narrow windows.
            // These layout variables never control the phone transform.
            const half = phone.offsetWidth / 2 + 16;
            const shift = desktopShift();
            const key = half + ':' + shift;
            if (key === layoutKey) return;
            layoutKey = key;
            gsap.set(story, { '--phone-half': half + 'px',
                '--scene-shift': shift + 'px',
                '--news-shift': shift * STORY_MOTION.scenes[3] + 'px' });
        };
        // Resolve only when a tween is initialized/refreshed, never on every scroll frame.
        // A conservative projected envelope reserves navigation, controls and reading cards.
        function fitPose(values, index) {
            const result = Object.fromEntries(Object.entries(values).map(([key, value]) =>
                [key, typeof value === 'function' ? value() : value]));
            const stage = story.querySelector('.story-stage');
            const stageTop = stage.offsetTop;
            const panel = panels[index];
            const heading = panel.querySelector('h1,h2');
            const card = panel.querySelector('.story-card');
            const localTop = element => {
                let top = 0;
                for (let node = element; node && node !== panel; node = node.offsetParent) top += node.offsetTop;
                return top;
            };
            let top = stageTop + 20;
            let bottom = height() - 108;
            if (compact) top = Math.max(top,
                stageTop + localTop(heading) + heading.offsetHeight + 16);
            if (compact) {
                const below = card || panel.querySelector('.scene-lead');
                if (below) bottom = Math.min(bottom, stageTop + localTop(below) - 16);
            }
            const radians = degrees => Math.abs(degrees || 0) * Math.PI / 180;
            const roll = radians(result.rotation);
            const w = phone.offsetWidth;
            const h = phone.offsetHeight;
            const boundsW = w * Math.cos(roll) + h * Math.sin(roll);
            const boundsH = h * Math.cos(roll) + w * Math.sin(roll);
            const depth = (w * Math.sin(radians(result.rotationY)) + h * Math.sin(radians(result.rotationX))) / 2;
            const availableH = Math.max(80, bottom - top);
            const availableW = width() - 32;
            result.scale = Math.min(result.scale,
                availableH / (boundsH + availableH * depth / 1100),
                availableW / (boundsW + availableW * depth / 1100));
            const projection = result.scale / (1 - result.scale * depth / 1100);
            const halfW = boundsW * projection / 2;
            const halfH = boundsH * projection / 2;
            const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
            result.x = clamp(width() / 2 + result.x, 16 + halfW, width() - 16 - halfW) - width() / 2;
            result.y = clamp(stageTop + stage.offsetHeight / 2 + result.y,
                top + halfH, bottom - halfH) - stageTop - stage.offsetHeight / 2;
            return result;
        }
        let context;
        let previousProgress = -1;
        active = -1;
        story.classList.add('is-cinematic');
        try {
            context = gsap.context(self => {
                context = self;
                updateLayout();
                gsap.set(panels, { autoAlpha: 0, y: 0 });
                gsap.set(panels[0], { autoAlpha: 1 });
                gsap.set(screens, { autoAlpha: 0 });
                gsap.set(screens[0], { autoAlpha: 1 });
                const readingPose = { ...STORY_MOTION.reading, y: y(STORY_MOTION.readingYOffset) };
                const sceneX = index => () => compact ? 0 : STORY_MOTION.scenes[index] * desktopShift();
                // The entry ends at identity on its own layer, revealing this exact pose.
                // Keep it refreshable: a resized viewport must not restore stale geometry.
                gsap.set(map, { autoAlpha: 0 });
                timeline = gsap.timeline({
                    defaults: { ease: 'none' },
                    scrollTrigger: {
                        id: 'liceomap-cinema', trigger: story, pin: viewport,
                        start: 'top top', end: () => '+=' + Math.round(height() * (compact ? 3.8 : 4.5)),
                        scrub: compact ? .25 : .35, anticipatePin: 1, invalidateOnRefresh: true,
                        // Native unpinning must not leave the composition catching up offscreen.
                        onLeave: self => self.getTween()?.progress(1),
                        onLeaveBack: self => self.getTween()?.progress(1),
                        // ScrollTrigger offsets a pin at page start to -0.001px;
                        // native scroll cannot cross it, so onLeaveBack alone is insufficient.
                        onUpdate: self => { if (self.scroll() === 0) self.getTween()?.progress(1); },
                        onRefreshInit: updateLayout
                    }
                });
                trigger = timeline.scrollTrigger;
                const pose = (values, index, at, duration) => {
                    const target = { ...readingPose, ...values };
                    const fitted = () => {
                        if (!poseCache.has(target)) poseCache.set(target, fitPose(target, index));
                        return poseCache.get(target);
                    };
                    const properties = Object.fromEntries(Object.keys(target).map(key => [key, () => fitted()[key]]));
                    return timeline.to(phone, { ...properties, duration, ease: 'sine.inOut' }, at);
                };
                const initialPose = () => {
                    if (!poseCache.has(readingPose)) poseCache.set(readingPose, fitPose(readingPose, 0));
                    return poseCache.get(readingPose);
                };
                const initialProperties = Object.fromEntries(Object.keys(readingPose).map(key =>
                    [key, () => initialPose()[key]]));
                // Equal endpoints form a still beat; invalidateOnRefresh reevaluates both.
                timeline.fromTo(phone, initialProperties,
                    { ...initialProperties, force3D: 'auto', duration: 1 }, 0);

                // Content exits before the crossing; the next headline follows arrival.
                // Each reading beat is frontal and still. Only this timeline owns the phone.
                [2, 4, 6, 8].forEach((at, step) => {
                    const index = step + 1;
                    const departure = at - STORY_MOTION.transitionLead;
                    const start = index === 1 ? departure * FIRST_DEPARTURE.idleRatio : departure;
                    pose({ x: sceneX(index), scale: STORY_MOTION.transitionZoom,
                        rotationY: compact ? 0 : (index % 2 ? -1 : 1) * STORY_MOTION.transitionTilt }, index,
                        start, departure + STORY_MOTION.zoomInDuration - start);
                    pose({ x: sceneX(index) }, index, at + .32, STORY_MOTION.zoomOutDuration);
                });
                // Keep five equal scene intervals, including a still closing reading beat.
                timeline.to({}, { duration: panels.length * 2 }, 0);

                panels.forEach((panel, index) => {
                    const at = index * 2;
                    if (index) {
                        timeline.fromTo(panel, { autoAlpha: 0 },
                            { autoAlpha: 1, duration: .2 }, at + .24);
                        timeline.fromTo(panel.querySelectorAll('.headline-line'),
                            { autoAlpha: 0, y: STORY_MOTION.headlineTravel },
                            { autoAlpha: 1, y: 0, duration: .4, stagger: .07, ease: 'power3.out' }, at + .34);
                        timeline.fromTo(panel.querySelector('.scene-lead'), { autoAlpha: 0, y: 12 },
                            { autoAlpha: 1, y: 0, duration: .3, ease: 'power2.out' }, at + .48);
                    }
                    if (index < panels.length - 1) timeline.to(panel,
                        { autoAlpha: 0, ease: 'sine.inOut', duration: index === 0 ? FIRST_DEPARTURE.heroFadeEnd - 1.55 * FIRST_DEPARTURE.idleRatio : .28 },
                        index === 0 ? 1.55 * FIRST_DEPARTURE.idleRatio : at + 1.55);
                    const card = panel.querySelector('.story-card');
                    if (card) {
                        const cardX = compact ? 0 : (index === 2 || index === 4 ? -1 : 1) * STORY_MOTION.cardTravel;
                        timeline.fromTo(card, { autoAlpha: 0, x: cardX, y: 8 },
                            { autoAlpha: 1, x: 0, y: 0, duration: STORY_MOTION.cardDuration, ease: 'power3.out' }, at + .58);
                        if (index < 4) timeline.to(card,
                            { autoAlpha: 0, x: cardX * .4, y: 0, duration: .3, ease: 'sine.inOut' }, at + 1.45);
                    }
                });

                // True crossfades: both images coexist during the transition; no src swapping.
                // On compact screens the final plan lives inside the phone, leaving
                // the lower area to the complete closing card and its keyboard links.
                [[0, 1, 1.95], [1, 0, 3.95], [0, 2, 5.95], [2, compact ? 1 : 0, 7.95]].forEach(([from, to, at]) => {
                    timeline.to(screens[from], { autoAlpha: 0, duration: STORY_MOTION.screenFadeDuration }, at);
                    timeline.to(screens[to], { autoAlpha: 1, duration: STORY_MOTION.screenFadeDuration }, at);
                });
                // Only gradient opacity changes: no filtered layers or ambient animation loop.
                [[1.8, .65, .3], [3.8, .8, .2], [5.8, .5, .6], [7.8, .55, .4]].forEach(([at, blue, teal]) => {
                    timeline.to(ambientBlue, { opacity: blue, duration: .7, ease: 'sine.inOut' }, at);
                    timeline.to(ambientTeal, { opacity: teal, duration: .7, ease: 'sine.inOut' }, at);
                });
                timeline.fromTo(story.querySelector('.notification-chip'), { autoAlpha: 0, y: 18 },
                    { autoAlpha: 1, y: 0, duration: .4, ease: 'power2.out' }, 6.85);
                timeline.to(story.querySelector('.notification-chip'), { autoAlpha: 0, y: -12, duration: .25, ease: 'sine.inOut' }, 7.45);
                timeline.fromTo(map, { autoAlpha: 0, y: STORY_MOTION.cardTravel },
                    { autoAlpha: 1, y: 0, duration: .6, ease: 'power2.out' }, 8.38);

                function describeScene() {
                    const progress = timeline.progress();
                    if (!entryHandedOff && !ScrollTrigger.isRefreshing && previousProgress >= 0 &&
                        Math.abs(progress - previousProgress) > .00001) {
                        entryHandedOff = true;
                        onScroll();
                    }
                    previousProgress = progress;
                    const index = timeline.time() >= 10.5 ? -1 : Math.min(4, Math.floor((timeline.time() + .08) / 2));
                    if (index === active) return;
                    active = index;
                    story.dataset.scene = index < 0 ? 'proyecto' : panels[index].id;
                    panels.forEach((panel, number) => {
                        panel.inert = number !== index;
                        panel.setAttribute('aria-hidden', String(number !== index));
                    });
                    controls.forEach((control, number) => {
                        if (number === index) control.setAttribute('aria-current', 'step');
                        else control.removeAttribute('aria-current');
                    });
                    if (index < 0) return;
                    const label = (compact && index === 4 ? panels[1] : panels[index]).dataset.label + ' · Demostración de la app';
                    caption.textContent = label;
                    screenRole.setAttribute('aria-label', label);
                }
                timeline.eventCallback('onUpdate', describeScene);
                describeScene();
                synchronizePause();
            }, story);
            // Prepare the two secondary captures while the intro runs. This promise
            // never gates navigation, the loader or scroll, and reserves no new layer.
            screens.slice(1).forEach(image => {
                image.loading = 'eager';
                image.decode?.().catch(() => {});
            });
            window.requestAnimationFrame(handleHash);
        } catch (error) {
            context?.revert();
            trigger = null;
            timeline = null;
            restoreDocument();
            console.warn('El recorrido se muestra sin animación.', error);
        }
        return () => {
            context?.revert();
            trigger = null;
            timeline = null;
            restoreDocument();
        };
    });
    document.addEventListener('click', handleClick);
    window.addEventListener('hashchange', handleHash);
    document.addEventListener('visibilitychange', synchronizePause);
    if (document.fonts?.status === 'loading') document.fonts.ready.then(() => trigger?.refresh());
    return { setPaused(value) { adminPaused = value; synchronizePause(); } };
}

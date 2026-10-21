'use strict';

function initCourseDemo() {
    const root = document.getElementById('course-demo');
    if (!root) return;
    const stage = root.querySelector('.course-stage');
    const views = [...root.querySelectorAll('[data-demo-view]')];
    const steps = [...root.querySelectorAll('.demo-process li')];
    const start = root.querySelector('#course-demo-start');
    const skip = root.querySelector('#course-demo-skip');
    const repeat = root.querySelector('#course-demo-repeat');
    const live = root.querySelector('#course-demo-live');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animation;
    let running = false;
    const clearAnimation = () => { animation?.kill(); animation = null; };
    function show(name) {
        views.forEach(view => { view.hidden = view.dataset.demoView !== name; view.inert = view.hidden; });
        root.dataset.state = name;
    }
    function finish() {
        if (!running) return;
        const returnFocus = stage.contains(document.activeElement);
        clearAnimation();
        running = false;
        stage.setAttribute('aria-busy', 'false');
        show('result');
        live.textContent = 'Curso de ejemplo: 3° Medio A. Resultado ficticio. No se consultaron matrículas ni se asignó un curso real.';
        if (returnFocus) root.querySelector('#course-result-title').focus({ preventScroll: true });
        if (window.gsap && !motion.matches) {
            animation = window.gsap.fromTo(root.querySelector('.demo-result-card'),
                { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: .36, clearProps: 'transform,opacity', ease: 'power3.out' });
        }
    }
    function run() {
        if (running) return;
        clearAnimation();
        running = true;
        steps.forEach(step => step.removeAttribute('data-complete'));
        stage.setAttribute('aria-busy', 'true');
        show('process');
        skip.focus({ preventScroll: true });
        live.textContent = 'Simulación iniciada con el perfil ficticio. Puedes omitir la animación.';
        if (!window.gsap || motion.matches) { finish(); return; }
        try {
            animation = window.gsap.timeline({ onComplete: finish });
            steps.forEach((step, i) => {
                animation.call(() => {
                    step.setAttribute('data-complete', 'true');
                }, [], i * .34);
                animation.fromTo(step, { y: 8, opacity: 0 },
                    { y: 0, opacity: 1, duration: .32, clearProps: 'transform,opacity', ease: 'power2.out' }, i * .34);
            });
            animation.to({}, { duration: 1.22 }, 0);
        } catch { finish(); }
    }
    start.addEventListener('click', run);
    repeat.addEventListener('click', run);
    skip.addEventListener('click', finish);
    motion.addEventListener('change', () => {
        if (motion.matches) {
            if (running) finish();
            clearAnimation();
            root.querySelector('.demo-result-card').removeAttribute('style');
            steps.forEach(step => step.removeAttribute('style'));
        }
    });
    // Pause the finite interaction during the existing administrative overlay.
    // This observes class changes, not frames, and never reads the RUT field.
    const observer = new MutationObserver(() => animation?.paused(document.body.classList.contains('cinema-paused')));
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    start.hidden = false;
    root.dataset.state = 'identity';
}

function initFinaleTransition() {
    const section = document.getElementById('app-preview');
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    if (!section || !gsap || !ScrollTrigger) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
        const dusk = document.createElement('div');
        dusk.className = 'purpose-dusk';
        dusk.setAttribute('aria-hidden', 'true');
        const purpose = document.getElementById('proyecto');
        purpose.append(dusk);
        const edge = document.createElement('div');
        edge.className = 'purpose-outro-edge';
        edge.setAttribute('aria-hidden', 'true');
        const edgeNight = document.createElement('div');
        edgeNight.className = 'purpose-outro-edge-night';
        edge.append(edgeNight);
        purpose.append(edge);
        const originalStyles = new Map([purpose.querySelector('.purpose-origin-outro'), ...section.querySelectorAll('.demo-title-line,.demo-interface-reveal,.demo-night,.demo-coordinate,.demo-edge-night')]
            .map(element => [element, element.getAttribute('style')]));
        const restoreStyles = () => originalStyles.forEach((style, element) => {
            if (style === null) element.removeAttribute('style');
            else element.setAttribute('style', style);
        });
        let context, trigger;
        function synchronizePause() {
            if (!trigger) return;
            if (document.hidden || document.body.classList.contains('cinema-paused')) {
                trigger.disable(false);
                trigger.animation.pause();
            } else {
                trigger.enable(false, false);
                trigger.update();
            }
        }
        const pauseObserver = new MutationObserver(synchronizePause);
        try {
            context = gsap.context(() => {
                gsap.set(section.querySelectorAll('.demo-title-line'), { y: 24, opacity: .2 });
                const timeline = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: {
                    id: 'liceomap-finale', trigger: section, start: 'top bottom', end: 'top 80px', scrub: .25, invalidateOnRefresh: true,
                    onLeave: self => self.getTween()?.progress(1),
                    onLeaveBack: self => self.getTween()?.progress(1)
                } });
                trigger = timeline.scrollTrigger;
                // Separate parent layer: the approved art's scale is still owned
                // exclusively by the existing narrative's master timeline.
                timeline.fromTo(purpose.querySelector('.purpose-origin-outro'), { scale: 1, x: 0, y: 0 },
                    { scale: .55, x: 45, y: 20, duration: .8, ease: 'sine.inOut' }, 0);
                // Matching background/edge curves keep the seam continuous at every progress.
                timeline.fromTo(dusk, { opacity: 0 }, { opacity: 1, duration: 1, ease: 'sine.inOut' }, 0);
                timeline.fromTo(edge, { opacity: 0 }, { opacity: 1, duration: .2, ease: 'sine.inOut' }, 0);
                timeline.fromTo([edgeNight, section.querySelector('.demo-edge-night')], { opacity: 0 }, { opacity: 1, duration: 1, ease: 'sine.inOut' }, 0);
                timeline.fromTo(section.querySelector('.demo-night'), { opacity: 0 }, { opacity: 1, duration: 1, ease: 'sine.inOut' }, 0);
                timeline.to(section.querySelectorAll('.demo-title-line'),
                    { y: 0, opacity: 1, duration: .5, stagger: .095, ease: 'power3.out' }, .08);
                timeline.fromTo(section.querySelector('.demo-interface-reveal'), { y: 58, scale: .96, opacity: .15 },
                    { y: 0, scale: 1, opacity: 1, duration: .56, ease: 'power3.out' }, .32);
                timeline.fromTo(section.querySelector('.demo-coordinate'), { y: -65, scale: 1.4, opacity: .6 },
                    { y: 0, scale: 1, opacity: .22, duration: 1, ease: 'sine.inOut' }, 0);
            });
            pauseObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
            document.addEventListener('visibilitychange', synchronizePause);
            synchronizePause();
        } catch (error) {
            context?.revert();
            restoreStyles();
            dusk.remove(); edge.remove();
            console.warn('El desenlace se muestra sin animación.', error);
            return;
        }
        return () => {
            pauseObserver.disconnect();
            document.removeEventListener('visibilitychange', synchronizePause);
            context?.revert(); restoreStyles(); dusk.remove(); edge.remove();
        };
    });
}

try { initCourseDemo(); } catch (error) { console.warn('La demostración se muestra en su versión estática.', error); }
try { initFinaleTransition(); } catch (error) { console.warn('El desenlace se muestra sin animación.', error); }

'use strict';

// One pin, one scroll clock. The first ten beats of story.js are preserved.
// This reversible sequence is appended only after the approved closing beat.
function initPurpose() {
    const root = document.querySelector('.purpose-section');
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    if (!root || !gsap || !ScrollTrigger) return;
    const home = root.parentNode;
    const next = root.nextSibling;
    const media = gsap.matchMedia();
    media.add({ motion: '(prefers-reduced-motion: no-preference)',
        compact: '(max-width: 900px)', enoughHeight: '(min-height: 720px)',
        readable: '(min-width: 901px), (min-width: 361px) and (min-height: 820px), (min-height: 960px)' }, ({ conditions }) => {
        const trigger = ScrollTrigger.getById('liceomap-cinema');
        if (!conditions.motion || !conditions.enoughHeight || !conditions.readable || !trigger) return;
        const master = trigger.animation;
        const originalEnd = trigger.vars.end;
        const compact = conditions.compact;
        const cardStep = () => compact ? parseFloat(getComputedStyle(root).getPropertyValue('--purpose-card-step')) || 139 : 0;
        const viewport = document.querySelector('.cinema-viewport');
        const phone = viewport.querySelector('.phone-story');
        const screen = phone.querySelector('.phone-screen');
        const chapters = [...root.querySelectorAll('.purpose-chapter')];
        const links = [...root.querySelectorAll('.purpose-nav a[href]')];
        const cards = [...root.querySelectorAll('.purpose-friction')];
        const pillars = [...root.querySelectorAll('.purpose-pillar')];
        const frictions = root.querySelector('.purpose-frictions');
        const pillarHome = root.querySelector('.purpose-pillars');
        const documentStyles = new Map([root, ...root.querySelectorAll('*')].map(element => [element, element.getAttribute('style')]));
        const deck = document.createElement('div');
        deck.className = 'purpose-deck';
        deck.setAttribute('role', 'list');
        deck.setAttribute('aria-label', 'De las necesidades a los pilares de LiceoMap');
        const surface = document.createElement('div');
        surface.className = 'purpose-screen-surface';
        surface.setAttribute('aria-hidden', 'true');
        const horizon = document.createElement('div');
        horizon.className = 'purpose-horizon';
        horizon.setAttribute('aria-hidden', 'true');
        let sequence, context, active = -2;
        const beats = [12.45, 15.65, 18.65, 22.65];
        const duration = 25.2;
        const previousUpdate = master.eventCallback('onUpdate');
        const pose = index => compact
            ? { x: 0, y: index * cardStep(), rotation: 0, scale: 1 }
            : { x: (index - 1) * Math.min(innerWidth * .265, 390), y: 0, rotation: 0, scale: 1 };
        const scattered = index => compact
            ? { x: [-12, 9, -5][index], y: index * cardStep(), rotation: [-1.2, 1.2, -.8][index], scale: 1 }
            : { x: (index - 1) * Math.min(innerWidth * .28, 420), y: [25, -20, 40][index], rotation: [-7, 4, -3][index], scale: [.94, 1, .91][index] };
        function syncAccess() {
            previousUpdate?.();
            const time = master.time();
            const index = time < 11.65 ? -1 : time < 14.25 ? 0 : time < 17.55 ? 1 : time < 20.9 ? 2 : 3;
            if (index === active) return;
            active = index;
            root.inert = index < 0;
            if (index < 0) root.setAttribute('aria-hidden', 'true');
            else root.removeAttribute('aria-hidden');
            chapters.forEach((chapter, i) => {
                chapter.inert = index !== i;
                chapter.setAttribute('aria-hidden', String(index !== i));
            });
            deck.inert = index !== 1 && index !== 2;
            deck.setAttribute('aria-hidden', String(deck.inert));
            cards.forEach(card => [...card.children].forEach(child => {
                const solution = child.classList.contains('purpose-pillar');
                child.setAttribute('aria-hidden', String(solution ? index !== 2 : index !== 1));
            }));
            links.forEach((link, i) => {
                if (i === index) link.setAttribute('aria-current', 'location');
                else link.removeAttribute('aria-current');
            });
        }
        function jump(event) {
            if (event.type === 'click' && (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button)) return;
            const anchor = event.type === 'click' ? event.target.closest?.('a[href^="#"]') : null;
            const hash = anchor?.getAttribute('href') || location.hash;
            const index = chapters.findIndex(chapter => '#' + chapter.id === hash);
            if (index < 0 && hash !== '#proyecto') return;
            if (event.type === 'click') {
                event.preventDefault();
                history.replaceState(null, '', hash);
            }
            const at = beats[Math.max(0, index)];
            window.scrollTo({ top: trigger.start + at / master.duration() * (trigger.end - trigger.start), behavior: 'instant' });
            window.requestAnimationFrame(() => {
                // Commit native scroll first, then finish only this direct jump's scrub.
                // Focus must land on the rendered chapter, including on reverse jumps.
                trigger.update();
                trigger.getTween()?.progress(1);
                syncAccess();
                if (event.type === 'click' && active === Math.max(0, index)) chapters[Math.max(0, index)].focus({ preventScroll: true });
            });
        }
        function restore() {
            document.removeEventListener('click', jump);
            window.removeEventListener('hashchange', jump);
            if (master.eventCallback('onUpdate') === syncAccess) master.eventCallback('onUpdate', previousUpdate);
            if (sequence) master.remove(sequence);
            context?.revert();
            // Reparented nested timelines can otherwise restore their enhancement
            // starting values after the outer matchMedia context has reverted.
            documentStyles.forEach((style, element) => {
                if (style === null) element.removeAttribute('style');
                else element.setAttribute('style', style);
            });
            if (!viewport.closest('.story').classList.contains('is-cinematic')) {
                viewport.querySelectorAll('.phone-story,.story-stage,.story-scenes,.closing-map,.cinema-controls,.cinema-exit,#hero-phone-caption')
                    .forEach(element => element.removeAttribute('style'));
            }
            cards.forEach(card => {
                [...card.children].forEach(child => child.removeAttribute('aria-hidden'));
                frictions.append(card);
            });
            pillars.forEach(pillar => { pillar.removeAttribute('role'); pillarHome.append(pillar); });
            deck.remove(); surface.remove(); horizon.remove();
            home.insertBefore(root, next);
            root.classList.remove('is-immersive');
            root.inert = false;
            root.removeAttribute('aria-hidden');
            chapters.forEach(chapter => { chapter.inert = false; chapter.removeAttribute('aria-hidden'); chapter.removeAttribute('tabindex'); });
            links.forEach(link => link.removeAttribute('aria-current'));
            trigger.vars.end = originalEnd;
        }
        try {
            viewport.append(root);
            root.classList.add('is-immersive');
            root.prepend(horizon);
            root.append(deck);
            screen.append(surface);
            cards.forEach((card, i) => { deck.append(card); card.append(pillars[i]); pillars[i].setAttribute('role', 'group'); });
            chapters.forEach(chapter => chapter.setAttribute('tabindex', '-1'));
            context = gsap.context(() => {
                const intro = chapters[0];
                const challenge = chapters[1];
                const solution = chapters[2];
                const vision = chapters[3];
                gsap.set(root, { autoAlpha: 0 });
                gsap.set([challenge, solution, vision, deck, root.querySelector('.purpose-nav'), root.querySelector('.purpose-masthead')], { autoAlpha: 0 });
                gsap.set(cards, { autoAlpha: 0 });
                gsap.set(pillars, { autoAlpha: 0 });
                gsap.set(intro.querySelectorAll('.purpose-line'), { y: 18, autoAlpha: 0 });
                gsap.set(intro.querySelector('.purpose-intro-bottom'), { y: 35, autoAlpha: 0 });
                gsap.set(root.querySelector('.purpose-connection-light'), { strokeDashoffset: 1 });
                sequence = gsap.timeline({ defaults: { ease: 'none' } });
                // Local time 0 = original time 10. No other controller writes phone transforms.
                sequence.to(viewport.querySelectorAll('.story-scenes,.closing-map,.cinema-controls,.cinema-exit,#hero-phone-caption'), { autoAlpha: 0, duration: .4 }, 0);
                sequence.to(phone, { x: 0, y: () => -38 + (compact ? 6 : 0), rotationX: 0, rotationY: 0, rotation: 0, scale: 1, duration: .45, ease: 'sine.inOut' }, .1);
                // The vector surface replaces the capture before extreme magnification.
                sequence.to(surface, { opacity: 1, duration: .5, ease: 'sine.inOut' }, .55);
                sequence.to(phone, { z: 240, scale: () => Math.max(innerWidth / screen.offsetWidth, innerHeight / screen.offsetHeight) * 1.18,
                    y: () => -38 + (compact ? 6 : 0), duration: 1.4, ease: 'power1.in' }, .55);
                // Identical solid color, opaque screen already covering every corner.
                sequence.to(root, { autoAlpha: 1, duration: .3, ease: 'sine.inOut' }, 1.8);
                sequence.to(intro.querySelectorAll('.purpose-line'), { y: 0, autoAlpha: 1, stagger: .12, duration: .62, ease: 'power3.out' }, 1.95);
                // The flight continues under the matching opaque surface; no visible freeze/cut.
                sequence.to(viewport.querySelector('.story-stage'), { autoAlpha: 0, duration: .18, ease: 'sine.inOut' }, 2.1);
                sequence.to(root.querySelectorAll('.purpose-nav,.purpose-masthead'), { autoAlpha: 1, duration: .3 }, 2.2);
                sequence.to(intro.querySelector('.purpose-intro-bottom'), { autoAlpha: 1, y: 0, duration: .55, ease: 'power2.out' }, 2.65);
                sequence.to(intro.querySelector('.purpose-wordmark'), { x: compact ? 0 : 24, duration: .8 }, 3);
                sequence.to(intro, { autoAlpha: 0, scale: .98, y: -24, duration: .55, ease: 'sine.inOut' }, 4.05);
                sequence.fromTo(challenge, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: .55, ease: 'power3.out' }, 4.3);
                sequence.set(deck, { autoAlpha: 1 }, 4.35);
                cards.forEach((card, i) => {
                    const target = Object.fromEntries(Object.keys(scattered(i)).map(key => [key, () => scattered(i)[key]]));
                    const origin = compact ? { x: () => (i % 2 ? 1 : -1) * innerWidth * .9, y: () => i * cardStep() + 45, rotation: (i - 1) * 8, scale: .8 }
                        : { x: () => (i - 1) * innerWidth * .65, y: i === 1 ? 190 : -80, rotation: (i - 1) * 18, scale: .6 };
                    sequence.fromTo(card, { ...origin, autoAlpha: 0 }, { ...target, autoAlpha: 1, duration: .85, ease: 'power3.out', immediateRender: false }, 4.4 + i * .19);
                    const connected = Object.fromEntries(Object.keys(pose(i)).map(key => [key, () => pose(i)[key]]));
                    sequence.to(card, { ...connected, duration: .94, ease: 'sine.inOut' }, 6.65 + i * .04);
                    sequence.to([...card.children].filter(child => child !== pillars[i]), { autoAlpha: 0, y: -14, duration: .42, ease: 'sine.inOut' }, 7.1 + i * .06);
                    sequence.fromTo(pillars[i], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .52, ease: 'power2.out', immediateRender: false }, 7.5 + i * .08);
                });
                sequence.to(challenge, { autoAlpha: 0, y: -24, duration: .45, ease: 'sine.inOut' }, 6.95);
                sequence.fromTo(solution, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: .6, ease: 'power3.out' }, 7.45);
                sequence.to(root.querySelector('.purpose-connection-light'), { strokeDashoffset: 0, duration: .8 }, 7.85);
                sequence.to(horizon, { opacity: 1, duration: 1.1, ease: 'sine.inOut' }, 10.85);
                sequence.to(deck, { scale: .56, y: compact ? 20 : 55, autoAlpha: 0, duration: 1, ease: 'sine.inOut' }, 10.15);
                sequence.to(solution, { autoAlpha: 0, y: -25, duration: .5, ease: 'sine.inOut' }, 10.55);
                sequence.fromTo(vision, { autoAlpha: 0, y: 24, scale: 1.02 }, { autoAlpha: 1, y: 0, scale: 1, duration: .8, ease: 'power2.out' }, 10.95);
                sequence.fromTo(vision.querySelector('.purpose-origin-art'), { scale: .58 }, { scale: 1, duration: 1.35, ease: 'sine.inOut' }, 11);
                sequence.fromTo(vision.querySelectorAll('.purpose-community'), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: .65, stagger: .14, ease: 'power2.out' }, 11.55);
                sequence.fromTo(vision.querySelector('.purpose-future'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: .5, ease: 'power2.out' }, 12.1);
                sequence.fromTo(vision.querySelector('.purpose-handoff'), { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: .5, ease: 'power2.out' }, 13.15);
                sequence.to({}, { duration: duration - 10 }, 0);
            }, root);
            master.add(sequence, 10);
            // Keep precisely the original pixels per approved timeline unit.
            trigger.vars.end = () => '+=' + Math.round(innerHeight * (compact ? 3.8 : 4.5)) / 10 * master.duration();
            master.eventCallback('onUpdate', syncAccess);
            document.addEventListener('click', jump);
            window.addEventListener('hashchange', jump);
            ScrollTrigger.refresh();
            syncAccess();
            if (location.hash) jump({ type: 'hashchange' });
        } catch (error) {
            restore();
            ScrollTrigger.refresh();
            console.warn('El proyecto se muestra sin animación.', error);
            return;
        }
        return restore;
    });
}

try { initPurpose(); } catch (error) { console.warn('El proyecto se muestra sin animación.', error); }

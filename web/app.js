'use strict';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const navMenuBreakpoint = 1250;

if (window.feather) {
    window.feather.replace();
}

// The default phone is static. Entry and scroll transforms use separate layers.
function initHeroPhone() {
    const scene = document.querySelector('.hero-phone');
    const entrance = scene?.querySelector('.phone-entrance');
    let started = false;
    let animation;
    let observer;
    let paused = false;
    let heroAnimations = [];
    let prepared = false;
    let listeningForMotion = false;
    const isPreparing = () => document.documentElement.classList.contains('intro-preparing');
    const releasePreparation = () => {
        window.clearTimeout(window.liceomapIntroFallback);
        document.documentElement.classList.remove('intro-preparing');
    };
    const settle = () => {
        releasePreparation();
        if (!observer && !animation && !heroAnimations.length && !listeningForMotion) return;
        observer?.disconnect();
        observer = null;
        animation?.cancel();
        animation = null;
        heroAnimations.forEach(item => item.cancel());
        heroAnimations = [];
        if (listeningForMotion) prefersReducedMotion.removeEventListener?.('change', onMotionChange);
        listeningForMotion = false;
    };
    const onMotionChange = () => { if (prefersReducedMotion.matches) settle(); };
    const prepare = () => {
        if (prepared || started || !isPreparing() || prefersReducedMotion.matches ||
            typeof entrance?.animate !== 'function' || !('IntersectionObserver' in window)) return;
        prepared = true;
        try {
            // Prepare behind the opaque loader; play alongside the existing phone
            // entry. These children are not targets of the hero's scroll tween.
            ['.eyebrow', 'h1', '.scene-lead', '.scene-actions', '.scene-note'].forEach((selector, index) => {
                const element = document.querySelector('.hero ' + selector);
                if (!element) return;
                const item = element.animate([
                    { opacity: 0, transform: 'translateY(8px)' },
                    { opacity: 1, transform: 'translateY(0)' }
                ], { duration: 480, delay: index * 75, fill: 'both', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
                heroAnimations.push(item);
                item.pause();
            });
        } catch (error) { settle(); }
    };
    const start = (shouldAnimate = false) => {
        if (started) return;
        started = true;
        if (!entrance || !shouldAnimate || !isPreparing() || prefersReducedMotion.matches ||
            typeof entrance.animate !== 'function' || !('IntersectionObserver' in window)) { settle(); return; }
        try {
            observer = new IntersectionObserver((entries) => {
                if (!entries[0].isIntersecting || paused) return;
                if (!isPreparing()) { settle(); return; }
                observer.disconnect();
                observer = null;
                try {
                    animation = entrance.animate([
                        { opacity: 0, transform: 'translate3d(0, 100vh, -180px) rotateX(25deg) rotateY(-35deg) rotateZ(-18deg) scale(0.72)' },
                        { opacity: 1, transform: 'translateY(0) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1)' }
                    ], { duration: 1350, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
                    // Its opacity-0 first frame now exists before visibility is released.
                    releasePreparation();
                    heroAnimations.forEach(item => item.play());
                    animation.onfinish = settle;
                } catch (error) { settle(); }
            }, { threshold: .15 });
            prefersReducedMotion.addEventListener?.('change', onMotionChange);
            listeningForMotion = true;
            observer.observe(scene);
        } catch (error) { settle(); }
    };
    start.prepare = prepare;
    start.settle = settle;
    start.setPaused = (value) => {
        paused = value;
        if (paused) { settle(); return; }
        if (!animation) return;
        [animation, ...heroAnimations].filter(Boolean).forEach(item => {
            if (document.hidden) item.pause(); else item.play();
        });
    };
    document.addEventListener('visibilitychange', () => start.setPaused(paused));
    return start;
}
const revealHeroPhone = initHeroPhone();
// A missing decorative script must not prevent navigation or administration.
const narrative = (() => {
    try {
        return typeof initStory === 'function'
            ? initStory({ onScroll: () => revealHeroPhone.settle() })
            : { setPaused() {} };
    } catch (error) {
        console.warn('El recorrido se mostrará sin animación.', error);
        return { setPaused() {} };
    }
})();
let dismissCinematicIntro = () => {};

// No espera al evento load ni a recursos externos.
function initCinematicIntro() {
    const intro = document.getElementById('app-preloader');
    if (!intro || prefersReducedMotion.matches || window.location.hash || window.scrollY > 0 ||
        typeof intro.animate !== 'function') {
        revealHeroPhone();
        return;
    }
    const animations = [];
    const skip = intro.querySelector('.intro-skip');
    let finished = false;
    let safetyTimer;
    const finish = (animatePhone = false) => {
        if (finished) return;
        finished = true;
        intro.hidden = true;
        dismissCinematicIntro = () => {};
        revealHeroPhone(animatePhone === true);
        animations.forEach((animation) => animation.cancel());
        window.clearTimeout(safetyTimer);
        window.removeEventListener('scroll', finish);
        window.removeEventListener('pagehide', finish);
        document.removeEventListener('keydown', onKeydown);
        document.removeEventListener('focusin', onFocus);
        prefersReducedMotion.removeEventListener?.('change', onMotionChange);
        skip?.removeEventListener('click', finish);
        if (document.activeElement === skip) {
            const title = document.getElementById('hero-title');
            title?.setAttribute('tabindex', '-1');
            title?.focus({ preventScroll: true });
        }
    };
    const onKeydown = (event) => { if (event.key === 'Escape') finish(); };
    const onFocus = (event) => { if (!intro.contains(event.target)) finish(); };
    const onMotionChange = () => { if (prefersReducedMotion.matches) finish(); };
    safetyTimer = window.setTimeout(finish, 4500);
    skip?.addEventListener('click', finish);
    window.addEventListener('scroll', finish, { passive: true });
    window.addEventListener('pagehide', finish);
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('focusin', onFocus);
    prefersReducedMotion.addEventListener?.('change', onMotionChange);
    dismissCinematicIntro = () => finish();
    intro.hidden = false;
    try {
        revealHeroPhone.prepare();
        animations.push(intro.querySelector('.intro-brand').animate([
            { opacity: 0, transform: 'translateY(14px) scale(0.96)' },
            { opacity: 1, transform: 'translateY(0) scale(1)' }
        ], { duration: 550, fill: 'both', easing: 'ease-out' }));
        intro.querySelectorAll('.intro-words span').forEach((word, index) => {
            animations.push(word.animate([
                { opacity: 0, transform: 'translateY(18px)', offset: 0 },
                { opacity: 1, transform: 'translateY(0)', offset: 0.25 },
                { opacity: 1, transform: 'translateY(0)', offset: 0.75 },
                { opacity: 0, transform: 'translateY(-12px)', offset: 1 }
            ], { duration: 800, delay: 750 + index * 750, fill: 'both', easing: 'ease-out' }));
        });
        const exit = intro.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: 550, delay: 3000, fill: 'forwards', easing: 'ease-in-out'
        });
        animations.push(exit);
        exit.onfinish = () => finish(true);
    } catch (error) {
        finish();
    }
}
initCinematicIntro();

const hamburgerToggle = document.getElementById('hamburger-toggle');
const navLinksMenu = document.getElementById('nav-links-menu');

function setMenuOpen(isOpen) {
    if (!hamburgerToggle || !navLinksMenu) return;
    navLinksMenu.classList.toggle('active', isOpen);
    hamburgerToggle.setAttribute('aria-expanded', String(isOpen));
    hamburgerToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    navLinksMenu.inert = window.innerWidth <= navMenuBreakpoint && !isOpen;
}

hamburgerToggle?.addEventListener('click', () => {
    setMenuOpen(hamburgerToggle.getAttribute('aria-expanded') !== 'true');
});

navLinksMenu?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenuOpen(false));
});

window.addEventListener('resize', () => {
    if (hamburgerToggle?.getAttribute('aria-expanded') !== 'true') setMenuOpen(false);
});
setMenuOpen(false);

const adminModal = document.getElementById('admin-modal');
const adminDashboard = document.getElementById('admin-dashboard');
const demoDialog = adminModal?.querySelector('[role="dialog"]');
const adminLoginForm = document.getElementById('admin-login-form');
const closeAdminModal = document.getElementById('close-admin-modal');
const btnLogoutAdmin = document.getElementById('btn-logout-admin');
const adminEntryLinks = [
    document.getElementById('btn-open-admin'),
    document.getElementById('footer-admin-link')
].filter(Boolean);
let modalReturnFocus = null;
let previousBodyOverflow = '';
const pageRegions = document.querySelectorAll('.skip-link, .navbar, #main-content, .footer-institucional');

function setPageRegionsInert(isInert) {
    if (isInert) dismissCinematicIntro();
    narrative.setPaused(isInert);
    revealHeroPhone.setPaused(isInert);
    document.body.classList.toggle('cinema-paused', isInert);
    pageRegions.forEach((region) => {
        region.inert = isInert;
    });
}

function setDashboardVisible(isVisible) {
    if (!adminDashboard) return;
    adminDashboard.hidden = !isVisible;
    setPageRegionsInert(isVisible);
    document.body.style.overflow = isVisible ? 'hidden' : previousBodyOverflow;
    if (isVisible) {
        adminDashboard.querySelector('#admin-dashboard-title')?.focus();
    } else {
        modalReturnFocus?.focus();
    }
}

function closeDemoDialog() {
    if (!adminModal || adminModal.hidden) return;
    adminModal.hidden = true;
    setPageRegionsInert(false);
    document.body.style.overflow = previousBodyOverflow;
    modalReturnFocus?.focus();
}

function openDemoDialog(event) {
    event.preventDefault();
    if (!adminModal || !demoDialog) return;
    modalReturnFocus = window.innerWidth <= navMenuBreakpoint && event.currentTarget.closest('#nav-links-menu')
        ? hamburgerToggle
        : event.currentTarget;
    previousBodyOverflow = document.body.style.overflow;
    adminModal.hidden = false;
    setPageRegionsInert(true);
    document.body.style.overflow = 'hidden';
    closeAdminModal?.focus();
}

adminEntryLinks.forEach((link) => link.addEventListener('click', openDemoDialog));
closeAdminModal?.addEventListener('click', closeDemoDialog);
adminModal?.addEventListener('click', (event) => {
    if (event.target === adminModal) closeDemoDialog();
});

adminLoginForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    adminModal.hidden = true;
    setDashboardVisible(true);
    document.getElementById('admin-user-name').textContent = 'Dirección / UTP';
    document.getElementById('admin-login-status').textContent = '';
    adminLoginForm.reset();
});

btnLogoutAdmin?.addEventListener('click', () => setDashboardVisible(false));

document.addEventListener('keydown', (event) => {
    const currentTab = event.target.closest?.('[role="tab"]');
    if (currentTab && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const tabs = [...document.querySelectorAll('[role="tab"]')];
        const currentIndex = tabs.indexOf(currentTab);
        const nextIndex = event.key === 'Home'
            ? 0
            : event.key === 'End'
                ? tabs.length - 1
                : (currentIndex + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
        tabs[nextIndex]?.click();
        tabs[nextIndex]?.focus();
    }

    if (event.key === 'Escape') {
        if (adminDashboard && !adminDashboard.hidden) {
            setDashboardVisible(false);
        } else {
            closeDemoDialog();
        }
        setMenuOpen(false);
    }

    if (event.key !== 'Tab') return;
    const activeOverlay = adminDashboard && !adminDashboard.hidden
        ? adminDashboard
        : adminModal && !adminModal.hidden
            ? demoDialog
            : null;
    if (!activeOverlay) return;
    const focusable = [...activeOverlay.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        .filter((element) => !element.closest('[hidden], .hidden, [inert]') && element.getClientRects().length > 0);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
});

document.querySelectorAll('.admin-tab-btn').forEach((button) => {
    button.addEventListener('click', () => {
        const targetPanel = document.getElementById(button.dataset.tab);
        if (!targetPanel) return;

        document.querySelectorAll('.admin-tab-btn').forEach((item) => {
            const selected = item === button;
            item.classList.toggle('active', selected);
            item.setAttribute('aria-selected', String(selected));
            item.tabIndex = selected ? 0 : -1;
        });
        document.querySelectorAll('.admin-panel').forEach((panel) => {
            panel.hidden = panel !== targetPanel;
            panel.classList.toggle('hidden', panel !== targetPanel);
        });
        targetPanel.focus();
    });
});

const studentDemoForm = document.getElementById('student-demo-form');
const studentRutInput = document.getElementById('rut-input');
const studentDemoStatus = document.getElementById('student-demo-status');
function rutVerifier(body) {
    let sum = 0;
    let multiplier = 2;

    for (let index = body.length - 1; index >= 0; index -= 1) {
        sum += Number(body[index]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const result = 11 - (sum % 11);
    return result === 11 ? '0' : result === 10 ? 'K' : String(result);
}

function parseRut(value) {
    const compactRut = value.replace(/[^0-9k]/gi, '').toUpperCase();
    const explicitK = compactRut.endsWith('K');
    const digits = compactRut.replace(/\D/g, '');

    if (explicitK && /^\d{7,8}K$/.test(compactRut)) {
        return { body: digits, verifier: 'K' };
    }
    if (digits.length === 9) {
        return { body: digits.slice(0, 8), verifier: digits.slice(-1) };
    }
    if (digits.length === 8) {
        return { body: digits.slice(0, 7), verifier: digits.slice(-1) };
    }
    return { body: digits, verifier: '' };
}

function formatRut(value) {
    const compactRut = value.replace(/[^0-9k]/gi, '').toUpperCase();
    const digits = compactRut.replace(/\D/g, '').slice(0, 9);
    let body = digits;
    let verifier = '';

    if (compactRut.endsWith('K') && /^\d{7,8}K$/.test(compactRut)) {
        body = compactRut.slice(0, -1);
        verifier = 'K';
    } else if (digits.length === 9) {
        body = digits.slice(0, 8);
        verifier = digits.slice(-1);
    } else if (digits.length === 8 && rutVerifier(digits.slice(0, 7)) === digits.slice(-1)) {
        body = digits.slice(0, 7);
        verifier = digits.slice(-1);
    }

    const groupedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${groupedBody}${verifier ? `-${verifier}` : ''}`;
}

function isValidRut(value) {
    const { body, verifier } = parseRut(value);

    return /^\d{7,8}$/.test(body) && rutVerifier(body) === verifier;
}

function clearStudentRutFeedback() {
    if (!studentDemoStatus) return;
    studentDemoStatus.textContent = '';
    studentDemoStatus.hidden = true;
    studentDemoStatus.classList.remove('is-error', 'is-success');
}

studentRutInput?.addEventListener('input', () => {
    const caret = studentRutInput.selectionStart ?? studentRutInput.value.length;
    const rawCharactersBeforeCaret = studentRutInput.value
        .slice(0, caret)
        .replace(/[^0-9k]/gi, '').length;
    studentRutInput.value = formatRut(studentRutInput.value);

    let formattedCaret = 0;
    let countedCharacters = 0;
    while (formattedCaret < studentRutInput.value.length && countedCharacters < rawCharactersBeforeCaret) {
        if (/[0-9k]/i.test(studentRutInput.value[formattedCaret])) countedCharacters += 1;
        formattedCaret += 1;
    }
    studentRutInput.setSelectionRange(formattedCaret, formattedCaret);
    studentRutInput.setAttribute('aria-invalid', 'false');
    clearStudentRutFeedback();
});

studentDemoForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!studentRutInput || !studentDemoStatus) return;

    const isValid = isValidRut(studentRutInput.value);
    studentRutInput.setAttribute('aria-invalid', String(!isValid));
    studentDemoStatus.classList.toggle('is-error', !isValid);
    studentDemoStatus.classList.toggle('is-success', isValid);
    if (isValid) {
        studentDemoStatus.textContent = 'Formato válido. Consulta simulada: curso de ejemplo 3° Medio A. No se consultaron matrículas.';
    } else {
        studentDemoStatus.textContent = 'Revisa el RUT: debe tener 7 u 8 dígitos y un dígito verificador válido.';
    }
    studentDemoStatus.hidden = false;
});

document.querySelectorAll('.demo-form').forEach((form) => {
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const status = form.querySelector('[role="status"]');
        if (status) status.textContent = form.dataset.demoMessage || 'Demostración: no se guardaron cambios.';
    });
});

document.getElementById('demo-sync-schedule')?.addEventListener('click', () => {
    const status = document.getElementById('schedule-demo-status');
    if (status) status.textContent = 'Demostración: archivo revisado; no se sincronizaron horarios.';
});

document.getElementById('file-upload')?.addEventListener('change', (event) => {
    const status = document.getElementById('file-upload-status');
    if (status) {
        status.textContent = event.currentTarget.files?.length
            ? `Archivo seleccionado: ${event.currentTarget.files[0].name}`
            : '';
    }
});

document.getElementById('demo-search-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = document.getElementById('demo-user-search')?.value.trim().toLocaleLowerCase() ?? '';
    const rows = [...document.querySelectorAll('.admin-table tbody tr')];
    let visibleCount = 0;
    rows.forEach((row) => {
        const isMatch = row.textContent.toLocaleLowerCase().includes(query);
        row.hidden = !isMatch;
        if (isMatch) visibleCount += 1;
    });
    const status = document.getElementById('demo-search-status');
    if (status) status.textContent = `${visibleCount} resultado(s).`;
});

document.querySelectorAll('.admin-table .btn-text').forEach((button) => {
    button.addEventListener('click', () => {
        const status = document.getElementById('demo-search-status');
        if (status) status.textContent = 'Ficha seleccionada.';
    });
});

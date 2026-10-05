'use strict';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const navMenuBreakpoint = 1250;

if (window.feather) {
    window.feather.replace();
}

window.addEventListener('load', () => {
    const preloader = document.getElementById('app-preloader');
    if (preloader) {
        window.setTimeout(() => preloader.classList.add('hidden-loader'), 350);
    }
});

const revealItems = document.querySelectorAll('.reveal-on-scroll');
if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -30px 0px'
    });

    revealItems.forEach((item) => revealObserver.observe(item));
}

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

const pinWrapper = document.querySelector('.explore-pin-wrapper');
const exploreTrack = document.querySelector('.explore-track');
let targetX = 0;
let currentX = 0;
let animationFrame = 0;

function renderHorizontalScroll() {
    animationFrame = 0;
    if (!exploreTrack) return;

    if (window.innerWidth <= 900 || prefersReducedMotion.matches) {
        targetX = 0;
        currentX = 0;
        exploreTrack.style.transform = 'none';
        return;
    }

    currentX += (targetX - currentX) * 0.16;
    if (Math.abs(targetX - currentX) < 0.25) currentX = targetX;
    exploreTrack.style.transform = `translateX(-${currentX}px)`;

    if (currentX !== targetX) animationFrame = window.requestAnimationFrame(renderHorizontalScroll);
}

function scheduleHorizontalRender() {
    if (!animationFrame) animationFrame = window.requestAnimationFrame(renderHorizontalScroll);
}

function updateHorizontalTarget() {
    if (!pinWrapper || !exploreTrack || window.innerWidth <= 900 || prefersReducedMotion.matches) {
        targetX = 0;
        scheduleHorizontalRender();
        return;
    }

    const rect = pinWrapper.getBoundingClientRect();
    const pinHeight = rect.height - window.innerHeight;
    const maxTranslate = Math.max(0, exploreTrack.scrollWidth - document.documentElement.clientWidth);

    if (pinHeight <= 0) {
        targetX = 0;
    } else {
        const progress = Math.min(1, Math.max(0, -rect.top / pinHeight));
        targetX = progress * maxTranslate;
    }
    scheduleHorizontalRender();
}

window.addEventListener('scroll', updateHorizontalTarget, { passive: true });
window.addEventListener('resize', updateHorizontalTarget);
window.addEventListener('resize', () => {
    if (hamburgerToggle?.getAttribute('aria-expanded') !== 'true') setMenuOpen(false);
});
prefersReducedMotion.addEventListener?.('change', updateHorizontalTarget);
updateHorizontalTarget();
setMenuOpen(false);

document.querySelectorAll('.card-toggle').forEach((button) => {
    button.addEventListener('click', () => {
        const card = button.closest('.explore-card');
        const preview = document.getElementById(button.getAttribute('aria-controls'));
        if (!card || !preview) return;

        const isOpen = button.getAttribute('aria-expanded') === 'true';
        document.querySelectorAll('.card-toggle').forEach((otherButton) => {
            otherButton.setAttribute('aria-expanded', 'false');
            otherButton.closest('.explore-card')?.classList.remove('active');
            const label = otherButton.querySelector('.card-toggle-label');
            if (label) label.textContent = 'Mostrar vista previa';
        });
        document.querySelectorAll('.card-preview-wrapper').forEach((item) => {
            item.setAttribute('aria-hidden', 'true');
            item.tabIndex = -1;
        });

        if (!isOpen) {
            button.setAttribute('aria-expanded', 'true');
            card.classList.add('active');
            preview.setAttribute('aria-hidden', 'false');
            preview.tabIndex = 0;
            const label = button.querySelector('.card-toggle-label');
            if (label) label.textContent = 'Ocultar vista previa';
        }
    });
});

const mapStatus = document.getElementById('map-status');
if (window.L && document.getElementById('map')) {
    try {
        const map = window.L.map('map').setView([-18.4746, -70.3102], 17);
        const tiles = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        tiles.on('tileload', () => {
            if (mapStatus) mapStatus.hidden = true;
        });
        tiles.on('tileerror', () => {
            if (mapStatus) {
                mapStatus.textContent = 'No se pudieron cargar las imágenes del mapa. Comprueba tu conexión.';
                mapStatus.hidden = false;
            }
        });

        window.L.marker([-18.4746, -70.3102]).addTo(map)
            .bindPopup('<strong>Liceo B4 Antonio Varas</strong><br>Arica, Chile.');
        if (mapStatus) mapStatus.hidden = true;
    } catch (error) {
        console.error('No se pudo inicializar el mapa:', error);
        if (mapStatus) {
            mapStatus.textContent = 'El mapa no está disponible. El resto de la página sigue funcionando.';
        }
    }
} else if (mapStatus) {
    mapStatus.textContent = 'No se pudo cargar el mapa interactivo. El resto de la página sigue funcionando.';
}

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
const demoCourses = ['A', 'B', 'C', 'D', 'E'].flatMap((section) =>
    [1, 2, 3, 4].map((grade) => `${grade}° Medio ${section}`)
);

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
        const course = demoCourses[Math.floor(Math.random() * demoCourses.length)];
        studentDemoStatus.textContent = `Consulta simulada: estudiante detectado en ${course}.`;
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
    if (status) status.textContent = 'Horarios sincronizados correctamente.';
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

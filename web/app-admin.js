document.addEventListener('DOMContentLoaded', () => {
    // Referencias DOM
    const btnNavAdmin = document.querySelector('.btn-nav-admin');
    const modalAdmin = document.getElementById('admin-modal');
    const btnCloseModal = document.getElementById('close-admin-modal');
    const loginForm = document.getElementById('admin-login-form');
    const loginError = document.getElementById('login-error-msg');
    const dashboardSection = document.getElementById('admin-dashboard');
    const btnLogout = document.getElementById('btn-logout-admin');

    // 1. Abrir / Cerrar Modal
    if (btnNavAdmin) {
        btnNavAdmin.addEventListener('click', (e) => {
            e.preventDefault();
            modalAdmin.classList.remove('hidden');
        });
    }

    btnCloseModal.addEventListener('click', () => modalAdmin.classList.add('hidden'));

    // 2. Manejo de Inicio de Sesión
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rut = document.getElementById('admin-rut').value;
        const pass = document.getElementById('admin-pass').value;

        // SIMULACIÓN O CONEXIÓN CON API REAL (MariaDB)
        // Reemplazar este bloque por un fetch('/api/login', { method: 'POST', body: ... })
        if ((rut === '12345678-9' || rut === 'admin') && pass === '1234') {
            const userData = { rut: rut, nombre: 'Dirección UTP', rol: 'UTP/Inspectoría' };
            localStorage.setItem('liceomap_session', JSON.stringify(userData));
            
            modalAdmin.classList.add('hidden');
            activarModoAdmin(userData);
        } else {
            loginError.classList.remove('hidden');
        }
    });

    // 3. Activar Vista Administrativa (SPA)
    function activarModoAdmin(user) {
        document.getElementById('admin-user-name').textContent = `${user.nombre} (${user.rol})`;
        dashboardSection.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Evita scroll en la landing page de fondo
    }

    // 4. Cerrar Sesión
    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('liceomap_session');
        dashboardSection.classList.add('hidden');
        document.body.style.overflow = 'auto';
    });

    // 5. Navegación por Pestañas del Dashboard
    const tabBtns = document.querySelectorAll('.admin-tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.add('hidden'));

            btn.classList.add('active');
            document.getElementById(targetTab).classList.remove('hidden');
        });
    });

    // 6. Persistence Check (Verificar si ya inició sesión previamente)
    const savedSession = localStorage.getItem('liceomap_session');
    if (savedSession) {
        activarModoAdmin(JSON.parse(savedSession));
    }
});
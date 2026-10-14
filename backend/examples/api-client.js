// Cliente de SOLO lectura. No usar la sesión simulada del panel como credencial.
export function createLiceoMapClient(baseUrl) {
    const base = new URL(baseUrl);
    if (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(base.hostname))) {
        throw new Error('La API remota requiere HTTPS');
    }
    async function read(path) {
        const response = await fetch(new URL(path, base), {
            headers: { Accept: 'application/json' },
            credentials: 'omit',
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error?.message || 'No se pudo consultar la API');
        return body;
    }
    const coursePath = (course) => `/api/v1/cursos/${encodeURIComponent(course)}`;
    return {
        courses: () => read('/api/v1/cursos'),
        announcements: (course, limit = 20, offset = 0) => read(`${coursePath(course)}/anuncios?${new URLSearchParams({ limit, offset })}`),
        schedule: (course, day) => read(`${coursePath(course)}/horarios${day == null ? '' : `?${new URLSearchParams({ dia: day })}`}`),
    };
}

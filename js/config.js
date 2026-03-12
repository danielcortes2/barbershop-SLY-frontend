/**
 * Configuracion centralizada del frontend.
 * Cambiar API_BASE_URL cuando se despliegue el backend en Render.
 */
const CONFIG = {
    // URL del backend en produccion (Render)
    // Cambiar por la URL real una vez desplegado en Render
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:9000/api/v1'
        : 'https://barbershop-sly-backend.onrender.com/api/v1',
};

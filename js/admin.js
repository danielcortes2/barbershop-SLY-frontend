/**
 * SLY BARBERSHOP - ADMIN PANEL
 * Panel de administracion privado para gestionar citas
 */

const API_URL = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) || 'http://localhost:9000/api/v1';
let currentPage = 1;
let currentFilters = {};
let isAuthenticated = false;
let adminToken = null;

// Inicializar al cargar la pagina
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initLoginForm();
    initAdminPanel();
});

/**
 * AUTENTICACION
 */
function checkAuthentication() {
    const token = sessionStorage.getItem('sly_admin_token');
    if (token) {
        adminToken = token;
        isAuthenticated = true;
        showAdminPanel();
    } else {
        showLoginScreen();
    }
}

function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const password = document.getElementById('adminPassword').value;
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            if (!response.ok) throw new Error('Contrasena incorrecta');
            const data = await response.json();
            adminToken = data.token;
            sessionStorage.setItem('sly_admin_token', adminToken);
            isAuthenticated = true;
            loginError.style.display = 'none';
            showAdminPanel();
        } catch (error) {
            loginError.textContent = 'Contrasena incorrecta. Intenta de nuevo.';
            loginError.style.display = 'block';
            document.getElementById('adminPassword').value = '';
            document.getElementById('adminPassword').focus();
        }
    });
}

function showLoginScreen() {
    document.getElementById('adminLogin').style.display = 'flex';
    document.getElementById('adminPanel').style.display = 'none';
}

function showAdminPanel() {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    loadAppointments();
    loadStats();
}

/**
 * INICIALIZAR PANEL ADMIN
 */
function initAdminPanel() {
    const logoutBtn = document.getElementById('logoutBtn');
    const applyFiltersBtn = document.getElementById('applyFilters');
    const clearFiltersBtn = document.getElementById('clearFilters');
    const refreshBtn = document.getElementById('refreshBtn');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');

    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            currentPage = 1;
            applyFilters();
        });
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            document.getElementById('filterDate').value = '';
            document.getElementById('filterStatus').value = '';
            currentFilters = {};
            currentPage = 1;
            loadAppointments();
            loadStats();
        });
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadAppointments();
            loadStats();
        });
    }

    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) { currentPage--; loadAppointments(); }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            currentPage++;
            loadAppointments();
        });
    }
}

function logout() {
    if (adminToken) {
        fetch(`${API_URL}/auth/logout?token=${adminToken}`, { method: 'POST' })
            .catch(e => console.log('Error en logout:', e));
    }
    sessionStorage.removeItem('sly_admin_token');
    adminToken = null;
    isAuthenticated = false;
    showLoginScreen();
}

/**
 * CARGAR ESTADISTICAS
 */
async function loadStats() {
    try {
        const [all, confirmed, cancelled] = await Promise.all([
            fetch(`${API_URL}/appointments/?limit=1000`).then(r => r.json()),
            fetch(`${API_URL}/appointments/?limit=1000&status_filter=confirmed`).then(r => r.json()),
            fetch(`${API_URL}/appointments/?limit=1000&status_filter=cancelled`).then(r => r.json()),
        ]);
        document.getElementById('statTotal').textContent = all.length;
        document.getElementById('statConfirmed').textContent = confirmed.length;
        document.getElementById('statCancelled').textContent = cancelled.length;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

/**
 * CARGAR CITAS
 */
async function loadAppointments() {
    const listContainer = document.getElementById('appointmentsList');
    if (!listContainer) return;

    listContainer.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Cargando citas...</p>
        </div>
    `;

    try {
        let url = `${API_URL}/appointments/?skip=${(currentPage - 1) * 20}&limit=20`;

        if (currentFilters.status) {
            url += `&status_filter=${currentFilters.status}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Error loading appointments');

        const appointments = await response.json();
        displayAppointments(appointments);
        updatePagination(appointments.length);

    } catch (error) {
        console.error('Error:', error);
        listContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error cargando citas</h3>
                <p>Asegurate de que el servidor esta corriendo.</p>
                <button class="btn btn-primary" onclick="loadAppointments()">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        `;
    }
}

function applyFilters() {
    const statusFilter = document.getElementById('filterStatus').value;
    currentFilters = {};
    if (statusFilter) currentFilters.status = statusFilter;
    loadAppointments();
}

function statusLabel(status) {
    const labels = {
        pending: 'Pendiente',
        confirmed: 'Confirmada',
        completed: 'Completada',
        cancelled: 'Cancelada'
    };
    return labels[status] || status;
}

function displayAppointments(appointments) {
    const listContainer = document.getElementById('appointmentsList');

    if (!appointments || appointments.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>No hay citas</h3>
                <p>No se encontraron citas con los filtros aplicados.</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = appointments.map(apt => {
        const isCancelled = apt.status === 'cancelled';
        const dateStr = apt.appointment_date
            ? new Date(apt.appointment_date).toLocaleString('es-ES', {
                weekday: 'short', year: 'numeric', month: 'short',
                day: 'numeric', hour: '2-digit', minute: '2-digit'
              })
            : '-';
        const barberName = apt.barber ? apt.barber.name : `Barbero #${apt.barber_id}`;
        const serviceName = apt.service ? apt.service.name : `Servicio #${apt.service_id}`;

        return `
        <div class="appointment-card ${isCancelled ? 'cancelled' : ''}">
            <div class="appointment-header">
                <div class="appointment-id">#${apt.id}</div>
                <span class="appointment-status status-${apt.status}">
                    ${statusLabel(apt.status)}
                </span>
            </div>
            <div class="appointment-body">
                <div class="appointment-info">
                    <div class="info-row">
                        <i class="fas fa-user"></i>
                        <div>
                            <strong>${apt.client_name}</strong>
                            ${apt.client_phone ? `<span>${apt.client_phone}</span>` : ''}
                        </div>
                    </div>
                    <div class="info-row">
                        <i class="fas fa-calendar-alt"></i>
                        <strong>${dateStr}</strong>
                    </div>
                    <div class="info-row">
                        <i class="fas fa-cut"></i>
                        <div>
                            <strong>${serviceName}</strong>
                            <span>${barberName}</span>
                        </div>
                    </div>
                    ${apt.notes ? `<div class="info-row"><i class="fas fa-sticky-note"></i><span>${apt.notes}</span></div>` : ''}
                    <div class="info-row info-meta">
                        <i class="fas fa-clock"></i>
                        <span>Creada: ${formatDateTime(apt.created_at)}</span>
                    </div>
                </div>
                <div class="appointment-actions">
                    ${!isCancelled ? `
                        <button class="btn btn-sm btn-danger" onclick="cancelAppointment(${apt.id})">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-outline" onclick="deleteAppointment(${apt.id})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

function formatDateTime(dateTimeString) {
    if (!dateTimeString) return '-';
    return new Date(dateTimeString).toLocaleString('es-ES', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function updatePagination(count) {
    const paginationContainer = document.getElementById('appointmentsPagination');
    const paginationInfo = document.getElementById('paginationInfo');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    if (!paginationContainer) return;

    const hasMore = count === 20;
    const hasPrev = currentPage > 1;

    if (!hasMore && !hasPrev) {
        paginationContainer.style.display = 'none';
        return;
    }

    paginationContainer.style.display = 'flex';
    if (paginationInfo) paginationInfo.textContent = `Pagina ${currentPage}`;
    if (prevBtn) prevBtn.disabled = !hasPrev;
    if (nextBtn) nextBtn.disabled = !hasMore;
}

/**
 * ACCIONES DE CITAS
 */
async function cancelAppointment(id) {
    if (!confirm('Cancelar esta cita?\nEl horario quedara libre.')) return;
    try {
        const response = await fetch(`${API_URL}/appointments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'cancelled' })
        });
        if (!response.ok) throw new Error('Error al cancelar');
        loadAppointments();
        loadStats();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cancelar la cita.');
    }
}

async function deleteAppointment(id) {
    if (!confirm('Eliminar esta cita permanentemente?\nEl horario quedara libre y no se podra deshacer.')) return;
    try {
        const response = await fetch(`${API_URL}/appointments/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Error al eliminar');
        loadAppointments();
        loadStats();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la cita.');
    }
}
    initLoginForm();

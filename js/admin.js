/**
 * SLY BARBERSHOP - ADMIN PANEL
 * Panel de administración privado para gestionar citas
 */

const API_URL = 'http://localhost:8000/api';
const ADMIN_PASSWORD = 'sly2026'; // Cambiar en producción
let currentPage = 1;
let currentFilters = {};
let isAuthenticated = false;

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initLoginForm();
    initAdminPanel();
});

/**
 * AUTENTICACIÓN
 */
function checkAuthentication() {
    const auth = sessionStorage.getItem('sly_admin_auth');
    if (auth === 'true') {
        isAuthenticated = true;
        showAdminPanel();
    } else {
        showLoginScreen();
    }
}

function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const password = document.getElementById('adminPassword').value;
        
        if (password === ADMIN_PASSWORD) {
            sessionStorage.setItem('sly_admin_auth', 'true');
            isAuthenticated = true;
            loginError.style.display = 'none';
            showAdminPanel();
        } else {
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
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
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
            if (currentPage > 1) {
                currentPage--;
                loadAppointments();
            }
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
    sessionStorage.removeItem('sly_admin_auth');
    isAuthenticated = false;
    showLoginScreen();
}

/**
 * CARGAR ESTADÍSTICAS
 */
async function loadStats() {
    try {
        // Total appointments
        const responseAll = await fetch(`${API_URL}/reservas/?limit=1000`);
        const dataAll = await responseAll.json();
        
        // Confirmed
        const responseConfirmed = await fetch(`${API_URL}/reservas/?estado=confirmada&limit=1000`);
        const dataConfirmed = await responseConfirmed.json();
        
        // Cancelled
        const responseCancelled = await fetch(`${API_URL}/reservas/?estado=cancelada&limit=1000`);
        const dataCancelled = await responseCancelled.json();
        
        document.getElementById('statTotal').textContent = dataAll.total;
        document.getElementById('statConfirmed').textContent = dataConfirmed.total;
        document.getElementById('statCancelled').textContent = dataCancelled.total;
        
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
            <p>Loading appointments...</p>
        </div>
    `;
    
    try {
        let url = `${API_URL}/reservas/?skip=${(currentPage - 1) * 20}&limit=20`;
        
        if (currentFilters.fecha) {
            url += `&fecha=${currentFilters.fecha}`;
        }
        
        if (currentFilters.estado) {
            url += `&estado=${currentFilters.estado}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Error loading appointments');
        }
        
        const data = await response.json();
        
        displayAppointments(data.reservas);
        updatePagination(data.total);
        
    } catch (error) {
        console.error('Error:', error);
        listContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error loading appointments</h3>
                <p>Please make sure the backend server is running.</p>
                <button class="btn btn-primary" onclick="loadAppointments()">
                    <i class="fas fa-redo"></i>
                    Try Again
                </button>
            </div>
        `;
    }
}

function applyFilters() {
    const dateFilter = document.getElementById('filterDate').value;
    const statusFilter = document.getElementById('filterStatus').value;
    
    currentFilters = {};
    
    if (dateFilter) {
        currentFilters.fecha = dateFilter;
    }
    
    if (statusFilter) {
        currentFilters.estado = statusFilter;
    }
    
    loadAppointments();
}

function displayAppointments(appointments) {
    const listContainer = document.getElementById('appointmentsList');
    
    if (appointments.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>No appointments found</h3>
                <p>There are no appointments matching your criteria.</p>
            </div>
        `;
        return;
    }
    
    listContainer.innerHTML = appointments.map(apt => `
        <div class="appointment-card ${apt.estado === 'cancelada' ? 'cancelled' : ''}">
            <div class="appointment-header">
                <div class="appointment-id">#${apt.id}</div>
                <span class="appointment-status status-${apt.estado}">
                    <i class="fas fa-${apt.estado === 'confirmada' ? 'check-circle' : 'times-circle'}"></i>
                    ${apt.estado === 'confirmada' ? 'Confirmed' : 'Cancelled'}
                </span>
            </div>
            
            <div class="appointment-body">
                <div class="appointment-info">
                    <div class="info-row">
                        <i class="fas fa-user"></i>
                        <div>
                            <strong>${apt.nombre_cliente}</strong>
                            <span>${apt.email}</span>
                        </div>
                    </div>
                    
                    <div class="info-row">
                        <i class="fas fa-calendar-alt"></i>
                        <div>
                            <strong>${formatDisplayDate(apt.fecha)}</strong>
                            <span>${apt.hora}</span>
                        </div>
                    </div>
                    
                    <div class="info-row">
                        <i class="fas fa-scissors"></i>
                        <div>
                            <strong>${apt.servicio}</strong>
                        </div>
                    </div>
                    
                    <div class="info-row info-meta">
                        <i class="fas fa-clock"></i>
                        <span>Created: ${formatDateTime(apt.created_at)}</span>
                    </div>
                </div>
                
                ${apt.estado === 'confirmada' ? `
                    <div class="appointment-actions">
                        <button class="btn btn-sm btn-outline" onclick="editAppointment(${apt.id})">
                            <i class="fas fa-edit"></i>
                            Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="cancelAppointment(${apt.id})">
                            <i class="fas fa-times"></i>
                            Cancel
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="deleteAppointment(${apt.id})">
                            <i class="fas fa-trash"></i>
                            Delete
                        </button>
                    </div>
                ` : `
                    <div class="appointment-actions">
                        <button class="btn btn-sm btn-outline" onclick="deleteAppointment(${apt.id})">
                            <i class="fas fa-trash"></i>
                            Delete
                        </button>
                    </div>
                `}
            </div>
        </div>
    `).join('');
}

function formatDisplayDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updatePagination(total) {
    const paginationContainer = document.getElementById('appointmentsPagination');
    const paginationInfo = document.getElementById('paginationInfo');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    const totalPages = Math.ceil(total / 20);
    
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'flex';
    paginationInfo.textContent = `Page ${currentPage} of ${totalPages} (${total} total)`;
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

/**
 * ACCIONES DE CITAS
 */
async function cancelAppointment(id) {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/reservas/${id}/cancelar`, {
            method: 'PATCH'
        });
        
        if (!response.ok) {
            throw new Error('Error cancelling appointment');
        }
        
        alert('Appointment cancelled successfully');
        loadAppointments();
        loadStats();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error cancelling appointment. Please try again.');
    }
}

async function deleteAppointment(id) {
    if (!confirm('Are you sure you want to PERMANENTLY delete this appointment? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/reservas/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Error deleting appointment');
        }
        
        alert('Appointment deleted successfully');
        loadAppointments();
        loadStats();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error deleting appointment. Please try again.');
    }
}

async function editAppointment(id) {
    try {
        const response = await fetch(`${API_URL}/reservas/${id}`);
        
        if (!response.ok) {
            throw new Error('Error loading appointment');
        }
        
        const appointment = await response.json();
        showEditModal(appointment);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading appointment data');
    }
}

function showEditModal(appointment) {
    const modal = document.createElement('div');
    modal.className = 'edit-modal-overlay';
    modal.innerHTML = `
        <div class="edit-modal">
            <div class="modal-header">
                <h3><i class="fas fa-edit"></i> Edit Appointment #${appointment.id}</h3>
                <button class="modal-close" onclick="closeEditModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form class="edit-form" id="editForm">
                <input type="hidden" id="editId" value="${appointment.id}">
                
                <div class="form-group">
                    <label for="editName">Full name *</label>
                    <input type="text" id="editName" value="${appointment.nombre_cliente}" required>
                </div>
                
                <div class="form-group">
                    <label for="editEmail">Email *</label>
                    <input type="email" id="editEmail" value="${appointment.email}" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="editDate">Date *</label>
                        <input type="date" id="editDate" value="${appointment.fecha}" required>
                    </div>
                    <div class="form-group">
                        <label for="editTime">Time *</label>
                        <input type="time" id="editTime" value="${appointment.hora}" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="editService">Service *</label>
                    <input type="text" id="editService" value="${appointment.servicio}" required>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn btn-outline" onclick="closeEditModal()">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i>
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('editForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateAppointment();
    });
}

function closeEditModal() {
    const modal = document.querySelector('.edit-modal-overlay');
    if (modal) {
        modal.remove();
    }
}

async function updateAppointment() {
    const id = document.getElementById('editId').value;
    const data = {
        nombre_cliente: document.getElementById('editName').value,
        email: document.getElementById('editEmail').value,
        fecha: document.getElementById('editDate').value,
        hora: document.getElementById('editTime').value,
        servicio: document.getElementById('editService').value
    };
    
    try {
        const response = await fetch(`${API_URL}/reservas/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error updating appointment');
        }
        
        alert('Appointment updated successfully');
        closeEditModal();
        loadAppointments();
        loadStats();
        
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Error updating appointment. Please try again.');
    }
}

// =====================================================
// ARCHIVO: js/reserva.js
// DESCRIPCIÓN: Script para manejar el formulario
// de reservas de citas
// =====================================================

// URL del servidor API
const API_URL = 'http://localhost:3000/api';

// Variable para almacenar el horario disponible
let availableSlots = [];

// =====================================================
// FUNCIÓN: initForm()
// DESCRIPCIÓN: Inicializa el formulario cargando
// servicios y barberos disponibles
// =====================================================
async function initForm() {
  // Cargar lista de servicios
  await loadServices();
  
  // Cargar lista de barberos
  await loadBarbers();
  
  // Establecer fecha mínima en el calendario (hoy)
  setMinDate();
  
  // Agregar event listeners
  setupEventListeners();
}

// =====================================================
// FUNCIÓN: loadServices()
// DESCRIPCIÓN: Obtiene la lista de servicios del servidor
// =====================================================
async function loadServices() {
  try {
    const response = await fetch(`${API_URL}/services`);
    const services = await response.json();
    
    // Obtener el select de servicios
    const serviceSelect = document.getElementById('serviceId');
    
    // Limpiar opciones previas
    serviceSelect.innerHTML = '<option value="">Selecciona un servicio...</option>';
    
    // Agregar opciones
    services.forEach(service => {
      const option = document.createElement('option');
      option.value = service.id;
      option.textContent = `${service.name} - $${service.price} (${service.duration} min)`;
      serviceSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error cargando servicios:', error);
    showMessage('Error al cargar los servicios', 'error');
  }
}

// =====================================================
// FUNCIÓN: loadBarbers()
// DESCRIPCIÓN: Obtiene la lista de barberos del servidor
// =====================================================
async function loadBarbers() {
  try {
    const response = await fetch(`${API_URL}/barbers`);
    const barbers = await response.json();
    
    // Obtener el select de barberos
    const barberSelect = document.getElementById('barberId');
    
    // Limpiar opciones previas
    barberSelect.innerHTML = '<option value="">Selecciona un barbero...</option>';
    
    // Agregar opciones
    barbers.forEach(barber => {
      const option = document.createElement('option');
      option.value = barber.id;
      option.textContent = barber.name;
      barberSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error cargando barberos:', error);
    showMessage('Error al cargar los barberos', 'error');
  }
}

// =====================================================
// FUNCIÓN: setMinDate()
// DESCRIPCIÓN: Establece la fecha mínima en el input
// de fecha (hoy)
// =====================================================
function setMinDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('appointmentDate').setAttribute('min', today);
}

// =====================================================
// FUNCIÓN: setupEventListeners()
// DESCRIPCIÓN: Configura todos los event listeners
// del formulario
// =====================================================
function setupEventListeners() {
  const form = document.getElementById('appointmentForm');
  const dateInput = document.getElementById('appointmentDate');
  const barberSelect = document.getElementById('barberId');
  const timeSelect = document.getElementById('appointmentTime');
  
  // Al cambiar la fecha, cargar horarios disponibles
  dateInput.addEventListener('change', loadAvailableSlots);
  
  // Al cambiar el barbero, cargar horarios disponibles
  barberSelect.addEventListener('change', loadAvailableSlots);
  
  // Al enviar el formulario, crear la reserva
  form.addEventListener('submit', submitForm);
}

// =====================================================
// FUNCIÓN: loadAvailableSlots()
// DESCRIPCIÓN: Carga los horarios disponibles para
// la fecha y barbero seleccionados
// =====================================================
async function loadAvailableSlots() {
  const barberId = document.getElementById('barberId').value;
  const appointmentDate = document.getElementById('appointmentDate').value;
  const timeSelect = document.getElementById('appointmentTime');
  
  // Si falta algún dato, deshabilitar el select de horas
  if (!barberId || !appointmentDate) {
    timeSelect.disabled = true;
    timeSelect.innerHTML = '<option value="">Primero selecciona fecha y barbero</option>';
    return;
  }
  
  try {
    // Obtener horarios disponibles del servidor
    const response = await fetch(
      `${API_URL}/appointments/available-slots?barberId=${barberId}&appointmentDate=${appointmentDate}`
    );
    const data = await response.json();
    availableSlots = data.availableSlots;
    
    // Limpiar opciones previas
    timeSelect.innerHTML = '<option value="">Selecciona una hora...</option>';
    
    // Si no hay horarios disponibles
    if (availableSlots.length === 0) {
      timeSelect.innerHTML = '<option value="">No hay horarios disponibles</option>';
      timeSelect.disabled = true;
      return;
    }
    
    // Agregar opciones de horarios
    availableSlots.forEach(slot => {
      const option = document.createElement('option');
      option.value = slot;
      option.textContent = slot;
      timeSelect.appendChild(option);
    });
    
    // Habilitar el select
    timeSelect.disabled = false;
  } catch (error) {
    console.error('Error cargando horarios:', error);
    showMessage('Error al cargar horarios disponibles', 'error');
    timeSelect.disabled = true;
  }
}

// =====================================================
// FUNCIÓN: submitForm(event)
// DESCRIPCIÓN: Maneja el envío del formulario
// y crea una nueva reserva
// =====================================================
async function submitForm(event) {
  event.preventDefault();
  
  // Obtener datos del formulario
  const formData = new FormData(document.getElementById('appointmentForm'));
  
  const appointmentData = {
    clientName: formData.get('clientName'),
    clientPhone: formData.get('clientPhone'),
    barberId: parseInt(formData.get('barberId')),
    serviceId: parseInt(formData.get('serviceId')),
    appointmentDate: formData.get('appointmentDate'),
    appointmentTime: formData.get('appointmentTime')
  };
  
  try {
    // Enviar datos al servidor
    const response = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(appointmentData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Mostrar mensaje de éxito
      showMessage(`✓ ¡Reserva creada exitosamente! ID: ${data.appointmentId}`, 'success');
      
      // Limpiar formulario
      document.getElementById('appointmentForm').reset();
      
      // Recargar servicios y barberos
      await loadServices();
      await loadBarbers();
    } else {
      // Mostrar mensaje de error
      showMessage(data.error || 'Error al crear la reserva', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showMessage('Error de conexión con el servidor', 'error');
  }
}

// =====================================================
// FUNCIÓN: showMessage(message, type)
// DESCRIPCIÓN: Muestra un mensaje temporal
// en la pantalla
// type puede ser: 'success', 'error', 'info'
// =====================================================
function showMessage(message, type = 'info') {
  const container = document.getElementById('messageContainer');
  
  // Crear elemento de mensaje
  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${type}`;
  messageDiv.textContent = message;
  
  // Agregar al contenedor
  container.innerHTML = '';
  container.appendChild(messageDiv);
  
  // Desaparecer después de 5 segundos
  setTimeout(() => {
    messageDiv.style.opacity = '0';
    setTimeout(() => messageDiv.remove(), 300);
  }, 5000);
}

// =====================================================
// INICIALIZACIÓN: Ejecutar cuando el DOM esté listo
// =====================================================
document.addEventListener('DOMContentLoaded', initForm);

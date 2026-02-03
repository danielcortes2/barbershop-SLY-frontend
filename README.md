# 💈 SLY Barbershop - Frontend

Frontend web moderno para barbería con sistema de gestión de citas integrado.

## 🚀 Características

- ✅ **Diseño responsive** - Adaptado a todos los dispositivos
- ✅ **Sistema de reservas** - Formulario de reserva integrado con la API
- ✅ **Gestión de citas** - Visualización y administración de todas las reservas
- ✅ **Filtros avanzados** - Filtrar citas por fecha y estado
- ✅ **Edición de citas** - Modificar o cancelar citas existentes
- ✅ **Integración con WhatsApp** - Compartir reservas por WhatsApp
- ✅ **Galería de trabajos** - Showcase de servicios
- ✅ **Sistema de reseñas** - Testimonios de clientes
- ✅ **Información del equipo** - Presentación de barberos

## 📋 Requisitos

- Node.js 16+ o npm
- Backend API corriendo en http://localhost:8000

## 🛠️ Instalación

```bash
cd barbershop-SLY-frontend
npm install
```

## ▶️ Ejecutar

```bash
npm start
```

El sitio estará disponible en http://localhost:3000

## 📁 Estructura

```
barbershop-SLY-frontend/
├── index.html           # Página principal
├── css/
│   └── styles.css      # Estilos personalizados
├── js/
│   └── main.js         # JavaScript principal + integración API
└── package.json        # Configuración npm
```

## 🔌 Integración con Backend

El frontend consume la API REST en http://localhost:8000/api

### Endpoints utilizados:

- `GET /api/reservas/` - Listar citas
- `GET /api/reservas/{id}` - Obtener cita por ID
- `POST /api/reservas/` - Crear nueva cita
- `PUT /api/reservas/{id}` - Actualizar cita
- `PATCH /api/reservas/{id}/cancelar` - Cancelar cita

### Configuración de la API

El archivo `js/main.js` contiene la configuración de la URL de la API:

```javascript
const API_URL = 'http://localhost:8000/api';
```

Para producción, actualiza esta URL con el dominio de tu servidor backend.

## 📝 Uso de la sección de Citas

### Ver todas las citas

1. Navega a la sección **"Appointments"** en el menú
2. Verás la lista completa de todas las citas registradas

### Filtrar citas

- **Por fecha**: Selecciona una fecha específica
- **Por estado**: Filtra por confirmadas o canceladas
- Click en "Apply Filters" para aplicar

### Editar una cita

1. Click en el botón "Edit" de la cita
2. Modifica los campos necesarios
3. Click en "Save Changes"

### Cancelar una cita

1. Click en el botón "Cancel" 
2. Confirma la cancelación
3. La cita cambiará a estado "Cancelled"

## 🎨 Personalización

### Cambiar colores

Edita las variables CSS en `css/styles.css`:

```css
:root {
    --color-primary: #c9a227;  /* Color dorado principal */
    --color-secondary: #1a1a1a; /* Color oscuro */
    /* ... más variables */
}
```

### Modificar horarios de atención

En `js/main.js`, busca la función que define los horarios disponibles.

## 🌐 Despliegue

### Opción 1: Vercel / Netlify

1. Sube el código a GitHub
2. Conecta tu repositorio a Vercel o Netlify
3. Configura las variables de entorno
4. Despliega

### Opción 2: Servidor tradicional

```bash
# Simplemente sube los archivos a tu servidor web
# Asegúrate de que el backend esté accesible desde el frontend
```

## 📱 Responsive Design

El sitio está optimizado para:
- 📱 Móviles (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large screens (1440px+)

## 🔒 Seguridad

- CORS configurado en el backend para permitir requests del frontend
- Validación de datos en formularios
- Sanitización de inputs

## 📄 Licencia

Privado - SLY Barbershop

---

**Desarrollado con ❤️ para SLY Barbershop**

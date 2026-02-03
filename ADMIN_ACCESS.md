# 🔐 SLY Barbershop - Admin Access

## Panel de Administración Privado

El panel de administración está ahora en una URL separada y protegido con contraseña para mantener la privacidad de las citas de los clientes.

### 📍 Acceso al Panel

**URL**: `http://localhost:3000/admin.html`

**Contraseña por defecto**: `sly2026`

### 🔒 Seguridad

- La sección de citas ha sido **eliminada del sitio público**
- Solo accesible mediante URL directa y autenticación
- La sesión se guarda durante la navegación
- Botón de logout para cerrar sesión

### ⚙️ Cambiar la Contraseña

**IMPORTANTE**: Cambia la contraseña antes de subir a producción

1. Abre el archivo: `js/admin.js`
2. Busca la línea 11:
   ```javascript
   const ADMIN_PASSWORD = 'sly2026'; // Cambiar en producción
   ```
3. Cámbiala por tu contraseña deseada:
   ```javascript
   const ADMIN_PASSWORD = 'tu_contraseña_segura_aquí';
   ```

### 🎯 Funcionalidades del Panel Admin

✅ **Estadísticas en tiempo real**
- Total de citas
- Citas confirmadas
- Citas canceladas

✅ **Gestión completa de citas**
- Ver todas las citas con detalles
- Editar información de citas
- Cancelar citas
- Eliminar citas permanentemente

✅ **Filtros avanzados**
- Filtrar por fecha específica
- Filtrar por estado (confirmada/cancelada)
- Paginación para múltiples registros

✅ **Actualización en tiempo real**
- Botón de refresh manual
- Sincronización automática con la API

### 🌐 URLs del Sistema

| Componente | URL |
|------------|-----|
| Sitio Público | http://localhost:3000 |
| Panel Admin | http://localhost:3000/admin.html |
| Backend API | http://localhost:8000 |
| Documentación API | http://localhost:8000/docs |

### 🔐 Mejoras de Seguridad Recomendadas (Producción)

1. **Autenticación JWT**
   - Implementar tokens de autenticación
   - Expiración de sesiones

2. **Hash de Contraseñas**
   - No almacenar contraseñas en texto plano
   - Usar bcrypt o similar

3. **HTTPS**
   - Certificado SSL válido
   - Forzar conexiones seguras

4. **Rate Limiting**
   - Limitar intentos de login
   - Prevenir ataques de fuerza bruta

5. **Backend Authentication**
   - Proteger endpoints de la API
   - Validar tokens en cada request

### 📱 Responsive

El panel de administración es completamente responsive y funciona en:
- 💻 Desktop
- 📱 Tablet
- 📱 Móvil

### 🚀 Uso Diario

1. Abre `admin.html` en tu navegador
2. Ingresa la contraseña
3. Gestiona las citas de tus clientes
4. Usa filtros para encontrar citas específicas
5. Haz logout al terminar

---

**Nota**: Esta es una autenticación básica para ambiente de desarrollo. Para producción, implementa un sistema de autenticación más robusto con backend.

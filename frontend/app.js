// Estado global
let currentUser = null;
let isLoggedIn = false;

// URLs base
const API_BASE = 'https://veterinaria-ivocedron-506160926608.europe-west1.run.app';

// Elementos del DOM
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('[data-tab]');
const logoutBtn = document.querySelector('.btn-logout');

// Variables para alertas y timers
let alertTimeout;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  loadServicios();
  lockTabs();
});

/**
 * Inicializa todos los event listeners
 */
function initializeEventListeners() {
  // Navegación
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabName = link.dataset.tab;
      switchTab(tabName);
    });
  });

  // Logout
  logoutBtn.addEventListener('click', logout);

  // Formularios
  document.querySelector('.saludo-form').addEventListener('submit', handleSaludo);
  document.querySelector('#form-registro').addEventListener('submit', handleRegistro);
  document.querySelector('#form-login').addEventListener('submit', handleLogin);
  document.querySelector('#form-agregar-servicio').addEventListener('submit', handleAgregarServicio);
  document.querySelector('#form-registrar-mascota').addEventListener('submit', handleRegistrarMascota);
  document.querySelector('#btn-buscar-mascotas').addEventListener('click', handleBuscarMascotas);
  document.querySelector('#btn-generar-reporte').addEventListener('click', handleGenerarReporte);
}

/**
 * Cambia la sección activa (tab)
 */
function switchTab(tabName) {
  // Verificar si el tab está protegido
  const protectedTabs = ['servicios', 'mascotas', 'reporte'];

  if (protectedTabs.includes(tabName) && !isLoggedIn) {
    showAlert('Debes iniciar sesión para acceder a esta sección', 'error');
    switchTab('acceso');
    return;
  }

  // Remover clase active de todas las secciones
  sections.forEach(section => section.classList.remove('active'));

  // Agregar clase active a la sección seleccionada
  const selectedSection = document.getElementById(tabName);
  if (selectedSection) {
    selectedSection.classList.add('active');
  }

  // Actualizar navegación
  navLinks.forEach(link => {
    if (link.dataset.tab === tabName) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Pre-llenar correo en reporte si el usuario está logueado
  if (tabName === 'reporte' && currentUser) {
    document.querySelector('#reporte-correo').value = currentUser;
  }
}

/**
 * Maneja el login del usuario
 */
async function handleLogin(e) {
  e.preventDefault();
  const correo = document.querySelector('#login-correo').value;
  const contraseña = document.querySelector('#login-contraseña').value;

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contraseña })
    });

    const data = await response.json();

    if (response.ok && data.acceso) {
      isLoggedIn = true;
      currentUser = correo;
      updateUserBadge();
      unlockTabs();
      showAlert('Login exitoso', 'success');
      document.querySelector('#form-login').reset();
      switchTab('inicio');
    } else {
      showAlert('Credenciales inválidas', 'error');
    }
  } catch (error) {
    showAlert('Error al iniciar sesión', 'error');
    console.error(error);
  }
}

/**
 * Maneja el registro del usuario
 */
async function handleRegistro(e) {
  e.preventDefault();
  const correo = document.querySelector('#registro-correo').value;
  const contraseña = document.querySelector('#registro-contraseña').value;

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contraseña })
    });

    const data = await response.json();

    if (response.ok) {
      showAlert('Registro exitoso. Ahora inicia sesión', 'success');
      document.querySelector('#form-registro').reset();
      // Pre-llenar correo en login
      document.querySelector('#login-correo').value = correo;
    } else {
      showAlert('Error al registrarse', 'error');
    }
  } catch (error) {
    showAlert('Error al registrarse', 'error');
    console.error(error);
  }
}

/**
 * Cierra la sesión del usuario
 */
function logout() {
  isLoggedIn = false;
  currentUser = null;
  lockTabs();
  updateUserBadge();
  showAlert('Sesión cerrada', 'success');
  switchTab('acceso');
  document.querySelector('#form-login').reset();
  document.querySelector('#form-registro').reset();
}

/**
 * Actualiza el badge de usuario en el sidebar
 */
function updateUserBadge() {
  const badge = document.querySelector('.user-badge span');
  if (isLoggedIn && currentUser) {
    badge.textContent = `Usuario: ${currentUser}`;
  } else {
    badge.textContent = 'Usuario: Invitado';
  }
}

/**
 * Desbloquea los tabs protegidos
 */
function unlockTabs() {
  const protectedTabs = ['servicios', 'mascotas', 'reporte'];
  navLinks.forEach(link => {
    if (protectedTabs.includes(link.dataset.tab)) {
      link.classList.remove('locked');
    }
  });
}

/**
 * Bloquea los tabs protegidos
 */
function lockTabs() {
  const protectedTabs = ['servicios', 'mascotas', 'reporte'];
  navLinks.forEach(link => {
    if (protectedTabs.includes(link.dataset.tab)) {
      link.classList.add('locked');
    }
  });
}

/**
 * Maneja el formulario de saludo
 */
async function handleSaludo(e) {
  e.preventDefault();
  const nombre = document.querySelector('#input-nombre').value;

  try {
    const response = await fetch(`${API_BASE}/bienvenido/${nombre}`, {
      method: 'GET'
    });

    const data = await response.json();

    if (response.ok) {
      showAlert(data.mensaje, 'success');
      document.querySelector('.saludo-form').reset();
    }
  } catch (error) {
    showAlert('Error al saludar', 'error');
    console.error(error);
  }
}

/**
 * Carga y muestra los servicios disponibles
 */
async function loadServicios() {
  try {
    const response = await fetch(`${API_BASE}/servicios`);
    const data = await response.json();

    if (response.ok) {
      // Cargar en lista de servicios
      renderizarServicios(data.servicios);

      // Cargar en select del formulario de mascotas
      const select = document.querySelector('#mascota-servicio');
      select.innerHTML = '<option value="">Seleccionar servicio</option>';
      data.servicios.forEach(servicio => {
        const option = document.createElement('option');
        option.value = servicio.nombre;
        option.textContent = `${servicio.nombre} - $${servicio.precio}`;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error al cargar servicios:', error);
  }
}

/**
 * Renderiza la lista de servicios
 */
function renderizarServicios(servicios) {
  const list = document.querySelector('#lista-servicios');
  list.innerHTML = '';

  servicios.forEach(servicio => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${servicio.nombre}</strong>
      </div>
      <div><strong>$${servicio.precio}</strong></div>
    `;
    list.appendChild(li);
  });
}

/**
 * Maneja la adición de un nuevo servicio
 */
async function handleAgregarServicio(e) {
  e.preventDefault();
  const nombre = document.querySelector('#servicio-nombre').value;
  const precio = parseFloat(document.querySelector('#servicio-precio').value);

  try {
    const response = await fetch(`${API_BASE}/servicios/agregar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, precio })
    });

    const data = await response.json();

    if (response.ok) {
      showAlert('Servicio agregado correctamente', 'success');
      document.querySelector('#form-agregar-servicio').reset();
      loadServicios();
    } else {
      showAlert('Error al agregar servicio', 'error');
    }
  } catch (error) {
    showAlert('Error al agregar servicio', 'error');
    console.error(error);
  }
}

/**
 * Maneja el registro de una mascota
 */
async function handleRegistrarMascota(e) {
  e.preventDefault();
  const correo = document.querySelector('#mascota-correo').value;
  const nombre_mascota = document.querySelector('#mascota-nombre').value;
  const tipo_servicio = document.querySelector('#mascota-servicio').value;
  const fecha = document.querySelector('#mascota-fecha').value;

  try {
    const response = await fetch(`${API_BASE}/servicios/registrar-mascota`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, nombre_mascota, tipo_servicio, fecha })
    });

    const data = await response.json();

    if (response.ok) {
      showAlert('Mascota registrada correctamente', 'success');
      document.querySelector('#form-registrar-mascota').reset();
    } else {
      showAlert('Error al registrar mascota', 'error');
    }
  } catch (error) {
    showAlert('Error al registrar mascota', 'error');
    console.error(error);
  }
}

/**
 * Busca y muestra las mascotas de un usuario
 */
async function handleBuscarMascotas() {
  const correo = document.querySelector('#buscar-correo').value;

  if (!correo) {
    showAlert('Ingresa un correo', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/servicios/mascotas/${correo}`);
    const data = await response.json();

    if (response.ok && data.mascotas.length > 0) {
      renderizarMascotas(data.mascotas);
      showAlert(`Se encontraron ${data.mascotas.length} mascota(s)`, 'success');
    } else {
      showAlert('No se encontraron mascotas para este correo', 'error');
    }
  } catch (error) {
    showAlert('Error al buscar mascotas', 'error');
    console.error(error);
  }
}

/**
 * Renderiza las mascotas como cards
 */
function renderizarMascotas(mascotas) {
  const buscadorContainer = document.querySelector('.buscador-mascotas');

  // Remover resultados anteriores
  let resultadosDiv = buscadorContainer.querySelector('.mascotas-resultados');
  if (resultadosDiv) {
    resultadosDiv.remove();
  }

  // Crear nuevo contenedor de resultados
  resultadosDiv = document.createElement('div');
  resultadosDiv.className = 'mascotas-resultados';

  mascotas.forEach(mascota => {
    const card = document.createElement('div');
    card.className = 'mascota-card';
    card.innerHTML = `
      <h4>${mascota.nombre_mascota}</h4>
      <p><strong>Correo:</strong> ${mascota.correo}</p>
      <p><strong>Servicio:</strong> ${mascota.tipo_servicio}</p>
      <p><strong>Fecha:</strong> ${mascota.fecha}</p>
    `;
    resultadosDiv.appendChild(card);
  });

  buscadorContainer.appendChild(resultadosDiv);
}

/**
 * Genera y muestra el reporte de un usuario
 */
async function handleGenerarReporte() {
  const correo = document.querySelector('#reporte-correo').value;

  if (!correo) {
    showAlert('Ingresa un correo', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/servicios/reporte/${correo}`);
    const data = await response.json();

    if (response.ok) {
      renderizarReporte(data);
      showAlert('Reporte generado correctamente', 'success');
    } else {
      showAlert('No se encontró reporte para este correo', 'error');
    }
  } catch (error) {
    showAlert('Error al generar reporte', 'error');
    console.error(error);
  }
}

/**
 * Renderiza el reporte como stat-boxes y servicios utilizados
 */
function renderizarReporte(data) {
  const area = document.querySelector('#area-resultados');

  // Crear tags de servicios
  let serviciosTags = '';
  if (data.servicios_registrados && typeof data.servicios_registrados === 'object') {
    for (const servicio in data.servicios_registrados) {
      const cantidad = data.servicios_registrados[servicio].cantidad || 1;
      serviciosTags += `<span class="tag">${servicio} (${cantidad}x)</span>`;
    }
  }

  const html = `
    <div class="reporte-stats">
      <div class="stat-box">
        <h4>Correo del Usuario</h4>
        <p>${data.correo}</p>
      </div>
      <div class="stat-box">
        <h4>Total de Servicios</h4>
        <p>${data.cantidad_servicios_total}</p>
      </div>
      <div class="stat-box">
        <h4>Gasto Total</h4>
        <p>$${data.gasto_total}</p>
      </div>
    </div>
    <div class="servicios-tags">
      <h4>Servicios utilizados:</h4>
      <div class="tags-container">
        ${serviciosTags || '<p>No hay servicios registrados</p>'}
      </div>
    </div>
  `;

  area.innerHTML = html;
}

/**
 * Muestra una alerta temporal
 */
function showAlert(message, type = 'success') {
  // Crear elemento de alerta
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  alert.style.position = 'fixed';
  alert.style.top = '20px';
  alert.style.right = '20px';
  alert.style.zIndex = '2000';
  alert.style.maxWidth = '400px';

  // Insertar en el DOM
  document.body.appendChild(alert);

  // Auto-remover después de 3 segundos
  if (alertTimeout) clearTimeout(alertTimeout);
  alertTimeout = setTimeout(() => {
    alert.remove();
  }, 3000);
}
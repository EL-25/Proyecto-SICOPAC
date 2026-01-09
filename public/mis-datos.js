// ==============================
// mis-datos.js
// ==============================

// Al cargar la página, obtener los datos del usuario autenticado
document.addEventListener("DOMContentLoaded", cargarDatosUsuario);

// ==============================
// Funciones principales
// ==============================

async function cargarDatosUsuario() {
  const usuario = localStorage.getItem("usuarioActivo");

  if (!usuario) {
    mostrarModal("Sesión no activa", "Por favor inicia sesión para continuar.");
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch("https://proyecto-sicopac-production.up.railway.app/api/mis-datos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario })
    });

    if (!response.ok) throw new Error("No se pudo obtener los datos del usuario");

    const datos = await response.json();
    renderizarPerfil(datos);

    if (datos.rol === "Administrador") {
      mostrarBotonAdmin();
    }

  } catch (error) {
    console.error("❌ Error al cargar los datos:", error);
    mostrarModal("Error", "No se pudieron cargar los datos del usuario.");
  }
}

function renderizarPerfil(datos) {
  document.getElementById("campo-usuario").textContent = datos.usuario || "No disponible";
  document.getElementById("campo-correo").textContent = datos.correo || "No disponible";
  document.getElementById("campo-rol").textContent = datos.rol || "No disponible";

  const firmaImg = document.getElementById("firma-img");
  if (datos.firma && datos.firma.trim() !== "") {
    const firmaURL = `https://proyecto-sicopac-production.up.railway.app/img/firma/${encodeURIComponent(datos.firma)}`;
    firmaImg.src = firmaURL;
    firmaImg.alt = `Firma de ${datos.usuario}`;
    firmaImg.style.display = "block";
  } else {
    firmaImg.style.display = "none";
  }
}

function mostrarBotonAdmin() {
  const contenedor = document.getElementById("botonAdminHeader");
  if (contenedor) {
    const btn = document.createElement("button");
    btn.textContent = "Agregar usuario";
    btn.className = "btn-verde-header";
    btn.onclick = () => window.location.href = "agregar-usuario.html";
    contenedor.appendChild(btn);
  }
}

// ==============================
// Funciones auxiliares
// ==============================

function cerrarSesion() {
  localStorage.removeItem("usuarioActivo");
  window.location.href = "login.html";
}

function mostrarPerfil() {
  const perfil = document.getElementById("perfilDatos");
  perfil.style.display = perfil.style.display === "none" ? "block" : "none";
}

function registrarAccesoFormulario() {
  const usuario = localStorage.getItem("usuarioActivo");
  if (!usuario) {
    mostrarModal("Sesión no activa", "Por favor inicia sesión.");
    window.location.href = "login.html";
    return;
  }

  mostrarOverlay("Dirigiendo al Formulario Único de Solicitud…");
  setTimeout(() => {
    window.location.href = `/formulario?usuario=${usuario}`;
  }, 1500);
}

function registrarAccesoReportes() {
  const usuario = localStorage.getItem("usuarioActivo");
  if (!usuario) {
    mostrarModal("Sesión no activa", "Por favor inicia sesión.");
    window.location.href = "login.html";
    return;
  }

  mostrarOverlay("Cargando formularios recientes…");
  setTimeout(() => {
    window.location.href = "formulario.html";
  }, 1500);
}

function mostrarOverlay(mensaje) {
  const overlay = document.getElementById("overlay");
  if (overlay) {
    overlay.querySelector("p").textContent = mensaje;
    overlay.style.display = "flex";
  }
}

// ==============================
// Función para activar edición de perfil
// ==============================
function activarEdicion() {
  const perfil = document.getElementById("perfilDatos");

  perfil.innerHTML = `
    <form id="formEditarUsuario" class="form-edicion">
      <h3 class="titulo-edicion"><i class="fas fa-user-edit"></i> Edición de Perfil</h3>

      <div class="grupo-campo">
        <label>Usuario</label>
        <input type="text" name="usuario" value="${document.getElementById("campo-usuario").textContent}" required />
      </div>

      <div class="grupo-campo">
        <label>Correo institucional</label>
        <input type="email" name="correo" value="${document.getElementById("campo-correo").textContent}" required />
      </div>

      <div class="grupo-campo">
        <label>Rol</label>
        <input type="text" name="rol" value="${document.getElementById("campo-rol").textContent}" required />
      </div>

      <div class="grupo-campo">
        <label>Firma digital</label>
        <input type="file" name="firma" accept="image/*" />
      </div>

      <button type="submit" class="btn-guardar">
        <i class="fas fa-save"></i> Guardar cambios
      </button>
    </form>
  `;

  document.getElementById("formEditarUsuario").addEventListener("submit", guardarCambiosUsuario);
}

async function guardarCambiosUsuario(e) {
  e.preventDefault();
  const formData = new FormData(this);

  mostrarOverlay("Guardando cambios…");

  try {
    const response = await fetch("https://proyecto-sicopac-production.up.railway.app/api/actualizar-usuario", {
      method: "POST",
      body: formData
    });

    if (response.ok) {
      const data = await response.json();
      console.info("✅ Usuario actualizado:", data);

      mostrarModal("Datos actualizados", data.mensaje || "Los datos se guardaron correctamente.");
    } else {
      mostrarModal("Error", "No se pudo actualizar el usuario.");
    }
  } catch (error) {
    console.error("❌ Error en fetch:", error);
    mostrarModal("Error de conexión", "No se pudo conectar con el servidor.");
  } finally {
    const overlay = document.getElementById("overlay");
    if (overlay) overlay.style.display = "none";
  }
}

// ==============================
// Modal institucional
// ==============================
function mostrarModal(titulo, mensaje) {
  document.getElementById("modalTitulo").textContent = titulo;
  document.getElementById("modalMensaje").textContent = mensaje;
  document.getElementById("modalConfirmacion").style.display = "flex";
}

function cerrarModal() {
  document.getElementById("modalConfirmacion").style.display = "none";
}

function aceptarModal() {
  document.getElementById("modalConfirmacion").style.display = "none";
  window.location.reload(); // recargar para ver datos actualizados
}

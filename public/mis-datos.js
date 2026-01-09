// ==============================
// mis-datos.js
// ==============================

// Al cargar la página, obtener los datos del usuario autenticado
document.addEventListener("DOMContentLoaded", async () => {
  const usuario = localStorage.getItem("usuarioActivo");

  if (!usuario) {
    alert("No hay sesión activa. Por favor inicia sesión.");
    window.location.href = "login.html";
    return;
  }

  try {
    // Obtener datos del usuario desde Railway
    const response = await fetch("https://proyecto-sicopac-production.up.railway.app/api/mis-datos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario }) // 👈 en minúscula
    });

    if (!response.ok) throw new Error("No se pudo obtener los datos del usuario");

    const datos = await response.json();

    // Insertar los datos en los campos correspondientes
    document.getElementById("campo-usuario").textContent = datos.usuario || "No disponible";
    document.getElementById("campo-correo").textContent = datos.correo || "No disponible";
    document.getElementById("campo-rol").textContent = datos.rol || "No disponible";

    // Mostrar firma digital si existe
    const firmaImg = document.getElementById("firma-img");
    console.log("📦 Datos completos recibidos:", datos); // Ver todo el objeto
    console.log("🖋️ Firma recibida:", datos.firma); // Ver solo el campo firma

    if (datos.firma && datos.firma.trim() !== "") {
      const firmaURL = `https://proyecto-sicopac-production.up.railway.app/img/firma/${encodeURIComponent(datos.firma)}`;
      console.log("🌐 URL final de la firma:", firmaURL); // Ver la URL que se asigna

      firmaImg.src = firmaURL;
      firmaImg.alt = `Firma de ${datos.usuario}`;
      firmaImg.style.display = "block";
    } else {
      firmaImg.style.display = "none";
    }

    // Mostrar botón solo si el rol es Administrador (en header)
    if (datos.rol === "Administrador") {
      const contenedor = document.getElementById("botonAdminHeader");
      if (contenedor) {
        const btn = document.createElement("button");
        btn.textContent = "Agregar usuario";
        btn.className = "btn-verde-header";
        btn.onclick = () => window.location.href = "agregar-usuario.html";
        contenedor.appendChild(btn);
      }
    }

  } catch (error) {
    console.error("Error al cargar los datos:", error);
    alert("Error al cargar los datos del usuario");
  }
});

// ==============================
// Funciones auxiliares
// ==============================

// Cerrar sesión
function cerrarSesion() {
  localStorage.removeItem("usuarioActivo");
  window.location.href = "login.html";
}

// Mostrar/ocultar el panel de perfil
function mostrarPerfil() {
  const perfil = document.getElementById("perfilDatos");
  perfil.style.display = perfil.style.display === "none" ? "block" : "none";
}

// Redirección al formulario con overlay emergente
function registrarAccesoFormulario() {
  const usuario = localStorage.getItem("usuarioActivo");
  if (!usuario) {
    alert("No hay sesión activa.");
    window.location.href = "login.html";
    return;
  }

  const overlay = document.getElementById("overlay");
  if (overlay) {
    overlay.querySelector("p").textContent = "Dirigiendo al Formulario Único de Solicitud…";
    overlay.style.display = "flex";
  }

  setTimeout(() => {
    window.location.href = `/formulario?usuario=${usuario}`;
  }, 1500);
}

// Redirección a reportes con overlay emergente
function registrarAccesoReportes() {
  const usuario = localStorage.getItem("usuarioActivo");
  if (!usuario) {
    alert("No hay sesión activa.");
    window.location.href = "login.html";
    return;
  }

  const overlay = document.getElementById("overlay");
  if (overlay) {
    overlay.querySelector("p").textContent = "Cargando formularios recientes…";
    overlay.style.display = "flex";
  }

  setTimeout(() => {
    window.location.href = "formulario.html";
  }, 1500);ow.location.reload();
}

// ==============================
// Función para activar edición de perfil
// ==============================
function activarEdicion() {
  const perfil = document.getElementById("perfilDatos");

  // Reemplazar contenido por formulario editable
  perfil.innerHTML = `
    <form id="formEditarUsuario">
      <label>Usuario</label>
      <input type="text" name="usuario" value="${document.getElementById("campo-usuario").textContent}" required />

      <label>Correo institucional</label>
      <input type="email" name="correo" value="${document.getElementById("campo-correo").textContent}" required />

      <label>Rol</label>
      <input type="text" name="rol" value="${document.getElementById("campo-rol").textContent}" required />

      <label>Firma digital</label>
      <input type="file" name="firma" accept="image/*" />

      <button type="submit" class="btn-editar">
        <i class="fas fa-save"></i> Guardar cambios
      </button>
    </form>
  `;

  // Enviar datos al backend
  document.getElementById("formEditarUsuario").addEventListener("submit", async function(e) {
    e.preventDefault();
    const formData = new FormData(this);

    try {
      const response = await fetch("https://proyecto-sicopac-production.up.railway.app/api/actualizar-usuario", {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.mensaje || "Datos actualizados correctamente");
        // Opcional: recargar la página para mostrar los datos actualizados
        window.location.reload();
      } else {
        alert("Error al actualizar usuario");
      }
    } catch (error) {
      console.error("Error en fetch:", error);
      alert("Error de conexión con el servidor");
    }
  });
}

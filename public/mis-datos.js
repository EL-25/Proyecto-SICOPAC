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
      body: JSON.stringify({ usuario })
    });

    if (!response.ok) throw new Error("No se pudo obtener los datos del usuario");

    const datos = await response.json();

    // Insertar los datos en los campos correspondientes
    document.getElementById("campo-usuario").textContent = datos.usuario || "No disponible";
    document.getElementById("campo-correo").textContent = datos.correo || "No disponible";
    document.getElementById("campo-rol").textContent = datos.rol || "No disponible";

    // Mostrar firma digital si existe
    const firmaImg = document.getElementById("firma-img");
    if (datos.firma && datos.firma.trim() !== "") {
      const firmaURL = `https://proyecto-sicopac-production.up.railway.app/img/firma/${encodeURIComponent(datos.firma)}`;
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
  }, 1500);
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
        <label>Usuario actual</label>
        <input type="text" name="usuario" value="${document.getElementById("campo-usuario").textContent}" readonly />
      </div>

      <div class="grupo-campo">
        <label>Nuevo usuario</label>
        <input type="text" name="nuevoUsuario" placeholder="Ingrese nuevo usuario" />
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
        <label>Clave</label>
        <input type="password" name="clave" placeholder="Ingrese nueva clave" required />
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

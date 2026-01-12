// Mostrar nombre completo al cargar la página
document.addEventListener("DOMContentLoaded", async () => {
  const usuario = localStorage.getItem("usuarioPendiente") || localStorage.getItem("usuarioActivo");
  if (!usuario) return;

  try {
    const response = await fetch("https://proyecto-sicopac-production.up.railway.app/api/mis-datos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario })
    });

    const data = await response.json();

    // Mostrar saludo personalizado con nombre completo
    const saludo = document.createElement("p");
    saludo.textContent = `Hola ${data.nombre}, ahora cree su contraseña para acceder al sistema.`;
    saludo.style.fontWeight = "bold";
    saludo.style.color = "#005baa";

    const formulario = document.querySelector(".formulario-clave");
    formulario.insertBefore(saludo, formulario.children[2]);
  } catch (err) {
    console.error("No se pudo obtener el nombre:", err);
  }

  // Activar checklist dinámico
  const input = document.getElementById("nuevaClave");
  const toggleBtn = document.querySelector(".toggle-visibility i");

  const reqs = {
    length: document.getElementById("req-length"),
    upper: document.getElementById("req-upper"),
    lower: document.getElementById("req-lower"),
    number: document.getElementById("req-number"),
    special: document.getElementById("req-special"),
  };

  input.addEventListener("input", () => {
    const val = input.value;

    const checks = {
      length: val.length >= 8,
      upper: /[A-Z]/.test(val),
      lower: /[a-z]/.test(val),
      number: /[0-9]/.test(val),
      special: /[!@#$%&*?]/.test(val),
    };

    actualizarReq(reqs.length, checks.length);
    actualizarReq(reqs.upper, checks.upper);
    actualizarReq(reqs.lower, checks.lower);
    actualizarReq(reqs.number, checks.number);
    actualizarReq(reqs.special, checks.special);

    Object.entries(checks).forEach(([key, ok]) => {
      const el = reqs[key];
      const icon = el.querySelector("i");
      icon.className = ok ? "fas fa-check-circle" : "fas fa-circle";
    });
  });

  // Toggle visibilidad contraseña
  document.querySelector(".toggle-visibility").addEventListener("click", () => {
    const isPassword = input.getAttribute("type") === "password";
    input.setAttribute("type", isPassword ? "text" : "password");
    toggleBtn.className = isPassword ? "fas fa-eye-slash" : "fas fa-eye";
  });
});

function actualizarReq(el, ok) {
  if (!el) return;
  el.classList.toggle("cumplido", ok);
}

// Función para crear la contraseña
async function crearClave() {
  const usuario = localStorage.getItem("usuarioPendiente") || localStorage.getItem("usuarioActivo");
  const nuevaClave = document.getElementById("nuevaClave").value.trim();

  if (!usuario || !nuevaClave) {
    mostrarModalErrorClave("Por favor, completa ambos campos.");
    return;
  }

  // Validación moderna
  const valida =
    nuevaClave.length >= 8 &&
    /[A-Z]/.test(nuevaClave) &&
    /[a-z]/.test(nuevaClave) &&
    /[0-9]/.test(nuevaClave) &&
    /[!@#$%&*?]/.test(nuevaClave);

  if (!valida) {
    mostrarModalErrorClave("La contraseña debe tener mínimo 8 caracteres, incluir mayúscula, minúscula, número y símbolo.");
    return;
  }

  const boton = document.getElementById("btnGuardar");
  boton.disabled = true;
  boton.textContent = "Guardando...";

  try {
    const response = await fetch("https://proyecto-sicopac-production.up.railway.app/api/crear-clave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, nuevaClave })
    });

    const resultado = await response.json();
    const mensaje = resultado.mensaje || "Contraseña creada exitosamente";

    if (response.ok) {
      // Sincronizar localStorage para el panel
      localStorage.setItem("usuarioCreado", usuario);
      localStorage.setItem("usuarioActivo", usuario);

      // Mostrar modal de éxito
      mostrarModalExitoClave(mensaje);
    } else {
      mostrarModalErrorClave("Error: " + mensaje);
    }
  } catch (error) {
    console.error("Error de conexión:", error);
    mostrarModalErrorClave("No se pudo conectar con el servidor.");
  } finally {
    boton.disabled = false;
    boton.textContent = "Guardar contraseña";
  }
}

// Mostrar modal de error
function mostrarModalErrorClave(mensaje) {
  const modal = document.getElementById("modalErrorClave");
  const texto = modal.querySelector("p");
  texto.textContent = mensaje;
  modal.style.display = "flex";
}

function cerrarModalError() {
  document.getElementById("modalErrorClave").style.display = "none";
}

// Mostrar modal de éxito
function mostrarModalExitoClave(mensaje) {
  const modal = document.getElementById("modalExitoClave");
  const texto = modal.querySelector("p");
  texto.textContent = mensaje;
  modal.style.display = "flex";
}

function cerrarModalExito() {
  document.getElementById("modalExitoClave").style.display = "none";
}

// Mostrar modal de acceso autorizado
function mostrarModalAccesoAutorizado(nombreUsuario) {
  const modal = document.getElementById("modalAccesoAutorizado");
  const mensaje = document.getElementById("mensajeBienvenida");
  mensaje.textContent = `Bienvenido ${nombreUsuario}, en breve accederá al sistema institucional.`;
  modal.style.display = "flex";

  // Redirigir automáticamente después de 2.5 segundos
  setTimeout(() => {
    window.location.href = "login.html";
  }, 2500);
}

// Activar acceso autorizado desde el botón del modal de éxito
function continuarFlujoAcceso() {
  cerrarModalExito();
  const usuario = localStorage.getItem("usuarioActivo");
  mostrarModalAccesoAutorizado(usuario);
}

function redirigirAlSistema() {
  window.location.href = "login.html";
}

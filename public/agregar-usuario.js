document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registroForm");
  const mensajeError = document.getElementById("mensajeError");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Ocultar error previo
    if (mensajeError) mensajeError.style.display = "none";

    // Generar fecha y hora actual en formato ISO completo
    const ahora = new Date();
    const fechaHoraIngreso = ahora.toISOString();
    const formData = new FormData(form);
    formData.append("fechaIngreso", fechaHoraIngreso);

    // NUEVO: agregar el administrador creador 
    const usuarioLogueado = localStorage.getItem("usuarioActivo"); 
    formData.append("creadoPor", usuarioLogueado);

    const usuario = formData.get("usuario");
    const correo = formData.get("correo");

    // Validación de correo institucional
    if (!correo.includes("@") || !correo.includes(".")) {
      mostrarError("El correo institucional debe contener '@' y un dominio válido.");
      return;
    }

    // Validación previa: verificar si el usuario ya existe
    try {
      const existeResponse = await fetch("https://proyecto-sicopac-production.up.railway.app/api/verificar-usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario })
      });

      const existeResultado = await existeResponse.json();
      if (existeResultado.existe) {
        mostrarError("⚠️ El usuario ya está registrado. Usa otro nombre de usuario.");
        return;
      }
    } catch (verificacionError) {
      console.error("⚠️ Error al verificar existencia del usuario:", verificacionError);
      mostrarError("No se pudo verificar si el usuario existe. Intenta más tarde.");
      return;
    }

    // Verificar contenido del FormData antes de enviar (debug)
    console.log("📤 Enviando datos al servidor...");
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: archivo seleccionado -`, value.name);
      } else {
        console.log(`${key}:`, value);
      }
    }

    try {
      const response = await fetch("https://proyecto-sicopac-production.up.railway.app/api/agregar-usuario", {
        method: "POST",
        body: formData
      });

      console.log("📦 Respuesta recibida del servidor:", response);

      const contentType = response.headers.get("content-type");
      console.log("🧾 Content-Type recibido:", contentType);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error recibido:", errorText);
        mostrarError("Error al registrar usuario: " + errorText);
        return;
      }

      // Interpretar respuesta
      let mensaje = "Usuario registrado exitosamente";
      try {
        const resultado = await response.json();
        console.log("✅ Resultado interpretado como JSON:", resultado);
        mensaje = resultado.mensaje || mensaje;
      } catch (jsonError) {
        console.warn("⚠️ No se pudo interpretar como JSON. Usando mensaje por defecto.");
      }

      // Guardar usuario en localStorage
      localStorage.setItem("usuarioPendiente", usuario);
      localStorage.setItem("usuarioActivo", usuario);

      // Mostrar modal institucional
      mostrarModalConfirmacion();
    } catch (err) {
      console.error("❌ Error en el registro:", err);
      mostrarError("Error en el servidor. Intenta más tarde.");
    }
  });
});

// Función para mostrar errores elegantes
function mostrarError(mensaje) {
  const mensajeError = document.getElementById("mensajeError");
  if (mensajeError) {
    mensajeError.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${mensaje}`;
    mensajeError.style.display = "flex";
  }
}

// Funciones del modal
function mostrarModalConfirmacion() {
  const modal = document.getElementById("modalConfirmacion");
  if (modal) modal.style.display = "flex";
}

function redirigirCrearClave() {
  window.location.href = "/crear-clave.html";
}

function cerrarModal() {
  const modal = document.getElementById("modalConfirmacion");
  if (modal) modal.style.display = "none";
}

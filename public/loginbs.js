document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  // Capturar valores del formulario
  const Usuario = document.getElementById('username').value.trim();
  const Clave = document.getElementById('password').value.trim();

  // Referencia al contenedor de error
  const mensajeError = document.getElementById('mensajeError');

  // Ocultar error previo
  if (mensajeError) {
    mensajeError.style.display = "none";
  }

  try {
    // Enviar datos al backend
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Usuario, Clave })
    });

    let resultado;
    try {
      resultado = await response.json();
    } catch (err) {
      const textoPlano = await response.text();
      if (mensajeError) {
        mensajeError.innerHTML = `<i class="fas fa-exclamation-circle"></i> Error inesperado: ${textoPlano}`;
        mensajeError.style.display = "flex";
      }
      console.warn("Respuesta no es JSON:", textoPlano);
      return;
    }

    if (response.ok) {
      // Guardar usuario y rol en localStorage
      localStorage.setItem("usuarioActivo", Usuario);
      localStorage.setItem("rolActivo", resultado.rol);

      // Mostrar modal institucional con rol
      mostrarModal(resultado.rol);
    } else {
      if (mensajeError) {
        mensajeError.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${resultado.error || 'Usuario o contraseña incorrectos'}`;
        mensajeError.style.display = "flex";
      }
    }
  } catch (error) {
    if (mensajeError) {
      mensajeError.innerHTML = `<i class="fas fa-exclamation-circle"></i> Error de conexión con el servidor`;
      mensajeError.style.display = "flex";
    }
    console.error(error);
  }
});

// Modal institucional de bienvenida con rol dinámico
function mostrarModal(rol) {
  const modal = document.getElementById("bienvenidaModal");
  const mensaje = document.getElementById("mensajeBienvenida");

  if (modal && mensaje) {
    mensaje.textContent = `Bienvenido ${rol}`;
    modal.style.display = "flex";
  } else {
    console.warn("Modal o mensaje no encontrado en el DOM.");
  }
}

// Redirección al formulario con usuario activo
function redirigir() {
  window.location.href = "mis-datos.html";
}

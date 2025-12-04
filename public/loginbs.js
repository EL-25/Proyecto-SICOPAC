document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  // Capturar valores del formulario
  const Usuario = document.getElementById('username').value;
  const Clave = document.getElementById('password').value;

  try {
    // Enviar datos al backend
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ Usuario, Clave })
    });

    let resultado;
    try {
      resultado = await response.json();
    } catch (err) {
      const textoPlano = await response.text();
      alert(`Error inesperado: ${textoPlano}`);
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
      alert(`Error: ${resultado.error || 'Usuario o contraseña incorrectos'}`);
    }
  } catch (error) {
    alert('Error de conexión con el servidor');
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
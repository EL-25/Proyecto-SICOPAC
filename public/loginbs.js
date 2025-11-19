document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const usuario = document.getElementById('username').value;
  const clave = document.getElementById('password').value;

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ usuario, clave })
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
      // Guardar el usuario autenticado para uso posterior
      localStorage.setItem("usuarioActivo", usuario);
      localStorage.setItem("rolActivo", resultado.rol);

      // Mostrar el modal institucional con rol
      mostrarModal(resultado.rol);
    } else {
      alert(`Error: ${resultado.error || 'Error desconocido'}`); // Usuario no encontrado o contraseña incorrecta
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

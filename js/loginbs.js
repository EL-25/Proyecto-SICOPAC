document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const usuario = document.getElementById('username').value;
  const clave = document.getElementById('password').value;

  try {
    const response = await fetch('http://127.0.0.1:3000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ usuario, clave })
    });

    const resultado = await response.json();

    if (response.ok) {
      // Guardar el usuario autenticado para uso posterior
      localStorage.setItem("usuarioActivo", usuario);
      localStorage.setItem("rolActivo", resultado.rol);

      // Mostrar el modal institucional con rol
      mostrarModal(resultado.rol);
    } else {
      alert(`Error: ${resultado}`); // Usuario no encontrado o contraseña incorrecta
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
    mensaje.textContent = `Acceso concedido\nBienvenido ${rol}`;
    modal.style.display = "flex";
  } else {
    console.warn("Modal o mensaje no encontrado en el DOM.");
  }
}

// Redirección al módulo de datos
function redirigir() {
  window.location.href = "mis-datos.html";
}
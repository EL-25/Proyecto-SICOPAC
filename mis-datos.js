// Al cargar la página, obtener los datos del usuario autenticado
document.addEventListener("DOMContentLoaded", async () => {
  const usuario = localStorage.getItem("usuarioActivo");

  if (!usuario) {
    alert("No hay sesión activa. Por favor inicia sesión.");
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:3000/api/mis-datos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ usuario })
    });

    if (!response.ok) {
      throw new Error("No se pudo obtener los datos del usuario");
    }

    const datos = await response.json();

    // Insertar los datos en los campos correspondientes
    document.getElementById("campo-usuario").textContent = datos.usuario || "No disponible";
    document.getElementById("campo-nombre").textContent = datos.nombre || "No disponible";
    document.getElementById("campo-correo").textContent = datos.correo || "No disponible";
    document.getElementById("campo-rol").textContent = datos.rol || "No disponible";

    // Mostrar fecha y hora actual
    actualizarFechaYHora(); // Ejecutar al cargar
    setInterval(actualizarFechaYHora, 1000); // Actualizar cada segundo

  } catch (error) {
    console.error("Error al cargar los datos:", error);
    alert("Error al cargar los datos del usuario");
  }
});

// Función para mostrar fecha y hora actual
function actualizarFechaYHora() {
  const ahora = new Date();

  // Formato corto de fecha: DD/MM/YYYY
  const fechaFormateada = ahora.toLocaleDateString('es-SV', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Formato de hora: HH:MM:SS
  const horaFormateada = ahora.toLocaleTimeString('es-SV', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  document.getElementById("campo-fecha").textContent = fechaFormateada;
  document.getElementById("campo-hora").textContent = horaFormateada;
}

// Función para cerrar sesión
function cerrarSesion() {
  localStorage.removeItem("usuarioActivo");
  window.location.href = "login.html";
}

function redirigirAlFormulario() {
  window.location.href = "Formulario SICOPAC (2)/MaquetacionFormulario.html";
}
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

    // Mostrar fecha y hora de ingreso en formato corto
    if (datos.fechaIngreso) {
      const fechaObj = new Date(datos.fechaIngreso);
      const fechaFormateada = fechaObj.toLocaleDateString('es-SV', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const horaFormateada = fechaObj.toLocaleTimeString('es-SV', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      document.getElementById("campo-fecha").textContent = fechaFormateada;
      document.getElementById("campo-hora").textContent = horaFormateada;
    } else {
      document.getElementById("campo-fecha").textContent = "No disponible";
      document.getElementById("campo-hora").textContent = "No disponible";
    }

    // Mostrar firma digital si existe
    const firmaImg = document.getElementById("firma-img");
    if (datos.Firma) {
      firmaImg.src = `img/firma/${datos.Firma}`;
      firmaImg.alt = `Firma de ${datos.nombre}`;
      firmaImg.style.display = "block";
    } else {
      firmaImg.style.display = "none";
    }

  } catch (error) {
    console.error("Error al cargar los datos:", error);
    alert("Error al cargar los datos del usuario");
  }
});

// Función para cerrar sesión
function cerrarSesion() {
  localStorage.removeItem("usuarioActivo");
  window.location.href = "login.html";
}

// Función para redirigir al formulario institucional
function redirigirAlFormulario() {
  window.location.href = "Formulario SICOPAC (2)/MaquetacionFormulario.html";
}
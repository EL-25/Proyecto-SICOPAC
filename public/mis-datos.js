// Al cargar la página, obtener los datos del usuario autenticado
document.addEventListener("DOMContentLoaded", async () => {
  const usuario = localStorage.getItem("usuarioActivo");

  if (!usuario) {
    alert("No hay sesión activa. Por favor inicia sesión.");
    window.location.href = "login.html";
    return;
  }

  try {
    // Obtener datos del usuario
    const response = await fetch("http://127.0.0.1:3000/api/mis-datos", {
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
    if (datos.Firma) {
      firmaImg.src = `img/firma/${datos.Firma}`;
      firmaImg.alt = `Firma de ${datos.usuario}`;
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

// Función para mostrar/ocultar el panel de perfil
function mostrarPerfil() {
  const perfil = document.getElementById("perfilDatos");
  perfil.style.display = perfil.style.display === "none" ? "block" : "none";
}

// ✅ Redirección al formulario con overlay emergente
function registrarAccesoFormulario() {
  const usuario = localStorage.getItem("usuarioActivo");
  if (!usuario) {
    alert("No hay sesión activa.");
    window.location.href = "login.html";
    return;
  }

  // Mostrar overlay emergente con texto para formulario
  const overlay = document.getElementById("overlay");
  if (overlay) {
    overlay.querySelector("p").textContent = "Dirigiendo al Formulario Único de Solicitud…";
    overlay.style.display = "flex";
  }

  // Redirigir al formulario después de 1.5 segundos
  setTimeout(() => {
    window.location.href = `/formulario?usuario=${usuario}`;
  }, 1500);
}

// ✅ Redirección a reportes con overlay emergente
function registrarAccesoReportes() {
  const usuario = localStorage.getItem("usuarioActivo");
  if (!usuario) {
    alert("No hay sesión activa.");
    window.location.href = "login.html";
    return;
  }

  // Mostrar overlay emergente con texto para reportes
  const overlay = document.getElementById("overlay");
  if (overlay) {
    overlay.querySelector("p").textContent = "Cargando formularios recientes…";
    overlay.style.display = "flex";
  }

  // Redirigir a la nueva página de reportes después de 1.5 segundos
  setTimeout(() => {
    window.location.href = "formulario.html";
  }, 1500);
}

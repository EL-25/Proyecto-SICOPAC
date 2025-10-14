// Mostrar nombre completo al cargar la página
document.addEventListener("DOMContentLoaded", async () => {
  const usuario = localStorage.getItem("usuarioPendiente") || localStorage.getItem("usuarioActivo");
  if (!usuario) return;

  try {
    const response = await fetch("http://127.0.0.1:3000/api/mis-datos", {
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
});

// Función para crear la contraseña
async function crearClave() {
  const usuario = localStorage.getItem("usuarioPendiente") || localStorage.getItem("usuarioActivo");
  const nuevaClave = document.getElementById("nuevaClave").value.trim();

  if (!usuario || !nuevaClave) {
    alert("Por favor, completa ambos campos.");
    return;
  }

  if (nuevaClave.length < 6) {
    alert("La contraseña debe tener al menos 6 caracteres.");
    return;
  }

  const boton = document.querySelector("button");
  boton.disabled = true;
  boton.textContent = "Guardando...";

  try {
    const response = await fetch("http://127.0.0.1:3000/api/crear-clave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, nuevaClave })
    });

    const resultado = await response.json();
    const mensaje = resultado.mensaje || "Contraseña creada exitosamente";

    if (response.ok) {
      alert(mensaje);
      setTimeout(() => {
        window.location.href = "./login.html";
      }, 150);

      // Sincronizar localStorage para el panel
      localStorage.setItem("usuarioCreado", usuario);
      localStorage.setItem("usuarioActivo", usuario);
    } else {
      alert("Error: " + mensaje);
    }
  } catch (error) {
    console.error("Error de conexión:", error);
    alert("No se pudo conectar con el servidor.");
  } finally {
    boton.disabled = false;
    boton.textContent = "Guardar contraseña";
  }
}
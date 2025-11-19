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

    // Cargar historial de acciones
    cargarAcciones();

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

// Función para mostrar/ocultar el panel de filtros
function mostrarFiltro() {
  const panel = document.getElementById("filtroPanel");
  panel.style.display = panel.style.display === "none" ? "block" : "none";
}

// Función para aplicar filtros al historial
function aplicarFiltro() {
  const tipo = document.getElementById("tipoFiltro").value;
  const distrito = document.getElementById("distritoFiltro").value;
  const lista = document.getElementById("listaAcciones");
  lista.innerHTML = "";

  const acciones = JSON.parse(localStorage.getItem("accionesSICOPAC") || "[]");

  const filtradas = acciones.filter(a => {
    return (!tipo || a.tipo === tipo) && (!distrito || a.distrito === distrito);
  });

  if (filtradas.length === 0) {
    lista.innerHTML = "<li>No hay registros que coincidan con el filtro.</li>";
    return;
  }

  filtradas.forEach(a => {
    const item = document.createElement("li");
    item.textContent = `${a.tipo} - ${a.distrito} - ${a.fecha} ${a.hora}`;
    lista.appendChild(item);
  });
}

// Función para cargar el historial completo
function cargarAcciones() {
  const lista = document.getElementById("listaAcciones");
  const acciones = JSON.parse(localStorage.getItem("accionesSICOPAC") || "[]");

  if (acciones.length === 0) {
    lista.innerHTML = "<li>No hay acciones registradas aún.</li>";
    return;
  }

  acciones.forEach(a => {
    const item = document.createElement("li");
    item.textContent = `${a.tipo} - ${a.distrito} - ${a.fecha} ${a.hora}`;
    lista.appendChild(item);
  });
}

// Registrar acceso al formulario
function registrarAccesoFormulario() {
  const acciones = JSON.parse(localStorage.getItem("accionesSICOPAC") || "[]");

  const ahora = new Date();
  const fecha = ahora.toLocaleDateString("es-SV");
  const hora = ahora.toLocaleTimeString("es-SV", { hour: '2-digit', minute: '2-digit' });

  const nuevaAccion = {
    tipo: "Acceso a formulario",
    distrito: "—",
    fecha,
    hora
  };

  acciones.push(nuevaAccion);
  localStorage.setItem("accionesSICOPAC", JSON.stringify(acciones));
}

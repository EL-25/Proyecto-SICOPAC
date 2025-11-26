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

    // Cargar historial de acciones desde el backend
    cargarAcciones(usuario);

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

// ✅ Función para aplicar filtros usando el backend
async function aplicarFiltro() {
  const filtros = {
    numeroFormulario: document.getElementById("numeroFormularioFiltro")?.value || "",
    declaracion: document.getElementById("tipoFiltro")?.value || "",
    municipio: document.getElementById("municipioFiltro")?.value || "",
    distrito: document.getElementById("distritoFiltro")?.value || "",
    primerApellidoPadre: document.getElementById("apellidoPadreFiltro")?.value || "",
    primerApellidoMadre: document.getElementById("apellidoMadreFiltro")?.value || "",
    fechaInicio: document.getElementById("fechaInicioFiltro")?.value || "",
    fechaFin: document.getElementById("fechaFinFiltro")?.value || ""
  };

  const lista = document.getElementById("listaAcciones");
  lista.innerHTML = "<li>Buscando...</li>";

  try {
    const resp = await fetch("http://127.0.0.1:3000/api/filtrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros)
    });

    if (!resp.ok) throw new Error("Error al aplicar filtro");

    const resultados = await resp.json();
    lista.innerHTML = "";

    if (resultados.length === 0) {
      lista.innerHTML = "<li>No hay registros que coincidan con el filtro.</li>";
      return;
    }

    resultados.forEach(f => {
      const li = document.createElement("li");
     const fecha = f.FechaPresentacion ? new Date(f.FechaPresentacion).toLocaleDateString("es-SV") : "—";
     li.textContent = `Formulario ${f.NumeroFormulario || "—"} - ${f.Declaraciones || "—"} - ${f.Municipio || "—"}/${f.Distrito || "—"} - Fecha: ${fecha}`;
      lista.appendChild(li);
    });
  } catch (err) {
    console.error("❌ Error aplicando filtro:", err);
    lista.innerHTML = "<li>Error al aplicar filtro.</li>";
  }
}

// Función para cargar el historial completo desde el backend
async function cargarAcciones(usuario) {
  try {
    const resp = await fetch("http://127.0.0.1:3000/api/acciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario })
    });

    if (!resp.ok) throw new Error("No se pudo obtener el historial de acciones");

    const acciones = await resp.json();

    // Guardar en localStorage para referencia rápida
    localStorage.setItem("accionesBD", JSON.stringify(acciones));

    const lista = document.getElementById("listaAcciones");
    lista.innerHTML = "";

    if (acciones.length === 0) {
      lista.innerHTML = "<li>No hay acciones registradas aún.</li>";
      return;
    }

    acciones.forEach(a => {
      const item = document.createElement("li");
      item.textContent = `${a.Usuario || "—"} - ${a.Declaracion || "—"} - ${a.Municipio || "—"} - ${a.FechaHoraLocal || "—"}`;
      lista.appendChild(item);
    });
  } catch (err) {
    console.error("❌ Error cargando acciones:", err);
  }
}

// ✅ Redirección al formulario con usuario activo
function registrarAccesoFormulario() {
  const usuario = localStorage.getItem("usuarioActivo");
  if (!usuario) {
    alert("No hay sesión activa.");
    window.location.href = "login.html";
    return;
  }

  // Registrar acción en localStorage (opcional)
  const acciones = JSON.parse(localStorage.getItem("accionesBD") || "[]");
  const ahora = new Date();
  const nuevaAccion = {
    Usuario: usuario,
    Declaracion: "Acceso a formulario",
    Municipio: "—",
    Distrito: "—",
    FechaHoraLocal: ahora.toLocaleString("es-SV")
  };
  acciones.push(nuevaAccion);
  localStorage.setItem("accionesBD", JSON.stringify(acciones));

  // Redirigir al formulario con el usuario como query param
  window.location.href = `/formulario?usuario=${usuario}`;
}

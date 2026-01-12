// ==============================
// formulario.js actualizado
// ==============================

// Al cargar la página, obtener los formularios recientes del usuario
document.addEventListener("DOMContentLoaded", async () => {
  const usuario = localStorage.getItem("usuarioActivo");
  const rol = localStorage.getItem("rolActivo");

  if (!usuario || !rol) {
    alert("No hay sesión activa. Por favor inicia sesión.");
    window.location.href = "login.html";
    return;
  }

  // Cargar formularios recientes
  await cargarFormularios(usuario, rol);
});

// Función para cerrar sesión
function cerrarSesion() {
  localStorage.removeItem("usuarioActivo");
  localStorage.removeItem("rolActivo");
  window.location.href = "login.html";
}

// Mostrar/ocultar panel de filtros
function mostrarFiltro() {
  const panel = document.getElementById("filtroPanel");
  panel.style.display = panel.style.display === "none" ? "block" : "none";
}

// Cargar formularios recientes desde /api/acciones
async function cargarFormularios(usuario, rol) {
  const lista = document.getElementById("listaFormularios");
  lista.innerHTML = "<li>Cargando formularios recientes...</li>";

  try {
    const resp = await fetch("/api/acciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, rol })
    });

    if (!resp.ok) throw new Error("Error al obtener formularios");

    const formularios = await resp.json();
    lista.innerHTML = "";

    if (formularios.length === 0) {
      lista.innerHTML = "<li>No hay formularios registrados aún.</li>";
      return;
    }

    formularios.forEach(f => {
      const fecha = f.FechaHoraLocal || "—";
      const li = document.createElement("li");

      if (rol === "Administrador") {
        li.innerHTML = `
          <strong>${f.Usuario}</strong> — Formulario ${f.CodigoFormulario || "—"}<br>
          ${f.Declaracion || "—"} - ${f.Municipio || "—"}/${f.Distrito || "—"}<br>
          Fecha: ${fecha}
        `;
      } else {
        li.textContent = `Formulario ${f.CodigoFormulario || "—"} - ${f.Declaracion || "—"} - ${f.Municipio || "—"}/${f.Distrito || "—"} - Fecha: ${fecha}`;
      }

      lista.appendChild(li);
    });
  } catch (err) {
    console.error("❌ Error cargando formularios:", err);
    lista.innerHTML = "<li>Error al cargar formularios.</li>";
  }
}

// Aplicar filtros usando /api/filtrar
async function aplicarFiltro() {
  const usuarioActivo = localStorage.getItem("usuarioActivo");
  const rol = localStorage.getItem("rolActivo");

  // 👇 Si es administrador, usar el campo del filtro; si no, usar su propio usuario
  const usuarioFiltro = rol === "Administrador" 
    ? document.getElementById("usuarioFiltro")?.value || "" 
    : usuarioActivo;

  const filtros = {
    numeroFormulario: document.getElementById("numeroFormularioFiltro")?.value || "",
    declaracion: document.getElementById("tipoFiltro")?.value || "",
    municipio: document.getElementById("municipioFiltro")?.value || "",
    distrito: document.getElementById("distritoFiltro")?.value || "",
    primerApellidoPadre: document.getElementById("apellidoPadreFiltro")?.value || "",
    primerApellidoMadre: document.getElementById("apellidoMadreFiltro")?.value || "",
    fechaInicio: document.getElementById("fechaInicioFiltro")?.value || "",
    fechaFin: document.getElementById("fechaFinFiltro")?.value || "",
    usuario: usuarioFiltro, // 👈 ahora correcto
    rol
  };

  const lista = document.getElementById("listaFormularios");
  lista.innerHTML = "<li>Aplicando filtros...</li>";

  try {
    const resp = await fetch("/api/filtrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros)
    });

    if (!resp.ok) throw new Error("Error al aplicar filtro");

    const resultados = await resp.json();
    lista.innerHTML = "";

    if (resultados.length === 0) {
      lista.innerHTML = "<li>No hay formularios que coincidan con el filtro.</li>";
      return;
    }

    resultados.forEach(f => {
      const fecha = f.FechaPresentacion ? new Date(f.FechaPresentacion).toLocaleDateString("es-SV") : "—";
      const li = document.createElement("li");

      if (rol === "Administrador") {
        li.innerHTML = `
          <strong>${f.Usuario}</strong> — Formulario ${f.NumeroFormulario || "—"}<br>
          ${f.Declaraciones || "—"} - ${f.Municipio || "—"}/${f.Distrito || "—"}<br>
          Fecha: ${fecha}
        `;
      } else {
        li.textContent = `Formulario ${f.NumeroFormulario || "—"} - ${f.Declaraciones || "—"} - ${f.Municipio || "—"}/${f.Distrito || "—"} - Fecha: ${fecha}`;
      }

      lista.appendChild(li);
    });
  } catch (err) {
    console.error("❌ Error aplicando filtro:", err);
    lista.innerHTML = "<li>Error al aplicar filtro.</li>";
  }
}

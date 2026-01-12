// ==============================
// formulario.js actualizado
// ==============================

document.addEventListener("DOMContentLoaded", async () => {
  const usuario = localStorage.getItem("usuarioActivo");
  const rol = localStorage.getItem("rolActivo");

  if (!usuario || !rol) {
    alert("No hay sesión activa. Por favor inicia sesión.");
    window.location.href = "login.html";
    return;
  }

  await cargarFormularios(usuario, rol);
});

function cerrarSesion() {
  localStorage.removeItem("usuarioActivo");
  localStorage.removeItem("rolActivo");
  window.location.href = "login.html";
}

function mostrarFiltro() {
  const panel = document.getElementById("filtroPanel");
  panel.style.display = panel.style.display === "none" ? "block" : "none";
}

// Normalizar campos para evitar undefined
function mapFormulario(f) {
  return {
    usuario: f.Usuario || f.usuario || f.CreadoPor || "—",
    codigo: f.CodigoFormulario || f.NumeroFormulario || "—",
    declaracion: f.Declaracion || f.Declaraciones || "—",
    municipio: "La Libertad Este",
    distrito: f.Distrito || "—",
    fecha: f.FechaHoraLocal || f.FechaPresentacion || null
  };
}

function formatFecha(fecha) {
  if (!fecha) return "—";
  try {
    return new Date(fecha).toLocaleDateString("es-SV");
  } catch {
    return "—";
  }
}

// Cargar formularios recientes
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

    if (!Array.isArray(formularios) || formularios.length === 0) {
      lista.innerHTML = "<li>No hay formularios registrados aún.</li>";
      return;
    }

    formularios.forEach(raw => {
      const f = mapFormulario(raw);
      const li = document.createElement("li");

      if (rol === "Administrador") {
        li.innerHTML = `
          <strong>${f.usuario}</strong> — Formulario ${f.codigo}<br>
          ${f.declaracion} - ${f.municipio}/${f.distrito}<br>
          Fecha: ${formatFecha(f.fecha)}
        `;
      } else {
        li.textContent = `Formulario ${f.codigo} - ${f.declaracion} - ${f.municipio}/${f.distrito} - Fecha: ${formatFecha(f.fecha)}`;
      }

      lista.appendChild(li);
    });
  } catch (err) {
    console.error("❌ Error cargando formularios:", err);
    lista.innerHTML = "<li>Error al cargar formularios.</li>";
  }
}

// Aplicar filtros
async function aplicarFiltro() {
  const usuarioActivo = localStorage.getItem("usuarioActivo");
  const rol = localStorage.getItem("rolActivo");

  const usuarioFiltro = rol === "Administrador"
    ? document.getElementById("usuarioFiltro")?.value || ""
    : usuarioActivo;

  const filtros = {
    numeroFormulario: document.getElementById("numeroFormularioFiltro")?.value || "",
    declaracion: document.getElementById("tipoFiltro")?.value || "",
    municipio: "La Libertad Este", // fijo
    distrito: document.getElementById("distritoFiltro")?.value || "",
    primerApellidoPadre: document.getElementById("apellidoPadreFiltro")?.value || "",
    primerApellidoMadre: document.getElementById("apellidoMadreFiltro")?.value || "",
    fechaInicio: document.getElementById("fechaInicioFiltro")?.value || "",
    fechaFin: document.getElementById("fechaFinFiltro")?.value || "",
    usuario: usuarioFiltro,
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

    if (!Array.isArray(resultados) || resultados.length === 0) {
      lista.innerHTML = "<li>No hay formularios que coincidan con el filtro.</li>";
      return;
    }

    resultados.forEach(raw => {
      const f = mapFormulario(raw);
      const li = document.createElement("li");

      if (rol === "Administrador") {
        li.innerHTML = `
          <strong>${f.usuario}</strong> — Formulario ${f.codigo}<br>
          ${f.declaracion} - ${f.municipio}/${f.distrito}<br>
          Fecha: ${formatFecha(f.fecha)}
        `;
      } else {
        li.textContent = `Formulario ${f.codigo} - ${f.declaracion} - ${f.municipio}/${f.distrito} - Fecha: ${formatFecha(f.fecha)}`;
      }

      lista.appendChild(li);
    });
  } catch (err) {
    console.error("❌ Error aplicando filtro:", err);
    lista.innerHTML = "<li>Error al aplicar filtro.</li>";
  }
}

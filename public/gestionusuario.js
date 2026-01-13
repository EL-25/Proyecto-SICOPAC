document.addEventListener("DOMContentLoaded", () => {
  const usuariosBody = document.getElementById("usuariosBody");

  // Formatear fecha desde milisegundos
  function formatearFechaMs(ms) {
    if (!ms) return "Sin registro";
    const fecha = new Date(Number(ms));
    if (isNaN(fecha)) return "Sin registro";
    return fecha.toLocaleString("es-SV", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  // Cargar usuarios desde el backend
  function cargarUsuarios() {
    fetch("/api/usuarios")
      .then(res => res.json())
      .then(data => {
        usuariosBody.innerHTML = "";
        data.forEach(usuario => {
          console.log("Usuario:", usuario.nombre, "Fecha(ms):", usuario.fechaCreacionMs); // depuración
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${usuario.id}</td>
            <td>${usuario.nombre || "Sin registro"}</td>
            <td>${usuario.correo || "Sin registro"}</td>
            <td>${usuario.rol || "Sin registro"}</td>
            <td>${formatearFechaMs(usuario.fechaCreacionMs)}</td>
            <td>
              <button class="btn-accion btn-editar" 
                      data-id="${usuario.id}" 
                      data-usuario="${usuario.usuario}" 
                      data-correo="${usuario.correo}" 
                      data-rol="${usuario.rol}">
                <i class="fa-solid fa-pen"></i> Editar
              </button>
              <button class="btn-accion btn-eliminar" data-id="${usuario.id}">
                <i class="fa-solid fa-trash"></i> Eliminar
              </button>
            </td>
          `;
          usuariosBody.appendChild(tr);
        });
      })
      .catch(err => {
        console.error("Error al cargar usuarios:", err);
        Swal.fire("Error", "No se pudieron cargar los usuarios", "error");
      });
  }

  // Manejar clic en acciones
  usuariosBody.addEventListener("click", (e) => {
    // EDITAR
    if (e.target.closest(".btn-editar")) {
      const btn = e.target.closest(".btn-editar");
      const id = btn.dataset.id;
      const usuario = btn.dataset.usuario;
      const correo = btn.dataset.correo;
      const rol = btn.dataset.rol;

      Swal.fire({
        title: "Editar usuario",
        html: `
          <input id="swal-usuario" class="swal2-input" placeholder="Usuario" value="${usuario}">
          <input id="swal-correo" class="swal2-input" placeholder="Correo" value="${correo}">
          <input id="swal-rol" class="swal2-input" placeholder="Rol" value="${rol}">
          <input id="swal-clave" type="password" class="swal2-input" placeholder="Nueva clave">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Guardar",
        cancelButtonText: "Cancelar",
        preConfirm: () => {
          const nuevoUsuario = document.getElementById("swal-usuario").value.trim();
          const correoNuevo = document.getElementById("swal-correo").value.trim();
          const rolNuevo = document.getElementById("swal-rol").value.trim();
          const claveNueva = document.getElementById("swal-clave").value.trim();

          return {
            usuario: usuario,
            nuevoUsuario,
            correo: correoNuevo,
            rol: rolNuevo,
            clave: claveNueva
          };
        }
      }).then((result) => {
        if (result.isConfirmed) {
          fetch("/api/actualizar-usuario", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result.value)
          })
            .then(res => {
              if (res.ok) {
                Swal.fire("Actualizado", "El usuario ha sido actualizado.", "success");
                cargarUsuarios();
              } else {
                Swal.fire("Error", "No se pudo actualizar el usuario.", "error");
              }
            })
            .catch(err => {
              console.error("Error al actualizar:", err);
              Swal.fire("Error", "Ocurrió un problema al actualizar.", "error");
            });
        }
      });
    }

    // ELIMINAR
    if (e.target.closest(".btn-eliminar")) {
      const id = e.target.closest(".btn-eliminar").dataset.id;

      Swal.fire({
        title: "¿Eliminar usuario?",
        text: "Esta acción borrará al usuario de forma permanente.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#c62828",
        cancelButtonColor: "#005baa",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
      }).then((result) => {
        if (result.isConfirmed) {
          fetch(`/api/usuarios/${id}`, { method: "DELETE" })
            .then(res => {
              if (res.ok) {
                Swal.fire("Eliminado", "El usuario ha sido eliminado.", "success");
                cargarUsuarios();
              } else {
                Swal.fire("Error", "No se pudo eliminar el usuario.", "error");
              }
            })
            .catch(err => {
              console.error("Error al eliminar:", err);
              Swal.fire("Error", "Ocurrió un problema al eliminar.", "error");
            });
        }
      });
    }
  });

  // Inicializar
  cargarUsuarios();
});

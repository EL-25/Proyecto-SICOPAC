document.addEventListener("DOMContentLoaded", () => {
  const usuariosBody = document.getElementById("usuariosBody");

  // Cargar usuarios desde el backend
  function cargarUsuarios() {
    fetch("/api/usuarios") // endpoint que devuelve todos los usuarios
      .then(res => res.json())
      .then(data => {
        usuariosBody.innerHTML = "";
        data.forEach(usuario => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${usuario.id}</td>
            <td>${usuario.nombre}</td>
            <td>${usuario.correo}</td>
            <td>${usuario.rol}</td>
            <td>${usuario.fechaCreacion}</td>
            <td>
              <button class="btn-accion btn-editar" data-id="${usuario.id}">
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
    if (e.target.closest(".btn-editar")) {
      const id = e.target.closest(".btn-editar").dataset.id;
      window.location.href = `/admin/editar-usuario/${id}`;
    }

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

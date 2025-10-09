document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registroForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 🕒 Generar fecha y hora actual
    const ahora = new Date();
    const fechaIngreso = ahora.toISOString().split("T")[0]; // yyyy-mm-dd
    const horaIngreso = ahora.toTimeString().split(" ")[0]; // hh:mm:ss

    // Insertar en los campos ocultos del formulario
    document.getElementById("fechaIngreso").value = fechaIngreso;
    document.getElementById("horaIngreso").value = horaIngreso;

    const formData = new FormData(form);

    const usuario = formData.get("usuario");
    const primerNombre = formData.get("primerNombre");
    const segundoNombre = formData.get("segundoNombre");
    const primerApellido = formData.get("primerApellido");
    const segundoApellido = formData.get("segundoApellido");
    const tercerApellido = formData.get("tercerApellido");
    const correo = formData.get("correo");
    const rol = formData.get("rol");

    // Obtener solo el nombre del archivo de firma
    const firmaFile = formData.get("firma");
    const firma = firmaFile ? firmaFile.name : "";

    const payload = {
      usuario,
      primerNombre,
      segundoNombre,
      primerApellido,
      segundoApellido,
      tercerApellido,
      correo,
      rol,
      fechaIngreso,
      horaIngreso,
      firma
    };

    try {
      const response = await fetch("http://localhost:3000/api/agregar-usuario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("Usuario registrado exitosamente");
        localStorage.setItem("usuarioPendiente", usuario);
        window.location.href = "crear-clave.html";
      } else {
        const errorText = await response.text();
        alert("Error al registrar usuario: " + errorText);
      }
    } catch (err) {
      console.error("Error en el registro:", err);
      alert("Error en el servidor");
    }
  });
});
// --- Arreglando el codigo ---
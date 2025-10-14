document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registroForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 🕒 Generar fecha y hora actual en formato ISO completo
    const ahora = new Date();
    const fechaHoraIngreso = ahora.toISOString();
    const formData = new FormData(form);
    formData.append("fechaIngreso", fechaHoraIngreso);

    const usuario = formData.get("usuario");

    // 🔍 Validación previa: verificar si el usuario ya existe
    try {
      const existeResponse = await fetch("http://localhost:3000/api/verificar-usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario })
      });

      const existeResultado = await existeResponse.json();
      if (existeResultado.existe) {
        alert("⚠️ El usuario ya está registrado. Usa otro nombre de usuario.");
        return;
      }
    } catch (verificacionError) {
      console.error("⚠️ Error al verificar existencia del usuario:", verificacionError);
      alert("No se pudo verificar si el usuario existe. Intenta más tarde.");
      return;
    }

    // 📤 Verificar contenido del FormData antes de enviar
    console.log("📤 Enviando datos al servidor...");
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: archivo seleccionado -`, value.name);
      } else {
        console.log(`${key}:`, value);
      }
    }

    try {
      const response = await fetch("http://localhost:3000/api/agregar-usuario", {
        method: "POST",
        body: formData
      });

      console.log("📦 Respuesta recibida del servidor:", response);

      const contentType = response.headers.get("content-type");
      console.log("🧾 Content-Type recibido:", contentType);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error recibido:", errorText);
        alert("Error al registrar usuario: " + errorText);
        return;
      }

      // ✅ Interpretar respuesta
      let mensaje = "Usuario registrado exitosamente";
      try {
        const resultado = await response.json();
        console.log("✅ Resultado interpretado como JSON:", resultado);
        mensaje = resultado.mensaje || mensaje;
      } catch (jsonError) {
        console.warn("⚠️ No se pudo interpretar como JSON. Usando mensaje por defecto.");
      }

      // 🧠 Guardar usuario en localStorage
      localStorage.setItem("usuarioPendiente", usuario);
      localStorage.setItem("usuarioActivo", usuario);

      // 🚀 Mostrar mensaje y redirigir
      setTimeout(() => {
        alert(mensaje);
        window.location.href = "./crear-clave.html";
      }, 100);
    } catch (err) {
      console.error("❌ Error en el registro:", err);
      alert("Error en el servidor");
    }
  });
});
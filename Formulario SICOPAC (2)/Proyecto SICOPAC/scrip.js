document.addEventListener("DOMContentLoaded", () => {
    // 📅 Fecha y hora automática
    const fechaInput = document.getElementById('fechaPresentacion');
    const horaInput = document.getElementById('horaPresentacion');
    const refLLEInput = document.getElementById('refLLE');

    function actualizarFechaHora() {
        const ahora = new Date();
        const año = ahora.getFullYear();
        const mes = String(ahora.getMonth() + 1).padStart(2, '0');
        const dia = String(ahora.getDate()).padStart(2, '0');
        const horas = String(ahora.getHours()).padStart(2, '0');
        const minutos = String(ahora.getMinutes()).padStart(2, '0');

        if (fechaInput) fechaInput.value = `${año}-${mes}-${dia}`;
        if (horaInput) horaInput.value = `${horas}:${minutos}`;
        if (refLLEInput) refLLEInput.value = `${año}-${mes}-${dia}`;
    }

    actualizarFechaHora();
    setInterval(() => {
        const ahora = new Date();
        const horas = String(ahora.getHours()).padStart(2, '0');
        const minutos = String(ahora.getMinutes()).padStart(2, '0');
        if (horaInput) horaInput.value = `${horas}:${minutos}`;
    }, 60000);

    // 🌍 Municipio → Distrito → Lugar + Domicilio
    const municipioSelect = document.getElementById("municipio");
    const distritoSpan = document.getElementById("distritoResultado");
    const lugarInput = document.getElementById("lugarPresentacion");
    const domicilioInput = document.getElementById("domicilioInput");

    const distritos = {

        "Antiguo Cuscatlán": "La Libertad Este",
        "Nuevo Cuscatlán": "La Libertad Este",
        "San José Villanueva": "La Libertad Este",
        "Zaragoza": "La Libertad Este",
        "Huizúcar": "La Libertad Este",

    };

    municipioSelect.addEventListener("change", () => {
        const municipio = municipioSelect.value;
        const distrito = distritos[municipio] || "—";
        const resultado = municipio ? `${municipio} - ${distrito}` : "";

        distritoSpan.textContent = distrito;
        lugarInput.value = resultado;
        domicilioInput.value = resultado;
    });

    // 🧾 Mostrar campos según tipo de documento (solicitante)
    const duiRadio = document.getElementById("duiRadio");
    const pasaporteRadio = document.getElementById("pasaporteRadio");
    const otroRadio = document.getElementById("otroRadio");

    const campoDUI = document.getElementById("campoDUI");
    const campoPasaporte = document.getElementById("campoPasaporte");
    const campoOtro = document.getElementById("campoOtro");

    const duiInput = document.getElementById("duiInput");
    const pasaporteInput = document.getElementById("pasaporteInput");
    const otroInput = document.getElementById("otroInput");

    const radiosDoc = document.getElementsByName("docTipo");

    radiosDoc.forEach(radio => {
        radio.addEventListener("change", () => {
            campoDUI.style.display = duiRadio.checked ? "block" : "none";
            campoPasaporte.style.display = pasaporteRadio.checked ? "block" : "none";
            campoOtro.style.display = otroRadio.checked ? "block" : "none";

            duiInput.disabled = !duiRadio.checked;
            pasaporteInput.disabled = !pasaporteRadio.checked;
            otroInput.disabled = !otroRadio.checked;

            if (!duiRadio.checked) duiInput.value = "";
            if (!pasaporteRadio.checked) pasaporteInput.value = "";
            if (!otroRadio.checked) otroInput.value = "";
        });
    });

    // 🧾 Mostrar campos según tipo de documento (titular)
    const duiTitularRadio = document.getElementById("duiTitularRadio");
    const nuiTitularRadio = document.getElementById("nuiTitularRadio");
    const otroTitularRadio = document.getElementById("otroTitularRadio");

    const campoDUI_Titular = document.getElementById("campoDUI_Titular");
    const campoNUI_Titular = document.getElementById("campoNUI_Titular");
    const campoOtro_Titular = document.getElementById("campoOtro_Titular");

    const duiTitularInput = document.getElementById("duiTitularInput");
    const nuiTitularInput = document.getElementById("nuiTitularInput");
    const otroTitularInput = document.getElementById("otroTitularInput");

    const radiosTitular = document.getElementsByName("docTitular");

    radiosTitular.forEach(radio => {
        radio.addEventListener("change", () => {
            campoDUI_Titular.style.display = duiTitularRadio.checked ? "block" : "none";
            campoNUI_Titular.style.display = nuiTitularRadio.checked ? "block" : "none";
            campoOtro_Titular.style.display = otroTitularRadio.checked ? "block" : "none";

            duiTitularInput.disabled = !duiTitularRadio.checked;
            nuiTitularInput.disabled = !nuiTitularRadio.checked;
            otroTitularInput.disabled = !otroTitularRadio.checked;

            if (!duiTitularRadio.checked) duiTitularInput.value = "";
            if (!nuiTitularRadio.checked) nuiTitularInput.value = "";
            if (!otroTitularRadio.checked) otroTitularInput.value = "";
        });
    });

    // ✅ Validación al enviar
    document.getElementById("solicitudForm").addEventListener("submit", function(e) {
        let errores = [];

        // Validación de DUI
        if (!duiInput.disabled && duiInput.value.trim() !== "") {
            const duiRegex = /^\d{8}-\d{1}$/;
            if (!duiRegex.test(duiInput.value)) {
                errores.push("Formato de DUI inválido. Ejemplo correcto: 01234567-8");
            }
        }

        // Validación de Pasaporte
        if (!pasaporteInput.disabled && pasaporteInput.value.trim() !== "") {
            const pasaporteRegex = /^[A-Z]{2}\d{6}$/;
            if (!pasaporteRegex.test(pasaporteInput.value)) {
                errores.push("Formato de pasaporte inválido. Ejemplo correcto: AB123456");
            }
        }

        // Mostrar errores
        if (errores.length > 0) {
            e.preventDefault();
            alert("Errores encontrados:\n\n" + errores.join("\n"));
        }
    });
});
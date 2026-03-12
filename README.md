📌 SICOPAC – Sistema de Control y Gestión de Partidas Civiles en Línea
Este proyecto es un sistema informático en línea diseñado para la Alcaldía, cuyo propósito es modernizar y digitalizar el registro y emisión de partidas civiles (nacimiento, matrimonio, divorcio y defunción).

SICOPAC busca ofrecer un servicio eficiente, seguro y accesible, garantizando la transparencia en la gestión de documentos y facilitando la consulta desde cualquier dispositivo conectado a internet.

🎯 Objetivo General
Diseñar, desarrollar e implementar un sistema informático en línea que permita el control eficiente y seguro del registro y emisión de partidas de nacimiento, matrimonio, divorcio y defunción, generando reportes detallados, asignando correlativos automáticos y almacenando datos de manera organizada y accesible.

📌 Objetivos Específicos
Implementar un módulo para el registro digital de cada tipo de partida, con asignación automática de correlativo numérico y fecha de realización.

Permitir la búsqueda, consulta y filtrado de registros por fecha, tipo de documento, solicitante o funcionario responsable.

Generar reportes automáticos sobre:

Número total de partidas emitidas por periodo.

Personas solicitantes.

Funcionarios responsables de su emisión.

Incorporar autenticación de usuarios y niveles de acceso para garantizar seguridad.

Permitir la operación 100% en línea con respaldo automático de la base de datos.

📚 Alcance
El sistema cubrirá:

Registro digital de partidas de nacimiento, matrimonio, divorcio y defunción.

Control de correlativos por tipo de documento.

Reportes personalizados exportables a PDF/Excel.

Historial de solicitudes y responsables.

Funcionamiento en tiempo real desde cualquier dispositivo con conexión a internet.

🛠️ Tecnologías utilizadas
Frontend: HTML5, CSS3, JavaScript.

Backend: Node.js con Express.

Base de datos: PostgreSQL.

Integración externa: Google Sheets API.

Diseño responsivo: adaptable a móviles y escritorio.

📂 Estructura del proyecto
login.html → Pantalla de acceso.

mis-datos.html → Panel principal del usuario.

css/ → Estilos institucionales.

img/ → Recursos gráficos.

server.js → Configuración del servidor, conexión a base de datos y volcado hacia Google Sheets.

📖 Manual de uso
Clonar el repositorio desde GitHub o copiarlo desde la memoria USB.

Instalar dependencias con: npm install

Ejecutar el sistema en local con:
node server.js

Acceder desde el navegador en:
http://localhost:3000

⚙️ Cómo subir el sistema al servidor
Este paso es clave para la entrega final:

Copiar el repositorio completo al servidor (por ejemplo, desde la USB).

Instalar las dependencias en el servidor con:
npm install

Abrir el archivo server.js y ajustar las siguientes configuraciones:
🔹 Bloque de credenciales para Google Sheets
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// ⚠️ IMPORTANTE: Cambiar esta línea al ID del Google Sheet oficial de la Alcaldía
const spreadsheetId = 'ID_DEL_SHEET_DE_LA_ALCALDIA';

👉 Acción necesaria: reemplazar spreadsheetId por el ID del Google Sheet oficial de la Alcaldía.

🔹 Bloque de credenciales del servidor (Base de Datos)
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: { rejectUnauthorized: false }
});

👉 Acción necesaria: ajustar las variables de entorno (PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE) con las credenciales reales del servidor de la Alcaldía.

Iniciar el servidor con:
node server.js

Confirmar que el sistema esté accesible desde la red institucional.
👥 Equipo
Programadores: Edwin Leiva y Cesar Melendez

🎯 Impacto esperado
SICOPAC permitirá a la Alcaldía:

Reducir tiempos de gestión.

Garantizar seguridad y trazabilidad en la emisión de partidas.

Facilitar el acceso ciudadano a sus documentos.

Modernizar la administración pública con un sistema confiable y transparente.

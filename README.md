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

.env → Archivo de configuración de credenciales y variables de entorno.

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

Actualmente se encuentra asi:
const spreadsheetId = '1oPWwKFb-bl1tMWtQr43tpNlKWX1G1re4hJn7p1hY8vc';
Se debe reemplazar este ID "1oPWwKFb-bl1tMWtQr43tpNlKWX1G1re4hJn7p1hY8vc" por el ID del sheet que utiliza la alcaldía

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

Ejemplo de archivo .env
El archivo .env debe contener las siguientes variables de entorno:
# Puerto del servidor
PORT=3000

# Opciones de Node.js
NODE_OPTIONS=--openssl-legacy-provider

# Credenciales de Google Sheets
GOOGLE_CLIENT_EMAIL=sicopac-service@proyecto-sicopac.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBK...\n-----END PRIVATE KEY-----\n"

# ID del Google Sheet oficial de la Alcaldía
SPREADSHEET_ID_ALCALDIA=ID_DEL_SHEET_DE_LA_ALCALDIA

# Credenciales de la base de datos PostgreSQL
PGHOST=servidor.alcaldia.gob.sv
PGPORT=5432
PGUSER=usuario_db
PGPASSWORD=contraseña_db
PGDATABASE=nombre_db

Importante:

Los valores aquí son ejemplos. Deben ser reemplazados por las credenciales reales que proporcione la Alcaldía.

La clave privada de Google debe mantenerse con los saltos de línea \n para que funcione correctamente.

Nunca subir el archivo .env al repositorio público.

Actualmente el archivo .env contiene esto:
GOOGLE_CLIENT_EMAIL=sicopac-service@proyecto-sicopac.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDThKxp+EhAPC1T\nXwbtwWZ53ItzTwfFKpuqUXh3jLIwbtfnyZ+valaI6ctIj2pUHo5KiagZD4tvEL1/\n3D4j0Yz18WU2FZsOfpud5lnd9UKEziCXqRVpwa1GvaAjfpoXJqOjImfx+fpsWgAy\nomq01sh6zy0u8ldwBxXaM/P6bgpjstotdcvHRKbnfBZbbkCd46pbO7yvSDxCDzg7\nhdp/rtqpBlig+8KLkL/rC1c/ZebMkz54oV1il7wriOigvoUJRLz8bqQ3RQodQf1F\n/t8wNJkt3n+5YURAkW4frXPJ/kngEjiPN7Y5LSI3+dBGT/Z/6BWWGyAzElG1xuym\nRzt5DDflAgMBAAECggEAKGsXlDdavRWStrX3qbqVda9gYWQmcLV74f+n9LZIvYsM\nzFDBqCA6kXaVfxPSpmjhWVp1KfbHtu08vOBN6oPKOxwJ8lwOEWa9n15raUfK0nxe\nC4UGn7sf/J7TKT0xvj9GsS9rq/hP82D+XS6ek9hgHmGU+X3bGf/sm9HmKwJYj2S+\nmABS05mCxLLLvlA8ScZJTdECkARF8uor4tAvlueRRsafZSZVF2Ed928eA0ji2uJO\njqB+wUlbZFZPsxycbvDwRvgbup3PTO0W9/M/LKLrXbG2pMR7l55+/3MCq8EMIVd9\nuhMxFsiL8gCr1qyWUZrW8w+tQpaum7WLWCR++wo1yQKBgQDzoxaO4XK8um9PPTY2\ncGAXnUFJZedRgDJ/5Fadk5/n1Iq/kVjPYDNkFijvbQtlhNgUaSICdiEHGgZPV+Qn\nC90OOhIVF2/XRnfHJv7HHGpU4wsZJtLBu+xX8sIGjwcWJ1zAX6wNjfZqGAPh9T7o\nNv3JeCVJLbBV3nE0Op9KVlSceQKBgQDeQFpyoD0iuCVi0oXPJsBR7w7mX9pP+hxm\nomD9meoJb9qnmucvdWv1Gr+NlcvWa64dASv0Tec4rhtcZQVTNfSLOlPgneceIGDN\n8/xtYlI3UczLzoFbuOh4oVjEs4XZONeBA+s+AMlEqZV6i/OFu80PIBQePuRvcVjB\nQ1J4tMGDzQKBgDZJkb42mAVbmW/TmN/afF7mqGR9c2Sipx3+OBqWiVvz7RKwhVR4\nABt+IJLw/kgZqLgrkOtxfPyDHQLS98CHkTMZV2whs8cJKalTlBOzzjGqAZASKYYH\npKsYKYmilxaloLIw3zqJ9m0/eqX/qou9rSEWR2Cd8JvBnAHiShobUHEpAoGBAIy8\ne4nyZkRCD4qQfSM8CrTXiLvhHsFeQ/XKBVkRyd3H8tIHiTXISWCgW4Qwwy84aLz9\nLPQ7EJwXxEOxxLl4hS5U9SBbXSr6ndJNGh+6Dw3wwpqcXdXTNYKNyURl2fA/ylds\nP963aLwOFxXO4Zph3ewiCBtPACCByg43r1W4QIJRAoGAQiYvxkAD2YrUYuepuU2i\ng8+x1Y57yYBJsOX4pPT8Gfjo+YaJuAlFNxT9hOhroDzRKFFqBcTyJSAodJax0QzD\nB8dQToduqK4n7Uq6/BEJ9KpRdAcm9fZWokg+Zb5+6Depq5vuvcaCzqpAtgGigCIJ\nSZpFlwnINKMt9JxaeTei3zA=\n-----END PRIVATE KEY-----\n"

NODE_OPTIONS=--openssl-legacy-provider

SPREADSHEET_ID_ALCALDIA=

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

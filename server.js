const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sql = require('mssql');
const multer = require('multer');
const path = require('path');

// Configuración de conexión a SQL Server
const dbConfig = {
  user: 'UDBbasedatos',
  password: 'Bunny&Sae20',
  server: 'localhost',
  database: 'SistemaAlcaldia',
  options: {
    port: 1433,
    encrypt: false,
    trustServerCertificate: true
  }
};

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/img/firma', express.static(path.join(__dirname, 'img/firma')));

// Configuración de multer para guardar firmas
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'img/firma');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Verificar si el usuario ya existe
app.post('/api/verificar-usuario', async (req, res) => {
  const { usuario } = req.body;
  try {
    await sql.connect(dbConfig);
    const result = await sql.query`
      SELECT COUNT(*) AS total FROM Usuarios WHERE Usuario = ${usuario}
    `;
    res.json({ existe: result.recordset[0].total > 0 });
  } catch (err) {
    console.error("Error en /api/verificar-usuario:", err);
    res.status(500).send("Error en el servidor");
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { usuario, clave } = req.body;

  try {
    await sql.connect(dbConfig);
    const result = await sql.query`SELECT * FROM Usuarios WHERE Usuario = ${usuario} AND Estado = 1`;
    const user = result.recordset[0];

    if (!user) return res.status(401).send('Usuario no encontrado');
    if (user.Clave !== clave) return res.status(401).send('Contraseña incorrecta');

    res.status(200).json({
      nombre: user.NombreCompleto,
      rol: user.Rol
    });
  } catch (err) {
    console.error('Error en el login:', err);
    res.status(500).send('Error en el servidor');
  }
});

// Datos del usuario autenticado
app.post('/api/mis-datos', async (req, res) => {
  const { usuario } = req.body;

  if (!usuario) {
    return res.status(400).send('Usuario no proporcionado');
  }

  try {
    await sql.connect(dbConfig);
    const result = await sql.query`
      SELECT Usuario AS usuario, NombreCompleto AS nombre, Correo AS correo, Rol AS rol, FechaRegistro AS fechaIngreso, Firma
      FROM Usuarios
      WHERE Usuario = ${usuario} AND Estado = 1
    `;

    if (result.recordset.length === 0) {
      return res.status(404).send('Usuario no encontrado');
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error en /api/mis-datos:', err);
    res.status(500).send('Error en el servidor');
  }
});

// Crear contraseña por primera vez
app.post('/api/crear-clave', async (req, res) => {
  const { usuario, nuevaClave } = req.body;

  if (!usuario || !nuevaClave) {
    return res.status(400).send('Datos incompletos');
  }

  try {
    await sql.connect(dbConfig);
    const result = await sql.query`
      UPDATE Usuarios
      SET Clave = ${nuevaClave}
      WHERE Usuario = ${usuario} AND Clave = '' AND Estado = 1
    `;

    if (result.rowsAffected[0] === 0) {
      return res.status(400).send('Usuario no válido o ya tiene contraseña');
    }

    res.status(200).json({ mensaje: 'Contraseña creada exitosamente' });
  } catch (err) {
    console.error('Error en /api/crear-clave:', err);
    res.status(500).send('Error en el servidor');
  }
});

// Agregar usuario con firma digital
app.post('/api/agregar-usuario', upload.single("firma"), async (req, res) => {
  const {
    usuario,
    primerNombre,
    segundoNombre,
    primerApellido,
    segundoApellido,
    tercerApellido,
    correo,
    rol,
    fechaIngreso
  } = req.body;

  if (!usuario || !primerNombre || !primerApellido || !correo || !rol || !fechaIngreso) {
    return res.status(400).send('Faltan campos obligatorios');
  }

  if (!req.file) {
    console.error("No se recibió archivo de firma.");
    return res.status(400).send("No se recibió archivo de firma.");
  }

  const nombreCompleto = `${primerNombre} ${segundoNombre || ''} ${primerApellido} ${segundoApellido || ''} ${tercerApellido || ''}`.trim();
  const fechaHora = new Date(fechaIngreso); // ← formato ISO
  const firmaNombre = req.file.filename; // ← solo el nombre del archivo

  console.log("Datos recibidos para registro:", req.body);
  console.log("Nombre de firma:", firmaNombre);

  try {
    await sql.connect(dbConfig);
    const resultado = await sql.query`
      INSERT INTO Usuarios (Usuario, NombreCompleto, Correo, Rol, FechaRegistro, Clave, Firma, Estado)
      VALUES (
        ${usuario},
        ${nombreCompleto},
        ${correo},
        ${rol},
        ${fechaHora},
        '',
        ${firmaNombre},
        1
      )
    `;

    if (resultado.rowsAffected[0] === 0) {
      console.warn("⚠️ El INSERT no afectó ninguna fila.");
      return res.status(400).json({ mensaje: "No se pudo registrar el usuario. Verifica si ya existe." });
    }

    console.log("✅ Usuario registrado correctamente.");
    res.status(200).json({ mensaje: 'Usuario registrado exitosamente' });
  } catch (err) {
    console.error('❌ Error en /api/agregar-usuario:', err);
    res.status(500).send('Error al registrar usuario');
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
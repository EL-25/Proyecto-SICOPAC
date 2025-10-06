const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sql = require('mssql');

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

// Ruta de login
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

// Ruta para ver los datos del usuario autenticado
app.post('/api/mis-datos', async (req, res) => {
  const { usuario } = req.body;

  if (!usuario) {
    return res.status(400).send('Usuario no proporcionado');
  }

  try {
    await sql.connect(dbConfig);

    const result = await sql.query`
      SELECT Usuario AS usuario, NombreCompleto AS nombre, Correo AS correo, Rol AS rol, FechaRegistro AS fechaIngreso
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

// Ruta para crear contraseña por primera vez
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

    res.send('Contraseña creada exitosamente');
  } catch (err) {
    console.error('Error en /api/crear-clave:', err);
    res.status(500).send('Error en el servidor');
  }
});

app.post('/api/agregar-usuario', async (req, res) => {
  const {
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
  } = req.body;

  if (!usuario || !primerNombre || !primerApellido || !correo || !rol || !fechaIngreso || !horaIngreso || !firma) {
    return res.status(400).send('Faltan campos obligatorios');
  }

  const nombreCompleto = `${primerNombre} ${segundoNombre || ''} ${primerApellido} ${segundoApellido || ''} ${tercerApellido || ''}`.trim();
  const fechaHora = `${fechaIngreso} ${horaIngreso}`;

  console.log("Datos recibidos para registro:", req.body);

  try {
    await sql.connect(dbConfig);

    await sql.query`
      INSERT INTO Usuarios (Usuario, NombreCompleto, Correo, Rol, FechaRegistro, Clave, Firma, Estado)
      VALUES (
        ${usuario},
        ${nombreCompleto},
        ${correo},
        ${rol},
        ${fechaHora},
        '', -- Clave vacía, se llenará luego
        ${firma},
        1 -- Estado activo
      )
    `;

    res.send('Usuario registrado exitosamente');
  } catch (err) {
    console.error('Error en /api/agregar-usuario:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).send('Error al registrar usuario');
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sql = require('mssql');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 3000;

// ==============================
// CONFIGURACIONES
// ==============================

// Motor de vistas EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Configuración de conexión a SQL Server
const dbConfig = {
  user: 'sa',
  password: 'EdwinBD31',
  server: 'localhost',
  database: 'SistemaAlcaldia',
  options: {
    port: 1433,
    encrypt: false,
    trustServerCertificate: true,
    connectionTimeout: 30000,
    requestTimeout: 30000
  }
};

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/img/firma', express.static(path.join(__dirname, 'img/firma')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use(express.static(path.join(__dirname, 'public')));

// Redirección institucional desde raíz
app.get("/", (req, res) => {
  res.redirect("/login.html");
});

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

// ==============================
// RUTAS API
// ==============================

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
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { usuario, clave } = req.body;

  try {
    await sql.connect(dbConfig);
    const result = await sql.query`
      SELECT * FROM Usuarios WHERE Usuario = ${usuario} AND Estado = 1
    `;
    const user = result.recordset[0];

    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
    if (user.Clave !== clave) return res.status(401).json({ error: 'Contraseña incorrecta' });

    res.status(200).json({
      nombre: user.NombreCompleto,
      rol: user.Rol
    });
  } catch (err) {
    console.error('Error en el login:', err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Datos del usuario autenticado
app.post('/api/mis-datos', async (req, res) => {
  const { usuario } = req.body;

  if (!usuario) {
    return res.status(400).json({ error: 'Usuario no proporcionado' });
  }

  try {
    await sql.connect(dbConfig);
    const result = await sql.query`
      SELECT Usuario AS usuario, NombreCompleto AS nombre, Correo AS correo, Rol AS rol, FechaRegistro AS fechaIngreso, Firma
      FROM Usuarios
      WHERE Usuario = ${usuario} AND Estado = 1
    `;

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error en /api/mis-datos:', err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Crear contraseña por primera vez
app.post('/api/crear-clave', async (req, res) => {
  const { usuario, nuevaClave } = req.body;

  if (!usuario || !nuevaClave) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  try {
    await sql.connect(dbConfig);
    const result = await sql.query`
      UPDATE Usuarios
      SET Clave = ${nuevaClave}
      WHERE Usuario = ${usuario} AND Clave = '' AND Estado = 1
    `;

    if (result.rowsAffected[0] === 0) {
      return res.status(400).json({ error: 'Usuario no válido o ya tiene contraseña' });
    }

    res.status(200).json({ mensaje: 'Contraseña creada exitosamente' });
  } catch (err) {
    console.error('Error en /api/crear-clave:', err);
    res.status(500).json({ error: 'Error en el servidor' });
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
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  if (!req.file) {
    console.error("No se recibió archivo de firma.");
    return res.status(400).json({ error: "No se recibió archivo de firma." });
  }

  const nombreCompleto = `${primerNombre} ${segundoNombre || ''} ${primerApellido} ${segundoApellido || ''} ${tercerApellido || ''}`.trim();
  const fechaHora = new Date(fechaIngreso);
  const firmaNombre = req.file.filename;

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
      return res.status(400).json({ error: "No se pudo registrar el usuario. Verifica si ya existe." });
    }

    console.log("✅ Usuario registrado correctamente.");
    res.status(200).json({ mensaje: 'Usuario registrado exitosamente' });
  } catch (err) {
    console.error('❌ Error en /api/agregar-usuario:', err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// Historial de acciones recientes
app.post('/api/acciones', async (req, res) => {
  const { usuario } = req.body;

  if (!usuario) {
    return res.status(400).json({ error: 'Usuario no proporcionado' });
  }

  try {
    await sql.connect(dbConfig);
    const result = await sql.query`
      SELECT TOP 20
        Usuario,
        Declaracion,
        CodigoFormulario,
        Municipio,
        Distrito,
        FechaHoraLocal
      FROM Acciones
      WHERE Usuario = ${usuario}
      ORDER BY Id DESC
    `;
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error en /api/acciones:", err);
    res.status(500).json({ error: "Error al obtener historial de acciones" });
  }
});
// Filtrar formularios
app.post("/api/filtrar", async (req, res) => {
  const {
    numeroFormulario,
    declaracion,
    distrito,
    municipio,
    primerApellidoPadre,
    primerApellidoMadre,
    fechaInicio,
    fechaFin
  } = req.body;

  try {
    await sql.connect(dbConfig);

    let query = "SELECT * FROM Formularios WHERE 1=1";

    if (numeroFormulario) {
      query += ` AND NumeroFormulario = '${numeroFormulario}'`;
    }
    if (declaracion) {
      query += ` AND Declaraciones = '${declaracion}'`;
    }
    if (distrito) {
      query += ` AND Distrito = '${distrito}'`;
    }
    if (municipio) {
      query += ` AND Municipio = '${municipio}'`;
    }
    if (primerApellidoPadre) {
      query += ` AND PrimerApellidoPadre LIKE '%${primerApellidoPadre}%'`;
    }
    if (primerApellidoMadre) {
      query += ` AND PrimerApellidoMadre LIKE '%${primerApellidoMadre}%'`;
    }
    if (fechaInicio && fechaFin) {
      query += ` AND FechaPresentacion BETWEEN '${fechaInicio}' AND '${fechaFin}'`;
    }

    const result = await sql.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error en /api/filtrar:", err);
    res.status(500).json({ error: "Error al filtrar formularios" });
  }
});

// ==============================
// FORMULARIO EJS
// ==============================

// Generador de códigos de formularios
let contadorFormularios = 1;
function generarCodigoFormulario() {
  const año = new Date().getFullYear();
  const correlativo = String(contadorFormularios++).padStart(5, "0");
  return `LLE-${año}-${correlativo}`;
}

// Página 1 del formulario
app.get("/formulario", (req, res) => {
  const codigo = generarCodigoFormulario();
  const usuario = req.query.usuario || "Desconocido";
  res.render("index", { codigo, usuario });
});

// Página 2 del formulario
app.post("/page2", (req, res) => {
  res.render("page2", { page1Data: req.body });
});

// Vista previa / resumen final
app.post("/preview", (req, res) => {
  const allData = {
    ...req.body,
    ...req.body.page1Data
  };
  res.render("pdf-preview", { data: allData });
});

// Guardar datos finales y mostrar vista previa
app.post("/guardar", async (req, res) => {
  console.log("📥 Datos recibidos en /guardar:", req.body);

  try {
    await sql.connect(dbConfig);

    // Corregir campo usuario si viene como array
    const usuario = Array.isArray(req.body.usuario) ? req.body.usuario[0] : req.body.usuario;

    await sql.query`
  INSERT INTO Formularios (
    PrimerNombre,
    SegundoNombre,
    PrimerApellido,
    SegundoApellido,
    TercerApellido,
    PrimerNombreTitular,
    SegundoNombreTitular,
    PrimerApellidoTitular,
    SegundoApellidoTitular,
    TercerApellidoTitular,
    PrimerNombrePadre,
    SegundoNombrePadre,
    PrimerApellidoPadre,
    SegundoApellidoPadre,
    PrimerNombreMadre,
    SegundoNombreMadre,
    PrimerApellidoMadre,
    SegundoApellidoMadre,
    TercerApellidoMadre,
    Municipio,
    Distrito,
    Canton,
    Colonia,
    Calle,
    NumeroCasa,
    LugarHecho,
    FechaPresentacion,
    HoraPresentacion,
    Telefono,
    Correo,
    Declaraciones,
    DescripcionDocumentacion
  )
  VALUES (
    ${req.body.primerNombre},
    ${req.body.segundoNombre || null},
    ${req.body.primerApellido},
    ${req.body.segundoApellido || null},
    ${req.body.tercerApellido || null},
    ${req.body.primerNombreTitular},
    ${req.body.segundoNombreTitular || null},
    ${req.body.primerApellidoTitular},
    ${req.body.segundoApellidoTitular || null},
    ${req.body.tercerApellidoTitular || null},
    ${req.body.primerNombrePadre},
    ${req.body.segundoNombrePadre || null},
    ${req.body.primerApellidoPadre},
    ${req.body.segundoApellidoPadre || null},
    ${req.body.primerNombreMadre},
    ${req.body.segundoNombreMadre || null},
    ${req.body.primerApellidoMadre},
    ${req.body.segundoApellidoMadre || null},
    ${req.body.tercerApellidoMadre || null},
    ${req.body.municipio},
    ${req.body.distrito},
    ${req.body.canton || null},
    ${req.body.colonia || null},
    ${req.body.calle || null},
    ${req.body.numeroCasa || null},
    ${req.body.lugarHecho || null},
    ${req.body.fechaPresentacion},
    ${req.body.horaPresentacion},
    ${req.body.telefono},
    ${req.body.correo},
    ${req.body.declaracion},
    ${[...(req.body.doc || []), ...(req.body.doc2 || [])].join(", ")}
  )
`;
    // Usar el código generado previamente en la página 1
    const numeroFormulario = req.body.codigoFormulario;

    // Registrar acción en la tabla Acciones
    await sql.query`
      INSERT INTO Acciones (
        Usuario,
        TipoAccion,
        Declaracion,
        CodigoFormulario,
        Municipio,
        Distrito,
        FechaHoraLocal
      )
      VALUES (
        ${usuario},
        'Formulario enviado',
        ${req.body.declaracion},
        ${numeroFormulario},
        ${req.body.municipio},
        ${req.body.distrito},
        ${req.body.fechaHoraLocal}
      )
    `;

    // Agregar el número al objeto de datos para la vista
    const datosConCodigo = {
      ...req.body,
      codigoFormulario: numeroFormulario
    };

    res.render("pdf-preview", { data: datosConCodigo });

  } catch (err) {
    console.error("❌ Error al guardar el formulario:", err);
    res.status(500).send("Error al guardar el formulario");
  }
});

// ==============================
// INICIAR SERVIDOR
// ==============================
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});

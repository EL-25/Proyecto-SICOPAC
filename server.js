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
  res.render("index", {
    modo: "nuevo",
    data: {
      codigoFormulario: codigo,
      usuario
    }
  });
});

// Página 2 del formulario
app.post("/page2", (req, res) => {
  const page1Data = req.body;

  res.render("page2", {
    modo: "nuevo",
    data: page1Data   // ← ahora todo se accede como data.xxx en page2.ejs
  });
});

// Vista previa / resumen final
app.post("/preview", (req, res) => {
  const allData = req.body; // todo ya viene en req.body
  res.render("pdf-preview", { data: allData });
});

// Guardar datos finales y mostrar vista previa
app.post("/guardar", async (req, res) => {
  console.log("📥 Datos recibidos en /guardar:", req.body);

  // Función para normalizar valores que llegan como array
  const normalizar = v => Array.isArray(v) ? v[0] : v || null;

  try {
    await sql.connect(dbConfig);

    // Normalizar todos los campos necesarios
    const datos = {
  codigoFormulario: normalizar(req.body.codigoFormulario),
  usuario: normalizar(req.body.usuario),
  refLLE: normalizar(req.body.refLLE),
  municipio: normalizar(req.body.municipio),
  distrito: normalizar(req.body.distrito),
  lugarPresentacion: normalizar(req.body.lugarPresentacion),
  fechaPresentacion: normalizar(req.body.fechaPresentacion),
  horaPresentacion: normalizar(req.body.horaPresentacion),
  contacto: normalizar(req.body.contacto),
  plazo: normalizar(req.body.plazo),
  docTipo: normalizar(req.body.docTipo),
  dui: normalizar(req.body.dui),
  pasaporte: normalizar(req.body.pasaporte),
  otroDoc: normalizar(req.body.otroDoc),
  primerNombre: normalizar(req.body.primerNombre),
  segundoNombre: normalizar(req.body.segundoNombre),
  primerApellido: normalizar(req.body.primerApellido),
  segundoApellido: normalizar(req.body.segundoApellido),
  tercerApellido: normalizar(req.body.tercerApellido),
  canton: normalizar(req.body.canton),
  colonia: normalizar(req.body.colonia),
  calle: normalizar(req.body.calle),
  numeroCasa: normalizar(req.body.numeroCasa),
  titular: normalizar(req.body.titular),
  telefono: normalizar(req.body.telefono),
  correo: normalizar(req.body.correo),
  caracter: Array.isArray(req.body.caracter) ? req.body.caracter.join(",") : normalizar(req.body.caracter),
  docTitular: normalizar(req.body.docTitular),
  duiTitular: normalizar(req.body.duiTitular),
  nuiTitular: normalizar(req.body.nuiTitular),
  otroTitular: normalizar(req.body.otroTitular),
  fechaHecho: normalizar(req.body.fechaHecho),
  lugarHecho: normalizar(req.body.lugarHecho),
  primerNombreTitular: normalizar(req.body.primerNombreTitular),
  segundoNombreTitular: normalizar(req.body.segundoNombreTitular),
  primerApellidoTitular: normalizar(req.body.primerApellidoTitular),
  segundoApellidoTitular: normalizar(req.body.segundoApellidoTitular),
  tercerApellidoTitular: normalizar(req.body.tercerApellidoTitular),
  primerNombrePadre: normalizar(req.body.primerNombrePadre),
  segundoNombrePadre: normalizar(req.body.segundoNombrePadre),
  primerApellidoPadre: normalizar(req.body.primerApellidoPadre),
  segundoApellidoPadre: normalizar(req.body.segundoApellidoPadre),
  primerNombreMadre: normalizar(req.body.primerNombreMadre),
  segundoNombreMadre: normalizar(req.body.segundoNombreMadre),
  primerApellidoMadre: normalizar(req.body.primerApellidoMadre),
  segundoApellidoMadre: normalizar(req.body.segundoApellidoMadre),
  tercerApellidoMadre: normalizar(req.body.tercerApellidoMadre),
  declaracion: normalizar(req.body.declaracion),
  descripcionDocumentacion: [...(req.body.doc || []), ...(req.body.doc2 || [])].length > 0 
    ? [...(req.body.doc || []), ...(req.body.doc2 || [])].join(", ") 
    : null
};
    // INSERT con columnas y valores alineados
    await sql.query`
      INSERT INTO Formularios (
        NumeroFormulario,
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
        DescripcionDocumentacion,
        RefLLE,
        LugarPresentacion,
        Contacto,
        Plazo,
        DocTipo,
        DUI,
        Pasaporte,
        OtroDoc,
        Titular,
        Caracter,
        DocTitular,
        DuiTitular,
        NuiTitular,
        OtroTitular,
        FechaHecho
      )
      VALUES (
        ${datos.codigoFormulario},
        ${datos.primerNombre},
        ${datos.segundoNombre || null},
        ${datos.primerApellido},
        ${datos.segundoApellido || null},
        ${datos.tercerApellido || null},
        ${datos.primerNombreTitular},
        ${datos.segundoNombreTitular || null},
        ${datos.primerApellidoTitular},
        ${datos.segundoApellidoTitular || null},
        ${datos.tercerApellidoTitular || null},
        ${datos.primerNombrePadre},
        ${datos.segundoNombrePadre || null},
        ${datos.primerApellidoPadre},
        ${datos.segundoApellidoPadre || null},
        ${datos.primerNombreMadre},
        ${datos.segundoNombreMadre || null},
        ${datos.primerApellidoMadre},
        ${datos.segundoApellidoMadre || null},
        ${datos.tercerApellidoMadre || null},
        ${datos.municipio},
        ${datos.distrito},
        ${datos.canton || null},
        ${datos.colonia || null},
        ${datos.calle || null},
        ${datos.numeroCasa || null},
        ${datos.lugarHecho || null},
        ${datos.fechaPresentacion},
        ${datos.horaPresentacion},
        ${datos.telefono},
        ${datos.correo},
        ${datos.declaracion},
        ${datos.descripcionDocumentacion},
        ${datos.refLLE || null},
        ${datos.lugarPresentacion || null},
        ${datos.contacto || null},
        ${datos.plazo || null},
        ${datos.docTipo || null},
        ${datos.dui || null},
        ${datos.pasaporte || null},
        ${datos.otroDoc || null},
        ${datos.titular || null},
        ${datos.caracter},
        ${datos.docTitular || null},
        ${datos.duiTitular || null},
        ${datos.nuiTitular || null},
        ${datos.otroTitular || null},
        ${datos.fechaHecho || null}
      )
    `;

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
        ${datos.usuario},
        'Formulario enviado',
        ${datos.declaracion},
        ${datos.codigoFormulario},
        ${datos.municipio},
        ${datos.distrito},
        ${req.body.fechaHoraLocal}
      )
    `;
    const documentos = [...(req.body.doc || []), ...(req.body.doc2 || [])];
const datosConCodigo = {
  codigoFormulario: datos.codigoFormulario,
  refLLE: datos.refLLE,
  fechaPresentacion: datos.fechaPresentacion,
  horaPresentacion: datos.horaPresentacion,
  fechaHecho: datos.fechaHecho,
  doc: documentos,

  // Campos para vista previa
  municipio: datos.municipio,
  distrito: datos.distrito,
  lugarPresentacion: datos.lugarPresentacion,
  contacto: datos.contacto,
  plazo: datos.plazo,
  docTipo: datos.docTipo,
  dui: datos.dui,
  pasaporte: datos.pasaporte,
  otroDoc: datos.otroDoc,
  titular: datos.titular,
  caracter: datos.caracter,

  // Reconstrucción de nombre completo
  nombreSolicitante: [
    datos.primerNombre,
    datos.segundoNombre,
    datos.primerApellido,
    datos.segundoApellido,
    datos.tercerApellido
  ].filter(Boolean).join(" "),

  // Reconstrucción de domicilio
  domicilio: [
    datos.calle,
    datos.numeroCasa ? `#${datos.numeroCasa}` : null,
    datos.colonia,
    datos.canton
  ].filter(Boolean).join(", "),

  // Teléfono y correo
  telefono: datos.telefono,
  correo: datos.correo,

  // Datos del titular del asiento
  docTitular: datos.docTitular,
  duiTitular: datos.duiTitular,
  nuiTitular: datos.nuiTitular,
  otroTitular: datos.otroTitular,
  primerNombreTitular: datos.primerNombreTitular,
  segundoNombreTitular: datos.segundoNombreTitular,
  primerApellidoTitular: datos.primerApellidoTitular,
  segundoApellidoTitular: datos.segundoApellidoTitular,
  tercerApellidoTitular: datos.tercerApellidoTitular,

  // Lugar y fecha del hecho
  lugarHecho: datos.lugarHecho,

  // Datos de madre y padre
  primerNombreMadre: datos.primerNombreMadre,
  segundoNombreMadre: datos.segundoNombreMadre,
  primerApellidoMadre: datos.primerApellidoMadre,
  segundoApellidoMadre: datos.segundoApellidoMadre,
  tercerApellidoMadre: datos.tercerApellidoMadre,
  primerNombrePadre: datos.primerNombrePadre,
  segundoNombrePadre: datos.segundoNombrePadre,
  primerApellidoPadre: datos.primerApellidoPadre,
  segundoApellidoPadre: datos.segundoApellidoPadre,

  // Declaración solicitada
  declaracion: datos.declaracion
};

res.render("pdf-preview", { data: datosConCodigo });

  } catch (err) {
    console.error("❌ Error al guardar el formulario:", err);
    res.status(500).send("Error al guardar el formulario");
  }
});

// Nuevo formulario → pasar datos de index.ejs a page2.ejs
app.post("/page2", (req, res) => {
  res.render("page2", { 
    data: req.body,
    modo: "nuevo"
  });
});

// Función para normalizar el código del formulario
function normalizarCodigo(v) {
  if (Array.isArray(v)) return v[0];        // Si viene como array, toma el primero
  if (typeof v === 'string') return v.split(',')[0]; // Si viene como string con comas, toma el primero
  return v;
}

// Editar formulario existente (cargar index.ejs con datos)
app.get("/editar-formulario", async (req, res) => {
  const codigo = normalizarCodigo(req.query.codigo);

  try {
    await sql.connect(dbConfig);
    const result = await sql.query`
      SELECT * FROM Formularios WHERE NumeroFormulario = ${codigo}
    `;

    if (result.recordset.length === 0) {
      return res.status(404).send("Formulario no encontrado");
    }

    const f = result.recordset[0];

    res.render("index", {
      modo: "editar",
      data: {
        codigoFormulario: f.NumeroFormulario,
        usuario: f.Usuario,
        refLLE: f.RefLLE,
        municipio: f.Municipio,
        distrito: f.Distrito,
        lugarPresentacion: f.LugarPresentacion,
        fechaPresentacion: f.FechaPresentacion,
        horaPresentacion: f.HoraPresentacion,
        contacto: f.Contacto,
        plazo: f.Plazo,
        docTipo: f.DocTipo,
        dui: f.DUI,
        pasaporte: f.Pasaporte,
        otroDoc: f.OtroDoc,
        primerNombre: f.PrimerNombre,
        segundoNombre: f.SegundoNombre,
        primerApellido: f.PrimerApellido,
        segundoApellido: f.SegundoApellido,
        tercerApellido: f.TercerApellido,
        canton: f.Canton,
        colonia: f.Colonia,
        calle: f.Calle,
        numeroCasa: f.NumeroCasa,
        titular: f.Titular,
        caracter: f.Caracter ? f.Caracter.split(",") : [],
        telefono: f.Telefono,
        correo: f.Correo,
        fechaHecho: f.FechaHecho,
        docTitular: f.DocTitular,
        duiTitular: f.DuiTitular,
        nuiTitular: f.NuiTitular,
        otroTitular: f.OtroTitular
      }
    });
  } catch (err) {
    console.error("❌ Error en /editar-formulario:", err);
    res.status(500).send("Error al cargar el formulario para edición");
  }
});

// Redirección POST → GET para edición
app.post("/editar-formulario-p2", (req, res) => {
  const codigo = normalizarCodigo(req.body.codigoFormulario);
  res.redirect(`/editar-formulario-p2?codigo=${codigo}`);
});

// Editar formulario existente (cargar page2.ejs con datos)
app.get("/editar-formulario-p2", async (req, res) => {
  const codigo = normalizarCodigo(req.query.codigo);

  try {
    await sql.connect(dbConfig);
    const result = await sql.query`
      SELECT * FROM Formularios WHERE NumeroFormulario = ${codigo}
    `;

    if (result.recordset.length === 0) {
      return res.status(404).send("Formulario no encontrado");
    }

    const f = result.recordset[0];

    // Separar documentación en dos grupos (doc y doc2)
    const allDocs = f.DescripcionDocumentacion
      ? f.DescripcionDocumentacion.split(", ")
      : [];

    const doc2Items = [
      "Fecha Médica de Nacimiento",
      "Testimonio de Escritura Pública",
      "Certificación de Sentencia Ejecutoriada",
      "Certificación de Línea Legal",
      "Certificado Médico de Defunción",
      "Autorización de juez",
      "Hecho en extranjero",
      "Resolución Administrativa",
      "Resolución Judicial"
    ];

    const doc2 = allDocs.filter(d => doc2Items.includes(d));
    const doc = allDocs.filter(d => !doc2Items.includes(d));

    res.render("page2", {
      data: {
        numeroFormulario: f.NumeroFormulario,
        primerNombreTitular: f.PrimerNombreTitular,
        segundoNombreTitular: f.SegundoNombreTitular,
        primerApellidoTitular: f.PrimerApellidoTitular,
        segundoApellidoTitular: f.SegundoApellidoTitular,
        tercerApellidoTitular: f.TercerApellidoTitular,
        docTitular: f.DocTitular,
        duiTitular: f.DuiTitular,
        nuiTitular: f.NuiTitular,
        otroTitular: f.OtroTitular,
        lugarHecho: f.LugarHecho,
        fechaHecho: f.FechaHecho,
        fechaPresentacion: f.FechaPresentacion,
        horaPresentacion: f.HoraPresentacion,
        primerNombrePadre: f.PrimerNombrePadre,
        segundoNombrePadre: f.SegundoNombrePadre,
        primerApellidoPadre: f.PrimerApellidoPadre,
        segundoApellidoPadre: f.SegundoApellidoPadre,
        primerNombreMadre: f.PrimerNombreMadre,
        segundoNombreMadre: f.SegundoNombreMadre,
        primerApellidoMadre: f.PrimerApellidoMadre,
        segundoApellidoMadre: f.SegundoApellidoMadre,
        tercerApellidoMadre: f.TercerApellidoMadre,
        declaracion: f.Declaraciones,
        doc,
        doc2,
        telefono: f.Telefono,
        correo: f.Correo
      },
      modo: "editar"
    });
  } catch (err) {
    console.error("❌ Error en /editar-formulario-p2:", err);
    res.status(500).send("Error al cargar la página 2 para edición");
  }
});

// Actualizar formulario existente
app.post("/actualizar", async (req, res) => {
  try {
    await sql.connect(dbConfig);

    const normalizar = v => Array.isArray(v) ? v[0] : v || null;

    // Fechas y horas
    const fechaPresentacionRaw = normalizar(req.body.fechaPresentacion);
    const fechaHechoRaw = normalizar(req.body.fechaHecho);
    const horaPresentacionRaw = normalizar(req.body.horaPresentacion);

    const fechaPresentacion = fechaPresentacionRaw
      ? new Date(fechaPresentacionRaw).toISOString().slice(0, 10)
      : null;

    const fechaHecho = fechaHechoRaw
      ? new Date(fechaHechoRaw).toISOString().slice(0, 10)
      : null;

    const horaPresentacion = horaPresentacionRaw
      ? (() => {
          const base = horaPresentacionRaw.split(",")[0].trim();
          if (/^\d{2}:\d{2}:\d{2}$/.test(base)) return base;
          if (/^\d{2}:\d{2}$/.test(base)) return base + ":00";
          return null;
        })()
      : null;

    // RefLLE ahora es texto (NVARCHAR)
    const refLLE = normalizar(req.body.refLLE);

    // Documentación combinada
    const documentos = [...(req.body.doc || []), ...(req.body.doc2 || [])];
    const descripcionDocumentacion = documentos.length > 0 ? documentos.join(", ") : null;

    await sql.query`
      UPDATE Formularios
      SET
        PrimerNombre = ${normalizar(req.body.primerNombre)},
        SegundoNombre = ${normalizar(req.body.segundoNombre)},
        PrimerApellido = ${normalizar(req.body.primerApellido)},
        SegundoApellido = ${normalizar(req.body.segundoApellido)},
        TercerApellido = ${normalizar(req.body.tercerApellido)},
        PrimerNombreTitular = ${normalizar(req.body.primerNombreTitular)},
        SegundoNombreTitular = ${normalizar(req.body.segundoNombreTitular)},
        PrimerApellidoTitular = ${normalizar(req.body.primerApellidoTitular)},
        SegundoApellidoTitular = ${normalizar(req.body.segundoApellidoTitular)},
        TercerApellidoTitular = ${normalizar(req.body.tercerApellidoTitular)},
        PrimerNombrePadre = ${normalizar(req.body.primerNombrePadre)},
        SegundoNombrePadre = ${normalizar(req.body.segundoNombrePadre)},
        PrimerApellidoPadre = ${normalizar(req.body.primerApellidoPadre)},
        SegundoApellidoPadre = ${normalizar(req.body.segundoApellidoPadre)},
        PrimerNombreMadre = ${normalizar(req.body.primerNombreMadre)},
        SegundoNombreMadre = ${normalizar(req.body.segundoNombreMadre)},
        PrimerApellidoMadre = ${normalizar(req.body.primerApellidoMadre)},
        SegundoApellidoMadre = ${normalizar(req.body.segundoApellidoMadre)},
        TercerApellidoMadre = ${normalizar(req.body.tercerApellidoMadre)},
        Distrito = ${normalizar(req.body.distrito)},
        Canton = ${normalizar(req.body.canton)},
        Colonia = ${normalizar(req.body.colonia)},
        Calle = ${normalizar(req.body.calle)},
        NumeroCasa = ${normalizar(req.body.numeroCasa)},
        LugarHecho = ${normalizar(req.body.lugarHecho)},
        FechaPresentacion = ${fechaPresentacion},
        HoraPresentacion = ${horaPresentacion},
        Telefono = ${normalizar(req.body.telefono)},
        Correo = ${normalizar(req.body.correo)},
        Declaraciones = ${normalizar(req.body.declaracion)},
        DescripcionDocumentacion = ${descripcionDocumentacion},
        RefLLE = ${refLLE},
        LugarPresentacion = ${normalizar(req.body.lugarPresentacion)},
        Contacto = ${normalizar(req.body.contacto)},
        Plazo = ${normalizar(req.body.plazo)},
        DocTipo = ${normalizar(req.body.docTipo)},
        DUI = ${normalizar(req.body.dui)},
        Pasaporte = ${normalizar(req.body.pasaporte)},
        OtroDoc = ${normalizar(req.body.otroDoc)},
        Titular = ${normalizar(req.body.titular)},
        Caracter = ${Array.isArray(req.body.caracter) ? [...new Set(req.body.caracter)].join(",") : normalizar(req.body.caracter)},
        DocTitular = ${normalizar(req.body.docTitular)},
        DuiTitular = ${normalizar(req.body.duiTitular)},
        NuiTitular = ${normalizar(req.body.nuiTitular)},
        OtroTitular = ${normalizar(req.body.otroTitular)},
        FechaHecho = ${fechaHecho}
      WHERE NumeroFormulario = ${normalizar(req.body.codigoFormulario)}
    `;

    const datosConCodigo = {
      codigoFormulario: normalizar(req.body.codigoFormulario),
      refLLE,
      fechaPresentacion,
      horaPresentacion,
      fechaHecho,
      doc: documentos,
      municipio: normalizar(req.body.municipio),
      distrito: normalizar(req.body.distrito),
      lugarPresentacion: normalizar(req.body.lugarPresentacion),
      contacto: normalizar(req.body.contacto),
      plazo: normalizar(req.body.plazo),
      docTipo: normalizar(req.body.docTipo),
      dui: normalizar(req.body.dui),
      pasaporte: normalizar(req.body.pasaporte),
      otroDoc: normalizar(req.body.otroDoc),
      titular: normalizar(req.body.titular),
      caracter: Array.isArray(req.body.caracter) ? [...new Set(req.body.caracter)].join(",") : normalizar(req.body.caracter),
      nombreSolicitante: [
        normalizar(req.body.primerNombre),
        normalizar(req.body.segundoNombre),
        normalizar(req.body.primerApellido),
        normalizar(req.body.segundoApellido),
        normalizar(req.body.tercerApellido)
      ].filter(Boolean).join(" "),
      domicilio: [
        normalizar(req.body.calle),
        normalizar(req.body.numeroCasa) ? `#${normalizar(req.body.numeroCasa)}` : null,
        normalizar(req.body.colonia),
        normalizar(req.body.canton)
      ].filter(Boolean).join(", "),
      telefono: normalizar(req.body.telefono),
      correo: normalizar(req.body.correo),
      docTitular: normalizar(req.body.docTitular),
      duiTitular: normalizar(req.body.duiTitular),
      nuiTitular: normalizar(req.body.nuiTitular),
      otroTitular: normalizar(req.body.otroTitular),
      primerNombreTitular: normalizar(req.body.primerNombreTitular),
      segundoNombreTitular: normalizar(req.body.segundoNombreTitular),
      primerApellidoTitular: normalizar(req.body.primerApellidoTitular),
      segundoApellidoTitular: normalizar(req.body.segundoApellidoTitular),
      tercerApellidoTitular: normalizar(req.body.tercerApellidoTitular),
      lugarHecho: normalizar(req.body.lugarHecho),
      primerNombreMadre: normalizar(req.body.primerNombreMadre),
      segundoNombreMadre: normalizar(req.body.segundoNombreMadre),
      primerApellidoMadre: normalizar(req.body.primerApellidoMadre),
      segundoApellidoMadre: normalizar(req.body.segundoApellidoMadre),
      tercerApellidoMadre: normalizar(req.body.tercerApellidoMadre),
      primerNombrePadre: normalizar(req.body.primerNombrePadre),
      segundoNombrePadre: normalizar(req.body.segundoNombrePadre),
      primerApellidoPadre: normalizar(req.body.primerApellidoPadre),
      segundoApellidoPadre: normalizar(req.body.segundoApellidoPadre),
      declaracion: normalizar(req.body.declaracion)
    };
    res.render("pdf-preview", { data: datosConCodigo });
  } catch (err) {
    console.error("❌ Error en /actualizar:", err);
    res.status(500).send("Error al actualizar el formulario");
  }
});

// ==============================
// INICIAR SERVIDOR
// ==============================
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});

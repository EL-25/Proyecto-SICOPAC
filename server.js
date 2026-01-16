const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');   // ← usamos pg en lugar de mssql
const multer = require('multer');
const path = require('path');

const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const doc = new GoogleSpreadsheet('1oPWwKFb-bl1tMWtQr43tpNlKWX1G1re4hJn7p1hY8vc');

async function conectarSheets() {
  const auth = new JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  // ✅ Este método sí existe en v5
  await doc.useServiceAccountAuth(auth);

  await doc.loadInfo();
  console.log("✅ Conexión establecida con Google Sheets");
}

const app = express();
const PORT = process.env.PORT || 3000;

// ==============================
// CONFIGURACIONES
// ==============================

// Motor de vistas EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Configuración de conexión a PostgreSQL (Railway)
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: { rejectUnauthorized: false }
});

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
// MAPEO DE DISTRITOS POR ADMINISTRADOR
// ==============================
const distritosPorUsuario = {
  'Roberto_Carcamo': {
    distrito: 'Antiguo Cuscatlán',
    lugar: 'Antiguo Cuscatlán - La Libertad Este'
  },
  'Maria_Gonzalez': {
    distrito: 'Nuevo Cuscatlán',
    lugar: 'Nuevo Cuscatlán - La Libertad Este'
  },
  'Roxana_Reyes': {
    distrito: 'Zaragoza',
    lugar: 'Zaragoza - La Libertad Este'
  },
  'Sandra_Flores': {
    distrito: 'Huizúcar',
    lugar: 'Huizúcar - La Libertad Este'
  },
  'Zulma_Argueta': {
    distrito: 'San José Villanueva',
    lugar: 'San José Villanueva - La Libertad Este'
  }
};

// ==============================
// RUTAS API
// ==============================

// Verificar si el usuario ya existe
app.post('/api/verificar-usuario', async (req, res) => {
  const { usuario } = req.body;
  try {
    const result = await pool.query(
      'SELECT COUNT(*) AS total FROM "Usuarios" WHERE "Usuario" = $1',
      [usuario]
    );
    res.json({ existe: parseInt(result.rows[0].total) > 0 });
  } catch (err) {
    console.error("Error en /api/verificar-usuario:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// ==============================
// Login
// ==============================
app.post('/api/login', async (req, res) => {
  const { Usuario, Clave } = req.body;
  console.log('📥 Datos recibidos en login:', req.body);

  try {
    const result = await pool.query(
      `SELECT "Usuario" AS usuario,
              "Clave" AS clave,
              "NombreCompleto" AS nombrecompleto,
              "Rol" AS rol
       FROM "Usuarios"
       WHERE "Usuario" = $1 AND "Estado" = true`,
      [Usuario]
    );

    console.log('📤 Resultado de consulta:', result.rows);

    const user = result.rows[0];

    if (!user) {
      console.warn('⚠️ Usuario no encontrado');
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    if (user.clave !== Clave) {
      console.warn(`⚠️ Contraseña incorrecta: esperada "${user.clave}", recibida "${Clave}"`);
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    console.log('✅ Login exitoso:', user.usuario);
    res.status(200).json({
      nombre: user.nombrecompleto,
      rol: user.rol
    });
  } catch (err) {
    console.error('❌ Error en el login:', err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Datos del usuario autenticado
app.post('/api/mis-datos', async (req, res) => {
  const { usuario } = req.body;
  if (!usuario) return res.status(400).json({ error: 'Usuario no proporcionado' });

  try {
    const result = await pool.query(
      `SELECT "Usuario" AS usuario, "NombreCompleto" AS nombre, "Correo" AS correo, 
              "Rol" AS rol, "FechaRegistro" AS fechaIngreso, "Firma" AS firma
       FROM "Usuarios"
       WHERE "Usuario" = $1 AND "Estado" = true`,
      [usuario]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error en /api/mis-datos:', err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Crear contraseña por primera vez
app.post('/api/crear-clave', async (req, res) => {
  const { usuario, nuevaClave } = req.body;
  if (!usuario || !nuevaClave) return res.status(400).json({ error: 'Datos incompletos' });

  try {
    const result = await pool.query(
      `UPDATE "Usuarios"
       SET "Clave" = $2
       WHERE "Usuario" = $1 AND "Clave" = '' AND "Estado" = true`,
      [usuario, nuevaClave]
    );

    if (result.rowCount === 0) {
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
  if (!req.file) return res.status(400).json({ error: "No se recibió archivo de firma." });

  const nombreCompleto = `${primerNombre} ${segundoNombre || ''} ${primerApellido} ${segundoApellido || ''} ${tercerApellido || ''}`.trim();
  const fechaHora = new Date(fechaIngreso);
  const firmaNombre = req.file.filename;

  try {
    await pool.query(
      `INSERT INTO "Usuarios" ("Usuario","NombreCompleto","Correo","Rol","FechaRegistro","Clave","Firma","Estado","CreadoPor")
      VALUES ($1,$2,$3,$4,$5,'',$6,true,$7)`,
      [usuario, nombreCompleto, correo, rol, fechaHora, firmaNombre, req.body.creadoPor]
    );

    res.status(200).json({ mensaje: 'Usuario registrado exitosamente' });
  } catch (err) {
    console.error('❌ Error en /api/agregar-usuario:', err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// ==============================
// Actualizar datos de usuario
// ==============================
app.post('/api/actualizar-usuario', async (req, res) => {
  const { usuario, correo, rol, nuevoUsuario, clave } = req.body;

  if (!usuario || !correo || !rol || !clave) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const query = `
      UPDATE "Usuarios"
      SET "Usuario" = $1,
          "Correo" = $2,
          "Rol" = $3,
          "Clave" = $4
      WHERE "Usuario" = $5 AND "Estado" = true
    `;
    const params = [nuevoUsuario || usuario, correo, rol, clave, usuario];

    const result = await pool.query(query, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado o inactivo' });
    }

    res.status(200).json({ mensaje: 'Usuario actualizado correctamente' });
  } catch (err) {
    console.error('❌ Error en /api/actualizar-usuario:', err);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// Historial de acciones recientes
app.post('/api/acciones', async (req, res) => {
  const { usuario, rol } = req.body;
  if (!usuario || !rol) {
    return res.status(400).json({ error: 'Datos insuficientes' });
  }

  try {
    let result;

    // Ordenar por número final del formulario (ej. 00010 > 00001)
    const ordenamiento = `
      ORDER BY CAST(SUBSTRING("CodigoFormulario" FROM '[0-9]+$') AS INTEGER) DESC
    `;

    if (rol === "Administrador") {
      // Administrador ve todos los formularios
      result = await pool.query(
        `SELECT "Usuario","Declaracion","CodigoFormulario","Municipio","Distrito","FechaHoraLocal"
         FROM "Acciones"
         ${ordenamiento}
         LIMIT 50`
      );
    } else {
      // Otros roles ven solo sus formularios
      result = await pool.query(
        `SELECT "Usuario","Declaracion","CodigoFormulario","Municipio","Distrito","FechaHoraLocal"
         FROM "Acciones"
         WHERE "Usuario" = $1
         ${ordenamiento}
         LIMIT 20`,
        [usuario]
      );
    }

    res.json(result.rows);
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
    fechaFin,
    usuario,
    rol
  } = req.body;

  try {
    let query = `
      SELECT "CreadoPor" AS "Usuario",
             "NumeroFormulario","Declaraciones",
             "Distrito","Municipio","FechaPresentacion"
      FROM "Formularios"
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    // Si no es administrador, limitar a sus propios formularios
    if (rol !== "Administrador") {
      query += ` AND "CreadoPor" = $${idx++}`;
      params.push(usuario);
    }

    // Si es administrador y se ingresó un usuario en el filtro 
    if (rol === "Administrador" && usuario) { 
      query += ` AND "CreadoPor" = $${idx++}`; 
      params.push(usuario); 
    }

    if (numeroFormulario) {
      query += ` AND "NumeroFormulario" = $${idx++}`;
      params.push(numeroFormulario);
    }
    if (declaracion) {
      query += ` AND "Declaraciones" = $${idx++}`;
      params.push(declaracion);
    }
    if (distrito) {
      query += ` AND "Distrito" = $${idx++}`;
      params.push(distrito);
    }
    if (municipio) {
      query += ` AND "Municipio" = $${idx++}`;
      params.push(municipio);
    }
    if (primerApellidoPadre) {
      query += ` AND "PrimerApellidoPadre" ILIKE $${idx++}`;
      params.push(`%${primerApellidoPadre}%`);
    }
    if (primerApellidoMadre) {
      query += ` AND "PrimerApellidoMadre" ILIKE $${idx++}`;
      params.push(`%${primerApellidoMadre}%`);
    }
    if (fechaInicio && fechaFin) {
      query += ` AND "FechaPresentacion" BETWEEN $${idx++} AND $${idx++}`;
      params.push(fechaInicio, fechaFin);
    }

    query += ` ORDER BY "FechaPresentacion" DESC LIMIT 50`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error en /api/filtrar:", err);
    res.status(500).json({ error: "Error al filtrar formularios" });
  }
});

// Generar nuevo código de formulario incremental
app.get("/api/nuevo-codigo", async (req, res) => {
  try {
    const añoActual = new Date().getFullYear();
    const prefijo = `LLE-${añoActual}-`;

    const result = await pool.query(
      `SELECT COUNT(*) AS total FROM "Formularios" WHERE "NumeroFormulario" LIKE $1`,
      [`${prefijo}%`]
    );

    const siguiente = parseInt(result.rows[0].total) + 1;
    const numero = String(siguiente).padStart(5, "0");
    const codigo = `${prefijo}${numero}`;

    res.json({ codigo });
  } catch (err) {
    console.error("❌ Error en /api/nuevo-codigo:", err);
    res.status(500).json({ error: "Error al generar código" });
  }
});

// ==============================
// Gestión de Usuarios
// ==============================

// Obtener todos los usuarios (para gestión)
app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT "Id" AS id,
              "Usuario" AS usuario,
              "NombreCompleto" AS nombre,
              "Correo" AS correo,
              "Rol" AS rol
       FROM "Usuarios"
       WHERE "Estado" = true
       ORDER BY "Id" DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error en /api/usuarios:", err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

// Actualizar usuario
app.post('/api/actualizar-usuario', async (req, res) => {
  const { usuario, nuevoUsuario, correo, rol, clave } = req.body;

  try {
    if (clave && clave.trim() !== "") {
      // Actualizar incluyendo la clave
      await pool.query(
        `UPDATE "Usuarios"
         SET "Usuario" = $1,
             "Correo" = $2,
             "Rol" = $3,
             "Clave" = crypt($4, gen_salt('bf'))
         WHERE "Usuario" = $5`,
        [nuevoUsuario, correo, rol, clave, usuario]
      );
    } else {
      // Actualizar sin tocar la clave
      await pool.query(
        `UPDATE "Usuarios"
         SET "Usuario" = $1,
             "Correo" = $2,
             "Rol" = $3
         WHERE "Usuario" = $4`,
        [nuevoUsuario, correo, rol, usuario]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error al actualizar usuario:", err);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

// Eliminar usuario por ID (hard delete)
app.delete('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM "Usuarios"
       WHERE "Id" = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      // No se encontró ningún usuario con ese Id
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Usuario eliminado definitivamente
    res.json({ success: true, mensaje: "Usuario eliminado definitivamente" });
  } catch (err) {
    console.error("❌ Error en DELETE /api/usuarios/:id:", err);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});

// ==============================
// INICIO DEL SERVIDOR
// ==============================
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});

// ==============================
// RUTA DE ENTRADA AL FORMULARIO (NUEVO)
// ==============================
// Esta ruta abre la PRIMERA página del formulario (index.ejs) en modo nuevo
app.get("/formulario", async (req, res) => {
  const usuarioActual = req.query.usuario || "Invitado";

  try {
    // Buscar datos del usuario en la BD
    const result = await pool.query(
      `SELECT "Rol","CreadoPor" FROM "Usuarios" WHERE "Usuario" = $1 AND "Estado" = true`,
      [usuarioActual]
    );

    let distrito = '';
    let lugar = '';

    if (result.rows.length > 0) {
      const { Rol, CreadoPor } = result.rows[0];

      // Si es administrador → usa su propio distrito
      // Si es trabajador → usa el distrito del administrador que lo creó
      const baseUsuario = Rol === 'Administrador' ? usuarioActual : CreadoPor;

      const datos = distritosPorUsuario[baseUsuario] || { distrito: '', lugar: '' };
      distrito = datos.distrito;
      lugar = datos.lugar;
    }

    // Nueva consulta: obtener todos los usuarios activos
    const usuariosResult = await pool.query(
      `SELECT "Usuario" AS "nombreUsuario" FROM "Usuarios" WHERE "Estado" = true ORDER BY "Usuario" ASC`
    );

    const usuarios = usuariosResult.rows;

    // Render con lista de usuarios incluida
    res.render("index", { 
      modo: "nuevo",
      data: { 
        usuario: usuarioActual,
        distrito,
        lugarPresentacion: lugar
      },
      usuarios //aquí se pasa al EJS
    });
  } catch (err) {
    console.error("❌ Error en /formulario:", err);
    res.status(500).send("Error al cargar formulario");
  }
});

// ==============================
// RUTA PARA LA SEGUNDA PÁGINA DEL FORMULARIO (NUEVO)
// ==============================
// Esta ruta abre directamente la SEGUNDA página (page2.ejs) en modo nuevo
app.post("/page2", (req, res) => {
  res.render("page2", { 
    data: req.body,
    modo: "nuevo",
    modoEdicion: false   //gregado para evitar ReferenceError en page2.ejs
  });
});

// ==============================
// GUARDAR DATOS FINALES Y MOSTRAR VISTA PREVIA
// ==============================
app.post("/guardar", async (req, res) => {
  console.log("📥 Datos recibidos en /guardar:", req.body);

  const normalizar = v => Array.isArray(v) ? v[0] : v || null;

  try {
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

    console.log("👉 Usuario recibido:", datos.usuario); 
    console.log("👉 Código de formulario recibido:", datos.codigoFormulario);

    // Aquí sigue el INSERT en PostgreSQL (segunda parte)
        // INSERT con parámetros en PostgreSQL
    await pool.query(
  `INSERT INTO "Formularios" (
    "NumeroFormulario","PrimerNombre","SegundoNombre","PrimerApellido","SegundoApellido","TercerApellido",
    "PrimerNombreTitular","SegundoNombreTitular","PrimerApellidoTitular","SegundoApellidoTitular","TercerApellidoTitular",
    "PrimerNombrePadre","SegundoNombrePadre","PrimerApellidoPadre","SegundoApellidoPadre",
    "PrimerNombreMadre","SegundoNombreMadre","PrimerApellidoMadre","SegundoApellidoMadre","TercerApellidoMadre",
    "Municipio","Distrito","Canton","Colonia","Calle","NumeroCasa","LugarHecho",
    "FechaPresentacion","HoraPresentacion","Telefono","Correo","Declaraciones","DescripcionDocumentacion",
    "RefLLE","LugarPresentacion","Contacto","Plazo","DocTipo","DUI","Pasaporte","OtroDoc",
    "Titular","Caracter","DocTitular","DuiTitular","NuiTitular","OtroTitular","FechaHecho",
    "CreadoPor"
  ) VALUES (
    $1,$2,$3,$4,$5,$6,
    $7,$8,$9,$10,$11,
    $12,$13,$14,$15,
    $16,$17,$18,$19,$20,
    $21,$22,$23,$24,$25,$26,$27,
    $28,$29,$30,$31,$32,$33,
    $34,$35,$36,$37,$38,$39,$40,$41,
    $42,$43,$44,$45,$46,$47,$48,$49
  )`,
  [
    datos.codigoFormulario, datos.primerNombre, datos.segundoNombre, datos.primerApellido, datos.segundoApellido, datos.tercerApellido,
    datos.primerNombreTitular, datos.segundoNombreTitular, datos.primerApellidoTitular, datos.segundoApellidoTitular, datos.tercerApellidoTitular,
    datos.primerNombrePadre, datos.segundoNombrePadre, datos.primerApellidoPadre, datos.segundoApellidoPadre,
    datos.primerNombreMadre, datos.segundoNombreMadre, datos.primerApellidoMadre, datos.segundoApellidoMadre, datos.tercerApellidoMadre,
    datos.municipio, datos.distrito, datos.canton, datos.colonia, datos.calle, datos.numeroCasa, datos.lugarHecho,
    datos.fechaPresentacion, datos.horaPresentacion, datos.telefono, datos.correo, datos.declaracion, datos.descripcionDocumentacion,
    datos.refLLE, datos.lugarPresentacion, datos.contacto, datos.plazo, datos.docTipo, datos.dui, datos.pasaporte, datos.otroDoc,
    datos.titular, datos.caracter, datos.docTitular, datos.duiTitular, datos.nuiTitular, datos.otroTitular, datos.fechaHecho,
    datos.usuario
  ]
);
    // Registrar acción en la tabla Acciones
    await pool.query(
      `INSERT INTO "Acciones" ("Usuario","TipoAccion","Declaracion","CodigoFormulario","Municipio","Distrito","FechaHoraLocal")
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [datos.usuario, 'Formulario enviado', datos.declaracion, datos.codigoFormulario, datos.municipio, datos.distrito, req.body.fechaHoraLocal]
    );
    
// ==============================
// VOLCADO A GOOGLE SHEETS
// ==============================
await conectarSheets();

// Determinar hoja destino según la declaración
let hojaDestino;
switch (datos.declaracion) {
  case 'Nacimiento': hojaDestino = 'NACIMIENTOS'; break;
  case 'Defuncion': hojaDestino = 'DEFUNCIONES'; break;
  case 'Bodas': hojaDestino = 'BODAS'; break;
  case 'Marginacion Bodas': hojaDestino = 'MAR.BODAS'; break;
  case 'Marginacion Defunciones': hojaDestino = 'MAR.DEFUNCIONES'; break;
  case 'Divorcios C.P.M': hojaDestino = 'DIVORCIOS C.P.M'; break;
  case 'Marginacion Divorcios': hojaDestino = 'MAR.DIVORCIOS'; break;
  case 'Marginacion Viudez': hojaDestino = 'MAR.VIUDEZ'; break;
  case 'REC.Alcaldia': hojaDestino = 'REC.ALCALDIA'; break;
  case 'REC.Notario': hojaDestino = 'REC.NOTARIO'; break;
  case 'Reposiciones': hojaDestino = 'REPO'; break;
  case 'Identidades': hojaDestino = 'IDENTIDADES'; break;
  case 'Adecuaciones': hojaDestino = 'ADECUA'; break;
  case 'Adopciones': hojaDestino = 'ADOP'; break;
  case 'Cancelacion por Recon.': hojaDestino = 'CANC.POR.RECON'; break;
  case 'Union no matrimonial': hojaDestino = 'UNION NO MATRI'; break;
  case 'Nom.Tutor': hojaDestino = 'NOM.TUTOR'; break;
  default: hojaDestino = 'GENERAL';
}

// ✅ Validar que la hoja exista
const hoja = doc.sheetsByTitle[hojaDestino];
if (!hoja) {
  console.error(`❌ No existe la hoja destino: ${hojaDestino}`);
  return res.status(500).send(`Error: No existe la hoja destino ${hojaDestino}`);
}

// Obtener filas
const rows = await hoja.getRows();

// ✅ Validar correlativo vacío
let ultimoCorrelativo = 0;
if (rows.length > 0 && rows[rows.length - 1]['CORRELATIVO']) {
  const ultimoValor = rows[rows.length - 1]['CORRELATIVO'];
  ultimoCorrelativo = parseInt(ultimoValor.split('/')[0]) || 0;
}

const nuevoCorrelativo = String(ultimoCorrelativo + 1).padStart(3, '0') + '/2026';

// Insertar fila en Google Sheets
await hoja.addRow({
  CORRELATIVO: nuevoCorrelativo,
  FECHA: datos.fechaPresentacion,
  'NOMBRE DEL ASENTADO': [
    datos.primerNombre, datos.segundoNombre, datos.primerApellido, datos.segundoApellido, datos.tercerApellido
  ].filter(Boolean).join(" "),
  DISTRITO: datos.distrito,
  DOCUMENTACION: datos.descripcionDocumentacion
});

console.log(`✅ Volcado en hoja ${hojaDestino} con correlativo ${nuevoCorrelativo}`);

    // Construir objeto para vista previa
    const documentos = [...(req.body.doc || []), ...(req.body.doc2 || [])];
    const datosConCodigo = {
      codigoFormulario: datos.codigoFormulario,
      refLLE: datos.refLLE,
      fechaPresentacion: datos.fechaPresentacion,
      horaPresentacion: datos.horaPresentacion,
      fechaHecho: datos.fechaHecho,
      doc: documentos,
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
      nombreSolicitante: [
        datos.primerNombre, datos.segundoNombre, datos.primerApellido, datos.segundoApellido, datos.tercerApellido
      ].filter(Boolean).join(" "),
      domicilio: [
        datos.calle, datos.numeroCasa ? `#${datos.numeroCasa}` : null, datos.colonia, datos.canton
      ].filter(Boolean).join(", "),
      telefono: datos.telefono,
      correo: datos.correo,
      docTitular: datos.docTitular,
      duiTitular: datos.duiTitular,
      nuiTitular: datos.nuiTitular,
      otroTitular: datos.otroTitular,
      primerNombreTitular: datos.primerNombreTitular,
      segundoNombreTitular: datos.segundoNombreTitular,
      primerApellidoTitular: datos.primerApellidoTitular,
      segundoApellidoTitular: datos.segundoApellidoTitular,
      tercerApellidoTitular: datos.tercerApellidoTitular,
      lugarHecho: datos.lugarHecho,
      primerNombreMadre: datos.primerNombreMadre,
      segundoNombreMadre: datos.segundoNombreMadre,
      primerApellidoMadre: datos.primerApellidoMadre,
      segundoApellidoMadre: datos.segundoApellidoMadre,
      tercerApellidoMadre: datos.tercerApellidoMadre,
      primerNombrePadre: datos.primerNombrePadre,
      segundoNombrePadre: datos.segundoNombrePadre,
      primerApellidoPadre: datos.primerApellidoPadre,
      segundoApellidoPadre: datos.segundoApellidoPadre,
      declaracion: datos.declaracion
    };

    // Obtener firma del usuario que llenó el formulario
    const firmaResult = await pool.query(
      `SELECT "Firma" FROM "Usuarios" WHERE LOWER("Usuario") = LOWER($1) AND "Estado" = true`,
      [datos.usuario]
    );

    console.log("👉 Resultado consulta firma:", firmaResult.rows);
    
    let firmaUsuario = null;
    if (firmaResult.rows.length > 0) {
      // Usa encodeURIComponent y URL absoluta como en mis-datos.js
      firmaUsuario = `https://proyecto-sicopac-production.up.railway.app/img/firma/${encodeURIComponent(firmaResult.rows[0].Firma)}`;
    }

    console.log("👉 Ruta construida para firmaUsuario:", firmaUsuario);

    // Agregar la firma al objeto datosConCodigo
    datosConCodigo.firmaUsuario = firmaUsuario;
      
      // Renderizar vista previa con los datos completos (incluyendo la firma)
      res.render("pdf-preview", { 
        data: datosConCodigo,
        modoEdicion: false
      });
    
    } catch (err) {
      console.error("❌ Error al guardar el formulario:", err);
      res.status(500).send("Error al guardar el formulario");
    }
  });

// ==============================
// FUNCIÓN PARA NORMALIZAR EL CÓDIGO DEL FORMULARIO
// ==============================
function normalizarCodigo(v) {
  if (Array.isArray(v)) return v[0];        // Si viene como array, toma el primero
  if (typeof v === 'string') return v.split(',')[0]; // Si viene como string con comas, toma el primero
  return v;
}

// ==============================
// EDITAR FORMULARIO EXISTENTE (CARGAR index.ejs CON DATOS)
// ==============================
app.get("/editar-formulario", async (req, res) => {
  const codigo = normalizarCodigo(req.query.codigo);

  try {
    const result = await pool.query(
      'SELECT * FROM "Formularios" WHERE "NumeroFormulario" = $1',
      [codigo]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Formulario no encontrado");
    }

    const f = result.rows[0];

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

// ==============================
// REDIRECCIÓN POST → GET PARA EDICIÓN
// ==============================
app.post("/editar-formulario-p2", (req, res) => {
  const codigo = normalizarCodigo(req.body.codigoFormulario);
  res.redirect(`/editar-formulario-p2?codigo=${codigo}`);
});

// ==============================
// EDITAR FORMULARIO EXISTENTE (CARGAR page2.ejs CON DATOS)
// ==============================
app.get("/editar-formulario-p2", async (req, res) => {
  const codigo = normalizarCodigo(req.query.codigo);

  try {
    const result = await pool.query(
      'SELECT * FROM "Formularios" WHERE "NumeroFormulario" = $1',
      [codigo]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Formulario no encontrado");
    }

    const f = result.rows[0];

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
      modo: "editar",
      modoEdicion: true   //agregado para que page2.ejs sepa que está en edición
    });
  } catch (err) {
    console.error("❌ Error en /editar-formulario-p2:", err);
    res.status(500).send("Error al cargar la página 2 para edición");
  }
});

// ==============================
// ACTUALIZAR FORMULARIO EXISTENTE
// ==============================
app.post("/actualizar", async (req, res) => {
  try {
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

    // RefLLE ahora es texto
    const refLLE = normalizar(req.body.refLLE);

    // Documentación combinada
    const documentos = [...(req.body.doc || []), ...(req.body.doc2 || [])];
    const descripcionDocumentacion = documentos.length > 0 ? documentos.join(", ") : null;

    // UPDATE con parámetros en PostgreSQL
    await pool.query(
      `UPDATE "Formularios"
       SET "PrimerNombre"=$1,"SegundoNombre"=$2,"PrimerApellido"=$3,"SegundoApellido"=$4,"TercerApellido"=$5,
           "PrimerNombreTitular"=$6,"SegundoNombreTitular"=$7,"PrimerApellidoTitular"=$8,"SegundoApellidoTitular"=$9,"TercerApellidoTitular"=$10,
           "PrimerNombrePadre"=$11,"SegundoNombrePadre"=$12,"PrimerApellidoPadre"=$13,"SegundoApellidoPadre"=$14,
           "PrimerNombreMadre"=$15,"SegundoNombreMadre"=$16,"PrimerApellidoMadre"=$17,"SegundoApellidoMadre"=$18,"TercerApellidoMadre"=$19,
           "Distrito"=$20,"Canton"=$21,"Colonia"=$22,"Calle"=$23,"NumeroCasa"=$24,"LugarHecho"=$25,
           "FechaPresentacion"=$26,"HoraPresentacion"=$27,"Telefono"=$28,"Correo"=$29,"Declaraciones"=$30,"DescripcionDocumentacion"=$31,
           "RefLLE"=$32,"LugarPresentacion"=$33,"Contacto"=$34,"Plazo"=$35,"DocTipo"=$36,"DUI"=$37,"Pasaporte"=$38,"OtroDoc"=$39,
           "Titular"=$40,"Caracter"=$41,"DocTitular"=$42,"DuiTitular"=$43,"NuiTitular"=$44,"OtroTitular"=$45,"FechaHecho"=$46
       WHERE "NumeroFormulario"=$47`,
      [
        normalizar(req.body.primerNombre),
        normalizar(req.body.segundoNombre),
        normalizar(req.body.primerApellido),
        normalizar(req.body.segundoApellido),
        normalizar(req.body.tercerApellido),
        normalizar(req.body.primerNombreTitular),
        normalizar(req.body.segundoNombreTitular),
        normalizar(req.body.primerApellidoTitular),
        normalizar(req.body.segundoApellidoTitular),
        normalizar(req.body.tercerApellidoTitular),
        normalizar(req.body.primerNombrePadre),
        normalizar(req.body.segundoNombrePadre),
        normalizar(req.body.primerApellidoPadre),
        normalizar(req.body.segundoApellidoPadre),
        normalizar(req.body.primerNombreMadre),
        normalizar(req.body.segundoNombreMadre),
        normalizar(req.body.primerApellidoMadre),
        normalizar(req.body.segundoApellidoMadre),
        normalizar(req.body.tercerApellidoMadre),
        normalizar(req.body.distrito),
        normalizar(req.body.canton),
        normalizar(req.body.colonia),
        normalizar(req.body.calle),
        normalizar(req.body.numeroCasa),
        normalizar(req.body.lugarHecho),
        fechaPresentacion,
        horaPresentacion,
        normalizar(req.body.telefono),
        normalizar(req.body.correo),
        normalizar(req.body.declaracion),
        descripcionDocumentacion,
        refLLE,
        normalizar(req.body.lugarPresentacion),
        normalizar(req.body.contacto),
        normalizar(req.body.plazo),
        normalizar(req.body.docTipo),
        normalizar(req.body.dui),
        normalizar(req.body.pasaporte),
        normalizar(req.body.otroDoc),
        normalizar(req.body.titular),
        Array.isArray(req.body.caracter) ? [...new Set(req.body.caracter)].join(",") : normalizar(req.body.caracter),
        normalizar(req.body.docTitular),
        normalizar(req.body.duiTitular),
        normalizar(req.body.nuiTitular),
        normalizar(req.body.otroTitular),
        fechaHecho,
        normalizar(req.body.codigoFormulario)
      ]
    );

    // Construir objeto para vista previa
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

    // Obtener firma del REF (usuario que llena el formulario)
    const firmaResult = await pool.query(
      `SELECT "Firma" FROM "Usuarios" WHERE LOWER("Usuario") = LOWER($1) AND "Estado" = true`,
      [normalizar(req.body.usuario)]
    );

    let firmaUsuario = null;
    if (firmaResult.rows.length > 0) {
      firmaUsuario = `https://proyecto-sicopac-production.up.railway.app/img/firma/${encodeURIComponent(firmaResult.rows[0].Firma)}`;
    }
    datosConCodigo.firmaUsuario = firmaUsuario;

        // Renderizar vista previa con los datos actualizados en modo edición
    res.render("pdf-preview", { 
      data: datosConCodigo,
      modoEdicion: true   // 👈 agregado para que pdf-preview muestre botón Editar
    });
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
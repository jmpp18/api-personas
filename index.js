const express = require("express");
const { Pool } = require("pg");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const app = express();

app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
//configuracion cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  dest: "uploads/"
});

// Ruta principal
app.get("/", (req, res) => {
  res.send("API funcionando");
});

// Prueba de conexión a PostgreSQL
app.get("/test-db", async (req, res) => {
  try {
    const resultado = await pool.query("SELECT NOW()");
    res.json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json(error.message);
  }
});

// Crear tabla (temporal)
app.get("/recrear-tabla", async (req, res) => {
  try {

    await pool.query(`
      DROP TABLE IF EXISTS personas;
    `);

    await pool.query(`
      CREATE TABLE personas (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        codigo_7 VARCHAR(7) NOT NULL,
        numero_identidad VARCHAR(30) NOT NULL,
        foto_url TEXT,
        fecha_registro TIMESTAMP DEFAULT NOW()
      );
    `);

    res.json({
      mensaje: "Tabla recreada correctamente"
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
});

// Crear persona
app.post("/personas", async (req, res) => {
  try {

    const {
      nombre,
      codigo_7,
      numero_identidad,
      foto_url
    } = req.body;

    const resultado = await pool.query(
      `
      INSERT INTO personas
      (
        nombre,
        codigo_7,
        numero_identidad,
        foto_url
      )
      VALUES ($1,$2,$3,$4)
      RETURNING *
      `,
      [
        nombre,
        codigo_7,
        numero_identidad,
        foto_url
      ]
    );

    res.status(201).json(resultado.rows[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }
});

// Obtener todas las personas
app.get("/personas", async (req, res) => {
  try {

    const resultado = await pool.query(
      "SELECT * FROM personas ORDER BY id DESC"
    );

    res.json(resultado.rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }
});

// Obtener una persona por id
app.get("/personas/:id", async (req, res) => {
  try {

    const resultado = await pool.query(
      "SELECT * FROM personas WHERE id = $1",
      [req.params.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Persona no encontrada"
      });
    }

    res.json(resultado.rows[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }
});
app.get("/estructura", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'personas'
      ORDER BY ordinal_position
    `);

    res.json(resultado.rows);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
});
//subir foto temp
app.post(
  "/subir-foto",
  upload.single("foto"),
  async (req, res) => {

    try {

      const resultado =
        await cloudinary.uploader.upload(
          req.file.path,
          {
            folder: "personas"
          }
        );

      res.json({
        url: resultado.secure_url
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: error.message
      });

    }

  }
);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});
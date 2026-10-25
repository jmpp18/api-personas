const express = require("express");
const { Pool } = require("pg");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const app = express();

app.use(express.json());

// PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer
const upload = multer({
  dest: "uploads/",
});

// Ruta principal
app.get("/", (req, res) => {
  res.send("API funcionando");
});

// Test PostgreSQL
app.get("/test-db", async (req, res) => {
  try {
    const resultado = await pool.query("SELECT NOW()");
    res.json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Crear persona con foto
app.post(
  "/personas",
  upload.single("foto"),
  async (req, res) => {

    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    try {

      if (!req.body) {
        return res.status(400).json({
          error: "req.body viene vacio"
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: "No se recibio la foto"
        });
      }

      const {
        nombre,
        codigo_7,
        numero_identidad
      } = req.body;

      res.json({
        nombre,
        codigo_7,
        numero_identidad,
        archivo: req.file.originalname
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: error.message
      });

    }
  }
);
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

// Obtener una persona por ID
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

// Eliminar persona
app.delete("/personas/:id", async (req, res) => {
  try {

    const resultado = await pool.query(
      "DELETE FROM personas WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Persona no encontrada"
      });
    }

    res.json({
      mensaje: "Persona eliminada",
      persona: resultado.rows[0]
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});
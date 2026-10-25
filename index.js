const express = require("express");
const { Pool } = require("pg");

const app = express();

app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get("/", (req, res) => {
  res.send("API funcionando");
});

app.get("/test-db", async (req, res) => {
  try {
    const resultado = await pool.query("SELECT NOW()");
    res.json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json(error.message);
  }
});

app.get("/crear-tabla", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS personas (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        documento VARCHAR(50),
        telefono VARCHAR(20),
        foto_url TEXT,
        fecha_registro TIMESTAMP DEFAULT NOW()
      )
    `);

    res.json({
      mensaje: "Tabla creada correctamente"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});
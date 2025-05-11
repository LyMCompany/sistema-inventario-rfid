// backend/routes/inventarioRoutes.js

const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

// ✅ Guardar inventario base
router.post('/', async (req, res) => {
  const { usuario, empresa, inventario } = req.body;

  if (!usuario || !empresa || !Array.isArray(inventario)) {
    return res.status(400).json({ error: 'Faltan datos requeridos o formato inválido' });
  }

  try {
    await pool.query(
      `INSERT INTO inventario (usuario, empresa, inventario, fecha)
       VALUES ($1, $2, $3, NOW())`,
      [usuario, empresa, JSON.stringify(inventario)]
    );
    res.status(201).json({ mensaje: '✅ Inventario guardado correctamente' });
  } catch (error) {
    console.error('❌ Error al guardar inventario:', error);
    res.status(500).json({ error: 'Error interno al guardar inventario' });
  }
});

// ✅ Obtener último inventario por usuario y empresa
router.get('/ultimo', async (req, res) => {
  const { usuario, empresa } = req.query;

  if (!usuario || !empresa) {
    return res.status(400).json({ error: 'Faltan parámetros usuario o empresa' });
  }

  try {
    const result = await pool.query(
      `SELECT inventario FROM inventario
       WHERE usuario = $1 AND empresa = $2
       ORDER BY fecha DESC LIMIT 1`,
      [usuario, empresa]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'No se encontró inventario registrado' });
    }

    res.json({ inventario: result.rows[0].inventario });
  } catch (error) {
    console.error('❌ Error al obtener inventario:', error);
    res.status(500).json({ error: 'Error interno al obtener inventario' });
  }
});

module.exports = router;

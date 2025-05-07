// backend/routes/reportesRoutes.js

const express = require('express');
const router = express.Router();
const pool = require('../utils/db');


// Guardar reporte
router.post('/', async (req, res) => {
  const { usuario, empresa, fecha, encontrados, faltantes, no_registrados } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO reportes (usuario, empresa, fecha, encontrados, faltantes, no_registrados)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [usuario, empresa, fecha, encontrados, faltantes, no_registrados]
    );
    res.status(201).json({ mensaje: 'Reporte guardado correctamente', reporte: result.rows[0] });
  } catch (error) {
    console.error('Error al guardar reporte:', error);
    res.status(500).json({ error: 'Error al guardar reporte' });
  }
});

// Obtener reportes por usuario y empresa
router.get('/', async (req, res) => {
  const { usuario, empresa } = req.query;

  if (!usuario || !empresa) {
    return res.status(400).json({ error: 'Faltan parámetros: usuario y empresa son requeridos' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM reportes WHERE usuario = $1 AND empresa = $2 ORDER BY fecha DESC`,
      [usuario, empresa]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener reportes:', error);
    res.status(500).json({ error: 'Error al obtener reportes' });
  }
});

module.exports = router;

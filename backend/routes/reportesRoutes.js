// backend/routes/reportesRoutes.js

const express = require('express');
const router = express.Router();
const pool = require('../utils/db');


// Guardar reporte
router.post('/', async (req, res) => {
    console.log('📦 Body recibido:', req.body);

    const { usuario, empresa, fecha, encontrados, faltantes, sobrantes } = req.body;


  try {
    const result = await pool.query(
      `INSERT INTO reportes (usuario, empresa, fecha, encontrados, faltantes, no_registrados)
        VALUES ($1, $2, $3, $4, $5, $6)`,
      [usuario, empresa, fecha,JSON.stringify(encontrados), JSON.stringify(faltantes), JSON.stringify(sobrantes)]
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
// Eliminar todos los reportes de un usuario y empresa
router.delete('/', async (req, res) => {
    const { usuario, empresa } = req.query;
    try {
      await pool.query('DELETE FROM reportes WHERE usuario = $1 AND empresa = $2', [usuario, empresa]);
      res.status(200).json({ mensaje: 'Todos los reportes eliminados correctamente' });
    } catch (error) {
      console.error('Error al eliminar reportes:', error);
      res.status(500).json({ error: 'Error al eliminar reportes' });
    }
  });
  // Eliminar un solo reporte por ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const result = await pool.query('DELETE FROM reportes WHERE id = $1', [id]);
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Reporte no encontrado' });
      }
  
      res.status(200).json({ mensaje: 'Reporte eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar reporte por ID:', error);
      res.status(500).json({ error: 'Error al eliminar el reporte' });
    }
  });
  
  

module.exports = router;

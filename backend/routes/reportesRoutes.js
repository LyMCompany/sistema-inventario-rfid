const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

// ✅ Guardar un nuevo reporte
router.post('/', async (req, res) => {
  console.log('📦 Body recibido:', req.body);

  const { usuario, empresa, fecha, encontrados, faltantes, noregistrados } = req.body;


  if (
    typeof usuario !== 'string' ||
    typeof empresa !== 'string' ||
    typeof fecha !== 'string' ||
    !Array.isArray(encontrados) ||
    !Array.isArray(faltantes) ||
    !Array.isArray(noregistrados)
  ) {
    return res.status(400).json({ error: 'Faltan datos válidos en el cuerpo de la solicitud' });
  }
  
  try {
    const result = await pool.query(
      `INSERT INTO reportes (usuario, empresa, fecha, encontrados, faltantes, noregistrados)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
       [usuario, empresa, fecha, JSON.stringify(encontrados), JSON.stringify(faltantes), JSON.stringify(noregistrados)]

    );

    res.status(201).json({ mensaje: '✅ Reporte guardado correctamente', reporte: result.rows[0] });
  } catch (error) {
    console.error('❌ Error al guardar reporte:', error);
    res.status(500).json({ error: 'Error interno al guardar el reporte' });
  }
});

// ✅ Obtener reportes por usuario y empresa
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
    console.error('❌ Error al obtener reportes:', error);
    res.status(500).json({ error: 'Error interno al obtener reportes' });
  }
});


// ✅ Eliminar todos los reportes por usuario y empresa
router.delete('/todos', async (req, res) => {
  const { usuario, empresa } = req.body;
  console.log('🟡 DELETE /reportes/todos BODY:', req.body); // Log para verificar qué llega

  if (!usuario || !empresa) {
    return res.status(400).json({ error: 'Faltan parámetros: usuario y empresa son requeridos' });
  }

  try {
    await pool.query(
      'DELETE FROM reportes WHERE usuario = $1 AND empresa = $2',
      [usuario, empresa]
    );
    res.status(200).json({ mensaje: '✅ Todos los reportes eliminados correctamente' });
  } catch (error) {
    console.error('❌ Error al eliminar reportes:', error); // Muy útil para revisar en Render
    res.status(500).json({ error: 'Error interno al eliminar reportes' });
  }
});

// ✅ Eliminar un reporte específico por usuario, empresa y fecha
router.delete('/por-fecha', async (req, res) => {
  const { usuario, empresa, fecha } = req.body;

  if (!usuario || !empresa || !fecha) {
    return res.status(400).json({ error: 'Faltan parámetros: usuario, empresa y fecha son requeridos' });
  }

  try {
    const result = await pool.query(
      `DELETE FROM reportes WHERE usuario = $1 AND empresa = $2 AND fecha = $3`,
      [usuario, empresa, fecha]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Reporte no encontrado para esa fecha' });
    }

    res.status(200).json({ mensaje: '✅ Reporte eliminado correctamente por fecha' });
  } catch (error) {
    console.error('❌ Error al eliminar reporte por fecha:', error);
    res.status(500).json({ error: 'Error interno al eliminar reporte' });
  }
});


// ✅ Eliminar un solo reporte por ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM reportes WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }

    res.status(200).json({ mensaje: '✅ Reporte eliminado correctamente' });
  } catch (error) {
    console.error('❌ Error al eliminar reporte por ID:', error);
    res.status(500).json({ error: 'Error interno al eliminar el reporte' });
  }
});



module.exports = router;

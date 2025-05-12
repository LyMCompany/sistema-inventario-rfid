const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { emitirInventario } = require('../websocket'); // ✅ Importación correcta

// ✅ Guardar inventario base
router.post('/', async (req, res) => {
  const { usuario, empresa, inventario } = req.body;

  try {
    // 1. Eliminar inventario anterior
    await pool.query(
      'DELETE FROM inventario WHERE usuario = $1 AND empresa = $2',
      [usuario, empresa]
    );

    // 2. Insertar nuevo inventario
    await pool.query(
      `INSERT INTO inventario (usuario, empresa, inventario)
       VALUES ($1, $2, $3)`,
      [usuario, empresa, JSON.stringify(inventario)]
    );

    // 3. Emitir inventario por WebSocket (si es válido)
    if (Array.isArray(inventario) && inventario.length > 0) {
      emitirInventario(inventario, usuario, empresa);
    } else {
      console.warn('⚠️ Inventario vacío o inválido, no se emitió por WebSocket');
    }

    // 4. Responder al frontend
    res.status(200).json({ mensaje: 'Inventario actualizado correctamente' });

  } catch (error) {
    console.error('❌ Error al guardar inventario:', error);
    res.status(500).json({ error: 'Error al guardar inventario' });
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

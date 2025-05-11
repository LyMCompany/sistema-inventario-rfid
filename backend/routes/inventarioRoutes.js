// backend/routes/inventarioRoutes.js

const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

// ✅ Guardar inventario base
// backend/routes/inventarioRoutes.js

router.post('/', async (req, res) => {
  const { usuario, empresa, inventario } = req.body;

  try {
    // Elimina inventario previo del usuario y empresa
    await pool.query(
      'DELETE FROM inventarios WHERE usuario = $1 AND empresa = $2',
      [usuario, empresa]
    );

    // Inserta el nuevo inventario
    for (const item of inventario) {
      await pool.query(
        `INSERT INTO inventarios (usuario, empresa, nombre, codigo, sku, marca, rfid, ubicacion, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          usuario,
          empresa,
          item.nombre || "-",
          item.codigo || "-",
          item.sku || "-",
          item.marca || "-",
          item.rfid,
          item.ubicacion || "-",
          item.estado || "Faltante"
        ]
      );
    }

    res.status(200).json({ mensaje: 'Inventario actualizado correctamente' });
  } catch (error) {
    console.error('Error al guardar inventario:', error);
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

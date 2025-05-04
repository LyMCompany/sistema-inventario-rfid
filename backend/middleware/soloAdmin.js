// middleware/soloAdmin.js
const pool = require('../utils/db');

const soloAdmin = async (req, res, next) => {
  try {
    const { empresa } = req.body;

    const result = await pool.query('SELECT rol FROM usuarios WHERE empresa = $1', [empresa]);
    const usuario = result.rows[0];

    if (!usuario || usuario.rol !== 'admin') {
      return res.status(403).json({ mensaje: 'Acceso denegado: solo administradores' });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error en verificación de rol' });
  }
};

module.exports = soloAdmin;

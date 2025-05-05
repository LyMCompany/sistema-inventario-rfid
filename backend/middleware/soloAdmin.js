const pool = require('../db');

const soloAdmin = async (req, res, next) => {
  try {
    const { empresa, correo } = req.body;

    if (!empresa || !correo) {
      return res.status(400).json({ mensaje: 'Faltan datos de empresa o correo' });
    }

    const result = await pool.query(
      'SELECT rol FROM usuarios WHERE empresa = $1 AND correo = $2',
      [empresa, correo]
    );

    const usuario = result.rows[0];

    if (!usuario || usuario.rol !== 'admin') {
      return res.status(403).json({ mensaje: 'Acceso denegado: solo administradores' });
    }

    next();
  } catch (err) {
    console.error('Error en soloAdmin:', err);
    res.status(500).json({ mensaje: 'Error interno en validación de rol' });
  }
};

module.exports = soloAdmin;

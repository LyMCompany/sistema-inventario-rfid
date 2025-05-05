const pool = require('../db'); // asegúrate de que esta línea apunte bien a tu conexión PostgreSQL

const soloAdmin = async (req, res, next) => {
  try {
    const { empresa, correo } = req.body;

    // Validar que los datos existan
    if (!empresa || !correo) {
      return res.status(400).json({ mensaje: 'Faltan datos de autenticación' });
    }

    // Consulta al usuario en la base de datos
    const result = await pool.query(
      'SELECT rol FROM usuarios WHERE empresa = $1 AND correo = $2',
      [empresa, correo]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ mensaje: 'Usuario no encontrado' });
    }

    const rol = result.rows[0].rol;

    if (rol !== 'admin') {
      return res.status(403).json({ mensaje: 'Acceso denegado: solo administradores' });
    }

    next(); // Usuario autorizado
  } catch (error) {
    console.error('Error en soloAdmin:', error);
    res.status(500).json({ mensaje: 'Error interno de autenticación' });
  }
};

module.exports = soloAdmin;

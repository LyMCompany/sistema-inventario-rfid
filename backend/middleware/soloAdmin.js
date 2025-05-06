const pool = require('../db'); // asegúrate de que esta ruta es correcta

const soloAdmin = async (req, res, next) => {
  try {
    const { correo } = req.body;

    // Validar que el correo exista
    if (!correo) {
      return res.status(400).json({ mensaje: 'Falta el correo de autenticación' });
    }

    // Consulta para obtener el rol del usuario
    const result = await pool.query(
      'SELECT rol FROM usuarios WHERE correo = $1',
      [correo]
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

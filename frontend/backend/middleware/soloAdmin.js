const jwt = require('jsonwebtoken');
require('dotenv').config();

const soloAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.rol !== 'admin') {
      return res.status(403).json({ mensaje: 'Acceso denegado: solo administradores' });
    }

    req.usuario = decoded;
    next();
  } catch (error) {
    console.error('Error en soloAdmin:', error);
    res.status(500).json({ mensaje: 'Error interno de autenticación' });
  }
};

module.exports = soloAdmin;

// routes/authRoutes.js
const express = require('express');
const { body, param, validationResult } = require('express-validator');
const pool = require('../utils/db');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const soloAdmin = require('../middleware/soloAdmin');
require('dotenv').config();
const jwt = require('jsonwebtoken');


const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const validarEntradas = (validaciones) => async (req, res, next) => {
  await Promise.all(validaciones.map((validacion) => validacion.run(req)));
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }
  next();
};

router.post(
  '/register',
  validarEntradas([
    body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('apellidos').notEmpty().withMessage('Los apellidos son obligatorios'),
    body('correo').isEmail().withMessage('Correo inválido'),
    body('empresa').notEmpty().withMessage('La empresa es obligatoria'),
    body('telefono').isMobilePhone().withMessage('Teléfono inválido'),
  ]),
  async (req, res) => {
    const { nombre, apellidos, correo, empresa, telefono } = req.body;
    try {
      const existe = await pool.query('SELECT * FROM usuarios WHERE empresa = $1', [empresa]);
      if (existe.rows.length > 0) {
        return res.status(409).json({ mensaje: 'Empresa ya registrada' });
      }

      const clave = [1, 2, 3].map(() => Math.random().toString(36).substring(2, 6)).join('-');

      await pool.query(
        'INSERT INTO usuarios (nombre, apellidos, correo, empresa, telefono, clave, intentos) VALUES ($1, $2, $3, $4, $5, $6, 0)',
        [nombre, apellidos, correo, empresa, telefono, clave]
      );

      await transporter.sendMail({
        from: `Sistema RFID <${process.env.EMAIL_USER}>`,
        to: correo,
        subject: `🔐 Clave de Registro - ${empresa}`,
        text: `Hola ${nombre},\n\nTu clave de registro es: ${clave}\n\nGracias por registrarte.`,
      });

      res.json({ mensaje: 'Usuario registrado con éxito', clave, empresa });
    } catch (err) {
      console.error('Error al registrar usuario:', err);
      res.status(500).json({ mensaje: 'Error al registrar usuario' });
    }
  }
);

router.post(
  '/login',
  validarEntradas([
    body('empresa').notEmpty().withMessage('La empresa es obligatoria'),
    body('contrasena').notEmpty().withMessage('La contraseña es obligatoria'),
  ]),
  async (req, res) => {
    const { empresa, contrasena } = req.body;
    try {
      const result = await pool.query('SELECT * FROM usuarios WHERE empresa = $1', [empresa]);
      const usuario = result.rows[0];

      if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      if (!usuario.contrasena) return res.status(403).json({ mensaje: 'Contraseña no registrada' });

      const match = await bcrypt.compare(contrasena, usuario.contrasena);
      if (!match) return res.status(401).json({ mensaje: 'Contraseña incorrecta' });

      const token = jwt.sign(
        { correo: usuario.correo, rol: usuario.rol },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const { contrasena: _, ...usuarioSinPass } = usuario;
      res.json({ mensaje: 'Login exitoso', usuario: usuarioSinPass, token });
    } catch (err) {
      console.error('Error en login:', err);
      res.status(500).json({ mensaje: 'Error en login' });
    }
  }
);

router.delete(
  '/usuarios/correo/:correo',
  soloAdmin,
  validarEntradas([
    param('correo').isEmail().withMessage('Correo inválido')
  ]),
  async (req, res) => {
    const { correo } = req.params;
    try {
      const resultado = await pool.query('DELETE FROM usuarios WHERE correo = $1', [correo]);
      if (resultado.rowCount === 0) return res.status(404).json({ mensaje: 'No se encontró un usuario con el correo proporcionado' });
      res.json({ mensaje: 'Usuario eliminado correctamente' });
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      res.status(500).json({ mensaje: 'Error al eliminar usuario' });
    }
  }
);

router.post(
  '/usuarios',
  validarEntradas([body('correo').isEmail().withMessage('Correo inválido')]),
  soloAdmin,
  async (req, res) => {
    try {
      const usuarios = await pool.query('SELECT nombre, apellidos, correo, empresa, telefono, rol FROM usuarios');
      res.json(usuarios.rows);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({ mensaje: 'Error al obtener usuarios' });
    }
  }
);
router.post('/validar-llave', async (req, res) => {
  const { empresa, clave } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE empresa = $1 AND clave = $2',
      [empresa, clave]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ mensaje: 'Llave incorrecta' });
    }

    await pool.query(
      'UPDATE usuarios SET intentos = 0 WHERE empresa = $1',
      [empresa]
    );

    res.json({ mensaje: 'Validación exitosa', usuario: result.rows[0] });
  } catch (error) {
    console.error('Error al validar la llave:', error);
    res.status(500).json({ mensaje: 'Error del servidor al validar la llave' });
  }
});


module.exports = router;

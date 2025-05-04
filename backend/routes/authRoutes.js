const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { leerUsuarios, guardarUsuarios } = require('../utils/usuarios');

const router = express.Router();

// Registrar datos iniciales y generar llave
router.post('/register', [
  body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
  body('correo').isEmail().withMessage('Correo inválido'),
  body('empresa').notEmpty().withMessage('La empresa es obligatoria'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errores: errors.array() });
  }

  const { nombre, apellidos, correo, empresa, telefono } = req.body;
  const usuarios = leerUsuarios();

  if (usuarios.find(u => u.empresa === empresa)) {
    return res.status(409).json({ mensaje: 'Empresa ya registrada' });
  }

  const llave = [...Array(3)].map(() => Math.random().toString(36).substring(2, 6)).join('-');

  const nuevoUsuario = {
    nombre,
    apellidos,
    correo,
    empresa,
    telefono,
    llave,
    validado: false,
    intentos: 0
  };

  usuarios.push(nuevoUsuario);
  guardarUsuarios(usuarios);

  res.json({ llave, empresa });
});

// Validar llave
router.post('/validar-llave', (req, res) => {
  const { empresa, llaveIngresada } = req.body;
  const usuarios = leerUsuarios();
  const usuario = usuarios.find(u => u.empresa === empresa);

  if (!usuario) return res.status(404).json({ mensaje: 'Empresa no encontrada' });

  if (usuario.intentos >= 3) {
    return res.status(403).json({ mensaje: 'Máximo de intentos superado' });
  }

  if (usuario.llave === llaveIngresada) {
    usuario.validado = true;
    usuario.intentos = 0;
    guardarUsuarios(usuarios);
    return res.json({ validado: true });
  } else {
    usuario.intentos += 1;
    guardarUsuarios(usuarios);
    return res.status(401).json({ mensaje: 'Llave incorrecta' });
  }
});

// Registrar contraseña
router.post('/registrar-password', async (req, res) => {
  const { empresa, password } = req.body;
  const usuarios = leerUsuarios();
  const usuario = usuarios.find(u => u.empresa === empresa);

  if (!usuario || !usuario.validado) {
    return res.status(400).json({ mensaje: 'Usuario no validado' });
  }

  usuario.password = await bcrypt.hash(password, 10);
  guardarUsuarios(usuarios);

  res.json({ mensaje: 'Contraseña registrada con éxito' });
});

// Login
router.post('/login', async (req, res) => {
  const { empresa, password } = req.body;
  const usuarios = leerUsuarios();
  const usuario = usuarios.find(u => u.empresa === empresa);

  if (!usuario) {
    return res.status(404).json({ mensaje: 'Usuario no encontrado' });
  }

  if (!usuario.validado || !usuario.password) {
    return res.status(403).json({ mensaje: 'Usuario no validado o sin contraseña' });
  }

  try {
    const match = await bcrypt.compare(password, usuario.password);
    if (match) {
      return res.json({ mensaje: 'Login exitoso', usuario: usuario.empresa });
    } else {
      return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
    }
  } catch (error) {
    console.error('Error al comparar contraseñas:', error);
    return res.status(500).json({ mensaje: 'Error interno en el servidor' });
  }
});

module.exports = router;
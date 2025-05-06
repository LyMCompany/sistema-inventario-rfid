const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const pool = require('../utils/db');
const nodemailer = require('nodemailer');
require('dotenv').config();

const router = express.Router();

// 📬 Configuración de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 🔐 Middleware para validar rol admin
const soloAdmin = async (req, res, next) => {
  try {
    const { correo } = req.body;

    if (!correo) {
      return res.status(400).json({ mensaje: 'Correo requerido para autenticación' });
    }

    const result = await pool.query('SELECT rol FROM usuarios WHERE correo = $1', [correo]);
    const usuario = result.rows[0];

    if (!usuario || usuario.rol !== 'admin') {
      return res.status(403).json({ mensaje: 'Acceso denegado: solo administradores' });
    }

    next(); // ✅ autorizamos continuar
  } catch (error) {
    console.error('Error en soloAdmin:', error);
    res.status(500).json({ mensaje: 'Error interno de autenticación' });
  }
};


// 📌 REGISTRO
router.post('/register', async (req, res) => {
  const { nombre, apellidos, correo, empresa, telefono } = req.body;

  try {
    const existe = await pool.query('SELECT * FROM usuarios WHERE empresa = $1', [empresa]);
    if (existe.rows.length > 0) return res.status(409).json({ mensaje: 'Empresa ya registrada' });

    const clave = [1, 2, 3].map(() => Math.random().toString(36).substring(2, 6)).join('-');

    await pool.query(
      'INSERT INTO usuarios (nombre, apellidos, correo, empresa, telefono, clave, intentos) VALUES ($1, $2, $3, $4, $5, $6, 0)',
      [nombre, apellidos, correo, empresa, telefono, clave]
    );

    await transporter.sendMail({
      from: `"SevenShoes" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `🔐 Nueva clave generada - ${empresa}`,
      text: `La empresa "${empresa}" se ha registrado.\n\nClave: ${clave}\nCorreo: ${correo}\nTeléfono: ${telefono}`
    });

    res.json({ clave, empresa });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al registrar usuario' });
  }
});

// 📌 VALIDAR LLAVE
router.post('/validar-llave', async (req, res) => {
  const { empresa, llaveIngresada } = req.body;
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE empresa = $1', [empresa]);
    const usuario = result.rows[0];
    if (!usuario) return res.status(404).json({ mensaje: 'Empresa no encontrada' });

    if (usuario.intentos >= 3) {
      return res.status(403).json({ mensaje: 'Máximo de intentos superado' });
    }

    if (usuario.clave === llaveIngresada) {
      await pool.query('UPDATE usuarios SET intentos = 0 WHERE empresa = $1', [empresa]);
      return res.json({ validado: true });
    } else {
      await pool.query('UPDATE usuarios SET intentos = intentos + 1 WHERE empresa = $1', [empresa]);
      return res.status(401).json({ mensaje: 'Llave incorrecta' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error validando la llave' });
  }
});

// 📌 REGISTRAR CONTRASEÑA
router.post('/registrar-password', async (req, res) => {
  const { empresa, contrasena } = req.body;

  try {
    const hashed = await bcrypt.hash(contrasena, 10);
    await pool.query('UPDATE usuarios SET contrasena = $1 WHERE empresa = $2', [hashed, empresa]);
    res.json({ mensaje: 'Contraseña registrada con éxito' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al registrar contraseña' });
  }
});

// 📌 LOGIN
router.post('/login', async (req, res) => {
  const { empresa, contrasena } = req.body;
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE empresa = $1', [empresa]);
    const usuario = result.rows[0];
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    if (!usuario.contrasena) return res.status(403).json({ mensaje: 'Contraseña no registrada' });

    const match = await bcrypt.compare(contrasena, usuario.contrasena);
    if (match) {
      const { contrasena, ...usuarioSinPassword } = usuario;
      res.json({ mensaje: 'Login exitoso', rol: usuario.rol, usuario: usuarioSinPassword });
    } else {
      res.status(401).json({ mensaje: 'Contraseña incorrecta' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error en login' });
  }
});

// 📌 VER USUARIOS (solo admin, basado en correo)
router.post('/usuarios', soloAdmin, async (req, res) => {
  const { correo } = req.body;
  console.log('BODY RECIBIDO EN /auth/usuarios:', req.body);

  try {
    const result = await pool.query('SELECT * FROM usuarios');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).json({ mensaje: 'Error al obtener usuarios' });
  }
});




// Ruta para editar un usuario
router.put('/editar', async (req, res) => {
  const { correo, nombre, apellidos, telefono, rol, contrasena } = req.body;

  try {
    let query = 'UPDATE usuarios SET nombre = $1, apellidos = $2, telefono = $3, rol = $4';
    const values = [nombre, apellidos, telefono, rol];
    let paramIndex = 5;

    if (typeof contraseña === 'string' && contraseña.trim() !== '') {
      const hashedPassword = await bcrypt.hash(contraseña, 10);
      values.push(hashedPassword);
      query += `, contraseña = $${paramIndex++}`;
    }
    

    query += ` WHERE correo = $${paramIndex}`;
    values.push(correo);

    await pool.query(query, values);

    res.status(200).json({ mensaje: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error al editar usuario:', error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
});


// 📌 CAMBIAR CONTRASEÑA (solo admin)
router.put('/usuarios/:id/password', soloAdmin, async (req, res) => {
  const { id } = req.params;
  const { nuevaPassword } = req.body;

  try {
    const hashed = await bcrypt.hash(nuevaPassword, 10);
    await pool.query('UPDATE usuarios SET contrasena = $1 WHERE id = $2', [hashed, id]);
    res.json({ mensaje: 'Contraseña actualizada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al cambiar la contraseña' });
  }
});

// 📌 ELIMINAR USUARIO (solo admin)
router.delete('/usuarios/:id', soloAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al eliminar usuario' });
  }
});
// Obtener usuarios por empresa y correo (solo admin)
router.post('/usuarios', async (req, res) => {
  const { empresa, correo } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE empresa = $1 AND correo = $2',
      [empresa, correo]
    );

    const usuario = result.rows[0];

    if (!usuario || usuario.rol !== 'admin') {
      return res.status(403).json({ mensaje: 'Acceso denegado: solo administradores' });
    }

    const usuariosEmpresa = await pool.query(
      'SELECT * FROM usuarios WHERE empresa = $1',
      [empresa]
    );

    res.json(usuariosEmpresa.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al obtener usuarios' });
  }
});

module.exports = router;

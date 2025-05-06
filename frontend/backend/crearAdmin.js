// crearAdmin.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./utils/db');

async function crearAdmin() {
  const hashed = await bcrypt.hash('Servidor2021*', 10);
  try {
    await pool.query(`
      INSERT INTO usuarios (nombre, apellidos, correo, empresa, telefono, clave, contrasena, rol)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      'Admin',
      'Master',
      'mariollorens1201@gmail.com',
      'LyMCompany',
      '+593958883182',
      'admin-0000-0000',
      hashed,
      'admin'
    ]);
    console.log('✅ Admin creado con éxito');
  } catch (err) {
    console.error('❌ Error al crear admin:', err);
  } finally {
    process.exit();
  }
}

// crearAdmin(); // ⚠️ Solo ejecutar una vez

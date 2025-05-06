// backend/utils/db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Usa la URL completa como variable de entorno
  ssl: {
    rejectUnauthorized: false // necesario para Render
  }
});

module.exports = pool;

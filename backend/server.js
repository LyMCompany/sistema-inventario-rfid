require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');

const app = express();
const port = process.env.PORT || 5000;


// ✅ CORS CONFIG SEGURO PARA NGROK Y LOCALHOST
const corsOptions = {
  origin: function (origin, callback) {
    callback(null, true); // Aceptar todas las URLs (ajustar en producción)
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};


// ✅ Middleware de CORS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // para preflight

app.use(express.json());

// ✅ Aquí las rutas deben tener prefijo '/auth' si así las usas en el frontend
app.use('/auth', authRoutes);

// ✅ Servir React desde /build
const buildPath = path.join(__dirname, '../frontend/build');

app.use(express.static(buildPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// 🔴 Middleware de errores CORS
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ mensaje: err.message || 'Error interno del servidor' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
});

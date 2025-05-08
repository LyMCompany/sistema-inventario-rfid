require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const reportesRoutes = require('./routes/reportesRoutes');

const app = express();
const port = process.env.PORT || 5000;

// ✅ Configuración CORS
const corsOptions = {
  origin: [
    'https://frontend-inventario-tmzb.onrender.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ✅ Middleware JSON
app.use(express.json());

// ✅ Rutas del backend
app.use('/auth', authRoutes);
app.use('/reportes', reportesRoutes);

// ✅ Middleware de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ mensaje: err.message || 'Error interno del servidor' });
});

// ✅ Iniciar servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
});

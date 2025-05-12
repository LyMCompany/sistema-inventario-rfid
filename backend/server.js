require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

const authRoutes = require('./routes/authRoutes');
const reportesRoutes = require('./routes/reportesRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const pool = require('./utils/db'); // Tu conexión PostgreSQL
const http = require('http');
const WebSocket = require('ws');


const app = express();
const port = process.env.PORT || 5000;

// ✅ Configuración de sesiones con PostgreSQL
app.set('trust proxy', 1); // ⚠️ Obligatorio en Render

app.use(session({
  store: new pgSession({
    pool: pool,               // Ya definido en utils/db.js
    tableName: 'session'      // Asegúrate que esta tabla exista (ya creada)
  }),
  secret: 'clave_super_segura', // Puedes usar process.env.SECRET si lo prefieres
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: 'none',
    secure: true // ⚠️ Obligatorio para Render con HTTPS
  }
}));

// ✅ Configuración CORS
const corsOptions = {
  origin: (origin, callback) => {
    const permitidos = [
      'https://frontend-inventario-tmzb.onrender.com',
      'http://localhost:3000'
    ];
    if (!origin || permitidos.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No autorizado por política CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // ⚠️ Necesario para preflight requests

// ✅ Middleware para parsear JSON
app.use(express.json());

// ✅ Rutas del backend
app.use('/auth', authRoutes);
app.use('/reportes', reportesRoutes);
app.use('/inventario', inventarioRoutes);

// ✅ Ruta adicional para WebSocket desde Android
app.post('/websocket/emitir', (req, res) => {
  const { codigo } = req.body;
  if (!codigo) {
    return res.status(400).json({ error: 'Código faltante' });
  }

  console.log('[📡 ESCANEO DESDE ANDROID]', codigo);
  res.status(200).json({ mensaje: 'Código recibido exitosamente' });
});

// ✅ Middleware global de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ mensaje: err.message || 'Error interno del servidor' });
});

// ✅ Iniciar el servidor
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

server.listen(port, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
});
module.exports = { wss };


require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const http = require('http');

const authRoutes = require('./routes/authRoutes');
const reportesRoutes = require('./routes/reportesRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const pool = require('./utils/db');
const { setupWebSocket } = require('./websocket'); // ✅ Usamos setupWebSocket

const app = express();
const port = process.env.PORT || 5000;

// ✅ Configuración de sesiones con PostgreSQL
app.set('trust proxy', 1);

app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'session'
  }),
  secret: 'clave_super_segura',
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: 'none',
    secure: true
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
app.options('*', cors(corsOptions));

app.use(express.json());

// ✅ Rutas del backend
app.use('/auth', authRoutes);
app.use('/reportes', reportesRoutes);
app.use('/inventario', inventarioRoutes);

// ✅ Endpoint adicional si lo usas desde Android para pruebas
app.post('/websocket/emitir', (req, res) => {
  const { codigo } = req.body;
  if (!codigo) {
    return res.status(400).json({ error: 'Código faltante' });
  }

  console.log('[📡 ESCANEO DESDE ANDROID]', codigo);
  res.status(200).json({ mensaje: 'Código recibido exitosamente' });
});

// ✅ Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ mensaje: err.message || 'Error interno del servidor' });
});

// ✅ Iniciar servidor y WebSocket
const server = http.createServer(app);
setupWebSocket(server); // 👈 Esta es la forma correcta
server.listen(port, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
});

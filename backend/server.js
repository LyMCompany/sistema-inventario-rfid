require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const reportesRoutes = require('./routes/reportesRoutes');

const app = express();
const port = process.env.PORT || 5000;

const session = require('express-session');
app.set('trust proxy', 1); // ⚠️ Esto es obligatorio en Render si usas cookies seguras

const inventarioRoutes = require('./routes/inventarioRoutes');
app.use('/inventarios', inventarioRoutes);


app.use(session({
  secret: 'clave_super_segura',
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: 'none',  // necesario para cross-site cookies en Render
    secure: true       // obligatorio en producción con HTTPS
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

// ✅ Middleware de CORS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // ⚠️ Para preflight requests


app.use(express.json());

// ✅ Rutas del backend existentes
app.use('/auth', authRoutes);
app.use('/reportes', reportesRoutes);

// ✅ Ruta adicional para recibir datos del WebSocket desde Android
app.post('/websocket/emitir', (req, res) => {
  const { codigo } = req.body;
  if (!codigo) {
    return res.status(400).json({ error: 'Código faltante' });
  }

  // Aquí puedes hacer algo con el código recibido:
  console.log('[📡 ESCANEO DESDE ANDROID]', codigo);

  res.status(200).json({ mensaje: 'Código recibido exitosamente' });
});

// ✅ Middleware de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ mensaje: err.message || 'Error interno del servidor' });
});

// ✅ Iniciar servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
});

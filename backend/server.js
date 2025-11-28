const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARES DE SEGURIDAD
// ============================================

// Helmet para headers de seguridad HTTP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://www.gstatic.com", "https://pagead2.googlesyndication.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://firestore.googleapis.com"],
      frameSrc: ["'self'", "https://googleads.g.doubleclick.net"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configurado de forma segura
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://edark-import.github.io', 'https://www.edark.com'] 
    : ['http://localhost:5500', 'http://127.0.0.1:5500'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 horas
};
app.use(cors(corsOptions));

// Rate Limiting - Prevención de ataques de fuerza bruta
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 peticiones por IP
  message: 'Demasiadas peticiones desde esta IP, intente más tarde',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Rate limiting más estricto para endpoints de autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 intentos de login
  message: 'Demasiados intentos de inicio de sesión, intente más tarde'
});

// Compresión de respuestas
app.use(compression());

// Logger
app.use(morgan('combined'));

// Body parsers con límites
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// INICIALIZACIÓN DE FIREBASE ADMIN
// ============================================
const admin = require('firebase-admin');

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
  console.log('✅ Firebase Admin inicializado correctamente');
} catch (error) {
  console.error('❌ Error al inicializar Firebase Admin:', error);
}

const db = admin.firestore();

// ============================================
// MIDDLEWARES DE AUTENTICACIÓN
// ============================================
const jwt = require('jsonwebtoken');

// Verificar token JWT
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Verificar rol de administrador
const verifyAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado: Se requiere rol de administrador' });
    }
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Error de autorización' });
  }
};

// ============================================
// IMPORTAR RUTAS
// ============================================
const authRoutes = require('./routes/auth');
const productosRoutes = require('./routes/productos');
const ventasRoutes = require('./routes/ventas');
const reportesRoutes = require('./routes/reportes');
const blogRoutes = require('./routes/blog');
const adsRoutes = require('./routes/ads');

// ============================================
// RUTAS DE LA API
// ============================================
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/ventas', verifyToken, ventasRoutes);
app.use('/api/reportes', verifyToken, verifyAdmin, reportesRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/ads', adsRoutes);

// Ruta de salud
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ 
    message: 'eDark Marketplace API v1.0',
    docs: '/api/docs'
  });
});

// ============================================
// MANEJO DE ERRORES
// ============================================

// Ruta no encontrada
app.use((req, res, next) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.path 
  });
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Error interno del servidor' 
    : err.message;
  
  res.status(statusCode).json({ 
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// INICIO DEL SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   🚀 eDark Marketplace API Server    ║
║   Puerto: ${PORT}                        ║
║   Entorno: ${process.env.NODE_ENV}          ║
║   ✅ Servidor ejecutándose           ║
╚═══════════════════════════════════════╝
  `);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;

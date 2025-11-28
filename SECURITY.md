# Guía de Configuración de Seguridad - eDark Marketplace

## 🔒 Configuraciones Críticas de Seguridad

### 1. Firebase Security Rules

#### Firestore Rules (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Función auxiliar para verificar admin
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Función para verificar autenticación
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Productos - lectura pública, escritura solo admin
    match /productos/{producto} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }
    
    // Ventas - crear autenticado, leer/actualizar solo admin o propietario
    match /ventas/{venta} {
      allow create: if isAuthenticated();
      allow read, update: if isAdmin() || 
                            request.auth.uid == resource.data.cliente.uid;
      allow delete: if isAdmin();
    }
    
    // Usuarios - solo el usuario puede leer sus datos
    match /usuarios/{userId} {
      allow read: if isAuthenticated() && 
                    (request.auth.uid == userId || isAdmin());
      allow create: if request.auth.uid == userId;
      allow update: if request.auth.uid == userId || isAdmin();
      allow delete: if isAdmin();
    }
    
    // Blog - lectura pública, escritura solo admin
    match /blog/{articulo} {
      allow read: if resource.data.publicado == true || isAdmin();
      allow create, update, delete: if isAdmin();
    }
    
    // Espacios publicitarios - lectura pública, escritura admin
    match /espacios_publicitarios/{espacio} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Newsletter - solo crear
    match /newsletter/{suscripcion} {
      allow create: if true;
      allow read, update, delete: if isAdmin();
    }
  }
}
```

#### Storage Rules (`storage.rules`)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Imágenes de productos - lectura pública, escritura admin
    match /productos/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
                     request.resource.size < 5 * 1024 * 1024 && // Máx 5MB
                     request.resource.contentType.matches('image/.*');
    }
    
    // Imágenes del blog - similar a productos
    match /blog/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
                     request.resource.size < 5 * 1024 * 1024;
    }
  }
}
```

---

## 🛡️ Backend Security Checklist

### Variables de Entorno (.env)

```bash
# NUNCA subir el archivo .env a GitHub
# Agregar al .gitignore
echo ".env" >> .gitignore
echo "node_modules/" >> .gitignore
echo "*.log" >> .gitignore
```

### Generar JWT Secret Seguro

```powershell
# Usar Node.js para generar una clave aleatoria
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Configurar HTTPS

```javascript
// En producción, usar HTTPS obligatorio
if (process.env.NODE_ENV === 'production' && 
    req.headers['x-forwarded-proto'] !== 'https') {
  return res.redirect('https://' + req.headers.host + req.url);
}
```

---

## 🔐 Autenticación y Autorización

### Crear Primer Usuario Admin

```javascript
// Script: backend/scripts/create-admin.js
const admin = require('firebase-admin');
require('dotenv').config();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  })
});

const db = admin.firestore();

async function createAdmin() {
  const email = 'admin@edark.com';
  const password = 'TuPasswordSeguro123!';
  
  try {
    // Crear usuario en Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: 'Administrador'
    });
    
    // Guardar en Firestore con rol admin
    await db.collection('usuarios').doc(userRecord.uid).set({
      email,
      nombre: 'Administrador',
      apellido: 'eDark',
      role: 'admin',
      activo: true,
      fechaCreacion: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Usuario admin creado exitosamente');
    console.log('Email:', email);
    console.log('UID:', userRecord.uid);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

createAdmin();
```

Ejecutar:
```powershell
node backend/scripts/create-admin.js
```

---

## 🌐 Configuración de CORS

### Producción - CORS Restrictivo

```javascript
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://edark-import.github.io',
      'https://www.edark.com'
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
};

app.use(cors(corsOptions));
```

---

## 🔒 Rate Limiting Avanzado

```javascript
const rateLimit = require('express-rate-limit');

// Rate limiting general
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: 'Demasiadas peticiones, intenta más tarde',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Demasiadas peticiones',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// Rate limiting para login (más estricto)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 intentos de login
  skipSuccessfulRequests: true,
  message: 'Demasiados intentos de login, espera 15 minutos'
});

// Rate limiting para API
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // 30 requests por minuto
  message: 'Límite de API excedido'
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/', apiLimiter);
```

---

## 🛡️ Protección contra Inyecciones

### SQL Injection (No aplica, usamos Firestore)

Firestore es NoSQL y previene inyecciones automáticamente, pero siempre validar inputs:

```javascript
const { body, validationResult } = require('express-validator');

// Ejemplo de validación
router.post('/productos',
  [
    body('nombre').trim().escape().notEmpty(),
    body('precio').isFloat({ min: 0 }),
    body('stock').isInt({ min: 0 }),
    body('email').isEmail().normalizeEmail()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Procesar...
  }
);
```

### XSS Protection

```javascript
// Función de sanitización
function sanitizeHtml(text) {
  const map = {
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&#39;',
    '`': '&#96;',
    '/': '&#x2F;'
  };
  return String(text).replace(/[<>&"'`\/]/g, c => map[c]);
}

// Usar en todos los inputs
const nombreSanitizado = sanitizeHtml(req.body.nombre);
```

---

## 🔐 Encriptación de Datos Sensibles

### Encriptar Datos con Crypto

```javascript
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// Uso
const datosSensibles = encrypt('información confidencial');
```

---

## 📊 Logging y Monitoreo

### Configurar Winston Logger

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Usar en lugar de console.log
logger.info('Usuario logueado', { userId: user.id });
logger.error('Error en pago', { error: err.message });
```

---

## 🚨 Detección de Fraude

### Validación de Pagos

```javascript
async function validarPago(venta) {
  const checks = {
    // Verificar monto
    montoValido: venta.total > 0 && venta.total < 50000,
    
    // Verificar email
    emailValido: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(venta.cliente.email),
    
    // Verificar productos existen
    productosValidos: await verificarProductos(venta.productos),
    
    // Verificar IP no está en blacklist
    ipSegura: !await estaEnBlacklist(venta.ip),
    
    // Verificar no es spam (muchas compras en poco tiempo)
    noEsSpam: await verificarFrecuencia(venta.cliente.email)
  };
  
  const esValido = Object.values(checks).every(v => v === true);
  
  if (!esValido) {
    logger.warn('Posible fraude detectado', { venta, checks });
    // Enviar alerta al admin
    await notificarAdmin('Posible fraude', venta);
  }
  
  return esValido;
}
```

---

## 🔒 Backup y Recuperación

### Script de Backup Automático

```javascript
// backend/scripts/backup.js
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

async function backupFirestore() {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const backupDir = path.join(__dirname, '../backups', timestamp);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const collections = ['productos', 'ventas', 'usuarios', 'blog'];
  
  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).get();
    const data = [];
    
    snapshot.forEach(doc => {
      data.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    fs.writeFileSync(
      path.join(backupDir, `${collectionName}.json`),
      JSON.stringify(data, null, 2)
    );
    
    console.log(`✅ Backup de ${collectionName}: ${data.length} documentos`);
  }
  
  console.log(`🎉 Backup completo en: ${backupDir}`);
}

backupFirestore().then(() => process.exit(0));
```

### Programar Backups Diarios (Windows Task Scheduler)

```powershell
# Crear tarea programada
$action = New-ScheduledTaskAction -Execute "node" -Argument "C:\path\to\backend\scripts\backup.js"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName "eDark Backup" -Action $action -Trigger $trigger
```

---

## 🔍 Auditoría de Seguridad

### Checklist de Seguridad

```markdown
## Pre-Deployment Security Checklist

- [ ] Variables de entorno configuradas (.env)
- [ ] JWT secret es aleatorio y seguro (64+ caracteres)
- [ ] Firebase Security Rules implementadas
- [ ] HTTPS habilitado en producción
- [ ] Rate limiting configurado
- [ ] CORS restrictivo configurado
- [ ] Validación de inputs en todos los endpoints
- [ ] Sanitización XSS implementada
- [ ] Logs configurados (Winston)
- [ ] Backup automático configurado
- [ ] Monitoreo de errores (Sentry)
- [ ] Passwords hasheados (bcrypt)
- [ ] Helmet.js configurado
- [ ] CSP headers configurados
- [ ] Dependencias actualizadas (npm audit)
- [ ] Secrets no están en el código
- [ ] .gitignore configurado correctamente
- [ ] Emails de notificación funcionando
- [ ] Sistema de alertas configurado
- [ ] Documentación de seguridad actualizada
```

### Análisis de Vulnerabilidades

```powershell
# Auditar dependencias
npm audit

# Corregir automáticamente
npm audit fix

# Verificar dependencias desactualizadas
npm outdated

# Actualizar dependencias
npm update
```

---

## 🚀 Mejores Prácticas

1. **Nunca** exponer secrets en el código
2. **Siempre** validar inputs del usuario
3. **Usar** HTTPS en producción
4. **Implementar** autenticación de 2 factores (opcional)
5. **Monitorear** logs regularmente
6. **Actualizar** dependencias mensualmente
7. **Hacer** backups semanales
8. **Revisar** Firebase Security Rules
9. **Limitar** intentos de login
10. **Encriptar** datos sensibles

---

## 📞 Contacto de Seguridad

Si encuentras una vulnerabilidad de seguridad, contacta a:
- 📧 security@edark.com
- No divulgues públicamente hasta que se corrija

---

**Última actualización: Noviembre 2024**

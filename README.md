# 🚀 eDark Marketplace - Sistema de E-commerce Completo

## 📋 Descripción del Proyecto

eDark es un marketplace completo con funcionalidades empresariales que incluye:

- ✅ **Tienda Online** con catálogo de productos
- ✅ **Panel de Administración** con reportes y estadísticas
- ✅ **Sistema de Blog** con monetización (Google AdSense)
- ✅ **API REST** segura con autenticación JWT
- ✅ **Gestión de Ventas** y pedidos
- ✅ **Sistema de Usuarios** con roles (Admin/Cliente)
- ✅ **Integración Firebase** (Firestore + Auth)
- ✅ **Pasarela de Pagos** (Culqi/MercadoPago)

---

## 🏗️ Estructura del Proyecto

```
edark-import.github.io/
├── backend/                    # API REST Node.js
│   ├── server.js              # Servidor principal
│   ├── routes/                # Rutas de la API
│   │   ├── auth.js           # Autenticación
│   │   ├── productos.js      # Gestión de productos
│   │   ├── ventas.js         # Gestión de ventas
│   │   ├── reportes.js       # Reportes y estadísticas
│   │   ├── blog.js           # Blog y artículos
│   │   └── ads.js            # Publicidad
│   ├── package.json          # Dependencias del backend
│   └── .env.example          # Variables de entorno ejemplo
│
├── admin/                     # Panel de Administración
│   └── dashboard.html        # Dashboard con gráficos
│
├── index.html                # Página principal (tienda)
├── blog.html                 # Listado de artículos del blog
├── blog-post.html            # Vista individual de artículo
├── carrito.html              # Carrito de compras
├── nosotros.html             # Página sobre nosotros
├── contactanos.html          # Formulario de contacto
│
├── css/
│   └── styles.css            # Estilos
├── js/
│   ├── scripts.js            # Scripts generales
│   └── actualizar-precios.js # Script para actualizar precios
└── img/
    ├── Logo/                 # Logos
    └── Productos/            # Imágenes de productos
```

---

## 🚀 Instalación y Configuración

### 1. **Requisitos Previos**

- Node.js v18+ instalado
- Cuenta de Firebase (Firestore + Authentication)
- Cuenta de Google AdSense (para monetización)
- Cuenta de Culqi o MercadoPago (para pagos)

### 2. **Configurar Backend**

```powershell
# Navegar a la carpeta backend
cd backend

# Instalar dependencias
npm install

# Crear archivo .env (copiar desde .env.example)
cp .env.example .env
```

### 3. **Configurar Variables de Entorno (.env)**

Editar `backend/.env` con tus credenciales:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=edark-proyect
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@edark-proyect.iam.gserviceaccount.com

# JWT Secret (genera una clave segura)
JWT_SECRET=tu_clave_super_secreta_cambiar_en_produccion

# Server
PORT=3000
NODE_ENV=production

# Email (para notificaciones)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-password-de-aplicacion

# Culqi (Pasarela de Pagos Perú)
CULQI_PUBLIC_KEY=pk_live_xxxxxxxxxx
CULQI_SECRET_KEY=sk_live_xxxxxxxxxx

# Google AdSense
ADSENSE_CLIENT_ID=ca-pub-xxxxxxxxxx

# URLs
FRONTEND_URL=https://edark-import.github.io
ADMIN_EMAIL=admin@edark.com
```

### 4. **Iniciar el Backend**

```powershell
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en: `http://localhost:3000`

### 5. **Configurar Firebase en el Frontend**

Editar las credenciales de Firebase en:
- `index.html` (línea ~168)
- `blog.html` (línea ~273)
- `blog-post.html` (línea ~243)
- `admin/dashboard.html` (línea ~333)

```javascript
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:xxxxx",
    measurementId: "G-XXXXXXXXXX"
};
```

### 6. **Configurar Google AdSense**

1. Crear cuenta en [Google AdSense](https://www.google.com/adsense/)
2. Obtener tu código de cliente: `ca-pub-XXXXXXXXXXXXXXXX`
3. Reemplazar en los archivos:
   - `blog.html` (línea 15 y múltiples espacios publicitarios)
   - `blog-post.html` (línea 20 y sidebars)

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-TU_CODIGO_AQUI"
 crossorigin="anonymous"></script>
```

---

## 📊 Funcionalidades del Sistema

### **1. Panel de Administración** (`/admin/dashboard.html`)

**Características:**
- 📈 Dashboard con estadísticas en tiempo real
- 💰 Gráficos de ventas por mes
- 📦 Gestión de inventario y stock
- 👥 Análisis de clientes
- 📝 Reportes exportables (CSV)
- 🔔 Alertas de productos con bajo stock

**Acceso:**
- Solo usuarios con rol `admin` en Firebase
- Requiere autenticación con Firebase Auth

### **2. Sistema de Ventas**

**Características:**
- 🛒 Carrito de compras (localStorage)
- 💳 Pasarela de pagos integrada (Culqi)
- 📧 Emails de confirmación automáticos
- 📱 Notificaciones por WhatsApp
- 🔄 Gestión de estados (pendiente, confirmado, enviado, entregado)

### **3. Blog y Monetización**

**Características:**
- 📝 Sistema de blog completo con CMS
- 🎯 Espacios publicitarios estratégicos
- 💰 Integración Google AdSense
- 📊 Tracking de impresiones y clics
- 🏷️ Sistema de tags y categorías
- 🔍 SEO optimizado

**Espacios Publicitarios:**
- Header banner (728x90)
- Sidebar ads (300x250)
- In-content ads (responsive)
- Footer ads

### **4. API REST** (`/backend`)

**Endpoints Principales:**

#### Autenticación
```
POST /api/auth/register    - Registrar usuario
POST /api/auth/login       - Iniciar sesión
GET  /api/auth/verify      - Verificar token
```

#### Productos
```
GET    /api/productos      - Listar productos
GET    /api/productos/:id  - Obtener producto
POST   /api/productos      - Crear producto (Admin)
PUT    /api/productos/:id  - Actualizar producto (Admin)
DELETE /api/productos/:id  - Eliminar producto (Admin)
```

#### Ventas
```
POST /api/ventas           - Crear venta
GET  /api/ventas           - Listar ventas
GET  /api/ventas/:id       - Obtener venta
PATCH /api/ventas/:id/estado - Actualizar estado
```

#### Reportes (Solo Admin)
```
GET /api/reportes/dashboard        - Dashboard general
GET /api/reportes/ventas-periodo   - Reporte de ventas
GET /api/reportes/inventario       - Reporte de inventario
GET /api/reportes/clientes         - Reporte de clientes
GET /api/reportes/exportar/:tipo   - Exportar CSV
```

#### Blog
```
GET    /api/blog            - Listar artículos
GET    /api/blog/:slug      - Obtener artículo por slug
POST   /api/blog            - Crear artículo (Admin)
PUT    /api/blog/:id        - Actualizar artículo (Admin)
DELETE /api/blog/:id        - Eliminar artículo (Admin)
```

#### Publicidad (Admin)
```
GET  /api/ads/espacios        - Listar espacios publicitarios
POST /api/ads/espacios        - Crear espacio (Admin)
POST /api/ads/espacios/:id/impresion - Registrar impresión
POST /api/ads/espacios/:id/clic      - Registrar clic
GET  /api/ads/estadisticas    - Estadísticas (Admin)
```

---

## 🔒 Seguridad Implementada

### **Medidas de Seguridad:**

1. **Helmet.js** - Headers de seguridad HTTP
2. **Rate Limiting** - Prevención de ataques de fuerza bruta
3. **JWT Authentication** - Tokens seguros con expiración
4. **Input Validation** - Sanitización de datos (express-validator)
5. **CORS** - Configuración restrictiva de orígenes
6. **HTTPS Redirect** - Forzar conexiones seguras
7. **Clickjacking Protection** - X-Frame-Options
8. **XSS Protection** - Sanitización de HTML
9. **CSRF Tokens** - Protección contra ataques CSRF
10. **Firebase Security Rules** - Control de acceso a datos

### **Content Security Policy (CSP):**

```javascript
{
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "gstatic.com"],
  styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
  imgSrc: ["'self'", "data:", "https:", "blob:"],
  connectSrc: ["'self'", "firestore.googleapis.com"]
}
```

---

## 💳 Integración de Pagos

### **Culqi (Recomendado para Perú)**

```javascript
// Ejemplo de integración en el frontend
Culqi.publicKey = 'pk_live_xxxxxxxxxx';

Culqi.settings({
  title: 'eDark Store',
  currency: 'PEN',
  amount: total * 100 // En centavos
});

Culqi.open();
```

### **MercadoPago (Alternativa)**

```javascript
// Configurar SDK de MercadoPago
const mp = new MercadoPago('PUBLIC_KEY', {
  locale: 'es-PE'
});

// Crear preferencia de pago
mp.checkout({
  preference: {
    id: 'preference_id'
  }
});
```

---

## 📧 Sistema de Emails

**Nodemailer configurado con Gmail:**

```javascript
// Configuración en backend
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'tu-email@gmail.com',
    pass: 'tu-password-de-aplicacion'
  }
});
```

**Eventos que envían emails:**
- ✅ Confirmación de pedido
- ✅ Cambio de estado de pedido
- ✅ Recuperación de contraseña
- ✅ Bienvenida a nuevos usuarios

---

## 🎨 Personalización

### **Colores del Tema:**

```css
:root {
  --primary-color: #00adb5;  /* Turquesa */
  --dark-bg: #222831;         /* Negro oscuro */
  --light-bg: #393e46;        /* Gris oscuro */
}
```

### **Logo:**

Reemplazar imágenes en:
- `img/Logo/logo_2.png` (logo principal)
- `img/Logo/isotipo_Negro.png` (favicon)

---

## 📱 Responsive Design

El sistema es completamente responsive y funciona en:
- 💻 Desktop (1920px+)
- 💻 Laptop (1366px - 1920px)
- 📱 Tablet (768px - 1366px)
- 📱 Mobile (320px - 768px)

---

## 🚀 Deploy en Producción

### **GitHub Pages (Frontend)**

```powershell
# Ya está configurado en edark-import.github.io
# Solo hacer push para actualizar
git add .
git commit -m "Update"
git push origin main
```

### **Backend - Opciones de Deploy:**

#### **1. Heroku**
```powershell
heroku create edark-api
git push heroku main
```

#### **2. Railway**
- Conectar repositorio
- Configurar variables de entorno
- Deploy automático

#### **3. VPS (DigitalOcean, AWS, etc.)**
```bash
# En el servidor
git clone <repo>
cd backend
npm install
pm2 start server.js
pm2 startup
pm2 save
```

---

## 📈 Monetización

### **Fuentes de Ingresos:**

1. **Venta de Productos** - Comisión en cada venta
2. **Google AdSense** - Anuncios en el blog
3. **Contenido Patrocinado** - Artículos de sponsors
4. **Afiliados** - Links de afiliado en artículos
5. **Banners Directos** - Venta directa de espacios publicitarios

### **Optimización de AdSense:**

- 🎯 Coloca ads en posiciones estratégicas
- 📊 Usa Google Analytics para tracking
- 🔄 Prueba diferentes formatos de anuncios
- 📈 Analiza el CTR y optimiza

---

## 🛠️ Mantenimiento

### **Backups Automáticos (Firebase):**

```javascript
// Script para backup diario
const backup = require('firestore-backup');
backup.backupFirestore({
  projectId: 'edark-proyect',
  outputPath: './backups'
});
```

### **Monitoreo:**

- 📊 Google Analytics para tráfico
- 🔍 Firebase Performance Monitoring
- 🚨 Sentry para errores
- 📈 Google Search Console para SEO

---

## 📞 Soporte y Contacto

- 📧 Email: admin@edark.com
- 🌐 Website: https://edark-import.github.io
- 📱 WhatsApp: [Tu número]

---

## 📄 Licencia

Copyright © 2024 EDARK E.I.R.L. Todos los derechos reservados.

---

## 🎯 Próximas Mejoras Sugeridas

1. ✨ Chat en vivo con clientes
2. 📊 Dashboard de análisis avanzado
3. 🎨 Editor visual de productos
4. 🔔 Notificaciones push
5. 📱 App móvil (React Native)
6. 🌐 Multi-idioma
7. 💬 Sistema de reviews y comentarios
8. 🎁 Sistema de cupones y descuentos
9. 📦 Tracking de envíos
10. 🤖 Chatbot con IA

---

**¡Gracias por usar eDark Marketplace! 🚀**

# 🚀 Guía de Deploy - GitHub Pages + Firebase

## ✅ Tu Sistema AHORA Funciona Sin Servidor Propio

### **Arquitectura:**
- **Frontend**: GitHub Pages (GRATIS)
- **Backend**: Firebase Cloud Functions (GRATIS hasta 2M llamadas/mes)
- **Base de Datos**: Firebase Firestore (GRATIS hasta 50k lecturas/día)
- **Almacenamiento**: Firebase Storage (GRATIS 5GB)
- **Autenticación**: Firebase Auth (GRATIS hasta 10k usuarios)

---

## 📋 **PASO 1: Instalar Firebase CLI**

```powershell
# Instalar Firebase CLI globalmente
npm install -g firebase-tools

# Verificar instalación
firebase --version
```

---

## 🔑 **PASO 2: Login en Firebase**

```powershell
# Login con tu cuenta de Google
firebase login

# Verificar que estás logueado
firebase projects:list
```

---

## 🏗️ **PASO 3: Inicializar Firebase en tu proyecto**

```powershell
# Navegar a la carpeta del proyecto
cd c:\Users\melvi\Documents\edark-web\edark-import.github.io

# Inicializar Firebase
firebase init

# Seleccionar:
# ✅ Firestore
# ✅ Functions
# ✅ Hosting
# ✅ Storage

# Configuración:
# - Proyecto: Seleccionar "edark-proyect" (o el que tengas)
# - Firestore rules: firestore.rules
# - Functions: JavaScript
# - Hosting: . (punto - directorio actual)
# - Single Page App: No
```

---

## ⚙️ **PASO 4: Instalar Dependencias de Functions**

```powershell
# Navegar a la carpeta de functions
cd firebase-functions

# Instalar dependencias
npm install

# Volver a la raíz
cd ..
```

---

## 🔐 **PASO 5: Configurar Security Rules**

El archivo `firestore.rules` ya está creado. Aplicarlo:

```powershell
firebase deploy --only firestore:rules
```

---

## 🚀 **PASO 6: Deploy de Cloud Functions**

```powershell
# Deploy de todas las functions
firebase deploy --only functions

# O deploy de una función específica
firebase deploy --only functions:api
```

Después del deploy, obtendrás una URL como:
```
https://us-central1-edark-proyect.cloudfunctions.net/api
```

---

## 🌐 **PASO 7: Actualizar Frontend para usar Firebase Functions**

El frontend ya está configurado para trabajar directamente con Firestore, pero si necesitas usar las Cloud Functions, actualiza las URLs:

**En `blog.html` y otros archivos, cambiar de:**
```javascript
// Backend local (NO FUNCIONA en GitHub Pages)
fetch('http://localhost:3000/api/ventas')
```

**A Firebase Functions:**
```javascript
// Firebase Functions (SÍ FUNCIONA en GitHub Pages)
const FUNCTIONS_URL = 'https://us-central1-edark-proyect.cloudfunctions.net/api';
fetch(`${FUNCTIONS_URL}/ventas`)
```

---

## 📦 **PASO 8: Deploy a GitHub Pages**

```powershell
# Commit de cambios
git add .
git commit -m "Deploy con Firebase Functions"

# Push a GitHub
git push origin main

# GitHub Pages se actualiza automáticamente
# Disponible en: https://edark-import.github.io
```

---

## 🎯 **URLs de tu Sistema:**

### **Frontend (GitHub Pages):**
```
https://edark-import.github.io/
https://edark-import.github.io/blog.html
https://edark-import.github.io/admin/dashboard.html
```

### **Backend (Firebase Functions):**
```
https://us-central1-edark-proyect.cloudfunctions.net/api/ventas
https://us-central1-edark-proyect.cloudfunctions.net/api/reportes/dashboard
https://us-central1-edark-proyect.cloudfunctions.net/api/blog
```

---

## 🔍 **PASO 9: Verificar que Todo Funciona**

### **Test 1: Verificar Firestore Rules**
```powershell
firebase firestore:rules:get
```

### **Test 2: Ver logs de Functions**
```powershell
firebase functions:log
```

### **Test 3: Probar API**
```powershell
# En PowerShell
Invoke-WebRequest -Uri "https://us-central1-edark-proyect.cloudfunctions.net/api/reportes/dashboard" | Select-Object -Expand Content
```

---

## 💰 **Costos (Todos GRATIS para empezar)**

### **Firebase Spark Plan (Gratis):**
- ✅ **Cloud Functions**: 2M invocaciones/mes GRATIS
- ✅ **Firestore**: 50k lecturas + 20k escrituras/día GRATIS
- ✅ **Storage**: 5GB GRATIS
- ✅ **Hosting**: 10GB de almacenamiento + 360MB/día de transferencia GRATIS

### **GitHub Pages:**
- ✅ 100% GRATIS
- ✅ Hosting ilimitado
- ✅ SSL automático

---

## 📊 **Funcionalidades que FUNCIONAN:**

✅ **Tienda Online** - GitHub Pages + Firestore
✅ **Carrito de Compras** - LocalStorage
✅ **Sistema de Ventas** - Cloud Functions
✅ **Panel de Administración** - Firebase Auth + Firestore
✅ **Blog con AdSense** - GitHub Pages
✅ **Reportes** - Cloud Functions
✅ **Newsletter** - Firestore
✅ **Autenticación** - Firebase Auth
✅ **Base de Datos** - Firestore
✅ **Imágenes** - Firebase Storage o URLs externas

---

## 🛠️ **Comandos Útiles**

```powershell
# Ver funciones desplegadas
firebase functions:list

# Ver logs en tiempo real
firebase functions:log --only api

# Eliminar una función
firebase functions:delete nombreFuncion

# Deploy completo (hosting + functions + rules)
firebase deploy

# Deploy solo hosting
firebase deploy --only hosting

# Deploy solo functions
firebase deploy --only functions

# Emular localmente antes de deploy
firebase emulators:start
```

---

## 🔒 **Crear Primer Usuario Admin**

```javascript
// En la consola de Firebase (firestore)
// Ir a: https://console.firebase.google.com
// 1. Ir a Authentication
// 2. Agregar usuario manualmente con email/password
// 3. Copiar el UID del usuario
// 4. Ir a Firestore Database
// 5. Crear colección "usuarios"
// 6. Crear documento con el UID del usuario
// 7. Agregar campos:
{
  email: "admin@edark.com",
  nombre: "Administrador",
  apellido: "eDark",
  role: "admin",
  activo: true,
  fechaCreacion: (timestamp actual)
}
```

---

## 📝 **Ejemplo de Uso en Frontend**

### **Crear Venta (desde `carrito.html`):**

```javascript
// Usar Cloud Function
async function crearVenta(ventaData) {
  try {
    const response = await fetch(
      'https://us-central1-edark-proyect.cloudfunctions.net/api/ventas',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ventaData)
      }
    );
    
    const result = await response.json();
    console.log('Venta creada:', result.numeroOrden);
    return result;
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### **Obtener Dashboard (desde `admin/dashboard.html`):**

```javascript
async function cargarDashboard() {
  try {
    const response = await fetch(
      'https://us-central1-edark-proyect.cloudfunctions.net/api/reportes/dashboard'
    );
    
    const data = await response.json();
    console.log('Dashboard:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

## 🎉 **¡LISTO!**

Ahora tu marketplace funciona 100% en la nube SIN servidor propio:

- ✅ Frontend en GitHub Pages
- ✅ Backend en Firebase Functions
- ✅ Base de datos en Firestore
- ✅ Autenticación en Firebase Auth
- ✅ TODO GRATIS (hasta límites generosos)

---

## 📞 **Troubleshooting**

### **Error: "Cannot find module 'firebase-functions'"**
```powershell
cd firebase-functions
npm install
```

### **Error: "Not authenticated"**
```powershell
firebase login --reauth
```

### **Error: "Permission denied"**
```powershell
firebase deploy --only firestore:rules
```

### **Ver errores de Functions:**
```powershell
firebase functions:log
```

---

## 📚 **Documentación Oficial**

- [Firebase Functions](https://firebase.google.com/docs/functions)
- [GitHub Pages](https://pages.github.com/)
- [Firestore](https://firebase.google.com/docs/firestore)

---

**¡Tu marketplace está listo para funcionar 100% en la nube! 🚀**

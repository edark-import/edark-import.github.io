# 🚀 Guía de Configuración GitHub Pages (Sin Blaze)

## ✅ Completado

- ✅ Firebase configurado directamente desde el navegador
- ✅ Reglas de Firestore desplegadas
- ✅ Todos los archivos actualizados para usar Firebase Client SDK
- ✅ Página de creación de administrador (`createAdmin.html`)

---

## 📋 Pasos Finales de Configuración

### 1. Habilitar Firebase Authentication

Antes de crear tu primer administrador, necesitas habilitar la autenticación:

1. Ve a: https://console.firebase.google.com/project/edark-proyect/authentication
2. Click en **"Comenzar"** o **"Get Started"**
3. En la pestaña **"Sign-in method"**, habilita:
   - ✅ **Email/Password** → Click en "Habilitar" → Guardar

### 2. Habilitar Firestore Database

Si aún no has creado la base de datos:

1. Ve a: https://console.firebase.google.com/project/edark-proyect/firestore
2. Click en **"Crear base de datos"**
3. Selecciona **"Modo de producción"** (las reglas ya están configuradas)
4. Elige la ubicación: **`us-central1`** (o la más cercana a Perú)
5. Click en **"Habilitar"**

### 3. Subir los Cambios a GitHub

```powershell
# Agregar todos los archivos nuevos
git add .

# Hacer commit
git commit -m "✅ Configure GitHub Pages with Firebase client-side (no Blaze needed)"

# Subir a GitHub
git push origin main
```

### 4. Habilitar GitHub Pages

1. Ve a tu repositorio: https://github.com/edark-import/edark-import.github.io
2. Click en **Settings** (Configuración)
3. En el menú lateral, click en **Pages**
4. En **Source**, selecciona:
   - Branch: `main`
   - Folder: `/` (root)
5. Click en **Save**

Espera 2-3 minutos. Tu sitio estará en: **https://edark-import.github.io**

---

## 🔐 Crear tu Primer Administrador

Una vez que GitHub Pages esté activo:

1. Visita: **https://edark-import.github.io/createAdmin.html**
2. Completa el formulario:
   - Email: tu email de administrador
   - Contraseña: mínimo 6 caracteres (usa algo seguro)
   - Nombre: tu nombre completo
3. Click en **"Crear Administrador"**
4. ✅ Redirige al dashboard: **https://edark-import.github.io/admin/dashboard.html**

### ⚠️ IMPORTANTE: Seguridad Post-Configuración

**Después de crear tu primer admin, elimina `createAdmin.html`:**

```powershell
# Eliminar el archivo de creación de admin
git rm createAdmin.html

# Hacer commit
git commit -m "🔒 Remove createAdmin.html after initial setup"

# Subir cambios
git push origin main
```

---

## 📊 Agregar Productos a tu Tienda

### Opción 1: Desde la Consola de Firebase (Recomendado para el inicio)

1. Ve a: https://console.firebase.google.com/project/edark-proyect/firestore/data
2. Click en **"+ Iniciar colección"**
3. ID de la colección: `productos`
4. Agrega un documento con esta estructura:

```json
{
  "nombre": "Laptop Dell Inspiron 15",
  "precio": 799.99,
  "categoria": "Laptops",
  "subcategoria": "Gaming",
  "marca": "Dell",
  "descripcion": "Laptop gaming con procesador Intel i7",
  "imagenUrl": "https://ejemplo.com/imagen.jpg",
  "stock": 10,
  "activo": true,
  "destacado": true,
  "fechaCreacion": "timestamp"
}
```

### Opción 2: Desde el Dashboard (Próximamente)

Podrías crear una interfaz de administración para agregar productos directamente desde `admin/dashboard.html`.

---

## 🎨 Configurar Google AdSense

1. Ve a: https://www.google.com/adsense
2. Crea una cuenta o inicia sesión
3. Agrega tu sitio: `edark-import.github.io`
4. Espera la aprobación (puede tomar 1-2 semanas)
5. Una vez aprobado, obtén tu **Publisher ID** (formato: `ca-pub-XXXXXXXXXXXXXXXX`)
6. Reemplaza en estos archivos:
   - `blog.html` línea 15: `ca-pub-XXXXXXXXXXXXXXXX`
   - `blog-post.html` línea 15: `ca-pub-XXXXXXXXXXXXXXXX`

```powershell
# Después de actualizar el código de AdSense
git add blog.html blog-post.html
git commit -m "✅ Add Google AdSense Publisher ID"
git push origin main
```

---

## 📧 Configurar Email para Notificaciones (Opcional)

Si quieres que el sistema envíe emails de confirmación de pedidos, necesitarás:

### Opción 1: EmailJS (Gratis, desde el navegador)

1. Regístrate en: https://www.emailjs.com
2. Crea un servicio de email (Gmail, Outlook, etc.)
3. Crea una plantilla de email
4. Agrega el SDK en tus páginas:

```html
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
```

### Opción 2: Formspree (Gratis hasta 50 emails/mes)

1. Regístrate en: https://formspree.io
2. Crea un formulario
3. Usa el endpoint en tu código JavaScript

---

## 🔄 Arquitectura Actual

```
┌─────────────────────────────────────────────┐
│         GitHub Pages (Frontend)              │
│  https://edark-import.github.io             │
│                                              │
│  ├── index.html (Tienda)                    │
│  ├── blog.html (Blog + AdSense)             │
│  ├── admin/dashboard.html (Panel Admin)     │
│  └── js/scripts.js (Lógica)                 │
└──────────────────┬──────────────────────────┘
                   │
                   │ Firebase SDK
                   │ (Cliente directo)
                   │
┌──────────────────▼──────────────────────────┐
│         Firebase (Backend)                   │
│  Project: edark-proyect                      │
│                                              │
│  ├── 🔥 Firestore (Base de datos)           │
│  │   ├── productos/                         │
│  │   ├── ventas/                            │
│  │   ├── usuarios/                          │
│  │   ├── blog/                              │
│  │   └── newsletter/                        │
│  │                                           │
│  ├── 🔐 Authentication (Email/Password)     │
│  │   └── Roles: admin, cliente              │
│  │                                           │
│  └── 📜 Firestore Rules (Seguridad)         │
│      └── firestore.rules                    │
└──────────────────────────────────────────────┘
```

### ✅ Ventajas de esta Arquitectura:

- ✅ **Gratis**: No necesitas plan Blaze de Firebase
- ✅ **Simple**: Todo desde GitHub Pages estático
- ✅ **Rápido**: Sin servidores intermedios
- ✅ **Escalable**: Firebase maneja hasta 50K lecturas/día gratis

### ⚠️ Limitaciones:

- ❌ No hay Cloud Functions (sin lógica del lado del servidor)
- ❌ No puedes ocultar completamente las API keys (están en el código cliente)
- ❌ Emails deben enviarse con servicios externos (EmailJS, Formspree)
- ℹ️ Las reglas de Firestore protegen los datos, pero las claves de API son públicas

---

## 🔒 Seguridad

### Firebase API Key en el Código

**¿Es seguro que la API key esté en el código?**

✅ **SÍ, es seguro** porque:

1. Firebase API Keys son **públicas por diseño**
2. La seguridad real está en las **Firestore Rules**
3. Las reglas ya desplegadas protegen:
   - Solo admins pueden modificar productos
   - Solo admins pueden ver ventas
   - Los usuarios solo ven sus propios pedidos
   - Blog solo muestra artículos publicados

### Para más seguridad:

1. **Configura restricciones de API Key** en Firebase Console:
   - Ve a: https://console.firebase.google.com/project/edark-proyect/settings/general/web
   - En la sección de Web API Key, agrega restricciones:
     - Solo permite: `edark-import.github.io`
     - Habilita solo los servicios necesarios

2. **Activa App Check** (opcional, plan gratuito):
   - https://console.firebase.google.com/project/edark-proyect/appcheck
   - Protege contra tráfico no autorizado

---

## 📊 Límites del Plan Spark (Gratis)

| Servicio | Límite Gratuito | Tu Uso Estimado |
|----------|-----------------|-----------------|
| **Firestore Lecturas** | 50,000/día | ~5,000/día ✅ |
| **Firestore Escrituras** | 20,000/día | ~500/día ✅ |
| **Authentication** | Ilimitado | ✅ |
| **Hosting (GitHub Pages)** | Ilimitado | ✅ |
| **Storage** | 1 GB | 100 MB ✅ |
| **Bandwidth** | 10 GB/mes | 2 GB/mes ✅ |

**💡 Conclusión:** El plan gratuito es suficiente para un marketplace pequeño-mediano (hasta ~500 visitas/día).

---

## 🎯 Próximos Pasos Recomendados

### Corto plazo (Esta semana):

1. ✅ Subir cambios a GitHub
2. ✅ Habilitar GitHub Pages
3. ✅ Habilitar Firebase Auth y Firestore
4. ✅ Crear primer administrador
5. 🔜 Agregar productos de prueba
6. 🔜 Probar flujo de compra completo

### Mediano plazo (Este mes):

1. 📊 Solicitar cuenta de Google AdSense
2. 🎨 Personalizar diseño de blog
3. ✍️ Crear primeros artículos con AdSense
4. 📧 Configurar EmailJS para notificaciones
5. 📱 Optimizar para móviles

### Largo plazo (Próximos 3 meses):

1. 💳 Integrar pasarela de pagos (Culqi/MercadoPago)
2. 🔔 Sistema de notificaciones push
3. 📈 Dashboard de Analytics mejorado
4. 🛒 Carrito persistente con Firebase
5. 👥 Sistema de reviews y calificaciones

---

## 🆘 Solución de Problemas

### El sitio no carga en GitHub Pages

- Espera 5-10 minutos después de habilitar Pages
- Verifica que el branch sea `main` y folder sea `/`
- Revisa: https://github.com/edark-import/edark-import.github.io/deployments

### Error: "Firebase App not initialized"

- Verifica que `js/firebase-config.js` esté cargando antes que `scripts.js`
- Abre la consola del navegador (F12) y busca errores

### No puedo crear el administrador

- Verifica que Firebase Authentication esté habilitado
- Verifica que Firestore Database esté creado
- Revisa las reglas en: https://console.firebase.google.com/project/edark-proyect/firestore/rules

### Los productos no aparecen

- Ve a Firestore Console y agrega productos manualmente
- Verifica que tengan el campo `activo: true`
- Abre F12 → Console y busca errores de JavaScript

---

## 📞 Soporte

Si necesitas ayuda adicional:

1. **Firebase Documentation**: https://firebase.google.com/docs
2. **GitHub Pages Guide**: https://docs.github.com/pages
3. **Bootstrap 5 Docs**: https://getbootstrap.com/docs/5.2

---

**¡Tu marketplace está casi listo! 🎉**

Siguiente paso: **Subir los cambios a GitHub y habilitar GitHub Pages**

```powershell
git add .
git commit -m "✅ GitHub Pages configuration ready"
git push origin main
```

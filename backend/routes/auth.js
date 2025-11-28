const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');

const db = admin.firestore();

// ============================================
// REGISTRO DE USUARIO
// ============================================
router.post('/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
    body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
    body('apellido').trim().notEmpty().withMessage('El apellido es requerido'),
    body('telefono').optional().isMobilePhone('es-PE').withMessage('Teléfono inválido')
  ],
  async (req, res) => {
    try {
      // Validar datos de entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, nombre, apellido, telefono, direccion } = req.body;

      // Crear usuario en Firebase Auth
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: `${nombre} ${apellido}`,
        emailVerified: false
      });

      // Guardar datos adicionales en Firestore
      await db.collection('usuarios').doc(userRecord.uid).set({
        email,
        nombre,
        apellido,
        telefono: telefono || '',
        direccion: direccion || '',
        role: 'cliente', // Por defecto es cliente
        fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
        activo: true
      });

      // Generar token JWT
      const token = jwt.sign(
        { 
          uid: userRecord.uid, 
          email, 
          role: 'cliente' 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        token,
        user: {
          uid: userRecord.uid,
          email,
          nombre,
          apellido,
          role: 'cliente'
        }
      });

    } catch (error) {
      console.error('Error en registro:', error);
      
      if (error.code === 'auth/email-already-exists') {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }
      
      res.status(500).json({ error: 'Error al registrar usuario' });
    }
  }
);

// ============================================
// LOGIN
// ============================================
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Verificar usuario con Firebase Auth (usando el SDK del cliente en frontend)
      // Aquí solo verificamos que el usuario existe en Firestore
      const usuariosRef = db.collection('usuarios');
      const snapshot = await usuariosRef.where('email', '==', email).get();

      if (snapshot.empty) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      if (!userData.activo) {
        return res.status(403).json({ error: 'Usuario desactivado' });
      }

      // Generar token JWT
      const token = jwt.sign(
        { 
          uid: userDoc.id, 
          email: userData.email, 
          role: userData.role || 'cliente' 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login exitoso',
        token,
        user: {
          uid: userDoc.id,
          email: userData.email,
          nombre: userData.nombre,
          apellido: userData.apellido,
          role: userData.role
        }
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error al iniciar sesión' });
    }
  }
);

// ============================================
// VERIFICAR TOKEN
// ============================================
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Obtener datos actualizados del usuario
    const userDoc = await db.collection('usuarios').doc(decoded.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const userData = userDoc.data();

    res.json({
      valid: true,
      user: {
        uid: decoded.uid,
        email: userData.email,
        nombre: userData.nombre,
        apellido: userData.apellido,
        role: userData.role
      }
    });

  } catch (error) {
    res.status(401).json({ 
      valid: false, 
      error: 'Token inválido o expirado' 
    });
  }
});

// ============================================
// CAMBIAR ROL (Solo Admin)
// ============================================
router.patch('/change-role/:uid',
  [
    body('role').isIn(['admin', 'cliente', 'vendedor']).withMessage('Rol inválido')
  ],
  async (req, res) => {
    try {
      // Verificar que el usuario que hace la petición sea admin
      const token = req.headers.authorization?.split('Bearer ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const adminDoc = await db.collection('usuarios').doc(decoded.uid).get();
      if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { uid } = req.params;
      const { role } = req.body;

      await db.collection('usuarios').doc(uid).update({ role });

      res.json({ 
        message: 'Rol actualizado exitosamente',
        uid,
        newRole: role
      });

    } catch (error) {
      console.error('Error al cambiar rol:', error);
      res.status(500).json({ error: 'Error al cambiar rol' });
    }
  }
);

module.exports = router;

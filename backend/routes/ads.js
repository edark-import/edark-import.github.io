const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const db = admin.firestore();

// ============================================
// OBTENER ESPACIOS PUBLICITARIOS
// ============================================
router.get('/espacios', async (req, res) => {
  try {
    const { ubicacion, activo } = req.query;

    let query = db.collection('espacios_publicitarios');

    if (ubicacion) {
      query = query.where('ubicacion', '==', ubicacion);
    }

    if (activo !== undefined) {
      query = query.where('activo', '==', activo === 'true');
    }

    const snapshot = await query.get();
    
    let espacios = [];
    snapshot.forEach(doc => {
      espacios.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({ espacios });

  } catch (error) {
    console.error('Error al obtener espacios publicitarios:', error);
    res.status(500).json({ error: 'Error al obtener espacios publicitarios' });
  }
});

// ============================================
// CREAR ESPACIO PUBLICITARIO (Solo Admin)
// ============================================
router.post('/espacios', async (req, res) => {
  try {
    // Verificar rol de administrador
    const token = req.headers.authorization?.split('Bearer ')[1];
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userDoc = await db.collection('usuarios').doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { nombre, ubicacion, tipo, codigo, activo } = req.body;

    const espacioData = {
      nombre,
      ubicacion, // 'header', 'sidebar', 'footer', 'blog-top', 'blog-sidebar', 'blog-content'
      tipo, // 'adsense', 'banner', 'custom'
      codigo, // Código HTML del anuncio
      activo: activo !== false,
      impresiones: 0,
      clics: 0,
      fechaCreacion: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('espacios_publicitarios').add(espacioData);

    res.status(201).json({
      message: 'Espacio publicitario creado exitosamente',
      id: docRef.id,
      espacio: espacioData
    });

  } catch (error) {
    console.error('Error al crear espacio publicitario:', error);
    res.status(500).json({ error: 'Error al crear espacio publicitario' });
  }
});

// ============================================
// ACTUALIZAR ESPACIO PUBLICITARIO (Solo Admin)
// ============================================
router.put('/espacios/:id', async (req, res) => {
  try {
    // Verificar rol de administrador
    const token = req.headers.authorization?.split('Bearer ')[1];
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userDoc = await db.collection('usuarios').doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { id } = req.params;
    const updateData = { ...req.body };
    
    delete updateData.impresiones;
    delete updateData.clics;
    
    updateData.fechaActualizacion = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('espacios_publicitarios').doc(id).update(updateData);

    res.json({
      message: 'Espacio publicitario actualizado exitosamente',
      id
    });

  } catch (error) {
    console.error('Error al actualizar espacio publicitario:', error);
    res.status(500).json({ error: 'Error al actualizar espacio publicitario' });
  }
});

// ============================================
// REGISTRAR IMPRESIÓN
// ============================================
router.post('/espacios/:id/impresion', async (req, res) => {
  try {
    const { id } = req.params;

    await db.collection('espacios_publicitarios').doc(id).update({
      impresiones: admin.firestore.FieldValue.increment(1)
    });

    res.json({ message: 'Impresión registrada' });

  } catch (error) {
    console.error('Error al registrar impresión:', error);
    res.status(500).json({ error: 'Error al registrar impresión' });
  }
});

// ============================================
// REGISTRAR CLIC
// ============================================
router.post('/espacios/:id/clic', async (req, res) => {
  try {
    const { id } = req.params;

    await db.collection('espacios_publicitarios').doc(id).update({
      clics: admin.firestore.FieldValue.increment(1)
    });

    res.json({ message: 'Clic registrado' });

  } catch (error) {
    console.error('Error al registrar clic:', error);
    res.status(500).json({ error: 'Error al registrar clic' });
  }
});

// ============================================
// ESTADÍSTICAS DE PUBLICIDAD (Solo Admin)
// ============================================
router.get('/estadisticas', async (req, res) => {
  try {
    // Verificar rol de administrador
    const token = req.headers.authorization?.split('Bearer ')[1];
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userDoc = await db.collection('usuarios').doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const snapshot = await db.collection('espacios_publicitarios').get();
    
    let estadisticas = [];
    let totalImpresiones = 0;
    let totalClics = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      estadisticas.push({
        id: doc.id,
        nombre: data.nombre,
        ubicacion: data.ubicacion,
        impresiones: data.impresiones || 0,
        clics: data.clics || 0,
        ctr: data.impresiones > 0 ? ((data.clics / data.impresiones) * 100).toFixed(2) : 0
      });
      
      totalImpresiones += data.impresiones || 0;
      totalClics += data.clics || 0;
    });

    res.json({
      totalImpresiones,
      totalClics,
      ctrGlobal: totalImpresiones > 0 ? ((totalClics / totalImpresiones) * 100).toFixed(2) : 0,
      espacios: estadisticas
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

module.exports = router;

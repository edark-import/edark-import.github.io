const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const admin = require('firebase-admin');

const db = admin.firestore();

// Sanitización
const sanitizeHtml = (text) => {
  return String(text).replace(/[<>&"'`]/g, c => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;', '`': '&#96;'
  })[c]);
};

// ============================================
// OBTENER TODOS LOS ARTÍCULOS DEL BLOG
// ============================================
router.get('/', async (req, res) => {
  try {
    const { categoria, publicado, limit = 20 } = req.query;

    let query = db.collection('blog');

    if (categoria) {
      query = query.where('categoria', '==', categoria);
    }

    if (publicado !== undefined) {
      query = query.where('publicado', '==', publicado === 'true');
    }

    const snapshot = await query
      .orderBy('fechaPublicacion', 'desc')
      .limit(parseInt(limit))
      .get();

    let articulos = [];
    snapshot.forEach(doc => {
      articulos.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({ articulos });

  } catch (error) {
    console.error('Error al obtener artículos:', error);
    res.status(500).json({ error: 'Error al obtener artículos' });
  }
});

// ============================================
// OBTENER ARTÍCULO POR SLUG
// ============================================
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const snapshot = await db.collection('blog')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }

    const doc = snapshot.docs[0];
    const articulo = {
      id: doc.id,
      ...doc.data()
    };

    // Incrementar contador de vistas
    await doc.ref.update({
      vistas: admin.firestore.FieldValue.increment(1)
    });

    res.json(articulo);

  } catch (error) {
    console.error('Error al obtener artículo:', error);
    res.status(500).json({ error: 'Error al obtener artículo' });
  }
});

// ============================================
// CREAR ARTÍCULO (Solo Admin)
// ============================================
router.post('/',
  [
    body('titulo').trim().notEmpty().withMessage('El título es requerido'),
    body('contenido').trim().notEmpty().withMessage('El contenido es requerido'),
    body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/).withMessage('Slug inválido'),
    body('categoria').trim().notEmpty().withMessage('La categoría es requerida'),
    body('extracto').optional().trim(),
    body('imagenDestacada').optional().isURL(),
    body('tags').optional().isArray()
  ],
  async (req, res) => {
    try {
      // Verificar rol de administrador
      const token = req.headers.authorization?.split('Bearer ')[1];
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const userDoc = await db.collection('usuarios').doc(decoded.uid).get();
      if (!userDoc.exists || userDoc.data().role !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Verificar que el slug no exista
      const slugExists = await db.collection('blog')
        .where('slug', '==', req.body.slug)
        .get();
      
      if (!slugExists.empty) {
        return res.status(400).json({ error: 'El slug ya existe' });
      }

      const articuloData = {
        titulo: sanitizeHtml(req.body.titulo),
        slug: req.body.slug,
        contenido: req.body.contenido, // Permitir HTML para el contenido
        extracto: req.body.extracto ? sanitizeHtml(req.body.extracto) : '',
        categoria: sanitizeHtml(req.body.categoria),
        tags: req.body.tags || [],
        imagenDestacada: req.body.imagenDestacada || '',
        autor: {
          uid: decoded.uid,
          nombre: userDoc.data().nombre,
          email: userDoc.data().email
        },
        publicado: req.body.publicado || false,
        destacado: req.body.destacado || false,
        vistas: 0,
        fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
        fechaPublicacion: req.body.publicado 
          ? admin.firestore.FieldValue.serverTimestamp() 
          : null,
        seo: {
          metaTitle: req.body.metaTitle || req.body.titulo,
          metaDescription: req.body.metaDescription || req.body.extracto,
          keywords: req.body.keywords || []
        }
      };

      const docRef = await db.collection('blog').add(articuloData);

      res.status(201).json({
        message: 'Artículo creado exitosamente',
        id: docRef.id,
        articulo: articuloData
      });

    } catch (error) {
      console.error('Error al crear artículo:', error);
      res.status(500).json({ error: 'Error al crear artículo' });
    }
  }
);

// ============================================
// ACTUALIZAR ARTÍCULO (Solo Admin)
// ============================================
router.put('/:id', async (req, res) => {
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
    const updateData = {};

    if (req.body.titulo) updateData.titulo = sanitizeHtml(req.body.titulo);
    if (req.body.contenido) updateData.contenido = req.body.contenido;
    if (req.body.extracto) updateData.extracto = sanitizeHtml(req.body.extracto);
    if (req.body.categoria) updateData.categoria = sanitizeHtml(req.body.categoria);
    if (req.body.tags) updateData.tags = req.body.tags;
    if (req.body.imagenDestacada) updateData.imagenDestacada = req.body.imagenDestacada;
    if (req.body.publicado !== undefined) {
      updateData.publicado = req.body.publicado;
      if (req.body.publicado) {
        updateData.fechaPublicacion = admin.firestore.FieldValue.serverTimestamp();
      }
    }
    if (req.body.destacado !== undefined) updateData.destacado = req.body.destacado;

    updateData.fechaActualizacion = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('blog').doc(id).update(updateData);

    res.json({
      message: 'Artículo actualizado exitosamente',
      id,
      updates: updateData
    });

  } catch (error) {
    console.error('Error al actualizar artículo:', error);
    res.status(500).json({ error: 'Error al actualizar artículo' });
  }
});

// ============================================
// ELIMINAR ARTÍCULO (Solo Admin)
// ============================================
router.delete('/:id', async (req, res) => {
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

    await db.collection('blog').doc(id).delete();

    res.json({ 
      message: 'Artículo eliminado exitosamente',
      id 
    });

  } catch (error) {
    console.error('Error al eliminar artículo:', error);
    res.status(500).json({ error: 'Error al eliminar artículo' });
  }
});

// ============================================
// OBTENER CATEGORÍAS DEL BLOG
// ============================================
router.get('/meta/categorias', async (req, res) => {
  try {
    const snapshot = await db.collection('blog').get();
    const categorias = new Set();

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.categoria) {
        categorias.add(data.categoria);
      }
    });

    res.json({ categorias: Array.from(categorias) });

  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

module.exports = router;

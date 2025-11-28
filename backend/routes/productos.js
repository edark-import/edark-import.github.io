const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const admin = require('firebase-admin');

const db = admin.firestore();

// Middleware de sanitización
const sanitizeHtml = (text) => {
  return String(text).replace(/[<>&"'`]/g, c => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;', '`': '&#96;'
  })[c]);
};

// ============================================
// OBTENER TODOS LOS PRODUCTOS (con paginación y filtros)
// ============================================
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('categoria').optional().trim(),
    query('marca').optional().trim(),
    query('precioMin').optional().isFloat({ min: 0 }),
    query('precioMax').optional().isFloat({ min: 0 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const { categoria, marca, precioMin, precioMax, busqueda } = req.query;

      let query = db.collection('productos');

      // Aplicar filtros
      if (categoria) {
        query = query.where('categoria', '==', categoria);
      }
      if (marca) {
        query = query.where('marca', '==', marca);
      }

      // Obtener productos
      const snapshot = await query.get();
      let productos = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        productos.push({
          id: doc.id,
          ...data
        });
      });

      // Filtrar por precio en memoria (Firestore tiene limitaciones con rangos)
      if (precioMin || precioMax) {
        productos = productos.filter(p => {
          const precio = p.precio || 0;
          if (precioMin && precio < parseFloat(precioMin)) return false;
          if (precioMax && precio > parseFloat(precioMax)) return false;
          return true;
        });
      }

      // Búsqueda por texto (en memoria)
      if (busqueda) {
        const searchTerm = busqueda.toLowerCase();
        productos = productos.filter(p => 
          p.nombre?.toLowerCase().includes(searchTerm) ||
          p.descripcion?.toLowerCase().includes(searchTerm) ||
          p.marca?.toLowerCase().includes(searchTerm)
        );
      }

      // Paginación
      const totalProductos = productos.length;
      const totalPages = Math.ceil(totalProductos / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const productosPaginados = productos.slice(startIndex, endIndex);

      res.json({
        productos: productosPaginados,
        paginacion: {
          total: totalProductos,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });

    } catch (error) {
      console.error('Error al obtener productos:', error);
      res.status(500).json({ error: 'Error al obtener productos' });
    }
  }
);

// ============================================
// OBTENER PRODUCTO POR ID
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('productos').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({
      id: doc.id,
      ...doc.data()
    });

  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// ============================================
// CREAR PRODUCTO (Solo Admin)
// ============================================
router.post('/',
  [
    body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
    body('precio').isFloat({ min: 0 }).withMessage('Precio inválido'),
    body('categoria').trim().notEmpty().withMessage('La categoría es requerida'),
    body('stock').isInt({ min: 0 }).withMessage('Stock inválido'),
    body('descripcion').optional().trim(),
    body('imagenes').optional().isArray(),
    body('marca').optional().trim(),
    body('sku').optional().trim()
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

      const productoData = {
        nombre: sanitizeHtml(req.body.nombre),
        precio: parseFloat(req.body.precio),
        categoria: sanitizeHtml(req.body.categoria),
        subcategoria: req.body.subcategoria ? sanitizeHtml(req.body.subcategoria) : '',
        stock: parseInt(req.body.stock),
        descripcion: req.body.descripcion ? sanitizeHtml(req.body.descripcion) : '',
        imagenes: req.body.imagenes || [],
        marca: req.body.marca ? sanitizeHtml(req.body.marca) : '',
        sku: req.body.sku || '',
        activo: true,
        fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
        creadoPor: decoded.uid
      };

      const docRef = await db.collection('productos').add(productoData);

      res.status(201).json({
        message: 'Producto creado exitosamente',
        id: docRef.id,
        producto: productoData
      });

    } catch (error) {
      console.error('Error al crear producto:', error);
      res.status(500).json({ error: 'Error al crear producto' });
    }
  }
);

// ============================================
// ACTUALIZAR PRODUCTO (Solo Admin)
// ============================================
router.put('/:id',
  [
    body('nombre').optional().trim().notEmpty(),
    body('precio').optional().isFloat({ min: 0 }),
    body('stock').optional().isInt({ min: 0 })
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

      const { id } = req.params;
      const updateData = {};

      // Sanitizar y agregar solo los campos proporcionados
      if (req.body.nombre) updateData.nombre = sanitizeHtml(req.body.nombre);
      if (req.body.precio !== undefined) updateData.precio = parseFloat(req.body.precio);
      if (req.body.stock !== undefined) updateData.stock = parseInt(req.body.stock);
      if (req.body.descripcion) updateData.descripcion = sanitizeHtml(req.body.descripcion);
      if (req.body.categoria) updateData.categoria = sanitizeHtml(req.body.categoria);
      if (req.body.marca) updateData.marca = sanitizeHtml(req.body.marca);
      if (req.body.imagenes) updateData.imagenes = req.body.imagenes;
      
      updateData.fechaActualizacion = admin.firestore.FieldValue.serverTimestamp();

      await db.collection('productos').doc(id).update(updateData);

      res.json({
        message: 'Producto actualizado exitosamente',
        id,
        updates: updateData
      });

    } catch (error) {
      console.error('Error al actualizar producto:', error);
      res.status(500).json({ error: 'Error al actualizar producto' });
    }
  }
);

// ============================================
// ELIMINAR PRODUCTO (Solo Admin - Soft Delete)
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

    // Soft delete: marcar como inactivo en lugar de eliminar
    await db.collection('productos').doc(id).update({
      activo: false,
      fechaEliminacion: admin.firestore.FieldValue.serverTimestamp(),
      eliminadoPor: decoded.uid
    });

    res.json({ 
      message: 'Producto eliminado exitosamente',
      id 
    });

  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

module.exports = router;

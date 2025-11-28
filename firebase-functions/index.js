const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

admin.initializeApp();
const db = admin.firestore();

// ============================================
// API EXPRESS CON CLOUD FUNCTIONS
// ============================================
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// ============================================
// ENDPOINTS DE VENTAS
// ============================================

// Crear venta
app.post('/ventas', async (req, res) => {
  try {
    const { cliente, productos, total, metodoPago, direccionEnvio } = req.body;

    // Validaciones básicas
    if (!cliente || !productos || productos.length === 0 || !total) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    // Verificar stock
    for (const item of productos) {
      const prodDoc = await db.collection('productos').doc(item.id).get();
      if (!prodDoc.exists) {
        return res.status(404).json({ error: `Producto ${item.id} no encontrado` });
      }
      const prodData = prodDoc.data();
      if (prodData.stock < item.cantidad) {
        return res.status(400).json({ 
          error: `Stock insuficiente para ${prodData.nombre}` 
        });
      }
    }

    // Generar número de orden
    const timestamp = Date.now();
    const numeroOrden = `ORD-${timestamp}`;

    // Crear venta
    const ventaData = {
      numeroOrden,
      cliente: {
        nombre: cliente.nombre,
        email: cliente.email,
        telefono: cliente.telefono,
        documento: cliente.documento || ''
      },
      productos: productos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        precio: p.precio,
        cantidad: p.cantidad,
        subtotal: p.precio * p.cantidad
      })),
      total: parseFloat(total),
      metodoPago: metodoPago || 'efectivo',
      direccionEnvio: direccionEnvio || '',
      estado: 'pendiente',
      estadoPago: 'pendiente',
      fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
      fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
    };

    const ventaRef = await db.collection('ventas').add(ventaData);

    // Actualizar stock
    const batch = db.batch();
    for (const item of productos) {
      const prodRef = db.collection('productos').doc(item.id);
      batch.update(prodRef, {
        stock: admin.firestore.FieldValue.increment(-item.cantidad)
      });
    }
    await batch.commit();

    res.status(201).json({
      success: true,
      message: 'Venta registrada exitosamente',
      ventaId: ventaRef.id,
      numeroOrden
    });

  } catch (error) {
    console.error('Error al crear venta:', error);
    res.status(500).json({ error: 'Error al procesar la venta' });
  }
});

// Obtener ventas
app.get('/ventas', async (req, res) => {
  try {
    const { estado, limit = 50 } = req.query;

    let query = db.collection('ventas');
    
    if (estado) {
      query = query.where('estado', '==', estado);
    }

    const snapshot = await query
      .orderBy('fechaCreacion', 'desc')
      .limit(parseInt(limit))
      .get();
    
    const ventas = [];
    snapshot.forEach(doc => {
      ventas.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({ ventas });

  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
});

// Obtener venta por ID
app.get('/ventas/:id', async (req, res) => {
  try {
    const doc = await db.collection('ventas').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    res.json({
      id: doc.id,
      ...doc.data()
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener venta' });
  }
});

// Actualizar estado de venta
app.patch('/ventas/:id/estado', async (req, res) => {
  try {
    const { estado } = req.body;
    
    if (!['pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado'].includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    await db.collection('ventas').doc(req.params.id).update({
      estado,
      fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ 
      success: true,
      message: 'Estado actualizado exitosamente' 
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

// ============================================
// ENDPOINTS DE REPORTES
// ============================================

// Dashboard
app.get('/reportes/dashboard', async (req, res) => {
  try {
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - 30);

    // Obtener ventas del último mes
    const ventasSnapshot = await db.collection('ventas')
      .where('fechaCreacion', '>=', fechaInicio)
      .where('fechaCreacion', '<=', fechaFin)
      .get();

    let totalVentas = 0;
    let totalIngresos = 0;
    let ventasPorEstado = {};

    ventasSnapshot.forEach(doc => {
      const venta = doc.data();
      totalVentas++;
      totalIngresos += venta.total || 0;
      ventasPorEstado[venta.estado] = (ventasPorEstado[venta.estado] || 0) + 1;
    });

    // Obtener total de productos
    const productosSnapshot = await db.collection('productos')
      .where('activo', '==', true)
      .get();
    const totalProductos = productosSnapshot.size;

    // Productos con bajo stock
    const productosBajoStock = [];
    productosSnapshot.forEach(doc => {
      const producto = doc.data();
      if (producto.stock < 5) {
        productosBajoStock.push({
          id: doc.id,
          nombre: producto.nombre,
          stock: producto.stock
        });
      }
    });

    // Clientes únicos
    const clientesSet = new Set();
    ventasSnapshot.forEach(doc => {
      const venta = doc.data();
      if (venta.cliente?.email) {
        clientesSet.add(venta.cliente.email);
      }
    });

    res.json({
      resumen: {
        totalVentas,
        totalIngresos,
        totalProductos,
        totalClientes: clientesSet.size,
        ticketPromedio: totalVentas > 0 ? totalIngresos / totalVentas : 0
      },
      ventasPorEstado,
      productosBajoStock
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al generar dashboard' });
  }
});

// ============================================
// ENDPOINTS DE BLOG
// ============================================

// Crear artículo del blog
app.post('/blog', async (req, res) => {
  try {
    const { titulo, slug, contenido, categoria, tags, imagenDestacada, extracto } = req.body;

    // Validaciones
    if (!titulo || !slug || !contenido) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    // Verificar que el slug no exista
    const slugExists = await db.collection('blog')
      .where('slug', '==', slug)
      .get();
    
    if (!slugExists.empty) {
      return res.status(400).json({ error: 'El slug ya existe' });
    }

    const articuloData = {
      titulo,
      slug,
      contenido,
      categoria: categoria || 'General',
      tags: tags || [],
      imagenDestacada: imagenDestacada || '',
      extracto: extracto || '',
      publicado: false,
      vistas: 0,
      fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
      fechaPublicacion: null
    };

    const docRef = await db.collection('blog').add(articuloData);

    res.status(201).json({
      success: true,
      message: 'Artículo creado exitosamente',
      id: docRef.id
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al crear artículo' });
  }
});

// Actualizar artículo
app.put('/blog/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Si se publica, agregar fecha de publicación
    if (updateData.publicado === true) {
      updateData.fechaPublicacion = admin.firestore.FieldValue.serverTimestamp();
    }
    
    updateData.fechaActualizacion = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('blog').doc(id).update(updateData);

    res.json({
      success: true,
      message: 'Artículo actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al actualizar artículo' });
  }
});

// ============================================
// ENDPOINTS DE NEWSLETTER
// ============================================

app.post('/newsletter/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    // Verificar si ya está suscrito
    const existing = await db.collection('newsletter')
      .where('email', '==', email)
      .get();

    if (!existing.empty) {
      return res.status(400).json({ error: 'Este email ya está suscrito' });
    }

    await db.collection('newsletter').add({
      email,
      fechaSuscripcion: admin.firestore.FieldValue.serverTimestamp(),
      activo: true
    });

    res.json({
      success: true,
      message: '¡Gracias por suscribirte!'
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al suscribirse' });
  }
});

// ============================================
// EXPORTAR FUNCIÓN
// ============================================
exports.api = functions.https.onRequest(app);

// ============================================
// FUNCIÓN PARA ENVIAR EMAILS (Trigger)
// ============================================
exports.enviarEmailConfirmacion = functions.firestore
  .document('ventas/{ventaId}')
  .onCreate(async (snap, context) => {
    const venta = snap.data();
    
    // Aquí puedes integrar Nodemailer o un servicio de email
    console.log('Nueva venta creada:', venta.numeroOrden);
    console.log('Enviar email a:', venta.cliente.email);
    
    // TODO: Implementar envío de email real
    
    return null;
  });

// ============================================
// FUNCIÓN PARA ACTUALIZAR PRECIOS (Scheduled)
// ============================================
exports.actualizarPrecios = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    try {
      // Obtener tipo de cambio de SUNAT
      const axios = require('axios');
      const response = await axios.get('https://api.apis.net.pe/v1/tipo-cambio-sunat');
      const tipoCambio = response.data.venta || 3.8;

      console.log('Tipo de cambio:', tipoCambio);

      // Actualizar productos si es necesario
      const snapshot = await db.collection('productos').get();
      
      let actualizados = 0;
      const batch = db.batch();

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.precioCompra && data.actualizarPrecioDinamico) {
          const nuevoPrecio = Math.ceil(data.precioCompra * tipoCambio * 1.18 * 1.45);
          batch.update(doc.ref, { precio: nuevoPrecio });
          actualizados++;
        }
      });

      if (actualizados > 0) {
        await batch.commit();
        console.log(`Actualizados ${actualizados} productos`);
      }

      return null;
    } catch (error) {
      console.error('Error al actualizar precios:', error);
      return null;
    }
  });

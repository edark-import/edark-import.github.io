const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

const db = admin.firestore();

// Configurar nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ============================================
// CREAR VENTA/PEDIDO
// ============================================
router.post('/',
  [
    body('cliente').notEmpty().withMessage('Información del cliente requerida'),
    body('productos').isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
    body('total').isFloat({ min: 0 }).withMessage('Total inválido'),
    body('metodoPago').isIn(['efectivo', 'transferencia', 'tarjeta', 'culqi', 'mercadopago']).withMessage('Método de pago inválido')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { cliente, productos, total, metodoPago, direccionEnvio, notas } = req.body;

      // Verificar stock de productos
      for (const item of productos) {
        const prodDoc = await db.collection('productos').doc(item.id).get();
        if (!prodDoc.exists) {
          return res.status(404).json({ error: `Producto ${item.id} no encontrado` });
        }
        const prodData = prodDoc.data();
        if (prodData.stock < item.cantidad) {
          return res.status(400).json({ 
            error: `Stock insuficiente para ${prodData.nombre}. Disponible: ${prodData.stock}` 
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
        metodoPago,
        direccionEnvio: direccionEnvio || '',
        notas: notas || '',
        estado: 'pendiente', // pendiente, confirmado, enviado, entregado, cancelado
        estadoPago: metodoPago === 'efectivo' ? 'pendiente' : 'pagado',
        fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
        fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
      };

      const ventaRef = await db.collection('ventas').add(ventaData);

      // Actualizar stock de productos
      const batch = db.batch();
      for (const item of productos) {
        const prodRef = db.collection('productos').doc(item.id);
        batch.update(prodRef, {
          stock: admin.firestore.FieldValue.increment(-item.cantidad)
        });
      }
      await batch.commit();

      // Enviar email de confirmación
      try {
        await enviarEmailConfirmacion(cliente.email, ventaData);
      } catch (emailError) {
        console.error('Error al enviar email:', emailError);
        // No fallar la venta si falla el email
      }

      res.status(201).json({
        message: 'Venta registrada exitosamente',
        ventaId: ventaRef.id,
        numeroOrden,
        venta: ventaData
      });

    } catch (error) {
      console.error('Error al crear venta:', error);
      res.status(500).json({ error: 'Error al procesar la venta' });
    }
  }
);

// ============================================
// OBTENER VENTAS (con filtros)
// ============================================
router.get('/', async (req, res) => {
  try {
    const { estado, fechaInicio, fechaFin, cliente } = req.query;

    let query = db.collection('ventas');

    if (estado) {
      query = query.where('estado', '==', estado);
    }

    const snapshot = await query.orderBy('fechaCreacion', 'desc').limit(100).get();
    
    let ventas = [];
    snapshot.forEach(doc => {
      ventas.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Filtros adicionales en memoria
    if (cliente) {
      ventas = ventas.filter(v => 
        v.cliente.nombre?.toLowerCase().includes(cliente.toLowerCase()) ||
        v.cliente.email?.toLowerCase().includes(cliente.toLowerCase())
      );
    }

    res.json({ ventas });

  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
});

// ============================================
// OBTENER VENTA POR ID
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('ventas').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    res.json({
      id: doc.id,
      ...doc.data()
    });

  } catch (error) {
    console.error('Error al obtener venta:', error);
    res.status(500).json({ error: 'Error al obtener venta' });
  }
});

// ============================================
// ACTUALIZAR ESTADO DE VENTA (Solo Admin)
// ============================================
router.patch('/:id/estado',
  [
    body('estado').isIn(['pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { estado, notas } = req.body;

      const updateData = {
        estado,
        fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
      };

      if (notas) {
        updateData.notasEstado = notas;
      }

      await db.collection('ventas').doc(id).update(updateData);

      // Enviar notificación al cliente
      const ventaDoc = await db.collection('ventas').doc(id).get();
      if (ventaDoc.exists) {
        const ventaData = ventaDoc.data();
        try {
          await enviarEmailEstado(ventaData.cliente.email, estado, ventaData);
        } catch (emailError) {
          console.error('Error al enviar email de estado:', emailError);
        }
      }

      res.json({
        message: 'Estado actualizado exitosamente',
        id,
        nuevoEstado: estado
      });

    } catch (error) {
      console.error('Error al actualizar estado:', error);
      res.status(500).json({ error: 'Error al actualizar estado' });
    }
  }
);

// ============================================
// FUNCIONES AUXILIARES - EMAIL
// ============================================
async function enviarEmailConfirmacion(email, venta) {
  const productosHtml = venta.productos.map(p => `
    <tr>
      <td>${p.nombre}</td>
      <td>${p.cantidad}</td>
      <td>S/ ${p.precio.toFixed(2)}</td>
      <td>S/ ${p.subtotal.toFixed(2)}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Confirmación de Pedido - ${venta.numeroOrden}`,
    html: `
      <h2>¡Gracias por tu compra en eDark!</h2>
      <p>Tu pedido ha sido recibido correctamente.</p>
      <h3>Detalles del Pedido:</h3>
      <p><strong>Número de Orden:</strong> ${venta.numeroOrden}</p>
      <table border="1" cellpadding="10">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Precio</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${productosHtml}
        </tbody>
      </table>
      <p><strong>Total:</strong> S/ ${venta.total.toFixed(2)}</p>
      <p><strong>Método de Pago:</strong> ${venta.metodoPago}</p>
      <br>
      <p>Nos pondremos en contacto contigo pronto para confirmar tu pedido.</p>
      <p>Saludos,<br>Equipo eDark</p>
    `
  };

  return transporter.sendMail(mailOptions);
}

async function enviarEmailEstado(email, estado, venta) {
  const mensajes = {
    confirmado: 'Tu pedido ha sido confirmado y está siendo preparado.',
    enviado: 'Tu pedido ha sido enviado y está en camino.',
    entregado: '¡Tu pedido ha sido entregado! Esperamos que lo disfrutes.',
    cancelado: 'Tu pedido ha sido cancelado. Si tienes dudas, contáctanos.'
  };

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Actualización de Pedido - ${venta.numeroOrden}`,
    html: `
      <h2>Actualización de tu Pedido</h2>
      <p><strong>Número de Orden:</strong> ${venta.numeroOrden}</p>
      <p><strong>Nuevo Estado:</strong> ${estado.toUpperCase()}</p>
      <p>${mensajes[estado] || 'Tu pedido ha sido actualizado.'}</p>
      <br>
      <p>Saludos,<br>Equipo eDark</p>
    `
  };

  return transporter.sendMail(mailOptions);
}

module.exports = router;

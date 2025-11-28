const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const db = admin.firestore();

// ============================================
// DASHBOARD - ESTADÍSTICAS GENERALES
// ============================================
router.get('/dashboard', async (req, res) => {
  try {
    // Obtener fecha de inicio y fin para el periodo (últimos 30 días por defecto)
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - 30);

    // Total de ventas
    const ventasSnapshot = await db.collection('ventas')
      .where('fechaCreacion', '>=', fechaInicio)
      .where('fechaCreacion', '<=', fechaFin)
      .get();

    let totalVentas = 0;
    let totalIngresos = 0;
    let ventasPorEstado = {
      pendiente: 0,
      confirmado: 0,
      enviado: 0,
      entregado: 0,
      cancelado: 0
    };
    let ventasPorMetodoPago = {};

    ventasSnapshot.forEach(doc => {
      const venta = doc.data();
      totalVentas++;
      totalIngresos += venta.total || 0;
      
      if (venta.estado) {
        ventasPorEstado[venta.estado] = (ventasPorEstado[venta.estado] || 0) + 1;
      }
      
      if (venta.metodoPago) {
        ventasPorMetodoPago[venta.metodoPago] = (ventasPorMetodoPago[venta.metodoPago] || 0) + 1;
      }
    });

    // Total de productos
    const productosSnapshot = await db.collection('productos').where('activo', '==', true).get();
    const totalProductos = productosSnapshot.size;

    // Productos con bajo stock
    let productosConBajoStock = [];
    productosSnapshot.forEach(doc => {
      const producto = doc.data();
      if (producto.stock < 5) {
        productosConBajoStock.push({
          id: doc.id,
          nombre: producto.nombre,
          stock: producto.stock
        });
      }
    });

    // Total de clientes únicos
    const clientesSet = new Set();
    ventasSnapshot.forEach(doc => {
      const venta = doc.data();
      if (venta.cliente?.email) {
        clientesSet.add(venta.cliente.email);
      }
    });

    // Productos más vendidos
    const productoVentas = {};
    ventasSnapshot.forEach(doc => {
      const venta = doc.data();
      if (venta.productos) {
        venta.productos.forEach(p => {
          if (productoVentas[p.id]) {
            productoVentas[p.id].cantidad += p.cantidad;
            productoVentas[p.id].total += p.subtotal;
          } else {
            productoVentas[p.id] = {
              nombre: p.nombre,
              cantidad: p.cantidad,
              total: p.subtotal
            };
          }
        });
      }
    });

    const topProductos = Object.entries(productoVentas)
      .sort((a, b) => b[1].cantidad - a[1].cantidad)
      .slice(0, 10)
      .map(([id, data]) => ({ id, ...data }));

    res.json({
      periodo: {
        inicio: fechaInicio,
        fin: fechaFin
      },
      resumen: {
        totalVentas,
        totalIngresos,
        totalProductos,
        totalClientes: clientesSet.size,
        ticketPromedio: totalVentas > 0 ? totalIngresos / totalVentas : 0
      },
      ventasPorEstado,
      ventasPorMetodoPago,
      productosConBajoStock,
      topProductos
    });

  } catch (error) {
    console.error('Error al generar dashboard:', error);
    res.status(500).json({ error: 'Error al generar dashboard' });
  }
});

// ============================================
// REPORTE DE VENTAS POR PERIODO
// ============================================
router.get('/ventas-periodo', async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'Se requieren fechaInicio y fechaFin' });
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    const ventasSnapshot = await db.collection('ventas')
      .where('fechaCreacion', '>=', inicio)
      .where('fechaCreacion', '<=', fin)
      .orderBy('fechaCreacion', 'desc')
      .get();

    let ventas = [];
    let totalIngresos = 0;

    ventasSnapshot.forEach(doc => {
      const venta = doc.data();
      ventas.push({
        id: doc.id,
        numeroOrden: venta.numeroOrden,
        fecha: venta.fechaCreacion,
        cliente: venta.cliente?.nombre || 'N/A',
        total: venta.total,
        estado: venta.estado,
        metodoPago: venta.metodoPago
      });
      totalIngresos += venta.total || 0;
    });

    res.json({
      periodo: { inicio, fin },
      totalVentas: ventas.length,
      totalIngresos,
      ventas
    });

  } catch (error) {
    console.error('Error al generar reporte:', error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

// ============================================
// REPORTE DE INVENTARIO
// ============================================
router.get('/inventario', async (req, res) => {
  try {
    const productosSnapshot = await db.collection('productos').get();

    let productos = [];
    let valorTotalInventario = 0;
    let productosSinStock = 0;
    let productosBajoStock = 0;

    productosSnapshot.forEach(doc => {
      const producto = doc.data();
      const valorInventario = (producto.precio || 0) * (producto.stock || 0);
      
      productos.push({
        id: doc.id,
        nombre: producto.nombre,
        sku: producto.sku || 'N/A',
        categoria: producto.categoria,
        stock: producto.stock || 0,
        precio: producto.precio || 0,
        valorInventario,
        activo: producto.activo !== false
      });

      if (producto.activo !== false) {
        valorTotalInventario += valorInventario;
        if (producto.stock === 0) productosSinStock++;
        if (producto.stock > 0 && producto.stock < 5) productosBajoStock++;
      }
    });

    res.json({
      totalProductos: productos.length,
      productosActivos: productos.filter(p => p.activo).length,
      productosSinStock,
      productosBajoStock,
      valorTotalInventario,
      productos
    });

  } catch (error) {
    console.error('Error al generar reporte de inventario:', error);
    res.status(500).json({ error: 'Error al generar reporte de inventario' });
  }
});

// ============================================
// REPORTE DE CLIENTES
// ============================================
router.get('/clientes', async (req, res) => {
  try {
    const ventasSnapshot = await db.collection('ventas').get();

    const clientesMap = {};

    ventasSnapshot.forEach(doc => {
      const venta = doc.data();
      const email = venta.cliente?.email;
      
      if (email) {
        if (!clientesMap[email]) {
          clientesMap[email] = {
            nombre: venta.cliente.nombre,
            email: email,
            telefono: venta.cliente.telefono,
            totalCompras: 0,
            montoTotal: 0,
            ultimaCompra: venta.fechaCreacion
          };
        }
        
        clientesMap[email].totalCompras++;
        clientesMap[email].montoTotal += venta.total || 0;
        
        // Actualizar última compra si es más reciente
        if (venta.fechaCreacion > clientesMap[email].ultimaCompra) {
          clientesMap[email].ultimaCompra = venta.fechaCreacion;
        }
      }
    });

    const clientes = Object.values(clientesMap)
      .sort((a, b) => b.montoTotal - a.montoTotal);

    res.json({
      totalClientes: clientes.length,
      topClientes: clientes.slice(0, 20),
      clientes
    });

  } catch (error) {
    console.error('Error al generar reporte de clientes:', error);
    res.status(500).json({ error: 'Error al generar reporte de clientes' });
  }
});

// ============================================
// EXPORTAR DATOS (CSV - Básico)
// ============================================
router.get('/exportar/:tipo', async (req, res) => {
  try {
    const { tipo } = req.params;

    if (tipo === 'ventas') {
      const ventasSnapshot = await db.collection('ventas').orderBy('fechaCreacion', 'desc').limit(1000).get();
      
      let csv = 'Orden,Fecha,Cliente,Email,Total,Estado,Método Pago\n';
      
      ventasSnapshot.forEach(doc => {
        const v = doc.data();
        csv += `${v.numeroOrden},${v.fechaCreacion?.toDate() || ''},${v.cliente?.nombre || ''},${v.cliente?.email || ''},${v.total},${v.estado},${v.metodoPago}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=ventas.csv');
      res.send(csv);

    } else if (tipo === 'productos') {
      const productosSnapshot = await db.collection('productos').get();
      
      let csv = 'ID,Nombre,SKU,Categoría,Marca,Precio,Stock,Activo\n';
      
      productosSnapshot.forEach(doc => {
        const p = doc.data();
        csv += `${doc.id},${p.nombre},${p.sku || ''},${p.categoria},${p.marca || ''},${p.precio},${p.stock},${p.activo !== false ? 'Sí' : 'No'}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=productos.csv');
      res.send(csv);

    } else {
      res.status(400).json({ error: 'Tipo de exportación inválido' });
    }

  } catch (error) {
    console.error('Error al exportar datos:', error);
    res.status(500).json({ error: 'Error al exportar datos' });
  }
});

module.exports = router;

// Requisitos: npm install firebase axios
const firebase = require('firebase/compat/app');
require('firebase/compat/firestore');
const axios = require('axios');

// Configuración de Firebase (usa tus credenciales reales)
const firebaseConfig = {
    apiKey: "AIzaSyBXbqr_NrwqcfDvvk1mqN9GKKPaRv4uvx4",
    authDomain: "edark-proyect.firebaseapp.com",
    projectId: "edark-proyect",
    storageBucket: "edark-proyect.appspot.com",
    messagingSenderId: "705929141287",
    appId: "1:705929141287:web:f16389625de554d6790202",
    measurementId: "G-V89W8SCSH1"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Obtiene el tipo de cambio SUNAT, si falla retorna 3.8
async function getTipoCambio() {
    try {
        const res = await axios.get('https://api.apis.net.pe/v1/tipo-cambio-sunat');
        if (res.data && res.data.venta) {
            console.log(`Tipo de cambio SUNAT obtenido: S/${res.data.venta}`);
            return parseFloat(res.data.venta);
        }
    } catch (e) {
        console.warn('No se pudo obtener el tipo de cambio SUNAT, usando 3.8');
    }
    return 3.8;
}

// Actualiza los precios de todos los productos
async function actualizarPrecios() {
    const tipoCambio = await getTipoCambio();
    const snapshot = await db.collection('productos').get();
    let actualizados = 0;
    for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.precioCompra) {
            // Puedes ajustar la fórmula según tu lógica de negocio
            const nuevoPrecio = Math.ceil(data.precioCompra * tipoCambio * 1.18 * 1.45);
            await db.collection('productos').doc(doc.id).update({ precio: nuevoPrecio });
            console.log(`Producto "${data.nombre}" actualizado a S/${nuevoPrecio}`);
            actualizados++;
        }
    }
    console.log(`Actualización completa. Productos actualizados: ${actualizados}`);
    process.exit(0);
}

actualizarPrecios();
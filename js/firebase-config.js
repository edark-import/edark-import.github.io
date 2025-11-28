// Configuración de Firebase
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBXbqr_NrwqcfDvvk1mqN9GKKPaRv4uvx4",
  authDomain: "edark-proyect.firebaseapp.com",
  projectId: "edark-proyect",
  storageBucket: "edark-proyect.firebasestorage.app",
  messagingSenderId: "705929141287",
  appId: "1:705929141287:web:f16389625de554d6790202",
  measurementId: "G-V89W8SCSH1"
};

// Expose globally for non-module pages (admin/login.html loads this file before ES module SDK)
window.firebaseConfig = firebaseConfig;

// Optional: UMD-style export for bundlers
try { module && (module.exports = { firebaseConfig }); } catch {}

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referencias a servicios
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();
const analytics = firebase.analytics();

console.log('✅ Firebase inicializado correctamente');

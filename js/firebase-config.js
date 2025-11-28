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

// Exponer config global
window.firebaseConfig = firebaseConfig;

// Inicializar Firebase solo si el SDK está cargado y no está inicializado
if (typeof firebase !== 'undefined') {
  if (!firebase.apps || firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  }
  // Referencias v8
  try {
    window.db = firebase.firestore();
    window.auth = firebase.auth();
    window.storage = firebase.storage();
    // Crear alias globales no-modulares para otros scripts
    try { var db = window.db; } catch {}
    try { var auth = window.auth; } catch {}
    try { var storage = window.storage; } catch {}
  } catch (e) {
    // Ignorar si algún servicio no está disponible en la página
  }
  try {
    if (firebase.analytics) {
      window.analytics = firebase.analytics();
    }
  } catch {}
}

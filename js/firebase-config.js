// Configuración de Firebase
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBscPH-0R78LauWxJuLysjWK8QhBBvMHcU",
  authDomain: "edark-store.firebaseapp.com",
  projectId: "edark-store",
  storageBucket: "edark-store.firebasestorage.app",
  messagingSenderId: "281209786595",
  appId: "1:281209786595:web:d64f98dd051a54ef8975d6",
  measurementId: "G-E7QS4JDK5C"
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
    var db = window.db;
    var auth = window.auth;
    var storage = window.storage;
  } catch (e) {
    // Ignorar si algún servicio no está disponible en la página
  }
  try {
    if (firebase.analytics) {
      window.analytics = firebase.analytics();
    }
  } catch {}
}

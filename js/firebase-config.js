// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBXbqr_NrwqcfDvvk1mqN9GKKPaRv4uvx4",
  authDomain: "edark-proyect.firebaseapp.com",
  projectId: "edark-proyect",
  storageBucket: "edark-proyect.firebasestorage.app",
  messagingSenderId: "705929141287",
  appId: "1:705929141287:web:f16389625de554d6790202",
  measurementId: "G-V89W8SCSH1"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referencias a servicios
const db = firebase.firestore();
const auth = firebase.auth();
const analytics = firebase.analytics();

console.log('✅ Firebase inicializado correctamente');

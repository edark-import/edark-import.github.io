// setAdminClaim.js
// Script para asignar el claim 'admin: true' a un usuario de Firebase Auth
// Uso: Ejecutado por GitHub Actions, usando variables de entorno

const admin = require('firebase-admin');

// El correo del usuario a convertir en admin se pasa por variable de entorno
const email = process.env.ADMIN_EMAIL;
if (!email) {
  console.error('ADMIN_EMAIL no definido.');
  process.exit(1);
}

// La clave de servicio se pasa como string JSON en la variable de entorno FIREBASE_SERVICE_ACCOUNT
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (e) {
  console.error('FIREBASE_SERVICE_ACCOUNT inválido o no definido.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

admin.auth().getUserByEmail(email)
  .then(user => admin.auth().setCustomUserClaims(user.uid, { admin: true }))
  .then(() => {
    console.log(`Claim admin asignado a ${email}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });

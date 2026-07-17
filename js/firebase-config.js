// Firebase configuration shared by the storefront and auth flows.
const firebaseConfig = {
  apiKey: "AIzaSyAvJUdjnY7xjnlTSYJAQZ6safylKXKlzLc",
  authDomain: "primos-informatica-ecommerce.firebaseapp.com",
  projectId: "primos-informatica-ecommerce",
  storageBucket: "primos-informatica-ecommerce.firebasestorage.app",
  messagingSenderId: "989269165415",
  appId: "1:989269165415:web:e372a9915f616f9cae9bc2",
  measurementId: "G-J6KVL50YGQ"
};

function initializeFirebase() {
  if (typeof firebase === 'undefined') {
    return false;
  }

  let app = null;

  try {
    app = firebase.apps && firebase.apps.length > 0
      ? firebase.app()
      : firebase.initializeApp(firebaseConfig);
  } catch (error) {
    // Evita quebrar a tela quando o SDK ainda não terminou de carregar.
    return false;
  }

  window.firebaseApp = app;

  if (typeof firebase.firestore === 'function') {
    window.firebaseDB = firebase.firestore();
  }

  if (typeof firebase.auth === 'function') {
    window.firebaseAuth = firebase.auth();
  }

  if (typeof firebase.storage === 'function') {
    window.firebaseStorage = firebase.storage();
  }

  return true;
}

function areRequestedFirebaseServicesReady() {
  if (typeof firebase === 'undefined') {
    return false;
  }

  const firestoreReady = typeof firebase.firestore !== 'function' || Boolean(window.firebaseDB);
  const authReady = typeof firebase.auth !== 'function' || Boolean(window.firebaseAuth);
  const storageReady = typeof firebase.storage !== 'function' || Boolean(window.firebaseStorage);

  return firestoreReady && authReady && storageReady;
}

// Tentativa imediata para evitar corrida entre DOMContentLoaded e primeiro tick do intervalo.
initializeFirebase();

const firebaseBootstrapInterval = setInterval(() => {
  const initialized = initializeFirebase();

  if (initialized && areRequestedFirebaseServicesReady()) {
    clearInterval(firebaseBootstrapInterval);
  }
}, 100);

setTimeout(() => {
  clearInterval(firebaseBootstrapInterval);
}, 5000);

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

  const app = firebase.apps && firebase.apps.length > 0
    ? firebase.app()
    : firebase.initializeApp(firebaseConfig);

  window.firebaseApp = app;

  if (typeof firebase.firestore === 'function') {
    window.firebaseDB = firebase.firestore();
  }

  if (typeof firebase.auth === 'function') {
    window.firebaseAuth = firebase.auth();
  }

  return true;
}

if (!initializeFirebase()) {
  const checkFirebase = setInterval(() => {
    if (initializeFirebase()) {
      clearInterval(checkFirebase);
    }
  }, 100);
}

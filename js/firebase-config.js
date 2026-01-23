// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAvJUdjnY7xjnlTSYJAQZ6safylKXKlzLc",
  authDomain: "primos-informatica-ecommerce.firebaseapp.com",
  projectId: "primos-informatica-ecommerce",
  storageBucket: "primos-informatica-ecommerce.firebasestorage.app",
  messagingSenderId: "989269165415",
  appId: "1:989269165415:web:e372a9915f616f9cae9bc2",
  measurementId: "G-J6KVL50YGQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Exportar para uso global
window.firebaseApp = app;
window.firebaseDB = db;
window.firebaseAnalytics = analytics;

console.log('🔥 Firebase inicializado com sucesso!');

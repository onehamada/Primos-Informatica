// Configuração do Firebase (Compat Mode)
const firebaseConfig = {
  apiKey: "AIzaSyAvJUdjnY7xjnlTSYJAQZ6safylKXKlzLc",
  authDomain: "primos-informatica-ecommerce.firebaseapp.com",
  projectId: "primos-informatica-ecommerce",
  storageBucket: "primos-informatica-ecommerce.firebasestorage.app",
  messagingSenderId: "989269165415",
  appId: "1:989269165415:web:e372a9915f616f9cae9bc2",
  measurementId: "G-J6KVL50YGQ"
};

// Aguardar Firebase estar disponível
function initializeFirebase() {
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    
    // Exportar para uso global
    window.firebaseDB = db;
    window.firebaseApp = firebase.app();
    
    console.log('🔥 Firebase inicializado com sucesso!');
    return true;
  }
  return false;
}

// Tentar inicializar imediatamente ou aguardar
if (!initializeFirebase()) {
  // Se Firebase não estiver disponível, aguardar
  const checkFirebase = setInterval(() => {
    if (initializeFirebase()) {
      clearInterval(checkFirebase);
    }
  }, 100);
}

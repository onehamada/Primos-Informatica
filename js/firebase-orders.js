// Sistema de Pedidos com Firebase (Compat Mode)
class FirebaseOrders {
  constructor() {
    this.db = null;
    this.ordersCollection = 'orders';
    
    // Aguardar Firebase estar disponível
    this.waitForFirebase();
  }
  
  waitForFirebase() {
    const checkDB = () => {
      if (window.firebaseDB) {
        this.db = window.firebaseDB;
        console.log('🔥 FirebaseOrders conectado ao banco de dados');
      } else {
        setTimeout(checkDB, 100);
      }
    };
    checkDB();
  }

  // Salvar pedido no Firebase
  async saveOrder(orderData) {
    if (!this.db) {
      console.error('❌ Firebase não está disponível');
      return { success: false, error: 'Firebase não disponível' };
    }
    
    try {
      const orderRef = await this.db.collection(this.ordersCollection).add({
        ...orderData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Pedido salvo no Firebase:', orderRef.id);
      return { success: true, id: orderRef.id };
    } catch (error) {
      console.error('❌ Erro ao salvar pedido:', error);
      return { success: false, error: error.message };
    }
  }

  // Buscar todos os pedidos (para admin) - VERSÃO CORRIGIDA
  async getAllOrders() {
    if (!this.db) {
      console.error('❌ Firebase não está disponível');
      return { success: false, error: 'Firebase não disponível' };
    }
    
    try {
      // Primeiro, busca sem ordenação para pegar todos os pedidos
      const snapshot = await this.db.collection(this.ordersCollection).get();
      
      const orders = [];
      snapshot.forEach(doc => {
        const orderData = doc.data();
        orders.push({
          id: doc.id,
          ...orderData,
          // Garante que tenha um campo de data para ordenação
          createdAt: orderData.createdAt || orderData.data || new Date()
        });
      });
      
      // Ordena no cliente
      orders.sort((a, b) => {
        const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 
                     a.createdAt instanceof Date ? a.createdAt.getTime() : 
                     new Date(a.createdAt).getTime();
        const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 
                     b.createdAt instanceof Date ? b.createdAt.getTime() : 
                     new Date(b.createdAt).getTime();
        return dateB - dateA; // Ordem decrescente
      });
      
      console.log('📦 Total de pedidos encontrados:', orders.length);
      return { success: true, orders };
    } catch (error) {
      console.error('❌ Erro ao buscar pedidos:', error);
      return { success: false, error: error.message };
    }
  }

  // ... resto do código continua igual
}

// Instância global
const firebaseOrders = new FirebaseOrders();

// Exportar para uso global
window.firebaseOrders = firebaseOrders;
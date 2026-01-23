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

  // Buscar todos os pedidos (para admin)
  async getAllOrders() {
    if (!this.db) {
      console.error('❌ Firebase não está disponível');
      return { success: false, error: 'Firebase não disponível' };
    }
    
    try {
      const snapshot = await this.db
        .collection(this.ordersCollection)
        .orderBy('createdAt', 'desc')
        .get();
      
      const orders = [];
      snapshot.forEach(doc => {
        orders.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('📦 Total de pedidos encontrados:', orders.length);
      return { success: true, orders };
    } catch (error) {
      console.error('❌ Erro ao buscar pedidos:', error);
      return { success: false, error: error.message };
    }
  }

  // Buscar pedidos de um usuário específico
  async getUserOrders(userEmail) {
    if (!this.db) {
      console.error('❌ Firebase não está disponível');
      return { success: false, error: 'Firebase não disponível' };
    }
    
    try {
      const snapshot = await this.db
        .collection(this.ordersCollection)
        .where('email', '==', userEmail)
        .orderBy('createdAt', 'desc')
        .get();
      
      const orders = [];
      snapshot.forEach(doc => {
        orders.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('📦 Pedidos do usuário:', orders.length);
      return { success: true, orders };
    } catch (error) {
      console.error('❌ Erro ao buscar pedidos do usuário:', error);
      return { success: false, error: error.message };
    }
  }

  // Atualizar status do pedido
  async updateOrderStatus(orderId, status) {
    if (!this.db) {
      console.error('❌ Firebase não está disponível');
      return { success: false, error: 'Firebase não disponível' };
    }
    
    try {
      await this.db.collection(this.ordersCollection).doc(orderId).update({
        status: status,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Status atualizado:', orderId, status);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      return { success: false, error: error.message };
    }
  }

  // Listener em tempo real para novos pedidos (admin)
  onNewOrder(callback) {
    if (!this.db) {
      console.error('❌ Firebase não está disponível');
      return null;
    }
    
    return this.db
      .collection(this.ordersCollection)
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        const orders = [];
        snapshot.forEach(doc => {
          orders.push({
            id: doc.id,
            ...doc.data()
          });
        });
        callback(orders);
      });
  }
}

// Instância global
const firebaseOrders = new FirebaseOrders();

// Exportar para uso global
window.firebaseOrders = firebaseOrders;

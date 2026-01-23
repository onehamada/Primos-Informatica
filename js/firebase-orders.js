// Sistema de Pedidos com Firebase (Modular)
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  doc, 
  serverTimestamp,
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

class FirebaseOrders {
  constructor() {
    this.db = window.firebaseDB;
    this.ordersCollection = 'orders';
  }

  // Salvar pedido no Firebase
  async saveOrder(orderData) {
    try {
      const orderRef = await addDoc(collection(this.db, this.ordersCollection), {
        ...orderData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
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
    try {
      const q = query(
        collection(this.db, this.ordersCollection),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
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
    try {
      const q = query(
        collection(this.db, this.ordersCollection),
        where('email', '==', userEmail),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
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
    try {
      const orderRef = doc(this.db, this.ordersCollection, orderId);
      await updateDoc(orderRef, {
        status: status,
        updatedAt: serverTimestamp()
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
    const q = query(
      collection(this.db, this.ordersCollection),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
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

export { firebaseOrders };

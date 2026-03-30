// Sistema de Pedidos com Firebase (Compat Mode)
class FirebaseOrders {
  constructor() {
    this.db = null;
    this.ordersCollection = 'orders';
    this.readyPromise = this.waitForFirebase();
  }

  waitForFirebase() {
    let attempts = 0;
    const maxAttempts = 100;

    return new Promise((resolve, reject) => {
      const checkDB = () => {
        attempts += 1;
        console.log(`Verificando Firebase (${attempts}/${maxAttempts})...`);

        if (window.firebaseDB) {
          this.db = window.firebaseDB;
          console.log('FirebaseOrders conectado ao banco de dados');
          resolve(this.db);
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(checkDB, 100);
          return;
        }

        reject(new Error('Firebase nao disponivel apos varias tentativas'));
      };

      checkDB();
    });
  }

  async ensureReady() {
    if (this.db) {
      return this.db;
    }

    if (!this.readyPromise) {
      this.readyPromise = this.waitForFirebase();
    }

    try {
      return await this.readyPromise;
    } catch (error) {
      console.error('Erro ao inicializar FirebaseOrders:', error);
      return null;
    }
  }

  async saveOrder(orderData) {
    const db = await this.ensureReady();
    if (!db) {
      return { success: false, error: 'Firebase nao disponivel' };
    }

    try {
      const orderRef = await db.collection(this.ordersCollection).add({
        ...orderData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      console.log('Pedido salvo no Firebase:', orderRef.id);
      return { success: true, id: orderRef.id };
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      return { success: false, error: error.message };
    }
  }

  async getAllOrders() {
    const db = await this.ensureReady();
    if (!db) {
      return { success: false, error: 'Firebase nao disponivel' };
    }

    try {
      const snapshot = await db.collection(this.ordersCollection).get();
      const orders = [];

      snapshot.forEach((doc) => {
        const orderData = doc.data();
        orders.push({
          id: doc.id,
          ...orderData,
          createdAt: orderData.createdAt || orderData.data || new Date()
        });
      });

      orders.sort((a, b) => {
        const dateA = a.createdAt?.toMillis
          ? a.createdAt.toMillis()
          : a.createdAt instanceof Date
            ? a.createdAt.getTime()
            : new Date(a.createdAt).getTime();
        const dateB = b.createdAt?.toMillis
          ? b.createdAt.toMillis()
          : b.createdAt instanceof Date
            ? b.createdAt.getTime()
            : new Date(b.createdAt).getTime();

        return dateB - dateA;
      });

      console.log('Total de pedidos encontrados:', orders.length);
      return { success: true, orders };
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      return { success: false, error: error.message };
    }
  }

  async updateOrderStatus(orderId, status) {
    const db = await this.ensureReady();
    if (!db) {
      return { success: false, error: 'Firebase nao disponivel' };
    }

    try {
      await db.collection(this.ordersCollection).doc(orderId).update({
        status,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Status do pedido ${orderId} atualizado para: ${status}`);
      return { success: true };
    } catch (error) {
      console.error(`Erro ao atualizar status do pedido ${orderId}:`, error);
      return { success: false, error: error.message };
    }
  }
}

const firebaseOrders = new FirebaseOrders();
window.firebaseOrders = firebaseOrders;

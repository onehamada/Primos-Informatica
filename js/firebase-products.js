// Sistema de Produtos com Firebase (Compat Mode)
class FirebaseProducts {
  constructor() {
    this.db = null;
    this.productsCollection = 'products';
    this.readyPromise = this.waitForFirebase();
  }

  waitForFirebase() {
    let attempts = 0;
    const maxAttempts = 100;

    return new Promise((resolve, reject) => {
      const checkDB = () => {
        attempts += 1;
        console.log(`Verificando Firebase para produtos (${attempts}/${maxAttempts})...`);

        if (window.firebaseDB) {
          this.db = window.firebaseDB;
          console.log('FirebaseProducts conectado ao banco de dados');
          resolve(this.db);
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(checkDB, 100);
          return;
        }

        reject(new Error('Firebase nao disponivel para produtos apos varias tentativas'));
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
      console.error('Erro ao inicializar FirebaseProducts:', error);
      return null;
    }
  }

  parseNumber(value, fallback = 0) {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : fallback;
    }

    const normalized = String(value ?? '')
      .replace(/\s/g, '')
      .replace(/\.(?=\d{3}(?:\D|$))/g, '')
      .replace(',', '.')
      .replace(/[^0-9.-]/g, '');

    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  normalizeProduct(productData = {}) {
    const currentPrice = this.parseNumber(productData.preco, 0);
    const originalPrice = this.parseNumber(productData.precoOriginal, 0);
    const discount = Math.max(0, Math.min(100, this.parseNumber(productData.desconto, 0)));
    const stock = Math.max(0, Math.round(this.parseNumber(productData.qt, 1)));

    const normalized = {
      codigo: String(productData.codigo || '').trim(),
      nome: String(productData.nome || '').trim(),
      categoria: String(productData.categoria || '').trim(),
      descricao: String(productData.descricao || '').trim(),
      modelo: String(productData.modelo || '').trim(),
      marca: String(productData.marca || '').trim(),
      preco: Number(currentPrice.toFixed(2)),
      qt: stock,
      imagem: String(productData.imagem || 'default.webp').trim() || 'default.webp',
      promocao: discount > 0 || productData.promocao === true || productData.promocao === 'sim',
      origem: String(productData.origem || 'admin').trim() || 'admin',
      ativo: productData.ativo !== false
    };

    if (originalPrice > currentPrice) {
      normalized.precoOriginal = Number(originalPrice.toFixed(2));
    }

    if (discount > 0) {
      normalized.desconto = Number(discount.toFixed(2));
    }

    return normalized;
  }

  async saveProduct(productData) {
    const db = await this.ensureReady();
    if (!db) {
      return { success: false, error: 'Firebase nao disponivel' };
    }

    const normalizedProduct = this.normalizeProduct(productData);

    if (!normalizedProduct.codigo || !normalizedProduct.nome || !normalizedProduct.categoria) {
      return { success: false, error: 'Campos obrigatorios do produto nao foram informados' };
    }

    try {
      const payload = {
        ...normalizedProduct,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (!Object.prototype.hasOwnProperty.call(normalizedProduct, 'precoOriginal')) {
        payload.precoOriginal = firebase.firestore.FieldValue.delete();
      }

      if (!Object.prototype.hasOwnProperty.call(normalizedProduct, 'desconto')) {
        payload.desconto = firebase.firestore.FieldValue.delete();
      }

      await db.collection(this.productsCollection).doc(normalizedProduct.codigo).set(payload, { merge: true });

      console.log('Produto salvo no Firebase:', normalizedProduct.codigo);
      return {
        success: true,
        id: normalizedProduct.codigo,
        product: normalizedProduct
      };
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      return { success: false, error: error.message };
    }
  }

  async getAllProducts() {
    const db = await this.ensureReady();
    if (!db) {
      return { success: false, error: 'Firebase nao disponivel' };
    }

    try {
      const snapshot = await db.collection(this.productsCollection).get();
      const products = [];

      snapshot.forEach((doc) => {
        const productData = doc.data() || {};
        if (productData.ativo === false) {
          return;
        }

        products.push(this.normalizeProduct({
          codigo: productData.codigo || doc.id,
          ...productData
        }));
      });

      products.sort((a, b) => {
        const codeA = String(a.codigo || '');
        const codeB = String(b.codigo || '');
        return codeB.localeCompare(codeA);
      });

      console.log('Total de produtos do Firebase encontrados:', products.length);
      return { success: true, products };
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      return { success: false, error: error.message };
    }
  }
}

const firebaseProducts = new FirebaseProducts();
window.firebaseProducts = firebaseProducts;

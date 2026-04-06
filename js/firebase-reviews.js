// Reviews persistence with Firebase (Compat Mode)
class FirebaseReviews {
  constructor() {
    this.db = null;
    this.reviewsCollection = 'reviews';
    this.readyPromise = this.waitForFirebase();
  }

  waitForFirebase() {
    let attempts = 0;
    const maxAttempts = 100;

    return new Promise((resolve, reject) => {
      const checkDB = () => {
        attempts += 1;

        if (window.firebaseDB) {
          this.db = window.firebaseDB;
          console.log('FirebaseReviews conectado ao banco de dados');
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
      console.error('Erro ao inicializar FirebaseReviews:', error);
      return null;
    }
  }

  normalizePhotoList(photos) {
    if (!Array.isArray(photos)) {
      return [];
    }

    return photos
      .map((photo) => {
        if (typeof photo === 'string') {
          return photo;
        }

        if (photo && typeof photo.url === 'string') {
          return photo.url;
        }

        return '';
      })
      .filter(Boolean);
  }

  sanitizeReview(reviewData) {
    const createdAt = reviewData.createdAt || reviewData.date || new Date().toISOString();

    return {
      id: String(reviewData.id || Date.now()),
      productId: String(reviewData.productId || ''),
      rating: Number(reviewData.rating || 0),
      title: String(reviewData.title || '').trim(),
      text: String(reviewData.text || '').trim(),
      photos: this.normalizePhotoList(reviewData.photos),
      userName: String(reviewData.userName || 'Usuario Anonimo').trim(),
      userEmail: String(reviewData.userEmail || '').trim().toLowerCase(),
      helpful: Number(reviewData.helpful || 0),
      edited: Boolean(reviewData.edited),
      verified: reviewData.verified !== false,
      date: createdAt,
      createdAt,
      updatedAt: new Date().toISOString()
    };
  }

  normalizeSnapshotReview(doc) {
    const data = doc.data() || {};
    return this.sanitizeReview({
      ...data,
      id: data.id || doc.id,
      date: data.date || data.createdAt || new Date().toISOString()
    });
  }

  async getAllReviews() {
    const db = await this.ensureReady();
    if (!db) {
      return { success: false, error: 'Firebase nao disponivel' };
    }

    try {
      const snapshot = await db.collection(this.reviewsCollection).get();
      const reviews = [];

      snapshot.forEach((doc) => {
        reviews.push(this.normalizeSnapshotReview(doc));
      });

      reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return { success: true, reviews };
    } catch (error) {
      console.error('Erro ao buscar avaliacoes:', error);
      return { success: false, error: error.message };
    }
  }

  async saveReview(reviewData) {
    const db = await this.ensureReady();
    if (!db) {
      return { success: false, error: 'Firebase nao disponivel' };
    }

    try {
      const normalized = this.sanitizeReview(reviewData);
      const reviewId = String(normalized.id);

      await db.collection(this.reviewsCollection).doc(reviewId).set({
        ...normalized,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: normalized.createdAt || firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      console.log('Avaliacao salva no Firebase:', reviewId);
      return { success: true, id: reviewId, review: normalized };
    } catch (error) {
      console.error('Erro ao salvar avaliacao:', error);
      return { success: false, error: error.message };
    }
  }

  async incrementHelpful(reviewId) {
    const db = await this.ensureReady();
    if (!db) {
      return { success: false, error: 'Firebase nao disponivel' };
    }

    try {
      await db.collection(this.reviewsCollection).doc(String(reviewId)).set({
        helpful: firebase.firestore.FieldValue.increment(1),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar utilidade da avaliacao:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteReview(reviewId) {
    const db = await this.ensureReady();
    if (!db) {
      return { success: false, error: 'Firebase nao disponivel' };
    }

    try {
      await db.collection(this.reviewsCollection).doc(String(reviewId)).delete();
      console.log('Avaliacao removida do Firebase:', reviewId);
      return { success: true };
    } catch (error) {
      console.error('Erro ao excluir avaliacao:', error);
      return { success: false, error: error.message };
    }
  }
}

const firebaseReviews = new FirebaseReviews();
window.firebaseReviews = firebaseReviews;

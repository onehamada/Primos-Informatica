// === REVIEWS MODULE - Sistema de avaliações e comentários ===

// Sistema de armazenamento de avaliações (localStorage)
const REVIEWS_STORAGE_KEY = 'product_reviews';

// Carregar avaliações do localStorage
function loadReviews() {
  try {
    const saved = localStorage.getItem(REVIEWS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.error('❌ Erro ao carregar avaliações:', error);
    return {};
  }
}

// Salvar avaliações no localStorage
function saveReviews(reviews) {
  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
    debugLog('💾 Avaliações salvas');
  } catch (error) {
    console.error('❌ Erro ao salvar avaliações:', error);
  }
}

// Obter avaliações de um produto
function getProductReviews(productCode) {
  const allReviews = loadReviews();
  return allReviews[productCode] || [];
}

// Adicionar avaliação a um produto
function addProductReview(productCode, review) {
  if (!productCode || !review) {
    notificationManager.show('Dados da avaliação inválidos', 'error');
    return false;
  }

  // Verificar se usuário está logado
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  if (!usuarioLogado) {
    notificationManager.show('Você precisa estar logado para avaliar produtos', 'error');
    return false;
  }

  const usuario = JSON.parse(usuarioLogado);

  // Validar avaliação
  if (!review.rating || review.rating < 1 || review.rating > 5) {
    notificationManager.show('Avaliação deve ser entre 1 e 5 estrelas', 'error');
    return false;
  }

  if (!review.comment || review.comment.trim().length < 10) {
    notificationManager.show('Comentário deve ter pelo menos 10 caracteres', 'error');
    return false;
  }

  const allReviews = loadReviews();

  if (!allReviews[productCode]) {
    allReviews[productCode] = [];
  }

  // Verificar se usuário já avaliou este produto
  const existingReview = allReviews[productCode].find(r => r.userId === usuario.id);
  if (existingReview) {
    notificationManager.show('Você já avaliou este produto', 'error');
    return false;
  }

  // Adicionar nova avaliação
  const newReview = {
    id: Date.now().toString(),
    userId: usuario.id,
    userName: usuario.nome,
    userEmail: usuario.email,
    rating: review.rating,
    comment: review.comment.trim(),
    date: new Date().toISOString(),
    verified: true, // Usuários logados são verificados
    helpful: 0,
    notHelpful: 0
  };

  allReviews[productCode].push(newReview);
  saveReviews(allReviews);

  notificationManager.show('Avaliação enviada com sucesso!', 'success');
  return true;
}

// Calcular média das avaliações
function calculateAverageRating(reviews) {
  if (!reviews || reviews.length === 0) return 0;

  const sum = reviews.reduce((total, review) => total + (review.rating || 0), 0);
  return sum / reviews.length;
}

// Calcular distribuição das estrelas
function calculateRatingDistribution(reviews) {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  reviews.forEach(review => {
    const rating = Math.floor(review.rating || 0);
    if (rating >= 1 && rating <= 5) {
      distribution[rating]++;
    }
  });

  return distribution;
}

// Obter estatísticas das avaliações
function getReviewStats(productCode) {
  const reviews = getProductReviews(productCode);
  const average = calculateAverageRating(reviews);
  const distribution = calculateRatingDistribution(reviews);

  return {
    total: reviews.length,
    average: average,
    distribution: distribution,
    verified: reviews.filter(r => r.verified).length
  };
}

// Sistema de avaliação no produto
function generateStarRating(rating, interactive = false, productCode = null) {
  let stars = '';
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 0; i < fullStars; i++) {
    stars += `<span class="star filled" ${interactive ? `data-rating="${i + 1}" onclick="setRating(${i + 1}, '${productCode}')"` : ''}>★</span>`;
  }

  if (hasHalfStar) {
    stars += `<span class="star half-filled" ${interactive ? `data-rating="${fullStars + 1}" onclick="setRating(${fullStars + 1}, '${productCode}')"` : ''}>★</span>`;
  }

  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    stars += `<span class="star" ${interactive ? `data-rating="${fullStars + (hasHalfStar ? 1 : 0) + i + 1}" onclick="setRating(${fullStars + (hasHalfStar ? 1 : 0) + i + 1}, '${productCode}')"` : ''}>★</span>`;
  }

  return stars;
}

// Definir avaliação (para formulário)
let currentRating = 0;
function setRating(rating, productCode = null) {
  currentRating = rating;

  // Atualizar visual das estrelas
  const stars = document.querySelectorAll('.star-rating .star');
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.add('filled');
    } else {
      star.classList.remove('filled');
    }
  });

  debugLog(`⭐ Avaliação definida: ${rating} estrelas`);
}

// Modal de avaliação
let currentReviewProduct = null;

function openReviewModal(productCode) {
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  if (!usuarioLogado) {
    notificationManager.show('Você precisa estar logado para avaliar produtos', 'error');
    return;
  }

  currentReviewProduct = productCode;
  currentRating = 0;

  // Resetar form
  const reviewForm = document.getElementById('review-form');
  if (reviewForm) {
    reviewForm.reset();
  }

  // Resetar estrelas
  const stars = document.querySelectorAll('.star-rating .star');
  stars.forEach(star => star.classList.remove('filled'));

  // Mostrar modal
  const modal = document.getElementById('review-modal');
  if (modal) {
    modal.classList.add('active');
  }
}

function closeReviewModal() {
  const modal = document.getElementById('review-modal');
  if (modal) {
    modal.classList.remove('active');
  }
  currentReviewProduct = null;
  currentRating = 0;
}

function submitReview() {
  if (!currentReviewProduct || currentRating === 0) {
    notificationManager.show('Selecione uma avaliação e escreva um comentário', 'error');
    return;
  }

  const commentTextarea = document.getElementById('review-comment');
  if (!commentTextarea) {
    notificationManager.show('Erro no formulário', 'error');
    return;
  }

  const comment = commentTextarea.value.trim();
  if (!comment || comment.length < 10) {
    notificationManager.show('Comentário deve ter pelo menos 10 caracteres', 'error');
    return;
  }

  const review = {
    rating: currentRating,
    comment: comment
  };

  if (addProductReview(currentReviewProduct, review)) {
    closeReviewModal();

    // Recarregar avaliações se estiver na página do produto
    if (typeof showProduct === 'function') {
      showProduct(currentReviewProduct);
    }
  }
}

// Sistema de filtros de avaliação
function filterReviews(productCode, filter = 'all') {
  const reviews = getProductReviews(productCode);

  switch (filter) {
    case '5':
      return reviews.filter(r => r.rating === 5);
    case '4':
      return reviews.filter(r => r.rating === 4);
    case '3':
      return reviews.filter(r => r.rating === 3);
    case '2':
      return reviews.filter(r => r.rating === 2);
    case '1':
      return reviews.filter(r => r.rating === 1);
    case 'verified':
      return reviews.filter(r => r.verified);
    case 'recent':
      return reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
    default:
      return reviews;
  }
}

// Sistema de "avaliação útil"
function markReviewHelpful(reviewId, productCode, helpful = true) {
  const allReviews = loadReviews();

  if (!allReviews[productCode]) return;

  const review = allReviews[productCode].find(r => r.id === reviewId);
  if (review) {
    if (helpful) {
      review.helpful = (review.helpful || 0) + 1;
    } else {
      review.notHelpful = (review.notHelpful || 0) + 1;
    }

    saveReviews(allReviews);
    debugLog(`👍 Avaliação ${helpful ? 'útil' : 'não útil'} marcada`);
  }
}

// Renderizar avaliações de um produto
function renderProductReviews(productCode) {
  const reviews = getProductReviews(productCode);
  const container = document.getElementById('product-reviews');

  if (!container) return;

  if (reviews.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <div style="font-size: 48px; margin-bottom: 20px;">⭐</div>
        <h4 style="color: #64748b; margin-bottom: 10px;">Nenhuma avaliação encontrada</h4>
        <p style="color: #9ca3af;">Seja o primeiro a avaliar este produto!</p>
        <button class="btn-primary" onclick="openReviewModal('${productCode}')">
          Escrever Avaliação
        </button>
      </div>
    `;
    return;
  }

  const stats = getReviewStats(productCode);

  let reviewsHTML = `
    <div class="reviews-header">
      <h4>Avaliações dos Clientes (${reviews.length})</h4>
      <div class="reviews-stats">
        <div class="average-rating">
          ${generateStarRating(stats.average)}
          <span>${stats.average.toFixed(1)}</span>
        </div>
      </div>
    </div>

    <div class="reviews-list">
  `;

  reviews.forEach(review => {
    const reviewDate = new Date(review.date).toLocaleDateString('pt-BR');
    reviewsHTML += `
      <div class="review-item">
        <div class="review-header">
          <div class="review-author">
            <strong>${review.userName}</strong>
            ${review.verified ? '<span class="verified-badge">✓ Verificado</span>' : ''}
          </div>
          <div class="review-rating">
            ${generateStarRating(review.rating)}
          </div>
        </div>
        <div class="review-date">${reviewDate}</div>
        <div class="review-comment">${review.comment}</div>
        <div class="review-actions">
          <button onclick="markReviewHelpful('${review.id}', '${productCode}', true)">
            👍 Útil (${review.helpful || 0})
          </button>
          <button onclick="markReviewHelpful('${review.id}', '${productCode}', false)">
            👎 Não útil (${review.notHelpful || 0})
          </button>
        </div>
      </div>
    `;
  });

  reviewsHTML += `
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <button class="btn-primary" onclick="openReviewModal('${productCode}')">
        Escrever Nova Avaliação
      </button>
    </div>
  `;

  container.innerHTML = reviewsHTML;
}

// Inicializar sistema de avaliações
function initReviews() {
  // Event listeners para o modal de avaliação
  document.addEventListener('DOMContentLoaded', function() {
    // Botão submit review
    const submitBtn = document.getElementById('submit-review-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', submitReview);
    }

    // Botão cancel review
    const cancelBtn = document.getElementById('cancel-review-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeReviewModal);
    }

    // Fechar modal clicando fora
    const modal = document.getElementById('review-modal');
    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          closeReviewModal();
        }
      });
    }
  });

  // Event listener para estrelas
  document.addEventListener('click', function(event) {
    if (event.target.classList.contains('star')) {
      const rating = parseInt(event.target.dataset.rating);
      if (rating && rating >= 1 && rating <= 5) {
        setRating(rating);
      }
    }
  });

  debugLog('⭐ Sistema de avaliações inicializado');
}

// Exportar funções
window.getProductReviews = getProductReviews;
window.addProductReview = addProductReview;
window.calculateAverageRating = calculateAverageRating;
window.calculateRatingDistribution = calculateRatingDistribution;
window.getReviewStats = getReviewStats;
window.generateStarRating = generateStarRating;
window.setRating = setRating;
window.openReviewModal = openReviewModal;
window.closeReviewModal = closeReviewModal;
window.submitReview = submitReview;
window.filterReviews = filterReviews;
window.markReviewHelpful = markReviewHelpful;
window.renderProductReviews = renderProductReviews;
window.initReviews = initReviews;

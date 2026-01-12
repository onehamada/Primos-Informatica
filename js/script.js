// === FUNÇÃO PRINCIPAL - CATEGORIAS ===
function showCategory(category) {
  console.log('📂 showCategory chamada com:', category);
  
  // Limpar observer anterior
  if (window.currentObserver) {
    window.currentObserver.disconnect();
    window.currentObserver = null;
  }
  
  // Esconder todas as seções
  const sections = document.querySelectorAll('.products-section, .category');
  console.log('🔍 Seções encontradas para esconder:', sections.length);
  for (let i = 0; i < sections.length; i++) {
    sections[i].style.display = 'none';
  }
  
  // Mostrar seção alvo
  if (category === 'promo' || category === 'promoções') {
    console.log('🎯 Exibindo promoções...');
    showPromocoes();
  } else if (category === 'inicio') {
    console.log('🏠 Exibindo página inicial...');
    const homeSection = document.getElementById('inicio');
    console.log('📍 Seção início encontrada:', !!homeSection);
    if (homeSection) {
      homeSection.style.display = 'block';
      
      // Garantir que a home seja preenchida
      if (allProducts.length > 0) {
        console.log('📦 Preenchendo home com', allProducts.length, 'produtos...');
        populateHome();
      }
      
      // Lazy loading para imagens da home
      setTimeout(function() {
        const homeGrids = homeSection.querySelectorAll('.categories-grid, .products-grid');
        console.log('🖼️ Grids encontrados para lazy loading:', homeGrids.length);
        for (let i = 0; i < homeGrids.length; i++) {
          loadImagesOnScroll(homeGrids[i]);
        }
      }, 200);
    }
  } else {
    const targetSection = document.getElementById(category);
    console.log('📍 Seção alvo encontrada:', !!targetSection, 'para categoria:', category);
    if (targetSection) {
      targetSection.style.display = 'block';
      
      // Lazy loading simplificado
      setTimeout(function() {
        loadImagesOnScroll(targetSection);
      }, 200);
    } else {
      console.error('❌ Seção não encontrada:', category);
    }
  }
  
  // Atualizar botões
  const buttons = document.querySelectorAll('.nav-tab');
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove('active');
  }
  
  const activeBtn = document.querySelector('.nav-tab[data-target="' + category + '"]');
  if (activeBtn) activeBtn.classList.add('active');
  
  // Fechar menu mobile automaticamente ao selecionar uma opção
  closeMobileMenu();
  
  // Atualizar URL
  history.pushState(null, null, '#' + category);
}

// === MOSTRAR PROMOÇÕES ===
function showPromocoes() {
  console.log('showPromocoes() chamada');
  
  // Usar a seção existente no HTML
  let promocoesSection = document.getElementById('promo');
  
  if (!promocoesSection) {
    console.error('Seção #promo não encontrada no HTML');
    return;
  }
  
  // Mostrar a seção
  promocoesSection.style.display = 'block';
  
  // Filtrar produtos em promoção
  const promocoesProducts = [];
  console.log('Total de produtos:', allProducts.length);
  
  for (let i = 0; i < allProducts.length; i++) {
    if (allProducts[i].promocao === 'sim') {
      promocoesProducts.push(allProducts[i]);
      console.log('Produto em promoção:', allProducts[i].nome);
    }
  }
  
  console.log('Produtos em promoção encontrados:', promocoesProducts.length);
  
  // Criar HTML
  let productsHTML = '<h2>PRODUTOS EM PROMOÇÃO</h2>';
  if (promocoesProducts.length === 0) {
    productsHTML += '<p style="text-align: center; padding: 40px; color: #666;">Nenhuma promoção no momento.</p>';
  } else {
    productsHTML += '<div class="products-grid">';
    for (let i = 0; i < promocoesProducts.length; i++) {
      productsHTML += createProductCard(promocoesProducts[i]);
    }
    productsHTML += '</div>';
  }
  
  promocoesSection.innerHTML = productsHTML;
  
  console.log('Seção de promoções exibida com', promocoesProducts.length, 'produtos');
  
  // Fechar menu mobile automaticamente ao selecionar promoções
  closeMobileMenu();
  
  // Lazy loading para promoções
  setTimeout(function() {
    loadImagesOnScroll(promocoesSection);
  }, 200);
}

// === LAZY LOADING MELHORADO ===
function loadImagesOnScroll(container) {
  const images = container.querySelectorAll('img[data-src]');
  const loaded = [];
  
  console.log('🔍 Procurando imagens com data-src em:', container);
  console.log('📊 Imagens encontradas:', images.length);
  
  function checkImages() {
    const windowHeight = window.innerHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (loaded.indexOf(img) !== -1) continue;
      
      // Verificar se tem data-src válido E se ainda não foi carregada
      if (!img.dataset || !img.dataset.src || img.classList.contains('loaded') || img.classList.contains('loading')) {
        console.log('⚠️ Imagem sem data-src válido ou já carregada/em processo, pulando:', img);
        loaded.push(img);
        continue;
      }
      
      const rect = img.getBoundingClientRect();
      const elemTop = rect.top + scrollTop;
      const elemBottom = rect.bottom + scrollTop;
      
      const isInViewport = elemTop < scrollTop + windowHeight + 200 && 
                          elemBottom > scrollTop - 200;
      
      if (isInViewport) {
        console.log('🎯 Carregando imagem:', img.dataset.src);
        
        // Marcar como em carregamento IMEDIATAMENTE para evitar duplicação
        img.classList.add('loading');
        
        // Encontrar o placeholder dentro do mesmo container
        const placeholder = img.parentElement.querySelector('.image-placeholder');
        
        // Configurar eventos de carregamento da imagem
        img.onload = function() {
          // Remover placeholder com animação suave
          if (placeholder) {
            placeholder.classList.add('hiding');
            setTimeout(function() {
              if (placeholder.parentNode) {
                placeholder.remove();
              }
            }, 300);
          }
          
          // Adicionar classe de carregado com animação
          img.classList.remove('loading');
          img.classList.add('loaded');
          
          // Remover data-src para evitar processamento futuro
          img.removeAttribute('data-src');
          
          console.log('✅ Imagem carregada e animação aplicada:', img.src);
        };
        
        img.onerror = function() {
          // Tentar carregar imagem fallback
          if (img.dataset && img.dataset.src) {
            const fallbackSrc = img.dataset.src.replace(/\.webp$/i, '.jpg');
            if (fallbackSrc !== img.dataset.src) {
              console.log('Tentando fallback para:', fallbackSrc);
              img.src = fallbackSrc;
            } else {
              // Tentar fallback para placeholder genérico
              const genericFallback = 'images/products/thumbnail/placeholder.webp';
              if (genericFallback !== img.dataset.src) {
                console.log('Tentando placeholder genérico:', genericFallback);
                img.src = genericFallback;
              } else {
                // Manter placeholder se todas as tentativas falharem
                console.log('Falha ao carregar imagem:', img.dataset.src);
                if (placeholder) {
                  placeholder.textContent = '❌';
                  placeholder.style.opacity = '0.3';
                }
              }
            }
          } else {
            console.log('Erro: dataset.src não disponível');
            if (placeholder) {
              placeholder.textContent = '❌';
              placeholder.style.opacity = '0.3';
            }
          }
          // Marcar como processado mesmo em caso de erro
          img.removeAttribute('data-src');
        };
        
        // Iniciar carregamento
        // Pequeno delay para garantir que a animação seja aplicada
        setTimeout(() => {
          img.src = img.dataset.src;
        }, 50);
        
        loaded.push(img);
      }
    }
    
    // Continuar verificando se ainda há imagens para carregar
    if (loaded.length < images.length) {
      requestAnimationFrame(checkImages);
    }
  }
  
  // Iniciar verificação
  checkImages();
  
  // Verificar no scroll
  var scrollHandler = function() {
    if (loaded.length < images.length) {
      checkImages();
    } else {
      window.removeEventListener('scroll', scrollHandler);
    }
  };
  
  window.addEventListener('scroll', scrollHandler);
}

// === CARREGAR PRODUTOS ===
let allProducts = [];

function loadProducts() {
  return fetch('data/products.csv')
    .then(function(response) {
      return response.text();
    })
    .then(function(csvText) {
      const lines = csvText.split('\n');
      const headers = lines[0].split(';');
      
      allProducts = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = lines[i].split(';');
        const product = {};
        
        for (let j = 0; j < headers.length; j++) {
          product[headers[j].trim()] = values[j] ? values[j].trim() : '';
        }
        
        allProducts.push(product);
      }
      
      displayProducts(allProducts);
    });
}

// === EXIBIR PRODUTOS ===
function displayProducts(products) {
  const categories = {};
  
  // Agrupar por categoria
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const category = product.categoria || 'outros';
    
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(product);
  }
  
  // Criar seções
  const categoryNames = Object.keys(categories);
  for (let i = 0; i < categoryNames.length; i++) {
    const category = categoryNames[i];
    let section = document.getElementById(category);
    
    if (!section) {
      section = document.createElement('section');
      section.id = category;
      section.className = 'products-section';
      section.style.display = 'none';
      
      const main = document.querySelector('main');
      if (main) main.appendChild(section);
    }
    
    // Criar HTML de produtos
    let productsHTML = '<h2>' + category.charAt(0).toUpperCase() + category.slice(1) + '</h2>';
    productsHTML += '<div class="products-grid">';
    
    const categoryProducts = categories[category];
    for (let j = 0; j < categoryProducts.length; j++) {
      productsHTML += createProductCard(categoryProducts[j]);
    }
    
    productsHTML += '</div>';
    section.innerHTML = productsHTML;
  }
  
  // Preencher HOME após carregar produtos
  populateHome();
}

// === PREENCHER HOME ===
function populateHome() {
  console.log('Preenchendo home...');
  
  // Preencher categorias na home
  populateHomeCategories();
  
  // Preencher produtos em destaque na home
  populateHomeHighlights();
}

// === PREENCHER CATEGORIAS DA HOME ===
function populateHomeCategories() {
  const categoriesGrid = document.getElementById('home-categories-grid');
  if (!categoriesGrid) {
    console.error('Elemento #home-categories-grid não encontrado');
    return;
  }
  
  // Obter categorias únicas dos produtos
  const categories = {};
  for (let i = 0; i < allProducts.length; i++) {
    const category = allProducts[i].categoria;
    if (!categories[category]) {
      categories[category] = {
        name: category,
        count: 0,
        sample: allProducts[i]
      };
    }
    categories[category].count++;
  }
  
  // Criar cards de categorias
  let categoriesHTML = '';
  const categoryNames = Object.keys(categories);
  
  for (let i = 0; i < categoryNames.length; i++) {
    const category = categories[categoryNames[i]];
    const displayName = category.name.charAt(0).toUpperCase() + category.name.slice(1);
    
    categoriesHTML += `
      <div class="category-card" onclick="showCategory('${category.name}')" style="cursor: pointer;">
        <div class="category-image">
          <div class="image-placeholder">📦</div>
          <img data-src="images/products/thumbnail/${category.sample.imagem || category.sample.codigo + '.webp'}" 
               alt="${displayName}" 
               style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px;">
        </div>
        <div class="category-info">
          <h3>${displayName}</h3>
          <p class="category-count">${category.count} produtos</p>
          <button class="btn-primary">Ver Produtos</button>
        </div>
      </div>
    `;
  }
  
  categoriesGrid.innerHTML = categoriesHTML;
  
  // Lazy loading para imagens das categorias
  setTimeout(function() {
    loadImagesOnScroll(categoriesGrid);
  }, 200);
  
  console.log('Categorias da home preenchidas:', categoryNames.length);
}

// === PREENCHER PRODUTOS EM DESTAQUE DA HOME ===
function populateHomeHighlights() {
  const highlightsGrid = document.getElementById('home-highlights-grid');
  if (!highlightsGrid) {
    console.error('Elemento #home-highlights-grid não encontrado');
    return;
  }
  
  // Obter produtos em destaque (promoções + alguns produtos aleatórios)
  const highlights = [];
  
  // Adicionar produtos em promoção primeiro
  for (let i = 0; i < allProducts.length; i++) {
    if (allProducts[i].promocao === 'sim') {
      highlights.push(allProducts[i]);
    }
  }
  
  // Se tiver menos de 6 produtos em destaque, adicionar produtos aleatórios
  if (highlights.length < 6) {
    const otherProducts = allProducts.filter(p => p.promocao !== 'sim');
    const needed = 6 - highlights.length;
    const selected = otherProducts.sort(() => 0.5 - Math.random()).slice(0, needed);
    highlights.push(...selected);
  }
  
  // Limitar a 8 produtos no máximo
  const finalHighlights = highlights.slice(0, 8);
  
  // Criar HTML dos produtos em destaque
  let highlightsHTML = '';
  for (let i = 0; i < finalHighlights.length; i++) {
    highlightsHTML += createProductCard(finalHighlights[i]);
  }
  
  highlightsGrid.innerHTML = highlightsHTML;
  
  // Lazy loading para imagens dos destaques
  setTimeout(function() {
    loadImagesOnScroll(highlightsGrid);
  }, 200);
  
  console.log('Produtos em destaque da home preenchidos:', finalHighlights.length);
}

// === FUNÇÕES DE AVALIAÇÕES ===

// Função para obter avaliações de um produto
function getProductReviews(productId) {
  const reviews = JSON.parse(localStorage.getItem('primos_reviews') || '[]');
  return reviews.filter(review => review.productId === productId);
}

// Função para calcular média de avaliações
function calculateAverageRating(reviews) {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return sum / reviews.length;
}

// Função para gerar estrelas
function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  let stars = '';
  
  for (let i = 0; i < fullStars; i++) {
    stars += '<span class="star filled">★</span>';
  }
  
  if (hasHalfStar && fullStars < 5) {
    stars += '<span class="star half-filled">★</span>';
  }
  
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    stars += '<span class="star">☆</span>';
  }
  
  return stars;
}

// Função para gerar HTML das avaliações
function generateReviewsHTML(reviews) {
  if (reviews.length === 0) {
    return '<p style="text-align: center; color: #64748b; padding: 20px;">Nenhuma avaliação ainda. Seja o primeiro a avaliar!</p>';
  }
  
  let html = '';
  reviews.forEach(review => {
    const date = new Date(review.date).toLocaleDateString('pt-BR');
    const stars = generateStars(review.rating);
    
    let photosHtml = '';
    if (review.photos && review.photos.length > 0) {
      photosHtml = '<div class="review-photos">';
      review.photos.forEach(photo => {
        photosHtml += `<img src="${photo.url}" alt="Foto do produto" class="review-photo" onclick="viewPhoto('${photo.url}')">`;
      });
      photosHtml += '</div>';
    }
    
    html += `
      <div class="review-card">
        <div class="review-header">
          <div class="review-user">
            <div class="user-avatar">${review.userName.charAt(0).toUpperCase()}</div>
            <div class="user-info">
              <div class="user-name">${review.userName}</div>
              <div class="review-date">${date}</div>
            </div>
          </div>
          <div class="review-rating">
            <div class="stars">${stars}</div>
            <span class="rating-number">${review.rating}.0</span>
          </div>
        </div>
        
        <div class="review-content">
          <h4>${review.title}</h4>
          <p class="review-text">${review.text}</p>
          ${photosHtml}
        </div>
        
        <div class="review-actions">
          <button class="helpful-btn" onclick="markHelpful('${review.id}')">
            👍 Útil (${review.helpful || 0})
          </button>
        </div>
      </div>
    `;
  });
  
  return html;
}

// Função para alternar visibilidade das avaliações
function toggleReviews(productId) {
  const reviewsSection = document.getElementById('reviews-' + productId);
  const toggleBtn = event.target;
  
  if (reviewsSection.style.display === 'none') {
    reviewsSection.style.display = 'block';
    toggleBtn.textContent = 'Ocultar avaliações';
  } else {
    reviewsSection.style.display = 'none';
    toggleBtn.textContent = 'Ver avaliações';
  }
}

// Função para marcar avaliação como útil
function markHelpful(reviewId) {
  const reviews = JSON.parse(localStorage.getItem('primos_reviews') || '[]');
  const review = reviews.find(r => r.id === reviewId);
  
  if (review) {
    review.helpful = (review.helpful || 0) + 1;
    localStorage.setItem('primos_reviews', JSON.stringify(reviews));
    
    // Atualizar botão
    if (event.target) {
      event.target.classList.add('helpful');
      event.target.innerHTML = `👍 Útil (${review.helpful})`;
    }
  }
}

// Função para visualizar foto em tamanho maior
function viewPhoto(photoUrl) {
  window.open(photoUrl, '_blank');
}

// Função para abrir modal de avaliação
function openReviewModal(productId) {
  // Verificar se usuário está logado
  const currentUser = getCurrentUser();
  if (!currentUser) {
    alert('Você precisa estar logado para avaliar um produto. Faça login ou crie uma conta!');
    return;
  }
  
  currentProductId = productId;
  const modal = document.getElementById('reviewModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

// Função para fechar modal de avaliação
function closeReviewModal() {
  const modal = document.getElementById('reviewModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    resetReviewForm();
  }
}

// Função para definir avaliação em estrelas
function setRating(rating) {
  currentRating = rating;
  const stars = document.querySelectorAll('.star-rating .star');
  stars.forEach((star, index) => {
    if (index < rating) {
      star.textContent = '★';
      star.classList.add('filled');
    } else {
      star.textContent = '☆';
      star.classList.remove('filled');
    }
  });
}

// Função para handle upload de fotos
function handlePhotoUpload(event) {
  const files = Array.from(event.target.files);
  
  if (uploadedPhotos.length + files.length > 3) {
    alert('Você pode enviar no máximo 3 fotos');
    return;
  }
  
  files.forEach(file => {
    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('Cada foto deve ter no máximo 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      uploadedPhotos.push({
        name: file.name,
        url: e.target.result,
        size: file.size
      });
      updatePhotosPreview();
    };
    reader.readAsDataURL(file);
  });
}

// Função para atualizar preview das fotos
function updatePhotosPreview() {
  const preview = document.getElementById('photosPreview');
  if (preview) {
    preview.innerHTML = '';
    
    uploadedPhotos.forEach((photo, index) => {
      const photoDiv = document.createElement('div');
      photoDiv.className = 'photo-preview';
      photoDiv.innerHTML = `
        <img src="${photo.url}" alt="Foto ${index + 1}">
        <button type="button" class="remove-photo" onclick="removePhoto(${index})">&times;</button>
      `;
      preview.appendChild(photoDiv);
    });
  }
}

// Função para remover foto
function removePhoto(index) {
  uploadedPhotos.splice(index, 1);
  updatePhotosPreview();
}

// Função para resetar formulário
function resetReviewForm() {
  currentRating = 0;
  uploadedPhotos = [];
  currentProductId = null;
  
  const form = document.getElementById('reviewForm');
  if (form) {
    form.reset();
    setRating(0);
    updatePhotosPreview();
  }
  
  const photoInput = document.getElementById('photoInput');
  if (photoInput) {
    photoInput.value = '';
  }
}

// Função para enviar avaliação
function submitReview(event) {
  event.preventDefault();
  
  if (currentRating === 0) {
    alert('Por favor, selecione uma avaliação em estrelas');
    return;
  }
  
  const formData = new FormData(event.target);
  const reviewData = {
    id: Date.now().toString(),
    productId: currentProductId,
    rating: currentRating,
    title: formData.get('title'),
    text: formData.get('text'),
    photos: uploadedPhotos,
    userName: getCurrentUser().nome,
    userEmail: getCurrentUser().email,
    date: new Date().toISOString(),
    helpful: 0,
    verified: true // Usuário logado
  };
  
  // Salvar avaliação
  saveReview(reviewData);
  
  // Fechar modal
  closeReviewModal();
  
  // Mostrar mensagem de sucesso
  showSuccessMessage('Avaliação enviada com sucesso! Obrigado por seu feedback.');
  
  // Atualizar interface
  setTimeout(() => {
    location.reload(); // Recarregar página para mostrar nova avaliação
  }, 1500);
}

// Função para salvar avaliação no localStorage
function saveReview(reviewData) {
  const reviews = JSON.parse(localStorage.getItem('primos_reviews') || '[]');
  reviews.push(reviewData);
  localStorage.setItem('primos_reviews', JSON.stringify(reviews));
}

// Função para mostrar mensagem de sucesso
function showSuccessMessage(message) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'success-message';
  messageDiv.textContent = message;
  messageDiv.style.position = 'fixed';
  messageDiv.style.top = '20px';
  messageDiv.style.left = '50%';
  messageDiv.style.transform = 'translateX(-50%)';
  messageDiv.style.zIndex = '10000';
  messageDiv.style.padding = '16px 24px';
  messageDiv.style.borderRadius = '8px';
  messageDiv.style.fontSize = '16px';
  messageDiv.style.fontWeight = '600';
  
  document.body.appendChild(messageDiv);
  
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.parentNode.removeChild(messageDiv);
    }
  }, 3000);
}

// Adicionar funções ao escopo global
window.getProductReviews = getProductReviews;
window.calculateAverageRating = calculateAverageRating;
window.generateStars = generateStars;
window.generateReviewsHTML = generateReviewsHTML;
window.toggleReviews = toggleReviews;
window.markHelpful = markHelpful;
window.viewPhoto = viewPhoto;
window.openReviewModal = openReviewModal;
window.closeReviewModal = closeReviewModal;
window.setRating = setRating;
window.handlePhotoUpload = handlePhotoUpload;
window.removePhoto = removePhoto;
window.submitReview = submitReview;
window.saveReview = saveReview;
window.showSuccessMessage = showSuccessMessage;

// === CARD DE PRODUTO ===
function createProductCard(product) {
  const imageName = product.imagem || product.codigo + '.webp';
  const imagePath = 'images/products/thumbnail/' + imageName;
  
  // Corrigir tratamento de preço para preservar centavos
  const priceString = (product.preco || '0').toString().replace(',', '.');
  const price = parseFloat(priceString);
  const formattedPrice = 'R$ ' + price.toFixed(2).replace('.', ',');
  
  // Carregar avaliações do produto
  const reviews = getProductReviews(product.codigo);
  const averageRating = calculateAverageRating(reviews);
  const reviewCount = reviews.length;
  
  return '<div class="product-card" data-product-code="' + product.codigo + '">' +
    '<div class="product-image">' +
    '<div class="image-placeholder">📦</div>' +
    '<img data-src="' + imagePath + '" alt="' + product.nome + '">' +
    '</div>' +
    '<div class="product-info">' +
    '<h3>' + product.nome + '</h3>' +
    '<div class="product-rating-summary">' +
    '<div class="stars">' + generateStars(averageRating) + '</div>' +
    '<span class="rating-text">' + averageRating.toFixed(1) + ' (' + reviewCount + ')</span>' +
    '<button class="review-btn" onclick="openReviewModal(\'' + product.codigo + '\')">Avaliar</button>' +
    '</div>' +
    '<p class="price">' + formattedPrice + '</p>' +
    '<button class="btn-primary" onclick="addToCart(\'' + product.codigo + '\')">Adicionar</button>' +
    '</div>' +
    '<div class="product-reviews" id="reviews-' + product.codigo + '" style="display: none;">' +
    '<div class="reviews-header">' +
    '<h4>Avaliações dos Clientes</h4>' +
    '<button class="toggle-reviews" onclick="toggleReviews(\'' + product.codigo + '\')">Ver avaliações (' + reviewCount + ')</button>' +
    '</div>' +
    '<div class="reviews-list" id="reviews-list-' + product.codigo + '">' +
    generateReviewsHTML(reviews) +
    '</div>' +
    '</div>' +
    '</div>';
}

// === CARRINHO ===
let cart = [];

function toggleCart() {
  const cartSidebar = document.getElementById('cartSidebar');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartBtn = document.querySelector('.cart-btn');
  const whatsappBtn = document.querySelector('.whatsapp-float');
  
  // Animação no botão do carrinho
  cartBtn.classList.remove('animate', 'shake');
  void cartBtn.offsetWidth; // Força reflow
  cartBtn.classList.add('animate');
  
  setTimeout(() => {
    cartBtn.classList.remove('animate');
  }, 300);
  
  if (cartSidebar.classList.contains('active')) {
    cartSidebar.classList.remove('active');
    cartOverlay.classList.remove('active');
    // Mostra WhatsApp novamente
    if (whatsappBtn) {
      whatsappBtn.style.display = 'flex';
    }
  } else {
    cartSidebar.classList.add('active');
    cartOverlay.classList.add('active');
    // Esconde WhatsApp quando carrinho abre
    if (whatsappBtn) {
      whatsappBtn.style.display = 'none';
    }
    updateCartDisplay();
  }
}

function updateCartDisplay() {
  const cartItems = document.getElementById('cartItems');
  const cartCount = document.getElementById('cartCount');
  const cartTotal = document.getElementById('cartTotal');
  
  cartItems.innerHTML = '';
  let total = 0;
  let itemCount = 0;
  
  if (cart.length === 0) {
    cartItems.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">Seu carrinho está vazio</p>';
  } else {
    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];
      // Corrigir tratamento de preço para preservar centavos
      const priceString = (item.preco || '0').toString().replace(',', '.');
      const price = parseFloat(priceString);
      total += price;
      itemCount++;
      
      const itemElement = document.createElement('div');
      itemElement.className = 'cart-item';
      itemElement.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
          <div>
            <h4 style="margin: 0; font-size: 14px;">${item.nome}</h4>
            <p style="margin: 5px 0; color: #666; font-size: 12px;">${item.marca}</p>
            <p style="margin: 0; font-weight: bold; color: #3b82f6;">R$ ${item.preco}</p>
          </div>
          <button onclick="removeFromCart('${item.codigo}')" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; transition: all 0.2s ease;">×</button>
        </div>
      `;
      cartItems.appendChild(itemElement);
    }
  }
  
  // Animação no contador se houver mudança
  const currentCount = parseInt(cartCount.textContent) || 0;
  if (currentCount !== itemCount) {
    cartCount.classList.remove('animate');
    void cartCount.offsetWidth; // Força reflow
    cartCount.classList.add('animate');
  }
  
  cartCount.textContent = itemCount;
  cartTotal.textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
}

function removeFromCart(productCode) {
  cart = cart.filter(item => item.codigo !== productCode);
  updateCartDisplay();
}

function clearCart() {
  cart = [];
  updateCartDisplay();
}

// === FUNÇÕES DE CHECKOUT ===
function showCheckoutOptions() {
  if (cart.length === 0) {
    alert('Seu carrinho está vazio! Adicione produtos para continuar.');
    return;
  }
  
  // Enviar diretamente para o WhatsApp
  finalizeViaWhatsApp();
}

function finalizeViaWhatsApp() {
  let message = '🛒 *Pedido Primos Informática*\n\n';
  
  // Adicionar itens do carrinho
  cart.forEach((item, index) => {
    // Corrigir tratamento de preço para preservar centavos
    const priceString = (item.preco || '0').toString().replace(',', '.');
    const price = parseFloat(priceString);
    message += `${index + 1}. ${item.nome}\n`;
    message += `   💰 R$ ${price.toFixed(2).replace('.', ',')}\n`;
    message += `   🏷️ ${item.marca || ''}\n\n`;
  });
  
  // Calcular total
  const total = cart.reduce((sum, item) => {
    // Corrigir tratamento de preço para preservar centavos
    const priceString = (item.preco || '0').toString().replace(',', '.');
    const price = parseFloat(priceString);
    return sum + price;
  }, 0);
  
  message += `*Total: R$ ${total.toFixed(2).replace('.', ',')}*\n\n`;
  message += 'Gostaria de finalizar este pedido! 🛍️';
  
  // Abrir WhatsApp com a mensagem
  const whatsappUrl = `https://wa.me/556133406740?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
  
  // Fechar carrinho após enviar
  toggleCart();
}

function toggleMobileMenu() {
  const navTabs = document.querySelector('.nav-tabs');
  const mobileMenuBtn = document.querySelector('.mobile-menu-toggle');
  
  if (!navTabs || !mobileMenuBtn) return;
  
  if (navTabs.classList.contains('mobile-open')) {
    // Fechar menu
    navTabs.classList.remove('mobile-open');
    
    // Voltar ícone de hambúrguer
    mobileMenuBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    `;
  } else {
    // Abrir menu
    navTabs.classList.add('mobile-open');
    
    // Transformar o ícone em X
    mobileMenuBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
  }
}

function closeMobileMenu() {
  const navTabs = document.querySelector('.nav-tabs');
  const mobileMenuBtn = document.querySelector('.mobile-menu-toggle');
  
  if (!navTabs || !mobileMenuBtn) return;
  
  // Fechar menu
  navTabs.classList.remove('mobile-open');
  
  // Voltar ícone de hambúrguer
  mobileMenuBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  `;
}

function addToCart(productCode) {
  const cartBtn = document.querySelector('.cart-btn');
  const clickedButton = event.target;
  
  for (let i = 0; i < allProducts.length; i++) {
    if (allProducts[i].codigo === productCode) {
      cart.push({
        ...allProducts[i],
        quantity: 1
      });
      
      // Animação no botão clicado
      clickedButton.classList.remove('adding', 'added');
      void clickedButton.offsetWidth; // Força reflow
      clickedButton.classList.add('adding');
      
      setTimeout(() => {
        clickedButton.classList.remove('adding');
        clickedButton.classList.add('added');
        
        // Remove o checkmark após 1.5s
        setTimeout(() => {
          clickedButton.classList.remove('added');
        }, 1500);
      }, 600);
      
      // Animação de shake no botão do carrinho
      cartBtn.classList.remove('animate', 'shake');
      void cartBtn.offsetWidth; // Força reflow
      cartBtn.classList.add('shake');
      
      setTimeout(() => {
        cartBtn.classList.remove('shake');
      }, 300);
      
      updateCartDisplay();
      break;
    }
  }
}

// === INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOM Carregado - Iniciando aplicação...');
  
  loadProducts().then(function() {
    console.log('📦 Produtos carregados:', allProducts.length);
    console.log('🏠 Exibindo página inicial...');
    showCategory('inicio');
  }).catch(function(error) {
    console.error('❌ Erro ao carregar produtos:', error);
  });
  
  window.addEventListener('hashchange', function() {
    const hash = window.location.hash.substring(1) || 'inicio';
    console.log('🔗 Hash change:', hash);
    showCategory(hash);
  });
});

// === FUNÇÕES DE BUSCA MELHORADAS ===
function handleSearchInput(event) {
  const searchTerm = event.target.value.trim();
  
  // Se tiver menos de 2 caracteres, não buscar
  if (searchTerm.length < 2) {
    hideSearchResults();
    return;
  }
  
  // Buscar em tempo real
  if (searchTerm.length > 0) {
    searchProducts(searchTerm);
  } else {
    hideSearchResults();
    // Limpar filtros ao apagar busca
    currentFilters.searchQuery = '';
    filterProducts();
  }
}

function showSearchResults() {
  const searchResults = document.getElementById('searchResults');
  if (searchResults) {
    searchResults.classList.add('active');
  }
}

function hideSearchResults() {
  const searchResults = document.getElementById('searchResults');
  if (searchResults) {
    searchResults.classList.remove('active');
  }
}

function searchProducts(searchTerm) {
  console.log('🔍 Buscando produtos:', searchTerm);
  
  if (!searchTerm || searchTerm.length < 2) {
    hideSearchResults();
    return;
  }
  
  // Atualizar filtro de busca
  currentFilters.searchQuery = searchTerm;
  
  // Buscar em todos os produtos
  const searchResults = allProducts.filter(product => {
    const term = searchTerm.toLowerCase();
    const productName = (product.nome || '').toLowerCase();
    const productBrand = (product.marca || '').toLowerCase();
    const productCategory = (product.categoria || '').toLowerCase();
    
    return productName.includes(term) || 
           productBrand.includes(term) || 
           productCategory.includes(term);
  });
  
  // Mostrar resultados
  displaySearchResults(searchResults, searchTerm);
}

function displaySearchResults(results, searchTerm) {
  const searchResultsContainer = document.getElementById('searchResults');
  
  if (!searchResultsContainer) return;
  
  if (results.length === 0) {
    searchResultsContainer.innerHTML = `
      <div class="search-no-results">
        <p>❌ Nenhum produto encontrado para "${searchTerm}"</p>
        <small>Tente buscar com outros termos</small>
      </div>
    `;
  } else {
    // Limitar a 8 resultados para não sobrecarregar
    const limitedResults = results.slice(0, 8);
    
    searchResultsContainer.innerHTML = limitedResults.map(product => {
      // Corrigir tratamento de preço para preservar centavos
      const priceString = (product.preco || '0').toString().replace(',', '.');
      const price = parseFloat(priceString);
      const formattedPrice = 'R$ ' + price.toFixed(2).replace('.', ',');
      const imageName = product.imagem || product.codigo + '.webp';
      const imagePath = 'images/products/thumbnail/' + imageName;
      
      return `
        <div class="search-result-item" onclick="selectSearchProduct('${product.codigo}')">
          <div class="search-result-info">
            <div class="search-result-name">${product.nome}</div>
            <div class="search-result-category">${product.categoria || 'Sem categoria'}</div>
            <div class="search-result-price">${formattedPrice}</div>
          </div>
        </div>
      `;
    }).join('');
  }
  
  showSearchResults();
}

function selectSearchProduct(productCode) {
  hideSearchResults();
  
  // Encontrar o produto e mostrar na categoria correta
  const product = allProducts.find(p => p.codigo === productCode);
  if (product) {
    // Mostrar categoria do produto
    showCategory(product.categoria);
    
    // Destacar o produto após um pequeno delay
    setTimeout(() => {
      const productElement = document.querySelector(`[data-product-code="${productCode}"]`);
      if (productElement) {
        productElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        productElement.classList.add('search-highlight');
        
        // Remover destaque após 3 segundos
        setTimeout(() => {
          productElement.classList.remove('search-highlight');
        }, 3000);
      }
    }, 500);
  }
}

// Fechar busca ao clicar fora
document.addEventListener('click', function(event) {
  const searchContainer = document.querySelector('.search-container');
  const searchResults = document.getElementById('searchResults');
  
  if (searchContainer && !searchContainer.contains(event.target) && 
      searchResults && !searchResults.contains(event.target)) {
    hideSearchResults();
  }
});

// === FUNÇÕES DE FILTRO ===
let currentFilters = {
  categories: [],
  minPrice: null,
  maxPrice: null,
  searchQuery: ''
};

function toggleFilters() {
  console.log('🔧 toggleFilters chamado');
  
  const filtersPanel = document.getElementById('filtersPanel');
  const filtersToggle = document.getElementById('filtersToggle');
  
  console.log('🔍 filtersPanel encontrado:', !!filtersPanel);
  console.log('🔍 filtersToggle encontrado:', !!filtersToggle);
  
  if (!filtersPanel || !filtersToggle) {
    console.error('❌ Elementos de filtro não encontrados');
    return;
  }
  
  console.log('🔍 Estado atual do painel:', filtersPanel.classList.contains('active'));
  
  if (filtersPanel.classList.contains('active')) {
    filtersPanel.classList.remove('active');
    filtersToggle.classList.remove('active');
    console.log('✅ Painel de filtros fechado');
  } else {
    filtersPanel.classList.add('active');
    filtersToggle.classList.add('active');
    console.log('✅ Painel de filtros aberto');
  }
}

function applyFilters() {
  console.log('Aplicando filtros...');
  
  // Coletar categorias selecionadas
  const categoryCheckboxes = document.querySelectorAll('.category-filters input[type="checkbox"]:checked');
  currentFilters.categories = Array.from(categoryCheckboxes).map(cb => cb.value.toLowerCase());
  
  // Coletar faixa de preço
  const minPriceInput = document.getElementById('minPrice');
  const maxPriceInput = document.getElementById('maxPrice');
  currentFilters.minPrice = minPriceInput.value ? parseFloat(minPriceInput.value) : null;
  currentFilters.maxPrice = maxPriceInput.value ? parseFloat(maxPriceInput.value) : null;
  
  console.log('Filtros aplicados:', currentFilters);
  
  // Filtrar produtos
  filterProducts();
  
  // Fecha o painel de filtros
  toggleFilters();
  
  // Fechar menu mobile automaticamente ao aplicar filtros
  closeMobileMenu();
}

function clearFilters() {
  console.log('Limpando filtros...');
  
  // Resetar filtros
  currentFilters = {
    categories: [],
    minPrice: null,
    maxPrice: null,
    searchQuery: currentFilters.searchQuery // Mantém busca
  };
  
  // Limpar UI
  const checkboxes = document.querySelectorAll('.category-filters input[type="checkbox"]');
  checkboxes.forEach(cb => cb.checked = false);
  
  document.getElementById('minPrice').value = '';
  document.getElementById('maxPrice').value = '';
  
  console.log('Filtros limpos:', currentFilters);
  
  // Aplicar filtros vazios (mostra tudo)
  filterProducts();
  
  // Fecha o painel
  toggleFilters();
}

function filterProducts() {
  console.log('Filtrando produtos com:', currentFilters);
  
  let filteredProducts = allProducts.filter(product => {
    // Filtro de categorias
    if (currentFilters.categories.length > 0) {
      const productCategory = (product.categoria || '').toLowerCase();
      if (!currentFilters.categories.includes(productCategory)) {
        return false;
      }
    }
    
    // Filtro de preço mínimo
    if (currentFilters.minPrice !== null) {
      // Corrigir tratamento de preço para preservar centavos
      const priceString = (product.preco || '0').toString().replace(',', '.');
      const productPrice = parseFloat(priceString);
      if (productPrice < currentFilters.minPrice) {
        return false;
      }
    }
    
    // Filtro de preço máximo
    if (currentFilters.maxPrice !== null) {
      // Corrigir tratamento de preço para preservar centavos
      const priceString = (product.preco || '0').toString().replace(',', '.');
      const productPrice = parseFloat(priceString);
      if (productPrice > currentFilters.maxPrice) {
        return false;
      }
    }
    
    // Filtro de busca
    if (currentFilters.searchQuery) {
      const searchTerm = currentFilters.searchQuery.toLowerCase();
      const productName = (product.nome || '').toLowerCase();
      const productBrand = (product.marca || '').toLowerCase();
      const productCategory = (product.categoria || '').toLowerCase();
      
      if (!productName.includes(searchTerm) && 
          !productBrand.includes(searchTerm) && 
          !productCategory.includes(searchTerm)) {
        return false;
      }
    }
    
    return true;
  });
  
  console.log('Produtos filtrados:', filteredProducts.length);
  
  // Atualizar display com produtos filtrados
  displayFilteredProducts(filteredProducts);
}

function displayFilteredProducts(filteredProducts) {
  // Se há busca ativa, mostrar resultados na seção atual
  if (currentFilters.searchQuery) {
    const activeSection = document.querySelector('.category:not([style*="display: none"])');
    if (activeSection) {
      const productsGrid = activeSection.querySelector('.products-grid');
      if (productsGrid) {
        let html = '';
        if (filteredProducts.length === 0) {
          html = '<p style="text-align: center; padding: 40px; color: #666;">Nenhum produto encontrado com os filtros aplicados.</p>';
        } else {
          filteredProducts.forEach(product => {
            html += createProductCard(product);
          });
        }
        productsGrid.innerHTML = html;
        
        // Lazy loading para imagens filtradas
        setTimeout(() => {
          loadImagesOnScroll(activeSection);
        }, 200);
      }
    }
  } else {
    // Se não há busca, mostrar produtos nas categorias corretas
    const categories = {};
    
    // Agrupar produtos filtrados por categoria
    filteredProducts.forEach(product => {
      const category = product.categoria || 'outros';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(product);
    });
    
    // Atualizar cada seção de categoria
    Object.keys(categories).forEach(category => {
      const section = document.getElementById(category);
      if (section) {
        const productsGrid = section.querySelector('.products-grid');
        if (productsGrid) {
          let html = '';
          categories[category].forEach(product => {
            html += createProductCard(product);
          });
          productsGrid.innerHTML = html;
          
          // Lazy loading
          setTimeout(() => {
            loadImagesOnScroll(section);
          }, 200);
        }
      }
    });
  }
}

// Event listener para fechar filtros ao clicar fora
document.addEventListener('click', function(e) {
  const filtersToggle = document.getElementById('filtersToggle');
  const filtersPanel = document.getElementById('filtersPanel');
  
  if (filtersToggle && filtersPanel && 
      !filtersToggle.contains(e.target) && 
      !filtersPanel.contains(e.target) &&
      filtersPanel.classList.contains('active')) {
    toggleFilters();
  }
});

// === COMANDOS GLOBAIS ===
window.showCategory = showCategory;
window.addToCart = addToCart;
window.toggleCart = toggleCart;
window.removeFromCart = removeFromCart;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.toggleFilters = toggleFilters;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.showCheckoutOptions = showCheckoutOptions;
window.scrollToTop = scrollToTop; // Adicionar função global
window.finalizeViaWhatsApp = finalizeViaWhatsApp;

// === BOTÃO VOLTAR AO TOPO ===
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

// Controlar visibilidade do botão voltar ao topo
window.addEventListener('scroll', function() {
  const backToTopButton = document.getElementById('backToTop');
  
  if (backToTopButton) {
    // Mostrar botão quando rolar 300px para baixo
    if (window.pageYOffset > 300) {
      backToTopButton.classList.add('visible');
    } else {
      backToTopButton.classList.remove('visible');
    }
  }
});

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
  const backToTopButton = document.getElementById('backToTop');
  
  // Esconder botão inicialmente
  if (backToTopButton) {
    backToTopButton.classList.remove('visible');
  }
  
  // Inicializar sistema de autenticação
  if (typeof userAuth !== 'undefined') {
    userAuth.updateUserInterface();
  }
});

// === SISTEMA DE CADASTRO E LOGIN ===

class UserAuth {
  constructor() {
    this.users = JSON.parse(localStorage.getItem('primos_users')) || [];
    this.currentUser = JSON.parse(localStorage.getItem('primos_currentUser')) || null;
    this.init();
  }

  init() {
    // Verificar se usuário já está logado
    if (this.currentUser) {
      this.updateUserInterface();
    }

    // Adicionar botão de cadastro no header
    this.addAuthButtonToHeader();

    // Configurar event listeners
    this.setupEventListeners();
  }

  // Adicionar botão de cadastro no header
  addAuthButtonToHeader() {
    // Verificar se usuário já está logado
    if (this.isLoggedIn()) {
      return; // Não adicionar botão se usuário já estiver logado
    }
    
    // No desktop, adicionar botão no header
    if (window.innerWidth > 800) {
      const actionButtons = document.querySelector('.action-buttons');
      if (actionButtons && !document.querySelector('.auth-btn-header')) {
        const authButton = document.createElement('button');
        authButton.className = 'auth-btn-header';
        authButton.textContent = 'Criar Conta';
        authButton.onclick = () => this.showAuth('cadastro');
        actionButtons.appendChild(authButton);
      }
    } else {
      // No mobile, adicionar opção no menu mobile
      this.addAuthToMobileMenu();
    }
  }

  // Adicionar opção de cadastro no menu mobile
  addAuthToMobileMenu() {
    // Verificar se usuário já está logado
    if (this.isLoggedIn()) {
      return; // Não adicionar link se usuário já estiver logado
    }
    
    const mobileMenu = document.querySelector('.nav-tabs');
    if (mobileMenu && !mobileMenu.querySelector('.mobile-auth-link')) {
      const authLink = document.createElement('a');
      authLink.className = 'nav-tab mobile-auth-link';
      authLink.href = '#';
      authLink.textContent = 'Criar Conta / Login';
      authLink.onclick = (e) => {
        e.preventDefault();
        this.showAuth('cadastro');
      };
      mobileMenu.appendChild(authLink);
    }
  }

  // Configurar event listeners
  setupEventListeners() {
    // Formulário de cadastro
    const cadastroForm = document.getElementById('cadastroForm');
    if (cadastroForm) {
      cadastroForm.addEventListener('submit', (e) => this.handleCadastro(e));
    }

    // Formulário de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // Formulário de recuperação
    const recuperarForm = document.getElementById('recuperarForm');
    if (recuperarForm) {
      recuperarForm.addEventListener('submit', (e) => this.handleRecuperar(e));
    }

    // Fechar modal ao clicar fora
    const authModal = document.getElementById('authModal');
    if (authModal) {
      authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
          this.closeAuth();
        }
      });
    }

    // Fechar dropdown ao clicar fora
    document.addEventListener('click', (e) => {
      const userDropdown = document.getElementById('userDropdown');
      const userMenuBtn = document.querySelector('.user-menu-btn');
      
      if (userDropdown && userMenuBtn && 
          !userDropdown.contains(e.target) && 
          !userMenuBtn.contains(e.target)) {
        userDropdown.classList.remove('active');
      }
    });
  }

  // Validar formulário de cadastro
  validateCadastro(formData) {
    const errors = [];

    // Nome
    if (!formData.nome || formData.nome.trim().length < 3) {
      errors.push('Nome deve ter pelo menos 3 caracteres');
    }

    // E-mail
    if (!this.validateEmail(formData.email)) {
      errors.push('E-mail inválido');
    }

    // Telefone
    if (!formData.telefone || formData.telefone.length < 10) {
      errors.push('Telefone inválido');
    }

    // Senha
    if (!formData.senha || formData.senha.length < 6) {
      errors.push('Senha deve ter pelo menos 6 caracteres');
    }

    // Confirmar senha
    if (formData.senha !== formData.confirmar) {
      errors.push('Senhas não conferem');
    }

    // E-mail já cadastrado
    if (this.users.find(user => user.email === formData.email)) {
      errors.push('E-mail já cadastrado');
    }

    return errors;
  }

  // Validar e-mail
  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Validar telefone
  validateTelefone(telefone) {
    const cleaned = telefone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 11;
  }

  // Hash simples de senha
  hashPassword(password) {
    return btoa(password + 'primos2026');
  }

  // Verificar senha
  verifyPassword(password, hash) {
    return this.hashPassword(password) === hash;
  }

  // Cadastrar usuário
  async handleCadastro(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Limpar erros anteriores
    this.clearErrors(e.target);

    // Validar
    const errors = this.validateCadastro(data);
    
    if (errors.length > 0) {
      this.showErrors(e.target, errors);
      return;
    }

    // Desabilitar botão
    const submitBtn = e.target.querySelector('.auth-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Cadastrando...';

    try {
      // Criar novo usuário
      const newUser = {
        id: Date.now(),
        nome: data.nome.trim(),
        email: data.email.toLowerCase().trim(),
        telefone: data.telefone.replace(/\D/g, ''),
        senha: this.hashPassword(data.senha),
        dataCadastro: new Date().toISOString(),
        pedidos: [],
        favoritos: [],
        enderecos: []
      };

      // Salvar usuário
      this.users.push(newUser);
      this.saveUsers();

      // Auto-login após cadastro
      this.currentUser = newUser;
      this.saveCurrentUser();

      // Mostrar sucesso
      this.showSuccess(e.target, 'Cadastro realizado com sucesso!');

      // Fechar modal após 1.5s
      setTimeout(() => {
        this.closeAuth();
        this.updateUserInterface();
      }, 1500);

    } catch (error) {
      this.showError(e.target, 'Erro ao cadastrar. Tente novamente.');
    } finally {
      // Reabilitar botão
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  // Login
  async handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Limpar erros anteriores
    this.clearErrors(e.target);

    // Validar
    if (!this.validateEmail(data.email)) {
      this.showErrors(e.target, ['E-mail inválido']);
      return;
    }

    if (!data.senha || data.senha.length < 6) {
      this.showErrors(e.target, ['Senha inválida']);
      return;
    }

    // Desabilitar botão
    const submitBtn = e.target.querySelector('.auth-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Entrando...';

    try {
      // Buscar usuário
      const user = this.users.find(u => u.email === data.email.toLowerCase().trim());
      
      if (!user) {
        this.showErrors(e.target, ['E-mail não encontrado']);
        return;
      }

      // Verificar senha
      if (!this.verifyPassword(data.senha, user.senha)) {
        this.showErrors(e.target, ['Senha incorreta']);
        return;
      }

      // Login bem-sucedido
      this.currentUser = user;
      this.saveCurrentUser();

      // Salvar preferência "lembrar-me"
      if (document.getElementById('lembrar-me').checked) {
        localStorage.setItem('primos_remember', 'true');
      }

      // Mostrar sucesso
      this.showSuccess(e.target, 'Login realizado com sucesso!');

      // Fechar modal após 1s
      setTimeout(() => {
        this.closeAuth();
        this.updateUserInterface();
      }, 1000);

    } catch (error) {
      this.showError(e.target, 'Erro ao fazer login. Tente novamente.');
    } finally {
      // Reabilitar botão
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  // Recuperação de senha
  async handleRecuperar(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Limpar erros anteriores
    this.clearErrors(e.target);

    // Validar e-mail
    if (!this.validateEmail(data.email)) {
      this.showErrors(e.target, ['E-mail inválido']);
      return;
    }

    // Verificar se e-mail existe
    const user = this.users.find(u => u.email === data.email.toLowerCase().trim());
    
    if (!user) {
      this.showErrors(e.target, ['E-mail não encontrado']);
      return;
    }

    // Simular envio de e-mail
    const submitBtn = e.target.querySelector('.auth-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    setTimeout(() => {
      this.showSuccess(e.target, 'E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      
      setTimeout(() => {
        this.backToLogin();
      }, 2000);
      
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }, 1500);
  }

  // Salvar usuários
  saveUsers() {
    localStorage.setItem('primos_users', JSON.stringify(this.users));
  }

  // Salvar usuário atual
  saveCurrentUser() {
    localStorage.setItem('primos_currentUser', JSON.stringify(this.currentUser));
  }

  // Verificar se está logado
  isLoggedIn() {
    return this.currentUser !== null;
  }

  // Logout
  logout() {
    this.currentUser = null;
    localStorage.removeItem('primos_currentUser');
    localStorage.removeItem('primos_remember');
    this.updateUserInterface();
  }

  // Atualizar interface
  updateUserInterface() {
    const authButton = document.querySelector('.auth-btn-header');
    const mobileAuthLink = document.querySelector('.mobile-auth-link');
    const userArea = document.getElementById('userArea');

    if (this.isLoggedIn()) {
      // Esconder botão de cadastro desktop
      if (authButton) {
        authButton.style.display = 'none';
      }

      // Esconder link de cadastro mobile
      if (mobileAuthLink) {
        mobileAuthLink.style.display = 'none';
      }

      // Mostrar área do usuário
      if (userArea) {
        userArea.style.display = 'flex';
        
        // Atualizar informações
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const userInitial = document.getElementById('userInitial');
        
        if (userName) userName.textContent = this.currentUser.nome.split(' ')[0];
        if (userEmail) userEmail.textContent = this.currentUser.email;
        if (userInitial) userInitial.textContent = this.currentUser.nome.charAt(0).toUpperCase();
      }
    } else {
      // Mostrar botão de cadastro desktop
      if (authButton) {
        authButton.style.display = 'block';
      }

      // Mostrar link de cadastro mobile
      if (mobileAuthLink) {
        mobileAuthLink.style.display = 'block';
      }

      // Esconder área do usuário
      if (userArea) {
        userArea.style.display = 'none';
      }
    }
  }

  // Mostrar modal de autenticação
  showAuth(tab = 'cadastro') {
    const modal = document.getElementById('authModal');
    if (modal) {
      modal.classList.add('active');
      this.switchTab(tab);
    }
  }

  // Fechar modal
  closeAuth() {
    const modal = document.getElementById('authModal');
    if (modal) {
      modal.classList.remove('active');
      this.clearAllErrors();
    }
  }

  // Alternar abas
  switchTab(tab) {
    // Atualizar botões das abas
    document.querySelectorAll('.auth-tab').forEach(btn => {
      btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Mostrar formulário correspondente
    document.querySelectorAll('.auth-form').forEach(form => {
      form.style.display = 'none';
    });

    if (tab === 'cadastro') {
      document.getElementById('cadastroForm').style.display = 'flex';
      document.getElementById('auth-footer-text').innerHTML = 'Já tem conta? <a href="#" onclick="auth.switchTab(\'login\')">Faça login</a>';
    } else if (tab === 'login') {
      document.getElementById('loginForm').style.display = 'flex';
      document.getElementById('auth-footer-text').innerHTML = 'Não tem conta? <a href="#" onclick="auth.switchTab(\'cadastro\')">Criar conta</a>';
    }
  }

  // Mostrar recuperação de senha
  showRecuperarSenha() {
    document.querySelectorAll('.auth-form').forEach(form => {
      form.style.display = 'none';
    });
    document.getElementById('recuperarForm').style.display = 'flex';
    document.getElementById('auth-footer-text').style.display = 'none';
  }

  // Voltar para login
  backToLogin() {
    this.switchTab('login');
  }

  // Toggle dropdown do usuário
  toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
      dropdown.classList.toggle('active');
    }
  }

  // Mostrar erros
  showErrors(form, errors) {
    errors.forEach(error => {
      const errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      errorElement.textContent = error;
      form.insertBefore(errorElement, form.firstChild);
    });
  }

  // Mostrar sucesso
  showSuccess(form, message) {
    const successElement = document.createElement('div');
    successElement.className = 'success-message';
    successElement.textContent = message;
    form.insertBefore(successElement, form.firstChild);
  }

  // Limpar erros
  clearErrors(form) {
    const errors = form.querySelectorAll('.error-message, .success-message');
    errors.forEach(error => error.remove());
    
    const inputs = form.querySelectorAll('input.error');
    inputs.forEach(input => input.classList.remove('error'));
    
    const errorSpans = form.querySelectorAll('.form-error.show');
    errorSpans.forEach(span => span.classList.remove('show'));
  }

  // Limpar todos os erros
  clearAllErrors() {
    document.querySelectorAll('.error-message, .success-message').forEach(error => error.remove());
    document.querySelectorAll('input.error').forEach(input => input.classList.remove('error'));
    document.querySelectorAll('.form-error.show').forEach(span => span.classList.remove('show'));
  }

  // Funções da área do usuário
  showMeusPedidos() {
    alert('Meus Pedidos - Em desenvolvimento');
  }

  showMeusFavoritos() {
    alert('Meus Favoritos - Em desenvolvimento');
  }

  showMeusDados() {
    alert('Meus Dados - Em desenvolvimento');
  }

  showEnderecos() {
    alert('Endereços - Em desenvolvimento');
  }
}

// Instância global
const auth = new UserAuth();

// Funções globais para o HTML
window.showAuth = (tab) => auth.showAuth(tab);
window.closeAuth = () => auth.closeAuth();
window.switchTab = (tab) => auth.switchTab(tab);
window.showRecuperarSenha = () => auth.showRecuperarSenha();
window.backToLogin = () => auth.backToLogin();
window.toggleUserMenu = () => auth.toggleUserMenu();
window.logout = () => auth.logout();
window.showMeusPedidos = () => auth.showMeusPedidos();
window.showMeusFavoritos = () => auth.showMeusFavoritos();
window.showMeusDados = () => auth.showMeusDados();
window.showEnderecos = () => auth.showEnderecos();

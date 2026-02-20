// === PRODUCTS MODULE - Sistema de produtos e categorias ===

let allProducts = [];

// Carregar produtos
function loadProducts() {
  debugLog('🚀 loadProducts() iniciada - JSON mode');
  return fetch('/data/products.json', {
    cache: 'no-store'
  })
    .then(function(response) {
      debugLog('📁 JSON response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Validar content-type para evitar parse de HTML
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.error('❌ Content-Type não é JSON:', contentType);
        throw new Error('Resposta não é JSON - possível rewrite incorreto');
      }

      return response.json();
    })
    .then(function(data) {
      allProducts = data.products || [];
      debugLog('✅ Produtos carregados:', allProducts.length);

      // Processar produtos após carregamento
      processProductsData();

      return allProducts;
    })
    .catch(function(error) {
      console.error('❌ Erro ao carregar produtos:', error);
      notificationManager.show('Erro ao carregar produtos. Tente recarregar a página.', 'error');
      throw error;
    });
}

// Processar dados dos produtos após carregamento
function processProductsData() {
  if (!allProducts || allProducts.length === 0) {
    debugLog('⚠️ Nenhum produto para processar');
    return;
  }

  // Filtrar produtos válidos
  allProducts = allProducts.filter(product =>
    product &&
    product.codigo &&
    product.nome &&
    product.categoria &&
    typeof product.preco === 'number'
  );

  debugLog('✅ Produtos processados:', allProducts.length);
}

// === SISTEMA DE VALORES PROMOCIONAIS ===
function calcularValorPromocional(precoOriginal, categoria = null) {
  // Tabela de descontos por categoria
  const descontosPorCategoria = {
    'placa de vídeo': 15,      // 15% de desconto
    'processador': 12,         // 12% de desconto
    'placa mãe': 10,          // 10% de desconto
    'ssd': 20,                // 20% de desconto
    'fonte': 18,              // 18% de desconto
    'memória': 25,            // 25% de desconto
    'monitor': 8,              // 8% de desconto
    'teclado': 5,              // 5% de desconto
    'mouse': 5,                // 5% de desconto
    'gabinetes': 10,           // 10% de desconto
    'audio': 12,               // 12% de desconto
    'webcam': 8,               // 8% de desconto
    'acessórios': 15           // 15% de desconto
  };

  const desconto = descontosPorCategoria[categoria] || 7; // 7% padrão
  const precoComDesconto = precoOriginal * (1 - desconto / 100);

  return {
    original: precoOriginal,
    desconto: precoComDesconto,
    percentual: desconto,
    economia: precoOriginal - precoComDesconto
  };
}

// === PREENCHER CATEGORIAS DA HOME ===
function populateHomeCategories() {
  const categoriesGrid = document.getElementById('home-categories-grid');
  if (!categoriesGrid) {
    console.warn('[populateHomeCategories] Container #home-categories-grid não encontrado');
    return;
  }

  // Obter categorias únicas dos produtos
  const categories = {};
  for (let i = 0; i < allProducts.length; i++) {
    const category = allProducts[i].categoria;

    // Ignorar categorias vazias, undefined, null ou apenas espaços em branco
    if (!category || category.trim() === '' || category === 'undefined' || category === 'null') {
      continue;
    }

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

  for (const categoryKey in categories) {
    const category = categories[categoryKey];

    const displayName = category.name.charAt(0).toUpperCase() + category.name.slice(1);
    const imagePath = `/images/products/thumbnail/${category.sample.imagem || category.sample.codigo + '.webp'}`;

    debugLog(`[populateHomeCategories] Categoria: ${category.name}, Imagem: ${imagePath}`);

    categoriesHTML += `
      <div class="category-card" onclick="showCategory('${category.name}')" style="cursor: pointer;">
        <div class="category-image">
          <div class="image-placeholder">📦</div>
          <img data-src="${imagePath}"
               alt="${displayName}"
               onerror="this.src='/images/products/thumbnail/default.webp'; this.onerror=null;"
               style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px;">
        </div>
        <div class="category-info">
          <h4>${displayName}</h4>
          <span class="category-count">${category.count} produtos</span>
        </div>
      </div>
    `;
  }

  categoriesGrid.innerHTML = categoriesHTML;

  // Lazy loading para imagens das categorias
  setTimeout(function() {
    debugLog('[populateHomeCategories] Iniciando lazy loading para categorias');
    loadImagesOnScroll(categoriesGrid);

    // Verificação adicional para garantir que as imagens das categorias carreguem
    const categoryImages = categoriesGrid.querySelectorAll('img[data-src]');
    debugLog(`[populateHomeCategories] Encontradas ${categoryImages.length} imagens com data-src`);

    categoryImages.forEach(function(img, index) {
      // Forçar carregamento imediato para imagens de categorias
      if (img.dataset.src) {
        const src = img.dataset.src;
        debugLog(`[populateHomeCategories] Carregando imagem ${index}: ${src}`);

        // Criar objeto Image para verificar se a imagem existe antes de carregar
        const testImg = new Image();
        testImg.onload = function() {
          img.src = src;
          img.removeAttribute('data-src');
          img.classList.add('loaded');
          debugLog(`[populateHomeCategories] Imagem carregada com sucesso: ${src}`);
        };
        testImg.onerror = function() {
          img.src = '/images/products/thumbnail/default.webp';
          img.removeAttribute('data-src');
          img.classList.add('loaded');
          debugLog(`[populateHomeCategories] Imagem falhou, usando fallback: ${src}`);
        };
        testImg.src = src;
      }
    });

    // Limpar placeholders após carregamento
    setTimeout(function() {
      cleanupStalePlaceholders();
      aggressivePlaceholderCleanup();
    }, 1000);

  }, 100);
}

// === PREENCHER PRODUTOS EM DESTAQUE ===
function populateHomeHighlights() {
  safeRender(() => {
    const highlightsGrid = document.getElementById('home-highlights-grid');
    if (!highlightsGrid) return;

    // Filtrar produtos em promoção ou destaques
    const highlightProducts = allProducts.filter(product =>
      product.promocao === true ||
      product.promocao === 'sim' ||
      product.destaque === true ||
      product.destaque === 'sim'
    ).slice(0, 8); // Máximo 8 produtos

    if (highlightProducts.length === 0) {
      highlightsGrid.innerHTML = '<p style="text-align: center; padding: 40px; color: #64748b;">Nenhum produto em destaque no momento.</p>';
      return;
    }

    let highlightsHTML = '';
    highlightProducts.forEach(product => {
      const formattedPrice = formatPrice(product.preco);

      // Calcular promoção se aplicável
      let promoInfo = '';
      if (product.promocao === true || product.promocao === 'sim') {
        const promoData = calcularValorPromocional(product.preco, product.categoria);
        const formattedOriginalPrice = formatPrice(promoData.original);

        promoInfo = `
          <div class="promo-discount-info">
            <span class="original-price">${formattedOriginalPrice}</span>
            <span class="discount-badge">-${promoData.percentual}%</span>
          </div>
        `;
      }

      // Carregar avaliações
      const reviews = getProductReviews ? getProductReviews(product.codigo) : [];
      const averageRating = calculateAverageRating ? calculateAverageRating(reviews) : 0;
      const reviewCount = reviews.length;

      highlightsHTML += `
        <div class="product-card" onclick="showProduct('${product.codigo}')">
          <div class="product-image">
            <div class="image-placeholder">📦</div>
            <img data-src="/images/products/thumbnail/${product.imagem || product.codigo + '.webp'}"
                 alt="${product.nome}"
                 onerror="this.src='/images/products/thumbnail/default.webp'; this.onerror=null;">
          </div>
          <div class="product-content">
            <h3>${product.nome}</h3>
            <div class="product-rating">
              ${generateStarRating(averageRating)}
              <span class="rating-count">(${reviewCount})</span>
            </div>
            ${promoInfo}
            <div class="price">${formattedPrice}</div>
            <button class="btn-primary" onclick="event.stopPropagation(); addToCart('${product.codigo}')">
              Adicionar ao Carrinho
            </button>
          </div>
        </div>
      `;
    });

    highlightsGrid.innerHTML = highlightsHTML;

    // Aplicar lazy loading
    loadImagesOnScroll(highlightsGrid);

  }, '#home-highlights-grid', 'populateHomeHighlights');
}

// Função auxiliar para gerar estrelas
function generateStarRating(rating) {
  let stars = '';
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 0; i < fullStars; i++) {
    stars += '<span class="star filled">★</span>';
  }

  if (hasHalfStar) {
    stars += '<span class="star half-filled">★</span>';
  }

  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    stars += '<span class="star">★</span>';
  }

  return stars;
}

// Função para mostrar categoria
function showCategory(category) {
  // Resetar navegação antes de mostrar categoria
  if (typeof resetNavigation === 'function') {
    resetNavigation();
  }

  // Mostrar skeleton durante carregamento
  const productsGrid = document.getElementById('products-grid');
  if (productsGrid) {
    showLoadingSkeleton(productsGrid, 12);
  }

  // Limpar placeholders residuais
  cleanupStalePlaceholders();
  aggressivePlaceholderCleanup();

  // Filtrar produtos da categoria
  let categoryProducts = [];

  if (category === 'inicio') {
    // Página inicial: mostrar produtos em promoção + destaques
    categoryProducts = allProducts.filter(product =>
      product.promocao === true ||
      product.promocao === 'sim' ||
      product.destaque === true ||
      product.destaque === 'sim'
    ).slice(0, 12);
  } else if (category === 'promo') {
    // Página de promoções
    categoryProducts = allProducts.filter(product =>
      product.promocao === true || product.promocao === 'sim'
    );
  } else {
    // Categoria específica
    categoryProducts = allProducts.filter(product => product.categoria === category);
  }

  // Renderizar produtos
  renderProductsGrid(categoryProducts, category);

  // Atualizar título da página
  updatePageTitle(category);

  // Atualizar navegação
  if (typeof updateNavigation === 'function') {
    updateNavigation(category);
  }

  debugLog(`✅ showCategory('${category}') executada - ${categoryProducts.length} produtos`);
}

// Renderizar grid de produtos
function renderProductsGrid(products, category) {
  const productsGrid = document.getElementById('products-grid');
  if (!productsGrid) return;

  if (products.length === 0) {
    productsGrid.innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 48px; margin-bottom: 20px;">📦</div>
        <h3 style="color: #64748b; margin-bottom: 10px;">Nenhum produto encontrado</h3>
        <p style="color: #9ca3af;">Não há produtos disponíveis nesta categoria no momento.</p>
        <button class="btn-primary" onclick="showCategory('inicio')" style="margin-top: 20px;">
          Ver Todos os Produtos
        </button>
      </div>
    `;
    return;
  }

  let productsHTML = '';
  products.forEach(product => {
    const formattedPrice = formatPrice(product.preco);

    // Calcular promoção se aplicável
    let promoInfo = '';
    if (product.promocao === true || product.promocao === 'sim') {
      const promoData = calcularValorPromocional(product.preco, product.categoria);
      const formattedOriginalPrice = formatPrice(promoData.original);

      promoInfo = `
        <div class="promo-discount-info">
          <span class="original-price">${formattedOriginalPrice}</span>
          <span class="discount-badge">-${promoData.percentual}%</span>
        </div>
      `;
    }

    // Carregar avaliações
    const reviews = getProductReviews ? getProductReviews(product.codigo) : [];
    const averageRating = calculateAverageRating ? calculateAverageRating(reviews) : 0;
    const reviewCount = reviews.length;

    productsHTML += `
      <div class="product-card" onclick="showProduct('${product.codigo}')">
        <div class="product-image">
          <div class="image-placeholder">📦</div>
          <img data-src="/images/products/thumbnail/${product.imagem || product.codigo + '.webp'}"
               alt="${product.nome}"
               onerror="this.src='/images/products/thumbnail/default.webp'; this.onerror=null;">
        </div>
        <div class="product-content">
          <h3>${product.nome}</h3>
          <div class="product-rating">
            ${generateStarRating(averageRating)}
            <span class="rating-count">(${reviewCount})</span>
          </div>
          ${promoInfo}
          <div class="price">${formattedPrice}</div>
          <button class="btn-primary" onclick="event.stopPropagation(); addToCart('${product.codigo}')">
            Adicionar ao Carrinho
          </button>
        </div>
      </div>
    `;
  });

  productsGrid.innerHTML = productsHTML;

  // Aplicar lazy loading
  loadImagesOnScroll(productsGrid);
}

// Atualizar título da página
function updatePageTitle(category) {
  const titleElement = document.querySelector('h1') || document.querySelector('.page-title');
  if (titleElement) {
    let title = 'Produtos em Destaque';
    if (category !== 'inicio') {
      title = category.charAt(0).toUpperCase() + category.slice(1);
    }
    titleElement.textContent = title;
  }

  // Atualizar meta title
  document.title = category === 'inicio' ?
    'Primos Informática - Produtos em Destaque' :
    `Primos Informática - ${category.charAt(0).toUpperCase() + category.slice(1)}`;
}

// Sistema de lazy loading otimizado
function loadImagesOnScroll(container) {
  if (!container) return;

  const images = container.querySelectorAll('img[data-src]');
  images.forEach(img => {
    advancedLazyLoader.observe(img);
  });
}

// Skeleton loading
function showLoadingSkeleton(container, count = 8) {
  if (!container) return;

  let skeletonHTML = '';
  for (let i = 0; i < count; i++) {
    skeletonHTML += `
      <div class="product-card skeleton">
        <div class="product-image">
          <div class="skeleton-image"></div>
        </div>
        <div class="product-content">
          <div class="skeleton-title"></div>
          <div class="skeleton-rating"></div>
          <div class="skeleton-price"></div>
          <div class="skeleton-button"></div>
        </div>
      </div>
    `;
  }

  container.innerHTML = skeletonHTML;
}

// === PREENCHER HOME ===
function populateHome() {
  // Safe Render Pattern - Enterprise
  safeRender(() => {
    populateHomeCategories();

    // Preencher produtos em destaque na home
    populateHomeHighlights();

    debugLog('✅ populateHome() executada');

    // Página inicial já foi forçada acima

    // Limpar placeholders que possam ter ficado para trás
    cleanupStalePlaceholders();
    aggressivePlaceholderCleanup();

  }, '#home-highlights-grid', 'populateHome');
}

// === SISTEMA DE MENU DE NAVEGAÇÃO ===
function populateNavigationMenus() {
  // Desktop navigation
  const navTabs = document.querySelector('.nav-tabs');
  if (navTabs) {
    // Criar categorias dinâmicas
    const categories = {};
    allProducts.forEach(product => {
      if (product.categoria) {
        categories[product.categoria] = (categories[product.categoria] || 0) + 1;
      }
    });

    let navHTML = `
      <button type="button" class="nav-tab active" data-target="inicio" onclick="showCategory('inicio')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span>Início</span>
      </button>
      <button type="button" class="nav-tab" data-target="promo" onclick="showCategory('promo')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        <span>Promoções</span>
      </button>
    `;

    // Adicionar categorias principais
    const mainCategories = ['placa de vídeo', 'processador', 'placa mãe', 'memória', 'ssd'];
    mainCategories.forEach(cat => {
      if (categories[cat]) {
        const displayName = cat.charAt(0).toUpperCase() + cat.slice(1);
        navHTML += `
          <button type="button" class="nav-tab" data-target="${cat}" onclick="showCategory('${cat}')">
            <span>${displayName}</span>
          </button>
        `;
      }
    });

    navTabs.innerHTML = navHTML;
  }

  // Mobile navigation
  const mobileNavTabs = document.querySelector('.mobile-nav-tabs');
  if (mobileNavTabs) {
    // Manter apenas Início e Promoções no mobile
    const staticHTML = `
      <button type="button" class="mobile-nav-tab" data-target="inicio" onclick="showCategory('inicio'); toggleMobileMenu()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span>Início</span>
      </button>
      <button type="button" class="mobile-nav-tab" data-target="promo" onclick="showCategory('promo'); toggleMobileMenu()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        <span>Promoções</span>
      </button>
    `;

    mobileNavTabs.innerHTML = staticHTML;
  }
}

// Função para atualizar navegação ativa
function updateNavigation(activeCategory) {
  // Desktop navigation
  const navTabs = document.querySelectorAll('.nav-tab');
  navTabs.forEach(tab => {
    const target = tab.getAttribute('data-target');
    if (target === activeCategory) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Mobile navigation
  const mobileNavTabs = document.querySelectorAll('.mobile-nav-tab');
  mobileNavTabs.forEach(tab => {
    const target = tab.getAttribute('data-target');
    if (target === activeCategory) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
}

// Função para resetar navegação
function resetNavigation() {
  // Esconder todas as seções
  const sections = document.querySelectorAll('.products-section, .category, #promo, #inicio');
  for (let i = 0; i < sections.length; i++) {
    sections[i].style.display = 'none';
  }

  // Mostrar seção de produtos
  const productsSection = document.getElementById('products-section');
  if (productsSection) {
    productsSection.style.display = 'block';
  }

  // Resetar filtros do menu mobile
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu) {
    mobileMenu.classList.remove('active');
  }
}

// Exportar funções
window.loadProducts = loadProducts;
window.populateHomeCategories = populateHomeCategories;
window.populateHomeHighlights = populateHomeHighlights;
window.populateHome = populateHome;
window.showCategory = showCategory;
window.populateNavigationMenus = populateNavigationMenus;
window.updateNavigation = updateNavigation;
window.resetNavigation = resetNavigation;
window.calcularValorPromocional = calcularValorPromocional;

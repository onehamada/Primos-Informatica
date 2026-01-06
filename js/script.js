// Este arquivo é destinado a scripts JavaScript que podem ser usados para adicionar interatividade à loja, como funcionalidades de busca ou manipulação de produtos.

// === Configurações ===

// === Performance Monitor ===
function initPerformanceMonitor() {
  if ('PerformanceObserver' in window) {
    // Monitora métricas de performance
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log(`⚡ LCP: ${entry.startTime}ms`);
        }
        if (entry.entryType === 'first-input') {
          console.log(`⚡ FID: ${entry.processingStart - entry.startTime}ms`);
        }
      }
    });
    
    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
  }
}

// === Sistema de Notificações ===
function initNotifications() {
  if ('Notification' in window && Notification.permission === 'granted') {
    // Sistema de notificações push já autorizado
    console.log('🔔 Notificações habilitadas');
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    // Pede permissão de forma sutil
    setTimeout(() => {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('🔔 Notificações autorizadas');
        }
      });
    }, 5000);
  }
}

// === Lazy Loading Avançado ===
function initAdvancedLazyLoading() {
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.add('loaded');
        imageObserver.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01
  });
  
  images.forEach(img => imageObserver.observe(img));
}

// === Micro-interações Premium ===
function initMicroInteractions() {
  // Efeito de ripple em botões
  document.querySelectorAll('.btn-primary, .btn-outline').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.add('ripple');
      
      this.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  });
  
  // Animações de entrada para elementos
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const animationObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        animationObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  document.querySelectorAll('.product-card, .feature-item, .category-card').forEach(el => {
    animationObserver.observe(el);
  });
}

// === Sistema de Filtros Avançados ===
let currentFilters = {
  categories: [],
  brands: [],
  minPrice: null,
  maxPrice: null,
  promoOnly: false,
  searchQuery: ''
};

function toggleFilters() {
  const filtersPanel = document.getElementById('filtersPanel');
  const filtersToggle = document.getElementById('filtersToggle');
  
  if (filtersPanel.classList.contains('active')) {
    filtersPanel.classList.remove('active');
    filtersToggle.style.transform = '';
  } else {
    filtersPanel.classList.add('active');
    filtersToggle.style.transform = 'rotate(180deg)';
  }
}

function applyFilters() {
  // Coleta valores dos filtros
  currentFilters.categories = Array.from(document.querySelectorAll('.category-filters input:checked'))
    .map(input => input.value);
  
  currentFilters.brands = Array.from(document.querySelectorAll('.brand-filters input:checked'))
    .map(input => input.value);
  
  currentFilters.minPrice = document.getElementById('minPrice').value ? 
    parseFloat(document.getElementById('minPrice').value) : null;
  
  currentFilters.maxPrice = document.getElementById('maxPrice').value ? 
    parseFloat(document.getElementById('maxPrice').value) : null;
  
  currentFilters.promoOnly = document.getElementById('promoOnly').checked;
  
  // Aplica filtros aos produtos
  filterProducts();
  
  // Fecha o painel de filtros
  toggleFilters();
}

function clearFilters() {
  // Limpa todos os checkboxes
  document.querySelectorAll('.filters-panel input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });
  
  // Limpa campos de preço
  document.getElementById('minPrice').value = '';
  document.getElementById('maxPrice').value = '';
  
  // Reseta filtros
  currentFilters = {
    categories: [],
    brands: [],
    minPrice: null,
    maxPrice: null,
    promoOnly: false,
    searchQuery: currentFilters.searchQuery // Mantém busca
  };
  
  // Recarrega produtos
  filterProducts();
  
  // Fecha o painel
  toggleFilters();
}

function filterProducts() {
  let filteredProducts = [...__allProducts];
  
  // Filtra por categoria
  if (currentFilters.categories.length > 0) {
    filteredProducts = filteredProducts.filter(product => 
      currentFilters.categories.includes(product.categoria)
    );
  }
  
  // Filtra por marca
  if (currentFilters.brands.length > 0) {
    filteredProducts = filteredProducts.filter(product => 
      product.marca && currentFilters.brands.includes(product.marca)
    );
  }
  
  // Filtra por preço
  if (currentFilters.minPrice !== null) {
    filteredProducts = filteredProducts.filter(product => 
      parseFloat(product.preco) >= currentFilters.minPrice
    );
  }
  
  if (currentFilters.maxPrice !== null) {
    filteredProducts = filteredProducts.filter(product => 
      parseFloat(product.preco) <= currentFilters.maxPrice
    );
  }
  
  // Filtra apenas promoções
  if (currentFilters.promoOnly) {
    filteredProducts = filteredProducts.filter(product => 
      product.promocao === true
    );
  }
  
  // Filtra por busca
  if (currentFilters.searchQuery) {
    const query = currentFilters.searchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter(product => {
      return product.nome.toLowerCase().includes(query) ||
             product.descricao.toLowerCase().includes(query) ||
             (product.marca && product.marca.toLowerCase().includes(query)) ||
             product.categoria.toLowerCase().includes(query) ||
             product.codigo.toLowerCase().includes(query);
    });
  }
  
  // Exibe resultados filtrados
  displayFilteredProducts(filteredProducts);
}

function displayFilteredProducts(products) {
  // Mostra categoria atual ou cria uma nova seção para resultados
  let targetCategory = document.querySelector('.category:not([style*="display: none"])');
  
  if (!targetCategory) {
    // Se nenhuma categoria está ativa, mostra na primeira
    targetCategory = document.getElementById('inicio');
  }
  
  const grid = targetCategory.querySelector('.products-grid') || 
               targetCategory.querySelector('.categories-grid') ||
               document.createElement('div');
  
  if (!grid.classList.contains('products-grid')) {
    grid.className = 'products-grid';
    grid.innerHTML = '';
    targetCategory.appendChild(grid);
  }
  
  // Limpa e preenche com produtos filtrados
  grid.innerHTML = '';
  
  if (products.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #6b7280;">
        <h3>Nenhum produto encontrado</h3>
        <p>Tente ajustar os filtros ou buscar por outros termos.</p>
      </div>
    `;
    return;
  }
  
  const frag = document.createDocumentFragment();
  products.forEach(p => {
    frag.appendChild(createProductElement(p, 'filtered'));
  });
  grid.appendChild(frag);
  
  // Otimiza imagens
  optimizeProductImages(grid);
  
  // Mostra mensagem de resultados
  showFilterResultsMessage(products.length);
}

function showFilterResultsMessage(count) {
  // Remove mensagem anterior se existir
  const oldMessage = document.querySelector('.filter-results-message');
  if (oldMessage) oldMessage.remove();
  
  if (currentFilters.categories.length > 0 || 
      currentFilters.brands.length > 0 || 
      currentFilters.minPrice !== null || 
      currentFilters.maxPrice !== null || 
      currentFilters.promoOnly) {
    
    const message = document.createElement('div');
    message.className = 'filter-results-message';
    message.innerHTML = `
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); 
                  color: white; padding: 12px 20px; border-radius: 8px; 
                  margin: 16px; text-align: center; font-weight: 500;">
        ${count} produto${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}
        <button onclick="clearFilters()" style="margin-left: 16px; background: rgba(255,255,255,0.2); 
                border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; 
                color: white; font-size: 12px;">
          Limpar Filtros
        </button>
      </div>
    `;
    
    const activeCategory = document.querySelector('.category:not([style*="display: none"])');
    if (activeCategory) {
      activeCategory.insertBefore(message, activeCategory.firstChild);
    }
  }
}

// Função auxiliar para verificar se há filtros ativos
function hasActiveFilters() {
  return currentFilters.categories.length > 0 || 
         currentFilters.brands.length > 0 || 
         currentFilters.minPrice !== null || 
         currentFilters.maxPrice !== null || 
         currentFilters.promoOnly;
}

// Fecha filtros ao clicar fora
document.addEventListener('click', (e) => {
  const filtersContainer = document.getElementById('filtersContainer');
  const filtersPanel = document.getElementById('filtersPanel');
  
  if (!filtersContainer.contains(e.target) && filtersPanel.classList.contains('active')) {
    toggleFilters();
  }
});

// === Sistema de Busca Inteligente ===
let searchTimeout;
let currentSearchResults = [];
let searchCache = new Map(); // Cache para resultados

function initSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  
  if (!searchInput || !searchResults) return;
  
  // Evento de input com debounce otimizado
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    
    // Atualiza filtro de busca
    currentFilters.searchQuery = query;
    
    if (query.length < 2) {
      hideSearchResults();
      // Se há filtros ativos, aplica-os mesmo sem busca
      if (hasActiveFilters()) {
        filterProducts();
      }
      return;
    }
    
    // Verifica cache primeiro
    if (searchCache.has(query)) {
      displaySearchResults(searchCache.get(query), query);
      return;
    }
    
    // Debounce reduzido para melhor UX
    searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 200);
  });
  
  // Fecha resultados ao clicar fora
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      hideSearchResults();
    }
  });
  
  // Fecha resultados ao pressionar Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideSearchResults();
      searchInput.blur();
    }
  });
}

function performSearch(query) {
  // Verifica se os produtos foram carregados
  if (!__allProducts || __allProducts.length === 0) {
    return;
  }
  
  const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Busca otimizada com break early
  const results = [];
  for (let i = 0; i < __allProducts.length && results.length < 8; i++) {
    const product = __allProducts[i];
    const searchText = [
      product.nome || '',
      product.descricao || '',
      product.marca || '',
      product.categoria || '',
      product.codigo || ''
    ].join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    if (searchText.includes(normalizedQuery)) {
      results.push(product);
    }
  }
  
  // Salva no cache
  searchCache.set(query, results);
  
  // Limita cache a 50 entradas
  if (searchCache.size > 50) {
    const firstKey = searchCache.keys().next().value;
    searchCache.delete(firstKey);
  }
  
  currentSearchResults = results;
  displaySearchResults(results, query);
}

function displaySearchResults(results, query) {
  const searchResults = document.getElementById('searchResults');
  if (!searchResults) return;
  
  if (results.length === 0) {
    searchResults.innerHTML = `
      <div class="search-no-results">
        <p>Nenhum produto encontrado para "${query}"</p>
      </div>
    `;
  } else {
    // Usa DocumentFragment para melhor performance
    const fragment = document.createDocumentFragment();
    
    results.forEach(product => {
      // Verifica se o preço é válido e converte corretamente
      let price = 0;
      if (typeof product.preco === 'number') {
        price = product.preco;
      } else if (typeof product.preco === 'string') {
        const cleanPrice = product.preco.replace(/[R$\s]/g, '').replace(',', '.');
        price = parseFloat(cleanPrice) || 0;
      }
      
      // Constrói o caminho completo da imagem
      let imagePath = 'images/placeholder.png';
      
      if (product.imagem) {
        if (product.imagem.startsWith('http')) {
          imagePath = product.imagem;
        } else {
          imagePath = `images/products/thumbnail/${product.imagem}`;
        }
      }
      
      // Cria elemento usando DOM API (mais rápido que innerHTML)
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.onclick = () => selectSearchProduct(product.codigo);
      
      item.innerHTML = `
        <img src="${imagePath}" alt="${product.nome}" class="search-result-image" onerror="this.src='images/placeholder.png'" loading="lazy">
        <div class="search-result-info">
          <div class="search-result-name">${highlightSearchTerm(product.nome, query)}</div>
          <div class="search-result-category">${product.categoria}</div>
        </div>
        <div class="search-result-price">R$ ${price.toFixed(2).replace('.', ',')}</div>
      `;
      
      fragment.appendChild(item);
    });
    
    // Limpa e adiciona novos resultados
    searchResults.innerHTML = '';
    searchResults.appendChild(fragment);
  }
  
  searchResults.classList.add('active');
}

function highlightSearchTerm(text, query) {
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<span class="search-highlight">$1</span>');
}

function hideSearchResults() {
  const searchResults = document.getElementById('searchResults');
  if (searchResults) {
    searchResults.classList.remove('active');
  }
}

function selectSearchProduct(productCode) {
  // Verifica se os produtos foram carregados
  if (!__allProducts || __allProducts.length === 0) {
    console.log('Produtos ainda não carregados...');
    return;
  }
  
  const product = __allProducts.find(p => p.codigo === productCode);
  if (product) {
    // Adiciona ao carrinho
    if (typeof cart !== 'undefined' && cart.add) {
      cart.add(product);
      
      // Limpa busca
      document.getElementById('searchInput').value = '';
      hideSearchResults();
      
      // Feedback visual
      showNotification(`${product.nome} adicionado ao carrinho!`);
    } else {
      console.log('Carrinho não disponível ainda');
    }
  }
}

function showNotification(message) {
  // Cria notificação temporária
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
    z-index: 10000;
    font-weight: 600;
    animation: slideInRight 0.3s ease-out;
    max-width: 300px;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Remove após 3 segundos
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Adiciona animações CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// === Loading Spinner ===
function showLoading() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.add('active');
  }
}

function hideLoading() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.remove('active');
  }
}

// === Botão Voltar ao Topo ===
function initBackToTop() {
  const backToTop = document.getElementById('backToTop');
  if (!backToTop) return;
  
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  });
  
  backToTop.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// === Animações de Entrada ===
function animateElements() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fadeInUp');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1
  });
  
  // Observa produtos
  document.querySelectorAll('.product').forEach(product => {
    observer.observe(product);
  });
}

// === Drag & Scroll para Header Tabs ===
function initDragScroll() {
  const headerTabs = document.querySelector('.header-tabs');
  if (!headerTabs) return;
  
  let isDown = false;
  let startX;
  let scrollLeft;
  let isDragging = false;
  let dragStartTime = 0;
  
  // Mouse events
  headerTabs.addEventListener('mousedown', (e) => {
    // Verifica se não está clicando em um botão
    if (e.target.classList.contains('tab-btn')) return;
    
    isDown = true;
    isDragging = false;
    dragStartTime = Date.now();
    startX = e.pageX - headerTabs.offsetLeft;
    scrollLeft = headerTabs.scrollLeft;
    e.preventDefault();
  });
  
  headerTabs.addEventListener('mouseleave', () => {
    isDown = false;
  });
  
  headerTabs.addEventListener('mouseup', () => {
    isDown = false;
    
    // Se foi um arrasto rápido, previne o clique por um tempo maior
    if (isDragging) {
      const dragDuration = Date.now() - dragStartTime;
      const preventTime = Math.max(200, dragDuration); // Mínimo 200ms
      setTimeout(() => {
        isDragging = false;
      }, preventTime);
    }
  });
  
  headerTabs.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    
    e.preventDefault();
    isDragging = true;
    const x = e.pageX - headerTabs.offsetLeft;
    const walk = (x - startX) * 2; // Velocidade do arrasto
    headerTabs.scrollLeft = scrollLeft - walk;
  });
  
  // Touch events para mobile - simplificado e mais confiável
  headerTabs.addEventListener('touchstart', (e) => {
    // Permite arrasto em qualquer área, inclusive botões
    isDown = true;
    isDragging = false;
    dragStartTime = Date.now();
    startX = e.touches[0].pageX - headerTabs.offsetLeft;
    scrollLeft = headerTabs.scrollLeft;
  }, { passive: false });
  
  headerTabs.addEventListener('touchend', () => {
    isDown = false;
    
    // Se foi um arrasto rápido, previne o clique por um tempo maior
    if (isDragging) {
      const dragDuration = Date.now() - dragStartTime;
      const preventTime = Math.max(200, dragDuration); // Mínimo 200ms
      setTimeout(() => {
        isDragging = false;
      }, preventTime);
    }
  });
  
  headerTabs.addEventListener('touchmove', (e) => {
    if (!isDown) return;
    
    e.preventDefault();
    isDragging = true;
    const x = e.touches[0].pageX - headerTabs.offsetLeft;
    const walk = (x - startX) * 2; // Velocidade do arrasto
    headerTabs.scrollLeft = scrollLeft - walk;
  }, { passive: false });
  
  // Prevenir clique em botões durante arrasto (mouse)
  headerTabs.addEventListener('click', (e) => {
    if (isDragging && e.target.classList.contains('tab-btn')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  });
  
  // Prevenir clique em qualquer elemento durante arrasto (mouse)
  headerTabs.addEventListener('click', (e) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);
}

// === Inicialização ===
document.addEventListener('DOMContentLoaded', async () => {
  try {
    initDragScroll(); // Inicializar drag & scroll
    preloadCriticalImages();
    stripStaticProductsFromHtml();
    await loadProductsFromCsv();
    populatePromo();
    showCategory('inicio');
    optimizeProductImages(document);
    addCartButtons();
    initDynamicLazyLoading();
  } catch (error) {
    console.error('Erro na inicialização:', error);
  }
});

function stripStaticProductsFromHtml() {
  const categories = Array.from(document.querySelectorAll('.category'));
  categories.forEach(catEl => {
    const id = catEl.id;
    if (!id || id === 'inicio' || id === 'promo') return;

    const title = catEl.querySelector('h2');
    catEl.innerHTML = '';
    if (title) catEl.appendChild(title);
  });
}

// === Configurações ===
const CONFIG = {
  PAGE_SIZE: 30, // Aumentado para menos recargas
  CSV_CACHE_KEY: 'productsCsvCache:v8', // Versão atualizada para forçar limpeza
  CSV_CACHE_TTL: 30 * 60 * 1000, // 30 minutos
  MAX_HIGHLIGHTS: 8, // Aumentado para mais destaques
  MAX_HOME_CATEGORIES: 8
};

// === Estado Global ===
let __allProducts = [];
let __categoryLabels = new Map();
let __categoryState = new Map();
let __cart = [];

// === Carrinho de Compras ===
class Cart {
  constructor() {
    this.items = this.loadFromStorage();
    this.updateUI();
  }

  loadFromStorage() {
    const stored = localStorage.getItem('primos_cart');
    return stored ? JSON.parse(stored) : [];
  }

  saveToStorage() {
    localStorage.setItem('primos_cart', JSON.stringify(this.items));
  }

  add(product, quantity = 1) {
    const existingItem = this.items.find(item => item.codigo === product.codigo);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({
        ...product,
        quantity: quantity
      });
    }
    
    this.saveToStorage();
    this.updateUI();
    this.showNotification('Produto adicionado ao carrinho!');
  }

  remove(codigo) {
    this.items = this.items.filter(item => item.codigo !== codigo);
    this.saveToStorage();
    this.updateUI();
  }

  updateQuantity(codigo, quantity) {
    const item = this.items.find(item => item.codigo === codigo);
    if (item) {
      if (quantity <= 0) {
        this.remove(codigo);
      } else {
        item.quantity = quantity;
        this.saveToStorage();
        this.updateUI();
      }
    }
  }

  getTotal() {
    return this.items.reduce((total, item) => {
      // Tentar diferentes formatos de preço
      let price = 0;
      
      if (item.precoRaw) {
        // Se tiver precoRaw (já processado)
        price = parseFloat(item.precoRaw);
      } else if (item.preco) {
        // Limpar o preço e converter
        const cleanPrice = item.preco
          .replace('R$', '')
          .replace(/\s+/g, '')
          .replace('.', '')
          .replace(',', '.')
          .trim();
        price = parseFloat(cleanPrice);
      }
      
      // Verificar se é um número válido
      if (isNaN(price) || !isFinite(price)) {
        console.warn('Preço inválido para o produto:', item.codigo, item.preco);
        price = 0;
      }
      
      return total + (price * item.quantity);
    }, 0);
  }

  getTotalItems() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  clear() {
    this.items = [];
    this.saveToStorage();
    this.updateUI();
  }

  updateUI() {
    // Atualizar contador
    const countElement = document.getElementById('cartCount');
    if (countElement) {
      countElement.textContent = this.getTotalItems();
    }

    // Atualizar total
    const totalElement = document.getElementById('cartTotal');
    if (totalElement) {
      totalElement.textContent = this.formatPrice(this.getTotal());
    }

    // Atualizar itens do carrinho
    this.renderItems();
  }

  renderItems() {
    const container = document.getElementById('cartItems');
    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = `
        <div class="cart-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <p>Seu carrinho está vazio</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.items.map(item => {
      // Calcular preço usando a mesma lógica do getTotal
      let price = 0;
      
      if (item.precoRaw) {
        price = parseFloat(item.precoRaw);
      } else if (item.preco) {
        const cleanPrice = item.preco
          .replace('R$', '')
          .replace(/\s+/g, '')
          .replace('.', '')
          .replace(',', '.')
          .trim();
        price = parseFloat(cleanPrice);
      }
      
      if (isNaN(price) || !isFinite(price)) {
        price = 0;
      }
      
      return `
      <div class="cart-item">
        <img src="images/products/thumbnail/${item.imagem}" alt="${item.nome}" class="cart-item-image">
        <div class="cart-item-details">
          <div class="cart-item-name">${item.nome}</div>
          <div class="cart-item-price">${this.formatPrice(price)}</div>
          <div class="cart-item-quantity">
            <button class="quantity-btn" onclick="cart.updateQuantity('${item.codigo}', ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
            <span>${item.quantity}</span>
            <button class="quantity-btn" onclick="cart.updateQuantity('${item.codigo}', ${item.quantity + 1})">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="cart.remove('${item.codigo}')">Remover</button>
      </div>
    `;
    }).join('');
  }

  formatPrice(price) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  }

  showNotification(message) {
    // Criar notificação simples
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 1rem;
      border-radius: 8px;
      z-index: 10000;
      animation: slideInUp 0.3s ease;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      font-weight: 500;
      max-width: 300px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOutDown 0.3s ease';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  showCartNotification(message) {
    // Criar notificação específica para o carrinho
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      padding: 1.5rem 2rem;
      border-radius: 12px;
      z-index: 10000;
      animation: bounceIn 0.5s ease;
      box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
      font-weight: 600;
      text-align: center;
      min-width: 280px;
      font-size: 14px;
      border: 2px solid rgba(255, 255, 255, 0.2);
    `;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(notification);

    // Auto-remover após 3 segundos
    setTimeout(() => {
      notification.style.animation = 'bounceOut 0.3s ease';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);

    // Remover ao clicar
    notification.addEventListener('click', () => {
      notification.style.animation = 'bounceOut 0.3s ease';
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
  }
}

// Inicializar carrinho
const cart = new Cart();

// Função global de notificação do carrinho
function showCartNotification(message) {
  // Criar notificação específica para o carrinho
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    padding: 1.5rem 2rem;
    border-radius: 12px;
    z-index: 10000;
    animation: bounceIn 0.5s ease;
    box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
    font-weight: 600;
    text-align: center;
    min-width: 280px;
    font-size: 14px;
    border: 2px solid rgba(255, 255, 255, 0.2);
  `;
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>${message}</span>
    </div>
  `;
  document.body.appendChild(notification);

  // Auto-remover após 3 segundos
  setTimeout(() => {
    notification.style.animation = 'bounceOut 0.3s ease';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);

  // Remover ao clicar
  notification.addEventListener('click', () => {
    notification.style.animation = 'bounceOut 0.3s ease';
    setTimeout(() => {
      notification.remove();
    }, 300);
  });
}

// Funções globais do carrinho
function toggleCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  
  sidebar.classList.toggle('active');
  overlay.classList.toggle('active');
  
  // Prevenir scroll do body quando carrinho está aberto
  document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
}

function clearCart() {
  if (confirm('Tem certeza que deseja esvaziar o carrinho?')) {
    cart.clear();
  }
}

function showCheckoutOptions() {
  if (cart.items.length === 0) {
    showCartNotification('Seu carrinho está vazio! Adicione produtos para continuar.');
    return;
  }

  // Fechar carrinho primeiro
  toggleCart();
  
  // Preencher resumo do pedido
  const summaryContainer = document.getElementById('checkoutSummary');
  const totalElement = document.getElementById('checkoutTotal');
  
  const summaryHTML = cart.items.map(item => {
    let price = 0;
    
    if (item.precoRaw) {
      price = parseFloat(item.precoRaw);
    } else if (item.preco) {
      const cleanPrice = item.preco
        .replace('R$', '')
        .replace(/\s+/g, '')
        .replace('.', '')
        .replace(',', '.')
        .trim();
      price = parseFloat(cleanPrice);
    }
    
    if (isNaN(price) || !isFinite(price)) {
      price = 0;
    }
    
    return `
      <div class="checkout-summary-item">
        <div>
          <div class="checkout-item-name">${item.quantity}x ${item.nome}</div>
          <div class="checkout-item-details">${cart.formatPrice(price)} cada</div>
        </div>
        <div class="checkout-item-details">${cart.formatPrice(price * item.quantity)}</div>
      </div>
    `;
  }).join('');
  
  summaryContainer.innerHTML = summaryHTML;
  totalElement.textContent = cart.formatPrice(cart.getTotal());
  
  // Mostrar modal
  const modal = document.getElementById('checkoutModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  const modal = document.getElementById('checkoutModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function finalizeViaWhatsApp() {
  const message = cart.items.map(item => {
    let price = 0;
    
    if (item.precoRaw) {
      price = parseFloat(item.precoRaw);
    } else if (item.preco) {
      const cleanPrice = item.preco
        .replace('R$', '')
        .replace(/\s+/g, '')
        .replace('.', '')
        .replace(',', '.')
        .trim();
      price = parseFloat(cleanPrice);
    }
    
    if (isNaN(price) || !isFinite(price)) {
      price = 0;
    }
    
    return `${item.quantity}x ${item.nome} - ${cart.formatPrice(price)}`;
  }).join('\n');

  const total = cart.formatPrice(cart.getTotal());
  
  const whatsappMessage = encodeURIComponent(
    `🛒 PEDIDO VIA SITE PRIMOS INFORMÁTICA 🛒\n\nOlá! Gostaria de fazer um pedido através do site:\n\n${message}\n\nTotal: ${total}\n\n⚡ Este pedido foi gerado automaticamente pelo nosso site\n🌐 Site: https://onehamada.github.io/Primos-Informatica/\n\nPodem me ajudar?`
  );
  
  window.open(`https://wa.me/556133406740?text=${whatsappMessage}`, '_blank');
  closeCheckout();
}

function finalizeViaInstagram() {
  const message = cart.items.map(item => {
    let price = 0;
    
    if (item.precoRaw) {
      price = parseFloat(item.precoRaw);
    } else if (item.preco) {
      const cleanPrice = item.preco
        .replace('R$', '')
        .replace(/\s+/g, '')
        .replace('.', '')
        .replace(',', '.')
        .trim();
      price = parseFloat(cleanPrice);
    }
    
    if (isNaN(price) || !isFinite(price)) {
      price = 0;
    }
    
    return `${item.quantity}x ${item.nome} - ${cart.formatPrice(price)}`;
  }).join('\n');

  const total = cart.formatPrice(cart.getTotal());
  
  alert(`🛒 PEDIDO VIA SITE PRIMOS INFORMÁTICA 🛒\n\nRedirecionando para o Instagram...\n\nSeu pedido:\n${message}\n\nTotal: ${total}\n\n⚡ Pedido gerado automaticamente pelo site\n🌐 Site: https://onehamada.github.io/Primos-Informatica/\n\nEnvie-nos uma Direct com esses dados!`);
  
  window.open(`https://www.instagram.com/primosinformaticadf/`, '_blank');
  closeCheckout();
}

function finalizeViaFacebook() {
  const message = cart.items.map(item => {
    let price = 0;
    
    if (item.precoRaw) {
      price = parseFloat(item.precoRaw);
    } else if (item.preco) {
      const cleanPrice = item.preco
        .replace('R$', '')
        .replace(/\s+/g, '')
        .replace('.', '')
        .replace(',', '.')
        .trim();
      price = parseFloat(cleanPrice);
    }
    
    if (isNaN(price) || !isFinite(price)) {
      price = 0;
    }
    
    return `${item.quantity}x ${item.nome} - ${cart.formatPrice(price)}`;
  }).join('\n');

  const total = cart.formatPrice(cart.getTotal());
  
  alert(`🛒 PEDIDO VIA SITE PRIMOS INFORMÁTICA 🛒\n\nRedirecionando para o Facebook...\n\nSeu pedido:\n${message}\n\nTotal: ${total}\n\n⚡ Pedido gerado automaticamente pelo site\n🌐 Site: https://onehamada.github.io/Primos-Informatica/\n\nEnvie-nos uma mensagem no Messenger com esses dados!`);
  
  window.open(`https://www.facebook.com/profile.php?id=61573835540802`, '_blank');
  closeCheckout();
}

function finalizeViaEmail() {
  const message = cart.items.map(item => {
    let price = 0;
    
    if (item.precoRaw) {
      price = parseFloat(item.precoRaw);
    } else if (item.preco) {
      const cleanPrice = item.preco
        .replace('R$', '')
        .replace(/\s+/g, '')
        .replace('.', '')
        .replace(',', '.')
        .trim();
      price = parseFloat(cleanPrice);
    }
    
    if (isNaN(price) || !isFinite(price)) {
      price = 0;
    }
    
    return `${item.quantity}x ${item.nome} - ${cart.formatPrice(price)}`;
  }).join('\n');

  const total = cart.formatPrice(cart.getTotal());
  
  const emailSubject = encodeURIComponent('🛒 PEDIDO VIA SITE - Primos Informática');
  const emailBody = encodeURIComponent(
    `🛒 PEDIDO VIA SITE PRIMOS INFORMÁTICA 🛒\n\nOlá!\n\nGostaria de fazer um pedido através do nosso site:\n\n${message}\n\nTotal: ${total}\n\n⚡ Este pedido foi gerado automaticamente pelo nosso site\n🌐 Site: https://onehamada.github.io/Primos-Informatica/\n\nPodem me ajudar?\n\nDados para contato:\n[Seu nome completo]\n[Seu telefone com DDD]\n[Seu e-mail]\n[Seu endereço completo]\n[Forma de pagamento preferida]\n\nAguardando retorno!`
  );
  
  window.open(`mailto:marketing.primosinfo@gmail.com?subject=${emailSubject}&body=${emailBody}`, '_blank');
  closeCheckout();
}

function finalizePresential() {
  const message = cart.items.map(item => {
    let price = 0;
    
    if (item.precoRaw) {
      price = parseFloat(item.precoRaw);
    } else if (item.preco) {
      const cleanPrice = item.preco
        .replace('R$', '')
        .replace(/\s+/g, '')
        .replace('.', '')
        .replace(',', '.')
        .trim();
      price = parseFloat(cleanPrice);
    }
    
    if (isNaN(price) || !isFinite(price)) {
      price = 0;
    }
    
    return `${item.quantity}x ${item.nome} - ${cart.formatPrice(price)}`;
  }).join('\n');

  const total = cart.formatPrice(cart.getTotal());
  
  alert(`🛒 PEDIDO VIA SITE PRIMOS INFORMÁTICA 🛒\n\nÓtima escolha! Para retirada na loja:\n\n${message}\n\nTotal: ${total}\n\n⚡ Este pedido foi gerado automaticamente pelo nosso site\n🌐 Site: https://onehamada.github.io/Primos-Informatica/\n\n📍 Endereço: Asa Norte CLN 208 BL A LOJA 11\n📞 Telefone: (61) 3340-6740\n⏰ Horário: Seg-Sex 9h-18h, Sáb 9h-13h\n\nLeve seu código do pedido para agilizar o atendimento!\n\nCódigo: ${Date.now()}`);
  
  closeCheckout();
}

// Adicionar botão "Adicionar ao Carrinho" nos produtos
function addCartButtons() {
  const products = document.querySelectorAll('.product');
  products.forEach(product => {
    if (!product.querySelector('.add-to-cart-btn')) {
      const codigo = product.dataset.codigo;
      const button = document.createElement('button');
      button.className = 'add-to-cart-btn btn-primary';
      button.textContent = 'Adicionar ao Carrinho';
      button.onclick = () => {
        const productData = __allProducts.find(p => p.codigo === codigo);
        if (productData) {
          cart.add(productData);
        }
      };
      product.appendChild(button);
    }
  });
}

function parseCsvLine(line) {
  const parts = line.split(';').map(p => p.trim());
  if (parts.length < 8) return null;
  
  const [codigo, nome, categoria, preco, qt, descricao, marca, promocao, imagem] = parts;
  if (!codigo || !nome || !categoria || !preco || qt === undefined) return null;
  
  const precoNum = parseFloat(preco.replace(',', '.'));
  const qtNum = parseInt(qt) || 0;
  if (isNaN(precoNum) || isNaN(qtNum)) return null;
  
  return {
    codigo: codigo.trim(),
    nome: nome.trim(),
    categoria: categoria.trim(),
    preco: precoNum,
    qt: qtNum,
    descricao: descricao ? descricao.trim() : '',
    marca: marca ? marca.trim() : '',
    promocao: promocao ? promocao.trim().toLowerCase() === 'sim' : false,
    imagem: imagem ? imagem.trim() : ''
  };
}

function parseCsv(text) {
  if (!text || typeof text !== 'string') return [];
  
  // Remover BOM (Byte Order Mark) se presente
  text = text.replace(/^\uFEFF/, '');
  
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(';').map(h => h.trim().toLowerCase());
  const requiredFields = ['codigo', 'nome', 'categoria', 'preco', 'qt'];
  
  const products = [];
  for (let i = 1; i < lines.length; i++) {
    const product = parseCsvLine(lines[i]);
    if (!product) continue;

    product.codigo = String(product.codigo).trim();
    product.nome = String(product.nome).trim();
    product.categoria = String(product.categoria).trim();
    product.precoRaw = product.preco;
    product.preco = formatPrice(product.preco);

    products.push(product);
  }

  return products;
}

// === CSV Cache ===
function clearCsvCache() {
  localStorage.removeItem(CONFIG.CSV_CACHE_KEY);
  console.log('Cache CSV limpo');
}

function readCsvCache() {
  try {
    const raw = localStorage.getItem(CONFIG.CSV_CACHE_KEY);
    if (!raw) return null;
    
    const cached = JSON.parse(raw);
    const now = Date.now();
    
    // Verifica se cache ainda é válido
    if (now - cached.timestamp < CONFIG.CSV_CACHE_TTL) {
      return cached.data;
    }
    
    // Remove cache expirado
    localStorage.removeItem(CONFIG.CSV_CACHE_KEY);
    return null;
  } catch (error) {
    console.warn('Erro ao ler cache:', error);
    return null;
  }
}

function writeCsvCache(data) {
  try {
    const cache = {
      data: data,
      timestamp: Date.now()
    };
    localStorage.setItem(CONFIG.CSV_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Erro ao escrever cache:', error);
  }
}

// Dados de fallback completos
const ALL_PRODUCTS_FALLBACK = [
  // Monitores
  {
    codigo: "1006",
    nome: "MONITOR 19\" HAYOM MO6001 PROMOÇÃO",
    categoria: "monitor",
    preco: 285.00,
    qt: 1,
    descricao: "Monitor 19\" MO6001",
    marca: "Hayom",
    promocao: true,
    imagem: "monitor-hayom-19-mo6001.webp"
  },
  {
    codigo: "400772",
    nome: "MONITOR 21.5 PHILIPS LED FULL HD 221V8 WVA HDMI",
    categoria: "monitor",
    preco: 825.00,
    qt: 1,
    descricao: "Monitor 21,5\" Full HD 221V8 WVA HDMI",
    marca: "Philips",
    promocao: false,
    imagem: "monitor-philips-215-fullhd-221v8.webp"
  },
  {
    codigo: "1117",
    nome: "MONITOR 15,4 HAYOM MO 6006",
    categoria: "monitor",
    preco: 300.00,
    qt: 1,
    descricao: "Monitor 15,4\" MO6006",
    marca: "Hayom",
    promocao: false,
    imagem: "monitor-hayom-154-mo6006.webp"
  },
  {
    codigo: "1115",
    nome: "MONITOR 17,1 HAYOM MO6004",
    categoria: "monitor",
    preco: 330.00,
    qt: 1,
    descricao: "Monitor 17,1\" MO6004",
    marca: "Hayom",
    promocao: false,
    imagem: "monitor-hayom-171-mo6004.webp"
  },
  {
    codigo: "1617",
    nome: "MONITOR 21,5 GBT LED HDMI E VGA GBT-M218",
    categoria: "monitor",
    preco: 312.00,
    qt: 1,
    descricao: "Monitor 21,5\" GBT-M218 HDMI/VGA",
    marca: "GBT",
    promocao: false,
    imagem: "monitor-gbt-215-hdmi-vga-m218.webp"
  },
  // Processadores
  {
    codigo: "1888",
    nome: "PROCESSADOR INTEL CELERON 1151 LGA1200 G5905 4MB",
    categoria: "processador",
    preco: 214.99,
    qt: 23,
    descricao: "Intel Celeron G5905 LGA1200 4MB",
    marca: "Intel",
    promocao: false,
    imagem: "g5905.webp"
  },
  {
    codigo: "1889",
    nome: "PROCESSADOR INTEL CELERON 1151 LGA1200 G5925 3.6GHZ",
    categoria: "processador",
    preco: 214.99,
    qt: 16,
    descricao: "Intel Celeron G5925 3.6GHz LGA1200",
    marca: "Intel",
    promocao: false,
    imagem: "g5925.webp"
  },
  {
    codigo: "1039",
    nome: "PROCESSADOR INTEL I3 LGA1150 4150/4160 3.4GHZ 3MB OEM",
    categoria: "processador",
    preco: 75.90,
    qt: 5,
    descricao: "Intel Core i3 4150/4160 3.4GHz 3MB OEM",
    marca: "Intel",
    promocao: false,
    imagem: "i34150.webp"
  },
  // Placas de vídeo
  {
    codigo: "1828",
    nome: "NVIDIA PLACA DE VIDEO INNO3D RTX3060 12GB DDR6",
    categoria: "placa de vídeo",
    preco: 2185.50,
    qt: 1,
    descricao: "RTX 3060 12GB DDR6 PCIe 4.0",
    marca: "NVIDIA",
    promocao: false,
    imagem: "rtx3060.webp"
  },
  {
    codigo: "402487",
    nome: "NVIDIA PLACA DE VIDEO GTX 550 1GB DDR5 128 BITS",
    categoria: "placa de vídeo",
    preco: 303.18,
    qt: 1,
    descricao: "GTX 550 1GB DDR5 128 bits",
    marca: "NVIDIA",
    promocao: true,
    imagem: "gtx550.webp"
  },
  // SSDs
  {
    codigo: "1001",
    nome: "SSD KINGSTON 240GB A400 SATA3",
    categoria: "ssd",
    preco: 189.90,
    qt: 15,
    descricao: "SSD Kingston 240GB A400 SATA3",
    marca: "Kingston",
    promocao: false,
    imagem: "ssd240gb_kingston.webp"
  },
  {
    codigo: "1002",
    nome: "SSD KINGSTON 480GB A400 SATA3",
    categoria: "ssd",
    preco: 289.90,
    qt: 10,
    descricao: "SSD Kingston 480GB A400 SATA3",
    marca: "Kingston",
    promocao: false,
    imagem: "ssd480gb_kingston.webp"
  },
  // HDs
  {
    codigo: "1485",
    nome: "HD EXTERNO 1 TERA SEAGATE EXPANSION USB 3.0",
    categoria: "hd externo",
    preco: 490.00,
    qt: 1,
    descricao: "HD externo 1TB Seagate Expansion USB 3.0",
    marca: "Seagate",
    promocao: false,
    imagem: "hd1tb_sea.webp"
  },
  // Fontes
  {
    codigo: "1883",
    nome: "FONTE REAL 750W 80 PLUS MGS",
    categoria: "fonte",
    preco: 390.00,
    qt: 1,
    descricao: "Fonte Real 750W 80 Plus MGS",
    marca: "MGS",
    promocao: false,
    imagem: "mgs_fonte750w.webp"
  }
];

async function loadProductsFromJson() {
  console.log('Tentando carregar produtos do JSON...');
  try {
    const response = await fetch('data/products.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const products = await response.json();
    console.log('Produtos carregados do JSON:', products.length);
    applyProductsAndRender(products);
    return true;
  } catch (error) {
    console.error('Erro ao carregar JSON, usando fallback hardcoded:', error);
    // Fallback final: usar dados hardcoded de todos os produtos
    applyProductsAndRender(ALL_PRODUCTS_FALLBACK);
    return false;
  }
}

async function loadProductsFromCsv() {
  console.log('Iniciando carregamento de produtos...');
  
  const cached = readCsvCache();
  if (cached) {
    try {
      const products = parseCsv(cached);
      if (products.length) {
        console.log('Usando cache com', products.length, 'produtos');
        applyProductsAndRender(products);
        refreshCacheInBackground();
        return;
      }
    } catch (error) {
      console.warn('Erro ao processar cache:', error);
    }
  }

  console.log('Buscando CSV do servidor...');
  fetch('data/products_completo.csv')
    .then(r => {
      console.log('Response status:', r.status);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.text();
    })
    .then(text => {
      console.log('CSV recebido, tamanho:', text.length, 'caracteres');
      
      // Corrigir encoding: substituir caracteres corrompidos
      const correctedText = text
        .replace(/ǟ/g, 'ÇÃO')
        .replace(/\?/g, 'ÇÃO')
        .replace(/\?\?/g, 'ÇÃO')
        .replace(/\?\?\?/g, 'ÇÃO')
        .replace(/ǟ/g, 'ÇÃO')
        .replace(/\??/g, 'ÇÃO')
        .replace(/\??\?/g, 'ÇÃO')
        .replace(/\uFFFD/g, 'ÇÃO')
        .replace(/Placa mǜe/g, 'Placa mãe')
        .replace(/Placa de vǜdeo/g, 'Placa de vídeo')
        .replace(/placa de vǜdeo/g, 'placa de vídeo')
        .replace(/geraǜo/g, 'geração')
        .replace(/4G/g, '4ªG')
        .replace(/10G/g, '10ªG')
        .replace(/11/g, '11ª')
        .replace(/12/g, '12ª')
        .replace(/13/g, '13ª')
        .replace(/14/g, '14ª')
        .replace(/PROMOǟO/g, 'PROMOÇÃO');
      
      const products = parseCsv(correctedText);
      console.log('Produtos parseados:', products.length);

      if (products.length) {
        applyProductsAndRender(products);
        writeCsvCache(correctedText);
        console.log('Produtos aplicados com sucesso!');
      } else {
        console.error('Nenhum produto encontrado no CSV, tentando JSON...');
        loadProductsFromJson().then(jsonLoaded => {
          if (!jsonLoaded) {
            console.error('Falha ao carregar produtos do JSON também');
          }
        });
      }
    })
    .catch(err => {
      console.error('Erro ao carregar CSV, tentando JSON:', err);
      loadProductsFromJson();
    });
}

// Função para atualizar cache em segundo plano
function refreshCacheInBackground() {
  fetch('data/products.csv')
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.text();
    })
    .then(text => {
      const products = parseCsv(text);
      if (products.length) {
        writeCsvCache(text);
      }
    })
    .catch(err => {
      console.warn('Erro ao atualizar cache em segundo plano:', err);
    });
}

// === Gerenciamento de Categorias ===
function limparCategoriasOrfas() {
  // Pegar categorias que existem no CSV
  const categoriasCSV = new Set(__allProducts.map(p => p.categoria));
  
  // Remover abas que não existem mais no CSV
  document.querySelectorAll('.tab-btn').forEach(tab => {
    const categoria = tab.dataset.target;
    if (categoria && !categoriasCSV.has(categoria) && categoria !== 'inicio' && categoria !== 'promo') {
      tab.remove();
    }
  });
  
  // Remover seções que não existem mais no CSV
  document.querySelectorAll('.category').forEach(section => {
    const categoria = section.id;
    if (categoria && !categoriasCSV.has(categoria) && categoria !== 'inicio' && categoria !== 'promo') {
      section.remove();
    }
  });
  
  // Limpar estado das categorias removidas
  const keysParaRemover = [];
  __categoryState.forEach((_, key) => {
    if (!categoriasCSV.has(key) && key !== 'inicio' && key !== 'promo') {
      keysParaRemover.push(key);
    }
  });
  
  keysParaRemover.forEach(key => {
    __categoryState.delete(key);
    __categoryLabels.delete(key);
  });
}

function ensureCategoriesFromCsv() {
  const tabsContainer = document.querySelector('.tabs');
  if (!tabsContainer) return;

  // Primeiro, limpar categorias órfãs
  limparCategoriasOrfas();

  __categoryLabels.forEach((label, id) => {
    // Verifica se tab já existe
    if (document.querySelector(`[data-target="${id}"]`)) return;

    // Cria tab
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tab-btn';
    tab.dataset.target = id;
    tab.textContent = titleizeCategory(label);
    tab.addEventListener('click', () => showCategory(id));
    tabsContainer.appendChild(tab);

    // Cria seção se não existir
    let section = document.getElementById(id);
    if (!section) {
      section = document.createElement('div');
      section.id = id;
      section.className = 'category';
      section.style.display = 'none';
      section.innerHTML = `<h2>${titleizeCategory(label).toUpperCase()}</h2>`;
      document.querySelector('main').appendChild(section);
    }

    // Inicializa estado da categoria
    if (!__categoryState.has(id)) {
      const products = __allProducts.filter(p => p.categoria.toLowerCase() === id.toLowerCase());
      __categoryState.set(id, {
        products: products.slice(0, CONFIG.PAGE_SIZE),
        hasMore: products.length > CONFIG.PAGE_SIZE
      });
    }
  });
}

function renderProducts(products) {
  __categoryState.forEach((state, categoryId) => {
    renderCategory(categoryId);
  });
}

function populateHomeCategories() {
  const grid = document.getElementById('home-categories-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const categories = Array.from(__categoryLabels.entries()).slice(0, CONFIG.MAX_HOME_CATEGORIES);
  categories.forEach(([id, label]) => {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.addEventListener('click', () => showCategory(id));

    const h3 = document.createElement('h3');
    h3.textContent = titleizeCategory(label);

    const p = document.createElement('p');
    const count = __allProducts.filter(p => p.categoria === id).length;
    p.textContent = `${count} produto${count !== 1 ? 's' : ''}`;

    card.appendChild(h3);
    card.appendChild(p);
    grid.appendChild(card);
  });
}

function populateHomeHighlights() {
  const grid = document.getElementById('home-highlights-grid');
  if (!grid) return;
  grid.innerHTML = '';

  // Pega um produto por categoria (se houver)
  const seenCats = new Set();
  const highlights = [];
  for (const p of __allProducts) {
    if (!seenCats.has(p.categoria)) {
      seenCats.add(p.categoria);
      highlights.push(p);
      if (highlights.length >= CONFIG.MAX_HIGHLIGHTS) break;
    }
  }

  const frag = document.createDocumentFragment();
  highlights.forEach(p => {
    frag.appendChild(createProductElement(p, p.categoria));
  });
  grid.appendChild(frag);
  optimizeProductImages(grid);
}

function titleizeCategory(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// === Funções de renderização ===
function applyProductsAndRender(products) {
  __allProducts = products;
  __categoryLabels.clear();
  
  products.forEach(p => {
    if (!p.categoria) return;
    if (!__categoryLabels.has(p.categoria)) {
      __categoryLabels.set(p.categoria, p.categoriaLabel || p.categoria);
    }
  });

  ensureCategoriesFromCsv();
  renderProducts(products);
  populateHomeCategories();
  populateHomeHighlights();
}

// === UI & Navigation ===
function showCategory(id) {
  document.querySelectorAll('.category').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  
  const target = document.getElementById(id);
  if (target) {
    target.style.display = 'block';
  }
  
  const btn = document.querySelector(`[data-target="${id}"]`);
  if (btn) btn.classList.add('active');
  
  if (id === 'promo') {
    populatePromo();
  } else if (__categoryState.has(id)) {
    renderCategory(id);
  } else {
    const products = __allProducts.filter(p => p.categoria.toLowerCase() === id.toLowerCase());
    
    if (products.length > 0) {
      __categoryState.set(id, {
        products: products.slice(0, CONFIG.PAGE_SIZE),
        hasMore: products.length > CONFIG.PAGE_SIZE
      });
      renderCategory(id);
    } else {
      // Se não encontrou produtos, mostra mensagem
      const container = document.getElementById(id);
      if (container) {
        let grid = container.querySelector('.products-grid');
        if (!grid) {
          grid = document.createElement('div');
          grid.className = 'products-grid';
          container.appendChild(grid);
        }
        grid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #6b7280;">
            <h3>Nenhum produto encontrado</h3>
            <p>Categoria: ${id}</p>
          </div>
        `;
      }
    }
  }
}

// === Image Optimization ===
function preloadCriticalImages() {
  const criticalImages = [
    'images/logo.png',
    'images/products/thumbnail/rtx3060.webp',
    'images/products/thumbnail/gtx1660.webp',
    'images/products/thumbnail/r5230.webp'
  ];
  
  criticalImages.forEach(src => {
    const img = new Image();
    img.src = src;
  });
}

function initDynamicLazyLoading() {
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.dataset.src;
        if (src && !img.src) {
          img.src = src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      }
    });
  }, {
    rootMargin: '50px',
    threshold: 0.1
  });
  
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

function optimizeProductImages(container) {
  // Adicionar loading="lazy" a todas as imagens de produto
  const productImages = container.querySelectorAll('.product img');
  productImages.forEach(img => {
    img.loading = 'lazy';
    img.decoding = 'async';
    
    // Adicionar placeholder para melhor UX
    if (!img.complete) {
      img.style.backgroundColor = '#f0f0f0';
      img.style.backgroundImage = 'linear-gradient(45deg, #f0f0f0 25%, transparent 50%)';
    }
  });
}

// === Helpers ===
function formatPrice(value) {
  if (typeof value === 'number') return `R$ ${value.toFixed(2).replace('.', ',')}`;
  if (typeof value === 'string') {
    const num = parseFloat(value.replace(',', '.').replace(/[^\d.]/g, ''));
    if (!isNaN(num)) return `R$ ${num.toFixed(2).replace('.', ',')}`;
  }
  return 'R$ 0,00';
}

function slugify(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function loadMoreProducts(categoryId) {
  const state = __categoryState.get(categoryId);
  if (!state || !state.hasMore) return;
  
  const next = state.products.length;
  const more = __allProducts.filter(p => p.categoria === categoryId).slice(next, next + CONFIG.PAGE_SIZE);
  state.products.push(...more);
  state.hasMore = more.length === CONFIG.PAGE_SIZE;
  renderCategory(categoryId);
}

function createProductElement(product, categoryId) {
  const div = document.createElement('div');
  div.className = 'product';
  div.dataset.code = product.codigo || '';
  div.dataset.category = categoryId;

  // Adicionar classe de estoque
  const temEstoque = product.qt > 0;
  if (!temEstoque) {
    div.classList.add('sem-estoque');
  }

  const img = document.createElement('img');
  img.alt = product.nome || 'Produto';
  img.loading = 'lazy';
  img.decoding = 'async';
  
  // Simplificado: usar apenas imagem específica se existir
  if (product.imagem) {
    img.src = `images/products/thumbnail/${product.imagem}`;
  } else {
    img.src = `images/products/thumbnail/${product.codigo}.webp`;
  }
  
  // Fallback simples para categoria
  img.onerror = function() {
    this.onerror = null;
    this.src = `images/products/thumbnail/${slugify(product.categoria || 'default')}.webp`;
  };

  const info = document.createElement('div');
  info.className = 'product-info';

  const title = document.createElement('h4');
  
  // Adiciona marca se existir
  let displayName = product.nome;
  if (product.marca) {
    displayName = `${product.marca} ${product.nome}`;
  }
  
  // Função inteligente de quebra de linha baseada no tamanho do container
  function formatProductName(name) {
    const maxCharsPerLine = 22; // aumentado para acomodar nomes maiores
    let result = '';
    let currentLine = '';
    
    const words = name.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // Se adicionar esta palavra exceder o limite, quebra a linha
      if (currentLine.length + word.length + 1 > maxCharsPerLine && currentLine.length > 0) {
        result += currentLine + '<br>';
        currentLine = word;
      } else {
        if (currentLine.length > 0) {
          currentLine += ' ' + word;
        } else {
          currentLine = word;
        }
      }
    }
    
    // Adiciona a última linha
    if (currentLine.length > 0) {
      result += currentLine;
    }
    
    return result;
  }
  
  title.innerHTML = formatProductName(displayName || 'Produto');
  
  // Adiciona descrição se existir
  if (product.descricao) {
    const desc = document.createElement('div');
    desc.className = 'product-description';
    desc.textContent = product.descricao;
    info.appendChild(desc);
  }

  const price = document.createElement('div');
  price.className = 'price';
  if (product.promocao) {
    price.classList.add('promocao');
  }
  price.textContent = formatPrice(product.precoRaw);

  // Adicionar status de estoque
  const stockStatus = document.createElement('div');
  stockStatus.className = 'stock-status';
  if (temEstoque) {
    stockStatus.textContent = 'Em estoque';
    stockStatus.classList.add('disponivel');
  } else {
    stockStatus.textContent = 'Esgotado';
    stockStatus.classList.add('esgotado');
  }

  info.appendChild(title);
  info.appendChild(price);
  info.appendChild(stockStatus);

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'add-to-cart-btn';
  addBtn.textContent = temEstoque ? 'Adicionar ao Carrinho' : 'Esgotado';
  addBtn.title = temEstoque ? 'Adicionar ao carrinho' : 'Produto esgotado';
  addBtn.disabled = !temEstoque;
  
  addBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (temEstoque) {
      cart.add(product);
    }
  });

  div.appendChild(img);
  div.appendChild(info);
  div.appendChild(addBtn);
  return div;
}

function renderCategory(categoryId) {
  const container = document.getElementById(categoryId);
  if (!container) return;
  
  let grid = container.querySelector('.products-grid');
  if (!grid) {
    grid = document.createElement('div');
    grid.className = 'products-grid';
    container.appendChild(grid);
  }
  grid.innerHTML = '';

  const state = __categoryState.get(categoryId);
  const products = state ? state.products : [];
  const frag = document.createDocumentFragment();
  
  products.forEach(p => {
    frag.appendChild(createProductElement(p, categoryId));
  });
  grid.appendChild(frag);

  if (!state || state.hasMore) {
    const loadMore = document.createElement('button');
    loadMore.className = 'load-more';
    loadMore.textContent = 'Carregar mais';
    loadMore.addEventListener('click', () => loadMoreProducts(categoryId));
    container.appendChild(loadMore);
  }
}

// === Promo Section ===
function populatePromo() {
  const promoContainer = document.getElementById('promo-list');
  if (!promoContainer) return;
  promoContainer.innerHTML = '';

  const items = __allProducts.filter(p => p.promocao === true);
  
  const frag = document.createDocumentFragment();
  items.forEach(p => {
    frag.appendChild(createProductElement(p, 'promo'));
  });
  promoContainer.appendChild(frag);
  optimizeProductImages(promoContainer);
}

// === Inicialização do Site ===
document.addEventListener('DOMContentLoaded', () => {
  // Inicializa funcionalidades premium
  initPerformanceMonitor();
  initNotifications();
  initAdvancedLazyLoading();
  initMicroInteractions();
  
  // Inicializa funcionalidades existentes
  initDragScroll();
  initBackToTop();
  animateElements();
  initSearch();
  
  // Mostra loading ao carregar produtos
  showLoading();
  
  // Carrega produtos do CSV
  loadProductsFromCsv();
  
  // Esconde loading após carregar
  setTimeout(() => {
    hideLoading();
  }, 1000);
});

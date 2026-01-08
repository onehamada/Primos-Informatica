// Este arquivo é destinado a scripts JavaScript que podem ser usados para adicionar interatividade à loja, como funcionalidades de busca ou manipulação de produtos.

// === LIMPEZA DE CACHE ===
function clearAllCache() {
  console.log('🧹 Limpando todo o cache...');
  
  // Limpar localStorage
  localStorage.clear();
  
  // Limpar sessionStorage
  sessionStorage.clear();
  
  // Limpar caches do navegador
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('✅ Cache limpo com sucesso!');
    });
  }
  
  // Limpar variáveis globais de cache
  if (typeof __allProducts !== 'undefined') {
    __allProducts = [];
  }
  
  if (typeof searchCache !== 'undefined') {
    searchCache.clear();
  }
  
  if (typeof currentSearchResults !== 'undefined') {
    currentSearchResults = [];
  }
  
  // Recarregar página após limpeza
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// Comando global para limpar cache
window.clearCache = clearAllCache;

// === Performance Monitor ===
function initPerformanceMonitor() {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          // LCP sem log
        }
        if (entry.entryType === 'first-input') {
          // FID sem log
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
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    // Pede permissão de forma sutil
    setTimeout(() => {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          // Notificações autorizadas
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
document.addEventListener('click', function(e) {
  const filtersContainer = document.getElementById('filtersContainer');
  const filtersPanel = document.getElementById('filtersPanel');
  
  if (filtersContainer && filtersPanel && !filtersContainer.contains(e.target) && filtersPanel.classList.contains('active')) {
    toggleFilters();
  }
});

function initSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  
  if (!searchInput || !searchResults) {
    console.error('❌ Elementos de busca não encontrados!');
    return;
  }

  // Debounce para evitar muitas buscas
  searchInput.addEventListener('input', (e) => {
    clearTimeout(__searchTimeout);
    __searchTimeout = setTimeout(() => {
      performSearch(e.target.value.trim());
    }, CONFIG.DEBOUNCE_DELAY);
  });

  // Fechar busca ao clicar fora
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      hideSearchResults();
    }
  });

  // Fechar busca com ESC
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideSearchResults();
      searchInput.blur();
    }
  });
}

function performSearch(query) {
  if (!query || query.length < 2) {
    hideSearchResults();
    return;
  }
  
  const results = [];
  const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  for (let i = 0; i < __allProducts.length; i++) {
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

// === Drag & Scroll Ultra Suave para Header Tabs ===
function initDragScroll() {
  const headerTabs = document.querySelector('.header-tabs');
  const container = document.querySelector('.header-tabs-container');
  if (!headerTabs || !container) return;
  
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;
  let isDragging = false;
  let clickedButton = null;
  let animationId = null;
  let velocity = 0;
  let lastX = 0;
  let lastTime = 0;
  
  // Função de animação suave
  function smoothScroll() {
    if (Math.abs(velocity) > 0.1) {
      headerTabs.scrollLeft += velocity;
      velocity *= 0.92; // Menos fricção para mais sensibilidade
      animationId = requestAnimationFrame(smoothScroll);
    } else {
      velocity = 0;
      cancelAnimationFrame(animationId);
    }
  }
  
  // Atualizar indicadores de scroll
  function updateScrollIndicators() {
    const scrollLeft = headerTabs.scrollLeft;
    const maxScroll = headerTabs.scrollWidth - headerTabs.clientWidth;
    
    container.classList.remove('scroll-start', 'scroll-middle', 'scroll-end');
    
    if (scrollLeft <= 0) {
      container.classList.add('scroll-start');
    } else if (scrollLeft >= maxScroll - 10) {
      container.classList.add('scroll-end');
    } else {
      container.classList.add('scroll-middle');
    }
  }
  
  // Mouse wheel super suave e mais sensível
  headerTabs.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    const delta = e.deltaY * 0.6; // Aumentar sensibilidade
    const targetScroll = headerTabs.scrollLeft + delta;
    
    // Animação suave para wheel
    const startScroll = headerTabs.scrollLeft;
    const distance = targetScroll - startScroll;
    const duration = 200; // Mais rápido
    const startTime = performance.now();
    
    function animateWheel(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      headerTabs.scrollLeft = startScroll + distance * easeProgress;
      
      if (progress < 1) {
        requestAnimationFrame(animateWheel);
      }
      
      updateScrollIndicators();
    }
    
    requestAnimationFrame(animateWheel);
  }, { passive: false });
  
  // Mouse events ultra responsivos - permite drag sobre botões
  headerTabs.addEventListener('mousedown', (e) => {
    // Sempre permite drag, mesmo sobre botões
    clickedButton = e.target.classList.contains('tab-btn') ? e.target : null;
    
    isDown = true;
    headerTabs.style.cursor = 'grabbing';
    startX = e.pageX - headerTabs.offsetLeft;
    scrollLeft = headerTabs.scrollLeft;
    lastX = e.pageX;
    lastTime = performance.now();
    velocity = 0;
    isDragging = false;
    
    // Cancelar animação anterior
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    
    e.preventDefault();
  });
  
  headerTabs.addEventListener('mouseleave', () => {
    if (isDown && Math.abs(velocity) > 0.5) {
      // Continuar animação de inércia
      animationId = requestAnimationFrame(smoothScroll);
    }
    
    isDown = false;
    isDragging = false;
    headerTabs.style.cursor = 'grab';
    clickedButton = null;
  });
  
  headerTabs.addEventListener('mouseup', (e) => {
    isDown = false;
    
    // Se não houve drag e havia um botão clicado
    if (!isDragging && clickedButton) {
      setTimeout(() => {
        if (clickedButton) clickedButton.click();
      }, 50);
    }
    
    // Continuar animação de inércia
    if (Math.abs(velocity) > 0.5) {
      animationId = requestAnimationFrame(smoothScroll);
    }
    
    headerTabs.style.cursor = 'grab';
    clickedButton = null;
  });
  
  headerTabs.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    
    const currentTime = performance.now();
    const currentX = e.pageX;
    const deltaTime = currentTime - lastTime;
    
    if (deltaTime > 0) {
      const deltaX = currentX - lastX;
      velocity = deltaX / deltaTime * 16; // Normalizar para 60fps
    }
    
    isDragging = true;
    const x = currentX - headerTabs.offsetLeft;
    const walk = (x - startX) * 1.5; // Aumentar sensibilidade
    
    headerTabs.scrollLeft = scrollLeft - walk;
    
    lastX = currentX;
    lastTime = currentTime;
    updateScrollIndicators();
  });
  
  // Touch events super suaves
  let touchStartX = 0;
  let touchScrollLeft = 0;
  let touchVelocity = 0;
  let lastTouchX = 0;
  let lastTouchTime = 0;
  
  headerTabs.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchScrollLeft = headerTabs.scrollLeft;
    lastTouchX = touchStartX;
    lastTouchTime = performance.now();
    touchVelocity = 0;
    
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  }, { passive: true });
  
  headerTabs.addEventListener('touchmove', (e) => {
    const currentTime = performance.now();
    const currentX = e.touches[0].clientX;
    const deltaTime = currentTime - lastTouchTime;
    
    if (deltaTime > 0) {
      const deltaX = currentX - lastTouchX;
      touchVelocity = deltaX / deltaTime * 16;
    }
    
    const walk = (touchStartX - currentX) * 0.8; // Mais sensível
    headerTabs.scrollLeft = touchScrollLeft + walk;
    
    lastTouchX = currentX;
    lastTouchTime = currentTime;
    updateScrollIndicators();
  }, { passive: true });
  
  headerTabs.addEventListener('touchend', () => {
    // Continuar com inércia no touch
    if (Math.abs(touchVelocity) > 0.5) {
      velocity = -touchVelocity * 2.5; // Mais sensibilidade
      animationId = requestAnimationFrame(smoothScroll);
    }
  });
  
  // Prevenir clique acidental durante o drag
  headerTabs.addEventListener('click', (e) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  });
  
  // Scroll com setas do teclado mais sensível
  headerTabs.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      velocity = -8; // Mais sensível
      animationId = requestAnimationFrame(smoothScroll);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      velocity = 8; // Mais sensível
      animationId = requestAnimationFrame(smoothScroll);
    }
  });
  
  headerTabs.setAttribute('tabindex', '0');
  
  // Inicializar indicadores
  updateScrollIndicators();
  
  // Atualizar indicadores no scroll
  headerTabs.addEventListener('scroll', updateScrollIndicators);
}

// === Inicialização Otimizada ===
const CONFIG = {
  PAGE_SIZE: 30, // Aumentado para menos recargas
  CSV_CACHE_KEY: 'productsCsvCache:v9', // Versão atualizada para forçar limpeza
  CSV_CACHE_TTL: 30 * 60 * 1000, // 30 minutos
  DEBOUNCE_DELAY: 300,
  CACHE_DURATION: 10 * 60 * 1000, // 10 minutos
  MAX_HIGHLIGHTS: 8 // Máximo de produtos em destaque na home
};

// === Sistema de Cache Otimizado ===
const Cache = {
  data: new Map(),
  timestamps: new Map(),
  
  get(key) {
    const timestamp = this.timestamps.get(key);
    if (timestamp && Date.now() - timestamp < CONFIG.CACHE_DURATION) {
      return this.data.get(key);
    }
    return null;
  },
  
  set(key, value) {
    this.data.set(key, value);
    this.timestamps.set(key, Date.now());
  },
  
  clear() {
    this.data.clear();
    this.timestamps.clear();
  }
};

// === Estado Global Otimizado ===
let __allProducts = [];
let __categoryState = new Map();
let __categoryLabels = new Map();
let __searchTimeout = null;

// Variáveis para o sistema de busca
const searchCache = new Map();
let currentSearchResults = [];

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
  
  // Converter preço brasileiro (ex: 285,00) para ponto decimal (285.00)
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

// Função parseCsv foi substituída por parseCsvOptimized para melhor processamento de preços

// === CSV Cache ===
function clearCsvCache() {
  localStorage.removeItem(CONFIG.CSV_CACHE_KEY);
  localStorage.removeItem(CONFIG.CSV_CACHE_KEY + '_timestamp');
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

async function loadProductsFromCsv() {
  try {
    // Força cache busting com timestamp
    const timestamp = Date.now();
    const response = await fetch(`data/products.csv?t=${timestamp}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    
    if (!csvText.trim()) {
      throw new Error('CSV vazio ou inválido');
    }
    
    const products = parseCsvOptimized(csvText);
    
    if (products.length > 0) {
      // Salva no cache
      writeCsvCache(products);
      applyProductsAndRender(products);
    } else {
      // Fallback para cache se CSV estiver vazio
      const cached = readCsvCache();
      if (cached) {
        applyProductsAndRender(cached);
      } else {
        // Fallback final para hardcoded
        applyProductsAndRender(ALL_PRODUCTS_FALLBACK);
      }
    }
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    
    // Tenta cache como fallback
    const cached = readCsvCache();
    if (cached) {
      applyProductsAndRender(cached);
    } else {
      // Fallback final
      applyProductsAndRender(ALL_PRODUCTS_FALLBACK);
    }
  }
}

function parseCsvOptimized(csvText) {
  try {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      console.error('CSV vazio ou inválido');
      return [];
    }
    
    const headers = lines[0].split(';').map(h => h.trim());
    
    const products = lines.slice(1).map((line, index) => {
      const values = line.split(';');
      const product = {};
      
      headers.forEach((header, headerIndex) => {
        let value = values[headerIndex] || '';
        value = value.trim();
        
        // Processamento específico por campo
        switch(header) {
          case 'codigo':
            product.codigo = value;
            break;
          case 'nome':
            product.nome = value;
            break;
          case 'categoria':
            product.categoria = value;
            break;
          case 'preco':
            product.precoRaw = parseFloat(value.replace(',', '.')) || 0;
            product.preco = formatPrice(product.precoRaw);
            break;
          case 'qt':
            product.qt = parseInt(value) || 0;
            break;
          case 'descricao':
            product.descricao = value;
            break;
          case 'marca':
            product.marca = value;
            break;
          case 'promocao':
            product.promocao = value.toLowerCase() === 'sim';
            break;
          case 'imagem':
            product.imagem = value;
            break;
          default:
            product[header] = value;
        }
      });
      
      // Validação básica
      if (!product.codigo || !product.nome) {
        console.warn(`Produto inválido na linha ${index + 2}:`, line);
        return null;
      }
      
      return product;
    }).filter(p => p !== null && p.codigo); // Remove produtos inválidos
    
    return products;
    
  } catch (error) {
    console.error('❌ Erro no parsing do CSV:', error);
    // Retorna array vazio em caso de erro
    return [];
  }
}

function showErrorMessage(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
    <p>${message}</p>
  `;
  
  document.body.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 5000);
}

async function loadProductsFromJson() {
  try {
    const response = await fetch('data/products.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const products = await response.json();
    applyProductsAndRender(products);
    return true;
  } catch (error) {
    console.error('❌ Erro ao carregar produtos do JSON:', error);
    return false;
  }
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
      const products = __allProducts.filter(p => {
        const normalizedCategory = normalizeCategory(p.categoria);
        const normalizedId = normalizeCategory(id);
        return normalizedCategory.toLowerCase() === normalizedId.toLowerCase();
      });
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

  // Usa as categorias definidas no mapa
  Object.keys(CATEGORIES_MAP).forEach(categoryKey => {
    const products = getProductsByCategory(categoryKey);
    const card = document.createElement('div');
    card.className = 'category-card';
    card.addEventListener('click', () => showCategory(categoryKey));

    const h3 = document.createElement('h3');
    h3.textContent = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);

    const p = document.createElement('p');
    p.textContent = `${products.length} produto${products.length !== 1 ? 's' : ''}`;

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
  const highlights = [];
  Object.keys(CATEGORIES_MAP).forEach(categoryKey => {
    const products = getProductsByCategory(categoryKey);
    if (products.length > 0) {
      highlights.push(products[0]); // Pega o primeiro produto de cada categoria
    }
  });

  const frag = document.createDocumentFragment();
  highlights.slice(0, CONFIG.MAX_HIGHLIGHTS).forEach(p => {
    frag.appendChild(createProductElement(p, 'promo'));
  });
  grid.appendChild(frag);
  optimizeProductImages(grid);
}

function titleizeCategory(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// === Funções de renderização ===
function applyProductsAndRender(products) {
  if (!products || products.length === 0) {
    console.error('❌ Nenhum produto para renderizar!');
    showErrorMessage('Nenhum produto encontrado. Verifique o arquivo CSV.');
    return;
  }
  
  __allProducts = products;
  
  // Renderiza elementos da página inicial
  try {
    populateHomeCategories();
    populateHomeHighlights();
  } catch (error) {
    console.error('❌ Erro ao renderizar home:', error);
  }
}

// === Sistema de Categorias Refeito do Zero ===
const CATEGORIES_MAP = {
  'monitor': 'monitor',
  'processador': 'processador', 
  'placa de vídeo': 'placa de vídeo',
  'placa mãe': 'placa mãe',
  'ssd': 'ssd',
  'hd externo': 'hd externo',
  'hd interno': 'hd interno',
  'fonte': 'fonte',
  'teclado': 'teclado',
  'mouse': 'mouse',
  'redes': 'redes',
  'access-point': 'access-point',
  'repetidor': 'repetidor',
  'adaptador': 'adaptador',
  'audio': 'audio',
  'acessorios': 'acessorios',
  'cabos': 'cabos',
  'webcam': 'webcam'
};

// Função simples para obter produtos de uma categoria
function getProductsByCategory(categoryKey) {
  const targetCategory = categoryKey.toLowerCase().trim();
  
  return __allProducts.filter(product => {
    if (!product || !product.categoria) return false;
    
    const productCategory = product.categoria.trim().toLowerCase();
    
    // Comparação direta
    if (productCategory === targetCategory) return true;
    
    // Comparação com remoção de acentos e caracteres especiais
    const normalizeCategory = (str) => {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^\w\s-]/g, '') // Remove caracteres especiais exceto espaço e hífen
        .replace(/\s+/g, ' ') // Normaliza espaços
        .trim();
    };
    
    return normalizeCategory(productCategory) === normalizeCategory(targetCategory);
  });
}

// === UI & Navigation ===
function showCategory(id) {
  // Esconde todas as categorias
  document.querySelectorAll('.category').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  
  // Mostra a categoria selecionada
  const target = document.getElementById(id);
  if (target) {
    target.style.display = 'block';
  }
  
  // Ativa o botão da tab
  const btn = document.querySelector(`[data-target="${id}"]`);
  if (btn) {
    btn.classList.add('active');
  }
  
  if (id === 'promo') {
    populatePromo();
  } else if (id === 'inicio') {
    // Página inicial já tem conteúdo próprio
  } else {
    // Busca produtos da categoria
    const products = getProductsByCategory(id);
    
    if (products.length > 0) {
      renderCategoryProducts(id, products);
    } else {
      renderEmptyCategory(id);
    }
}  }
}

function renderCategoryProducts(categoryId, products) {
  const container = document.getElementById(categoryId);
  if (!container) {
    console.error('❌ Container da categoria não encontrado:', categoryId);
    return;
  }
  
  let grid = container.querySelector('.products-grid');
  if (!grid) {
    grid = document.createElement('div');
    grid.className = 'products-grid';
    container.appendChild(grid);
  }
  
  grid.innerHTML = '';
  
  const frag = document.createDocumentFragment();
  products.forEach((product, index) => {
    const productImg = document.createElement('img');
    productImg.src = product.imagem;
    productImg.alt = product.nome;
    productImg.loading = 'lazy';
    productImg.decoding = 'async';
    const productElement = createProductElement(product, categoryId);
    frag.appendChild(productElement);
  });
  
  grid.appendChild(frag);
  
  // Adiciona botões de carrinho
  addCartButtons();
  // Otimiza imagens
  optimizeProductImages(grid);
}

function renderEmptyCategory(categoryId) {
  const container = document.getElementById(categoryId);
  if (!container) return;
  
  let grid = container.querySelector('.products-grid');
  if (!grid) {
    grid = document.createElement('div');
    grid.className = 'products-grid';
    container.appendChild(grid);
  }
  
  grid.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #6b7280;">
      <h3>Nenhum produto encontrado</h3>
      <p>Categoria: ${categoryId}</p>
      <p>Verifique se o nome da categoria corresponde ao CSV</p>
    </div>
  `;
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
  const more = __allProducts.filter(p => {
    const normalizedCategory = normalizeCategory(p.categoria);
    const normalizedId = normalizeCategory(categoryId);
    return normalizedCategory.toLowerCase() === normalizedId.toLowerCase();
  }).slice(next, next + CONFIG.PAGE_SIZE);
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
    console.error(`❌ Erro ao carregar imagem: ${this.src}`);
    this.onerror = null;
    this.src = `images/products/thumbnail/${slugify(product.categoria || 'default')}.webp`;
  };

  img.onload = function() {
    // Imagem carregada com sucesso
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
  if (!promoContainer) {
    console.error('❌ Container #promo-list não encontrado');
    return;
  }
  
  // Pega apenas produtos em promoção
  const promoProducts = __allProducts.filter(p => p.promocao === true);
  
  // Limpa container
  promoContainer.innerHTML = '';
  
  const frag = document.createDocumentFragment();
  promoProducts.forEach(p => {
    const productElement = createProductElement(p, 'promo');
    frag.appendChild(productElement);
  });
  promoContainer.appendChild(frag);
  optimizeProductImages(promoContainer);
  addCartButtons();
}

// === Inicialização Otimizada ===
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Limpar cache antigo para forçar recarregamento com preços corrigidos
    clearCsvCache();
    
    // Inicializa funcionalidades básicas
    initDragScroll();
    initSearch();
    preloadCriticalImages();
    stripStaticProductsFromHtml();
    
    // Mostra loading
    showLoading();
    
    // Carrega produtos do CSV com cache
    await loadProductsFromCsv();
    
    // Mostra categoria inicial após carregar produtos
    if (typeof showCategory === 'function') {
      showCategory('inicio');
    }
    
    optimizeProductImages(document);
    addCartButtons();
    
    // Esconde loading
    setTimeout(() => {
      hideLoading();
    }, 1000);
    
  } catch (error) {
    console.error('❌ Erro na inicialização:', error);
    showErrorMessage('Erro ao carregar o site. Tente recarregar a página.');
    hideLoading();
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

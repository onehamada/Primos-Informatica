// Este arquivo é destinado a scripts JavaScript que podem ser usados para adicionar interatividade à loja, como funcionalidades de busca ou manipulação de produtos.

// === Inicialização ===
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Otimização: pré-carregar imagens críticas
    preloadCriticalImages();
    
    stripStaticProductsFromHtml();
    await loadProductsFromCsv();
    populatePromo();
    showCategory('inicio');
    optimizeProductImages(document);
    initTabsDragScroll();
    
    // Inicializar busca
    initSearch();
    
    // Otimização: lazy loading dinâmico
    initDynamicLazyLoading();
    
    // Inicializar footer inteligente
    initSmartFooter();
    
  } catch (error) {
    console.error('Erro na inicialização:', error);
  }
});

// === Footer Inteligente ===
function initSmartFooter() {
  let lastScrollY = window.scrollY;
  let ticking = false;
  const footer = document.querySelector('footer');
  
  if (!footer) return;
  
  function updateFooter() {
    const currentScrollY = window.scrollY;
    const scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';
    const isAtTop = currentScrollY < 100;
    const isAtBottom = window.innerHeight + currentScrollY >= document.body.offsetHeight - 100;
    
    // Esconder footer quando rolando para baixo (exceto no topo)
    if (scrollDirection === 'down' && !isAtTop) {
      footer.classList.add('hidden');
    } 
    // Mostrar footer quando rolando para cima ou no topo
    else if (scrollDirection === 'up' || isAtTop || isAtBottom) {
      footer.classList.remove('hidden');
    }
    
    lastScrollY = currentScrollY;
    ticking = false;
  }
  
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateFooter);
      ticking = true;
    }
  }
  
  // Throttle scroll events
  window.addEventListener('scroll', requestTick, { passive: true });
  
  // Mostrar footer quando mouse estiver perto do bottom
  document.addEventListener('mousemove', (e) => {
    const threshold = 100; // 100px do bottom
    const distanceFromBottom = window.innerHeight - e.clientY;
    
    if (distanceFromBottom < threshold) {
      footer.classList.remove('hidden');
    }
  });
  
  // Mostrar footer em mobile quando tocar perto do bottom
  if ('ontouchstart' in window) {
    document.addEventListener('touchstart', (e) => {
      const threshold = 150;
      const touch = e.touches[0];
      const distanceFromBottom = window.innerHeight - touch.clientY;
      
      if (distanceFromBottom < threshold) {
        footer.classList.remove('hidden');
      }
    });
  }
}

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
  CSV_CACHE_KEY: 'productsCsvCache:v7', // Versão atualizada para forçar limpeza
  CSV_CACHE_TTL: 30 * 60 * 1000, // 30 minutos
  MAX_HIGHLIGHTS: 8, // Aumentado para mais destaques
  MAX_HOME_CATEGORIES: 8
};

// === Estado Global ===
let __allProducts = [];
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
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Inicializar carrinho
const cart = new Cart();

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

function checkout() {
  if (cart.items.length === 0) {
    alert('Seu carrinho está vazio!');
    return;
  }

  const message = cart.items.map(item => {
    // Calcular preço usando a mesma lógica
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
    `Olá! Gostaria de fazer um pedido:\n\n${message}\n\nTotal: ${total}\n\nPodem me ajudar?`
  );
  
  window.open(`https://wa.me/556133406740?text=${whatsappMessage}`, '_blank');
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
let __categoryLabels = new Map();
let currentCategory = null;
let searchAbortController = null;

// === Funcionalidade de Busca ===
function initSearch() {
  const searchInput = document.querySelector('input[type="text"]');
  if (!searchInput) return;
  
  let searchTimeout;
  
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    
    // Cancelar busca anterior
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Debounce de 300ms
    searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 300);
  });
  
  // Limpar busca ao pressionar Escape
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      const searchDropdown = document.getElementById('search-dropdown');
      if (searchDropdown) {
        searchDropdown.style.display = 'none';
      }
      showCategory(currentCategory || 'inicio');
    }
  });
}

function performSearch(query) {
  if (!query) {
    // Esconder dropdown se busca vazia
    const searchDropdown = document.getElementById('search-dropdown');
    if (searchDropdown) {
      searchDropdown.style.display = 'none';
    }
    showCategory(currentCategory || 'inicio');
    return;
  }
  
  // Cancelar busca anterior se existir
  if (searchAbortController) {
    searchAbortController.abort();
  }
  
  searchAbortController = new AbortController();
  
  // Filtrar produtos
  const filteredProducts = __allProducts.filter(product => {
    const searchTerm = query.toLowerCase();
    return (
      product.nome.toLowerCase().includes(searchTerm) ||
      product.descricao.toLowerCase().includes(searchTerm) ||
      product.marca.toLowerCase().includes(searchTerm) ||
      product.categoria.toLowerCase().includes(searchTerm) ||
      product.codigo.toLowerCase().includes(searchTerm)
    );
  });
  
  // Mostrar resultados da busca
  showSearchResults(filteredProducts, query);
}

function showSearchResults(products, query) {
  // Não ocultar categorias, apenas mostrar dropdown
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  
  // Criar ou mostrar dropdown de busca
  let searchDropdown = document.getElementById('search-dropdown');
  if (!searchDropdown) {
    searchDropdown = document.createElement('div');
    searchDropdown.id = 'search-dropdown';
    searchDropdown.className = 'search-dropdown';
    // Adicionar ao input de busca, não ao header
    const searchInput = document.querySelector('input[type="text"]');
    if (searchInput) {
      searchInput.parentNode.appendChild(searchDropdown);
    }
  }
  
  searchDropdown.innerHTML = '';
  
  if (products.length === 0) {
    searchDropdown.innerHTML = '<div class="search-empty">Nenhum produto encontrado para "' + query + '"</div>';
  } else {
    const frag = document.createDocumentFragment();
    products.forEach(p => {
      frag.appendChild(createProductElement(p, 'search'));
    });
    searchDropdown.appendChild(frag);
    optimizeProductImages(searchDropdown);
  }
  
  // Mostrar dropdown
  searchDropdown.style.display = 'block';
  
  currentCategory = 'search-results';
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
    categoria: categoria.trim().toLowerCase(),
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
  
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(';').map(h => h.trim().toLowerCase());
  const requiredFields = ['codigo', 'nome', 'categoria', 'preco', 'qt'];
  
  const products = [];
  for (let i = 1; i < lines.length; i++) {
    const product = parseCsvLine(lines[i]);
    if (!product) continue;

    // Normalização
    product.codigo = String(product.codigo).trim();
    product.nome = String(product.nome).trim();
    product.categoria = String(product.categoria).toLowerCase().trim();
    product.precoRaw = product.preco;
    product.preco = formatPrice(product.preco);

    products.push(product);
  }

  return products;
}

// === CSV Cache ===
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

async function loadProductsFromCsv() {
  // Tenta carregar do cache primeiro
  const cached = readCsvCache();
  if (cached) {
    try {
      const products = parseCsv(cached);
      if (products.length) {
        applyProductsAndRender(products);
        refreshCacheInBackground();
        return;
      }
    } catch (_) {}
  }
  
  fetch('data/products.csv')
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.text();
    })
    .then(text => {
      const products = parseCsv(text);
      if (products.length) {
        applyProductsAndRender(products);
        writeCsvCache(text);
      } else {
        console.warn('Nenhum produto válido encontrado no CSV');
      }
    })
    .catch(err => {
      console.error('Erro ao carregar CSV:', err);
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
      const products = __allProducts.filter(p => p.categoria === id);
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
  if (target) target.style.display = 'block';
  const btn = document.querySelector(`[data-target="${id}"]`);
  if (btn) btn.classList.add('active');
  currentCategory = id;
  
  if (id === 'promo') {
    populatePromo();
  } else if (__categoryState.has(id)) {
    renderCategory(id);
  } else {
    // Para categorias manuais (como "placa mãe"), inicializa e renderiza
    const products = __allProducts.filter(p => p.categoria === id);
    if (products.length > 0) {
      __categoryState.set(id, {
        products: products.slice(0, CONFIG.PAGE_SIZE),
        hasMore: products.length > CONFIG.PAGE_SIZE
      });
      renderCategory(id);
    }
  }
}

// === Outras funções ===
function initTabsDragScroll() {
  const tabs = document.querySelector('.tabs');
  if (!tabs) return;

  let isDown = false;
  let startX = 0;
  let startScrollLeft = 0;
  let dragged = false;

  const onDown = e => {
    // Apenas botão principal do mouse
    if (e.button !== 0) return;
    isDown = true;
    dragged = false;
    startX = e.clientX;
    startScrollLeft = tabs.scrollLeft;
  };

  const onMove = e => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) dragged = true;
    tabs.scrollLeft = startScrollLeft - dx;
  };

  const onUp = () => {
    isDown = false;
  };

  tabs.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);

  // Evita clique acidental em botões depois de arrastar
  tabs.addEventListener('click', e => {
    if (!dragged) return;
    e.preventDefault();
    e.stopPropagation();
    dragged = false;
  }, true);
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
  
  // Usa imagem específica se existir, senão usa código, senão usa categoria
  const productCode = product.codigo || '';
  const specificImagePath = product.imagem ? `images/products/thumbnail/${product.imagem}` : `images/products/thumbnail/${productCode}.webp`;
  const catSlug = slugify(product.categoria || 'default');
  const categoryImagePath = `images/products/thumbnail/${catSlug}.webp`;
  
  // Para mobile: não usar srcset para evitar problemas
  const isMobile = window.innerWidth <= 768;
  
  if (isMobile) {
    // Mobile: usar apenas src simples
    img.src = specificImagePath;
    img.onerror = function() {
      this.onerror = null;
      this.src = categoryImagePath;
    };
  } else {
    // Desktop: usar srcset completo
    img.src = specificImagePath;
    img.onerror = function() {
      this.onerror = null;
      this.src = categoryImagePath;
    };
    
    // Define srcset baseado na imagem específica ou código
    if (product.imagem) {
      const baseName = product.imagem.replace('.webp', '');
      img.srcset = `${specificImagePath} 150w, images/products/medium/${baseName}.webp 400w, images/products/large/${baseName}.webp 800w`;
    } else {
      img.srcset = `${specificImagePath} 150w, images/products/medium/${productCode}.webp 400w, images/products/large/${productCode}.webp 800w`;
    }
    img.sizes = '(max-width: 900px) 86px, 110px';
  }

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

  // Filtra apenas produtos marcados como promoção
  const items = __allProducts.filter(p => p.promocao === true);
  const frag = document.createDocumentFragment();
  items.forEach(p => {
    frag.appendChild(createProductElement(p, 'promo'));
  });
  promoContainer.appendChild(frag);
  optimizeProductImages(promoContainer);
}


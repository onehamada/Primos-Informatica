// === Configurações ===
const CONFIG = {
  PAGE_SIZE: 30,
  CSV_CACHE_KEY: 'productsCsvCache:v8',
  CSV_CACHE_TTL: 30 * 60 * 1000,
  MAX_HIGHLIGHTS: 8,
  MAX_HOME_CATEGORIES: 8
};

// === Estado Global ===
let __allProducts = [];
let __categoryLabels = new Map();
let __categoryState = new Map();
let __cart = [];

// === Inicialização ===
document.addEventListener('DOMContentLoaded', async () => {
  try {
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

// === Carrinho Class ===
class Cart {
  constructor() {
    this.items = this.loadFromStorage();
    this.updateUI();
  }

  loadFromStorage() {
    try {
      return JSON.parse(localStorage.getItem('cart') || '[]');
    } catch {
      return [];
    }
  }

  saveToStorage() {
    localStorage.setItem('cart', JSON.stringify(this.items));
  }

  add(product) {
    const existing = this.items.find(item => item.codigo === product.codigo);
    if (existing) {
      existing.quantity++;
    } else {
      this.items.push({ ...product, quantity: 1 });
    }
    this.saveToStorage();
    this.updateUI();
  }

  remove(codigo) {
    this.items = this.items.filter(item => item.codigo !== codigo);
    this.saveToStorage();
    this.updateUI();
  }

  updateQuantity(codigo, quantity) {
    const item = this.items.find(item => item.codigo === codigo);
    if (item) {
      item.quantity = Math.max(1, quantity);
      this.saveToStorage();
      this.updateUI();
    }
  }

  clear() {
    this.items = [];
    this.saveToStorage();
    this.updateUI();
  }

  getTotal() {
    return this.items.reduce((total, item) => {
      const price = parseFloat(item.precoRaw || item.preco.replace(',', '.'));
      return total + (price * item.quantity);
    }, 0);
  }

  updateUI() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const cartCount = document.getElementById('cartCount');

    if (cartItems) {
      cartItems.innerHTML = this.items.map(item => {
        const price = parseFloat(item.precoRaw || item.preco.replace(',', '.'));
        return `
          <div class="cart-item">
            <img src="images/products/thumbnail/${item.imagem}" alt="${item.nome}" class="cart-item-image" onerror="this.src='images/products/thumbnail/default.webp'">
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

    if (cartTotal) {
      cartTotal.textContent = this.formatPrice(this.getTotal());
    }

    if (cartCount) {
      cartCount.textContent = this.items.reduce((sum, item) => sum + item.quantity, 0);
    }
  }

  formatPrice(value) {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }
}

const cart = new Cart();

// === Funções Globais ===
function toggleCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  
  sidebar.classList.toggle('active');
  overlay.classList.toggle('active');
  document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
}

function clearCart() {
  if (confirm('Tem certeza que deseja esvaziar o carrinho?')) {
    cart.clear();
  }
}

function showCheckoutOptions() {
  if (cart.items.length === 0) {
    alert('Seu carrinho está vazio!');
    return;
  }
  document.getElementById('checkoutModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  const modal = document.getElementById('checkoutModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function finalizeViaWhatsApp() {
  const message = cart.items.map(item => {
    const price = parseFloat(item.precoRaw || item.preco.replace(',', '.'));
    return `${item.nome} - R$ ${price.toFixed(2).replace('.', ',')} x ${item.quantity}`;
  }).join('\n');
  
  const total = cart.getTotal();
  const fullMessage = `🛒 *Pedido Primos Informática*\n\n${message}\n\n*Total: R$ ${total.toFixed(2).replace('.', ',')}*\n\nComo deseja finalizar?`;
  
  window.open(`https://wa.me/556133406740?text=${encodeURIComponent(fullMessage)}`, '_blank');
  closeCheckout();
}

function finalizeViaInstagram() {
  alert('Para finalizar via Instagram, envie uma DM para @primosinformaticadf com os itens do seu carrinho!');
  window.open('https://www.instagram.com/primosinformaticadf/', '_blank');
  closeCheckout();
}

function finalizeViaFacebook() {
  alert('Para finalizar via Facebook, envie uma mensagem para nossa página com os itens do seu carrinho!');
  window.open('https://www.facebook.com/primosinformaticadf/', '_blank');
  closeCheckout();
}

function finalizeViaEmail() {
  const message = cart.items.map(item => {
    const price = parseFloat(item.precoRaw || item.preco.replace(',', '.'));
    return `${item.nome} - R$ ${price.toFixed(2).replace('.', ',')} x ${item.quantity}`;
  }).join('\n');
  
  const total = cart.getTotal();
  const subject = 'Pedido Primos Informática';
  const body = `Gostaria de fazer o seguinte pedido:\n\n${message}\n\nTotal: R$ ${total.toFixed(2).replace('.', ',')}`;
  
  window.open(`mailto:marketing.primosinfo@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  closeCheckout();
}

function finalizePresential() {
  alert('Para retirada na loja, visite-nos em Asa Norte CLN 208 BL A LOJA 11, Brasília - DF, ou ligue (61) 3340-6740!');
  closeCheckout();
}

function addCartButtons() {
  const products = document.querySelectorAll('.product');
  products.forEach(product => {
    if (!product.querySelector('.add-to-cart-btn')) {
      const codigo = product.dataset.codigo || product.dataset.code;
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

// === CSV Functions ===
function parseCsvLine(line) {
  const parts = line.split(';').map(p => p.trim());
  if (parts.length < 8) return null;
  
  return {
    codigo: parts[0],
    nome: parts[1],
    categoria: parts[2],
    preco: parts[3],
    qt: parts[4],
    descricao: parts[5],
    marca: parts[6],
    promocao: parts[7] === 'sim',
    imagem: parts[8] || ''
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

    product.codigo = String(product.codigo).trim();
    product.nome = String(product.nome).trim();
    product.categoria = String(product.categoria).toLowerCase().trim();
    product.precoRaw = product.preco;
    product.preco = formatPrice(product.preco);

    products.push(product);
  }

  return products;
}

function readCsvCache() {
  try {
    const raw = localStorage.getItem(CONFIG.CSV_CACHE_KEY);
    if (!raw) return null;
    
    const cache = JSON.parse(raw);
    const now = Date.now();
    
    if (now - cache.timestamp > CONFIG.CSV_CACHE_TTL) {
      localStorage.removeItem(CONFIG.CSV_CACHE_KEY);
      return null;
    }
    
    return cache.data;
  } catch {
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
  } catch {
    console.warn('Não foi possível salvar cache CSV');
  }
}

async function loadProductsFromCsv() {
  const cachedData = readCsvCache();
  
  if (cachedData) {
    const products = parseCsv(cachedData);
    if (products.length) {
      applyProductsAndRender(products);
      refreshCacheInBackground();
      return;
    }
  }
  
  try {
    const response = await fetch('data/products.csv');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const text = await response.text();
    const products = parseCsv(text);
    
    if (products.length) {
      writeCsvCache(text);
      applyProductsAndRender(products);
    }
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
  }
}

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

// === Category Management ===
function limparCategoriasOrfas() {
  const categoriasCSV = new Set(__allProducts.map(p => p.categoria));
  const tabsContainer = document.querySelector('.tabs');
  
  if (!tabsContainer) return;
  
  const tabs = Array.from(tabsContainer.querySelectorAll('.tab-btn'));
  tabs.forEach(tab => {
    const target = tab.dataset.target;
    if (target && target !== 'inicio' && target !== 'promo' && !categoriasCSV.has(target)) {
      tab.remove();
    }
  });
}

function ensureCategoriesFromCsv() {
  const tabsContainer = document.querySelector('.tabs');
  if (!tabsContainer) return;

  limparCategoriasOrfas();

  __categoryLabels.forEach((label, id) => {
    if (document.querySelector(`[data-target="${id}"]`)) return;

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tab-btn';
    tab.dataset.target = id;
    tab.textContent = titleizeCategory(label);
    tab.addEventListener('click', () => showCategory(id));
    tabsContainer.appendChild(tab);

    let section = document.getElementById(id);
    if (!section) {
      section = document.createElement('div');
      section.id = id;
      section.className = 'category';
      section.style.display = 'none';
      section.innerHTML = `<h2>${titleizeCategory(label).toUpperCase()}</h2>`;
      document.querySelector('main').appendChild(section);
    }

    if (!__categoryState.has(id)) {
      const products = __allProducts.filter(p => p.categoria === id);
      if (products.length > 0) {
        __categoryState.set(id, {
          products: products.slice(0, CONFIG.PAGE_SIZE),
          hasMore: products.length > CONFIG.PAGE_SIZE
        });
      }
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

  const categories = Array.from(__categoryLabels.entries())
    .slice(0, CONFIG.MAX_HOME_CATEGORIES);

  categories.forEach(([id, label]) => {
    const products = __allProducts.filter(p => p.categoria === id);
    if (products.length === 0) return;

    const firstProduct = products[0];
    const div = document.createElement('div');
    div.className = 'category-card';
    div.innerHTML = `
      <img src="images/products/thumbnail/${firstProduct.imagem}" alt="${label}" onerror="this.src='images/products/thumbnail/default.webp'">
      <h3>${titleizeCategory(label)}</h3>
      <p>${products.length} produtos</p>
    `;
    div.onclick = () => showCategory(id);
    grid.appendChild(div);
  });

  optimizeProductImages(grid);
}

function populateHomeHighlights() {
  const grid = document.getElementById('home-highlights-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const highlights = __allProducts
    .filter(p => p.promocao)
    .slice(0, CONFIG.MAX_HIGHLIGHTS);

  if (highlights.length === 0) {
    const bestProducts = __allProducts.slice(0, CONFIG.MAX_HIGHLIGHTS);
    bestProducts.forEach(p => {
      grid.appendChild(createProductElement(p, 'promo'));
    });
  } else {
    highlights.forEach(p => {
      grid.appendChild(createProductElement(p, 'promo'));
    });
  }

  optimizeProductImages(grid);
}

function titleizeCategory(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

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

function showCategory(id) {
  document.querySelectorAll('.category').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  
  const target = document.getElementById(id);
  if (target) target.style.display = 'block';
  
  const btn = document.querySelector(`[data-target="${id}"]`);
  if (btn) btn.classList.add('active');
  
  if (id === 'promo') {
    populatePromo();
  } else if (__categoryState.has(id)) {
    renderCategory(id);
  } else {
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

// === Image Optimization ===
function preloadCriticalImages() {
  const criticalImages = [
    'images/logo.png',
    'images/products/thumbnail/rtx3060.webp',
    'images/products/thumbnail/gtx1660.webp'
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
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        imageObserver.unobserve(img);
      }
    });
  });

  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

function optimizeProductImages(container) {
  const productImages = container.querySelectorAll('.product img');
  productImages.forEach(img => {
    if (!img.hasAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
  });
}

// === Helpers ===
function formatPrice(value) {
  if (typeof value === 'number') return `R$ ${value.toFixed(2).replace('.', ',')}`;
  if (typeof value === 'string') {
    const num = parseFloat(value.replace(',', '.').replace(/[^\d.]/g, ''));
    return isNaN(num) ? 'R$ 0,00' : `R$ ${num.toFixed(2).replace('.', ',')}`;
  }
  return 'R$ 0,00';
}

function createProductElement(product, categoryId) {
  const div = document.createElement('div');
  div.className = 'product';
  div.dataset.codigo = product.codigo;
  div.dataset.code = product.codigo;

  const isMobile = window.innerWidth <= 768;
  const categoryImagePath = `images/products/thumbnail/default.webp`;
  const specificImagePath = `images/products/thumbnail/${product.imagem}`;

  const img = document.createElement('img');
  img.alt = product.nome;
  
  if (isMobile) {
    img.src = specificImagePath;
    img.onerror = function() {
      this.onerror = null;
      this.src = categoryImagePath;
    };
  } else {
    img.src = specificImagePath;
    img.onerror = function() {
      this.onerror = null;
      this.src = categoryImagePath;
    };
  }

  div.appendChild(img);

  const info = document.createElement('div');
  info.className = 'product-info';

  const name = document.createElement('h4');
  name.textContent = product.nome;
  info.appendChild(name);

  const price = document.createElement('div');
  price.className = 'price';
  price.textContent = product.preco;
  if (product.promocao) {
    price.classList.add('promocao');
  }
  info.appendChild(price);

  const addBtn = document.createElement('button');
  addBtn.className = 'add-to-cart-btn btn-primary';
  addBtn.textContent = 'Adicionar ao Carrinho';
  addBtn.onclick = () => cart.add(product);
  info.appendChild(addBtn);

  div.appendChild(info);
  return div;
}

function renderCategory(categoryId) {
  const container = document.getElementById(categoryId);
  if (!container) return;

  const state = __categoryState.get(categoryId);
  if (!state || !state.products.length) return;

  const existingProducts = container.querySelectorAll('.product');
  const existingCodes = new Set(Array.from(existingProducts).map(p => p.dataset.codigo));

  const frag = document.createDocumentFragment();
  state.products.forEach(product => {
    if (!existingCodes.has(product.codigo)) {
      frag.appendChild(createProductElement(product, categoryId));
    }
  });

  if (frag.children.length > 0) {
    const title = container.querySelector('h2');
    if (title) {
      title.parentNode.insertBefore(frag, title.nextSibling);
    } else {
      container.appendChild(frag);
    }
  }

  optimizeProductImages(container);
}

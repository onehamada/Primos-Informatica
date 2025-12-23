// Este arquivo é destinado a scripts JavaScript que podem ser usados para adicionar interatividade à loja, como funcionalidades de busca ou manipulação de produtos.

// === Inicialização ===
document.addEventListener('DOMContentLoaded', async () => {
  try {
    stripStaticProductsFromHtml();
    await loadProductsFromCsv();
    populatePromo();
    showCategory('inicio');
    optimizeProductImages(document);
    initTabsDragScroll();
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
  PAGE_SIZE: 30,
  CSV_CACHE_KEY: 'productsCsvCache:v1',
  CSV_CACHE_TTL: 10 * 60 * 1000, // 10 minutos
  MAX_HIGHLIGHTS: 6,
  MAX_HOME_CATEGORIES: 8
};

// === Estado Global ===
let __allProducts = [];
let __categoryState = new Map();
let __categoryLabels = new Map();
let currentCategory = null;
let searchAbortController = null;

// === Parsing do CSV ===
function parseCsvLine(line) {
  const parts = line.split(';').map(p => p.trim());
  if (parts.length < 5) return null;
  
  const [codigo, nome, categoria, preco, qt] = parts;
  if (!codigo || !nome || !categoria || !preco || qt === undefined) return null;
  
  const precoNum = parseFloat(preco.replace(',', '.'));
  const qtNum = parseInt(qt) || 0;
  if (isNaN(precoNum) || isNaN(qtNum)) return null;
  
  return {
    codigo: codigo.trim(),
    nome: nome.trim(),
    categoria: categoria.trim().toLowerCase(),
    preco: precoNum,
    qt: qtNum
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
    if (!raw) return '';
    const data = JSON.parse(raw);
    if (!data || typeof data.text !== 'string') return '';
    if (Date.now() - data.timestamp > CONFIG.CSV_CACHE_TTL) return '';
    return data.text;
  } catch (_) {
    return '';
  }
}

function writeCsvCache(text) {
  try {
    localStorage.setItem(CONFIG.CSV_CACHE_KEY, JSON.stringify({
      text,
      timestamp: Date.now()
    }));
  } catch (_) {}
}

function refreshCacheInBackground() {
  setTimeout(() => {
    fetch('data/products.csv')
      .then(r => r.text())
      .then(text => {
        const products = parseCsv(text);
        if (products.length) {
          applyProductsAndRender(products);
          writeCsvCache(text);
        }
      })
      .catch(() => {});
  }, CONFIG.CSV_CACHE_TTL);
}

// === Carregamento do CSV ===
function loadProductsFromCsv() {
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
function optimizeProductImages(container) {
  const imgs = container.querySelectorAll('img');
  imgs.forEach(img => {
    if (!img.src || img.src.includes('placeholder')) {
      const catSlug = slugify(img.dataset.category || 'default');
      img.src = `images/products/thumbnail/${catSlug}.webp`;
      img.srcset = `images/products/thumbnail/${catSlug}.webp 150w, images/products/medium/${catSlug}.webp 400w, images/products/large/${catSlug}.webp 800w`;
      img.sizes = '(max-width: 900px) 86px, 110px';
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
  img.width = 110;
  img.height = 110;
  img.loading = 'lazy';
  img.decoding = 'async';
  const catSlug = slugify(product.categoria || 'default');
  img.src = `images/products/thumbnail/${catSlug}.webp`;
  img.srcset = `images/products/thumbnail/${catSlug}.webp 150w, images/products/medium/${catSlug}.webp 400w, images/products/large/${catSlug}.webp 800w`;
  img.sizes = '(max-width: 900px) 86px, 110px';

  const info = document.createElement('div');
  info.className = 'product-info';

  const title = document.createElement('h4');
  
  // Adicionar quebra de linha específica após "RTX"
  let productName = product.nome || 'Produto';
  if (productName.includes('RTX')) {
    productName = productName.replace(/RTX/g, 'RTX<br>');
  }
  title.innerHTML = productName;

  const price = document.createElement('div');
  price.className = 'price';
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
  addBtn.className = 'add';
  addBtn.textContent = '+';
  addBtn.title = temEstoque ? 'Adicionar' : 'Produto esgotado';
  addBtn.disabled = !temEstoque;
  
  addBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (temEstoque) {
      alert(`Adicionado: ${product.nome}`);
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

  // Usa os produtos do CSV (primeiros 8 como destaques)
  const items = __allProducts.slice(0, 8);
  const frag = document.createDocumentFragment();
  items.forEach(p => {
    frag.appendChild(createProductElement(p, 'promo'));
  });
  promoContainer.appendChild(frag);
  optimizeProductImages(promoContainer);
}


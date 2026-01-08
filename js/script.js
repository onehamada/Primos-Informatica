// === FUNÇÃO PRINCIPAL - CATEGORIAS ===
function showCategory(category) {
  // Se for "inicio", mostrar a seção hero e esconder produtos
  if (category === 'inicio') {
    const inicioSection = document.getElementById('inicio');
    if (inicioSection) inicioSection.style.display = 'block';
    
    document.querySelectorAll('.products-section, .category').forEach(function(section) {
      if (section.id !== 'inicio') section.style.display = 'none';
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    document.getElementById('inicio').style.display = 'none';
    
    document.querySelectorAll('.products-section, .category').forEach(function(section) {
      section.style.display = 'none';
    });
    
    const targetSection = document.getElementById(category);
    if (targetSection) {
      targetSection.style.display = 'block';
      
      // Lazy loading das imagens da seção
      setTimeout(function() {
        const images = targetSection.querySelectorAll('img[data-src]');
        images.forEach(function(img) {
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
          }
        });
        
        const headerHeight = document.querySelector('header')?.offsetHeight || 0;
        const sectionTop = targetSection.offsetTop - headerHeight - 20;
        window.scrollTo({ top: sectionTop, behavior: 'smooth' });
      }, 100);
    }
  }
  
  // Atualizar botões active
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector('[data-target="' + category + '"]');
  if (activeBtn) activeBtn.classList.add('active');
  
  // Atualizar URL
  if (history.pushState) {
    history.pushState({}, '', window.location.pathname + '#' + category);
  }
}

// === CARREGAR PRODUTOS ===
let allProducts = [];

function loadProducts() {
  return fetch('data/products.csv')
    .then(response => response.text())
    .then(csvText => {
      const lines = csvText.split('\n');
      const headers = lines[0].split(';');
      
      allProducts = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = lines[i].split(';');
        const product = {};
        
        headers.forEach((header, index) => {
          product[header.trim()] = values[index]?.trim() || '';
        });
        
        allProducts.push(product);
      }
      
      displayProducts(allProducts);
    });
}

// === EXIBIR PRODUTOS ===
function displayProducts(products) {
  const categories = {};
  
  products.forEach(product => {
    const category = product.categoria || 'outros';
    if (!categories[category]) categories[category] = [];
    categories[category].push(product);
  });
  
  Object.keys(categories).forEach(category => {
    let section = document.getElementById(category);
    
    if (!section) {
      section = document.createElement('section');
      section.id = category;
      section.className = 'products-section';
      section.style.display = 'none';
      
      const heroSection = document.querySelector('.hero');
      const container = document.querySelector('.container');
      
      if (heroSection && container) {
        container.insertBefore(section, heroSection.nextSibling);
      } else if (container) {
        container.appendChild(section);
      }
    }
    
    const productsHTML = '<h2 class="section-title">' + 
      category.charAt(0).toUpperCase() + category.slice(1) + '</h2>' +
      '<div class="products-grid">' +
      categories[category].map(createProductCard).join('') +
      '</div>';
    
    section.innerHTML = productsHTML;
  });
}

// === CARD DE PRODUTO ===
function createProductCard(product) {
  const imageName = product.imagem || product.codigo + '.webp';
  const imagePath = 'images/products/thumbnail/' + imageName;
  const price = parseFloat(product.preco || '0');
  const formattedPrice = price.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
  
  return '<div class="product-card">' +
    '<div class="product-image">' +
    '<img data-src="' + imagePath + '" alt="' + product.nome + '" loading="lazy" onerror="this.src=\'images/placeholder.png\'">' +
    '</div>' +
    '<div class="product-info">' +
    '<h3>' + product.nome + '</h3>' +
    '<p class="price">' + formattedPrice + '</p>' +
    '<button class="btn-primary" onclick="addToCart(\'' + product.codigo + '\')">Adicionar</button>' +
    '</div>' +
    '</div>';
}

// === CARRINHO ===
let cart = [];

function addToCart(productCode) {
  const product = allProducts.find(p => p.codigo === productCode);
  if (!product) return;
  
  const existingItem = cart.find(item => item.codigo === productCode);
  
  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  
  console.log('Produto adicionado:', product.nome);
}

// === INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', function() {
  loadProducts().then(() => showCategory('inicio'));
  
  window.addEventListener('hashchange', function() {
    const hash = window.location.hash.substring(1) || 'inicio';
    showCategory(hash);
  });
});

// === COMANDOS GLOBAIS ===
window.showCategory = showCategory;
window.addToCart = addToCart;

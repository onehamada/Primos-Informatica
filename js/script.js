// === FUNÇÃO PRINCIPAL - CATEGORIAS ===
function showCategory(category) {
  // Limpar observer anterior
  if (window.currentObserver) {
    window.currentObserver.disconnect();
    window.currentObserver = null;
  }
  
  // Esconder todas as seções
  const sections = document.querySelectorAll('.products-section, .category');
  for (let i = 0; i < sections.length; i++) {
    sections[i].style.display = 'none';
  }
  
  // Mostrar seção alvo
  if (category === 'promo' || category === 'promoções') {
    // Criar seção de promoções dinamicamente
    showPromocoes();
  } else {
    const targetSection = document.getElementById(category);
    if (targetSection) {
      targetSection.style.display = 'block';
      
      // Lazy loading simplificado
      setTimeout(function() {
        loadImagesOnScroll(targetSection);
      }, 200);
    }
  }
  
  // Atualizar botões
  const buttons = document.querySelectorAll('.tab-btn');
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove('active');
  }
  
  const activeBtn = document.querySelector('[data-target="' + category + '"]');
  if (activeBtn) activeBtn.classList.add('active');
  
  // Atualizar URL
  history.pushState(null, null, '#' + category);
}

// === MOSTRAR PROMOÇÕES ===
function showPromocoes() {
  console.log('showPromocoes() chamada');
  
  // Verificar se seção já existe
  let promocoesSection = document.getElementById('promoções');
  
  if (!promocoesSection) {
    console.log('Criando seção de promoções');
    promocoesSection = document.createElement('section');
    promocoesSection.id = 'promoções';
    promocoesSection.className = 'products-section';
    
    const container = document.querySelector('.container');
    if (container) container.appendChild(promocoesSection);
  }
  
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
  let productsHTML = '<h2>Promoções</h2>';
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
  promocoesSection.style.display = 'block';
  
  console.log('Seção de promoções exibida');
  
  // Lazy loading para promoções
  setTimeout(function() {
    loadImagesOnScroll(promocoesSection);
  }, 200);
}

// === LAZY LOADING SIMPLIFICADO ===
function loadImagesOnScroll(container) {
  const images = container.querySelectorAll('img[data-src]');
  const loaded = [];
  
  function checkImages() {
    const windowHeight = window.innerHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (loaded.indexOf(img) !== -1) continue;
      
      const rect = img.getBoundingClientRect();
      const elemTop = rect.top + scrollTop;
      const elemBottom = rect.bottom + scrollTop;
      
      const isInViewport = elemTop < scrollTop + windowHeight + 200 && 
                          elemBottom > scrollTop - 200;
      
      if (isInViewport) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        loaded.push(img);
        
        // Adicionar classe para fade-in
        img.style.opacity = '0';
        setTimeout(function() {
          img.style.transition = 'opacity 0.3s ease';
          img.style.opacity = '1';
        }, 50);
      }
    }
    
    // Continuar verificando se ainda há imagens
    if (loaded.length < images.length) {
      setTimeout(checkImages, 100);
    }
  }
  
  // Verificar imediatamente
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
      
      const container = document.querySelector('.container');
      if (container) container.appendChild(section);
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
}

// === CARD DE PRODUTO ===
function createProductCard(product) {
  const imageName = product.imagem || product.codigo + '.webp';
  const imagePath = 'images/products/thumbnail/' + imageName;
  const price = parseFloat(product.preco || '0');
  const formattedPrice = 'R$ ' + price.toFixed(2).replace('.', ',');
  
  return '<div class="product-card">' +
    '<div class="product-image">' +
    '<div class="image-placeholder">📦</div>' +
    '<img data-src="' + imagePath + '" alt="' + product.nome + '">' +
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
  for (let i = 0; i < allProducts.length; i++) {
    if (allProducts[i].codigo === productCode) {
      cart.push({
        ...allProducts[i],
        quantity: 1
      });
      break;
    }
  }
}

// === INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', function() {
  loadProducts().then(function() {
    showCategory('inicio');
  });
  
  window.addEventListener('hashchange', function() {
    const hash = window.location.hash.substring(1) || 'inicio';
    showCategory(hash);
  });
});

// === COMANDOS GLOBAIS ===
window.showCategory = showCategory;
window.addToCart = addToCart;

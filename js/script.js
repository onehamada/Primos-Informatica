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
  
  // Lazy loading para promoções
  setTimeout(function() {
    loadImagesOnScroll(promocoesSection);
  }, 200);
}

// === LAZY LOADING MELHORADO ===
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
        // Encontrar o placeholder dentro do mesmo container
        const placeholder = img.parentElement.querySelector('.image-placeholder');
        
        // Configurar eventos de carregamento da imagem
        img.onload = function() {
          // Remover placeholder com animação suave
          if (placeholder) {
            placeholder.classList.add('hiding');
            setTimeout(function() {
              placeholder.remove();
            }, 300);
          }
          // Adicionar classe de carregado
          img.classList.add('loaded');
          console.log('✅ Imagem carregada e classe loaded adicionada:', img.src);
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
        };
        
        // Iniciar carregamento
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        loaded.push(img);
        
        // Adicionar classe para fade-in
        img.classList.add('loading');
      }
    }
    
    // Continuar verificando se ainda há imagens para carregar
    if (loaded.length < images.length) {
      requestAnimationFrame(checkImages);
    }
  }
  
  // Iniciar verificação
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

// === COMANDOS GLOBAIS ===
window.showCategory = showCategory;
window.addToCart = addToCart;

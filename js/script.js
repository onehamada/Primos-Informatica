// === CONTROLE DE SCROLL RESTORATION ===
// Impedir restauração automática de scroll do navegador
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

// === FORÇAR SCROLL NO TOPO AO CARREGAR ===
function forceScrollToTop() {
  // Forçar scroll imediato no topo (compatível com todos os navegadores)
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  
  // Garantir que não há scroll residual
  if (window.pageYOffset > 0 || document.documentElement.scrollTop > 0) {
    window.scrollTo(0, 0);
  }
  
  // Verificar se header sticky está causando deslocamento
  const header = document.querySelector('.modern-header');
  if (header && window.getComputedStyle(header).position === 'sticky') {
    // Garantir que o conteúdo não seja empurrado pelo header
    const mainContent = document.querySelector('main') || document.querySelector('.container') || document.body;
    if (mainContent && mainContent !== document.body) {
      const currentPadding = window.getComputedStyle(mainContent).paddingTop;
      if (parseInt(currentPadding) < 80) { // Se não há padding compensatório
        // Não adicionamos padding para evitar quebras de layout
        // Apenas garantimos o scroll no topo
      }
    }
  }
  
  // Verificação específica para mobile
  if (window.innerWidth <= 768) {
    // Mobile: garantir que não há scroll residual
    setTimeout(() => {
      if (window.pageYOffset > 0) {
        window.scrollTo(0, 0);
      }
    }, 50);
  }
  
  // Verificação específica para desktop
  if (window.innerWidth > 768) {
    // Desktop: scroll imediato e definitivo
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  }
}

// Executar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', forceScrollToTop);
} else {
  // DOM já está carregado
  forceScrollToTop();
}

// Também executar no window.onload para garantir
window.addEventListener('load', forceScrollToTop);

// === FUNÇÃO PRINCIPAL - CATEGORIAS ===
function showCategory(category) {
  // Limpar observer anterior
  if (window.currentObserver) {
    window.currentObserver.disconnect();
    window.currentObserver = null;
  }
  
  // Esconder todas as seções
  const sections = document.querySelectorAll('.products-section, .category, #promo, #inicio');
  for (let i = 0; i < sections.length; i++) {
    sections[i].style.display = 'none';
  }
  
  // Mostrar seção alvo
  if (category === 'promo' || category === 'promoções') {
    showPromocoes();
  } else if (category === 'inicio') {
    const homeSection = document.getElementById('inicio');
    if (homeSection) {
      homeSection.style.display = 'block';
      
      // Garantir que a home seja preenchida
      if (allProducts.length > 0) {
        populateHome();
      }
      
      // Lazy loading para imagens da home
      setTimeout(function() {
        const homeGrids = homeSection.querySelectorAll('.categories-grid, .products-grid');
        for (let i = 0; i < homeGrids.length; i++) {
          loadImagesOnScroll(homeGrids[i]);
        }
      }, 200);
    }
  } else {
    // Tentar encontrar seção por ID ou por categoria
    let targetSection = document.getElementById(category);
    
    // Se não encontrar por ID, procurar por categoria nos produtos
    if (!targetSection) {
      // Criar seção dinamicamente para a categoria
      targetSection = document.createElement('section');
      targetSection.id = category;
      targetSection.className = 'category';
      targetSection.style.display = 'none';
      
      const main = document.querySelector('main');
      if (main) {
        main.appendChild(targetSection);
      }
    }
    
    if (targetSection) {
      targetSection.style.display = 'block';
      
      // Preencher com produtos da categoria
      const categoryProducts = allProducts.filter(p => 
        p.categoria && p.categoria.toLowerCase() === category.toLowerCase()
      );
      
      if (categoryProducts.length > 0) {
        let productsHTML = '<h2>' + category.charAt(0).toUpperCase() + category.slice(1) + '</h2>';
        productsHTML += '<div class="products-grid">';
        
        for (let j = 0; j < categoryProducts.length; j++) {
          productsHTML += createProductCard(categoryProducts[j]);
        }
        
        productsHTML += '</div>';
        targetSection.innerHTML = productsHTML;
        
        // Lazy loading para imagens
        setTimeout(function() {
          loadImagesOnScroll(targetSection);
        }, 200);
      } else {
        targetSection.innerHTML = '<h2>' + category.charAt(0).toUpperCase() + category.slice(1) + '</h2><p style="text-align: center; padding: 40px; color: #666;">Nenhum produto encontrado nesta categoria.</p>';
      }
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
  // Usar a seção existente no HTML
  let promocoesSection = document.getElementById('promo');
  
  if (!promocoesSection) {
    return;
  }
  
  // Mostrar a seção
  promocoesSection.style.display = 'block';
  
  // Filtrar produtos em promoção
  const promocoesProducts = [];
  
  for (let i = 0; i < allProducts.length; i++) {
    if (allProducts[i].promocao === 'sim') {
      promocoesProducts.push(allProducts[i]);
    }
  }
  
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
  
  function checkImages() {
    const windowHeight = window.innerHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (loaded.indexOf(img) !== -1) continue;
      
      // Verificar se tem data-src válido E se ainda não foi carregada
      if (!img.dataset || !img.dataset.src || img.classList.contains('loaded') || img.classList.contains('loading')) {
        loaded.push(img);
        continue;
      }
      
      const rect = img.getBoundingClientRect();
      const elemTop = rect.top + scrollTop;
      const elemBottom = rect.bottom + scrollTop;
      
      const isInViewport = elemTop < scrollTop + windowHeight + 200 && 
                          elemBottom > scrollTop - 200;
      
      if (isInViewport) {
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
        };
        
        img.onerror = function() {
          // Tentar carregar imagem fallback
          if (img.dataset && img.dataset.src) {
            const fallbackSrc = img.dataset.src.replace(/\.webp$/i, '.jpg');
            if (fallbackSrc !== img.dataset.src) {
              img.src = fallbackSrc;
            } else {
              // Tentar fallback para placeholder genérico
              const genericFallback = 'images/products/thumbnail/placeholder.webp';
              if (genericFallback !== img.dataset.src) {
                img.src = genericFallback;
              } else {
                // Manter placeholder se todas as tentativas falharem
                if (placeholder) {
                  placeholder.textContent = '❌';
                  placeholder.style.opacity = '0.3';
                }
              }
            }
          } else {
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
  console.log('🚀 loadProducts() iniciada');
  return fetch('data/products.csv')
    .then(function(response) {
      console.log('📁 CSV response status:', response.status);
      if (!response.ok) {
        throw new Error('Erro ao carregar arquivo CSV: ' + response.statusText);
      }
      return response.text();
    })
    .then(function(csvText) {
      console.log('📄 CSV text carregado, tamanho:', csvText.length);
      const lines = csvText.split('\n');
      console.log('📊 Linhas no CSV:', lines.length);
      const headers = lines[0].split(';').map(h => h.trim());
      console.log('🏷️ Headers:', headers);
      
      const products = [];
      const productMap = {}; // Usar mapa para evitar duplicatas por código
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';').map(v => v.trim());
        
        if (values.length >= headers.length) {
          const product = {};
          headers.forEach((header, index) => {
            product[header] = values[index] || '';
          });
          
          // Garantir que todos os campos obrigatórios existam
          product.codigo = product.codigo || product.Código || '';
          product.nome = product.nome || product.Nome || '';
          product.preco = product.preco || product.Preço || '';
          product.categoria = product.categoria || product.Categoria || '';
          product.marca = product.marca || product.Marca || '';
          product.descricao = product.descricao || product.Descrição || '';
          product.imagem = product.imagem || product.Imagem || '';
          
          // Garantir que o código não seja vazio
          if (!product.codigo) {
            continue; // Pular produtos sem código
          }
          
          // Verificar se já existe produto com este código
          if (productMap[product.codigo]) {
            // Adicionar sufixo ao código para evitar duplicatas
            const originalCode = product.codigo;
            let suffix = 1;
            while (productMap[product.codigo + '_' + suffix]) {
              suffix++;
            }
            product.codigo = product.codigo + '_' + suffix;
          }
          
          productMap[product.codigo] = product;
          products.push(product);
        }
      }
      
      allProducts = products;
      return products;
    })
    .catch(function(error) {
      console.error('Erro ao carregar produtos:', error);
      return [];
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
  // Preencher categorias na home
  populateHomeCategories();
  
  // Preencher produtos em destaque na home
  populateHomeHighlights();
}

// === PREENCHER CATEGORIAS DA HOME ===
function populateHomeCategories() {
  const categoriesGrid = document.getElementById('home-categories-grid');
  if (!categoriesGrid) {
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
}

// === PREENCHER MENUS DE NAVEGAÇÃO DINAMICAMENTE ===
function populateNavigationMenus() {
  if (allProducts.length === 0) return;
  
  console.log('🔍 Debug: populateNavigationMenus iniciada');
  console.log('🔍 Debug: allProducts.length =', allProducts.length);
  
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
  
  const categoryNames = Object.keys(categories).sort();
  console.log('🔍 Debug: categoryNames encontradas =', categoryNames);
  console.log('🔍 Debug: número de categorias =', categoryNames.length);
  
  // Gerar HTML para as categorias (exceto as especiais)
  function generateCategoryButtons(closeMenu = false, isDesktop = false) {
    let html = '';
    for (let i = 0; i < categoryNames.length; i++) {
      const category = categoryNames[i];
      const displayName = category.charAt(0).toUpperCase() + category.slice(1);
      const closeMenuAction = closeMenu ? '; toggleMobileMenu()' : '';
      const buttonClass = isDesktop ? 'nav-tab' : 'mobile-nav-tab';
      
      // Mapear categorias para ícones apropriados
      const iconMap = {
        'monitor': '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>',
        'mouse': '<path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M19.07 13.93a7 7 0 0 1-6.14 0"></path><line x1="12" y1="8" x2="12.01" y2="8"></line>',
        'teclado': '<rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"></path>',
        'redes': '<path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M19.07 13.93a7 7 0 0 1-6.14 0"></path><line x1="12" y1="8" x2="12.01" y2="8"></line>',
        'processador': '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line>',
        'placa de vídeo': '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>',
        'placa mãe': '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>',
        'ssd': '<rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="6" x2="12.01" y2="6"></line>',
        'hd externo': '<ellipse cx="12" cy="12" rx="10" ry="3"></ellipse><path d="M2 12v6c0 1.66 4.48 3 10 3s10-1.34 10-3v-6"></path>',
        'hd interno': '<ellipse cx="12" cy="12" rx="10" ry="3"></ellipse><path d="M2 12v6c0 1.66 4.48 3 10 3s10-1.34 10-3v-6"></path>',
        'kit-teclado-mouse': '<rect x="2" y="4" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="6" rx="2" ry="2"></rect>',
        'access-point': '<path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M19.07 13.93a7 7 0 0 1-6.14 0"></path><line x1="12" y1="8" x2="12.01" y2="8"></line>',
        'repetidor': '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle>',
        'adaptador': '<rect x="2" y="7" width="20" height="10" rx="2" ry="2"></rect><path d="M8 12h.01M12 12h.01M16 12h.01"></path>',
        'audio': '<path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>',
        'acessorios': '<circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 1.54l4.24 4.24M20.46 20.46l-4.24-4.24M1.54 20.46l4.24-4.24"></path>',
        'cabos': '<path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3"></path><line x1="8" y1="12" x2="16" y2="12"></line>',
        'webcam': '<path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>',
        'fonte': '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>'
      };
      
      const icon = iconMap[category] || '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>';
      
      html += `
        <button type="button" class="${buttonClass}" data-target="${category}" onclick="showCategory('${category}')${closeMenuAction}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${icon}
          </svg>
          <span>${displayName}</span>
        </button>
      `;
    }
    return html;
  }
  
  console.log('🔍 Debug: HTML gerado para categorias desktop =', generateCategoryButtons(false, true));
  
  // Atualizar menu desktop (header-nav)
  const navTabs = document.querySelector('.nav-tabs');
  if (navTabs) {
    // Manter apenas Início e Promoções
    const staticHTML = `
      <button type="button" class="nav-tab active" data-target="inicio" onclick="showCategory('inicio')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span>Início</span>
      </button>
      
      <button type="button" class="nav-tab" data-target="promo" onclick="showCategory('promo')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
        </svg>
        <span>Promoções</span>
      </button>
    `;
    
    const finalHTML = staticHTML + generateCategoryButtons(false, true);
    console.log('🔍 Debug: HTML final do nav-tabs =', finalHTML);
    navTabs.innerHTML = finalHTML;
  }
  
  // Atualizar menu mobile (mobile-nav-tabs)
  const mobileNavTabs = document.querySelector('.mobile-nav-tabs');
  if (mobileNavTabs) {
    // Manter apenas Início e Promoções
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
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
        </svg>
        <span>Promoções</span>
      </button>
    `;
    
    mobileNavTabs.innerHTML = staticHTML + generateCategoryButtons(true);
  }
}

// === PREENCHER PRODUTOS EM DESTAQUE DA HOME ===
function populateHomeHighlights() {
  const highlightsGrid = document.getElementById('home-highlights-grid');
  if (!highlightsGrid) {
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
}

// === FUNÇÕES DE AVALIAÇÕES ===

// Variáveis globais para avaliações
let currentRating = 0;
let currentProductId = null;
let uploadedPhotos = [];

// Função para obter avaliações de um produto
function getProductReviews(productId) {
  try {
    // Tentar localStorage primeiro
    const storedReviews = localStorage.getItem('productReviews');
    let reviews = [];
    
    if (storedReviews) {
      reviews = JSON.parse(storedReviews);
    }
    
    // Filtrar avaliações do produto específico
    const productReviews = reviews.filter(review => review.productId === productId);
    
    return productReviews;
    
  } catch (error) {
    console.error('Erro ao carregar avaliações:', error);
    return [];
  }
}

// Função para calcular média de avaliações
function calculateAverageRating(reviews) {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return sum / reviews.length;
}

// Função para gerar estrelas
function generateStars(rating, productCode) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  let stars = '';
  
  for (let i = 0; i < fullStars; i++) {
    stars += `<span class="star filled" onclick="openReviewModal('${productCode}')" title="Clique para avaliar">★</span>`;
  }
  
  if (hasHalfStar && fullStars < 5) {
    stars += `<span class="star half-filled" onclick="openReviewModal('${productCode}')" title="Clique para avaliar">★</span>`;
  }
  
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    stars += `<span class="star" onclick="openReviewModal('${productCode}')" title="Clique para avaliar">☆</span>`;
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
    const stars = generateStars(review.rating, review.productId);
    
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
              <div class="review-date">${date}${review.edited ? ' (editado)' : ''}</div>
            </div>
          </div>
          <div class="review-rating">
            <div class="stars">${stars}</div>
            <span class="rating-number">${review.rating}.0</span>
          </div>
        </div>
        
        <div class="review-content">
          <h4>${review.title}${review.edited ? ' <span style="color: #f59e0b; font-size: 12px;">(editado)</span>' : ''}</h4>
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
  // currentProductId = null; // Não resetar para manter contexto
  
  const form = document.getElementById('reviewForm');
  if (form) {
    form.reset();
  }
  
  // Resetar estrelas
  const stars = document.querySelectorAll('.star-rating .star');
  stars.forEach(star => {
    star.textContent = '☆';
    star.classList.remove('filled');
  });
  
  // Limpar preview de fotos
  const photosPreview = document.getElementById('photosPreview');
  if (photosPreview) {
    photosPreview.innerHTML = '';
  }
  
  // Remover indicador de edição
  const editIndicator = form?.querySelector('.edit-indicator');
  if (editIndicator) {
    editIndicator.remove();
  }
  
  // Resetar botão e título
  const submitBtn = form?.querySelector('.submit-review-btn');
  const modalTitle = document.querySelector('#reviewModal h3');
  if (submitBtn) submitBtn.textContent = 'Enviar Avaliação';
  if (modalTitle) modalTitle.textContent = 'Avaliar Produto';
}

// Validação de formulário de avaliação
function validateReviewForm(data) {
  const errors = [];
  
  if (!data.rating || data.rating < 1 || data.rating > 5) {
    errors.push('Por favor, selecione uma avaliação de 1 a 5 estrelas');
  }
  
  if (!data.title || data.title.trim().length < 3) {
    errors.push('Título deve ter pelo menos 3 caracteres');
  }
  
  if (!data.text || data.text.trim().length < 10) {
    errors.push('Comentário deve ter pelo menos 10 caracteres');
  }
  
  if (data.text && data.text.length > 1000) {
    errors.push('Comentário deve ter no máximo 1000 caracteres');
  }
  
  return errors;
}

// Função para enviar avaliação
function submitReview(event) {
  console.log('🚀 submitReview chamada!');
  console.log('📋 Evento:', event);
  console.log('📋 currentProductId:', currentProductId);
  console.log('📋 currentRating:', currentRating);
  
  event.preventDefault();
  console.log('✅ preventDefault executado');
  
  const formData = new FormData(event.target);
  console.log('📋 FormData:', Object.fromEntries(formData));
  
  // Obter dados do formulário
  const reviewData = {
    rating: currentRating,
    title: formData.get('title') || '',
    text: formData.get('text') || ''
  };
  
  // Validar formulário
  const errors = validateReviewForm(reviewData);
  
  if (errors.length > 0) {
    console.log('❌ Formulário inválido, mostrando erros');
    showValidationErrors(errors, 'review-errors');
    return;
  } else {
    console.log('✅ Formulário válido, enviando avaliação...');
    
    // Adicionar dados adicionais ao reviewData existente
    reviewData.id = Date.now();
    reviewData.productId = currentProductId;
    reviewData.userEmail = 'anonimo@exemplo.com';
    reviewData.userName = 'Usuário Anônimo';
    reviewData.photos = uploadedPhotos;
    reviewData.date = new Date().toISOString();
    reviewData.helpful = 0;
    reviewData.edited = false;
    
    saveReview(reviewData);
    closeReviewModal();
    showSuccessMessage('Avaliação enviada com sucesso! Obrigado por seu feedback.');
    
    // Atualizar interface dinamicamente sem reload
    console.log('🔄 Atualizando interface dinamicamente...');
    forceUpdateReviewsDisplay(currentProductId);
  }
}

// Função para salvar avaliação no localStorage
function saveReview(reviewData) {
  try {
    let reviews = [];
    
    // Tentar carregar avaliações existentes
    const stored = localStorage.getItem('primos_reviews');
    if (stored) {
      try {
        reviews = JSON.parse(stored);
      } catch (e) {
        console.warn('Erro ao carregar avaliações existentes:', e);
        reviews = [];
      }
    }
    
    // Verificar se usuário já avaliou este produto (edição)
    const existingIndex = reviews.findIndex(review => 
      review.productId === reviewData.productId && review.userEmail === reviewData.userEmail
    );
    
    if (existingIndex !== -1) {
      // Atualizar avaliação existente
      reviews[existingIndex] = {
        ...reviews[existingIndex],
        ...reviewData,
        id: reviews[existingIndex].id, // Manter ID original
        edited: true,
        date: new Date().toISOString()
      };
      console.log('📝 Avaliação atualizada:', reviewData.productId);
    } else {
      // Adicionar nova avaliação
      reviews.push(reviewData);
      console.log('✅ Nova avaliação adicionada:', reviewData.productId);
    }
    
    // Salvar no localStorage
    localStorage.setItem('primos_reviews', JSON.stringify(reviews));
    
    // Verificar se salvou corretamente
    const verify = localStorage.getItem('primos_reviews');
    if (verify) {
      const verifyReviews = JSON.parse(verify);
      const found = verifyReviews.find(r => r.id === reviewData.id);
      if (found) {
        console.log('✅ Avaliação salva com sucesso:', reviewData.id);
        return true;
      } else {
        console.error('❌ Falha ao salvar avaliação');
        return false;
      }
    } else {
      console.error('❌ Falha ao acessar localStorage');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao salvar avaliação:', error);
    // Fallback para sessionStorage
    try {
      sessionStorage.setItem('temp_review', JSON.stringify(reviewData));
      console.log('💾 Avaliação salva em sessionStorage como fallback');
    } catch (e) {
      console.error('❌ Erro crítico - não foi possível salvar avaliação');
    }
    return false;
  }
}

// Função para forçar atualização das avaliações sem reload
function forceUpdateReviewsDisplay(productId) {
  console.log(`🔄 forceUpdateReviewsDisplay chamada para produto ${productId}`);
  
  try {
    // Pequeno delay para garantir que os dados foram salvos
    setTimeout(() => {
      // Atualizar seção de avaliações do produto
      const reviewsSection = document.getElementById(`reviews-${productId}`);
      console.log(`📋 reviewsSection encontrado:`, !!reviewsSection);
      
      if (reviewsSection) {
        const reviews = getProductReviews(productId);
        console.log(`📋 reviews carregadas:`, reviews.length, reviews);
        
        const reviewsHTML = generateReviewsHTML(reviews);
        console.log(`📋 reviewsHTML gerado:`, reviewsHTML.length, 'caracteres');
        
        // Encontrar o elemento correto para atualizar
        const reviewsList = document.getElementById(`reviews-list-${productId}`);
        console.log(`📋 reviewsList encontrado:`, !!reviewsList);
        
        if (reviewsList) {
          reviewsList.innerHTML = reviewsHTML;
          console.log(`✅ Avaliações do produto ${productId} atualizadas: ${reviews.length} avaliações`);
          
          // Verificar se o HTML foi realmente inserido
          setTimeout(() => {
            const finalHTML = reviewsList.innerHTML;
            console.log(`📋 HTML final no reviewsList:`, finalHTML.length, 'caracteres');
            console.log(`📋 Conteúdo final:`, finalHTML);
          }, 100);
        } else {
          console.log(`❌ reviewsList não encontrado para produto ${productId}`);
        }
      } else {
        console.log(`❌ reviewsSection não encontrado para produto ${productId}`);
      }
      
      // Atualizar card do produto com nova média
      updateProductCard(productId);
      
      // Se estiver na página de detalhes do produto, atualizar também
      if (typeof updateProductDetails === 'function') {
        updateProductDetails(productId);
      }
    }, 100); // Delay de 100ms
    
  } catch (error) {
    console.error('❌ Erro ao atualizar avaliações:', error);
    console.error('Stack:', error.stack);
    
    // Fallback: reload completo
    console.log('🔄 Usando fallback: reload completo');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
}

// Função para atualizar card específico do produto
function updateProductCard(productId) {
  try {
    // Encontrar todos os cards do produto
    const productCards = document.querySelectorAll(`[data-product-code="${productId}"]`);
    
    if (productCards.length > 0) {
      const reviews = getProductReviews(productId);
      const averageRating = calculateAverageRating(reviews);
      const reviewCount = reviews.length;
      
      // Atualizar cada card encontrado (geralmente só 1)
      productCards.forEach(card => {
        const ratingSummary = card.querySelector('.product-rating-summary');
        if (ratingSummary) {
          ratingSummary.innerHTML = `
            <div class="stars">${generateStars(averageRating, productId)}</div>
            <span class="rating-text">${averageRating.toFixed(1)} (${reviewCount})</span>
            <button class="review-btn" onclick="openReviewModal('${productId}')">Avaliar</button>
          `;
        }
      });
      
      console.log(`🔄 Card do produto ${productId} atualizado: média ${averageRating.toFixed(1)}, ${reviewCount} avaliações`);
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar card do produto:', error);
  }
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
    '<div class="stars">' + generateStars(averageRating, product.codigo) + '</div>' +
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
  if (cart.length === 0) {
    alert('Seu carrinho está vazio! Adicione produtos para continuar.');
    return;
  }

  // Gerar pedido automaticamente
  const pedido = generateOrder();
  
  let message = '🛒 *Pedido Primos Informática*\n\n';
  
  // Adicionar informações do pedido
  message += `*Pedido #${pedido.id}*\n`;
  message += `*Data:* ${new Date(pedido.data).toLocaleDateString('pt-BR')}\n`;
  message += `*Status:* ${getOrderStatusText(pedido.status)}\n\n`;
  
  // Adicionar itens do carrinho
  cart.forEach((item, index) => {
    // Corrigir tratamento de preço para preservar centavos
    const priceString = (item.preco || '0').toString().replace(',', '.');
    const price = parseFloat(priceString);
    
    message += `*${index + 1}. ${item.nome}*\n`;
    message += `   Quantidade: ${item.quantidade}\n`;
    message += `   Preço: R$ ${price.toFixed(2).replace('.', ',')}\n`;
  }, 0);
  
  message += `\n*Total: R$ ${pedido.total.toFixed(2).replace('.', ',')}*\n\n`;
  message += 'Gostaria de finalizar este pedido! 🛍️';
  
  // Abrir WhatsApp com a mensagem
  const whatsappUrl = `https://wa.me/556133406740?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
  
  // Fechar carrinho após enviar
  clearCart();
  toggleCart();
}

function generateOrder() {
  // Verificar se usuário está logado
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  if (!usuarioLogado) {
    // Se não está logado, gera pedido como visitante
    var pedido = {
      id: Date.now(),
      email: 'visitante@loja.com',
      nome: 'Visitante',
      data: new Date().toISOString(),
      status: 'pendente',
      total: calculateCartTotal(),
      itens: cart.map(item => ({
        codigo: item.codigo,
        nome: item.nome,
        quantidade: item.quantidade,
        preco: parseFloat((item.preco || '0').toString().replace(',', '.')),
        imagem: item.imagem || 'images/placeholder.png'
      }))
    };
  } else {
    // Se está logado, gera pedido com dados do usuário
    const usuario = JSON.parse(usuarioLogado);
    var pedido = {
      id: Date.now(),
      email: usuario.email,
      nome: usuario.nome,
      data: new Date().toISOString(),
      status: 'pendente',
      total: calculateCartTotal(),
      itens: cart.map(item => ({
        codigo: item.codigo,
        nome: item.nome,
        quantidade: item.quantidade,
        preco: parseFloat((item.preco || '0').toString().replace(',', '.')),
        imagem: item.imagem || 'images/placeholder.png'
      }))
    };
  }
  
  // Salvar pedido no localStorage
  let pedidos = JSON.parse(localStorage.getItem('pedidos') || '[]');
  pedidos.push(pedido);
  localStorage.setItem('pedidos', JSON.stringify(pedidos));
  
  console.log('📋 Pedido gerado:', pedido);
  console.log('📋 Total de pedidos:', pedidos.length);
  
  // Mostrar notificação de sucesso
  showNotification('Pedido gerado com sucesso! Você pode acompanhar em "Meus Pedidos".', 'success');
  
  return pedido;
}

function calculateCartTotal() {
  let total = 0;
  cart.forEach(item => {
    const priceString = (item.preco || '0').toString().replace(',', '.');
    const price = parseFloat(priceString);
    total += price * (item.quantidade || 1);
  });
  return total;
}

function getOrderStatusText(status) {
  const statusMap = {
    'pendente': 'Pendente',
    'confirmado': 'Confirmado',
    'preparando': 'Preparando',
    'enviado': 'Enviado',
    'entregue': 'Entregue',
    'cancelado': 'Cancelado'
  };
  return statusMap[status] || 'Pendente';
}

function showNotification(message, type = 'info') {
  // Remover notificações existentes
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // Criar notificação
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">
        ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
      </span>
      <span class="notification-text">${message}</span>
    </div>
  `;

  // Adicionar ao body
  document.body.appendChild(notification);

  // Animar entrada
  requestAnimationFrame(() => {
    notification.classList.add('show');
  });

  // Remover automaticamente após 4 segundos
  setTimeout(() => {
    notification.classList.add('hide');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 4000);
}

function toggleMobileMenu() {
  const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
  
  if (!mobileMenuOverlay) return;
  
  mobileMenuOverlay.classList.toggle('active');
  
  // Prevenir scroll no body quando menu está aberto
  if (mobileMenuOverlay.classList.contains('active')) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

function closeMobileMenu() {
  const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
  
  if (!mobileMenuOverlay) return;
  
  mobileMenuOverlay.classList.remove('active');
  document.body.style.overflow = '';
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
      
      setTimeout(() => {
        const productElement = document.querySelector(`[data-product-code="${productCode}"]`);
        if (productElement) {
          productElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          productElement.classList.add('search-highlight');
          
          // Remover destaque após 3 segundos
          setTimeout(() => {
            if (productElement) {
              productElement.classList.remove('search-highlight');
            }
          }, 3000);
        }
      }, 100);
      
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
  // Verificar se usuário está logado e atualizar UI
  checkAuthStatus();
  
  // Adicionar evento listener para estrelas de avaliação
  document.addEventListener('click', function(event) {
    if (event.target.classList.contains('star')) {
      const rating = parseInt(event.target.dataset.rating);
      if (rating && rating >= 1 && rating <= 5) {
        setRating(rating);
      }
    }
  });
  
  loadProducts().then(function() {
    console.log('✅ loadProducts() concluída com sucesso');
    // Preencher menus de navegação dinamicamente
    populateNavigationMenus();
    console.log('✅ populateNavigationMenus() executada');
    
    // Preencher home
    populateHome();
    console.log('✅ populateHome() executada');
    
    showCategory('inicio');
    console.log('✅ showCategory(inicio) executada');
  }).catch(function(error) {
    console.error('❌ Erro ao carregar produtos:', error);
    console.error('❌ Stack trace:', error.stack);
  });
  
  window.addEventListener('hashchange', function() {
    const hash = window.location.hash.substring(1) || 'inicio';
    showCategory(hash);
  });
  
  // Atualizar exibição do usuário ao redimensionar a tela
  let resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      checkAuthStatus();
    }, 250);
  });
});

// === FUNÇÕES DE AUTENTICAÇÃO ===

function checkAuthStatus() {
  console.log('🔍 checkAuthStatus() chamada');
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  const authBtn = document.querySelector('.auth-btn');
  const authText = document.querySelector('.auth-text');
  
  console.log('📊 Estado checkAuthStatus:', {
    usuarioLogado: !!usuarioLogado,
    authBtnEncontrado: !!authBtn,
    authBtnClasses: authBtn ? authBtn.className : 'not found',
    authBtnListeners: authBtn ? authBtn.onclick : 'no onclick'
  });
  
  if (!authBtn) {
    console.error('❌ Botão de autenticação não encontrado na página!');
    return;
  }
  
  // Limpar TODOS os eventos anteriores - remove e recria o botão
  const newAuthBtn = authBtn.cloneNode(true);
  authBtn.parentNode.replaceChild(newAuthBtn, authBtn);
  
  if (usuarioLogado) {
    // USUÁRIO LOGADO - Configurar para mostrar menu
    console.log('✅ Configurando botão para usuário logado');
    let usuario;
    try {
      usuario = JSON.parse(usuarioLogado);
    } catch (e) {
      console.error('❌ Erro ao parsear usuário:', e);
      localStorage.removeItem('usuarioLogado');
      checkAuthStatus(); // Recursivo para mostrar botão de login
      return;
    }
    
    // Configurar aparência do botão
    const userInitial = usuario.nome?.charAt(0).toUpperCase() || 'U';
    newAuthBtn.innerHTML = `
      <span class="user-initial" style="
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 18px !important;
        height: 18px !important;
        font-weight: 700 !important;
        font-size: 10px !important;
        color: white !important;
        text-transform: uppercase !important;
        background: rgba(255, 255, 255, 0.4) !important;
        border-radius: 50% !important;
      ">${userInitial}</span>
    `;
    newAuthBtn.title = `${usuario.nome} (${usuario.email})`;
    newAuthBtn.classList.add('logged-in');
    
    // Esconder texto
    if (authText) {
      authText.style.display = 'none';
    }
    
    // ADICIONAR EVENTO CORRETO - Mostrar menu
    newAuthBtn.addEventListener('click', function(e) {
      console.log('👤 Botão de usuário logado clicado - evento addEventListener');
      e.preventDefault();
      e.stopPropagation();
      showUserMenu();
    });
    
    console.log('✅ Botão de perfil configurado com sucesso');
    
  } else {
    // USUÁRIO NÃO LOGADO - Configurar para redirecionar
    console.log('🔓 Configurando botão para usuário não logado');
    // Restaurar aparência original
    newAuthBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
      <span class="auth-text">Faça Login/Cadastre</span>
    `;
    newAuthBtn.classList.remove('logged-in');
    newAuthBtn.title = 'Faça Login / Cadastre-se';
    
    // Mostrar texto
    if (authText) {
      authText.style.display = 'inline';
    }
    
    // ADICIONAR EVENTO CORRETO - Redirecionar para login
    newAuthBtn.addEventListener('click', function(e) {
      console.log('🔓 Botão de login clicado - evento addEventListener');
      console.log('🔍 e.target:', e.target);
      console.log('🔍 e.currentTarget:', e.currentTarget);
      console.log('🔍 newAuthBtn === e.currentTarget:', newAuthBtn === e.currentTarget);
      console.log('🔍 Vai redirecionar para auth.html');
      e.preventDefault();
      e.stopPropagation();
      console.log('🔓 Executando window.location.href = "auth.html"');
      window.location.href = 'auth.html';
    });
    
    console.log('✅ Botão de login configurado com sucesso');
  }
}

// Função para mostrar menu do usuário
function showUserMenu() {
  // Fechar menu existente primeiro
  closeUserMenu();
  
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  
  if (!usuarioLogado) {
    return;
  }
  
  let usuario;
  try {
    usuario = JSON.parse(usuarioLogado);
  } catch (e) {
    return;
  }
  
  // Criar overlay
  const overlay = document.createElement('div');
  overlay.id = 'user-menu-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  `;
  
  // Criar menu
  const menu = document.createElement('div');
  menu.style.cssText = `
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    padding: 24px;
    width: 100%;
    max-width: 350px;
    max-height: 90vh;
    overflow-y: auto;
    transform: translateY(-20px);
    opacity: 0;
    transition: all 0.3s ease;
    position: relative;
    z-index: 10001;
    -webkit-overflow-scrolling: touch;
  `;
  
  menu.innerHTML = `
    <div class="user-menu-header" style="text-align: center; margin-bottom: 20px;">
      <div style="
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 24px;
        font-weight: bold;
        margin: 0 auto 15px;
        flex-shrink: 0;
        aspect-ratio: 1;
      ">
        ${usuario.nome.charAt(0).toUpperCase()}
      </div>
      <h3 style="margin: 0 0 5px; color: #333; font-size: 18px; word-wrap: break-word;">
        ${usuario.nome}
      </h3>
      <p style="margin: 0; color: #666; font-size: 14px; word-wrap: break-word; overflow-wrap: break-word; word-break: break-all; max-width: 100%;">
        ${usuario.email}
      </p>
    </div>
    
    <div class="user-menu-actions" style="display: flex; flex-direction: column; gap: 4px;">
      <button onclick="viewProfile()" style="
        width: 100%;
        padding: 14px 16px;
        background: transparent;
        border: none;
        border-radius: 10px;
        text-align: left;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: all 0.2s ease;
        color: #333;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span style="overflow: hidden; text-overflow: ellipsis;">Meu Perfil</span>
      </button>
      
      ${isAdmin() ? `
      <button onclick="viewMyProducts()" style="
        width: 100%;
        padding: 14px 16px;
        background: transparent;
        border: none;
        border-radius: 10px;
        text-align: left;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: all 0.2s ease;
        color: #333;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
        </svg>
        <span style="overflow: hidden; text-overflow: ellipsis;">Meus Produtos</span>
      </button>
      ` : ''}
      
      <button onclick="viewMyReviews()" style="
        width: 100%;
        padding: 14px 16px;
        background: transparent;
        border: none;
        border-radius: 10px;
        text-align: left;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: all 0.2s ease;
        color: #333;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
        </svg>
        <span style="overflow: hidden; text-overflow: ellipsis;">Minhas Avaliações</span>
      </button>
      
      <button onclick="viewOrders()" style="
        width: 100%;
        padding: 14px 16px;
        background: transparent;
        border: none;
        border-radius: 10px;
        text-align: left;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: all 0.2s ease;
        color: #333;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14,2 14,8 20,8"></polyline>
        </svg>
        <span style="overflow: hidden; text-overflow: ellipsis;">Meus Pedidos</span>
      </button>
      
      <button onclick="viewSettings()" style="
        width: 100%;
        padding: 14px 16px;
        background: transparent;
        border: none;
        border-radius: 10px;
        text-align: left;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: all 0.2s ease;
        color: #333;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 9.96l4.24 4.24M20.46 14.04l-4.24 4.24M7.78 7.78L3.54 3.54"></path>
        </svg>
        <span style="overflow: hidden; text-overflow: ellipsis;">Configurações</span>
      </button>
      
      <button onclick="logout()" style="
        width: 100%;
        padding: 14px 16px;
        background: transparent;
        border: none;
        border-radius: 10px;
        text-align: left;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: all 0.2s ease;
        color: #ef4444;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: 8px;
        border-top: 1px solid #e5e7eb;
        padding-top: 20px;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16,17 21,12 16,7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <span style="overflow: hidden; text-overflow: ellipsis;">Sair</span>
      </button>
    </div>
  `;
  
  // Adicionar hover effects
  const buttons = menu.querySelectorAll('button');
  buttons.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#f3f4f6';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'transparent';
    });
  });
  
  overlay.appendChild(menu);
  document.body.appendChild(overlay);
  
  // Animar entrada
  setTimeout(() => {
    menu.style.transform = 'translateY(0)';
    menu.style.opacity = '1';
  }, 10);
  
  // Fechar ao clicar no overlay
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeUserMenu();
    }
  });
  
  // Fechar ao pressionar ESC
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeUserMenu();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

// Função para fechar menu do usuário
function closeUserMenu() {
  const overlay = document.querySelector('#user-menu-overlay');
  if (overlay) {
    overlay.remove();
  }
}

// REMOVIDO: Função viewProfile() antiga - substituída pela nova versão no final do arquivo

// Função para fechar overlay de perfil
function closeProfileOverlay() {
  const overlay = document.querySelector('#profile-overlay');
  if (overlay) {
    overlay.remove();
  }
}

function viewMyProducts() {
  closeUserMenu();
}

// Funções de ação do perfil
function editProfile() {
  console.log('✏️ Editar perfil - Em desenvolvimento');
}

function changePassword() {
  console.log('🔒 Alterar senha - Em desenvolvimento');
}

// Função de logout
function logout() {
  localStorage.removeItem('usuarioLogado');
  window.location.reload();
}

// Função de teste para verificar se o botão está funcionando
function testAuthButton() {
  const authBtn = document.querySelector('.auth-btn');
  if (authBtn) {
    console.log('🧪 Testando botão de autenticação...');
    console.log('📍 Posição:', authBtn.getBoundingClientRect());
    console.log('🎨 Estilos:', window.getComputedStyle(authBtn));
    console.log('👆 Visível:', authBtn.offsetParent !== null);
    
    // Simular clique
    authBtn.click();
  } else {
    console.error('❌ Botão não encontrado para teste!');
  }
}

/*
// Função para mostrar menu do usuário (ANTIGA - COMENTADA)
function showUserMenu(usuario) {
  console.log('🚀 showUserMenu chamada com usuário:', usuario);
  
  // Remover menus existentes para evitar duplicação
  const existingMenus = document.querySelectorAll('.user-menu');
  existingMenus.forEach(menu => menu.remove());
  
  // Verificar se o botão de autenticação existe
  const authBtn = document.querySelector('.auth-btn');
  if (!authBtn) {
    console.error('❌ Botão de autenticação não encontrado');
    return;
  }
  
  // Criar menu do usuário
  const userMenu = document.createElement('div');
  userMenu.className = 'user-menu';
  
  // Estrutura do menu
  userMenu.innerHTML = `
    <div class="user-menu-header">
      <div class="user-avatar">${usuario.nome.charAt(0).toUpperCase()}</div>
      <div class="user-info">
        <div class="user-name">${usuario.nome}</div>
        <div class="user-email">${usuario.email}</div>
      </div>
    </div>
    <div class="user-menu-actions">
      <button class="user-menu-btn" onclick="viewProfile()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        Meu Perfil
      </button>
      <button class="user-menu-btn" onclick="viewMyProducts()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
        Meus Produtos
      </button>
      <button class="user-menu-btn" onclick="viewMyReviews()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
        </svg>
        Minhas Avaliações
      </button>
      <button class="user-menu-btn" onclick="viewOrders()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14,2 14,8 20,8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10,9 9,9 8,9"></polyline>
        </svg>
        Meus Pedidos
      </button>
      <button class="user-menu-btn" onclick="viewSettings()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 9.96l4.24 4.24M20.46 14.04l-4.24 4.24M7.78 7.78L3.54 3.54"></path>
        </svg>
        Configurações
      </button>
      <button class="user-menu-btn logout" onclick="logout()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16,17 21,12 16,7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        Sair
      </button>
    </div>
  `;
  
  // Garantir posicionamento correto
  const parent = authBtn.parentNode;
  const parentStyle = window.getComputedStyle(parent);
  if (parentStyle.position === 'static') {
    parent.style.position = 'relative';
  }
  
  // Adicionar menu ao DOM
  parent.appendChild(userMenu);
  
  // Adicionar classe active para animação suave (no próximo frame)
  requestAnimationFrame(() => {
    userMenu.classList.add('active');
  });
  
  // Configurar fechamento automático imediatamente
  // Fechar menu ao clicar fora
  document.addEventListener('click', closeUserMenuHandler);
  
  // Fechar menu ao pressionar ESC
  document.addEventListener('keydown', closeUserMenuKeyHandler);
  
  console.log('✅ Menu do usuário exibido com sucesso');
}
*/

// === FUNÇÕES ANTIGAS DO MENU (COMENTADAS - USANDO ProfileMenuManager) ===

/*
// Funções auxiliares para o menu do usuário
function closeUserMenuHandler(e) {
  const authBtn = document.querySelector('.auth-btn');
  const userMenu = document.querySelector('.user-menu');
  
  if (!authBtn || !userMenu) return;
  
  const clickedOnBtn = authBtn.contains(e.target);
  const clickedOnMenu = userMenu.contains(e.target);
  
  if (!clickedOnBtn && !clickedOnMenu) {
    userMenu.remove();
    document.removeEventListener('click', closeUserMenuHandler);
    document.removeEventListener('keydown', closeUserMenuKeyHandler);
  }
}

function closeUserMenuKeyHandler(e) {
  if (e.key === 'Escape') {
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
      userMenu.remove();
      document.removeEventListener('click', closeUserMenuHandler);
      document.removeEventListener('keydown', closeUserMenuKeyHandler);
    }
  }
}
*/

// Função de logout (mantida - usada pelo ProfileMenuManager)
function logout() {
  localStorage.removeItem('usuarioLogado');
  window.location.reload();
}

// === FUNÇÕES DE TESTE PARA AUTENTICAÇÃO ===

// Função para testar estado atual de autenticação
window.testAuthStatus = function() {
  console.log('🧪 Testando status de autenticação na página inicial...');
  
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  const authBtn = document.querySelector('.auth-btn');
  
  console.log('📊 Estado atual:', {
    usuarioLogado: !!usuarioLogado,
    usuarioData: usuarioLogado ? JSON.parse(usuarioLogado) : null,
    authBtnExists: !!authBtn,
    authBtnClasses: authBtn ? authBtn.className : 'not found',
    authBtnContent: authBtn ? authBtn.innerHTML : 'not found',
    isMobile: window.innerWidth <= 768
  });
  
  if (usuarioLogado) {
    console.log('✅ Usuário está logado - botão deve mostrar nome/inicial');
  } else {
    console.log('✅ Usuário não está logado - botão deve mostrar "Entrar / Cadastrar"');
  }
};

// Função para simular login na página inicial
window.simulateLoginOnIndex = function(nome = 'João Silva', email = 'joao@teste.com') {
  console.log('🧪 Simulando login na página inicial...');
  
  const usuario = {
    nome: nome,
    email: email,
    dataCadastro: new Date().toISOString()
  };
  
  localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
  console.log('✅ Usuário salvo no localStorage:', usuario);
  
  // Atualizar a UI
  checkAuthStatus();
  console.log('✅ UI atualizada - botão deve mostrar nome do usuário');
};

// Função para simular logout na página inicial
window.simulateLogoutOnIndex = function() {
  console.log('🧪 Simulando logout na página inicial...');
  
  localStorage.removeItem('usuarioLogado');
  console.log('✅ Usuário removido do localStorage');
  
  // Atualizar a UI
  checkAuthStatus();
  console.log('✅ UI atualizada - botão deve mostrar "Entrar / Cadastrar"');
};

// Função para testar responsividade do botão
window.testAuthButtonResponsiveness = function() {
  console.log('🧪 Testando responsividade do botão de autenticação...');
  
  const originalWidth = window.innerWidth;
  
  // Simular diferentes tamanhos de tela
  const testSizes = [320, 480, 768, 1024, 1200];
  
  testSizes.forEach(width => {
    console.log(`📱 Testando tela de ${width}px...`);
    
    // Simular mudança de tamanho (apenas para teste)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width
    });
    
    // Atualizar exibição
    checkAuthStatus();
    
    // Verificar resultado
    const authBtn = document.querySelector('.auth-btn');
    const isMobile = width <= 768;
    
    console.log(`  ${width}px: ${isMobile ? 'Mobile' : 'Desktop'} - ${authBtn ? authBtn.innerHTML : 'Botão não encontrado'}`);
  });
  
  // Restaurar tamanho original
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: originalWidth
  });
  
  checkAuthStatus();
  console.log('✅ Teste de responsividade concluído');
};

// Função para testar o menu do usuário
window.testUserMenu = function() {
  console.log('🧪 Testando menu do usuário...');
  
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  if (!usuarioLogado) {
    console.log('❌ Usuário não está logado. Use simulateLoginOnIndex() primeiro.');
    return;
  }
  
  const usuario = JSON.parse(usuarioLogado);
  const authBtn = document.querySelector('.auth-btn');
  
  if (!authBtn) {
    console.log('❌ Botão de autenticação não encontrado');
    return;
  }
  
  console.log('👤 Usuário logado:', usuario);
  console.log('🖱️ Simulando clique no botão de perfil...');
  
  // Simular clique
  authBtn.click();
  
  // Verificar se menu apareceu
  setTimeout(() => {
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
      console.log('✅ Menu apareceu com sucesso');
      console.log('📋 Opções disponíveis:');
      
      const buttons = userMenu.querySelectorAll('.user-menu-btn');
      buttons.forEach((btn, index) => {
        console.log(`  ${index + 1}. ${btn.textContent.trim()}`);
      });
      
      // Testar fechamento do menu
      setTimeout(() => {
        console.log('🖱️ Simulando clique fora para fechar...');
        document.body.click();
        
        setTimeout(() => {
          const menuStillExists = document.querySelector('.user-menu');
          if (!menuStillExists) {
            console.log('✅ Menu fechado com sucesso');
          } else {
            console.log('❌ Menu não fechou');
          }
        }, 100);
      }, 2000);
    } else {
      console.log('❌ Menu não apareceu');
    }
  }, 100);
};

// Função de teste extremamente simples para isolar o problema
window.forceShowMenu = function() {
  console.log('🔧 FORÇAR MENU - TESTE ISOLADO');
  
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  if (!usuarioLogado) {
    console.log('❌ Usuário não está logado');
    return;
  }
  
  const usuario = JSON.parse(usuarioLogado);
  console.log('👤 Usuário:', usuario);
  
  const authBtn = document.querySelector('.auth-btn');
  if (!authBtn) {
    console.log('❌ Botão não encontrado');
    return;
  }
  
  console.log('✅ Botão encontrado:', authBtn);
  
  // Remover qualquer menu existente
  const existingMenu = document.querySelector('.user-menu');
  if (existingMenu) {
    console.log('🔄 Removendo menu existente...');
    existingMenu.remove();
  }
  
  // Criar menu com estilos inline forçados
  const userMenu = document.createElement('div');
  userMenu.innerHTML = `
    <div style="background: white !important; border: 2px solid red !important; padding: 20px !important; border-radius: 8px !important; position: absolute !important; top: 100% !important; right: 0 !important; z-index: 999999 !important; min-width: 250px !important; box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;">
      <h3 style="margin: 0 0 10px 0 !important; color: #333 !important;">${usuario.nome}</h3>
      <p style="margin: 0 0 5px 0 !important; color: #666 !important;">${usuario.email}</p>
      <hr style="margin: 10px 0 !important; border: 1px solid #eee !important;">
      <button onclick="alert('Meu Perfil')" style="display: block !important; width: 100% !important; padding: 10px !important; margin: 5px 0 !important; background: #f5f5f5 !important; border: 1px solid #ddd !important; cursor: pointer !important;">Meu Perfil</button>
      <button onclick="alert('Meus Pedidos')" style="display: block !important; width: 100% !important; padding: 10px !important; margin: 5px 0 !important; background: #f5f5f5 !important; border: 1px solid #ddd !important; cursor: pointer !important;">Meus Pedidos</button>
      <button onclick="alert('Sair')" style="display: block !important; width: 100% !important; padding: 10px !important; margin: 15px 0 0 !important; background: #ff4444 !important; border: 1px solid #cc0000 !important; color: white !important; cursor: pointer !important;">Sair</button>
    </div>
  `;
  
  // Adicionar diretamente ao body para evitar problemas de posicionamento
  document.body.appendChild(userMenu);
  
  console.log('✅ Menu forçado adicionado ao body');
  console.log('🔧 Menu deve estar visível com borda vermelha');
  
  // Adicionar botão para fechar
  setTimeout(() => {
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = 'FECHAR MENU';
    closeBtn.style.cssText = 'position: fixed !important; top: 10px !important; right: 10px !important; z-index: 999999 !important; background: red !important; color: white !important; padding: 10px !important; border: none !important; cursor: pointer !important;';
    closeBtn.onclick = function() {
      userMenu.remove();
      closeBtn.remove();
    };
    document.body.appendChild(closeBtn);
    console.log('✅ Botão de fechar adicionado');
  }, 100);
};

// Função de diagnóstico completo para o menu
window.diagnoseUserMenu = function() {
  console.log('🔍 Iniciando diagnóstico completo do menu do usuário...');
  
  // 1. Verificar se usuário está logado
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  console.log('👤 Usuário logado:', !!usuarioLogado);
  
  if (!usuarioLogado) {
    console.log('❌ Usuário não está logado. Execute simulateLoginOnIndex() primeiro.');
    return;
  }
  
  // 2. Verificar botão de autenticação
  const authBtn = document.querySelector('.auth-btn');
  console.log('🔘 Botão de autenticação:', !!authBtn);
  
  if (!authBtn) {
    console.log('❌ Botão de autenticação não encontrado');
    return;
  }
  
  // 3. Verificar estado do botão
  console.log('📊 Estado do botão:');
  console.log('  Classes:', authBtn.className);
  console.log('  HTML:', authBtn.innerHTML);
  console.log('  Estilos:', window.getComputedStyle(authBtn));
  
  // 4. Verificar elemento pai
  const parent = authBtn.parentNode;
  console.log('👨‍👩‍👧‍👦 Elemento pai:', parent);
  console.log('  Classes do pai:', parent.className);
  console.log('  Position do pai:', window.getComputedStyle(parent).position);
  
  // 5. Verificar menu existente
  const existingMenu = document.querySelector('.user-menu');
  console.log('📋 Menu existente:', !!existingMenu);
  
  if (existingMenu) {
    console.log('  Removendo menu existente...');
    existingMenu.remove();
  }
  
  // 6. Criar e adicionar menu manualmente
  console.log('� Criando menu manualmente...');
  const usuario = JSON.parse(usuarioLogado);
  
  const userMenu = document.createElement('div');
  userMenu.className = 'user-menu';
  userMenu.style.cssText = `
    position: absolute !important;
    top: 100% !important;
    right: 0 !important;
    background: white !important;
    border: 1px solid #ccc !important;
    border-radius: 8px !important;
    padding: 10px !important;
    min-width: 200px !important;
    z-index: 99999 !important;
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
  `;
  
  userMenu.innerHTML = `
    <div style="padding: 5px; border-bottom: 1px solid #eee; margin-bottom: 5px;">
      <strong>${usuario.nome}</strong><br>
      <small style="color: #666;">${usuario.email}</small>
    </div>
    <button onclick="alert('Teste - Meu Perfil')" style="display: block; width: 100%; padding: 8px; border: none; background: #f5f5f5; cursor: pointer; text-align: left; margin-bottom: 2px;">
      Meu Perfil
    </button>
    <button onclick="alert('Teste - Sair')" style="display: block; width: 100%; padding: 8px; border: none; background: #f5f5f5; cursor: pointer; text-align: left; color: red;">
      Sair
    </button>
  `;
  
  // Garantir que o pai tenha position relative
  if (window.getComputedStyle(parent).position === 'static') {
    parent.style.position = 'relative';
    console.log('✅ Ajustado position do pai para relative');
  }
  
  // Adicionar menu
  parent.appendChild(userMenu);
  console.log('✅ Menu adicionado manualmente');
  
  // 7. Verificar se menu está visível
  setTimeout(() => {
    const rect = userMenu.getBoundingClientRect();
    console.log('📏 Posição do menu:');
    console.log('  Top:', rect.top);
    console.log('  Left:', rect.left);
    console.log('  Width:', rect.width);
    console.log('  Height:', rect.height);
    console.log('  Visible:', rect.width > 0 && rect.height > 0);
    console.log('  Na viewport:', rect.top >= 0 && rect.left >= 0);
    
    // 8. Testar clique no menu
    const buttons = userMenu.querySelectorAll('button');
    console.log('🔘 Botões no menu:', buttons.length);
    
    buttons.forEach((btn, index) => {
      console.log(`  Botão ${index + 1}:`, btn.textContent.trim());
    });
    
    console.log('✅ Diagnóstico concluído. Menu deve estar visível.');
  }, 100);
};

// Função para limpar dados corrompidos do localStorage
window.clearCorruptedAuthData = function() {
  console.log('🧹 Limpando dados de autenticação corrompidos...');
  
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  console.log('📝 Dado atual:', usuarioLogado);
  
  if (usuarioLogado) {
    try {
      // Tentar parsear para verificar se está válido
      JSON.parse(usuarioLogado);
      console.log('✅ Dado está válido, não precisa limpar');
    } catch (e) {
      console.log('❌ Dado corrompido detectado, limpando...');
      localStorage.removeItem('usuarioLogado');
      console.log('✅ Dado removido. Faça login novamente.');
    }
  } else {
    console.log('ℹ️ Nenhum dado de autenticação encontrado');
  }
};

// Função para reparar dados do usuário
window.repairUserData = function() {
  console.log('🔧 Tentando reparar dados do usuário...');
  
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  if (!usuarioLogado) {
    console.log('❌ Nenhum dado encontrado para reparar');
    return;
  }
  
  try {
    // Tentar parsear
    const usuario = JSON.parse(usuarioLogado);
    
    // Verificar se tem campos essenciais
    if (!usuario.nome || !usuario.email) {
      throw new Error('Campos essenciais ausentes');
    }
    
    console.log('✅ Dado válido:', usuario);
    
    // Salvar versão limpa
    localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
    console.log('✅ Dado reparado e salvo');
    
  } catch (e) {
    console.log('❌ Erro ao reparar:', e);
    
    // Tentar extrair informações válidas
    const emailMatch = usuarioLogado.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    let email, nome;
    
    if (emailMatch) {
      email = emailMatch[1];
      nome = email.split('@')[0];
    } else {
      // Usar o que for possível
      nome = usuarioLogado.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 20) || 'Usuário';
      email = `${nome.toLowerCase().replace(/\s/g, '.')}@exemplo.com`;
    }
    
    const usuarioReparado = { nome, email };
    console.log('🔄 Usuário reparado:', usuarioReparado);
    
    // Salvar versão reparada
    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioReparado));
    console.log('✅ Dado reparado salvo no localStorage');
  }
  
  // Recarregar a UI
  checkAuthStatus();
};

// === FUNÇÕES DE VERIFICAÇÃO ===

function isAdmin() {
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  if (!usuarioLogado) return false;
  
  const usuario = JSON.parse(usuarioLogado);
  return usuario.email === 'teste@primos.com';
}

// === FUNÇÕES GLOBAIS ===
window.isAdmin = isAdmin;

// === FUNÇÕES DO MENU DE USUÁRIO ===
function viewProfile() {
  closeUserMenu();
  openProfileModal();
}

function viewMyProducts() {
  closeUserMenu();
  openProductsModal();
}

function viewMyReviews() {
  closeUserMenu();
  openReviewsModal();
}

function viewOrders() {
  closeUserMenu();
  openOrdersModal();
}

function viewSettings() {
  closeUserMenu();
  openSettingsModal();
}

function logout() {
  closeUserMenu(); // Fecha o user-menu-overlay
  
  if (confirm('Tem certeza que deseja sair?')) {
    localStorage.removeItem('usuarioLogado');
    window.location.reload();
  }
}

// === FUNÇÕES DE BUSCA MELHORADAS ===
function sanitizeInput(input) {
  return input.trim().replace(/[^a-zA-Z0-9\s]/g, '');
}

function handleSearchInput(event) {
  const searchTerm = sanitizeInput(event.target.value);
  
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
    console.log('🔍 Classe active adicionada ao searchResults');
    console.log('🔍 Classes atuais:', searchResults.className);
    console.log('🔍 Estilo computado position:', getComputedStyle(searchResults).position);
    console.log('🔍 Estilo computado display:', getComputedStyle(searchResults).display);
    console.log('🔍 Estilo computado visibility:', getComputedStyle(searchResults).visibility);
    console.log('🔍 Estilo computado opacity:', getComputedStyle(searchResults).opacity);
  } else {
    console.error('❌ Elemento searchResults não encontrado!');
  }
}

function hideSearchResults() {
  const searchResults = document.getElementById('searchResults');
  if (searchResults) {
    searchResults.classList.remove('active');
    // Limpar o conteúdo dos resultados
    searchResults.innerHTML = '';
    // Limpar estilos inline para evitar conflitos
    searchResults.style.position = '';
    searchResults.style.top = '';
    searchResults.style.left = '';
    searchResults.style.width = '';
  }
}

function searchProducts(searchTerm) {
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
  
  if (!searchResultsContainer) {
    return;
  }
  
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
      const formattedPrice = price.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
      
      // Gerar nome da imagem
      const imageName = (product.codigo || 'product') + '.jpg';
      const imagePath = 'images/products/thumbnail/' + imageName;
      
      const productHTML = `
        <div class="search-result-item" data-product-code="${product.codigo}">
          <div class="search-result-info">
            <div class="search-result-name">${product.nome}</div>
            <div class="search-result-category">${product.categoria || 'Sem categoria'}</div>
            <div class="search-result-price">${formattedPrice}</div>
          </div>
        </div>
      `;
      
      return productHTML;
    }).join('');
  }
  
  showSearchResults();
  
  // Adicionar event listeners aos itens de resultado (depois do HTML estar no DOM)
  setTimeout(() => {
    const searchResultsContainer = document.getElementById('searchResults');
    if (!searchResultsContainer) return;
    
    const searchItems = searchResultsContainer.querySelectorAll('.search-result-item');
    
    searchItems.forEach((item, index) => {
      // Adicionar evento de clique
      item.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const productCode = this.getAttribute('data-product-code');
        selectSearchProduct(productCode);
      });
      
      // Adicionar evento hover para feedback visual
      item.addEventListener('mouseenter', function() {
        this.style.backgroundColor = '#f8fafc';
      });
      
      item.addEventListener('mouseleave', function() {
        this.style.backgroundColor = '';
      });
    });
    
  }, 200); // Delay para garantir que o HTML está no DOM
}

function selectSearchProduct(productCode) {
  hideSearchResults();
  
  // Encontrar o produto e mostrar na categoria correta
  const product = allProducts.find(p => p.codigo === productCode);
  
  if (product) {
    // Mostrar categoria do produto
    showCategory(product.categoria);
    
    // Esperar um pouco para a categoria carregar e depois rolar até o produto
    setTimeout(() => {
      // Procurar pelo elemento do produto usando o código
      const productElement = document.querySelector(`[data-product-code="${productCode}"]`);
      
      if (productElement) {
        // Adicionar classe de destaque
        productElement.classList.add('search-highlight');
        
        // Rolar suavemente até o produto
        productElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        
        // Remover a classe de destaque após 3 segundos
        setTimeout(() => {
          productElement.classList.remove('search-highlight');
        }, 3000);
      } else {
        // Fallback: procurar por texto do nome do produto
        const productElements = document.querySelectorAll('.product-name, .product h3, .product-info h3');
        for (let element of productElements) {
          if (element.textContent && element.textContent.includes(product.nome)) {
            const productCard = element.closest('.product, .product-card');
            productCard.classList.add('search-highlight');
            productCard.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
            
            // Remover destaque após 3 segundos
            setTimeout(() => {
              productCard.classList.remove('search-highlight');
            }, 3000);
            break;
          }
        }
      }
    }, 500); // Esperar 500ms para a categoria carregar
  }
}

// Event listener para fechar busca ao clicar fora
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



function applyFilters() {
  // Coletar categorias selecionadas
  const categoryCheckboxes = document.querySelectorAll('.category-filters input[type="checkbox"]:checked');
  currentFilters.categories = Array.from(categoryCheckboxes).map(cb => cb.value.toLowerCase());
  
  // Coletar faixa de preço
  const minPriceInput = document.getElementById('minPrice');
  const maxPriceInput = document.getElementById('maxPrice');
  currentFilters.minPrice = minPriceInput.value ? parseFloat(minPriceInput.value) : null;
  currentFilters.maxPrice = maxPriceInput.value ? parseFloat(maxPriceInput.value) : null;
  
  // Filtrar produtos
  filterProducts();
  
  // Fecha o painel de filtros
  toggleFilters();
  
  // Fechar menu mobile automaticamente ao aplicar filtros
  closeMobileMenu();
}

function clearFilters() {
  console.log('Limpando filtros...');
  currentFilters = {
    categories: [],
    brands: [],
    priceRange: { min: 0, max: 10000 }
  };
  
  // Limpar seleções na UI
  const checkboxes = document.querySelectorAll('.filter-checkbox');
  checkboxes.forEach(cb => cb.checked = false);
  
  const minPrice = document.getElementById('minPrice');
  const maxPrice = document.getElementById('maxPrice');
  if (minPrice) minPrice.value = '';
  if (maxPrice) maxPrice.value = '';
  
  // Aplicar filtros vazios (mostra tudo)
  filterProducts();
  
  // Fecha o painel
  toggleFilters();
}

function toggleFilters() {
  const filtersPanel = document.getElementById('filtersPanel');
  const filtersToggle = document.getElementById('filtersToggle');
  const filtersMenuOverlay = document.getElementById('filtersMenuOverlay');
  
  if (filtersPanel && filtersToggle && filtersMenuOverlay) {
    const isActive = filtersPanel.classList.contains('active');
    
    if (isActive) {
      // Fechar tudo
      filtersPanel.classList.remove('active');
      filtersToggle.classList.remove('active');
      filtersMenuOverlay.classList.remove('active');
    } else {
      // Abrir igual ao mobile-menu-sidebar
      filtersPanel.classList.add('active');
      filtersToggle.classList.add('active');
      filtersMenuOverlay.classList.add('active');
    }
  }
}

function toggleFiltersMenu() {
  console.log('🧪 toggleFiltersMenu() chamada - Verificando se está sendo chamada no desktop');
  console.log('📊 Estado atual:', {
    filtersMenuOverlay: !!document.getElementById('filtersMenuOverlay'),
    filtersToggle: !!document.getElementById('filtersToggle'),
    filtersPanel: !!document.getElementById('filtersPanel'),
    isActive: document.getElementById('filtersMenuOverlay')?.classList.contains('active')
  });
  
  toggleFilters();
}

// === FUNÇÕES DOS MODAIS DO USER-MENU ===

function openProfileModal() {
  const overlay = document.getElementById('profileModalOverlay');
  if (overlay) {
    // Atualizar informações do perfil antes de abrir
    updateProfileModalInfo();
    
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function updateProfileModalInfo() {
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  if (!usuarioLogado) return;
  
  const usuario = JSON.parse(usuarioLogado);
  
  // Atualizar inicial
  const initial = usuario.nome ? usuario.nome.charAt(0).toUpperCase() : 'U';
  const profileInitialLargeModal = document.getElementById('profileInitialLargeModal');
  if (profileInitialLargeModal) {
    profileInitialLargeModal.textContent = initial;
  }
  
  // Atualizar informações básicas
  const profileNameModal = document.getElementById('profileNameModal');
  const profileEmailModal = document.getElementById('profileEmailModal');
  if (profileNameModal) {
    profileNameModal.textContent = usuario.nome || 'Usuário';
  }
  if (profileEmailModal) {
    profileEmailModal.textContent = usuario.email || 'usuario@exemplo.com';
  }
  
  // Atualizar data de cadastro
  const profileMemberSince = document.getElementById('profileMemberSince');
  if (profileMemberSince && usuario.dataCadastro) {
    const date = new Date(usuario.dataCadastro);
    profileMemberSince.textContent = date.toLocaleDateString('pt-BR');
  }
  
  // Carregar estatísticas do usuário
  loadUserStatsForProfile();
  
  // Mostrar/ocultar botão Meus Produtos para administradores
  const profileMyProductsBtn = document.getElementById('profileMyProductsBtn');
  if (profileMyProductsBtn) {
    profileMyProductsBtn.style.display = isAdmin() ? 'flex' : 'none';
  }
}

function loadUserStatsForProfile() {
  // Buscar pedidos do localStorage
  const orders = JSON.parse(localStorage.getItem('pedidos') || '[]');
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  
  if (!usuarioLogado) return;
  
  const usuario = JSON.parse(usuarioLogado);
  const userOrders = orders.filter(order => 
    order.email === usuario.email || 
    order.usuarioId === usuario.id ||
    order.usuarioEmail === usuario.email
  );

  const totalOrders = userOrders.length;
  const totalSpent = userOrders.reduce((sum, order) => {
    return sum + (order.total || 0);
  }, 0);

  const lastOrder = userOrders.length > 0 ? 
    new Date(userOrders[userOrders.length - 1].data).toLocaleDateString('pt-BR') : 
    '--';

  // Atualizar estatísticas na UI
  const totalOrdersEl = document.getElementById('totalOrders');
  const totalSpentEl = document.getElementById('totalSpent');
  const lastOrderEl = document.getElementById('lastOrder');

  if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
  if (totalSpentEl) totalSpentEl.textContent = `R$ ${totalSpent.toFixed(2)}`;
  if (lastOrderEl) lastOrderEl.textContent = lastOrder;
}

function closeProfileModal() {
  const overlay = document.getElementById('profileModalOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

function editProfile() {
  alert('Funcionalidade de editar perfil em desenvolvimento');
}

function openProductsModal() {
  const overlay = document.getElementById('productsModalOverlay');
  if (overlay) {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeProductsModal() {
  const overlay = document.getElementById('productsModalOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

function openReviewsModal() {
  const overlay = document.getElementById('reviewsModalOverlay');
  if (overlay) {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeReviewsModal() {
  const overlay = document.getElementById('reviewsModalOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

function openOrdersModal() {
  const overlay = document.getElementById('ordersModalOverlay');
  if (overlay) {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    loadUserOrders(); // Carregar os pedidos do usuário
  }
}

function closeOrdersModal() {
  const overlay = document.getElementById('ordersModalOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

// === FUNÇÕES DE GERENCIAMENTO DE PEDIDOS ===

let currentFilter = 'todos';
let userOrders = [];

function loadUserOrders() {
  // Buscar pedidos do localStorage
  const allOrders = JSON.parse(localStorage.getItem('pedidos') || '[]');
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  
  if (!usuarioLogado) {
    console.log('❌ Usuário não está logado');
    return;
  }
  
  const usuario = JSON.parse(usuarioLogado);
  
  // Filtrar pedidos do usuário atual
  userOrders = allOrders.filter(order => 
    order.email === usuario.email || 
    order.usuarioId === usuario.id ||
    order.usuarioEmail === usuario.email
  );
  
  console.log('📋 Pedidos do usuário:', userOrders);
  
  // Carregar pedidos com filtro atual
  displayOrders(currentFilter);
}

function displayOrders(filter = 'todos') {
  currentFilter = filter;
  const ordersList = document.getElementById('ordersList');
  const emptyState = document.getElementById('ordersEmptyState');
  
  if (!ordersList || !emptyState) return;
  
  // Filtrar pedidos pelo status
  let filteredOrders = userOrders;
  if (filter !== 'todos') {
    filteredOrders = userOrders.filter(order => order.status === filter);
  }
  
  // Ordenar por data (mais recentes primeiro)
  filteredOrders.sort((a, b) => new Date(b.data) - new Date(a.data));
  
  // Limpar lista atual
  ordersList.innerHTML = '';
  
  if (filteredOrders.length === 0) {
    // Mostrar empty state
    ordersList.style.display = 'none';
    emptyState.style.display = 'block';
    
    // Atualizar mensagem do empty state
    const emptyMessage = emptyState.querySelector('h4');
    const emptyDescription = emptyState.querySelector('p');
    
    if (filter === 'todos') {
      emptyMessage.textContent = 'Nenhum pedido encontrado';
      emptyDescription.textContent = 'Você ainda não fez nenhum pedido.';
    } else {
      const filterText = {
        'pendente': 'aguardando',
        'confirmado': 'confirmados',
        'entregue': 'entregues'
      };
      emptyMessage.textContent = `Nenhum pedido ${filterText[filter]}`;
      emptyDescription.textContent = `Você não tem pedidos ${filterText[filter]}.`;
    }
  } else {
    // Mostrar lista de pedidos
    ordersList.style.display = 'block';
    emptyState.style.display = 'none';
    
    // Renderizar cada pedido
    filteredOrders.forEach(order => {
      const orderElement = createOrderElement(order);
      ordersList.appendChild(orderElement);
    });
  }
  
  // Atualizar botões de filtro
  updateFilterButtons(filter);
}

function createOrderElement(order) {
  const orderDiv = document.createElement('div');
  orderDiv.className = 'order-item';
  
  // Formatar data
  const orderDate = new Date(order.data);
  const formattedDate = orderDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  // Formatar total
  const formattedTotal = order.total ? 
    order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 
    'R$ 0,00';
  
  // Status text
  const statusText = getOrderStatusText(order.status);
  
  // Criar HTML do pedido
  orderDiv.innerHTML = `
    <div class="order-header">
      <div class="order-id">#${order.id || '000'}</div>
      <div class="order-status ${order.status}">
        <span class="status-indicator ${order.status}"></span>
        ${statusText}
      </div>
    </div>
    
    <div class="order-date">${formattedDate}</div>
    
    <div class="order-items">
      ${order.items ? order.items.map(item => createOrderItemHTML(item)).join('') : ''}
    </div>
    
    <div class="order-footer">
      <div class="order-total">${formattedTotal}</div>
      <div class="order-actions">
        ${getOrderActions(order)}
      </div>
    </div>
  `;
  
  return orderDiv;
}

function createOrderItemHTML(item) {
  const productName = item.nome || item.productName || 'Produto';
  const quantity = item.quantity || item.quantidade || 1;
  const price = item.preco || item.price || 0;
  const formattedPrice = price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  return `
    <div class="order-item-product">
      <div class="order-product-image">
        <img src="images/products/thumbnail/${item.codigo || 'placeholder'}.jpg" 
             alt="${productName}" 
             onerror="this.src='images/placeholder.png'">
      </div>
      <div class="order-product-info">
        <div class="order-product-name">${productName}</div>
        <div class="order-product-quantity">Quantidade: ${quantity}</div>
      </div>
      <div class="order-product-price">${formattedPrice}</div>
    </div>
  `;
}

function getOrderActions(order) {
  let actions = '';
  
  if (order.status === 'pendente') {
    actions += `
      <button class="order-action-btn" onclick="cancelOrder('${order.id}')">
        Cancelar
      </button>
      <button class="order-action-btn primary" onclick="trackOrder('${order.id}')">
        Acompanhar
      </button>
    `;
  } else if (order.status === 'confirmado') {
    actions += `
      <button class="order-action-btn" onclick="trackOrder('${order.id}')">
        Acompanhar
      </button>
    `;
  } else if (order.status === 'entregue') {
    actions += `
      <button class="order-action-btn primary" onclick="reviewOrder('${order.id}')">
        Avaliar
      </button>
      <button class="order-action-btn" onclick="reorderOrder('${order.id}')">
        Repetir
      </button>
    `;
  }
  
  return actions;
}

function filterOrders(status) {
  displayOrders(status);
}

function updateFilterButtons(activeFilter) {
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(btn => {
    if (btn.dataset.status === activeFilter) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function getOrderStatusText(status) {
  const statusMap = {
    'pendente': 'Aguardando',
    'confirmado': 'Confirmado',
    'entregue': 'Entregue',
    'cancelado': 'Cancelado',
    'em_transporte': 'Em Transporte'
  };
  
  return statusMap[status] || status;
}

// Ações dos pedidos
function cancelOrder(orderId) {
  if (confirm('Tem certeza que deseja cancelar este pedido?')) {
    // Implementar lógica de cancelamento
    console.log('🚫 Cancelando pedido:', orderId);
    showNotification('Pedido cancelado com sucesso', 'success');
    loadUserOrders(); // Recarregar pedidos
  }
}

function trackOrder(orderId) {
  // Implementar rastreamento
  console.log('📍 Rastreando pedido:', orderId);
  showNotification('Funcionalidade de rastreamento em desenvolvimento', 'info');
}

function reviewOrder(orderId) {
  // Implementar avaliação
  console.log('⭐ Avaliando pedido:', orderId);
  showNotification('Funcionalidade de avaliação em desenvolvimento', 'info');
}

function reorderOrder(orderId) {
  // Implementar repetição de pedido
  console.log('🔄 Repetindo pedido:', orderId);
  showNotification('Funcionalidade de repetir pedido em desenvolvimento', 'info');
}

function openSettingsModal() {
  const overlay = document.getElementById('settingsModalOverlay');
  if (overlay) {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeSettingsModal() {
  const overlay = document.getElementById('settingsModalOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

function filterProducts() {
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
  const filtersMenuOverlay = document.getElementById('filtersMenuOverlay');
  
  if (filtersToggle && filtersPanel && filtersMenuOverlay && 
      !filtersToggle.contains(e.target) && 
      !filtersPanel.contains(e.target) &&
      !filtersMenuOverlay.contains(e.target) &&
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
window.toggleFiltersMenu = toggleFiltersMenu;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.showCheckoutOptions = showCheckoutOptions;
window.scrollToTop = scrollToTop; // Adicionar função global
window.finalizeViaWhatsApp = finalizeViaWhatsApp;

// Funções dos modais do user-menu
window.openProfileModal = openProfileModal;
window.closeProfileModal = closeProfileModal;
window.openProductsModal = openProductsModal;
window.closeProductsModal = closeProductsModal;
window.openReviewsModal = openReviewsModal;
window.closeReviewsModal = closeReviewsModal;
window.openOrdersModal = openOrdersModal;
window.closeOrdersModal = closeOrdersModal;
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;

// Funções de gerenciamento de pedidos
window.filterOrders = filterOrders;
window.cancelOrder = cancelOrder;
window.trackOrder = trackOrder;
window.reviewOrder = reviewOrder;
window.reorderOrder = reorderOrder;

// Funções de autenticação
window.checkAuthStatus = checkAuthStatus;
window.showUserMenu = showUserMenu;
window.logout = logout;
window.viewProfile = viewProfile;
window.viewOrders = viewOrders;
window.testAuthButton = testAuthButton;

// === FUNÇÕES DE TESTE ===

// Gerar pedidos de teste para demonstração
window.generateTestOrders = function() {
  console.log('🧪 Gerando pedidos de teste...');
  
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  if (!usuarioLogado) {
    console.log('❌ Usuário não está logado');
    return;
  }
  
  const usuario = JSON.parse(usuarioLogado);
  const pedidos = JSON.parse(localStorage.getItem('pedidos') || '[]');
  
  // Pedidos de teste
  const testOrders = [
    {
      id: 'ORD001',
      usuarioId: usuario.id,
      usuarioEmail: usuario.email,
      email: usuario.email,
      data: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias atrás
      status: 'entregue',
      total: 1299.90,
      items: [
        {
          codigo: '001',
          nome: 'Placa de Vídeo RTX 3060',
          quantidade: 1,
          preco: 1299.90
        }
      ]
    },
    {
      id: 'ORD002',
      usuarioId: usuario.id,
      usuarioEmail: usuario.email,
      email: usuario.email,
      data: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 dias atrás
      status: 'confirmado',
      total: 2499.80,
      items: [
        {
          codigo: '002',
          nome: 'Processador Intel i7-12700K',
          quantidade: 1,
          preco: 1899.90
        },
        {
          codigo: '003',
          nome: 'Memória RAM 16GB DDR4',
          quantidade: 2,
          preco: 299.95
        }
      ]
    },
    {
      id: 'ORD003',
      usuarioId: usuario.id,
      usuarioEmail: usuario.email,
      email: usuario.email,
      data: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 dia atrás
      status: 'pendente',
      total: 899.90,
      items: [
        {
          codigo: '004',
          nome: 'SSD NVMe 1TB',
          quantidade: 1,
          preco: 599.90
        },
        {
          codigo: '005',
          nome: 'Fonte 650W 80 Plus',
          quantidade: 1,
          preco: 299.90
        }
      ]
    }
  ];
  
  // Adicionar pedidos de teste ao localStorage (se não existirem)
  testOrders.forEach(testOrder => {
    const existingOrder = pedidos.find(p => p.id === testOrder.id);
    if (!existingOrder) {
      pedidos.push(testOrder);
    }
  });
  
  localStorage.setItem('pedidos', JSON.stringify(pedidos));
  console.log('✅ Pedidos de teste gerados:', testOrders.length);
  console.log('📋 Total de pedidos:', pedidos.length);
  
  // Recarregar pedidos se o modal estiver aberto
  if (document.getElementById('ordersModalOverlay')?.classList.contains('active')) {
    loadUserOrders();
  }
  
  showNotification('Pedidos de teste gerados com sucesso!', 'success');
};

// === BOTÃO VOLTAR AO TOPO ===
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

// Controlar visibilidade do botão voltar ao topo
document.addEventListener('DOMContentLoaded', function() {
  const backToTopButton = document.getElementById('backToTop');
  
  // Esconder botão inicialmente
  if (backToTopButton) {
    backToTopButton.classList.remove('visible');
  }
});

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

// Funções de avaliação
window.openReviewModal = openReviewModal;
window.closeReviewModal = closeReviewModal;
window.setRating = setRating;
window.handlePhotoUpload = handlePhotoUpload;
window.removePhoto = removePhoto;
window.submitReview = submitReview;

// Funções de busca
window.handleSearchInput = handleSearchInput;
window.searchProducts = searchProducts;
window.showSearchResults = showSearchResults;
window.hideSearchResults = hideSearchResults;
window.selectSearchProduct = selectSearchProduct;

// === SISTEMA DE MENU DE PERFIL ===
class ProfileMenuManager {
  constructor() {
    this.isOpen = false;
    this.currentUser = null;
    this.elements = {};
    this.init();
  }

  init() {
    console.log('🚀 ProfileMenuManager iniciado');
    
    // Verificar autenticação apenas no carregamento
    this.checkAuthentication();
    
    // Configurar elementos
    this.setupElements();
    
    // Configurar event listeners
    this.setupEventListeners();
  }

  setupElements() {
    this.elements = {
      profileBtn: document.getElementById('profileBtn'),
      profileDropdown: document.getElementById('profileDropdown'),
      profileAvatar: document.getElementById('profileAvatar'),
      profileInitial: document.getElementById('profileInitial'),
      profileInitialLarge: document.getElementById('profileInitialLarge'),
      profileName: document.getElementById('profileName'),
      profileEmail: document.getElementById('profileEmail'),
      viewProfileBtn: document.getElementById('viewProfileBtn'),
      myOrdersBtn: document.getElementById('myOrdersBtn'),
      settingsBtn: document.getElementById('settingsBtn'),
      logoutBtn: document.getElementById('logoutBtn')
    };
  }

  setupEventListeners() {
    const { profileBtn, viewProfileBtn, myOrdersBtn, settingsBtn, logoutBtn } = this.elements;

    // Toggle menu
    if (profileBtn) {
      profileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleMenu();
      });
    }

    // Fechar menu ao clicar em qualquer opção
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileDropdown) {
      profileDropdown.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        this.closeMenu();
        
        // Identificar qual opção foi clicada
        const clickedElement = e.target.closest('.profile-menu-item');
        if (clickedElement) {
          setTimeout(() => {
            if (clickedElement.id === 'viewProfileBtn') {
              this.handleViewProfile();
            } else if (clickedElement.id === 'myOrdersBtn') {
              this.handleMyOrders();
            } else if (clickedElement.id === 'settingsBtn') {
              this.handleSettings();
            } else if (clickedElement.id === 'logoutBtn') {
              this.handleLogout();
            }
          }, 50);
        }
      });
    }

    // Fechar menu ao pressionar ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeMenu();
      }
    });

    // Fechar menu ao clicar fora
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.isClickInsideMenu(e.target)) {
        this.closeMenu();
      }
    });
  }

  checkAuthentication() {
    // Verificação APENAS no carregamento - NUNCA no clique
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    
    if (usuarioLogado) {
      try {
        this.currentUser = JSON.parse(usuarioLogado);
        this.showProfileButton();
        this.updateProfileInfo();
      } catch (e) {
        console.error('❌ Erro ao parsear usuário:', e);
        localStorage.removeItem('usuarioLogado');
        this.hideProfileButton();
      }
    } else {
      this.hideProfileButton();
    }
  }

  showProfileButton() {
    const { profileBtn } = this.elements;
    if (profileBtn) {
      profileBtn.style.display = 'flex';
    }
  }

  hideProfileButton() {
    const { profileBtn } = this.elements;
    if (profileBtn) {
      profileBtn.style.display = 'none';
    }
  }

  updateProfileInfo() {
    if (!this.currentUser) return;

    const { profileInitial, profileInitialLarge, profileName, profileEmail } = this.elements;
    
    // Atualizar inicial
    const initial = this.currentUser.nome ? this.currentUser.nome.charAt(0).toUpperCase() : 'U';
    if (profileInitial) profileInitial.textContent = initial;
    if (profileInitialLarge) profileInitialLarge.textContent = initial;
    
    // Atualizar nome e email
    if (profileName) profileName.textContent = this.currentUser.nome || 'Usuário';
    if (profileEmail) profileEmail.textContent = this.currentUser.email || 'usuario@exemplo.com';
  }

  toggleMenu() {
    if (this.isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    if (!this.currentUser) return;

    const { profileDropdown, profileBtn } = this.elements;

    // Atualizar ARIA
    if (profileBtn) {
      profileBtn.setAttribute('aria-expanded', 'true');
    }

    // Mostrar dropdown
    if (profileDropdown) {
      profileDropdown.style.display = 'block';
      // Forçar reflow para animação
      profileDropdown.offsetHeight;
      profileDropdown.classList.add('active');
    }

    this.isOpen = true;
  }

  closeMenu() {
    const { profileDropdown, profileBtn } = this.elements;

    // Atualizar ARIA
    if (profileBtn) {
      profileBtn.setAttribute('aria-expanded', 'false');
    }

    // Esconder dropdown
    if (profileDropdown) {
      profileDropdown.classList.remove('active');
    }

    // Remover display após animação
    setTimeout(() => {
      if (profileDropdown) {
        profileDropdown.style.display = 'none';
      }
    }, 150);

    this.isOpen = false;
  }

  isClickInsideMenu(target) {
    const { profileBtn, profileDropdown } = this.elements;
    
    return profileBtn?.contains(target) || profileDropdown?.contains(target);
  }

  handleViewProfile() {
    // Menu já foi fechado no evento de clique
    // Pequeno delay para garantir que o overlay foi removido
    setTimeout(() => {
      this.openProfileModal();
    }, 100);
  }

  openProfileModal() {
    if (!this.currentUser) return;

    const modal = document.getElementById('profileModal');
    if (!modal) return;

    // Garantir que NENHUM overlay esteja ativo antes de abrir o modal
    this.forceCloseAllOverlays();

    // Atualizar informações do modal
    this.updateProfileModal();

    // Mostrar modal
    modal.style.display = 'block';
    // Forçar reflow para animação
    modal.offsetHeight;
    modal.classList.add('active');

    // Prevenir scroll do body
    document.body.style.overflow = 'hidden';

    // Foco no botão fechar para acessibilidade
    setTimeout(() => {
      const closeBtn = modal.querySelector('.profile-modal-close');
      if (closeBtn) {
        closeBtn.focus();
      }
    }, 100);

    console.log('👤 Modal de perfil aberto');
  }

  forceCloseAllOverlays() {
    // Forçar fechamento de qualquer overlay aberto
    const overlays = document.querySelectorAll('.profile-overlay.active, .cart-overlay.active, .mobile-menu-overlay.active');
    overlays.forEach(overlay => {
      overlay.classList.remove('active');
      overlay.style.display = 'none';
    });

    // Forçar fechamento de qualquer dropdown aberto
    const dropdowns = document.querySelectorAll('.profile-dropdown.active, .cart-sidebar.active');
    dropdowns.forEach(dropdown => {
      dropdown.classList.remove('active');
      dropdown.style.display = 'none';
    });

    console.log('🧹 Todos os overlays e dropdowns foram fechados');
  }

  updateProfileModal() {
    if (!this.currentUser) return;

    const elements = {
      profileInitialLargeModal: document.getElementById('profileInitialLargeModal'),
      profileNameModal: document.getElementById('profileNameModal'),
      profileEmailModal: document.getElementById('profileEmailModal'),
      profileMemberSince: document.getElementById('profileMemberSince'),
      totalOrders: document.getElementById('totalOrders'),
      totalSpent: document.getElementById('totalSpent'),
      lastOrder: document.getElementById('lastOrder')
    };

    // Atualizar inicial
    const initial = this.currentUser.nome ? this.currentUser.nome.charAt(0).toUpperCase() : 'U';
    if (elements.profileInitialLargeModal) {
      elements.profileInitialLargeModal.textContent = initial;
    }

    // Atualizar informações básicas
    if (elements.profileNameModal) {
      elements.profileNameModal.textContent = this.currentUser.nome || 'Usuário';
    }
    if (elements.profileEmailModal) {
      elements.profileEmailModal.textContent = this.currentUser.email || 'usuario@exemplo.com';
    }

    // Atualizar data de cadastro
    if (elements.profileMemberSince && this.currentUser.dataCadastro) {
      const date = new Date(this.currentUser.dataCadastro);
      elements.profileMemberSince.textContent = date.toLocaleDateString('pt-BR');
    }

    // Carregar estatísticas do usuário
    this.loadUserStats();
  }

  loadUserStats() {
    // Buscar pedidos do localStorage
    const orders = JSON.parse(localStorage.getItem('pedidos') || '[]');
    const userOrders = orders.filter(order => 
      order.email === this.currentUser.email || 
      order.usuarioId === this.currentUser.id
    );

    const totalOrders = userOrders.length;
    const totalSpent = userOrders.reduce((sum, order) => {
      return sum + (order.total || 0);
    }, 0);

    const lastOrder = userOrders.length > 0 ? 
      new Date(userOrders[userOrders.length - 1].date).toLocaleDateString('pt-BR') : 
      '--';

    // Atualizar estatísticas na UI
    const totalOrdersEl = document.getElementById('totalOrders');
    const totalSpentEl = document.getElementById('totalSpent');
    const lastOrderEl = document.getElementById('lastOrder');

    if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
    if (totalSpentEl) totalSpentEl.textContent = `R$ ${totalSpent.toFixed(2)}`;
    if (lastOrderEl) lastOrderEl.textContent = lastOrder;
  }

  handleMyOrders() {
    // Menu já foi fechado no evento de clique
    console.log('📦 Meus pedidos');
    // Abrir modal de pedidos
    openOrdersModal();
  }

  handleSettings() {
    // Menu já foi fechado no evento de clique
    console.log('⚙️ Configurações');
    // Implementar lógica de configurações
    alert('Funcionalidade de configurações em desenvolvimento');
  }

  handleLogout() {
    // Menu já foi fechado no evento de clique
    if (confirm('Tem certeza que deseja sair?')) {
      // Remover usuário do localStorage
      localStorage.removeItem('usuarioLogado');
      
      console.log('👋 Usuário deslogado');
      
      // Recarregar página para atualizar UI
      window.location.reload();
    }
  }

  // Método público para forçar atualização
  refresh() {
    this.checkAuthentication();
  }
}

// Instanciar o gerenciador de menu de perfil
let profileMenuManager;

// Inicializar quando o DOM estiver pronto
function initializeProfileMenu() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      profileMenuManager = new ProfileMenuManager();
      // Expor globalmente APÓS instanciação
      window.ProfileMenuManager = ProfileMenuManager;
      window.profileMenuManager = profileMenuManager;
      console.log('✅ ProfileMenuManager exposto globalmente');
    });
  } else {
    profileMenuManager = new ProfileMenuManager();
    // Expor globalmente APÓS instanciação
    window.ProfileMenuManager = ProfileMenuManager;
    window.profileMenuManager = profileMenuManager;
    console.log('✅ ProfileMenuManager exposto globalmente');
  }
}

// Inicializar imediatamente
initializeProfileMenu();

// === FUNÇÕES DE TESTE ===
window.testProfileMenu = function() {
  console.log('🧪 TESTANDO MENU DE PERFIL');
  
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  const profileBtn = document.getElementById('profileBtn');
  const profileDropdown = document.getElementById('profileDropdown');
  
  console.log('📊 Estado atual:', {
    usuarioLogado: !!usuarioLogado,
    usuarioData: usuarioLogado ? JSON.parse(usuarioLogado) : null,
    profileBtnExists: !!profileBtn,
    profileBtnVisible: profileBtn ? profileBtn.style.display !== 'none' : false,
    profileDropdownExists: !!profileDropdown,
    isMobile: window.innerWidth <= 768
  });
  
  if (!usuarioLogado) {
    console.log('❌ Usuário não está logado. Use simulateLoginOnIndex() primeiro.');
    return;
  }
  
  if (!profileBtn) {
    console.log('❌ Botão de perfil não encontrado');
    return;
  }
  
  console.log('✅ Teste de clique no botão de perfil...');
  profileBtn.click();
  
  setTimeout(() => {
    const isOpen = profileDropdown?.classList.contains('active');
    console.log('📂 Menu aberto:', isOpen);
    
    if (isOpen) {
      console.log('✅ Teste de fechamento com ESC...');
      const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escEvent);
      
      setTimeout(() => {
        const stillOpen = profileDropdown?.classList.contains('active');
        console.log('📂 Menu fechado com ESC:', !stillOpen);
        
        console.log('✅ Teste concluído!');
      }, 300);
    }
  }, 300);
};

window.simulateLoginOnIndex = function() {
  console.log('🧪 SIMULANDO LOGIN NA PÁGINA INICIAL...');
  
  const usuario = {
    id: Date.now(),
    nome: 'Usuário Teste',
    email: 'teste@primos.com',
    dataCadastro: new Date().toISOString()
  };
  
  localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
  console.log('✅ Usuário salvo no localStorage:', usuario);
  
  // Atualizar a UI
  if (window.profileMenuManager) {
    window.profileMenuManager.refresh();
  } else {
    console.log('❌ ProfileMenuManager não encontrado. Recarregue a página.');
  }
};

window.simulateLogoutOnIndex = function() {
  console.log('🧪 SIMULANDO LOGOUT NA PÁGINA INICIAL...');
  
  localStorage.removeItem('usuarioLogado');
  console.log('✅ Usuário removido do localStorage');
  
  // Atualizar a UI
  if (window.profileMenuManager) {
    window.profileMenuManager.refresh();
  } else {
    console.log('❌ ProfileMenuManager não encontrado. Recarregue a página.');
  }
};

// Inicializar imediatamente
initializeProfileMenu();

// Adicionar event listener para o botão de filtros
document.addEventListener('DOMContentLoaded', function() {
  const filtersToggle = document.getElementById('filtersToggle');
  if (filtersToggle) {
    console.log('✅ Botão de filtros encontrado, adicionando event listener');
    filtersToggle.addEventListener('click', function(e) {
      console.log('🖱️ Botão de filtros clicado!');
      e.preventDefault();
      e.stopPropagation();
      toggleFiltersMenu();
    });
  } else {
    console.log('❌ Botão de filtros não encontrado');
  }
});

window.testAnyOptionClosesOverlay = function() {
  console.log('🧪 TESTANDO SE QUALQUER OPÇÃO FECHA O OVERLAY');
  
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  if (!usuarioLogado) {
    console.log('❌ Usuário não está logado. Use simulateLoginOnIndex() primeiro.');
    return;
  }
  
  const profileBtn = document.getElementById('profileBtn');
  const profileDropdown = document.getElementById('profileDropdown');
  const profileOverlay = document.getElementById('profileOverlay');
  
  console.log('📊 Estado inicial:', {
    profileBtnExists: !!profileBtn,
    dropdownExists: !!profileDropdown,
    overlayExists: !!profileOverlay,
    dropdownVisible: profileDropdown ? profileDropdown.style.display !== 'none' : false,
    overlayVisible: profileOverlay ? profileOverlay.style.display !== 'none' : false
  });
  
  if (!profileBtn || !profileDropdown || !profileOverlay) {
    console.log('❌ Elementos necessários não encontrados');
    return;
  }
  
  console.log('✅ Passo 1: Abrindo menu dropdown...');
  profileBtn.click();
  
  setTimeout(() => {
    console.log('📊 Após abrir menu:', {
      dropdownActive: profileDropdown.classList.contains('active'),
      overlayActive: profileOverlay.classList.contains('active')
    });
    
    if (!profileDropdown.classList.contains('active')) {
      console.log('❌ Menu não abriu corretamente');
      return;
    }
    
    // Testar clique em diferentes áreas do menu
    const testAreas = [
      { name: 'header', selector: '.profile-dropdown-header' },
      { name: 'content', selector: '.profile-dropdown-content' },
      { name: 'Meu Perfil button', selector: '#viewProfileBtn' },
      { name: 'Meus Pedidos button', selector: '#myOrdersBtn' },
      { name: 'Configurações button', selector: '#settingsBtn' },
      { name: 'Sair button', selector: '#logoutBtn' }
    ];
    
    let testIndex = 0;
    
    function runNextTest() {
      if (testIndex >= testAreas.length) {
        console.log('✅ Todos os testes concluídos!');
        return;
      }
      
      const test = testAreas[testIndex];
      console.log(`✅ Passo ${testIndex + 2}: Testando clique em "${test.name}"...`);
      
      // Reabrir menu se estiver fechado
      if (!profileDropdown.classList.contains('active')) {
        profileBtn.click();
        setTimeout(() => {
          performTest();
        }, 200);
      } else {
        performTest();
      }
      
      function performTest() {
        const element = document.querySelector(test.selector);
        if (element) {
          console.log(`📊 Clicando em: ${test.name}`);
          element.click();
          
          setTimeout(() => {
            const overlayClosed = !profileOverlay.classList.contains('active') && profileOverlay.style.display === 'none';
            const dropdownClosed = !profileDropdown.classList.contains('active') && profileDropdown.style.display === 'none';
            
            console.log(`📊 Resultado para "${test.name}":`, {
              overlayClosed: overlayClosed,
              dropdownClosed: dropdownClosed,
              overlayActive: profileOverlay.classList.contains('active'),
              dropdownActive: profileDropdown.classList.contains('active')
            });
            
            if (overlayClosed && dropdownClosed) {
              console.log(`✅ SUCESSO: "${test.name}" fechou o overlay!`);
            } else {
              console.log(`❌ PROBLEMA: "${test.name}" NÃO fechou o overlay!`);
            }
            
            testIndex++;
            setTimeout(runNextTest, 500);
          }, 200);
        } else {
          console.log(`❌ Elemento "${test.name}" não encontrado`);
          testIndex++;
          setTimeout(runNextTest, 100);
        }
      }
    }
    
    runNextTest();
  }, 300);
};

window.testButtonsCloseOverlay = function() {
  console.log('🧪 TESTANDO SE BOTÕES FECHAM O OVERLAY');
  
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  if (!usuarioLogado) {
    console.log('❌ Usuário não está logado. Use simulateLoginOnIndex() primeiro.');
    return;
  }
  
  const profileBtn = document.getElementById('profileBtn');
  const profileDropdown = document.getElementById('profileDropdown');
  const profileOverlay = document.getElementById('profileOverlay');
  
  console.log('📊 Estado inicial:', {
    profileBtnExists: !!profileBtn,
    dropdownExists: !!profileDropdown,
    overlayExists: !!profileOverlay,
    dropdownVisible: profileDropdown ? profileDropdown.style.display !== 'none' : false,
    overlayVisible: profileOverlay ? profileOverlay.style.display !== 'none' : false
  });
  
  if (!profileBtn || !profileDropdown || !profileOverlay) {
    console.log('❌ Elementos necessários não encontrados');
    return;
  }
  
  console.log('✅ Passo 1: Abrindo menu dropdown...');
  profileBtn.click();
  
  setTimeout(() => {
    console.log('📊 Após abrir menu:', {
      dropdownActive: profileDropdown.classList.contains('active'),
      overlayActive: profileOverlay.classList.contains('active')
    });
    
    if (!profileDropdown.classList.contains('active')) {
      console.log('❌ Menu não abriu corretamente');
      return;
    }
    
    console.log('✅ Passo 2: Testando clique em "Meu Perfil"...');
    const viewProfileBtn = document.getElementById('viewProfileBtn');
    if (viewProfileBtn) {
      console.log('📊 Clicando no botão "Meu Perfil"...');
      viewProfileBtn.click();
      
      setTimeout(() => {
        console.log('📊 Após clicar "Meu Perfil":', {
          dropdownActive: profileDropdown.classList.contains('active'),
          overlayActive: profileOverlay.classList.contains('active'),
          dropdownDisplay: profileDropdown.style.display,
          overlayDisplay: profileOverlay.style.display
        });
        
        const overlayClosed = !profileOverlay.classList.contains('active') && profileOverlay.style.display === 'none';
        const dropdownClosed = !profileDropdown.classList.contains('active') && profileDropdown.style.display === 'none';
        
        if (overlayClosed && dropdownClosed) {
          console.log('✅ SUCESSO: Overlay e dropdown fecharam ao clicar no botão!');
        } else {
          console.log('❌ PROBLEMA: Overlay/dropdown não fecharam ao clicar no botão');
        }
        
        console.log('✅ Teste concluído!');
      }, 200);
    } else {
      console.log('❌ Botão "Meu Perfil" não encontrado');
    }
  }, 300);
};

window.testOverlayFix = function() {
  console.log('🧪 TESTANDO CORREÇÃO DO OVERLAY');
  
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  if (!usuarioLogado) {
    console.log('❌ Usuário não está logado. Use simulateLoginOnIndex() primeiro.');
    return;
  }
  
  const profileBtn = document.getElementById('profileBtn');
  const profileDropdown = document.getElementById('profileDropdown');
  const profileOverlay = document.getElementById('profileOverlay');
  const profileModal = document.getElementById('profileModal');
  
  console.log('📊 Estado inicial:', {
    profileBtnExists: !!profileBtn,
    dropdownExists: !!profileDropdown,
    overlayExists: !!profileOverlay,
    modalExists: !!profileModal,
    dropdownVisible: profileDropdown ? profileDropdown.style.display !== 'none' : false,
    overlayVisible: profileOverlay ? profileOverlay.style.display !== 'none' : false,
    modalVisible: profileModal ? profileModal.style.display !== 'none' : false
  });
  
  if (!profileBtn || !profileDropdown || !profileOverlay || !profileModal) {
    console.log('❌ Elementos necessários não encontrados');
    return;
  }
  
  console.log('✅ Passo 1: Abrindo menu dropdown...');
  profileBtn.click();
  
  setTimeout(() => {
    console.log('📊 Após abrir menu:', {
      dropdownActive: profileDropdown.classList.contains('active'),
      overlayActive: profileOverlay.classList.contains('active')
    });
    
    console.log('✅ Passo 2: Clicando em "Meu Perfil"...');
    const viewProfileBtn = document.getElementById('viewProfileBtn');
    if (viewProfileBtn) {
      viewProfileBtn.click();
      
      setTimeout(() => {
        console.log('📊 Após clicar "Meu Perfil":', {
          dropdownActive: profileDropdown.classList.contains('active'),
          overlayActive: profileOverlay.classList.contains('active'),
          dropdownDisplay: profileDropdown.style.display,
          overlayDisplay: profileOverlay.style.display,
          modalActive: profileModal.classList.contains('active'),
          modalDisplay: profileModal.style.display
        });
        
        const overlayProblem = profileOverlay.classList.contains('active') || profileOverlay.style.display !== 'none';
        const dropdownProblem = profileDropdown.classList.contains('active') || profileDropdown.style.display !== 'none';
        
        if (overlayProblem || dropdownProblem) {
          console.log('❌ PROBLEMA DETECTADO: Overlay/dropdown não fecharam corretamente');
        } else {
          console.log('✅ SUCESSO: Overlay e dropdown fecharam corretamente');
        }
        
        console.log('✅ Teste concluído!');
      }, 300);
    } else {
      console.log('❌ Botão "Meu Perfil" não encontrado');
    }
  }, 300);
};

window.diagnoseProfileSystem = function() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DO SISTEMA DE PERFIL');
  
  const diagnostic = {
    // Estado do DOM
    domReady: document.readyState === 'complete',
    profileBtnExists: !!document.getElementById('profileBtn'),
    profileDropdownExists: !!document.getElementById('profileDropdown'),
    profileModalExists: !!document.getElementById('profileModal'),
    
    // Estado do usuário
    usuarioLogado: !!localStorage.getItem('usuarioLogado'),
    usuarioData: null,
    
    // Estado do ProfileMenuManager
    classExists: typeof ProfileMenuManager !== 'undefined',
    globalInstanceExists: !!window.profileMenuManager,
    localInstanceExists: !!profileMenuManager,
    
    // Estado das funções
    viewProfileExists: typeof viewProfile === 'function',
    closeProfileModalExists: typeof closeProfileModal === 'function'
  };
  
  if (diagnostic.usuarioLogado) {
    try {
      diagnostic.usuarioData = JSON.parse(localStorage.getItem('usuarioLogado'));
    } catch (e) {
      diagnostic.usuarioData = 'ERROR';
    }
  }
  
  console.log('📊 RESULTADO DO DIAGNÓSTICO:', diagnostic);
  
  // Verificar problemas específicos
  if (!diagnostic.profileBtnExists) {
    console.error('❌ Botão de perfil não encontrado no DOM');
  }
  
  if (!diagnostic.profileModalExists) {
    console.error('❌ Modal de perfil não encontrado no DOM');
  }
  
  if (!diagnostic.classExists) {
    console.error('❌ Classe ProfileMenuManager não definida');
  }
  
  if (!diagnostic.globalInstanceExists) {
    console.error('❌ Instância global do ProfileMenuManager não encontrada');
  }
  
  if (!diagnostic.usuarioLogado) {
    console.warn('⚠️ Nenhum usuário logado');
  }
  
  // Tentar corrigir problemas
  if (!diagnostic.globalInstanceExists && diagnostic.classExists) {
    console.log('🔧 Tentando criar instância do ProfileMenuManager...');
    try {
      window.profileMenuManager = new ProfileMenuManager();
      console.log('✅ ProfileMenuManager criado manualmente');
    } catch (error) {
      console.error('❌ Falha ao criar ProfileMenuManager:', error);
    }
  }
  
  return diagnostic;
};

window.testProfileModal = function() {
  console.log('🧪 TESTANDO MODAL DE PERFIL');
  
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  const profileModal = document.getElementById('profileModal');
  
  console.log('📊 Estado atual:', {
    usuarioLogado: !!usuarioLogado,
    usuarioData: usuarioLogado ? JSON.parse(usuarioLogado) : null,
    profileModalExists: !!profileModal,
    profileModalVisible: profileModal ? profileModal.style.display !== 'none' : false
  });
  
  if (!usuarioLogado) {
    console.log('❌ Usuário não está logado. Use simulateLoginOnIndex() primeiro.');
    return;
  }
  
  if (!profileModal) {
    console.log('❌ Modal de perfil não encontrado');
    return;
  }
  
  console.log('✅ Teste de abertura do modal...');
  
  // Abrir modal através do ProfileMenuManager
  if (window.profileMenuManager) {
    window.profileMenuManager.openProfileModal();
    
    setTimeout(() => {
      const isOpen = profileModal.classList.contains('active');
      console.log('📂 Modal aberto:', isOpen);
      
      if (isOpen) {
        console.log('✅ Teste de fechamento com ESC...');
        const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        document.dispatchEvent(escEvent);
        
        setTimeout(() => {
          const stillOpen = profileModal.classList.contains('active');
          console.log('📂 Modal fechado com ESC:', !stillOpen);
          
          console.log('✅ Teste do modal concluído!');
        }, 400);
      }
    }, 400);
  } else {
    console.log('❌ ProfileMenuManager não encontrado');
  }
};

// === FUNÇÕES GLOBAIS DO MODAL DE PERFIL ===
window.editProfile = function() {
  console.log('✏️ Editar perfil');
  alert('Funcionalidade de edição de perfil em desenvolvimento');
};

window.viewSettings = function() {
  console.log('⚙️ Ver configurações');
  alert('Funcionalidade de configurações em desenvolvimento');
};

// Fechar modal com ESC
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const modal = document.getElementById('profileModalOverlay');
    if (modal && modal.classList.contains('active')) {
      closeProfileModal();
    }
  }
});

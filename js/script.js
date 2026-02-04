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
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }
}

// === LIMPEZA DE PLACEHOLDERS RESIDUAIS ===
function cleanupStalePlaceholders() {
  // Encontrar todos os placeholders
  const placeholders = document.querySelectorAll('.image-placeholder');
  
  placeholders.forEach(function(placeholder) {
    // Verificar se há uma imagem carregada no mesmo container
    const container = placeholder.parentElement;
    if (container) {
      const img = container.querySelector('img');
      if (img && img.complete && img.naturalHeight !== 0 && img.src) {
        // Imagem está carregada, remover placeholder
        placeholder.classList.add('hiding');
        setTimeout(function() {
          if (placeholder.parentNode) {
            placeholder.remove();
          }
        }, 100);
      } else if (img && img.classList.contains('loaded')) {
        // Imagem já marcada como carregada, remover placeholder
        placeholder.classList.add('hiding');
        setTimeout(function() {
          if (placeholder.parentNode) {
            placeholder.remove();
          }
        }, 100);
      }
    }
  });
}

// === CONTROLE DE SCROLL RESTORATION ===
// Impedir restauração automática de scroll do navegador
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', forceScrollToTop);
} else {
  // DOM já está carregado
  forceScrollToTop();
}

// Também executar no window.onload para garantir
window.addEventListener('load', function() {
  forceScrollToTop();
  // Limpar placeholders após carregamento completo da página
  setTimeout(cleanupStalePlaceholders, 100);
});

// === FUNÇÃO PRINCIPAL - CATEGORIAS ===
function showCategory(category) {
  // Resetar navegação antes de mostrar categoria
  resetNavigation();
  
  // Limpar placeholders residuais antes de mudar de categoria
  cleanupStalePlaceholders();
  
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
  
  // Produtos específicos para promoção
  const produtosPromocaoEspecificos = [
    {
      codigo: "2011",
      nome: "PLACA MAE BRAZIL PC 1155 DDR3 BPC-H61-ITX-M.2",
      categoria: "placa mãe",
      preco: 189, // Valor promocional que você definiu
      qt: 3,
      descricao: "Placa Mãe Brazil PC 1155 DDR3 BPC-H61-ITX-M.2",
      marca: "Brazil PC",
      promocao: true,
      precoOriginal: 210, // Valor original fictício para mostrar desconto
      imagem: "bpc-h61-itx-m2.webp"
    },
    {
      codigo: "1892",
      nome: "FONTE REAL 750 W 80 PLUS MGS",
      categoria: "fonte",
      preco: 350, // Valor promocional que você definiu
      qt: 3,
      descricao: "Fonte Real 750W 80 Plus MGS",
      marca: "MGS",
      promocao: true,
      precoOriginal: 420, // Valor original fictício para mostrar desconto
      imagem: "mgs_fonte750w.webp"
    },
    {
      codigo: "1554",
      nome: "GABINETE GAMER GB1792",
      categoria: "gabinetes",
      preco: 215, // Valor promocional que você definiu
      qt: 3,
      descricao: "Gabinete Gamer GB1792",
      marca: "Hayom",
      promocao: true,
      precoOriginal: 275, // Valor original fictício para mostrar desconto
      imagem: "gabinete-hayom-gb1792.webp"
    },
    {
      codigo: "402216",
      nome: "MINI TECLADO MULTILASER MEC GK-510",
      categoria: "teclado",
      preco: 195, // Valor promocional que você definiu
      qt: 1,
      descricao: "Mini teclado mecânico GK-510",
      marca: "Multilaser",
      promocao: true,
      precoOriginal: 220, // Valor original que você informou
      imagem: "teclado-multilaser-gk510.webp"
    }
  ];
  
  // Aplicar promoções visuais aos produtos específicos
  const promocoesProducts = produtosPromocaoEspecificos.map(produto => aplicarPromocaoVisual(produto));
  
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
    
    // Adicionar informação sobre promoções
    productsHTML += '<div style="text-align: center; margin-top: 20px; padding: 15px; background: #f0f9ff; border-radius: 8px; color: #0369a1;">';
    productsHTML += '<small>🎁 Promoções especiais selecionadas para você!</small>';
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
    'gabinetes': 22,          // 22% de desconto
    'mouse': 30,              // 30% de desconto
    'teclado': 28,             // 28% de desconto
    'default': 15             // 15% padrão para outras categorias
  };
  
  // Obter percentual de desconto
  let percentualDesconto = descontosPorCategoria.default;
  if (categoria && descontosPorCategoria[categoria.toLowerCase()]) {
    percentualDesconto = descontosPorCategoria[categoria.toLowerCase()];
  }
  
  // Regras especiais por faixa de preço
  if (precoOriginal > 2000) {
    percentualDesconto = Math.min(percentualDesconto, 10); // Máximo 10% para produtos caros
  } else if (precoOriginal > 1000) {
    percentualDesconto = Math.min(percentualDesconto, 12); // Máximo 12% para produtos médios
  } else if (precoOriginal < 100) {
    percentualDesconto = Math.max(percentualDesconto, 35); // Mínimo 35% para produtos baratos
  }
  
  // Calcular valor promocional
  const valorDesconto = (precoOriginal * percentualDesconto) / 100;
  const precoPromocional = precoOriginal - valorDesconto;
  
  // Arredondar para 2 casas decimais
  return {
    precoOriginal: precoOriginal,
    precoPromocional: Math.round(precoPromocional * 100) / 100,
    percentualDesconto: percentualDesconto,
    economia: Math.round(valorDesconto * 100) / 100
  };
}

// Função para aplicar promoção a um produto (apenas visual)
function aplicarPromocaoVisual(produto) {
  if (!produto) return produto;
  
  // Usar precoOriginal se fornecido, senão usar preco atual
  const precoOriginalBase = produto.precoOriginal || produto.preco;
  
  // Para produtos específicos, usar preco como promocional e precoOriginal como base
  let precoPromocionalFinal;
  if (produto.precoOriginal) {
    // Tem precoOriginal definido, usar preco atual como promocional
    precoPromocionalFinal = produto.preco;
  } else {
    // Calcular valor promocional baseado no preço original
    const calculo = calcularValorPromocional(precoOriginalBase, produto.categoria);
    precoPromocionalFinal = calculo.precoPromocional;
  }
  
  // Criar produto com promoção visual (não altera o original)
  const produtoPromocional = {
    ...produto,
    precoPromocional: precoPromocionalFinal, // Preço promocional final
    promocao: true,
    percentualDesconto: Math.round(((precoOriginalBase - precoPromocionalFinal) / precoOriginalBase) * 100),
    economia: precoOriginalBase - precoPromocionalFinal,
    precoOriginal: precoOriginalBase // Preço original para exibição
  };
  
  return produtoPromocional;
}

// Função para gerar promoções automáticas (apenas visual)
function gerarPromocoesVisuais(produtos, maxProdutos = 10) {
  const produtosEmPromocao = [];
  
  // Embaralhar produtos para seleção aleatória
  const produtosEmbaralhados = [...produtos].sort(() => Math.random() - 0.5);
  
  // Selecionar produtos para promoção
  for (let i = 0; i < Math.min(maxProdutos, produtosEmbaralhados.length); i++) {
    const produto = produtosEmbaralhados[i];
    
    // Não promover produtos já em promoção
    if (produto.promocao) continue;
    
    // Aplicar promoção visual
    const produtoPromocional = aplicarPromocaoVisual(produto);
    produtosEmPromocao.push(produtoPromocional);
  }
  
  return produtosEmPromocao;
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
        
        // Verificar se a imagem já está carregada (cache) ou completa
        if (img.complete && img.naturalHeight !== 0) {
          // Imagem já está carregada, remover placeholder imediatamente
          if (placeholder) {
            placeholder.classList.add('hiding');
            setTimeout(function() {
              if (placeholder.parentNode) {
                placeholder.remove();
              }
            }, 100);
          }
          img.classList.remove('loading');
          img.classList.add('loaded');
          img.removeAttribute('data-src');
        }
        
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
          // Verificar se imagem já tem src para evitar carregamento duplicado
          if (!img.src || img.src === window.location.href) {
            img.src = img.dataset.src;
          }
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
  console.log('🚀 loadProducts() iniciada - JSON mode');
  return fetch('data/products.json')
    .then(function(response) {
      console.log('📁 JSON response status:', response.status);
      if (!response.ok) {
        throw new Error('Erro ao carregar arquivo JSON: ' + response.statusText);
      }
      return response.json();
    })
    .then(function(jsonData) {
      console.log('📄 JSON carregado, produtos:', jsonData.length);
      
      const products = [];
      const productMap = {}; // Usar mapa para evitar duplicatas por código
      
      for (let i = 0; i < jsonData.length; i++) {
        const product = jsonData[i];
        
        // Garantir que todos os campos obrigatórios existam
        product.codigo = product.codigo || '';
        product.nome = product.nome || '';
        product.preco = product.preco || 0;
        product.categoria = product.categoria || '';
        product.marca = product.marca || '';
        product.descricao = product.descricao || '';
        product.imagem = product.imagem || '';
        
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
      
      allProducts = products;
      console.log('✅', allProducts.length, 'produtos carregados do JSON');
      
      // Expor products globalmente após carregamento
      window.products = products;
      console.log('📦 Variável products exposta globalmente');
      
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
        'Redes': '<path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M19.07 13.93a7 7 0 0 1-6.14 0"></path><line x1="12" y1="8" x2="12.01" y2="8"></line>',
        'processador': '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line>',
        'placa de vídeo': '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>',
        'placa mãe': '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>',
        'ssd': '<rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="6" x2="12.01" y2="6"></line>',
        'hd externo': '<ellipse cx="12" cy="12" rx="10" ry="3"></ellipse><path d="M2 12v6c0 1.66 4.48 3 10 3s10-1.34 10-3v-6"></path>',
        'hd interno': '<ellipse cx="12" cy="12" rx="10" ry="3"></ellipse><path d="M2 12v6c0 1.66 4.48 3 10 3s10-1.34 10-3v-6"></path>',
        'kit-teclado-mouse': '<rect x="2" y="4" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="6" rx="2" ry="2"></rect>',
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
    
    navTabs.innerHTML = staticHTML + generateCategoryButtons(false, true);
    
    // Adicionar detecção de scroll para indicadores visuais
    navTabs.addEventListener('scroll', function() {
      const headerNav = document.querySelector('.header-nav');
      if (headerNav) {
        // Verificar se pode scrollar para a esquerda
        if (this.scrollLeft > 0) {
          headerNav.classList.add('scrollable-left');
        } else {
          headerNav.classList.remove('scrollable-left');
        }
        
        // Verificar se pode scrollar para a direita
        if (this.scrollLeft < this.scrollWidth - this.clientWidth) {
          headerNav.classList.add('scrollable-right');
        } else {
          headerNav.classList.remove('scrollable-right');
        }
      }
    });
    
    // Verificar inicialmente se há scroll necessário
    setTimeout(function() {
      const headerNav = document.querySelector('.header-nav');
      if (navTabs.scrollWidth > navTabs.clientWidth) {
        headerNav.classList.add('scrollable-right');
      }
    }, 100);
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
    // JSON usa booleano true, CSV usava string 'sim'
    if (allProducts[i].promocao === true || allProducts[i].promocao === 'sim') {
      highlights.push(allProducts[i]);
    }
  }
  
  // Se tiver menos de 6 produtos em destaque, adicionar produtos aleatórios
  if (highlights.length < 6) {
    const otherProducts = allProducts.filter(p => p.promocao !== true && p.promocao !== 'sim');
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
    // Tentar localStorage primeiro - usar a chave correta
    const storedReviews = localStorage.getItem('primos_reviews');
    let reviews = [];
    
    if (storedReviews) {
      reviews = JSON.parse(storedReviews);
      console.log(`📋 Carregando ${reviews.length} avaliações do localStorage`);
    }
    
    // Filtrar avaliações do produto específico
    const productReviews = reviews.filter(review => review.productId === productId);
    console.log(`🎯 Filtrando ${productReviews.length} avaliações para o produto ${productId}`);
    
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

// Função para mostrar erros de validação
function showValidationErrors(errors, containerId) {
  console.log('🚨 Erros de validação:', errors);
  
  // Encontrar container de erros ou criar um
  let errorContainer = document.getElementById(containerId);
  if (!errorContainer) {
    errorContainer = document.createElement('div');
    errorContainer.id = containerId;
    errorContainer.className = 'validation-errors';
    
    // Inserir antes do formulário
    const form = document.getElementById('reviewForm');
    if (form) {
      form.parentNode.insertBefore(errorContainer, form);
    }
  }
  
  // Mostrar erros
  errorContainer.innerHTML = `
    <div class="error-banner" style="
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
    ">
      <strong>Por favor, corrija os seguintes erros:</strong>
      <ul style="margin: 8px 0 0 0; padding-left: 20px;">
        ${errors.map(error => `<li>${error}</li>`).join('')}
      </ul>
    </div>
  `;
  
  // Remover após 5 segundos
  setTimeout(() => {
    if (errorContainer) {
      errorContainer.innerHTML = '';
    }
  }, 5000);
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
    
    // Obter dados do usuário logado
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (usuarioLogado) {
      try {
        const usuario = JSON.parse(usuarioLogado);
        reviewData.userEmail = usuario.email;
        reviewData.userName = usuario.nome;
        console.log('👤 Dados do usuário obtidos:', usuario.email, usuario.nome);
      } catch (e) {
        console.error('❌ Erro ao obter dados do usuário:', e);
        reviewData.userEmail = 'anonimo@exemplo.com';
        reviewData.userName = 'Usuário Anônimo';
      }
    } else {
      reviewData.userEmail = 'anonimo@exemplo.com';
      reviewData.userName = 'Usuário Anônimo';
    }
    
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
      const originalId = reviews[existingIndex].id;
      reviews[existingIndex] = {
        ...reviews[existingIndex],
        ...reviewData,
        id: originalId, // Manter ID original
        edited: true,
        date: new Date().toISOString()
      };
      console.log('📝 Avaliação atualizada:', reviewData.productId, 'ID mantido:', originalId);
      
      // Para verificação, usar o ID original
      reviewData.id = originalId;
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
      console.log('📊 Total de avaliações após salvar:', verifyReviews.length);
      console.log('🔍 Procurando avaliação com ID:', reviewData.id);
      
      const found = verifyReviews.find(r => r.id === reviewData.id);
      if (found) {
        console.log('✅ Avaliação salva com sucesso:', reviewData.id);
        console.log('📝 Dados salvos:', found);
        return true;
      } else {
        console.error('❌ Falha ao salvar avaliação - não encontrada após salvar');
        console.error('📊 IDs disponíveis:', verifyReviews.map(r => r.id));
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
window.showValidationErrors = showValidationErrors;

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
  
  // Verificar se produto está em promoção
  const isPromocao = product.promocao === true;
  const promocaoBadge = ''; // Removido ícone de fogo 🔥
  
  // Montar preço com promoção (se houver)
  let priceHTML = formattedPrice;
  if (isPromocao && product.precoPromocional && product.precoOriginal) {
    const promocionalPrice = 'R$ ' + product.precoPromocional.toFixed(2).replace('.', ',');
    const originalPrice = 'R$ ' + product.precoOriginal.toFixed(2).replace('.', ',');
    const economia = 'R$ ' + product.economia.toFixed(2).replace('.', ',');
    
    priceHTML = `
      <div class="price-promocional">
        <span class="preco-promocional">${promocionalPrice}</span>
        <span class="preco-original">${originalPrice}</span>
        <span class="economia">Economia ${economia} (${product.percentualDesconto}% OFF)</span>
      </div>
    `;
  }
  
  return '<div class="product-card" data-product-code="' + product.codigo + '">' +
    '<div class="product-image">' +
    promocaoBadge +
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
    '<p class="price">' + priceHTML + '</p>' +
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
window.cart = [];

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
  
  // Usar carrinho global ou localStorage
  const cart = window.cart || JSON.parse(localStorage.getItem('cart') || '[]');
  
  // Salvar carrinho no localStorage
  localStorage.setItem('cart', JSON.stringify(cart));
  
  console.log('🛒 Atualizando display do carrinho...');
  console.log('📦 Conteúdo do carrinho:', cart);
  console.log('📊 Quantidade de itens:', cart.length);
  
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
  
  console.log(`💰 Total do carrinho: R$ ${total.toFixed(2)}`);
  console.log(`📊 Contador de itens: ${itemCount}`);
}

function removeFromCart(productCode) {
  window.cart = window.cart.filter(item => item.codigo !== productCode);
  updateCartDisplay();
}

function clearCart() {
  // Limpar carrinho global e localStorage
  window.cart = [];
  localStorage.removeItem('cart');
  updateCartDisplay();
}

// === VERIFICAÇÃO DE AUTENTICAÇÃO ===
function verificarLoginParaCheckout() {
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  
  if (!usuarioLogado) {
    // Mostrar modal de login necessário
    showLoginRequiredModal();
    return false;
  }
  
  return true;
}

function showLoginRequiredModal() {
  // Criar modal de login necessário
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;
  
  modal.innerHTML = `
    <div style="background: white; padding: 30px; border-radius: 12px; max-width: 400px; text-align: center; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);">
      <div style="font-size: 48px; margin-bottom: 20px;">🔐</div>
      <h2 style="margin: 0 0 15px 0; color: #333;">Login Necessário</h2>
      <p style="margin: 0 0 25px 0; color: #666; line-height: 1.5;">
        Para finalizar seu pedido, você precisa estar logado em sua conta.
      </p>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button onclick="irParaLogin()" style="background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;">
          Fazer Login
        </button>
        <button onclick="fecharLoginModal()" style="background: #e5e7eb; color: #333; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">
          Cancelar
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Funções globais para os botões
  window.irParaLogin = function() {
    document.body.removeChild(modal);
    window.location.href = 'auth.html';
  };
  
  window.fecharLoginModal = function() {
    document.body.removeChild(modal);
  };
}

// === PREENCHIMENTO AUTOMÁTICO DE DADOS DO USUÁRIO ===
function preencherDadosUsuarioLogado() {
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  
  if (usuarioLogado) {
    try {
      const usuario = JSON.parse(usuarioLogado);
      
      // Preencher campos do formulário se existirem
      const nomeField = document.getElementById('checkout-nome');
      const emailField = document.getElementById('checkout-email');
      const telefoneField = document.getElementById('checkout-telefone');
      
      if (nomeField && usuario.nome) {
        nomeField.value = usuario.nome;
        nomeField.readOnly = true; // Tornar somente leitura
        nomeField.style.backgroundColor = '#f3f4f6';
      }
      
      if (emailField && usuario.email) {
        emailField.value = usuario.email;
        emailField.readOnly = true; // Tornar somente leitura
        emailField.style.backgroundColor = '#f3f4f6';
      }
      
      if (telefoneField && usuario.telefone) {
        telefoneField.value = usuario.telefone;
        telefoneField.readOnly = true; // Tornar somente leitura
        telefoneField.style.backgroundColor = '#f3f4f6';
      }
      
      console.log('✅ Dados do usuário preenchidos automaticamente');
    } catch (e) {
      console.error('❌ Erro ao preencher dados do usuário:', e);
    }
  }
}

// === FUNÇÕES DE CHECKOUT ===
function showCheckoutOptions() {
  // Verificar se usuário está logado
  if (!verificarLoginParaCheckout()) {
    return;
  }
  
  const cart = window.cart || JSON.parse(localStorage.getItem('cart') || '[]');
  if (cart.length === 0) {
    alert('Seu carrinho está vazio! Adicione produtos para continuar.');
    return;
  }
  
  // Enviar diretamente para o WhatsApp
  finalizeViaWhatsApp();
}

function finalizeViaWhatsApp() {
  // Verificar se usuário está logado
  if (!verificarLoginParaCheckout()) {
    return;
  }
  
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
  
  console.log('🛒 Adicionando produto ao carrinho...');
  console.log('📦 Código do produto:', productCode);
  console.log('📊 Carrinho antes de adicionar:', window.cart);
  
  // Inicializar carrinho global se não existir
  if (!window.cart) {
    window.cart = [];
  }
  
  for (let i = 0; i < allProducts.length; i++) {
    if (allProducts[i].codigo === productCode) {
      window.cart.push({
        ...allProducts[i],
        quantity: 1
      });
      
      console.log('✅ Produto adicionado:', allProducts[i].nome);
      console.log('📊 Carrinho após adicionar:', window.cart);
      
      // Animação de piscada no botão clicado
      clickedButton.classList.remove('adding', 'added');
      void clickedButton.offsetWidth; // Força reflow
      clickedButton.classList.add('adding');
      
      // Muda o texto temporariamente
      const originalText = clickedButton.textContent;
      clickedButton.textContent = '✓ Adicionado!';
      
      setTimeout(() => {
        clickedButton.classList.remove('adding');
        clickedButton.classList.add('added');
        
        // Volta ao texto original após 1.5 segundos
        setTimeout(() => {
          clickedButton.classList.remove('added');
          clickedButton.textContent = originalText;
        }, 1500);
      }, 1800); // 3 pulsos de 0.6s = 1.8s
      
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
    
    // Limpar placeholders que possam ter ficado para trás
    cleanupStalePlaceholders();
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
  console.log('🔍 viewMyReviews() chamada');
  closeUserMenu();
  openReviewsModal();
}

// Expor imediatamente para garantir disponibilidade
window.viewMyReviews = viewMyReviews;
console.log('✅ viewMyReviews() exposta globalmente');

// Garantir disponibilidade no final do carregamento
document.addEventListener('DOMContentLoaded', function() {
  window.viewMyReviews = viewMyReviews;
  console.log('✅ viewMyReviews() reexposta no DOMContentLoaded');
});

// Garantir no window.onload também
window.addEventListener('load', function() {
  window.viewMyReviews = viewMyReviews;
  console.log('✅ viewMyReviews() reexposta no window.onload');
});

// === FUNÇÕES DO CHECKOUT ===
function loadCheckoutSummary() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const itemsContainer = document.getElementById('checkout-items');
  const subtotalElement = document.getElementById('checkout-subtotal');
  const totalElement = document.getElementById('checkout-total');
  
  console.log('🛒 Carregando resumo do checkout...');
  console.log('📦 Carrinho encontrado:', cart);
  console.log('📊 Quantidade de itens:', cart.length);
  
  // Preencher dados do usuário logado automaticamente
  preencherDadosUsuarioLogado();
  
  if (!itemsContainer || !subtotalElement || !totalElement) {
    console.log('❌ Elementos do checkout não encontrados');
    return;
  }
  
  // Limpar items
  itemsContainer.innerHTML = '';
  
  // Verificar se o carrinho está vazio
  if (cart.length === 0) {
    console.log('❌ Carrinho está vazio, mostrando mensagem');
    itemsContainer.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #6b7280;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 16px auto; opacity: 0.5;">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #374151;">Seu carrinho está vazio</h3>
        <p style="margin: 0; font-size: 14px;">Adicione produtos para continuar</p>
      </div>
    `;
    
    // Resetar valores
    subtotalElement.textContent = 'R$ 0,00';
    totalElement.textContent = 'R$ 0,00';
    window.checkoutSubtotal = 0;
    
    // Desabilitar botão de finalizar
    const submitButton = document.querySelector('#checkout-form button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.style.opacity = '0.5';
      submitButton.style.cursor = 'not-allowed';
      submitButton.textContent = 'Carrinho Vazio';
    }
    
    return;
  }
  
  console.log('✅ Carrinho tem itens, processando...');
  
  // Habilitar botão de finalizar
  const submitButton = document.querySelector('#checkout-form button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = false;
    submitButton.style.opacity = '1';
    submitButton.style.cursor = 'pointer';
    submitButton.textContent = 'Finalizar Pedido';
  }
  
  let subtotal = 0;
  
  // Adicionar items ao resumo
  cart.forEach((item, index) => {
    // Corrigir tratamento de preço para preservar centavos
    const priceString = (item.preco || '0').toString().replace(',', '.');
    const price = parseFloat(priceString);
    const quantity = item.quantidade || item.quantity || 1;
    const itemTotal = price * quantity;
    subtotal += itemTotal;
    
    console.log(`📋 Item ${index + 1}: ${item.nome} - Qtd: ${quantity} - Preço: R$ ${price.toFixed(2)} - Total: R$ ${itemTotal.toFixed(2)}`);
    
    const itemElement = document.createElement('div');
    itemElement.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #f3f4f6;
    `;
    itemElement.innerHTML = `
      <div style="flex: 1;">
        <div style="color: #374151; font-weight: 500;">${item.nome}</div>
        <div style="color: #6b7280; font-size: 14px;">Qtd: ${quantity}</div>
      </div>
      <div style="color: #374151; font-weight: 500;">R$ ${itemTotal.toFixed(2)}</div>
    `;
    itemsContainer.appendChild(itemElement);
    
    // Forçar reflow para garantir que o elemento apareça
    console.log(`📦 Elemento do item ${index + 1} adicionado ao DOM:`, itemElement);
  });
  
  // Verificar se os itens foram adicionados
  console.log(`📊 Quantidade de elementos no container: ${itemsContainer.children.length}`);
  console.log(`📋 Conteúdo HTML do container:`, itemsContainer.innerHTML);
  
  // Atualizar subtotal
  subtotalElement.textContent = `R$ ${subtotal.toFixed(2)}`;
  
  // Calcular total inicial (sem frete)
  totalElement.textContent = `R$ ${subtotal.toFixed(2)}`;
  
  // Salvar subtotal para cálculo do frete
  window.checkoutSubtotal = subtotal;
  
  console.log(`💰 Subtotal calculado: R$ ${subtotal.toFixed(2)}`);
}

function formatCEP(input) {
  let value = input.value.replace(/\D/g, '');
  
  if (value.length > 5) {
    value = value.slice(0, 5) + '-' + value.slice(5, 8);
  }
  
  input.value = value;
}

async function calculateUberShipping(cep) {
  const cleanCEP = cep.replace(/\D/g, '');
  
  if (cleanCEP.length !== 8) {
    document.getElementById('checkout-shipping').textContent = 'CEP inválido';
    document.getElementById('uber-info').style.display = 'none';
    return;
  }
  
  // Mostrar status de carregamento
  document.getElementById('checkout-shipping').textContent = 'Calculando...';
  document.getElementById('uber-info').style.display = 'none';
  
  try {
    // Calcular distância real usando API
    const distance = await calculateDistanceByCEP('70853510', cleanCEP);
    
    // Calcular frete baseado na distância - valores mais competitivos (10% mais baratos)
    let shippingCost;
    
    // Verificar se o subtotal qualifica para frete grátis
    const subtotal = window.checkoutSubtotal || 0;
    const freeShippingThreshold = 300.00; // Frete grátis acima de R$ 300
    
    if (subtotal >= freeShippingThreshold) {
      shippingCost = 0; // Frete grátis!
    } else {
      // Calcular frete com 10% de desconto
      if (distance <= 5) {
        // Até 5km - entrega próxima: R$ 12,00 → R$ 10,80
        shippingCost = 10.80;
      } else if (distance <= 10) {
        // 5-10km - entrega média: R$ 18,00 → R$ 16,20
        shippingCost = 16.20;
      } else if (distance <= 15) {
        // 10-15km - entrega longa: R$ 25,00 → R$ 22,50
        shippingCost = 22.50;
      } else if (distance <= 20) {
        // 15-20km - entrega muito longa: R$ 35,00 → R$ 31,50
        shippingCost = 31.50;
      } else {
        // Acima de 20km - entrega remota: R$ 45,00 → R$ 40,50
        shippingCost = 40.50;
      }
    }
    
    // Calcular tempo estimado (baseado na distância)
    const estimatedTime = Math.max(20, Math.round(distance * 2.5)); // Mínimo 20 minutos
    
    // Atualizar interface
    const shippingElement = document.getElementById('checkout-shipping');
    const uberInfo = document.getElementById('uber-info');
    
    if (shippingCost === 0) {
      shippingElement.innerHTML = '<span style="color: #10b981; font-weight: 600;">🎉 GRÁTIS!</span>';
      shippingElement.style.color = '#10b981';
    } else {
      shippingElement.textContent = `R$ ${shippingCost.toFixed(2)}`;
      shippingElement.style.color = '#374151';
    }
    
    document.getElementById('uber-time').textContent = estimatedTime;
    document.getElementById('uber-distance').textContent = distance.toFixed(1);
    uberInfo.style.display = 'block';
    
    // Atualizar total
    updateCheckoutTotal(shippingCost);
    
    // Salvar dados do frete
    window.checkoutShipping = shippingCost;
    window.checkoutDistance = distance;
    window.checkoutTime = estimatedTime;
    
  } catch (error) {
    console.log('❌ Erro no cálculo de frete:', error);
    document.getElementById('checkout-shipping').textContent = 'Erro no cálculo';
    document.getElementById('uber-info').style.display = 'none';
  }
}

async function calculateDistanceByCEP(cep1, cep2) {
  // Função que usa OpenRouteService API para calcular distância real
  // Converte CEPs para coordenadas e calcula distância real da rota
  
  try {
    // Converter CEPs para coordenadas
    const coords1 = await cepToCoordinates(cep1);
    const coords2 = await cepToCoordinates(cep2);
    
    if (!coords1 || !coords2) {
      console.log('⚠️ Não foi possível obter coordenadas, usando fallback');
      return calculateDistanceFallback(cep1, cep2);
    }
    
    // Calcular distância real usando OpenRouteService
    const distance = await calculateRealDistance(coords1, coords2);
    
    console.log(`📍 Distância real calculada: ${distance.toFixed(2)}km`);
    return distance;
    
  } catch (error) {
    console.log('❌ Erro na API, usando fallback:', error.message);
    return calculateDistanceFallback(cep1, cep2);
  }
}

// Função para converter CEP em coordenadas usando API de geocoding
async function cepToCoordinates(cep) {
  const cleanCEP = cep.replace(/\D/g, '');
  
  if (cleanCEP.length !== 8) {
    return null;
  }
  
  try {
    // Usar Nominatim (OpenStreetMap) para geocoding - gratuito
    const response = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${cleanCEP}&country=Brazil&format=json&limit=1`);
    
    if (!response.ok) {
      throw new Error('Erro na API de geocoding');
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon)
      };
    }
    
    return null;
    
  } catch (error) {
    console.log('❌ Erro no geocoding:', error.message);
    return null;
  }
}

// Função para calcular distância real entre duas coordenadas
async function calculateRealDistance(coords1, coords2) {
  try {
    // OpenRouteService API - gratuita e precisa
    const apiKey = '5b3ce3597851110001cf624443c4b8d9d9164a839b5c4c1a5c8b5b4c'; // Chave gratuita demo
    
    const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
      },
      body: JSON.stringify({
        coordinates: [
          [coords1.lon, coords1.lat],
          [coords2.lon, coords2.lat]
        ],
        units: 'km'
      })
    });
    
    if (!response.ok) {
      throw new Error('Erro na API de roteamento');
    }
    
    const data = await response.json();
    
    if (data && data.routes && data.routes.length > 0) {
      const distance = data.routes[0].segments[0].distance / 1000; // Converter metros para km
      return distance;
    }
    
    throw new Error('Rota não encontrada');
    
  } catch (error) {
    // Fallback para cálculo de distância em linha reta
    console.log('⚠️ Usando cálculo de distância em linha reta como fallback');
    return calculateStraightLineDistance(coords1, coords2);
  }
}

// Cálculo de distância em linha reta (fallback)
function calculateStraightLineDistance(coords1, coords2) {
  const R = 6371; // Raio da Terra em km
  const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
  const dLon = (coords2.lon - coords1.lon) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Função fallback original (mantida para casos de erro)
function calculateDistanceFallback(cep1, cep2) {
  const baseCEP = cep1.substring(0, 5); // CEP da loja: 70853
  const targetCEP = cep2.substring(0, 5);
  
  // Mapeamento das regiões de Brasília e distâncias aproximadas da Asa Norte (70853)
  const regioesBrasilia = {
    // Asa Norte - mesma região
    '70800': 2, '70801': 2, '70802': 2, '70803': 2, '70804': 2,
    '70850': 1, '70851': 1, '70852': 1, '70853': 0, '70854': 1, '70855': 1, '70856': 1, '70857': 1, '70858': 1, '70859': 1,
    '70860': 2, '70861': 2, '70862': 2, '70863': 2, '70864': 2, '70865': 2, '70866': 2, '70867': 2, '70868': 2, '70869': 2,
    '70870': 3, '70871': 3, '70872': 3, '70873': 3, '70874': 3, '70875': 3, '70876': 3, '70877': 3, '70878': 3, '70879': 3,
    '70890': 3, '70891': 3, '70892': 3, '70893': 3, '70894': 3, '70895': 3, '70896': 3, '70897': 3, '70898': 3, '70899': 3,
    
    // Asa Sul
    '70800': 4, '70801': 4, '70802': 4, '70803': 4, '70804': 4,
    '70810': 5, '70811': 5, '70812': 5, '70813': 5, '70814': 5, '70815': 5, '70816': 5, '70817': 5, '70818': 5, '70819': 5,
    '70820': 6, '70821': 6, '70822': 6, '70823': 6, '70824': 6, '70825': 6, '70826': 6, '70827': 6, '70828': 6, '70829': 6,
    '70830': 7, '70831': 7, '70832': 7, '70833': 7, '70834': 7, '70835': 7, '70836': 7, '70837': 7, '70838': 7, '70839': 7,
    '70840': 8, '70841': 8, '70842': 8, '70843': 8, '70844': 8, '70845': 8, '70846': 8, '70847': 8, '70848': 8, '70849': 8,
    
    // Setor Sudoeste, Sudeste, Norte
    '70810': 6, '70811': 6, '70812': 6, '70813': 6, '70814': 6, '70815': 6, '70816': 6, '70817': 6, '70818': 6, '70819': 6,
    '70820': 8, '70821': 8, '70822': 8, '70823': 8, '70824': 8, '70825': 8, '70826': 8, '70827': 8, '70828': 8, '70829': 8,
    '70830': 10, '70831': 10, '70832': 10, '70833': 10, '70834': 10, '70835': 10, '70836': 10, '70837': 10, '70838': 10, '70839': 10,
    
    // Lago Norte, Lago Sul
    '70815': 12, '70816': 12, '70817': 12, '70818': 12, '70819': 12,
    '70820': 15, '70821': 15, '70822': 15, '70823': 15, '70824': 15, '70825': 15, '70826': 15, '70827': 15, '70828': 15, '70829': 15,
    
    // Áreas residenciais mais distantes
    '70830': 18, '70831': 18, '70832': 18, '70833': 18, '70834': 18, '70835': 18, '70836': 18, '70837': 18, '70838': 18, '70839': 18,
    '70840': 20, '70841': 20, '70842': 20, '70843': 20, '70844': 20, '70845': 20, '70846': 20, '70847': 20, '70848': 20, '70849': 20,
    
    // Cidades Satélites - Mapeamento Corrigido
    // Ceilândia (71xxx)
    '71800': 25, '71801': 25, '71802': 25, '71803': 25, '71804': 25, '71805': 25, '71806': 25, '71807': 25, '71808': 25, '71809': 25,
    '71810': 26, '71811': 26, '71812': 26, '71813': 26, '71814': 26, '71815': 26, '71816': 26, '71817': 26, '71818': 26, '71819': 26,
    '71820': 27, '71821': 27, '71822': 27, '71823': 27, '71824': 27, '71825': 27, '71826': 27, '71827': 27, '71828': 27, '71829': 27,
    '71830': 28, '71831': 28, '71832': 28, '71833': 28, '71834': 28, '71835': 28, '71836': 28, '71837': 28, '71838': 28, '71839': 28,
    '71840': 29, '71841': 29, '71842': 29, '71843': 29, '71844': 29, '71845': 29, '71846': 29, '71847': 29, '71848': 29, '71849': 29,
    '71850': 30, '71851': 30, '71852': 30, '71853': 30, '71854': 30, '71855': 30, '71856': 30, '71857': 30, '71858': 30, '71859': 30,
    '71860': 31, '71861': 31, '71862': 31, '71863': 31, '71864': 31, '71865': 31, '71866': 31, '71867': 31, '71868': 31, '71869': 31,
    '71870': 32, '71871': 32, '71872': 32, '71873': 32, '71874': 32, '71875': 32, '71876': 32, '71877': 32, '71878': 32, '71879': 32,
    '71880': 33, '71881': 33, '71882': 33, '71883': 33, '71884': 33, '71885': 33, '71886': 33, '71887': 33, '71888': 33, '71889': 33,
    '71890': 34, '71891': 34, '71892': 34, '71893': 34, '71894': 34, '71895': 34, '71896': 34, '71897': 34, '71898': 34, '71899': 34,
    
    // Taguatinga (72xxx)
    '72000': 20, '72001': 20, '72002': 20, '72003': 20, '72004': 20, '72005': 20, '72006': 20, '72007': 20, '72008': 20, '72009': 20,
    '72010': 22, '72011': 22, '72012': 22, '72013': 22, '72014': 22, '72015': 22, '72016': 22, '72017': 22, '72018': 22, '72019': 22,
    '72020': 24, '72021': 24, '72022': 24, '72023': 24, '72024': 24, '72025': 24, '72026': 24, '72027': 24, '72028': 24, '72029': 24,
    '72030': 26, '72031': 26, '72032': 26, '72033': 26, '72034': 26, '72035': 26, '72036': 26, '72037': 26, '72038': 26, '72039': 26,
    '72040': 28, '72041': 28, '72042': 28, '72043': 28, '72044': 28, '72045': 28, '72046': 28, '72047': 28, '72048': 28, '72049': 28,
    '72050': 30, '72051': 30, '72052': 30, '72053': 30, '72054': 30, '72055': 30, '72056': 30, '72057': 30, '72058': 30, '72059': 30,
    '72060': 32, '72061': 32, '72062': 32, '72063': 32, '72064': 32, '72065': 32, '72066': 32, '72067': 32, '72068': 32, '72069': 32,
    '72070': 34, '72071': 34, '72072': 34, '72073': 34, '72074': 34, '72075': 34, '72076': 34, '72077': 34, '72078': 34, '72079': 34,
    '72080': 36, '72081': 36, '72082': 36, '72083': 36, '72084': 36, '72085': 36, '72086': 36, '72087': 36, '72088': 36, '72089': 36,
    '72090': 38, '72091': 38, '72092': 38, '72093': 38, '72094': 38, '72095': 38, '72096': 38, '72097': 38, '72098': 38, '72099': 38,
    
    // Samambaia (72xxx)
    '72200': 30, '72201': 30, '72202': 30, '72203': 30, '72204': 30, '72205': 30, '72206': 30, '72207': 30, '72208': 30, '72209': 30,
    '72210': 32, '72211': 32, '72212': 32, '72213': 32, '72214': 32, '72215': 32, '72216': 32, '72217': 32, '72218': 32, '72219': 32,
    '72220': 34, '72221': 34, '72222': 34, '72223': 34, '72224': 34, '72225': 34, '72226': 34, '72227': 34, '72228': 34, '72229': 34,
    '72230': 36, '72231': 36, '72232': 36, '72233': 36, '72234': 36, '72235': 36, '72236': 36, '72237': 36, '72238': 36, '72239': 36,
    '72240': 38, '72241': 38, '72242': 38, '72243': 38, '72244': 38, '72245': 38, '72246': 38, '72247': 38, '72248': 38, '72249': 38,
    '72250': 40, '72251': 40, '72252': 40, '72253': 40, '72254': 40, '72255': 40, '72256': 40, '72257': 40, '72258': 40, '72259': 40,
    '72260': 42, '72261': 42, '72262': 42, '72263': 42, '72264': 42, '72265': 42, '72266': 42, '72267': 42, '72268': 42, '72269': 42,
    '72270': 44, '72271': 44, '72272': 44, '72273': 44, '72274': 44, '72275': 44, '72276': 44, '72277': 44, '72278': 44, '72279': 44,
    '72280': 46, '72281': 46, '72282': 46, '72283': 46, '72284': 46, '72285': 46, '72286': 46, '72287': 46, '72288': 46, '72289': 46,
    '72290': 48, '72291': 48, '72292': 48, '72293': 48, '72294': 48, '72295': 48, '72296': 48, '72297': 48, '72298': 48, '72299': 48,
    
    // Outras cidades satélites
    '72300': 35, '72301': 35, '72302': 35, '72303': 35, '72304': 35, '72305': 35, '72306': 35, '72307': 35, '72308': 35, '72309': 35, // Planaltina
    '72400': 40, '72401': 40, '72402': 40, '72403': 40, '72404': 40, '72405': 40, '72406': 40, '72407': 40, '72408': 40, '72409': 40, // Sobradinho
    '72500': 45, '72501': 45, '72502': 45, '72503': 45, '72504': 45, '72505': 45, '72506': 45, '72507': 45, '72508': 45, '72509': 45, // Gama
    '72600': 50, '72601': 50, '72602': 50, '72603': 50, '72604': 50, '72605': 50, '72606': 50, '72607': 50, '72608': 50, '72609': 50, // Santa Maria
    '72700': 55, '72701': 55, '72702': 55, '72703': 55, '72704': 55, '72705': 55, '72706': 55, '72707': 55, '72708': 55, '72709': 55, // Águas Claras
    '72800': 60, '72801': 60, '72802': 60, '72803': 60, '72804': 60, '72805': 60, '72806': 60, '72807': 60, '72808': 60, '72809': 60, // Recanto das Emas
    '72900': 65, '72901': 65, '72902': 65, '72903': 65, '72904': 65, '72905': 65, '72906': 65, '72907': 65, '72908': 65, '72909': 65  // Riacho Fundo
  };
  
  // Verificar se o CEP está no mapeamento
  if (regioesBrasilia[targetCEP] !== undefined) {
    return regioesBrasilia[targetCEP];
  }
  
  // Se não encontrar no mapeamento, usar cálculo baseado no prefixo
  const prefix = targetCEP.substring(0, 2);
  
  // Brasília (70-73)
  if (['70', '71', '72', '73'].includes(prefix)) {
    // Calcular distância baseada na diferença do CEP de forma mais realista
    const baseNum = parseInt(baseCEP.substring(2, 5));
    const targetNum = parseInt(targetCEP.substring(2, 5));
    const diff = Math.abs(baseNum - targetNum);
    
    // Mapeamento mais realista para Brasília
    if (diff <= 10) return 2;   // Mesmo bairro
    if (diff <= 50) return 5;   // Bairros próximos
    if (diff <= 100) return 8;  // Mesma região
    if (diff <= 200) return 12; // Regiões próximas
    if (diff <= 300) return 16; // Regiões distantes
    return 20;                  // Máximo em Brasília
  }
  
  // Fora de Brasília (cidades satélites e Entorno)
  return 35; // Distância média para cidades satélites
}

function updateCheckoutTotal(shippingCost = 0) {
  const subtotal = window.checkoutSubtotal || 0;
  const shipping = shippingCost || window.checkoutShipping || 0;
  const discount = 0; // Sem desconto por enquanto
  
  const total = subtotal + shipping - discount;
  
  document.getElementById('checkout-total').textContent = `R$ ${total.toFixed(2)}`;
  document.getElementById('checkout-discount').textContent = `-R$ ${discount.toFixed(2)}`;
}

function submitOrder(event) {
  event.preventDefault();
  
  // Verificar se usuário está logado
  if (!verificarLoginParaCheckout()) {
    return;
  }
  
  // Desativa a validação nativa do navegador
  if (event && event.target && event.target.checkValidity) {
    event.stopPropagation();
  }
  
  console.log('🛒 Enviando pedido...');
  
  const cart = window.cart || JSON.parse(localStorage.getItem('cart') || '[]');
  
  // Verificar se carrinho está vazio
  if (cart.length === 0) {
    showNotification('Seu carrinho está vazio! Não é possível finalizar o pedido.', 'error');
    return;
  }
  
  // Verificar se o método de entrega foi selecionado
  const deliveryMethod = document.querySelector('input[name="delivery-method"]:checked');
  if (!deliveryMethod) {
    showNotification('Por favor, selecione um método de entrega', 'error');
    return;
  }
  
  const isDelivery = deliveryMethod.value === 'entrega';
  
  // Calcular totais corretamente
  let subtotal = 0;
  cart.forEach(item => {
    const priceString = (item.preco || '0').toString().replace(',', '.');
    const price = parseFloat(priceString);
    const quantity = item.quantidade || item.quantity || 1;
    subtotal += price * quantity;
  });
  
  // Validar campos obrigatórios
  let isValid = true;
  const requiredFields = ['checkout-nome', 'checkout-email', 'checkout-telefone'];
  
  // Se for entrega, adiciona os campos de endereço obrigatórios
  if (isDelivery) {
    requiredFields.push('checkout-cep', 'checkout-rua', 'checkout-numero', 'checkout-bairro', 'checkout-cidade', 'checkout-estado');
  }
  
  // Primeiro, remove todas as classes de erro
  document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  
  // Valida cada campo
  for (const fieldId of requiredFields) {
    const field = document.getElementById(fieldId);
    if (field && !field.value.trim()) {
      field.classList.add('is-invalid');
      if (isValid) {
        // Rola até o primeiro campo inválido
        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const fieldName = field.placeholder || field.getAttribute('name') || fieldId.replace('checkout-', '');
        showNotification(`Por favor, preencha o campo ${fieldName}`, 'error');
        isValid = false;
      }
    }
  }
  
  if (!isValid) {
    return;
  }
  
  // Preparar objeto de cliente
  const cliente = {
    nome: document.getElementById('checkout-nome').value,
    email: document.getElementById('checkout-email').value,
    telefone: document.getElementById('checkout-telefone').value
  };

  // Preparar objeto de endereço ou retirada
  let endereco = null;
  let freteValor = 0;
  
  if (isDelivery) {
    endereco = {
      cep: document.getElementById('checkout-cep').value,
      rua: document.getElementById('checkout-rua').value,
      numero: document.getElementById('checkout-numero').value,
      complemento: document.getElementById('checkout-complemento').value,
      bairro: document.getElementById('checkout-bairro').value,
      cidade: document.getElementById('checkout-cidade').value,
      estado: document.getElementById('checkout-estado').value
    };
    freteValor = window.checkoutShipping || 0;
  } else {
    // Informações de retirada
    endereco = {
      tipo: 'retirada',
      endereco: 'SCLN 113 Bloco A Loja 02, Asa Norte, Brasília - DF',
      horario: 'Segunda a Sexta, das 9h às 18h',
      telefone: '(61) 3340-6740'
    };
    freteValor = 0;
  }

  const orderData = {
    codigo: generateOrderCode(),
    data: new Date().toISOString(),
    status: 'pendente',
    tipoEntrega: isDelivery ? 'entrega' : 'retirada',
    cliente: cliente,
    // Adicionar email direto no pedido para compatibilidade
    email: cliente.email,
    usuarioEmail: cliente.email,
    endereco: endereco,
    pagamento: document.querySelector('input[name="payment"]:checked').value,
    frete: {
      tipo: isDelivery ? 'uber' : 'retirada',
      valor: freteValor,
      distancia: isDelivery ? (window.checkoutDistance || 0) : 0,
      tempo: isDelivery ? (window.checkoutTime || 0) : 0
    },
    itens: cart,
    total: subtotal,
    totalComFrete: subtotal + freteValor
  };
  
  console.log('📋 Dados do pedido:', orderData);
  
  // Salvar pedido no localStorage
  const orders = JSON.parse(localStorage.getItem('pedidos') || '[]');
  console.log('📦 Pedidos antes de salvar:', orders.length);
  orders.push(orderData);
  localStorage.setItem('pedidos', JSON.stringify(orders));
  console.log('💾 Pedido salvo no localStorage! Total agora:', orders.length);
  console.log('📧 Email do cliente no pedido:', orderData.cliente.email);
  console.log('📧 Email do usuário logado:', JSON.parse(localStorage.getItem('usuarioLogado') || '{}').email);
  
  // Salvar pedido no Firebase
  if (typeof firebaseOrders !== 'undefined') {
    console.log('🔥 Salvando pedido no Firebase...');
    firebaseOrders.saveOrder(orderData)
      .then(result => {
        if (result.success) {
          console.log('✅ Pedido salvo no Firebase:', result.id);
        } else {
          console.error('❌ Erro ao salvar no Firebase:', result.error);
        }
      })
      .catch(error => {
        console.error('❌ Erro ao salvar no Firebase:', error);
      });
  } else {
    console.warn('⚠️ FirebaseOrders não disponível - pedido não salvo no Firebase');
  }
  
  // Limpar carrinho
  localStorage.removeItem('cart');
  window.cart = []; // Limpar carrinho global
  
  // Atualizar display
  updateCartDisplay();
  
  // Mostrar confirmação
  showOrderConfirmation(orderData);
  
  // Preparar mensagem para o WhatsApp
  let message = `*NOVO PEDIDO* - ${orderData.codigo}%0A%0A`;
  
  // Adicionar itens do pedido
  message += `*Itens do Pedido:*%0A`;
  orderData.itens.forEach(item => {
    const price = parseFloat((item.preco || '0').toString().replace(',', '.'));
    const total = price * (item.quantidade || 1);
    message += `- ${item.nome || 'Produto'} x${item.quantidade || 1} - R$ ${total.toFixed(2)}%0A`;
  });
  
  // Adicionar totais
  message += `%0A*Subtotal:* R$ ${orderData.total.toFixed(2)}%0A`;
  message += `*Frete:* R$ ${orderData.frete.valor.toFixed(2)}%0A`;
  message += `*Total:* R$ ${orderData.totalComFrete.toFixed(2)}%0A%0A`;
  
  // Adicionar dados do cliente
  message += `*Dados do Cliente*%0A`;
  message += `Nome: ${orderData.cliente.nome}%0A`;
  message += `Telefone: ${orderData.cliente.telefone}%0A`;
  message += `E-mail: ${orderData.cliente.email}%0A%0A`;
  
  // Adicionar endereço
  message += `*Endereço de Entrega*%0A`;
  message += `${orderData.endereco.rua}, ${orderData.endereco.numero}`;
  if (orderData.endereco.complemento) {
    message += ` - ${orderData.endereco.complemento}`;
  }
  message += `%0A${orderData.endereco.bairro} - ${orderData.endereco.cidade}/${orderData.endereco.estado}%0A`;
  message += `CEP: ${orderData.endereco.cep}%0A%0A`;
  
  // Adicionar método de pagamento
  message += `*Pagamento:* ${orderData.pagamento === 'pix' ? 'PIX' : orderData.pagamento === 'credit' ? 'Cartão de Crédito' : 'Boleto'}%0A`;
  message += `*Status:* ${orderData.status}%0A%0A`;
  
  // Adicionar link de confirmação
  message += `_Pedido recebido em ${new Date().toLocaleString()}_`;
  
  // Adicionar botão de WhatsApp na tela de confirmação
  const confirmationDiv = document.querySelector('#confirmation-page > div');
  if (confirmationDiv) {
    const whatsappNumber = '556133406740';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
    
    const whatsappButton = document.createElement('button');
    whatsappButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#25D366" style="vertical-align: middle; margin-right: 8px;">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.966-.273-.099-.471-.148-.67.15-.197.297-.767.963-.94 1.16-.173.199-.347.221-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.795-1.484-1.761-1.66-2.059-.173-.297-.018-.458.13-.606.136-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.549 4.142 1.595 5.945L0 24l6.335-1.652a11.882 11.882 0 005.723 1.47h.005c6.554 0 11.89-5.335 11.89-11.893 0-3.18-1.259-6.19-3.546-8.468z"/>
      </svg>
      Enviar Pedido pelo WhatsApp
    `;
    
    whatsappButton.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 15px;
      margin-top: 15px;
      background: #25D366;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    
    whatsappButton.onmouseover = () => {
      whatsappButton.style.background = '#128C7E';
    };
    
    whatsappButton.onmouseout = () => {
      whatsappButton.style.background = '#25D366';
    };
    
    whatsappButton.onclick = (e) => {
      e.preventDefault();
      window.open(whatsappUrl, '_blank');
    };
    
    // Adicionar o botão antes do botão de continuar comprando
    const continueButton = confirmationDiv.querySelector('button');
    if (continueButton) {
      continueButton.parentNode.insertBefore(whatsappButton, continueButton.nextSibling);
    }
  }
  
  console.log('✅ Pedido gerado com sucesso:', orderData);
}

function generateOrderCode() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PED${timestamp.slice(-6)}${random}`;
}

function showOrderConfirmation(orderData) {
  // Criar página de confirmação
  const confirmationPage = document.createElement('div');
  confirmationPage.id = 'confirmation-page';
  confirmationPage.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #f8fafc;
    font-family: 'Inter', sans-serif;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 10000;
  `;
  
  confirmationPage.innerHTML = `
    <div style="
      background: white;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 500px;
      margin: 20px;
    ">
      <div style="
        width: 80px;
        height: 80px;
        background: #10b981;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px auto;
      ">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      
      <h1 style="margin: 0 0 10px 0; color: #1f2937; font-size: 28px;">Pedido Confirmado!</h1>
      <p style="margin: 0 0 30px 0; color: #6b7280; font-size: 16px;">Seu pedido foi recebido com sucesso</p>
      
      <div style="
        background: #f3f4f6;
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 30px;
        text-align: left;
      ">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #6b7280;">Código do Pedido:</span>
          <span style="color: #1f2937; font-weight: 600;">${orderData.codigo}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #6b7280;">Status:</span>
          <span style="color: #f59e0b; font-weight: 600;">Aguardando Confirmação</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #6b7280;">Total:</span>
          <span style="color: #1f2937; font-weight: 600;">R$ ${orderData.totalComFrete.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #6b7280;">Entrega estimada:</span>
          <span style="color: #1f2937; font-weight: 600;">${orderData.frete.tempo} minutos</span>
        </div>
      </div>
      
      <div style="display: grid; gap: 10px;">
        <button onclick="goToHomePage()" style="
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        " onmouseover="this.style.background='linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'" onmouseout="this.style.background='linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'">
          Continuar Comprando
        </button>
        
        <button onclick="viewOrders()" style="
          width: 100%;
          padding: 15px;
          background: white;
          color: #3b82f6;
          border: 2px solid #3b82f6;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        " onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
          Meus Pedidos
        </button>
      </div>
    </div>
  `;
  
  // Esconder checkout e mostrar confirmação
  document.getElementById('checkout-page').style.display = 'none';
  document.body.appendChild(confirmationPage);
}

function backToCart() {
  // Esconder checkout
  const checkoutPage = document.getElementById('checkout-page');
  if (checkoutPage) {
    checkoutPage.style.display = 'none';
  }
  
  // Mostrar carrinho
  toggleCart();
}

function viewOrders() {
  console.log('🚀 viewOrders() chamada - navegando para pedidos');
  
  // Esconder página de confirmação se estiver ativa
  const confirmationPage = document.getElementById('confirmation-page');
  if (confirmationPage) {
    console.log('🗑️ Removendo página de confirmação');
    confirmationPage.remove();
  }
  
  closeUserMenu();
  navigateToOrdersPage();
}

// === SPA DE FINALIZAÇÃO DE PEDIDO ===
function navigateToCheckout() {
  console.log('🛒 Navegando para checkout...');
  
  // Verificar se usuário está logado
  if (!verificarLoginParaCheckout()) {
    return;
  }
  
  // Verificar se o carrinho está vazio
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  console.log('📦 Carrinho encontrado:', cart);
  console.log('📊 Quantidade de itens:', cart.length);
  
  if (cart.length === 0) {
    showNotification('Seu carrinho está vazio! Adicione produtos antes de finalizar.', 'error');
    return;
  }
  
  // Esconder conteúdo atual
  const mainContent = document.querySelector('main') || document.body;
  if (mainContent) {
    mainContent.style.display = 'none';
  }
  
  // Fechar carrinho se estiver aberto
  const cartOverlay = document.getElementById('cartOverlay');
  if (cartOverlay && cartOverlay.classList.contains('active')) {
    cartOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
  
  // Criar página de checkout SPA
  createCheckoutPage();
}

function createCheckoutPage() {
  // Verificar se já existe
  if (document.getElementById('checkout-page')) {
    document.getElementById('checkout-page').style.display = 'block';
    return;
  }
  
  // Criar container da página de checkout
  const checkoutPage = document.createElement('div');
  checkoutPage.id = 'checkout-page';
  checkoutPage.style.cssText = `
    display: block;
    min-height: 100vh;
    padding: 20px;
    background: #f8fafc;
    font-family: 'Inter', sans-serif;
  `;
  
  checkoutPage.innerHTML = `
    <div class="checkout-container" style="max-width: 1200px; margin: 0 auto;">
      <!-- Header da página -->
      <div class="checkout-header" style="
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        margin-bottom: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
      ">
        <div>
          <h1 style="margin: 0; color: #1f2937; font-size: 24px;">Finalizar Pedido</h1>
          <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">Preencha seus dados para concluir a compra</p>
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button onclick="backToCart()" style="
            padding: 10px 20px;
            background: #6b7280;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s ease;
          " onmouseover="this.style.background='#4b5563'" onmouseout="this.style.background='#6b7280'">
            ← Voltar ao Carrinho
          </button>
        </div>
      </div>
      
      <!-- Conteúdo principal do checkout -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <!-- Formulário de dados -->
        <div class="checkout-form" style="
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        ">
          <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px;">Dados do Cliente</h2>
          
          <form id="checkout-form" onsubmit="submitOrder(event)" novalidate>
            <!-- Dados Pessoais -->
            <div style="margin-bottom: 25px;">
              <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 16px; font-weight: 600;">Dados Pessoais</h3>
              
              <div style="display: grid; gap: 15px;">
                <div>
                  <label style="display: block; margin-bottom: 5px; color: #374151; font-weight: 500;">Nome Completo *</label>
                  <input type="text" id="checkout-nome" required style="
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 14px;
                    transition: all 0.2s ease;
                  " onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#e5e7eb'">
                </div>
                
                <div>
                  <label style="display: block; margin-bottom: 5px; color: #374151; font-weight: 500;">E-mail *</label>
                  <input type="email" id="checkout-email" required style="
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 14px;
                    transition: all 0.2s ease;
                  " onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#e5e7eb'">
                </div>
                
                <div>
                  <label style="display: block; margin-bottom: 5px; color: #374151; font-weight: 500;">Telefone *</label>
                  <input type="tel" id="checkout-telefone" required placeholder="(61) 99999-9999" style="
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 14px;
                    transition: all 0.2s ease;
                  " onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#e5e7eb'">
                </div>
              </div>
            </div>
            
            <!-- Tipo de Entrega -->
            <div style="margin-bottom: 25px;">
              <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 16px; font-weight: 600;">Tipo de Entrega</h3>
              
              <div style="display: grid; gap: 10px; margin-bottom: 20px;">
                <label style="display: flex; align-items: center; padding: 15px; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.borderColor='#3b82f6'" onmouseout="if(!document.getElementById('delivery-method-retirada').checked) this.style.borderColor='#e5e7eb'">
                  <input type="radio" id="delivery-method-entrega" name="delivery-method" value="entrega" checked required style="margin-right: 10px;" onchange="toggleDeliveryFields(true)">
                  <span style="color: #374151;">🚚 Entrega por Aplicativo</span>
                </label>
                
                <label style="display: flex; align-items: center; padding: 15px; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.borderColor='#3b82f6'" onmouseout="if(!document.getElementById('delivery-method-entrega').checked) this.style.borderColor='#e5e7eb'">
                  <input type="radio" id="delivery-method-retirada" name="delivery-method" value="retirada" required style="margin-right: 10px;" onchange="toggleDeliveryFields(false)">
                  <span style="color: #374151;">🏠 Retirada na Loja</span>
                </label>
              </div>
              
              <div id="endereco-entrega" style="margin-top: 20px;">
                <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 16px; font-weight: 600;">Endereço de Entrega</h3>
              
              <div style="display: grid; gap: 15px;">
                <div>
                  <label style="display: block; margin-bottom: 5px; color: #374151; font-weight: 500;">CEP *</label>
                  <input type="text" id="checkout-cep" required maxlength="9" placeholder="00000-000" style="
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 14px;
                    transition: all 0.2s ease;
                  " oninput="formatCEP(this); calculateUberShipping(this.value)" onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#e5e7eb'">
                </div>
                
                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 15px;">
                  <div>
                    <label style="display: block; margin-bottom: 5px; color: #374151; font-weight: 500;">Rua *</label>
                    <input type="text" id="checkout-rua" required style="
                      width: 100%;
                      padding: 12px;
                      border: 2px solid #e5e7eb;
                      border-radius: 8px;
                      font-size: 14px;
                      transition: all 0.2s ease;
                    " onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#e5e7eb'">
                  </div>
                  
                  <div>
                    <label style="display: block; margin-bottom: 5px; color: #374151; font-weight: 500;">Número *</label>
                    <input type="text" id="checkout-numero" required style="
                      width: 100%;
                      padding: 12px;
                      border: 2px solid #e5e7eb;
                      border-radius: 8px;
                      font-size: 14px;
                      transition: all 0.2s ease;
                    " onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#e5e7eb'">
                  </div>
                </div>
                
                <div>
                  <label style="display: block; margin-bottom: 5px; color: #374151; font-weight: 500;">Complemento</label>
                  <input type="text" id="checkout-complemento" placeholder="Apto, casa, etc." style="
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 14px;
                    transition: all 0.2s ease;
                  " onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#e5e7eb'">
                </div>
                
                <div>
                  <label style="display: block; margin-bottom: 5px; color: #374151; font-weight: 500;">Bairro *</label>
                  <input type="text" id="checkout-bairro" required style="
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 14px;
                    transition: all 0.2s ease;
                  " onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#e5e7eb'">
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div>
                    <label style="display: block; margin-bottom: 5px; color: #374151; font-weight: 500;">Cidade *</label>
                    <input type="text" id="checkout-cidade" required style="
                      width: 100%;
                      padding: 12px;
                      border: 2px solid #e5e7eb;
                      border-radius: 8px;
                      font-size: 14px;
                      transition: all 0.2s ease;
                    " onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#e5e7eb'">
                  </div>
                  
                  <div>
                    <label style="display: block; margin-bottom: 5px; color: #374151; font-weight: 500;">Estado *</label>
                    <input type="text" id="checkout-estado" required maxlength="2" placeholder="DF" style="
                      width: 100%;
                      padding: 12px;
                      border: 2px solid #e5e7eb;
                      border-radius: 8px;
                      font-size: 14px;
                      transition: all 0.2s ease;
                    " onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#e5e7eb'">
                  </div>
                </div>
              </div>
              </div>
              
              <div id="endereco-retirada" style="display: none; margin-top: 20px; background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0;">
                <h3 style="margin: 0 0 10px 0; color: #166534; font-size: 16px; font-weight: 600;">Informações para Retirada</h3>
                <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.5;">
                  Endereço: SCLN 113 Bloco A Loja 02, Asa Norte, Brasília - DF<br>
                  Horário de Funcionamento: Segunda a Sexta, das 9h às 18h<br>
                  Telefone: (61) 3340-6740
                </p>
              </div>
            </div>
            
            <!-- Método de Pagamento -->
            <div style="margin-bottom: 25px;">
              <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 16px; font-weight: 600;">Método de Pagamento</h3>
              
              <div style="display: grid; gap: 10px;">
                <label style="display: flex; align-items: center; padding: 15px; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.borderColor='#3b82f6'" onmouseout="this.style.borderColor='#e5e7eb'">
                  <input type="radio" name="payment" value="pix" required style="margin-right: 10px;">
                  <span style="color: #374151;">📱 PIX</span>
                </label>
                
                <label style="display: flex; align-items: center; padding: 15px; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.borderColor='#3b82f6'" onmouseout="this.style.borderColor='#e5e7eb'">
                  <input type="radio" name="payment" value="cartao" required style="margin-right: 10px;">
                  <span style="color: #374151;">💳 Cartão de Crédito/Débito</span>
                </label>
                
                <label style="display: flex; align-items: center; padding: 15px; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.borderColor='#3b82f6'" onmouseout="this.style.borderColor='#e5e7eb'">
                  <input type="radio" name="payment" value="dinheiro" required style="margin-right: 10px;">
                  <span style="color: #374151;">💵 Dinheiro</span>
                </label>
              </div>
            </div>
            
            <button type="submit" style="
              width: 100%;
              padding: 15px;
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
            " onmouseover="this.style.background='linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'" onmouseout="this.style.background='linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'">
              Finalizar Pedido
            </button>
          </form>
        </div>
        
        <!-- Resumo do Pedido -->
        <div class="checkout-summary" style="
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          height: fit-content;
        ">
          <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px;">Resumo do Pedido</h2>
          
          <div id="checkout-items" style="margin-bottom: 20px;">
            <!-- Items serão inseridos aqui -->
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #6b7280;">Subtotal:</span>
              <span id="checkout-subtotal" style="color: #374151; font-weight: 500;">R$ 0,00</span>
            </div>
            
            <div id="frete-container" style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #6b7280;">Frete UBER:</span>
              <span id="checkout-shipping" style="color: #374151; font-weight: 500;">Calculando...</span>
            </div>
            <div id="retirada-container" style="display: none; justify-content: space-between; margin-bottom: 10px; color: #10b981; font-weight: 500;">
              <span>Retirada na Loja</span>
              <span>Grátis</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
              <span style="color: #6b7280;">Desconto:</span>
              <span id="checkout-discount" style="color: #10b981; font-weight: 500;">-R$ 0,00</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; padding-top: 15px; border-top: 2px solid #e5e7eb;">
              <span style="color: #1f2937; font-weight: 600; font-size: 18px;">Total:</span>
              <span id="checkout-total" style="color: #1f2937; font-weight: 600; font-size: 18px;">R$ 0,00</span>
            </div>
            
            <div id="uber-info" style="
              background: #fef3c7;
              border: 1px solid #fbbf24;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 20px;
              display: none;
            ">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="margin-right: 8px;">🚗</span>
                <span style="color: #92400e; font-weight: 600;">Entrega via UBER</span>
              </div>
              <p style="margin: 0; color: #78350f; font-size: 14px;">
                Tempo estimado: <span id="uber-time">--</span> minutos<br>
                Distância: <span id="uber-distance">--</span> km
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Adicionar ao body
  document.body.appendChild(checkoutPage);
  
  // Função para alternar entre campos de entrega e retirada
  window.toggleDeliveryFields = function(isDelivery) {
    document.getElementById('endereco-entrega').style.display = isDelivery ? 'block' : 'none';
    document.getElementById('endereco-retirada').style.display = isDelivery ? 'none' : 'block';
    document.getElementById('frete-container').style.display = isDelivery ? 'flex' : 'none';
    document.getElementById('retirada-container').style.display = isDelivery ? 'none' : 'flex';
    
    // Atualiza o total sem frete se for retirada
    if (!isDelivery) {
      updateCheckoutTotal(0);
    } else {
      // Recalcula o frete se voltar para entrega
      const cep = document.getElementById('checkout-cep').value;
      if (cep && cep.length === 9) {
        calculateUberShipping(cep);
      }
    }
  };
  
  // Preencher dados do usuário logado se existir
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  if (usuarioLogado) {
    const usuario = JSON.parse(usuarioLogado);
    console.log('👤 Preenchendo dados do usuário logado:', usuario);
    
    // Preencher campos do formulário
    const nomeField = document.getElementById('checkout-nome');
    const emailField = document.getElementById('checkout-email');
    const telefoneField = document.getElementById('checkout-telefone');
    
    if (nomeField && usuario.nome) nomeField.value = usuario.nome;
    if (emailField && usuario.email) emailField.value = usuario.email;
    if (telefoneField && usuario.telefone) telefoneField.value = usuario.telefone;
  }
  
  // Carregar resumo do carrinho
  loadCheckoutSummary();
  
  // Inicializar estado dos campos de endereço (entrega selecionada por padrão)
  toggleDeliveryFields(true);
  
  console.log('✅ Página de checkout criada via SPA');
  
}

// Função para alternar campos de endereço baseado no tipo de entrega
function toggleDeliveryFields(isDelivery) {
  const enderecoFields = document.getElementById('endereco-entrega');
  if (enderecoFields) {
    if (isDelivery) {
      enderecoFields.style.display = 'block';
      // Adiciona atributo required aos campos de endereço
      const enderecoInputs = enderecoFields.querySelectorAll('input');
      enderecoInputs.forEach(input => {
        if (!input.hasAttribute('data-optional')) {
          input.setAttribute('required', '');
        }
      });
    } else {
      enderecoFields.style.display = 'none';
      // Remove atributo required dos campos de endereço
      const enderecoInputs = enderecoFields.querySelectorAll('input');
      enderecoInputs.forEach(input => {
        input.removeAttribute('required');
      });
    }
  }
}

// === NAVEGAÇÃO SPA ===
function navigateToOrdersPage() {
  console.log('📦 Navegando para página de pedidos...');
  
  // Esconder página de confirmação se estiver ativa
  const confirmationPage = document.getElementById('confirmation-page');
  if (confirmationPage) {
    confirmationPage.remove();
  }
  
  // Esconder conteúdo atual
  const mainContent = document.querySelector('main') || document.body;
  if (mainContent) {
    mainContent.style.display = 'none';
  }
  
  // Criar página de pedidos SPA
  createOrdersPage();
}

function createOrdersPage() {
  // Verificar se já existe
  if (document.getElementById('orders-page')) {
    document.getElementById('orders-page').style.display = 'block';
    // Carregar pedidos mesmo que a página já exista
    loadUserOrders();
    return;
  }
  
  // Criar container da página de pedidos
  const ordersPage = document.createElement('div');
  ordersPage.id = 'orders-page';
  ordersPage.style.cssText = `
    display: block;
    min-height: 100vh;
    padding: 20px;
    background: #f8fafc;
    font-family: 'Inter', sans-serif;
  `;
  
  ordersPage.innerHTML = `
    <div class="orders-container" style="max-width: 1200px; margin: 0 auto;">
      <!-- Header da página -->
      <div class="orders-header" style="
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        margin-bottom: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
      ">
        <div>
          <h1 style="margin: 0; color: #1f2937; font-size: 24px;">Meus Pedidos</h1>
          <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">Acompanhe seus pedidos e histórico</p>
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button onclick="backToMainPage()" style="
            padding: 10px 20px;
            background: #6b7280;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s ease;
          " onmouseover="this.style.background='#4b5563'" onmouseout="this.style.background='#6b7280'">
            ← Voltar
          </button>
          <button onclick="goToHomePage()" style="
            padding: 10px 20px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s ease;
          " onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">
            🏠 Página Inicial
          </button>
        </div>
      </div>
      
      <!-- Conteúdo principal - Lista de Pedidos -->
      <div class="orders-content" style="
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        min-height: 400px;
      ">
        <div id="orders-list-container">
          <!-- Pedidos serão carregados aqui -->
        </div>
      </div>
    </div>
  `;
  
  // Adicionar ao body
  document.body.appendChild(ordersPage);
  
  console.log('✅ Página de pedidos criada via SPA');
  
  // Carregar pedidos do usuário
  setTimeout(() => {
    console.log('🚀 Executando loadUserOrders()...');
    loadUserOrders();
  }, 200); // Aumentado para 200ms para garantir atualização do localStorage
}

function loadUserOrders() {
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  
  console.log('📋 Carregando pedidos do usuário...');
  console.log('👤 Usuário logado:', usuarioLogado);
  
  if (!usuarioLogado) {
    console.log('❌ Usuário não está logado');
    displayEmptyOrders('Você precisa estar logado para ver seus pedidos.');
    return;
  }
  
  const usuario = JSON.parse(usuarioLogado);
  console.log('👤 Dados do usuário:', usuario);
  console.log('📧 Email do usuário:', usuario.email);
  
  // Carregar pedidos do Firebase se disponível
  if (typeof firebaseOrders !== 'undefined') {
    console.log('🔥 Carregando pedidos do Firebase...');
    firebaseOrders.getAllOrders()
      .then(result => {
        if (result.success) {
          console.log('📦 Pedidos do Firebase:', result.orders);
          
          // Filtrar pedidos do usuário atual
          const userOrders = result.orders.filter(order => {
            console.log('🔍 Verificando pedido:', order);
            console.log('📧 Email do pedido (cliente.email):', order.cliente?.email);
            console.log('📧 Email do pedido (email):', order.email);
            console.log('📧 Email do pedido (usuarioEmail):', order.usuarioEmail);
            console.log('📧 Email do usuário:', usuario.email);
            
            const match = order.cliente?.email === usuario.email || 
                         order.email === usuario.email ||
                         order.usuarioEmail === usuario.email;
            
            console.log('✅ Match:', match);
            
            // Se for um dos seus pedidos, mostrar detalhes completos
            if (match) {
              console.log('🎯 PEDIDO ENCONTRADO:', order);
            }
            
            return match;
          });
          
          console.log('📊 Pedidos do usuário filtrados:', userOrders);
          console.log('📊 Quantidade de pedidos:', userOrders.length);
          
          // Carregar pedidos na página
          displayOrders(userOrders);
        } else {
          console.error('❌ Erro ao carregar pedidos do Firebase:', result.error);
          // Fallback para localStorage
          loadUserOrdersFromLocalStorage(usuario);
        }
      })
      .catch(error => {
        console.error('❌ Erro ao carregar pedidos do Firebase:', error);
        // Fallback para localStorage
        loadUserOrdersFromLocalStorage(usuario);
      });
  } else {
    console.warn('⚠️ FirebaseOrders não disponível - usando localStorage');
    // Fallback para localStorage
    loadUserOrdersFromLocalStorage(usuario);
  }
}

function loadUserOrdersFromLocalStorage(usuario) {
  // Buscar pedidos do localStorage
  const allOrders = JSON.parse(localStorage.getItem('pedidos') || '[]');
  console.log('📦 Todos os pedidos do localStorage:', allOrders);
  
  console.log('📋 Carregando pedidos do usuário do localStorage...');
  console.log('👤 Usuário:', usuario);
  
  // Filtrar pedidos do usuário atual
  const userOrders = allOrders.filter(order => {
    console.log('🔍 Verificando pedido:', order);
    console.log('📧 Email do pedido (cliente.email):', order.cliente?.email);
    console.log('📧 Email do pedido (email):', order.email);
    console.log('📧 Email do pedido (usuarioEmail):', order.usuarioEmail);
    console.log('📧 Email do usuário:', usuario.email);
    
    const match = order.cliente?.email === usuario.email || 
                 order.email === usuario.email ||
                 order.usuarioEmail === usuario.email;
    
    console.log('✅ Match:', match);
    
    // Se for um dos seus pedidos, mostrar detalhes completos
    if (match) {
      console.log('🎯 PEDIDO ENCONTRADO:', order);
    }
    
    return match;
  });
  
  console.log('📊 Pedidos do usuário filtrados:', userOrders);
  console.log('📊 Quantidade de pedidos:', userOrders.length);
  
  // Carregar pedidos na página
  displayOrders(userOrders);
}

function displayOrders(orders) {
  const container = document.getElementById('orders-list-container');
  
  console.log('📋 Exibindo pedidos...');
  console.log('📦 Container encontrado:', container);
  console.log('📊 Pedidos para exibir:', orders);
  
  if (!container) {
    console.log('❌ Container de pedidos não encontrado');
    return;
  }
  
  if (orders.length === 0) {
    console.log('❌ Nenhum pedido encontrado');
    displayEmptyOrders('Você ainda não tem nenhum pedido.');
    return;
  }
  
  // Ordenar pedidos por data (mais recente primeiro)
  orders.sort((a, b) => new Date(b.data) - new Date(a.data));
  
  const ordersHTML = orders.map(order => createOrderCard(order)).join('');
  console.log('📋 HTML dos pedidos gerado:', ordersHTML);
  
  container.innerHTML = `
    <div style="display: grid; gap: 15px;">
      ${ordersHTML}
    </div>
  `;
  
  console.log(`✅ ${orders.length} pedidos exibidos`);
  console.log('📋 Conteúdo final do container:', container.innerHTML);
}

function createOrderCard(order) {
  const orderDate = new Date(order.data).toLocaleDateString('pt-BR');
  const orderTime = new Date(order.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  // Verificar se tem frete, senão usar valores padrão
  const freteTipo = order.frete?.tipo || 'padrão';
  const freteValor = order.frete?.valor || 0;
  const totalComFrete = order.totalComFrete || order.total || 0;
  
  return `
    <div style="
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      background: white;
      transition: all 0.2s ease;
    " onmouseover="this.style.borderColor='#3b82f6'; this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.1)'" onmouseout="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none'">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
        <div>
          <h3 style="margin: 0 0 5px 0; color: #1f2937; font-size: 16px; font-weight: 600;">${order.codigo || order.id}</h3>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">${orderDate} às ${orderTime}</p>
        </div>
        <div style="
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          background: ${getStatusColor(order.status)};
          color: white;
        ">
          ${getStatusText(order.status)}
        </div>
      </div>
      
      <div style="display: grid; gap: 8px; margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #6b7280; font-size: 14px;">Itens:</span>
          <span style="color: #374151; font-weight: 500;">${order.itens?.length || 0} produto(s)</span>
        </div>
        
        <!-- Mostrar nomes dos produtos -->
        ${order.itens && order.itens.length > 0 ? `
        <div style="margin-top: 8px;">
          <span style="color: #6b7280; font-size: 14px; display: block; margin-bottom: 4px;">Produtos:</span>
          <div style="color: #374151; font-size: 13px; line-height: 1.4;">
            ${order.itens.map((item, index) => 
              `<div style="padding: 2px 0; border-bottom: ${index < order.itens.length - 1 ? '1px solid #f3f4f6' : 'none'};">
                • ${item.nome || item.produto || 'Produto sem nome'} 
                <span style="color: #6b7280;">(Qtd: ${item.quantidade || item.quantity || 1})</span>
              </div>`
            ).join('')}
          </div>
        </div>
        ` : ''}
        
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #6b7280; font-size: 14px;">Frete:</span>
          <span style="color: #374151; font-weight: 500;">${freteTipo.toUpperCase()} - R$ ${freteValor.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #6b7280; font-size: 14px;">Total:</span>
          <span style="color: #1f2937; font-weight: 600; font-size: 16px;">R$ ${totalComFrete.toFixed(2)}</span>
        </div>
      </div>
      
      ${order.endereco ? `
      <div style="padding-top: 15px; border-top: 1px solid #f3f4f6;">
        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
          <strong>Entrega:</strong> ${order.endereco.rua}, ${order.endereco.numero} - ${order.endereco.bairro}, ${order.endereco.cidade}/${order.endereco.estado}
        </p>
      </div>
      ` : ''}
      
      ${order.status === 'pendente' ? `
      <div style="padding-top: 15px; border-top: 1px solid #f3f4f6; display: flex; gap: 10px;">
        <button onclick="cancelOrder('${order.codigo || order.id}')" style="
          padding: 8px 16px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        " onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">
          ❌ Cancelar Pedido
        </button>
      </div>
      ` : ''}
    </div>
  `;
}

function cancelOrder(orderCode) {
  console.log('🚀 cancelOrder() chamada com orderCode:', orderCode);
  
  // Criar um ID único para o botão de cancelamento
  const cancelButtonId = `cancel-button-${orderCode}`;
  const cancelButton = document.querySelector(`button[onclick*="${orderCode}"]`);
  const originalButtonHTML = cancelButton ? cancelButton.outerHTML : null;
  
  // Mostrar confirmação personalizada
  const confirmationModal = `
    <div id="cancelConfirmationModal" style="
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(0,0,0,0.5); display: flex; justify-content: center; 
      align-items: center; z-index: 1000;">
      <div style="background: white; padding: 24px; border-radius: 8px; 
      max-width: 400px; width: 90%; text-align: center;">
        <h3 style="margin-top: 0; color: #1f2937;">Cancelar Pedido</h3>
        <p>Tem certeza que deseja cancelar o pedido <strong>${orderCode}</strong>?</p>
        <p style="color: #6b7280; font-size: 14px;">Esta ação não pode ser desfeita.</p>
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 24px;">
          <button id="confirmCancelBtn" style="
            padding: 8px 16px; background: #ef4444; color: white; 
            border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
            Sim, cancelar pedido
          </button>
          <button id="cancelCancelBtn" style="
            padding: 8px 16px; background: #e5e7eb; color: #4b5563; 
            border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
            Manter pedido
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Injetar o modal no DOM
  document.body.insertAdjacentHTML('beforeend', confirmationModal);
  const modal = document.getElementById('cancelConfirmationModal');
  
  // Funções auxiliares
  const showLoading = () => {
    if (cancelButton) {
      cancelButton.disabled = true;
      cancelButton.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div> Cancelando...';
    }
  };
  
  const removeModal = () => modal && modal.parentNode && modal.parentNode.removeChild(modal);
  
  // Evento de confirmação
  document.getElementById('confirmCancelBtn').onclick = async () => {
    removeModal();
    showLoading();
    
    try {
      console.log('🔍 Buscando pedido com código:', orderCode);
      const allOrders = JSON.parse(localStorage.getItem('pedidos') || '[]');
      
      // Encontrar o índice do pedido específico usando o orderCode
      const orderIndex = allOrders.findIndex(order => {
        const orderIdMatch = String(order.id || '') === String(orderCode);
        const orderCodeMatch = String(order.codigo || '') === String(orderCode);
        console.log(`Verificando pedido - ID: ${order.id}, Código: ${order.codigo}, Procurado: ${orderCode}, Match: ${orderIdMatch || orderCodeMatch}`);
        return orderIdMatch || orderCodeMatch;
      });
      
      if (orderIndex === -1) throw new Error('Pedido não encontrado');
      
      console.log('📝 Pedido encontrado para cancelamento:', allOrders[orderIndex]);
      
      // Criar uma cópia do pedido para modificar
      const orderToUpdate = { ...allOrders[orderIndex] };
      
      // Atualizar status localmente
      orderToUpdate.status = 'cancelado';
      orderToUpdate.dataCancelamento = new Date().toISOString();
      
      // Atualizar apenas o pedido específico no array
      allOrders[orderIndex] = orderToUpdate;
      
      // Salvar de volta no localStorage
      localStorage.setItem('pedidos', JSON.stringify(allOrders));
      console.log('✅ Pedido atualizado no localStorage');
      
      // Atualizar Firebase
      if (typeof firebase !== 'undefined' && (orderToUpdate.id || orderToUpdate.codigo)) {
        console.log('🔥 Atualizando pedido no Firebase...');
        const db = firebase.firestore();
        
        try {
          // Primeiro, tentar atualizar pelo ID
          if (orderToUpdate.id) {
            await db.collection('orders').doc(orderToUpdate.id).update({
              status: 'cancelado',
              dataCancelamento: firebase.firestore.FieldValue.serverTimestamp(),
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log(`✅ Pedido ${orderToUpdate.id} atualizado no Firebase`);
          } 
          // Se não tiver ID ou se a atualização falhar, tentar pelo código
          if (orderToUpdate.codigo && (!orderToUpdate.id || orderToUpdate.id === orderToUpdate.codigo)) {
            const querySnapshot = await db.collection('orders')
              .where('codigo', '==', orderToUpdate.codigo)
              .limit(1)
              .get();
              
            if (!querySnapshot.empty) {
              const doc = querySnapshot.docs[0];
              await doc.ref.update({
                status: 'cancelado',
                dataCancelamento: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
              });
              console.log(`✅ Pedido ${doc.id} atualizado no Firebase usando busca por código`);
            }
          }
        } catch (firebaseError) {
          console.error('❌ Erro ao atualizar pedido no Firebase:', firebaseError);
          throw new Error('Não foi possível atualizar o pedido no servidor. O status foi atualizado localmente.');
        }
      }
      
      showNotification('Pedido cancelado com sucesso!', 'success');
      
      // Recarregar a lista de pedidos
      const usuario = JSON.parse(localStorage.getItem('usuarioLogado') || '{}');
      if (usuario && usuario.email) {
        console.log('🔄 Atualizando exibição dos pedidos...');
        const storedOrders = JSON.parse(localStorage.getItem('pedidos') || '[]');
        const userOrders = storedOrders.filter(order => 
          (order.cliente?.email === usuario.email) || 
          (order.email === usuario.email) || 
          (order.usuarioEmail === usuario.email)
        );
        console.log(`🔄 ${userOrders.length} pedidos encontrados para o usuário`);
        displayOrders(userOrders);
      }
      
      // Remover botão
      if (cancelButton) cancelButton.remove();
      
    } catch (error) {
      console.error('❌ Erro ao cancelar pedido:', error);
      showNotification(`Erro ao cancelar pedido: ${error.message}`, 'error');
      if (cancelButton) cancelButton.outerHTML = originalButtonHTML;
    }
  };
  
  // Evento de cancelamento
  document.getElementById('cancelCancelBtn').onclick = removeModal;
  
  // Fechar modal ao clicar fora
  modal.onclick = (e) => e.target === modal && removeModal();
  
  // Fechar com ESC
  const handleKeyDown = (e) => e.key === 'Escape' && (removeModal(), document.removeEventListener('keydown', handleKeyDown));
  document.addEventListener('keydown', handleKeyDown);
  
  // Recarregar a lista de pedidos do usuário
  const loadUserOrders = () => {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (usuarioLogado) {
      const usuario = JSON.parse(usuarioLogado);
      const storedOrders = JSON.parse(localStorage.getItem('pedidos') || '[]');
      const userOrders = storedOrders.filter(order => 
        (order.cliente?.email === usuario.email) || 
        (order.email === usuario.email) ||
        (order.usuarioEmail === usuario.email)
      );
      console.log('🔄 Recarregando pedidos do usuário:', userOrders.length);
      displayOrders(userOrders);
    }
  };
  
  // Carregar pedidos imediatamente
  loadUserOrders();
  
  // Notificar o painel admin sobre a mudança
  if (typeof firebase !== 'undefined') {
    console.log('📢 Notificando painel admin sobre a mudança de status');
    // Disparar um evento personalizado para notificar o painel admin
    const event = new CustomEvent('orderStatusChanged', {
      detail: { 
        orderCode: orderCode, 
        status: 'cancelado',
        timestamp: new Date().toISOString()
      }
    });
    window.dispatchEvent(event);
    
    // Função assíncrona para atualizar o Firebase
    const updateFirebaseStatus = async () => {
      try {
        const db = firebase.firestore();
        // Buscar o pedido pelo código para garantir que estamos atualizando o correto
        const querySnapshot = await db.collection('orders')
          .where('codigo', '==', orderCode)
          .limit(1)
          .get();
          
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          await doc.ref.update({
            status: 'cancelado',
            dataCancelamento: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          console.log(`✅ Pedido ${doc.id} atualizado no Firebase usando busca por código`);
        }
      } catch (error) {
        console.error('❌ Erro ao atualizar status no Firebase:', error);
      }
    };
    
    // Chamar a função assíncrona
    updateFirebaseStatus().catch(error => {
      console.error('❌ Erro ao executar atualização no Firebase:', error);
    });
  }
}

async function deleteAllOrders() {
  if (!confirm('⚠️ ATENÇÃO: Esta ação irá remover TODOS os pedidos do sistema. Tem certeza que deseja continuar?')) {
    console.log('Operação cancelada pelo usuário');
    return;
  }

  try {
    console.log('🚀 Iniciando exclusão de todos os pedidos...');
    
    // 1. Limpar pedidos do localStorage
    localStorage.removeItem('pedidos');
    console.log('✅ Pedidos removidos do localStorage');
    
    // 2. Remover do Firebase se estiver disponível
    if (typeof firebase !== 'undefined') {
      console.log('🔥 Conectando ao Firebase para remover pedidos...');
      const db = firebase.firestore();
      const batch = db.batch();
      const ordersRef = db.collection('orders');
      
      // Buscar todos os pedidos
      const snapshot = await ordersRef.get();
      
      // Adicionar cada pedido ao batch para exclusão
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Executar a exclusão em lote
      await batch.commit();
      console.log(`✅ ${snapshot.size} pedidos removidos do Firebase`);
    }
    
    // 3. Atualizar a interface
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado') || '{}');
    if (usuarioLogado && usuarioLogado.email) {
      // Se for admin, recarregar a página
      if (window.location.pathname.includes('admin')) {
        window.location.reload();
      } else {
        // Se for usuário normal, limpar a lista
        const ordersContainer = document.getElementById('orders-list-container');
        if (ordersContainer) {
          ordersContainer.innerHTML = '<p>Nenhum pedido encontrado.</p>';
        }
      }
    }
    
    showNotification('Todos os pedidos foram removidos com sucesso!', 'success');
    
  } catch (error) {
    console.error('❌ Erro ao excluir pedidos:', error);
    showNotification(`Erro ao excluir pedidos: ${error.message}`, 'error');
  }
}

// Adicionar ao escopo global
window.deleteAllOrders = deleteAllOrders;

// Função para limpar todos os pedidos do localStorage e do Firebase
async function clearAllOrders() {
  // Confirmar com o usuário antes de prosseguir
  const confirmDelete = confirm('⚠️ ATENÇÃO: Esta ação irá remover TODOS os pedidos do sistema.\n\nIsso inclui:\n✅ Todos os pedidos do localStorage\n✅ Todos os pedidos do Firebase\n\nTem certeza que deseja continuar?');
  
  if (!confirmDelete) {
    console.log('Operação de limpeza cancelada pelo usuário');
    return { success: false, message: 'Operação cancelada' };
  }

  try {
    console.log('🚀 Iniciando limpeza de todos os pedidos...');
    
    // 1. Limpar pedidos do localStorage
    localStorage.removeItem('pedidos');
    console.log('✅ Pedidos removidos do localStorage');
    
    // 2. Limpar do Firebase se estiver disponível
    let firebaseCleared = false;
    if (typeof firebase !== 'undefined') {
      try {
        console.log('🔥 Conectando ao Firebase para remover pedidos...');
        const db = firebase.firestore();
        const batch = db.batch();
        const ordersRef = db.collection('orders');
        
        // Buscar todos os pedidos
        const snapshot = await ordersRef.get();
        
        if (snapshot.empty) {
          console.log('ℹ️ Nenhum pedido encontrado no Firebase para remoção');
        } else {
          // Adicionar cada pedido ao batch para exclusão
          snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          
          // Executar a exclusão em lote
          await batch.commit();
          console.log(`✅ ${snapshot.size} pedidos removidos do Firebase`);
          firebaseCleared = true;
        }
      } catch (firebaseError) {
        console.error('❌ Erro ao limpar pedidos do Firebase:', firebaseError);
        // Não interrompe o fluxo, continua para limpar o localStorage
      }
    }
    
    // 3. Atualizar a interface
    if (window.location.pathname.includes('admin.html')) {
      // Se estiver na página de admin, recarregar a lista
      if (window.loadOrders) {
        window.loadOrders();
      } else if (window.location.reload) {
        window.location.reload();
      }
    } else {
      // Se estiver na página de usuário, limpar a lista
      const ordersContainer = document.getElementById('orders-list-container');
      if (ordersContainer) {
        ordersContainer.innerHTML = '<p>Nenhum pedido encontrado.</p>';
      }
    }
    
    const message = 'Todos os pedidos foram removidos com sucesso!' + 
                   (firebaseCleared ? ' (LocalStorage e Firebase)' : ' (apenas LocalStorage)');
    
    showNotification(message, 'success');
    console.log('✅ Limpeza de pedidos concluída com sucesso');
    
    return { 
      success: true, 
      message: message,
      firebaseCleared: firebaseCleared
    };
    
  } catch (error) {
    console.error('❌ Erro ao limpar pedidos:', error);
    showNotification(`Erro ao limpar pedidos: ${error.message}`, 'error');
    return { 
      success: false, 
      message: `Erro: ${error.message}`,
      error: error
    };
  }
}

// Adicionar ao escopo global para acesso pelo console
try {
  window.clearAllOrders = clearAllOrders;
} catch (e) {
  console.error('Erro ao adicionar clearAllOrders ao escopo global:', e);
}

function getStatusText(status) {
  const statusMap = {
    'pendente': 'Aguardando Confirmação',
    'confirmado': 'Confirmado',
    'preparando': 'Preparando',
    'enviado': 'Enviado',
    'entregue': 'Entregue',
    'cancelado': 'Cancelado'
  };
  return statusMap[status] || status;
}

function getStatusColor(status) {
  const colorMap = {
    'pendente': '#f59e0b',
    'confirmado': '#3b82f6',
    'preparando': '#8b5cf6',
    'enviado': '#06b6d4',
    'entregue': '#10b981',
    'cancelado': '#ef4444'
  };
  return colorMap[status] || '#6b7280';
}

function displayEmptyOrders(message) {
  const container = document.getElementById('orders-list-container');
  if (!container) return;
  
  container.innerHTML = `
    <div style="text-align: center; padding: 60px 20px; color: #6b7280;">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 16px auto; opacity: 0.5;">
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
      <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #374151;">${message}</h3>
      <p style="margin: 8px 0 0 0; font-size: 14px;">Adicione produtos ao carrinho e finalize seu primeiro pedido!</p>
    </div>
  `;
}

function backToMainPage() {
  console.log('🔙 Voltando para página principal...');
  
  // Esconder página de pedidos
  const ordersPage = document.getElementById('orders-page');
  if (ordersPage) {
    ordersPage.style.display = 'none';
  }
  
  // Mostrar conteúdo principal
  const mainContent = document.querySelector('main') || document.body;
  if (mainContent) {
    mainContent.style.display = 'block';
  }
}

function goToHomePage() {
  console.log('🏠 Indo para página inicial...');
  
  // Esconder página de pedidos
  const ordersPage = document.getElementById('orders-page');
  if (ordersPage) {
    ordersPage.style.display = 'none';
  }
  
  // Mostrar conteúdo principal
  const mainContent = document.querySelector('main') || document.body;
  if (mainContent) {
    mainContent.style.display = 'block';
  }
  
  // Resetar para categoria inicial
  if (typeof showCategory === 'function') {
    showCategory('inicio');
  }
  
  // Resetar navegação
  resetNavigation();
}

function resetNavigation() {
  // Esconder qualquer página SPA ativa
  const spaPages = ['orders-page', 'checkout-page', 'confirmation-page'];
  spaPages.forEach(pageId => {
    const page = document.getElementById(pageId);
    if (page) {
      page.style.display = 'none';
    }
  });
  
  // Remover página de confirmação se existir
  const confirmationPage = document.getElementById('confirmation-page');
  if (confirmationPage) {
    confirmationPage.remove();
  }
  
  // Mostrar conteúdo principal
  const mainContent = document.querySelector('main') || document.body;
  if (mainContent) {
    mainContent.style.display = 'block';
  }
  
  // Resetar header e navegação
  const header = document.querySelector('.modern-header');
  if (header) {
    header.style.display = 'block';
  }
  
  console.log('✅ Navegação resetada para página inicial');
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
    
    // Carregar avaliações do usuário logado
    loadUserReviews();
  }
}

function closeReviewsModal() {
  const overlay = document.getElementById('reviewsModalOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

// Função para carregar avaliações do usuário
function loadUserReviews() {
  console.log('🔍 Carregando avaliações do usuário...');
  
  // Obter usuário logado
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  if (!usuarioLogado) {
    console.log('❌ Usuário não está logado');
    showEmptyReviewsState('Faça login para ver suas avaliações');
    return;
  }
  
  let usuario;
  try {
    usuario = JSON.parse(usuarioLogado);
    console.log('👤 Usuário logado:', usuario.email);
  } catch (e) {
    console.error('❌ Erro ao parsear usuário:', e);
    showEmptyReviewsState('Erro ao carregar dados do usuário');
    return;
  }
  
  // Carregar todas as avaliações
  const stored = localStorage.getItem('primos_reviews');
  if (!stored) {
    console.log('📋 Nenhuma avaliação encontrada no sistema');
    showEmptyReviewsState('Você ainda não avaliou nenhum produto');
    return;
  }
  
  let allReviews;
  try {
    allReviews = JSON.parse(stored);
    console.log('📊 Total de avaliações no sistema:', allReviews.length);
    console.log('📋 Todas as avaliações:', allReviews);
  } catch (e) {
    console.error('❌ Erro ao carregar avaliações:', e);
    showEmptyReviewsState('Erro ao carregar avaliações');
    return;
  }
  
  // Filtrar avaliações do usuário
  console.log('🔍 Filtrando avaliações para o usuário:', usuario.email);
  console.log('🔍 Nome do usuário:', usuario.nome);
  
  const userReviews = allReviews.filter(review => {
    const matchEmail = review.userEmail === usuario.email;
    const matchName = review.userName && review.userName.includes(usuario.nome);
    console.log(`📝 Avaliação ${review.id}: email="${review.userEmail}" -> ${matchEmail}, name="${review.userName}" -> ${matchName}`);
    return matchEmail || matchName;
  });
  
  console.log('📝 Avaliações do usuário encontradas:', userReviews.length);
  console.log('📋 Avaliações filtradas:', userReviews);
  
  if (userReviews.length === 0) {
    showEmptyReviewsState('Você ainda não avaliou nenhum produto');
    return;
  }
  
  // Exibir avaliações do usuário
  displayUserReviews(userReviews, usuario);
}

// Função para exibir estado vazio
function showEmptyReviewsState(message) {
  const content = document.querySelector('.reviews-modal-content');
  if (!content) return;
  
  content.innerHTML = `
    <div class="empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
      <h4>Nenhuma avaliação encontrada</h4>
      <p>${message}</p>
      <button class="btn-primary" onclick="closeReviewsModal(); showCategory('inicio');">Ver Produtos para Avaliar</button>
    </div>
  `;
}

// Função para exibir avaliações do usuário
function displayUserReviews(reviews, usuario) {
  console.log('🎨 displayUserReviews() chamada com', reviews.length, 'avaliações');
  console.log('👤 Usuário:', usuario);
  console.log('📋 Reviews:', reviews);
  console.log('📦 Variável products disponível:', typeof products !== 'undefined');
  if (typeof products !== 'undefined') {
    console.log('📊 Total de produtos:', products.length);
  }
  
  const content = document.querySelector('.reviews-modal-content');
  console.log('📦 Container .reviews-modal-content encontrado:', !!content);
  
  if (!content) {
    console.error('❌ Container .reviews-modal-content não encontrado');
    return;
  }
  
  console.log('🎨 Exibindo', reviews.length, 'avaliações do usuário');
  
  let reviewsHTML = `
    <div class="user-reviews-header">
      <div class="user-info">
        <div class="user-avatar">${usuario.nome.charAt(0).toUpperCase()}</div>
        <div class="user-details">
          <h4>${usuario.nome}</h4>
          <p>${reviews.length} ${reviews.length === 1 ? 'avaliação' : 'avaliações'}</p>
        </div>
      </div>
    </div>
    <div class="reviews-list">
  `;
  
  reviews.forEach(review => {
    // Verificar se products está disponível globalmente
    if (typeof products === 'undefined') {
      console.error('❌ Variável products não está definida');
      return;
    }
    
    const product = products.find(p => p.codigo === review.productId);
    const productName = product ? product.nome : `Produto ${review.productId}`;
    const productImage = product ? `images/products/thumbnail/${product.imagem || product.codigo + '.webp'}` : 'images/products/thumbnail/placeholder.webp';
    
    const date = new Date(review.date);
    const formattedDate = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    reviewsHTML += `
      <div class="review-item" data-review-id="${review.id}">
        <div class="review-product">
          <img src="${productImage}" alt="${productName}" class="review-product-image" onerror="this.src='images/products/thumbnail/placeholder.webp'">
          <div class="review-product-info">
            <h5>${productName}</h5>
            <div class="review-rating">
              ${generateStars(review.rating)}
              <span class="review-date">${formattedDate}</span>
            </div>
          </div>
        </div>
        <div class="review-content">
          ${review.title ? `<h6>${review.title}</h6>` : ''}
          <p>${review.text}</p>
          ${review.photos && review.photos.length > 0 ? `
            <div class="review-photos">
              ${review.photos.map(photo => `
                <img src="${photo}" alt="Foto da avaliação" class="review-photo" onclick="window.open('${photo}', '_blank')">
              `).join('')}
            </div>
          ` : ''}
        </div>
        <div class="review-actions">
          <button class="edit-review-btn" onclick="editReview(${review.id})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Editar
          </button>
          <button class="delete-review-btn" onclick="deleteReview(${review.id})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Excluir
          </button>
        </div>
        ${review.edited ? '<span class="edited-badge">Editada</span>' : ''}
      </div>
    `;
  });
  
  reviewsHTML += `
    </div>
  `;
  
  content.innerHTML = reviewsHTML;
  console.log('✅ Avaliações exibidas com sucesso');
  console.log('📋 HTML inserido:', reviewsHTML.length, 'caracteres');
  console.log('📦 Conteúdo final do container:', content.innerHTML.length, 'caracteres');
}

// Função para gerar estrelas
function generateStars(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += `<span class="star ${i <= rating ? 'filled' : ''}">★</span>`;
  }
  return stars;
}

// Função para editar avaliação
function editReview(reviewId) {
  console.log('📝 Editando avaliação:', reviewId);
  
  // Carregar avaliações
  const stored = localStorage.getItem('primos_reviews');
  if (!stored) {
    console.error('❌ Nenhuma avaliação encontrada');
    return;
  }
  
  let reviews;
  try {
    reviews = JSON.parse(stored);
  } catch (e) {
    console.error('❌ Erro ao carregar avaliações:', e);
    return;
  }
  
  const review = reviews.find(r => r.id === reviewId);
  if (!review) {
    console.error('❌ Avaliação não encontrada:', reviewId);
    return;
  }
  
  // Fechar modal de avaliações
  closeReviewsModal();
  
  // Abrir modal de edição com os dados da avaliação
  openEditReviewModal(review);
}

// Função para excluir avaliação
function deleteReview(reviewId) {
  console.log('🗑️ Excluindo avaliação:', reviewId);
  
  if (!confirm('Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.')) {
    return;
  }
  
  // Carregar avaliações
  const stored = localStorage.getItem('primos_reviews');
  if (!stored) {
    console.error('❌ Nenhuma avaliação encontrada');
    return;
  }
  
  let reviews;
  try {
    reviews = JSON.parse(stored);
  } catch (e) {
    console.error('❌ Erro ao carregar avaliações:', e);
    return;
  }
  
  // Remover avaliação
  const originalLength = reviews.length;
  reviews = reviews.filter(r => r.id !== reviewId);
  
  if (reviews.length === originalLength) {
    console.error('❌ Avaliação não encontrada para exclusão:', reviewId);
    return;
  }
  
  // Salvar avaliações atualizadas
  localStorage.setItem('primos_reviews', JSON.stringify(reviews));
  
  console.log('✅ Avaliação excluída com sucesso');
  
  // Recarregar avaliações do usuário
  loadUserReviews();
  
  // Mostrar mensagem de sucesso
  showSuccessMessage('Avaliação excluída com sucesso!');
}

// Função para abrir modal de edição de avaliação
function openEditReviewModal(review) {
  // Implementar modal de edição
  console.log('📝 Abrindo modal de edição para avaliação:', review);
  
  // Por enquanto, apenas mostrar os dados no console
  alert(`Funcionalidade de edição em desenvolvimento\n\nAvaliação: ${review.title}\nNota: ${review.rating}\nTexto: ${review.text}`);
}



// === FUNÇÕES AUXILIARES ===
function showNotification(message, type = 'info') {
  console.log(`🔔 ${type}: ${message}`);
}

// Ações dos pedidos (mantidas para compatibilidade)
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
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;

// Funções do menu de usuário
window.viewProfile = viewProfile;
window.viewMyProducts = viewMyProducts;
window.viewMyReviews = viewMyReviews;
window.viewSettings = viewSettings;
window.logout = logout;

// Funções de avaliações
window.loadUserReviews = loadUserReviews;
window.editReview = editReview;
window.deleteReview = deleteReview;
window.openEditReviewModal = openEditReviewModal;

// Função de teste para criar avaliação exemplo
window.createTestReview = function() {
  console.log('🧪 Criando avaliação de teste...');
  
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  if (!usuarioLogado) {
    console.error('❌ Usuário não está logado');
    alert('Faça login primeiro');
    return;
  }
  
  const usuario = JSON.parse(usuarioLogado);
  
  // Criar avaliação de teste
  const testReview = {
    id: Date.now(),
    productId: products[0] ? products[0].codigo : '1001',
    userEmail: usuario.email,
    userName: usuario.nome,
    rating: 5,
    title: 'Avaliação de Teste',
    text: 'Esta é uma avaliação de teste criada automaticamente para verificar o funcionamento do sistema.',
    photos: [],
    date: new Date().toISOString(),
    helpful: 0,
    edited: false
  };
  
  // Salvar avaliação
  const success = saveReview(testReview);
  if (success) {
    console.log('✅ Avaliação de teste criada com sucesso');
    alert('Avaliação de teste criada! Clique em "Minhas Avaliações" para visualizar.');
  } else {
    console.error('❌ Falha ao criar avaliação de teste');
    alert('Falha ao criar avaliação de teste');
  }
};

// Função de teste para depurar avaliações
window.debugReviews = function() {
  console.log('🔍 DEPURANDO AVALIAÇÕES...');
  
  // Verificar usuário logado
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  console.log('👤 Usuário logado:', usuarioLogado);
  
  // Verificar avaliações no localStorage
  const stored = localStorage.getItem('primos_reviews');
  console.log('📋 Dados brutos no localStorage:', stored);
  
  if (stored) {
    try {
      const allReviews = JSON.parse(stored);
      console.log('📊 Total de avaliações:', allReviews.length);
      console.log('📝 Todas as avaliações:', allReviews);
      
      if (usuarioLogado) {
        const usuario = JSON.parse(usuarioLogado);
        const userReviews = allReviews.filter(review => 
          review.userEmail === usuario.email || 
          (review.userName && review.userName.includes(usuario.nome))
        );
        console.log('🎯 Avaliações do usuário:', userReviews);
      }
    } catch (e) {
      console.error('❌ Erro ao parsear avaliações:', e);
    }
  } else {
    console.log('📋 Nenhuma avaliação encontrada no localStorage');
  }
};

// Função para redirecionar para política de devolução
window.viewReturnPolicy = function() {
  console.log('📄 Redirecionando para política de devolução...');
  window.location.href = 'politica-devolucao.html';
};

// Expor função globalmente
window.viewReturnPolicy = viewReturnPolicy;
console.log('✅ viewReturnPolicy() exposta globalmente');

// Verificar se o botão existe no DOM
console.log('⏰ Iniciando verificação do botão em 2 segundos...');

// Verificação imediata
console.log('🔍 Verificação imediata do botão...');
const policyBtnImmediate = document.getElementById('policyReturnBtn');
console.log('🔍 Botão Política de Devolução encontrado (imediato):', !!policyBtnImmediate);

if (policyBtnImmediate) {
  console.log('🎨 Estilos computados do botão:');
  console.log('📋 display:', window.getComputedStyle(policyBtnImmediate).display);
  console.log('📋 visibility:', window.getComputedStyle(policyBtnImmediate).visibility);
  console.log('📋 opacity:', window.getComputedStyle(policyBtnImmediate).opacity);
  console.log('📋 height:', window.getComputedStyle(policyBtnImmediate).height);
  console.log('📋 width:', window.getComputedStyle(policyBtnImmediate).width);
  console.log('📋 position:', window.getComputedStyle(policyBtnImmediate).position);
  console.log('📋 z-index:', window.getComputedStyle(policyBtnImmediate).zIndex);
  console.log('📋 Pai do botão:', policyBtnImmediate.parentElement);
  console.log('📋 Visível no viewport:', policyBtnImmediate.getBoundingClientRect());
  
  // Verificar se o modal do perfil está visível
  const profileModal = document.getElementById('profileModalOverlay');
  if (profileModal) {
    console.log('🔍 Modal do perfil encontrado:', !!profileModal);
    console.log('📋 Modal display:', window.getComputedStyle(profileModal).display);
    console.log('📋 Modal visibility:', window.getComputedStyle(profileModal).visibility);
    console.log('📋 Modal opacity:', window.getComputedStyle(profileModal).opacity);
    console.log('📋 Modal classes:', profileModal.className);
  }
}

setTimeout(() => {
  console.log('⏰ Verificando botão agora...');
  const policyBtn = document.getElementById('policyReturnBtn');
  console.log('🔍 Botão Política de Devolução encontrado:', !!policyBtn);
  if (policyBtn) {
    console.log('✅ Botão está no DOM e pronto para uso');
    console.log('📋 Texto do botão:', policyBtn.textContent.trim());
    console.log('🎯 onclick do botão:', policyBtn.onclick);
  } else {
    console.error('❌ Botão não encontrado no DOM - verifique o HTML');
    // Verificar se existe algum botão com texto similar
    const allButtons = document.querySelectorAll('.profile-action-btn');
    console.log('📋 Todos os botões de perfil encontrados:', allButtons.length);
    allButtons.forEach((btn, index) => {
      console.log(`Botão ${index}:`, btn.textContent.trim());
    });
  }
}, 2000);

// Funções de gerenciamento de pedidos
window.reviewOrder = reviewOrder;
window.reorderOrder = reorderOrder;

// Funções de autenticação
window.checkAuthStatus = checkAuthStatus;
window.showUserMenu = showUserMenu;
window.logout = logout;
window.viewOrders = viewOrders;
window.backToMainPage = backToMainPage;
window.navigateToOrdersPage = navigateToOrdersPage;

// Expor variáveis globais importantes (após carregamento)
window.goToHomePage = goToHomePage;
window.resetNavigation = resetNavigation;
window.navigateToCheckout = navigateToCheckout;
window.loadCheckoutSummary = loadCheckoutSummary;
window.formatCEP = formatCEP;
window.calculateUberShipping = calculateUberShipping;
window.submitOrder = submitOrder;
window.backToCart = backToCart;
window.loadUserOrders = loadUserOrders;
window.displayOrders = displayOrders;
window.createOrderCard = createOrderCard;
window.getStatusText = getStatusText;
window.getStatusColor = getStatusColor;
window.displayEmptyOrders = displayEmptyOrders;
window.cancelOrder = cancelOrder;

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
    // Navegar para página SPA de pedidos
    viewOrders();
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
  // Evitar inicialização duplicada
  if (window.profileMenuManager) {
    console.log('⚠️ ProfileMenuManager já inicializado, pulando...');
    return;
  }
  
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

// Inicialização duplicada removida - já foi chamada anteriormente

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
// Função editProfile foi movida para a seção de edição de perfil (linha 4577)

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

// === FUNÇÕES DO MODAL DE EDITAR PERFIL ===

function editProfile() {
  closeProfileModal();
  openEditProfileModal();
}

function openEditProfileModal() {
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  if (!usuarioLogado) {
    showNotification('Você precisa estar logado para editar o perfil', 'error');
    return;
  }
  
  // Verificar se elementos existem antes de prosseguir
  const requiredElements = ['editNome', 'editEmail', 'editTelefone', 'editProfileModalOverlay'];
  const missingElements = requiredElements.filter(id => !document.getElementById(id));
  
  if (missingElements.length > 0) {
    console.error('Elementos necessários não encontrados:', missingElements);
    showNotification('Erro ao abrir formulário de edição. Recarregue a página.', 'error');
    return;
  }
  
  const usuario = JSON.parse(usuarioLogado);
  
  // Preencher formulário com dados atuais
  document.getElementById('editNome').value = usuario.nome || '';
  document.getElementById('editEmail').value = usuario.email || '';
  document.getElementById('editTelefone').value = usuario.telefone || '';
  
  // Limpar erros anteriores
  clearEditProfileErrors();
  
  // Abrir modal
  const overlay = document.getElementById('editProfileModalOverlay');
  if (overlay) {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeEditProfileModal() {
  const overlay = document.getElementById('editProfileModalOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
  
  // Limpar formulário
  document.getElementById('editProfileForm').reset();
  clearEditProfileErrors();
}

function clearEditProfileErrors() {
  // Limpar estilos de erro dos inputs
  const inputs = ['editNome', 'editEmail', 'editTelefone'];
  inputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.style.borderColor = '#e5e7eb';
      input.classList.remove('error');
    }
  });
}

function showEditProfileError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const error = document.getElementById(fieldId + 'Error');
  
  if (input) {
    input.style.borderColor = '#ef4444';
    input.classList.add('error');
  }
  
  if (error) {
    error.textContent = message;
    error.style.display = 'block';
  }
}

function validateEditProfileForm(nome, email, telefone) {
  clearEditProfileErrors();
  let isValid = true;
  
  // Validar nome
  if (!nome.trim()) {
    showEditProfileError('editNome', 'Nome é obrigatório');
    isValid = false;
  } else if (nome.trim().length < 3) {
    showEditProfileError('editNome', 'Nome deve ter pelo menos 3 caracteres');
    isValid = false;
  }
  
  // Validar email
  if (!email.trim()) {
    showEditProfileError('editEmail', 'E-mail é obrigatório');
    isValid = false;
  } else if (!email.includes('@') || !email.includes('.')) {
    showEditProfileError('editEmail', 'E-mail inválido');
    isValid = false;
  }
  
  // Validar telefone (opcional, mas se preenchido deve ser válido)
  if (telefone.trim()) {
    const telefoneRegex = /^(\d{10,11}|\(\d{2}\)\s?\d{4,5}-?\d{4})$/;
    if (!telefoneRegex.test(telefone.replace(/\D/g, ''))) {
      showEditProfileError('editTelefone', 'Telefone inválido');
      isValid = false;
    }
  }
  
  return isValid;
}

function saveProfileChanges(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const nome = formData.get('nome');
  const email = formData.get('email');
  const telefone = formData.get('telefone');
  
  if (!validateEditProfileForm(nome, email, telefone)) {
    return;
  }
  
  // Obter usuário atual
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  if (!usuarioLogado) {
    showNotification('Sessão expirada. Faça login novamente.', 'error');
    closeEditProfileModal();
    return;
  }
  
  const usuario = JSON.parse(usuarioLogado);
  
  // Verificar se email mudou e se já existe
  if (email !== usuario.email) {
    const users = JSON.parse(localStorage.getItem('usuarios') || '[]');
    const emailExists = users.find(user => 
      user.email === email.toLowerCase() && user.id !== usuario.id
    );
    
    if (emailExists) {
      showEditProfileError('editEmail', 'Este e-mail já está em uso por outra conta');
      return;
    }
  }
  
  // Atualizar dados do usuário
  const updatedUser = {
    ...usuario,
    nome: nome.trim(),
    email: email.toLowerCase().trim(),
    telefone: telefone.trim(),
    dataAtualizacao: new Date().toISOString()
  };
  
  // Salvar no localStorage
  localStorage.setItem('usuarioLogado', JSON.stringify(updatedUser));
  
  // Atualizar na lista de usuários
  const users = JSON.parse(localStorage.getItem('usuarios') || '[]');
  const userIndex = users.findIndex(user => user.id === usuario.id);
  
  if (userIndex !== -1) {
    users[userIndex] = updatedUser;
    localStorage.setItem('usuarios', JSON.stringify(users));
  }
  
  // Mostrar sucesso
  showNotification('Perfil atualizado com sucesso!', 'success');
  
  // Fechar modal
  closeEditProfileModal();
  
  // Atualizar interface
  updateProfileModalInfo();
  updateProfileDropdown();
  updateProfileButton();
  
  // Se houver ProfileMenuManager, atualizar também
  if (window.profileMenuManager) {
    window.profileMenuManager.currentUser = updatedUser;
    window.profileMenuManager.updateProfileInfo();
  }
}

function updateProfileDropdown() {
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  if (!usuarioLogado) return;
  
  const usuario = JSON.parse(usuarioLogado);
  
  // Atualizar nome no dropdown
  const profileName = document.getElementById('profileName');
  if (profileName) {
    profileName.textContent = usuario.nome;
  }
  
  const profileNameModal = document.getElementById('profileNameModal');
  if (profileNameModal) {
    profileNameModal.textContent = usuario.nome;
  }
  
  // Atualizar email
  const profileEmail = document.getElementById('profileEmail');
  if (profileEmail) {
    profileEmail.textContent = usuario.email;
  }
  
  const profileEmailModal = document.getElementById('profileEmailModal');
  if (profileEmailModal) {
    profileEmailModal.textContent = usuario.email;
  }
  
  // Atualizar iniciais
  const initial = usuario.nome.charAt(0).toUpperCase();
  const profileInitial = document.querySelector('.profile-initial');
  if (profileInitial) {
    profileInitial.textContent = initial;
  }
  
  const profileInitialLarge = document.querySelector('.profile-initial-large');
  if (profileInitialLarge) {
    profileInitialLarge.textContent = initial;
  }
  
  const profileInitialLargeModal = document.querySelector('.profile-initial-large-modal');
  if (profileInitialLargeModal) {
    profileInitialLargeModal.textContent = initial;
  }
}

function updateProfileButton() {
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  if (!usuarioLogado) return;
  
  const usuario = JSON.parse(usuarioLogado);
  
  // Atualizar botão de perfil se existir
  const profileBtn = document.getElementById('profileBtn');
  if (profileBtn) {
    const avatar = profileBtn.querySelector('.profile-initial');
    if (avatar) {
      avatar.textContent = usuario.nome.charAt(0).toUpperCase();
    }
  }
}

// Fechar modal com ESC
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const modal = document.getElementById('editProfileModalOverlay');
    if (modal && modal.classList.contains('active')) {
      closeEditProfileModal();
    }
  }
});

// Adicionar funções ao escopo global
window.editProfile = editProfile;
window.openEditProfileModal = openEditProfileModal;
window.closeEditProfileModal = closeEditProfileModal;
window.saveProfileChanges = saveProfileChanges;

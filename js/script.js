// === FUNÇÃO PRINCIPAL - CATEGORIAS ===
function showCategory(category) {
  console.log('Mostrando categoria:', category);
  
  // Se for "inicio", mostrar a seção hero e esconder produtos
  if (category === 'inicio') {
    // Mostrar seção inicio
    const inicioSection = document.getElementById('inicio');
    if (inicioSection) {
      inicioSection.style.display = 'block';
    }
    
    // Esconder todas as seções de produtos
    const productSections = document.querySelectorAll('.products-section, .category');
    productSections.forEach(function(section) {
      if (section.id !== 'inicio') {
        section.style.display = 'none';
      }
    });
    
    // Scroll suave para o topo sem animação estranha
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  } else {
    // Esconder seção inicio
    const inicioSection = document.getElementById('inicio');
    if (inicioSection) {
      inicioSection.style.display = 'none';
    }
    
    // Esconder todas as seções de produtos
    const sections = document.querySelectorAll('.products-section, .category');
    sections.forEach(function(section) {
      section.style.display = 'none';
    });
    
    // Mostrar seção correspondente
    const targetSection = document.getElementById(category);
    if (targetSection) {
      targetSection.style.display = 'block';
      
      // Scroll suave sem animação estranha
      setTimeout(function() {
        const headerHeight = document.querySelector('header') ? document.querySelector('header').offsetHeight : 0;
        const sectionTop = targetSection.offsetTop - headerHeight - 20;
        
        window.scrollTo({
          top: sectionTop,
          left: 0,
          behavior: 'smooth'
        });
      }, 100);
    }
  }
  
  // Remover active de todos os botões
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(function(btn) {
    btn.classList.remove('active');
  });
  
  // Adicionar active ao botão correto
  const activeBtn = document.querySelector('[data-target="' + category + '"]');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Atualizar URL sem recarregar
  if (history.pushState) {
    const newUrl = window.location.pathname + '#' + category;
    window.history.pushState({ path: newUrl }, '', newUrl);
  }
  
  // Prevenir scrollbar animada
  document.body.style.overflow = 'auto';
  document.documentElement.style.scrollBehavior = 'smooth';
}

// === CARREGAR PRODUTOS ===
let allProducts = [];

function loadProducts() {
  return new Promise(function(resolve, reject) {
    console.log('Carregando produtos...');
    
    fetch('data/products.csv')
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
          
          headers.forEach(function(header, index) {
            product[header.trim()] = values[index] ? values[index].trim() : '';
          });
          
          allProducts.push(product);
        }
        
        console.log(allProducts.length + ' produtos carregados');
        displayProducts(allProducts);
        resolve();
      })
      .catch(function(error) {
        console.error('Erro ao carregar produtos:', error);
        reject(error);
      });
  });
}

// === EXIBIR PRODUTOS ===
function displayProducts(products) {
  // Agrupar por categoria
  const categories = {};
  
  products.forEach(function(product) {
    const category = product.categoria || 'outros';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(product);
  });
  
  // Criar seções apenas para categorias que existem
  Object.keys(categories).forEach(function(category) {
    let section = document.getElementById(category);
    
    if (!section) {
      section = document.createElement('section');
      section.id = category;
      section.className = 'products-section';
      section.style.display = 'none'; // COMEÇA ESCONDIDO
      
      // Encontrar onde inserir (depois da seção hero)
      const heroSection = document.querySelector('.hero');
      const container = document.querySelector('.container');
      
      if (heroSection && container) {
        // Inserir depois da seção hero
        container.insertBefore(section, heroSection.nextSibling);
      } else if (container) {
        container.appendChild(section);
      }
    }
    
    // Criar conteúdo
    let productsHTML = '<h2 class="section-title">' + category.charAt(0).toUpperCase() + category.slice(1) + '</h2>';
    productsHTML += '<div class="products-grid">';
    
    categories[category].forEach(function(product) {
      productsHTML += createProductCard(product);
    });
    
    productsHTML += '</div>';
    section.innerHTML = productsHTML;
  });
  
  // Esconder seção "inicio" se existir
  const inicioSection = document.getElementById('inicio');
  if (inicioSection) {
    inicioSection.style.display = 'none';
  }
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
  
  let cardHTML = '<div class="product-card">';
  cardHTML += '<div class="product-image">';
  cardHTML += '<img src="' + imagePath + '" alt="' + product.nome + '" loading="lazy" onerror="this.src=\'images/placeholder.png\'">';
  cardHTML += '</div>';
  cardHTML += '<div class="product-info">';
  cardHTML += '<h3>' + product.nome + '</h3>';
  cardHTML += '<p class="price">' + formattedPrice + '</p>';
  cardHTML += '<button class="btn-primary" onclick="addToCart(\'' + product.codigo + '\')">Adicionar</button>';
  cardHTML += '</div>';
  cardHTML += '</div>';
  
  return cardHTML;
}

// === CARRINHO ===
let cart = [];

function addToCart(productCode) {
  const product = allProducts.find(function(p) {
    return p.codigo === productCode;
  });
  
  if (!product) return;
  
  const existingItem = cart.find(function(item) {
    return item.codigo === productCode;
  });
  
  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.push({
      ...product,
      quantity: 1
    });
  }
  
  console.log('Produto adicionado:', product.nome);
}

// === INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', function() {
  console.log('Iniciando...');
  
  // Carregar produtos
  loadProducts().then(function() {
    // No carregamento, sempre mostrar "inicio"
    showCategory('inicio');
  });
  
  // Setup hash change
  window.addEventListener('hashchange', function() {
    const hash = window.location.hash.substring(1) || 'inicio';
    showCategory(hash);
  });
  
  console.log('Pronto!');
});

// === COMANDOS GLOBAIS ===
window.showCategory = showCategory;
window.addToCart = addToCart;

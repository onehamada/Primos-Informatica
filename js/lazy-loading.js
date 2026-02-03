// === LAZY LOADING NATIVO E MELHORADO ===

// Configuração do Intersection Observer para lazy loading
const lazyLoadingConfig = {
  root: null, // viewport
  rootMargin: '50px 0px', // começa a carregar 50px antes de entrar na tela
  threshold: 0.1 // começa a carregar quando 10% da imagem estiver visível
};

// Criar o observer
let imageObserver;

// Inicializar o lazy loading
function initLazyLoading() {
  // Verificar suporte a Intersection Observer
  if ('IntersectionObserver' in window) {
    imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          loadImage(img);
          observer.unobserve(img);
        }
      });
    }, lazyLoadingConfig);
  } else {
    // Fallback para navegadores antigos
    initLegacyLazyLoading();
  }
}

// Carregar imagem individual
function loadImage(img) {
  // Adicionar classe de loading
  img.classList.add('loading');
  
  // Se tem data-src, usar isso
  if (img.dataset.src) {
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
  }
  
  // Evento de carregamento
  img.onload = function() {
    img.classList.remove('loading');
    img.classList.add('loaded');
  };
  
  // Evento de erro
  img.onerror = function() {
    img.classList.remove('loading');
    
    // Tentar fallback para .jpg se .webp falhar
    if (img.src.includes('.webp')) {
      const fallbackSrc = img.src.replace(/\.webp$/i, '.jpg');
      img.src = fallbackSrc;
    } else {
      // Placeholder genérico
      img.src = 'images/products/thumbnail/placeholder.webp';
      img.classList.add('error');
    }
  };
}

// Fallback para navegadores sem Intersection Observer
function initLegacyLazyLoading() {
  function checkImages() {
    const images = document.querySelectorAll('img[data-src]');
    
    images.forEach(img => {
      const rect = img.getBoundingClientRect();
      const isVisible = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight + 50 &&
        rect.right <= window.innerWidth
      );
      
      if (isVisible) {
        loadImage(img);
      }
    });
  }
  
  // Verificar imagens no scroll
  let ticking = false;
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(checkImages);
      ticking = true;
      setTimeout(() => { ticking = false; }, 100);
    }
  }
  
  window.addEventListener('scroll', requestTick);
  window.addEventListener('resize', requestTick);
  
  // Verificar imagens iniciais
  setTimeout(checkImages, 100);
}

// Observar novas imagens adicionadas dinamicamente
function observeImages(container = document) {
  const images = container.querySelectorAll('img[data-src], img[loading="lazy"]');
  
  images.forEach(img => {
    if (imageObserver) {
      imageObserver.observe(img);
    } else {
      // Fallback direto
      if (img.getBoundingClientRect().top < window.innerHeight + 50) {
        loadImage(img);
      }
    }
  });
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  initLazyLoading();
  
  // Observar imagens existentes
  setTimeout(() => {
    observeImages();
  }, 100);
});

// Re-observar quando novas imagens forem adicionadas (para carregamento dinâmico)
const originalCreateProductCard = window.createProductCard;
if (typeof originalCreateProductCard === 'function') {
  window.createProductCard = function(product) {
    const result = originalCreateProductCard(product);
    setTimeout(() => observeImages(), 50);
    return result;
  };
}

// Exportar funções para uso global
window.lazyLoading = {
  init: initLazyLoading,
  observe: observeImages,
  loadImage: loadImage
};

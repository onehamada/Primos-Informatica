// === CORE MODULE - Inicialização e utilitários compartilhados ===

// Configurações globais
const DEBUG = false;

// Utilitários globais
function debugLog(message, ...args) {
  if (DEBUG) {
    console.log(`[${new Date().toISOString()}]`, message, ...args);
  }
}

// Função para verificar se está em mobile
function isMobile() {
  return window.innerWidth <= 768;
}

// Função para debounce
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Safe render pattern para evitar erros em elementos não encontrados
function safeRender(callback, containerSelector = null, operationName = 'operation') {
  try {
    return callback();
  } catch (error) {
    console.error(`❌ Erro em ${operationName}:`, error);
    if (containerSelector) {
      console.error(`Container: ${containerSelector}`);
    }
    return null;
  }
}

// Função para formatar preço
function formatPrice(price) {
  return 'R$ ' + price.toFixed(2).replace('.', ',');
}

// Função para scroll to top
function forceScrollToTop() {
  window.scrollTo(0, 0);
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

// Sistema de placeholders inteligentes
function cleanupStalePlaceholders() {
  const placeholders = document.querySelectorAll('.image-placeholder');
  placeholders.forEach(placeholder => {
    const img = placeholder.nextElementSibling;
    if (img && img.tagName === 'IMG' && img.complete && img.naturalHeight !== 0) {
      placeholder.style.display = 'none';
    }
  });
}

function aggressivePlaceholderCleanup() {
  const stalePlaceholders = document.querySelectorAll('.image-placeholder:not(.loading)');
  stalePlaceholders.forEach(placeholder => {
    const img = placeholder.nextElementSibling;
    if (img && img.tagName === 'IMG') {
      if (img.complete && img.naturalHeight !== 0) {
        placeholder.remove();
      } else if (img.src && img.src !== '') {
        // Forçar recarregamento se imagem não carregou
        const src = img.src;
        img.src = '';
        img.src = src;
      }
    }
  });
}

// Lazy loading avançado otimizado
class AdvancedLazyLoader {
  constructor() {
    this.observer = null;
    this.preloadObserver = null;
    this.loadedImages = new Set();
    this.preloadedImages = new Set();
    this.init();
  }

  init() {
    // Configurações otimizadas para performance
    const observerOptions = {
      rootMargin: '100px 50px', // Carregar 100px antes de entrar na tela
      threshold: 0.1 // Carregar quando 10% da imagem estiver visível
    };

    const preloadOptions = {
      rootMargin: '200px 100px', // Preload 200px antes
      threshold: 0.01
    };

    if ('IntersectionObserver' in window) {
      // Observer principal para carregamento
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
          }
        });
      }, observerOptions);

      // Observer secundário para preload
      this.preloadObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.preloadNearbyImages(entry.target);
          }
        });
      }, preloadOptions);
    } else {
      // Fallback para navegadores sem IntersectionObserver
      this.loadAllImagesOnScroll();
    }
  }

  observe(element) {
    if (this.observer && element) {
      this.observer.observe(element);
    }
    if (this.preloadObserver && element) {
      this.preloadObserver.observe(element);
    }
  }

  loadImage(img) {
    if (!img || !img.dataset.src || this.loadedImages.has(img.dataset.src)) {
      return;
    }

    const src = img.dataset.src;

    // Verificar se é WebP primeiro (mais eficiente)
    const webpSrc = this.getWebpVersion(src);
    const testImg = new Image();

    testImg.onload = () => {
      img.src = webpSrc;
      img.removeAttribute('data-src');
      img.classList.add('loaded');
      this.loadedImages.add(src);

      // Esconder placeholder
      const placeholder = img.previousElementSibling;
      if (placeholder && placeholder.classList.contains('image-placeholder')) {
        placeholder.style.display = 'none';
      }

      debugLog('✅ Imagem carregada:', webpSrc);
    };

    testImg.onerror = () => {
      // Fallback para imagem original
      const originalImg = new Image();
      originalImg.onload = () => {
        img.src = src;
        img.removeAttribute('data-src');
        img.classList.add('loaded');
        this.loadedImages.add(src);

        const placeholder = img.previousElementSibling;
        if (placeholder && placeholder.classList.contains('image-placeholder')) {
          placeholder.style.display = 'none';
        }

        debugLog('✅ Imagem carregada (fallback):', src);
      };

      originalImg.onerror = () => {
        img.src = '/images/products/thumbnail/default.webp';
        img.removeAttribute('data-src');
        img.classList.add('loaded');
        debugLog('❌ Imagem falhou, usando fallback:', src);
      };

      originalImg.src = src;
    };

    testImg.src = webpSrc;
  }

  getWebpVersion(src) {
    // Converter caminho para WebP
    if (src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png')) {
      return src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }
    return src;
  }

  preloadNearbyImages(currentImg) {
    if (!currentImg) return;

    // Encontrar imagens próximas no mesmo container
    const container = currentImg.closest('.products-grid, .category-grid, .highlights-grid');
    if (!container) return;

    const images = Array.from(container.querySelectorAll('img[data-src]'));
    const currentIndex = images.indexOf(currentImg);

    if (currentIndex === -1) return;

    // Preload próximas 3 imagens
    const preloadCount = 3;
    for (let i = 1; i <= preloadCount; i++) {
      const nextImg = images[currentIndex + i];
      if (nextImg && nextImg.dataset.src) {
        this.preloadImage(nextImg.dataset.src);
      }
    }
  }

  preloadImage(src) {
    if (this.preloadedImages.has(src)) return;

    const img = new Image();
    img.onload = () => {
      this.preloadedImages.add(src);
      debugLog('🔄 Imagem pre-carregada:', src);
    };
    img.src = this.getWebpVersion(src);
  }

  loadAllImagesOnScroll() {
    // Fallback para navegadores sem IntersectionObserver
    let scrollTimeout;

    const loadVisibleImages = () => {
      const images = document.querySelectorAll('img[data-src]');
      const viewportHeight = window.innerHeight;

      images.forEach(img => {
        const rect = img.getBoundingClientRect();
        if (rect.top < viewportHeight + 100 && rect.bottom > -100) {
          this.loadImage(img);
        }
      });
    };

    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(loadVisibleImages, 100);
    });

    // Carregar inicial
    loadVisibleImages();
  }

  // Método para forçar carregamento de todas as imagens visíveis
  loadVisibleImages() {
    const images = document.querySelectorAll('img[data-src]');
    const viewportHeight = window.innerHeight;

    images.forEach(img => {
      const rect = img.getBoundingClientRect();
      if (rect.top < viewportHeight + 100 && rect.bottom > -100) {
        this.observe(img);
      }
    });
  }
}

// Sistema de notificações
class NotificationManager {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    this.createContainer();
  }

  createContainer() {
    this.container = document.createElement('div');
    this.container.id = 'notification-container';
    this.container.className = 'notification-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 400px;
    `;
    document.body.appendChild(this.container);
  }

  show(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideInRight 0.3s ease;
    `;

    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; line-height: 1;">×</button>
      </div>
    `;

    this.container.appendChild(notification);

    if (duration > 0) {
      setTimeout(() => {
        if (notification.parentElement) {
          notification.style.animation = 'slideOutRight 0.3s ease';
          setTimeout(() => notification.remove(), 300);
        }
      }, duration);
    }
  }
}

// Inicializar sistemas globais
const advancedLazyLoader = new AdvancedLazyLoader();
const notificationManager = new NotificationManager();

// Impedir restauração automática de scroll do navegador
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

// Event listeners globais
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', forceScrollToTop);
} else {
  forceScrollToTop();
}

window.addEventListener('load', function() {
  forceScrollToTop();
  setTimeout(cleanupStalePlaceholders, 100);
  setTimeout(aggressivePlaceholderCleanup, 500);
  setTimeout(aggressivePlaceholderCleanup, 2000);
});

// Executar limpeza periodicamente
setInterval(aggressivePlaceholderCleanup, 5000);

// CSS para animações
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Exportar funções globais
window.debugLog = debugLog;
window.isMobile = isMobile;
window.debounce = debounce;
window.safeRender = safeRender;
window.formatPrice = formatPrice;
window.forceScrollToTop = forceScrollToTop;
window.advancedLazyLoader = advancedLazyLoader;
window.notificationManager = notificationManager;

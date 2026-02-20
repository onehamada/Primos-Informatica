// === MAIN MODULE - Inicialização principal da aplicação ===

// Importar módulos (em ordem de dependência)
import('./core.js').then(() => {
  debugLog('✅ Core module loaded');
}).then(() => {
  return import('./router.js');
}).then(() => {
  debugLog('✅ Router module loaded');
  return import('./products.js');
}).then(() => {
  debugLog('✅ Products module loaded');
  return import('./cart.js');
}).then(() => {
  debugLog('✅ Cart module loaded');
  return import('./reviews.js');
}).then(() => {
  debugLog('✅ Reviews module loaded');
  return import('./ui.js');
}).then(() => {
  debugLog('✅ UI module loaded');

  // Inicializar aplicação após todos os módulos carregados
  initializeApp();

}).catch(error => {
  console.error('❌ Erro ao carregar módulos:', error);
});

// Função principal de inicialização
function initializeApp() {
  debugLog('🚀 Inicializando aplicação...');

  // Inicializar header dinâmico
  if (typeof initHeaderScroll === 'function') {
    initHeaderScroll();
  }

  // Inicializar sistema de roteamento (SEO 2.3)
  if (typeof initRouter === 'function') {
    initRouter();
  }

  // Migrar hash URLs para SEO URLs (compatibilidade)
  if (typeof migrateToSEOUrls === 'function') {
    migrateToSEOUrls();
  }

  // Verificar se usuário está logado e atualizar UI
  if (typeof checkAuthStatus === 'function') {
    checkAuthStatus();
  }

  // Adicionar evento listener para estrelas de avaliação
  document.addEventListener('click', function(event) {
    if (event.target.classList.contains('star')) {
      const rating = parseInt(event.target.dataset.rating);
      if (rating && rating >= 1 && rating <= 5) {
        if (typeof setRating === 'function') {
          setRating(rating);
        }
      }
    }
  });

  // Carregar produtos e inicializar interface
  if (typeof loadProducts === 'function') {
    loadProducts().then(function() {
      DEBUG && debugLog('✅ loadProducts() concluída com sucesso');

      // Preencher menus de navegação dinamicamente
      if (typeof populateNavigationMenus === 'function') {
        populateNavigationMenus();
      }
      DEBUG && debugLog('✅ populateNavigationMenus() executada');

      // === CORREÇÃO: FORÇAR SEMPRE A PÁGINA INICIAL NO CARREGAMENTO ===
      setTimeout(() => {
        history.replaceState({}, '', '/');
        if (typeof showCategory === 'function') {
          showCategory('inicio');
        }
        debugLog('🏠 FORÇADO: Sempre redirecionar para página inicial no carregamento');
      }, 200);

      // === PREENCHER HOME ===
      if (typeof populateHome === 'function') {
        populateHome();
      }

      // Limpar placeholders que possam ter ficado para trás
      cleanupStalePlaceholders();
      aggressivePlaceholderCleanup();

    }).catch(function(error) {
      console.error('❌ Erro na inicialização:', error);
      notificationManager.show('Erro ao inicializar aplicação. Recarregue a página.', 'error');
    });
  }

  // Inicializar sistema de perfil
  if (typeof initializeProfileMenu === 'function') {
    initializeProfileMenu();
  }

  // Inicializar filtros mobile
  document.addEventListener('DOMContentLoaded', function() {
    const filtersToggle = document.getElementById('filtersToggle');
    if (filtersToggle) {
      debugLog('✅ Botão de filtros encontrado, adicionando event listener');
      filtersToggle.addEventListener('click', function(e) {
        debugLog('🖱️ Botão de filtros clicado!');
        e.preventDefault();
        e.stopPropagation();
        if (typeof toggleFiltersMenu === 'function') {
          toggleFiltersMenu();
        }
      });
    } else {
      debugLog('❌ Botão de filtros não encontrado');
    }
  });

  debugLog('✅ Aplicação inicializada com sucesso!');
}

// Fallback para navegadores que não suportam ES modules
if (!('import' in document.createElement('link'))) {
  console.warn('⚠️ ES Modules não suportados. Carregando versão compatível...');

  // Carregar scripts em ordem usando XHR
  const scripts = [
    '/js/core.js',
    '/js/router.js',
    '/js/products.js',
    '/js/cart.js',
    '/js/reviews.js',
    '/js/ui.js'
  ];

  let loadedCount = 0;

  scripts.forEach(src => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
      loadedCount++;
      if (loadedCount === scripts.length) {
        // Todos os scripts carregados, inicializar
        setTimeout(initializeApp, 100);
      }
    };
    script.onerror = () => {
      console.error(`❌ Erro ao carregar ${src}`);
    };
    document.head.appendChild(script);
  });
}

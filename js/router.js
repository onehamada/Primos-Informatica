// === ROUTER MODULE - Sistema de roteamento e navegação ===

function initRouter() {
  // Mapeamento de rotas
  const routes = {
    '/': 'inicio',
    '/produtos': 'promo',
    '/categoria/': null, // prefixo para categorias
    '/produto/': null   // prefixo para produtos
  };

  // CORREÇÃO: Forçar página inicial no carregamento inicial
  if (performance.getEntriesByType('navigation')[0] &&
      performance.getEntriesByType('navigation')[0].type === 'navigate') {
    // É um carregamento inicial da página (não navegação interna)
    setTimeout(() => {
      if (window.location.pathname !== '/' || window.location.hash) {
        history.replaceState({}, '', '/');
        if (typeof showCategory === 'function') {
          showCategory('inicio');
        }
        debugLog('🔄 FORÇADO: Carregamento inicial redirecionado para página inicial');
      }
    }, 100);
  }

  // Função para navegar sem recarregar
  function navigateTo(path, category = null, productSlug = null) {
    // Atualizar URL sem recarregar página
    if (category) {
      history.pushState({ category }, '', `/categoria/${category}`);
    } else if (productSlug) {
      history.pushState({ productSlug }, '', `/produto/${productSlug}`);
    } else {
      history.pushState({}, '', path);
    }

    // Disparar navegação
    if (category) {
      if (typeof showCategory === 'function') {
        showCategory(category);
      }
    } else if (productSlug) {
      if (typeof showProduct === 'function') {
        showProduct(productSlug);
      }
    } else {
      const targetCategory = routes[path] || 'inicio';
      if (typeof showCategory === 'function') {
        showCategory(targetCategory);
      }
    }
  }

  // Intercepta cliques em links de navegação
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a[href^="/"]');
    if (link) {
      e.preventDefault();
      const href = link.getAttribute('href');

      if (href.startsWith('/categoria/')) {
        const category = href.replace('/categoria/', '');
        navigateTo(href, category);
      } else if (href.startsWith('/produto/')) {
        const productSlug = href.replace('/produto/', '');
        navigateTo(href, null, productSlug);
      } else {
        navigateTo(href);
      }
    }
  });

  // Lida com navegação pelo browser (back/forward)
  window.addEventListener('popstate', function(e) {
    const path = window.location.pathname;

    if (path.startsWith('/categoria/')) {
      const category = path.replace('/categoria/', '');
      if (typeof showCategory === 'function') {
        showCategory(category);
      }
    } else if (path.startsWith('/produto/')) {
      const productSlug = path.replace('/produto/', '');
      if (typeof showProduct === 'function') {
        showProduct(productSlug);
      }
    } else {
      const targetCategory = routes[path] || 'inicio';
      if (typeof showCategory === 'function') {
        showCategory(targetCategory);
      }
    }
  });

  // Expor globalmente
  window.navigateTo = navigateTo;
}

// Sistema de migração para URLs SEO
function migrateToSEOUrls() {
  // Migrar hash URLs antigas para SEO URLs
  if (window.location.hash && window.location.hash.startsWith('#')) {
    const hash = window.location.hash.substring(1);
    if (hash && hash !== 'inicio') {
      const newUrl = `/categoria/${hash}`;
      history.replaceState({}, '', newUrl);
      debugLog('🔄 Migrado hash URL para SEO URL:', newUrl);
    } else {
      history.replaceState({}, '', '/');
      debugLog('🔄 Migrado hash URL para home');
    }
  }
}

// Sistema de header dinâmico
function initHeaderScroll() {
  let lastScrollTop = 0;
  const header = document.querySelector('.modern-header');

  if (!header) return;

  window.addEventListener('scroll', debounce(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop && scrollTop > 100) {
      // Scrolling down
      header.classList.add('header-hidden');
    } else {
      // Scrolling up
      header.classList.remove('header-hidden');
    }

    // Add background on scroll
    if (scrollTop > 50) {
      header.classList.add('header-scrolled');
    } else {
      header.classList.remove('header-scrolled');
    }

    lastScrollTop = scrollTop;
  }, 10));
}

// Botão voltar ao topo
document.addEventListener('DOMContentLoaded', function() {
  const backToTopButton = document.getElementById('backToTop');

  // Esconder botão inicialmente
  if (backToTopButton) {
    backToTopButton.classList.remove('visible');
  }
});

window.addEventListener('scroll', debounce(function() {
  const backToTopButton = document.getElementById('backToTop');

  if (backToTopButton) {
    // Mostrar botão quando rolar 300px para baixo
    if (window.pageYOffset > 300) {
      backToTopButton.classList.add('visible');
    } else {
      backToTopButton.classList.remove('visible');
    }
  }
}, 100));

// Função para voltar ao topo
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

// Exportar funções
window.initRouter = initRouter;
window.migrateToSEOUrls = migrateToSEOUrls;
window.initHeaderScroll = initHeaderScroll;
window.scrollToTop = scrollToTop;

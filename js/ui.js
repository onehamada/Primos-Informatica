// === UI MODULE - Componentes de interface e interações ===

// Sistema de modal genérico
class ModalManager {
  constructor() {
    this.activeModals = new Set();
    this.init();
  }

  init() {
    // Fechar modais com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeTopModal();
      }
    });

    // Fechar modal clicando no overlay
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        const modalId = e.target.id;
        this.close(modalId);
      }
    });
  }

  open(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      this.activeModals.add(modalId);

      // Prevenir scroll do body
      document.body.style.overflow = 'hidden';

      debugLog(`📱 Modal aberto: ${modalId}`);
    }
  }

  close(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      this.activeModals.delete(modalId);

      // Restaurar scroll se nenhum modal estiver ativo
      if (this.activeModals.size === 0) {
        document.body.style.overflow = '';
      }

      debugLog(`📱 Modal fechado: ${modalId}`);
    }
  }

  closeTopModal() {
    const modals = Array.from(this.activeModals);
    if (modals.length > 0) {
      this.close(modals[modals.length - 1]);
    }
  }

  closeAll() {
    Array.from(this.activeModals).forEach(modalId => {
      this.close(modalId);
    });
  }
}

// Sistema de menu mobile
function toggleMobileMenu() {
  const mobileMenu = document.getElementById('mobile-menu');
  const menuToggle = document.getElementById('menu-toggle');

  if (mobileMenu && menuToggle) {
    const isActive = mobileMenu.classList.contains('active');

    if (isActive) {
      mobileMenu.classList.remove('active');
      menuToggle.classList.remove('active');
      document.body.style.overflow = '';
    } else {
      mobileMenu.classList.add('active');
      menuToggle.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }
}

// Sistema de filtros mobile
function toggleFiltersMenu() {
  const filtersMenu = document.getElementById('filters-menu');

  if (filtersMenu) {
    const isActive = filtersMenu.classList.contains('active');

    if (isActive) {
      filtersMenu.classList.remove('active');
      document.body.style.overflow = '';
    } else {
      filtersMenu.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }
}

// Sistema de busca
class SearchManager {
  constructor() {
    this.searchTimeout = null;
    this.minQueryLength = 2;
    this.init();
  }

  init() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });

      // Busca ao pressionar Enter
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.performSearch(searchInput.value);
        }
      });
    }
  }

  handleSearch(query) {
    clearTimeout(this.searchTimeout);

    if (query.length >= this.minQueryLength) {
      this.searchTimeout = setTimeout(() => {
        this.showSearchSuggestions(query);
      }, 300);
    } else {
      this.hideSearchSuggestions();
    }
  }

  showSearchSuggestions(query) {
    // Implementar sugestões de busca
    const suggestions = this.getSearchSuggestions(query);

    if (suggestions.length > 0) {
      this.renderSearchSuggestions(suggestions);
    } else {
      this.hideSearchSuggestions();
    }
  }

  getSearchSuggestions(query) {
    if (!allProducts) return [];

    const queryLower = query.toLowerCase();
    return allProducts
      .filter(product =>
        product.nome.toLowerCase().includes(queryLower) ||
        product.categoria.toLowerCase().includes(queryLower) ||
        (product.marca && product.marca.toLowerCase().includes(queryLower))
      )
      .slice(0, 5); // Máximo 5 sugestões
  }

  renderSearchSuggestions(suggestions) {
    let suggestionsHTML = '<div class="search-suggestions">';

    suggestions.forEach(product => {
      suggestionsHTML += `
        <div class="search-suggestion" onclick="showProduct('${product.codigo}')">
          <div class="suggestion-image">
            <img src="/images/products/thumbnail/${product.imagem || product.codigo + '.webp'}"
                 alt="${product.nome}"
                 onerror="this.src='/images/products/thumbnail/default.webp'">
          </div>
          <div class="suggestion-info">
            <div class="suggestion-name">${product.nome}</div>
            <div class="suggestion-price">${formatPrice(product.preco)}</div>
          </div>
        </div>
      `;
    });

    suggestionsHTML += '</div>';

    this.showSuggestionsContainer(suggestionsHTML);
  }

  showSuggestionsContainer(html) {
    let container = document.getElementById('search-suggestions-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'search-suggestions-container';
      container.className = 'search-suggestions-container';

      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.parentNode.appendChild(container);
      }
    }

    container.innerHTML = html;
    container.style.display = 'block';
  }

  hideSearchSuggestions() {
    const container = document.getElementById('search-suggestions-container');
    if (container) {
      container.style.display = 'none';
    }
  }

  performSearch(query) {
    if (!query || query.trim().length < this.minQueryLength) {
      notificationManager.show(`Digite pelo menos ${this.minQueryLength} caracteres`, 'info');
      return;
    }

    // Filtrar produtos
    const results = allProducts.filter(product =>
      product.nome.toLowerCase().includes(query.toLowerCase()) ||
      product.categoria.toLowerCase().includes(query.toLowerCase()) ||
      (product.marca && product.marca.toLowerCase().includes(query.toLowerCase()))
    );

    // Exibir resultados
    this.displaySearchResults(results, query);
    this.hideSearchSuggestions();
  }

  displaySearchResults(results, query) {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;

    if (results.length === 0) {
      productsGrid.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
          <div style="font-size: 48px; margin-bottom: 20px;">🔍</div>
          <h3 style="color: #64748b; margin-bottom: 10px;">Nenhum resultado encontrado</h3>
          <p style="color: #9ca3af;">Não encontramos produtos para "${query}"</p>
          <button class="btn-primary" onclick="showCategory('inicio')" style="margin-top: 20px;">
            Ver Todos os Produtos
          </button>
        </div>
      `;
    } else {
      // Usar a função existente para renderizar produtos
      renderProductsGrid(results, `Busca: ${query}`);
    }

    // Atualizar título
    const titleElement = document.querySelector('h1') || document.querySelector('.page-title');
    if (titleElement) {
      titleElement.textContent = `Resultados para "${query}" (${results.length} ${results.length === 1 ? 'produto' : 'produtos'})`;
    }

    // Resetar navegação
    if (typeof resetNavigation === 'function') {
      resetNavigation();
    }
  }
}

// Sistema de autenticação
function checkAuthStatus() {
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  const loginBtn = document.getElementById('login-btn');
  const profileBtn = document.getElementById('profile-btn');
  const userMenu = document.getElementById('user-menu');

  if (usuarioLogado) {
    const usuario = JSON.parse(usuarioLogado);

    // Usuário logado
    if (loginBtn) loginBtn.style.display = 'none';
    if (profileBtn) {
      profileBtn.style.display = 'flex';
      const avatar = profileBtn.querySelector('.profile-avatar');
      if (avatar) {
        avatar.textContent = usuario.nome.charAt(0).toUpperCase();
      }
    }
    if (userMenu) userMenu.style.display = 'block';

    debugLog('✅ Usuário logado:', usuario.nome);
  } else {
    // Usuário não logado
    if (loginBtn) loginBtn.style.display = 'block';
    if (profileBtn) profileBtn.style.display = 'none';
    if (userMenu) userMenu.style.display = 'none';

    debugLog('❌ Usuário não logado');
  }
}

// Sistema de perfil
function initializeProfileMenu() {
  if (window.profileMenuManager) {
    debugLog('⚠️ ProfileMenuManager já inicializado, pulando...');
    return;
  }

  class ProfileMenuManager {
    constructor() {
      this.init();
    }

    init() {
      this.bindEvents();
    }

    bindEvents() {
      // Toggle menu de perfil
      const profileBtn = document.getElementById('profile-btn');
      if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleMenu();
        });
      }

      // Fechar menu clicando fora
      document.addEventListener('click', (e) => {
        const menu = document.getElementById('profile-menu');
        const btn = document.getElementById('profile-btn');

        if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
          this.closeMenu();
        }
      });

      // Logout
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          this.logout();
        });
      }
    }

    toggleMenu() {
      const menu = document.getElementById('profile-menu');
      if (menu) {
        menu.classList.toggle('active');
      }
    }

    closeMenu() {
      const menu = document.getElementById('profile-menu');
      if (menu) {
        menu.classList.remove('active');
      }
    }

    logout() {
      localStorage.removeItem('usuarioLogado');
      this.closeMenu();
      checkAuthStatus();
      notificationManager.show('Logout realizado com sucesso!', 'success');

      // Redirecionar para home
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
  }

  // Inicializar
  window.profileMenuManager = new ProfileMenuManager();
  window.ProfileMenuManager = ProfileMenuManager;

  console.log('✅ ProfileMenuManager inicializado');
}

// Sistema de PWA e Service Worker
function initPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          debugLog('✅ Service Worker registrado:', registration.scope);
        })
        .catch(error => {
          console.error('❌ Erro no Service Worker:', error);
        });
    });
  }

  // Detectar se está em modo standalone (PWA)
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
    document.body.classList.add('pwa-mode');
    debugLog('📱 Executando em modo PWA');
  }
}

// Sistema de compartilhamento
function shareProduct(productCode) {
  if (!productCode) return;

  const product = allProducts.find(p => p.codigo === productCode);
  if (!product) return;

  const url = `${window.location.origin}/produto/${productCode}`;
  const text = `Confira este produto: ${product.nome}`;

  if (navigator.share) {
    navigator.share({
      title: product.nome,
      text: text,
      url: url
    }).catch(() => {
      // Fallback para copiar link
      copyToClipboard(url);
    });
  } else {
    copyToClipboard(url);
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    notificationManager.show('Link copiado para a área de transferência!', 'success');
  }).catch(() => {
    // Fallback
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    notificationManager.show('Link copiado!', 'success');
  });
}

// Inicializar sistemas de UI
function initUI() {
  const modalManager = new ModalManager();
  const searchManager = new SearchManager();

  // Inicializar PWA
  initPWA();

  // Event listeners globais
  document.addEventListener('DOMContentLoaded', function() {
    // Botão menu mobile
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
      menuToggle.addEventListener('click', toggleMobileMenu);
    }

    // Botão fechar menu mobile
    const closeMenu = document.getElementById('close-mobile-menu');
    if (closeMenu) {
      closeMenu.addEventListener('click', toggleMobileMenu);
    }
  });

  // Expor funções globalmente
  window.modalManager = modalManager;
  window.searchManager = searchManager;
  window.toggleMobileMenu = toggleMobileMenu;
  window.toggleFiltersMenu = toggleFiltersMenu;
  window.shareProduct = shareProduct;

  debugLog('🎨 Sistema de UI inicializado');
}

// Exportar funções
window.checkAuthStatus = checkAuthStatus;
window.initializeProfileMenu = initializeProfileMenu;
window.initPWA = initPWA;
window.initUI = initUI;

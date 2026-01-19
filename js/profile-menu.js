/**
 * Gerenciador do Menu de Perfil do Usuário
 * Organiza todas as funções do menu e evita problemas de DOM
 */
class ProfileMenuManager {
  constructor() {
    this.isOpen = false;
    this.menuElement = null;
    this.currentUser = null;
    this.authButton = null;
    this.init();
  }

  /**
   * Inicializa o gerenciador
   */
  init() {
    console.log('🚀 ProfileMenuManager inicializado');
    this.authButton = document.querySelector('.auth-btn');
    this.setupEventListeners();
  }

  /**
   * Configura os event listeners
   */
  setupEventListeners() {
    if (!this.authButton) return;

    this.authButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleMenu();
    });
  }

  /**
   * Alterna o menu (abre/fecha)
   */
  toggleMenu() {
    if (this.isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  /**
   * Abre o menu do usuário
   */
  openMenu() {
    // Verificar se usuário está logado
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
      console.log('🔓 Usuário não está logado');
      window.location.href = 'auth.html';
      return;
    }

    this.currentUser = JSON.parse(usuarioLogado);
    console.log('👤 Abrindo menu para:', this.currentUser.nome);

    // Fechar menu existente
    this.closeMenu();

    // Criar novo menu
    this.createMenu();
    this.setupMenuEventListeners();
    this.isOpen = true;
    this.updateBodyScroll();
  }

  /**
   * Fecha o menu do usuário
   */
  closeMenu() {
    if (this.menuElement) {
      console.log('🔄 Fechando menu do usuário');
      this.menuElement.remove();
      this.menuElement = null;
    }

    this.removeMenuEventListeners();
    this.isOpen = false;
    this.updateBodyScroll();
  }

  /**
   * Cria o elemento do menu
   */
  createMenu() {
    this.menuElement = document.createElement('div');
    this.menuElement.className = 'user-menu';
    
    this.menuElement.innerHTML = `
      <div class="user-menu-header">
        <div class="user-avatar">${this.currentUser.nome.charAt(0).toUpperCase()}</div>
        <div class="user-info">
          <div class="user-name">${this.currentUser.nome}</div>
          <div class="user-email">${this.currentUser.email}</div>
        </div>
      </div>
      <div class="user-menu-actions">
        <button class="user-menu-btn" onclick="profileMenuManager.viewProfile()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Meu Perfil
        </button>
        <button class="user-menu-btn" onclick="profileMenuManager.viewMyProducts()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
          </svg>
          Meus Produtos
        </button>
        <button class="user-menu-btn" onclick="profileMenuManager.viewMyReviews()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
          </svg>
          Minhas Avaliações
        </button>
        <button class="user-menu-btn" onclick="profileMenuManager.viewOrders()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
          </svg>
          Meus Pedidos
        </button>
        <button class="user-menu-btn" onclick="profileMenuManager.viewSettings()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 9.96l4.24 4.24M20.46 14.04l-4.24 4.24M7.78 7.78L3.54 3.54"></path>
          </svg>
          Configurações
        </button>
        <button class="user-menu-btn logout" onclick="profileMenuManager.logout()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16,17 21,12 16,7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Sair
        </button>
      </div>
    `;

    // Posicionar o menu
    this.positionMenu();
    document.body.appendChild(this.menuElement);
  }

  /**
   * Posiciona o menu corretamente
   */
  positionMenu() {
    if (!this.menuElement || !this.authButton) return;

    const buttonRect = this.authButton.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    this.menuElement.style.cssText = `
      position: absolute !important;
      top: ${buttonRect.bottom + scrollTop + 5}px !important;
      right: ${window.innerWidth - buttonRect.right}px !important;
      z-index: 9999 !important;
      min-width: 250px !important;
      background: white !important;
      border: 1px solid #e5e7eb !important;
      border-radius: 8px !important;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
    `;
  }

  /**
   * Configura os event listeners do menu
   */
  setupMenuEventListeners() {
    // Fechar ao clicar fora
    this.clickHandler = (e) => {
      if (!this.menuElement.contains(e.target) && !this.authButton.contains(e.target)) {
        this.closeMenu();
      }
    };

    // Fechar com ESC
    this.keyHandler = (e) => {
      if (e.key === 'Escape') {
        this.closeMenu();
      }
    };

    // Adicionar listeners
    setTimeout(() => {
      document.addEventListener('click', this.clickHandler);
      document.addEventListener('keydown', this.keyHandler);
    }, 100);
  }

  /**
   * Remove os event listeners do menu
   */
  removeMenuEventListeners() {
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler);
      this.clickHandler = null;
    }
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
  }

  /**
   * Atualiza o overflow do body
   */
  updateBodyScroll() {
    if (this.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  /**
   * Funções do menu
   */
  viewProfile() {
    console.log('👤 Meu Perfil clicado');
    alert('Meu Perfil - Em desenvolvimento');
    this.closeMenu();
  }

  viewMyProducts() {
    console.log('📦 Meus Produtos clicado');
    alert('Meus Produtos - Em desenvolvimento');
    this.closeMenu();
  }

  viewMyReviews() {
    console.log('⭐ Minhas Avaliações clicado');
    alert('Minhas Avaliações - Em desenvolvimento');
    this.closeMenu();
  }

  viewOrders() {
    console.log('📋 Meus Pedidos clicado');
    alert('Meus Pedidos - Em desenvolvimento');
    this.closeMenu();
  }

  viewSettings() {
    console.log('⚙️ Configurações clicado');
    alert('Configurações - Em desenvolvimento');
    this.closeMenu();
  }

  logout() {
    console.log('🚪 Sair clicado');
    localStorage.removeItem('usuarioLogado');
    window.location.reload();
  }
}

// Criar instância global
let profileMenuManager;

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  profileMenuManager = new ProfileMenuManager();
});

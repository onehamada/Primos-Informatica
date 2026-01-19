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
    this.setupAuthButton();
    this.setupEventListeners();
    
    // Observar mudanças no botão (quando usuário faz login/logout)
    this.observeAuthButton();
  }

  /**
   * Configura o botão de autenticação
   */
  setupAuthButton() {
    console.log('🔍 Procurando botão de autenticação...');
    this.authButton = document.querySelector('.auth-btn');
    if (this.authButton) {
      console.log('✅ Botão de autenticação encontrado:', this.authButton);
      console.log('📍 Botão classes:', this.authButton.className);
      console.log('👆 Botão onclick:', this.authButton.onclick);
    } else {
      console.log('❌ Botão de autenticação não encontrado');
      // Tentar encontrar por outros seletores
      const allButtons = document.querySelectorAll('button');
      console.log('🔍 Todos os botões encontrados:', allButtons.length);
      allButtons.forEach((btn, i) => {
        console.log(`  ${i}:`, btn.className, btn.textContent);
      });
    }
  }

  /**
   * Observa mudanças no botão de autenticação
   */
  observeAuthButton() {
    // Criar um observer para detectar quando o botão muda
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          console.log('🔄 Botão de autenticação mudou, reconfigurando...');
          this.setupAuthButton();
          this.setupEventListeners();
        }
      });
    });

    // Observar o botão
    if (this.authButton) {
      observer.observe(this.authButton, {
        attributes: true,
        attributeFilter: ['class']
      });
    }
  }

  /**
   * Configura os event listeners
   */
  setupEventListeners() {
    console.log('🖱️ Configurando event listeners...');
    if (!this.authButton) {
      console.log('❌ Botão não encontrado para configurar listeners');
      return;
    }

    console.log('🔄 Removendo listeners antigos...');
    // Remover listeners antigos (clonando o botão)
    const newButton = this.authButton.cloneNode(true);
    this.authButton.parentNode.replaceChild(newButton, this.authButton);
    this.authButton = newButton;

    console.log('🖱️ Configurando listener no botão:', this.authButton.className);
    
    this.authButton.addEventListener('click', (e) => {
      console.log('🖱️ Botão de perfil clicado via ProfileMenuManager');
      e.preventDefault();
      e.stopPropagation();
      this.toggleMenu();
    });
    
    console.log('✅ Listener configurado com sucesso');
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
    console.log('📱 Tamanho da tela:', window.innerWidth, 'x', window.innerHeight);
    console.log('📱 É mobile?', window.innerWidth <= 768);

    // Fechar menu existente
    this.closeMenu();

    // Criar novo menu
    this.createMenu();
    this.setupMenuEventListeners();
    this.isOpen = true;
    this.updateBodyScroll();
    
    // Verificar se o menu foi criado
    setTimeout(() => {
      if (this.menuElement) {
        console.log('✅ Menu criado com sucesso');
        console.log('📍 Posição do menu:', this.menuElement.getBoundingClientRect());
        console.log('🎨 Estilos computados:', window.getComputedStyle(this.menuElement).position);
        console.log('👁️ Visível:', this.menuElement.offsetParent !== null);
      } else {
        console.error('❌ Menu não foi criado');
      }
    }, 100);
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
  }

  /**
   * Posiciona o menu corretamente
   */
  positionMenu() {
    if (!this.menuElement || !this.authButton) return;

    // Sempre adicionar ao pai do botão para garantir posicionamento correto
    const parent = this.authButton.parentNode;
    const parentStyle = window.getComputedStyle(parent);
    
    console.log('👨‍👩‍👧‍👦 Container pai:', parent, parentStyle.position);
    
    if (parentStyle.position === 'static') {
      parent.style.position = 'relative';
      console.log('🔧 Definindo position: relative no pai');
    }
    
    // Limpar estilos inline para usar CSS
    this.menuElement.style.cssText = '';
    parent.appendChild(this.menuElement);
    
    // Verificar se está em mobile para ajustar posicionamento via CSS
    const isMobile = window.innerWidth <= 768;
    console.log('📱 É mobile?', isMobile);
    
    if (isMobile) {
      // Em mobile, ajustar via CSS para garantir que apareça abaixo do botão
      const buttonRect = this.authButton.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      this.menuElement.style.cssText = `
        position: absolute !important;
        top: ${this.authButton.offsetTop + this.authButton.offsetHeight + 8}px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        min-width: 280px !important;
        max-width: 90vw !important;
        z-index: 9999 !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        visibility: visible !important;
      `;
      
      console.log('📱 Posicionamento mobile - top:', this.authButton.offsetTop + this.authButton.offsetHeight + 8);
    }
    
    console.log('✅ Menu adicionado ao pai');
    
    // Adicionar classe active no próximo frame para animação suave
    requestAnimationFrame(() => {
      console.log('🎬 Adicionando classe active');
      this.menuElement.classList.add('active');
      
      // Verificar posição final
      setTimeout(() => {
        const rect = this.menuElement.getBoundingClientRect();
        console.log('📍 Posição final do menu:', rect);
        console.log('👁️ Menu visível?', rect.width > 0 && rect.height > 0);
      }, 50);
    });
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
    this.closeMenu();
    this.showProfileModal();
  }

  viewMyProducts() {
    console.log('📦 Meus Produtos clicado');
    this.closeMenu();
    this.showMyProductsModal();
  }

  viewMyReviews() {
    console.log('⭐ Minhas Avaliações clicado');
    this.closeMenu();
    this.showMyReviewsModal();
  }

  viewSettings() {
    console.log('⚙️ Configurações clicado');
    this.closeMenu();
    this.showSettingsModal();
  }

  /**
   * Mostra modal do perfil do usuário
   */
  showProfileModal() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) return;

    const usuario = JSON.parse(usuarioLogado);

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'profile-modal-overlay';
    modalOverlay.innerHTML = `
      <div class="profile-modal">
        <div class="profile-modal-header">
          <h3>Meu Perfil</h3>
          <button class="profile-modal-close" onclick="this.closest('.profile-modal-overlay').remove()">×</button>
        </div>
        <div class="profile-modal-content">
          <div class="profile-info-card">
            <div class="profile-avatar-large">
              ${usuario.nome.charAt(0).toUpperCase()}
            </div>
            <div class="profile-details">
              <h4>${usuario.nome}</h4>
              <p class="profile-email">${usuario.email}</p>
              <p class="profile-member">Membro desde: ${new Date(usuario.dataCadastro || Date.now()).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <div class="profile-stats">
            <div class="stat-item">
              <span class="stat-number">${this.getUserOrderCount()}</span>
              <span class="stat-label">Pedidos</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${this.getUserReviewCount()}</span>
              <span class="stat-label">Avaliações</span>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);
    this.setupModalEvents(modalOverlay);
  }

  /**
   * Mostra modal de Meus Produtos
   */
  showMyProductsModal() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) return;

    const usuario = JSON.parse(usuarioLogado);
    const produtos = this.getUserProducts(usuario.email);

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'products-modal-overlay';
    modalOverlay.innerHTML = `
      <div class="products-modal">
        <div class="products-modal-header">
          <h3>Meus Produtos</h3>
          <button class="products-modal-close" onclick="this.closest('.products-modal-overlay').remove()">×</button>
        </div>
        <div class="products-modal-content">
          ${produtos.length === 0 ? 
            '<div class="no-products">Você ainda não cadastrou produtos.</div>' :
            this.renderProductsList(produtos)
          }
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);
    this.setupModalEvents(modalOverlay);
  }

  /**
   * Mostra modal de Minhas Avaliações
   */
  showMyReviewsModal() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) return;

    const usuario = JSON.parse(usuarioLogado);
    const avaliacoes = this.getUserReviews(usuario.email);

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'reviews-modal-overlay';
    modalOverlay.innerHTML = `
      <div class="reviews-modal">
        <div class="reviews-modal-header">
          <h3>Minhas Avaliações</h3>
          <button class="reviews-modal-close" onclick="this.closest('.reviews-modal-overlay').remove()">×</button>
        </div>
        <div class="reviews-modal-content">
          ${avaliacoes.length === 0 ? 
            '<div class="no-reviews">Você ainda não fez avaliações.</div>' :
            this.renderReviewsList(avaliacoes)
          }
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);
    this.setupModalEvents(modalOverlay);
  }

  /**
   * Mostra modal de Configurações
   */
  showSettingsModal() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) return;

    const usuario = JSON.parse(usuarioLogado);

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'settings-modal-overlay';
    modalOverlay.innerHTML = `
      <div class="settings-modal">
        <div class="settings-modal-header">
          <h3>Configurações</h3>
          <button class="settings-modal-close" onclick="this.closest('.settings-modal-overlay').remove()">×</button>
        </div>
        <div class="settings-modal-content">
          <div class="settings-section">
            <h4>📧 Notificações por Email</h4>
            <div class="setting-item">
              <label class="setting-label">
                <input type="checkbox" ${usuario.notificacoesEmail !== false ? 'checked' : ''}>
                <span>Receber atualizações de pedidos</span>
              </label>
            </div>
            <div class="setting-item">
              <label class="setting-label">
                <input type="checkbox" ${usuario.notificacoesPromocoes !== false ? 'checked' : ''}>
                <span>Receber promoções e ofertas</span>
              </label>
            </div>
          </div>
          
          <div class="settings-section">
            <h4>🔐 Segurança</h4>
            <div class="setting-item">
              <button class="btn-outline" onclick="profileMenuManager.changePassword()">
                Alterar Senha
              </button>
            </div>
            <div class="setting-item">
              <button class="btn-outline" onclick="profileMenuManager.deleteAccount()">
                Excluir Conta
              </button>
            </div>
          </div>
          
          <div class="settings-section">
            <h4>🎨 Preferências</h4>
            <div class="setting-item">
              <label class="setting-label">
                <select class="setting-select">
                  <option value="light" ${usuario.tema === 'light' ? 'selected' : ''}>Tema Claro</option>
                  <option value="dark" ${usuario.tema === 'dark' ? 'selected' : ''}>Tema Escuro</option>
                  <option value="auto" ${!usuario.tema || usuario.tema === 'auto' ? 'selected' : ''}>Automático</option>
                </select>
              </label>
            </div>
          </div>
          
          <div class="settings-actions">
            <button class="btn-primary" onclick="profileMenuManager.saveSettings()">
              Salvar Configurações
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);
    this.setupModalEvents(modalOverlay);
  }

  /**
   * Configura eventos genéricos para modais
   */
  setupModalEvents(modalOverlay) {
    // Fechar ao clicar no overlay
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.remove();
      }
    });

    // Fechar com ESC
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        modalOverlay.remove();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    // Animar entrada
    requestAnimationFrame(() => {
      modalOverlay.classList.add('active');
    });
  }

  /**
   * Obtém quantidade de pedidos do usuário
   */
  getUserOrderCount() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) return 0;

    const usuario = JSON.parse(usuarioLogado);
    const todosPedidos = JSON.parse(localStorage.getItem('pedidos') || '[]');
    return todosPedidos.filter(p => p.email === usuario.email).length;
  }

  /**
   * Obtém quantidade de avaliações do usuário
   */
  getUserReviewCount() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) return 0;

    const usuario = JSON.parse(usuarioLogado);
    const avaliacoes = JSON.parse(localStorage.getItem('avaliacoes') || '[]');
    return avaliacoes.filter(a => a.email === usuario.email).length;
  }

  /**
   * Obtém produtos do usuário
   */
  getUserProducts(email) {
    const produtos = JSON.parse(localStorage.getItem('produtos') || '[]');
    return produtos.filter(p => p.vendedor === email);
  }

  /**
   * Obtém avaliações do usuário
   */
  getUserReviews(email) {
    const avaliacoes = JSON.parse(localStorage.getItem('avaliacoes') || '[]');
    return avaliacoes.filter(a => a.email === email);
  }

  /**
   * Renderiza lista de produtos
   */
  renderProductsList(produtos) {
    return `
      <div class="products-list">
        ${produtos.map(produto => `
          <div class="product-item">
            <img src="${produto.imagem || 'images/placeholder.png'}" alt="${produto.nome}" class="product-image">
            <div class="product-info">
              <h4>${produto.nome}</h4>
              <p class="product-price">R$ ${parseFloat(produto.preco).toFixed(2)}</p>
              <p class="product-date">Cadastrado em: ${new Date(produto.dataCadastro).toLocaleDateString('pt-BR')}</p>
            </div>
            <div class="product-actions">
              <button class="btn-outline" onclick="profileMenuManager.editProduct('${produto.codigo}')">
                Editar
              </button>
              <button class="btn-danger" onclick="profileMenuManager.deleteProduct('${produto.codigo}')">
                Excluir
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Renderiza lista de avaliações
   */
  renderReviewsList(avaliacoes) {
    return `
      <div class="reviews-list">
        ${avaliacoes.map(avaliacao => `
          <div class="review-item">
            <div class="review-header">
              <div class="review-product">
                <h4>${avaliacao.produtoNome}</h4>
                <div class="review-rating">
                  ${this.renderStars(avaliacao.nota)}
                </div>
              </div>
              <div class="review-date">
                ${new Date(avaliacao.data).toLocaleDateString('pt-BR')}
              </div>
            </div>
            <div class="review-content">
              <p>${avaliacao.comentario}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Renderiza estrelas de avaliação
   */
  renderStars(nota) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += i <= nota ? '⭐' : '☆';
    }
    return stars;
  }

  /**
   * Funções placeholder para configurações
   */
  changePassword() {
    this.showNotification('Funcionalidade de alterar senha em desenvolvimento', 'info');
  }

  deleteAccount() {
    this.showConfirmDialog(
      'Tem certeza que deseja excluir sua conta?',
      'Esta ação não poderá ser desfeita e todos os seus dados serão perdidos.',
      () => {
        this.showNotification('Funcionalidade de excluir conta em desenvolvimento', 'info');
      }
    );
  }

  saveSettings() {
    this.showNotification('Configurações salvas com sucesso!', 'success');
    setTimeout(() => {
      document.querySelector('.settings-modal-overlay')?.remove();
    }, 1000);
  }

  editProduct(codigo) {
    this.showNotification(`Editando produto ${codigo}`, 'info');
  }

  deleteProduct(codigo) {
    this.showConfirmDialog(
      'Tem certeza que deseja excluir este produto?',
      'Esta ação não poderá ser desfeita.',
      () => {
        this.showNotification('Produto excluído com sucesso!', 'success');
        setTimeout(() => {
          this.showMyProductsModal();
        }, 1000);
      }
    );
  }

  viewOrders() {
    console.log('📋 Meus Pedidos clicado');
    this.closeMenu();
    
    // Criar pedidos de teste se não existirem
    this.createTestOrdersIfNeeded();
    
    this.showOrdersModal();
  }

  /**
   * Cria pedidos de teste para demonstração
   */
  createTestOrdersIfNeeded() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) return;

    const usuario = JSON.parse(usuarioLogado);
    const userEmail = usuario.email;
    
    // Verificar se já existem pedidos
    let pedidos = JSON.parse(localStorage.getItem('pedidos') || '[]');
    const pedidosUsuario = pedidos.filter(p => p.email === userEmail);
    
    if (pedidosUsuario.length === 0) {
      // Criar pedidos de teste
      const testOrders = [
        {
          id: Date.now() - 86400000, // Ontem
          email: userEmail,
          data: new Date(Date.now() - 86400000).toISOString(),
          status: 'entregue',
          total: 2599.90,
          itens: [
            {
              nome: 'Processador Intel Core i5-10400F',
              quantidade: 1,
              preco: 899.90,
              imagem: 'images/products/placeholder.png'
            },
            {
              nome: 'Memória RAM DDR4 8GB 3200MHz',
              quantidade: 2,
              preco: 350.00,
              imagem: 'images/products/placeholder.png'
            }
          ]
        },
        {
          id: Date.now() - 172800000, // 2 dias atrás
          email: userEmail,
          data: new Date(Date.now() - 172800000).toISOString(),
          status: 'enviado',
          total: 1899.00,
          itens: [
            {
              nome: 'Placa Mãe Gigabyte B560M DS3H',
              quantidade: 1,
              preco: 699.00,
              imagem: 'images/products/placeholder.png'
            },
            {
              nome: 'SSD NVMe 480GB',
              quantidade: 1,
              preco: 399.00,
              imagem: 'images/products/placeholder.png'
            }
          ]
        },
        {
          id: Date.now(), // Hoje
          email: userEmail,
          data: new Date().toISOString(),
          status: 'pendente',
          total: 3599.80,
          itens: [
            {
              nome: 'Placa de Vídeo RTX 3060 12GB',
              quantidade: 1,
              preco: 2599.80,
              imagem: 'images/products/placeholder.png'
            },
            {
              nome: 'Fonte 650W 80 Plus',
              quantidade: 1,
              preco: 399.00,
              imagem: 'images/products/placeholder.png'
            }
          ]
        }
      ];
      
      // Adicionar aos pedidos existentes
      pedidos = [...pedidos, ...testOrders];
      localStorage.setItem('pedidos', JSON.stringify(pedidos));
      
      console.log('📋 Pedidos de teste criados:', testOrders.length);
    }
  }

  /**
   * Mostra modal com todos os pedidos do usuário
   */
  showOrdersModal() {
    // Obter pedidos do localStorage
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) return;

    const usuario = JSON.parse(usuarioLogado);
    const userEmail = usuario.email;
    
    // Obter todos os pedidos e filtrar pelo usuário
    const todosPedidos = JSON.parse(localStorage.getItem('pedidos') || '[]');
    const pedidosUsuario = todosPedidos.filter(pedido => pedido.email === userEmail);
    
    console.log('📋 Pedidos encontrados:', pedidosUsuario.length);
    console.log('📋 Detalhes dos pedidos:', pedidosUsuario);

    // Criar modal
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'orders-modal-overlay';
    modalOverlay.innerHTML = `
      <div class="orders-modal">
        <div class="orders-modal-header">
          <h3>Meus Pedidos</h3>
          <button class="orders-modal-close" onclick="this.closest('.orders-modal-overlay').remove()">×</button>
        </div>
        <div class="orders-modal-content">
          ${pedidosUsuario.length === 0 ? 
            '<div class="no-orders">Você ainda não possui pedidos.</div>' :
            this.renderOrdersList(pedidosUsuario)
          }
        </div>
      </div>
    `;

    // Adicionar ao body e configurar eventos
    document.body.appendChild(modalOverlay);
    
    // Fechar ao clicar no overlay
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.remove();
      }
    });

    // Fechar com ESC
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        modalOverlay.remove();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    // Animar entrada
    requestAnimationFrame(() => {
      modalOverlay.classList.add('active');
    });
  }

  /**
   * Renderiza a lista de pedidos
   */
  renderOrdersList(pedidos) {
    return `
      <div class="orders-list">
        ${pedidos.map((pedido, index) => `
          <div class="order-item">
            <div class="order-header">
              <div class="order-info">
                <span class="order-number">Pedido #${pedido.id || index + 1}</span>
                <span class="order-date">${new Date(pedido.data).toLocaleDateString('pt-BR')}</span>
              </div>
              <div class="order-status ${pedido.status || 'pendente'}">
                ${this.getOrderStatusText(pedido.status || 'pendente')}
              </div>
            </div>
            <div class="order-items">
              ${pedido.itens.map(item => `
                <div class="order-item-product">
                  <img src="${item.imagem || 'images/placeholder.png'}" alt="${item.nome}" class="order-item-image">
                  <div class="order-item-details">
                    <h4>${item.nome}</h4>
                    <p>Quantidade: ${item.quantidade}</p>
                    <p class="order-item-price">R$ ${item.preco.toFixed(2)}</p>
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="order-footer">
              <div class="order-total">
                <strong>Total: R$ ${pedido.total.toFixed(2)}</strong>
              </div>
              <div class="order-actions">
                <button class="btn-outline" onclick="profileMenuManager.viewOrderDetails(${index})">
                  Ver Detalhes
                </button>
                ${pedido.status === 'pendente' ? 
                  `<button class="btn-primary" onclick="profileMenuManager.cancelOrder(${index})">
                    Cancelar Pedido
                  </button>` : ''
                }
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Obtém texto do status do pedido
   */
  getOrderStatusText(status) {
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

  /**
   * Ver detalhes de um pedido específico
   */
  viewOrderDetails(orderIndex) {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) return;

    const usuario = JSON.parse(usuarioLogado);
    const userEmail = usuario.email;
    const todosPedidos = JSON.parse(localStorage.getItem('pedidos') || '[]');
    const pedidosUsuario = todosPedidos.filter(pedido => pedido.email === userEmail);
    const pedido = pedidosUsuario[orderIndex];

    if (!pedido) return;

    alert(`Detalhes do Pedido #${pedido.id || orderIndex + 1}\n\n` +
          `Data: ${new Date(pedido.data).toLocaleDateString('pt-BR')}\n` +
          `Status: ${this.getOrderStatusText(pedido.status || 'pendente')}\n` +
          `Total: R$ ${pedido.total.toFixed(2)}\n\n` +
          `Itens:\n${pedido.itens.map(item => 
            `- ${item.nome} (Qtd: ${item.quantidade}) - R$ ${item.preco.toFixed(2)}`
          ).join('\n')}`);
  }

  /**
   * Cancela um pedido
   */
  cancelOrder(orderIndex) {
    this.showConfirmDialog(
      'Tem certeza que deseja cancelar este pedido?',
      'Esta ação não poderá ser desfeita.',
      () => {
        // Executar cancelamento
        this.executeOrderCancellation(orderIndex);
      }
    );
  }

  /**
   * Mostra diálogo de confirmação personalizado
   */
  showConfirmDialog(title, message, onConfirm) {
    // Remover diálogos existentes
    const existingDialog = document.querySelector('.confirm-dialog-overlay');
    if (existingDialog) {
      existingDialog.remove();
    }

    // Criar overlay de confirmação
    const confirmOverlay = document.createElement('div');
    confirmOverlay.className = 'confirm-dialog-overlay';
    confirmOverlay.innerHTML = `
      <div class="confirm-dialog">
        <div class="confirm-dialog-icon">⚠️</div>
        <h3 class="confirm-dialog-title">${title}</h3>
        <p class="confirm-dialog-message">${message}</p>
        <div class="confirm-dialog-actions">
          <button class="btn-cancel" onclick="this.closest('.confirm-dialog-overlay').remove()">
            Não
          </button>
          <button class="btn-confirm" onclick="profileMenuManager.confirmOrderAction()">
            Sim, Cancelar
          </button>
        </div>
      </div>
    `;

    // Adicionar ao body
    document.body.appendChild(confirmOverlay);

    // Armazenar callback para uso posterior
    this.pendingConfirmCallback = onConfirm;

    // Animar entrada
    requestAnimationFrame(() => {
      confirmOverlay.classList.add('active');
    });

    // Fechar com ESC
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        confirmOverlay.remove();
        document.removeEventListener('keydown', escHandler);
        this.pendingConfirmCallback = null;
      }
    };
    document.addEventListener('keydown', escHandler);

    // Fechar ao clicar no overlay (apenas no fundo)
    confirmOverlay.addEventListener('click', (e) => {
      if (e.target === confirmOverlay) {
        confirmOverlay.remove();
        this.pendingConfirmCallback = null;
      }
    });
  }

  /**
   * Executa a ação confirmada
   */
  confirmOrderAction() {
    if (this.pendingConfirmCallback) {
      this.pendingConfirmCallback();
      this.pendingConfirmCallback = null;
    }

    // Remover o diálogo
    const dialog = document.querySelector('.confirm-dialog-overlay');
    if (dialog) {
      dialog.remove();
    }
  }

  /**
   * Executa o cancelamento do pedido
   */
  executeOrderCancellation(orderIndex) {
    console.log('🔄 Executando cancelamento do pedido índice:', orderIndex);
    
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) return;

    const usuario = JSON.parse(usuarioLogado);
    const userEmail = usuario.email;
    let todosPedidos = JSON.parse(localStorage.getItem('pedidos') || '[]');
    
    console.log('📋 Pedidos antes do cancelamento:', todosPedidos);
    
    // Primeiro, filtrar pedidos do usuário
    const pedidosUsuario = todosPedidos.filter(p => p.email === userEmail);
    
    // Obter o pedido específico pelo índice no array filtrado
    const pedidoFiltrado = pedidosUsuario[orderIndex];
    
    if (!pedidoFiltrado) {
      console.error('❌ Pedido não encontrado no índice:', orderIndex);
      this.showNotification('Erro: Pedido não encontrado', 'error');
      return;
    }
    
    console.log('📋 Pedido a ser cancelado:', pedidoFiltrado);
    
    // Encontrar o índice real do pedido no array completo
    const pedidoIndexReal = todosPedidos.findIndex(p => 
      p.email === userEmail && p.id === pedidoFiltrado.id
    );
    
    console.log('📍 Índice real do pedido:', pedidoIndexReal);
    
    if (pedidoIndexReal !== -1) {
      // Atualizar status
      todosPedidos[pedidoIndexReal].status = 'cancelado';
      
      console.log('📋 Pedido após atualização:', todosPedidos[pedidoIndexReal]);
      
      // Salvar no localStorage
      localStorage.setItem('pedidos', JSON.stringify(todosPedidos));
      
      // Forçar atualização do localStorage
      const pedidosVerificados = JSON.parse(localStorage.getItem('pedidos') || '[]');
      console.log('✅ Verificação do localStorage:', pedidosVerificados);
      
      // Mostrar notificação de sucesso
      this.showNotification('Pedido cancelado com sucesso!', 'success');
      
      // Remover modal atual completamente
      const modalAtual = document.querySelector('.orders-modal-overlay');
      if (modalAtual) {
        console.log('🗑️ Removendo modal atual');
        modalAtual.remove();
      }
      
      // Recarregar o modal após um pequeno delay
      setTimeout(() => {
        console.log('🔄 Recarregando modal de pedidos');
        this.showOrdersModal();
      }, 1500);
    } else {
      console.error('❌ Não foi possível encontrar o pedido para cancelar');
      this.showNotification('Erro ao cancelar pedido', 'error');
    }
  }

  /**
   * Mostra notificação simples
   */
  showNotification(message, type = 'info') {
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

    // Remover automaticamente após 3 segundos
    setTimeout(() => {
      notification.classList.add('hide');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 3000);
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
  console.log('🚀 DOM carregado, aguardando configuração do botão...');
  
  // Aguardar um pouco para garantir que o checkAuthStatus() tenha sido executado
  setTimeout(() => {
    console.log('⏰ Delay finalizado, criando ProfileMenuManager...');
    profileMenuManager = new ProfileMenuManager();
    console.log('✅ ProfileMenuManager criado:', profileMenuManager);
    
    // Forçar uma verificação do botão após a inicialização
    setTimeout(() => {
      if (profileMenuManager) {
        profileMenuManager.setupAuthButton();
        profileMenuManager.setupEventListeners();
      }
    }, 100);
  }, 500);
});

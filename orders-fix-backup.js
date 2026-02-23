// === CORREÇÃO DO MODAL DE PEDIDOS COM DETALHES DOS PRODUTOS ===
// Script para resolver problemas de travamento e mostrar produtos

// Função corrigida para abrir modal de pedidos
function openOrdersModalFixed() {
  console.log('🔧 Abrindo modal de pedidos com correção...');
  
  try {
    // 1. Fechar outros modais primeiro
    closeAllModals();
    
    // 2. Remover classes conflitantes
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    
    // 3. Buscar o overlay do modal
    const overlay = document.getElementById('ordersModalOverlay');
    if (!overlay) {
      console.error('❌ Modal de pedidos não encontrado');
      alert('Erro: Modal de pedidos não encontrado. Recarregue a página.');
      return;
    }
    
    // 4. Resetar estilos do overlay
    overlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: rgba(0, 0, 0, 0.7) !important;
      z-index: 10000 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: all !important;
    `;
    
    // 5. Carregar pedidos com tratamento de erro
    loadOrdersSafely();
    
    // 6. Prevenir scroll no body
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    
    // 7. Adicionar event listeners para fechar
    setupModalEventListeners();
    
    console.log('✅ Modal de pedidos aberto com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao abrir modal de pedidos:', error);
    alert('Erro ao abrir Meus Pedidos. Tente recarregar a página.');
  }
}

// Função para fechar todos os modais
function closeAllModals() {
  const modals = [
    'ordersModalOverlay',
    'profileModalOverlay', 
    'productsModalOverlay',
    'reviewsModalOverlay',
    'settingsModalOverlay',
    'simpleCheckoutOverlay',
    'cartOverlay'
  ];
  
  modals.forEach(modalId => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
  });
  
  document.body.style.overflow = '';
  document.body.classList.remove('modal-open');
}

// Função segura para carregar pedidos COM DETALHES DOS PRODUTOS
function loadOrdersSafely() {
  try {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const ordersList = document.getElementById('ordersList');
    
    if (!ordersList) {
      console.error('❌ Lista de pedidos não encontrada');
      return;
    }
    
    // Limpar lista atual
    ordersList.innerHTML = '';
    
    if (orders.length === 0) {
      ordersList.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #6b7280;">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 16px; opacity: 0.5;">
            <path d="M9 11H3v10h6V11z"></path>
            <path d="M15 3H9v18h6V3z"></path>
            <path d="M21 7h-6v14h6V7z"></path>
          </svg>
          <h4>Nenhum pedido encontrado</h4>
          <p>Você ainda não fez nenhum pedido.</p>
        </div>
      `;
      return;
    }
    
    // Renderizar pedidos de forma simples e performática COM PRODUTOS DETALHADOS
    let html = '';
    orders.slice(0, 50).forEach(order => {
      const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('pt-BR');
      const total = order.totals?.total || 0;
      const itemsCount = order.items?.length || 0;
      
      // Gerar lista de produtos DETALHADA
      let itemsHtml = '';
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          const itemName = item.name || item.nome || 'Produto sem nome';
          const itemQuantity = item.quantity || item.quantidade || 1;
          const itemPrice = item.price || item.preco || 0;
          const itemTotal = itemPrice * itemQuantity;
          
          itemsHtml += `
            <div style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px;">
              <div style="font-weight: 500; color: #374151;">${itemName}</div>
              <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                <span style="color: #6b7280;">${itemQuantity}x R$ ${itemPrice.toFixed(2)}</span>
                <span style="font-weight: 600; color: #3b82f6;">R$ ${itemTotal.toFixed(2)}</span>
              </div>
            </div>
          `;
        });
      } else {
        itemsHtml = '<div style="padding: 20px; text-align: center; color: #6b7280;">Nenhum item encontrado</div>';
      }
      
      html += `
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; background: white;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <strong>#${order.id || 'N/A'}</strong>
            <span style="color: #6b7280; font-size: 14px;">${orderDate}</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px; margin-bottom: 16px;">
            <div>
              <strong>Cliente:</strong> ${order.customer?.nome || 'Não informado'}
            </div>
            <div>
              <strong>Itens:</strong> ${itemsCount}
            </div>
            <div>
              <strong>Total:</strong> <span style="color: #3b82f6; font-weight: bold;">R$ ${total.toFixed(2)}</span>
            </div>
            <div>
              <strong>Status:</strong> 
              <span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
                ${order.status === 'completed' ? 'Confirmado' : 'Pendente'}
              </span>
            </div>
          </div>
          
          <!-- DETALHES DOS PRODUTOS -->
          <div style="margin-top: 12px; padding: 12px; background: #f8fafc; border-radius: 6px;">
            <div style="font-weight: 600; margin-bottom: 8px; color: #1f2937;">📦 Produtos:</div>
            ${itemsHtml}
          </div>
        </div>
      `;
    });
    
    ordersList.innerHTML = html;
    
    // Atualizar estatísticas
    updateOrderStatsSafe(orders);
    
  } catch (error) {
    console.error('❌ Erro ao carregar pedidos:', error);
    const ordersList = document.getElementById('ordersList');
    if (ordersList) {
      ordersList.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #ef4444;">
          <h4>Erro ao carregar pedidos</h4>
          <p>Tente recarregar a página.</p>
        </div>
      `;
    }
  }
}

// Função segura para atualizar estatísticas
function updateOrderStatsSafe(orders) {
  try {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => 
      order.status !== 'completed' && order.status !== 'confirmado'
    ).length;
    const completedOrders = orders.filter(order => 
      order.status === 'completed' || order.status === 'confirmado'
    ).length;
    
    const totalEl = document.getElementById('totalOrders');
    const pendingEl = document.getElementById('pendingOrders');
    const completedEl = document.getElementById('completedOrders');
    
    if (totalEl) totalEl.textContent = totalOrders;
    if (pendingEl) pendingEl.textContent = pendingOrders;
    if (completedEl) completedEl.textContent = completedOrders;
    
  } catch (error) {
    console.error('❌ Erro ao atualizar estatísticas:', error);
  }
}

// Configurar event listeners do modal
function setupModalEventListeners() {
  const overlay = document.getElementById('ordersModalOverlay');
  if (!overlay) return;
  
  // Fechar ao clicar no overlay
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      closeOrdersModalFixed();
    }
  });
  
  // Fechar com ESC
  const handleEscape = function(e) {
    if (e.key === 'Escape') {
      closeOrdersModalFixed();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

// Função para fechar modal
function closeOrdersModalFixed() {
  console.log('🔧 Fechando modal de pedidos...');
  
  const overlay = document.getElementById('ordersModalOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    overlay.style.display = 'none';
  }
  
  document.body.style.overflow = '';
  document.body.classList.remove('modal-open');
}

// Substituir a função original
window.openOrdersModal = openOrdersModalFixed;
window.closeOrdersModal = closeOrdersModalFixed;

// Adicionar correção de CSS dinamicamente
const fixStyles = document.createElement('style');
fixStyles.textContent = `
  /* Correções para modal de pedidos */
  .orders-modal-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: rgba(0, 0, 0, 0.7) !important;
    z-index: 10000 !important;
    display: none !important;
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }
  
  .orders-modal-overlay.active {
    display: flex !important;
    opacity: 1 !important;
    visibility: visible !important;
    pointer-events: all !important;
  }
  
  .orders-modal {
    background: white !important;
    border-radius: 12px !important;
    max-width: 900px !important;
    width: 95% !important;
    max-height: 90vh !important;
    overflow-y: auto !important;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25) !important;
    transform: scale(1) !important;
    pointer-events: all !important;
  }
  
  body.modal-open {
    overflow: hidden !important;
  }
  
  /* Prevenir conflitos com outros modais */
  .orders-modal-overlay * {
    pointer-events: auto !important;
  }
`;

document.head.appendChild(fixStyles);

console.log('🔧 Correção do modal de pedidos COM PRODUTOS DETALHADOS carregada');

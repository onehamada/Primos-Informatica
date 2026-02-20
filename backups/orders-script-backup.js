// === SISTEMA DE PEDIDOS === */

let currentFilter = 'all';

function openOrdersModal() {
  loadOrders();
  document.getElementById('ordersModalOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeOrdersModal() {
  document.getElementById('ordersModalOverlay').classList.remove('active');
  document.body.style.overflow = 'auto';
}

function filterOrders(filter) {
  currentFilter = filter;
  
  // Atualizar botões
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  loadOrders();
}

function loadOrders() {
  const orders = JSON.parse(localStorage.getItem('orders') || '[]');
  const ordersList = document.getElementById('ordersList');
  
  // Atualizar estatísticas
  updateOrderStats(orders);
  
  // Filtrar pedidos
  let filteredOrders = orders;
  if (currentFilter === 'pending') {
    filteredOrders = orders.filter(order => 
      order.status === 'pending' || order.status === 'aguardando_validacao'
    );
  } else if (currentFilter === 'completed') {
    filteredOrders = orders.filter(order => 
      order.status === 'completed' || order.status === 'confirmado'
    );
  }
  
  // Ordenar por data (mais recente primeiro)
  filteredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  if (filteredOrders.length === 0) {
    ordersList.innerHTML = `
      <div class="orders-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 2a1 1 0 0 0 0-2v2a1 1 0 0 0 2 2h2a1 1 0 0 0 2-2V2a1 1 0 0 0-2-2H9a1 1 0 0 0-2 2v2a1 1 0 0 0 2 2h2a1 1 0 0 0 2-2V2a1 1 0 0 0-2-2H9z"/>
          <polyline points="9,2 9,22 15,22"/>
        </svg>
        <h4>Nenhum pedido encontrado</h4>
        <p>Você ainda não fez nenhum pedido ou não há pedidos com este filtro.</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  filteredOrders.forEach(order => {
    const statusClass = getOrderStatusClass(order.status);
    const statusText = getOrderStatusText(order.status);
    const orderDate = new Date(order.createdAt).toLocaleDateString('pt-BR');
    
    html += `
      <div class="order-item">
        <div class="order-header">
          <span class="order-id">#${order.id}</span>
          <span class="order-date">${orderDate}</span>
          <span class="order-status ${statusClass}">${statusText}</span>
        </div>
        
        <div class="order-details">
          <div class="order-customer">
            <div class="detail-label">👤 Cliente</div>
            <div class="detail-value">${order.customer?.nome || 'Não informado'}</div>
          </div>
          
          <div class="order-customer">
            <div class="detail-label">📞 Telefone</div>
            <div class="detail-value">${order.customer?.telefone || 'Não informado'}</div>
          </div>
          
          <div class="order-items">
            <div class="detail-label">📦 Itens (${order.items?.length || 0})</div>
            <div class="detail-value">
              ${order.items?.map(item => 
                `${item.name || item.nome || 'Produto'} (${item.quantity || item.quantidade || 1}x)`
              ).join('<br>') || 'Nenhum item'}
            </div>
          </div>
          
          <div class="order-totals">
            <div class="detail-label">💰 Total</div>
            <div class="detail-value total-amount">R$ ${order.totals?.total?.toFixed(2) || '0,00'}</div>
          </div>
        </div>
      </div>
    `;
  });
  
  ordersList.innerHTML = html;
}

function updateOrderStats(orders) {
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => 
    order.status === 'pending' || order.status === 'aguardando_validacao'
  ).length;
  const completedOrders = orders.filter(order => 
    order.status === 'completed' || order.status === 'confirmado'
  ).length;
  
  document.getElementById('totalOrders').textContent = totalOrders;
  document.getElementById('pendingOrders').textContent = pendingOrders;
  document.getElementById('completedOrders').textContent = completedOrders;
}

function getOrderStatusClass(status) {
  switch (status) {
    case 'pending':
    case 'aguardando_validacao':
      return 'pending';
    case 'completed':
    case 'confirmado':
      return 'completed';
    default:
      return 'pending';
  }
}

function getOrderStatusText(status) {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'aguardando_validacao':
      return 'Aguardando Validação';
    case 'completed':
      return 'Confirmado';
    case 'confirmado':
      return 'Concluído';
    default:
      return 'Pendente';
  }
}

// Global functions
window.openOrdersModal = openOrdersModal;
window.closeOrdersModal = closeOrdersModal;
window.filterOrders = filterOrders;

// === NOVO SISTEMA DE CHECKOUT ===

// Variável global para evitar problemas de escopo
let currentDeliveryFee = 15; // Padrão inicial

// Funções auxiliares para obter dados do usuário logado (compatível com sistema existente)
function getCurrentUserEmail() {
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  if (usuarioLogado) {
    try {
      const usuario = JSON.parse(usuarioLogado);
      return usuario.email || '';
    } catch (e) {
      console.error('Erro ao parsear usuário logado:', e);
      return '';
    }
  }
  return '';
}

function getCurrentUserId() {
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  if (usuarioLogado) {
    try {
      const usuario = JSON.parse(usuarioLogado);
      return usuario.id || '';
    } catch (e) {
      console.error('Erro ao obter ID do usuário:', e);
      return '';
    }
  }
  return '';
}

function getCurrentUserName() {
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  if (usuarioLogado) {
    try {
      const usuario = JSON.parse(usuarioLogado);
      return usuario.nome || '';
    } catch (e) {
      console.error('Erro ao obter nome do usuário:', e);
      return '';
    }
  }
  return '';
}

function openSimpleCheckout() {
  console.log('openSimpleCheckout chamado');
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  if (cart.length === 0) {
    alert('Seu carrinho está vazio!');
    return;
  }
  
  updateSimpleCheckoutSummary();
  const modal = document.getElementById('simpleCheckoutOverlay');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  } else {
    console.error('Modal de checkout não encontrado');
    return;
  }
  
  // Garantir que as opções de entrega estejam corretas ao abrir
  setTimeout(() => {
    updatePaymentOptions();
  }, 100);
}

function closeSimpleCheckout() {
  const modal = document.getElementById('simpleCheckoutOverlay');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    document.getElementById('simpleCheckoutForm').reset();
    clearSimpleErrors();
  }
}

function clearSimpleErrors() {
  document.querySelectorAll('.simple-error').forEach(error => {
    error.textContent = '';
    error.style.display = 'none';
  });
  
  document.querySelectorAll('.simple-form-group input').forEach(input => {
    input.style.borderColor = '#e5e7eb';
  });
}

function showSimpleError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const error = document.getElementById(fieldId + 'Error');
  
  if (input) input.style.borderColor = '#ef4444';
  if (error) {
    error.textContent = message;
    error.style.display = 'block';
  }
}

function updatePaymentOptions() {
  const deliveryOption = document.querySelector('input[name="delivery"]:checked').value;
  const uberPaymentOptions = document.getElementById('uberPaymentOptions');
  const retiradaPaymentOptions = document.getElementById('retiradaPaymentOptions');
  const enderecoGroup = document.getElementById('enderecoGroup');
  const enderecoInput = document.getElementById('simpleEndereco');
  const deliveryCalc = document.getElementById('deliveryCalc');
  
  if (deliveryOption === 'uber') {
    uberPaymentOptions.style.display = 'block';
    retiradaPaymentOptions.style.display = 'none';
    enderecoGroup.style.display = 'block';
    enderecoInput.setAttribute('required', '');
    deliveryCalc.style.display = 'block';
    
    // Manter seleção atual se for PIX ou Transferência
    const currentPayment = document.querySelector('input[name="payment"]:checked');
    if (currentPayment && !currentPayment.value.includes('retirada')) {
      // Já está correto, não mudar
    } else {
      // Selecionar PIX por padrão
      document.querySelector('input[name="payment"][value="pix"]').checked = true;
    }
  } else {
    uberPaymentOptions.style.display = 'none';
    retiradaPaymentOptions.style.display = 'block';
    enderecoGroup.style.display = 'none';
    enderecoInput.removeAttribute('required');
    enderecoInput.value = ''; // Limpar endereço quando for retirada
    deliveryCalc.style.display = 'none';
    currentDeliveryFee = 0; // Zerar taxa para retirada
    
    // Selecionar PIX-retirada por padrão
    document.querySelector('input[name="payment"][value="pix-retirada"]').checked = true;
  }
  
  updateSimpleCheckoutSummary();
}

function calculateDeliveryFee() {
  const cep = document.getElementById('simpleCep').value.replace(/\D/g, '');
  const cepError = document.getElementById('simpleCepError');
  const deliveryResult = document.getElementById('deliveryResult');
  const deliveryDistance = document.querySelector('.delivery-distance');
  const deliveryFeeElement = document.querySelector('.delivery-fee');
  
  // Limpar erro anterior
  cepError.textContent = '';
  cepError.style.display = 'none';
  
  // Validar CEP
  if (cep.length !== 8) {
    cepError.textContent = 'CEP inválido';
    cepError.style.display = 'block';
    return;
  }
  
  // Simular cálculo baseado no CEP (apenas exemplo)
  const cepNum = parseInt(cep);
  let distance = 0;
  let fee = 15;
  
  // Lógica simulada por faixa de CEP
  if (cepNum >= 70000000 && cepNum <= 70999999) {
    // Brasília - próximo
    distance = '5 km';
    fee = 12;
  } else if (cepNum >= 71000000 && cepNum <= 71999999) {
    // Região metropolitana
    distance = '15 km';
    fee = 20;
  } else if (cepNum >= 72000000 && cepNum <= 73999999) {
    // Entorno
    distance = '30 km';
    fee = 35;
  } else {
    // Longa distância
    distance = '50+ km';
    fee = 50;
  }
  
  currentDeliveryFee = fee;
  
  // Mostrar resultado
  deliveryDistance.textContent = `Distância estimada: ${distance}`;
  deliveryFeeElement.textContent = `Taxa de entrega: R$ ${fee.toFixed(2)}`;
  deliveryResult.style.display = 'block';
  
  // Atualizar resumo
  updateSimpleCheckoutSummary();
}

function updateSimpleCheckoutSummary() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const itemsContainer = document.getElementById('simpleCheckoutItems');
  
  let subtotal = 0;
  let html = '';
  
  cart.forEach(item => {
    // Verificar se o item tem propriedade name ou nome
    const itemName = item.name || item.nome || 'Produto sem nome';
    const itemPrice = item.price || item.preco || 0;
    const itemQuantity = item.quantity || item.quantidade || 1;
    const itemTotal = itemPrice * itemQuantity;
    subtotal += itemTotal;
    
    html += `
      <div class="simple-checkout-item">
        <div class="simple-checkout-item-name">${itemName}</div>
        <div class="simple-checkout-item-price">R$ ${itemTotal.toFixed(2)}</div>
      </div>
    `;
  });
  
  itemsContainer.innerHTML = html;
  
  const deliveryOption = document.querySelector('input[name="delivery"]:checked').value;
  const deliveryFee = deliveryOption === 'uber' ? currentDeliveryFee : 0;
  const total = subtotal + deliveryFee;
  
  document.getElementById('simpleSubtotal').textContent = `R$ ${subtotal.toFixed(2)}`;
  document.getElementById('simpleDelivery').textContent = deliveryFee === 0 ? 'GRÁTIS' : `R$ ${deliveryFee.toFixed(2)}`;
  document.getElementById('simpleTotal').textContent = `R$ ${total.toFixed(2)}`;
}

function validateSimpleCheckout() {
  clearSimpleErrors();
  let isValid = true;
  
  const nome = document.getElementById('simpleNome').value.trim();
  const telefone = document.getElementById('simpleTelefone').value.trim();
  const endereco = document.getElementById('simpleEndereco').value.trim();
  const deliveryOption = document.querySelector('input[name="delivery"]:checked').value;
  
  if (!nome) {
    showSimpleError('simpleNome', 'Nome é obrigatório');
    isValid = false;
  } else if (nome.length < 3) {
    showSimpleError('simpleNome', 'Nome deve ter pelo menos 3 caracteres');
    isValid = false;
  }
  
  if (!telefone) {
    showSimpleError('simpleTelefone', 'Telefone é obrigatório');
    isValid = false;
  }
  
  // Endereço só é obrigatório para entrega
  if (deliveryOption === 'uber' && !endereco) {
    showSimpleError('simpleEndereco', 'Endereço é obrigatório para entrega');
    isValid = false;
  }
  
  return isValid;
}

function processSimpleCheckout(event) {
  console.log('processSimpleCheckout chamado!');
  event.preventDefault();
  
  if (!validateSimpleCheckout()) {
    console.log('Validação falhou');
    return;
  }
  
  console.log('Validação passou, processando pedido...');
  
  const formData = new FormData(event.target);
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const deliveryOption = formData.get('delivery');
  const paymentOption = formData.get('payment');
  
  // Calcular totais primeiro
  const subtotal = cart.reduce((sum, item) => {
    const itemPrice = item.price || item.preco || 0;
    const itemQuantity = item.quantity || item.quantidade || 1;
    return sum + (itemPrice * itemQuantity);
  }, 0);
  
  const deliveryFee = deliveryOption === 'uber' ? currentDeliveryFee : 0;
  const total = subtotal + deliveryFee;
  
  // Criar objeto do pedido
  const order = {
    id: Date.now(),
    // Adicionar informações do usuário logado para compatibilidade
    email: getCurrentUserEmail(),
    usuarioId: getCurrentUserId(),
    usuarioEmail: getCurrentUserEmail(),
    nome: getCurrentUserName(), // Adicionar nome do usuário
    customer: {
      nome: formData.get('nome'),
      telefone: formData.get('telefone'),
      endereco: deliveryOption === 'retirada' ? 'Retirada na Loja' : formData.get('endereco')
    },
    delivery: deliveryOption,
    payment: paymentOption,
    status: 'pendente', // Status inicial
    data: new Date().toISOString(), // Data no formato esperado pelo sistema
    items: cart,
    totals: {
      subtotal: subtotal,
      delivery: deliveryFee,
      total: total
    },
    createdAt: new Date().toISOString()
  };
  
  order.totals.total = order.totals.subtotal + order.totals.delivery;
  order.createdAt = new Date().toISOString();
  
  console.log('Pedido criado:', order);
  console.log('Usuário logado:', getCurrentUserEmail());
  
  // Salvar pedido na chave correta para compatibilidade com sistema existente
  const orders = JSON.parse(localStorage.getItem('pedidos') || '[]');
  orders.push(order);
  localStorage.setItem('pedidos', JSON.stringify(orders));
  console.log('Pedido salvo em localStorage:', orders);
  
  // Limpar carrinho
  localStorage.removeItem('cart');
  
  // Atualizar interface do carrinho (se existir função no script principal)
  if (typeof updateCartUI === 'function') {
    updateCartUI();
    console.log('updateCartUI chamado com sucesso');
  } else {
    // Não fazer reload - apenas logar
    console.log('Função updateCartUI não encontrada, mas não recarregando página');
  }
  
  // Fechar modal
  closeSimpleCheckout();
  
  // Montar mensagem para WhatsApp
  let paymentText = '';
  if (paymentOption === 'pix' || paymentOption === 'pix-retirada') {
    paymentText = 'PIX';
  } else if (paymentOption === 'transferencia' || paymentOption === 'transferencia-retirada') {
    paymentText = 'Transferência Bancária';
  } else if (paymentOption === 'dinheiro') {
    paymentText = 'Dinheiro (pagamento na retirada)';
  }
  
  let deliveryText = deliveryOption === 'uber' ? 'Entrega Uber' : 'Retirada na Loja';
  
  const message = `NOVO PEDIDO\n\nCliente: ${order.customer.nome}\nTelefone: ${order.customer.telefone}\nEndereço: ${order.customer.endereco}\n\nEntrega: ${deliveryText}\nPagamento: ${paymentText}\n\nItens: ${cart.length}\nTotal: R$ ${order.totals.total.toFixed(2)}`;
  
  console.log('Mensagem WhatsApp:', message);
  console.log('URL WhatsApp:', `https://wa.me/556133406740?text=${encodeURIComponent(message)}`);
  
  const whatsappUrl = `https://wa.me/556133406740?text=${encodeURIComponent(message)}`;
  
  // Tentar abrir WhatsApp de múltiplas formas
  try {
    window.open(whatsappUrl, '_blank');
    console.log('WhatsApp aberto com window.open');
  } catch (e) {
    console.error('Erro ao abrir WhatsApp com window.open:', e);
    // Tentar com location
    window.location.href = whatsappUrl;
  }
  
  // Função melhorada para cancelar pedido
  function cancelOrder(orderId) {
    console.log('Tentando cancelar pedido:', orderId);
    
    // Confirmar com o usuário
    const confirmed = confirm('Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.');
    
    if (confirmed) {
      try {
        // Buscar pedidos do localStorage
        const orders = JSON.parse(localStorage.getItem('pedidos') || '[]');
        
        // Encontrar e atualizar o pedido
        const orderIndex = orders.findIndex(order => order.id == orderId);
        
        if (orderIndex !== -1) {
          // Atualizar status para 'cancelado'
          orders[orderIndex].status = 'cancelado';
          orders[orderIndex].dataCancelamento = new Date().toISOString();
          
          // Salvar no localStorage
          localStorage.setItem('pedidos', JSON.stringify(orders));
          
          console.log('Pedido cancelado com sucesso:', orderId);
          
          // Mostrar notificação
          if (typeof showNotification === 'function') {
            showNotification('Pedido cancelado com sucesso', 'success');
          } else {
            alert('Pedido cancelado com sucesso!');
          }
          
          // Recarregar a lista de pedidos
          setTimeout(() => {
            if (typeof loadUserOrders === 'function') {
              loadUserOrders();
            } else {
              console.log('Função loadUserOrders não encontrada');
              // Forçar reload da página
              window.location.reload();
            }
          }, 500);
          
        } else {
          console.error('Pedido não encontrado:', orderId);
          alert('Pedido não encontrado!');
        }
      } catch (error) {
        console.error('Erro ao cancelar pedido:', error);
        alert('Erro ao cancelar pedido. Tente novamente.');
      }
    } else {
      console.log('Cancelamento de pedido cancelado pelo usuário');
    }
  }

  // Função para abrir modal de pedidos
  function openOrdersModal() {
    console.log('Abrindo modal de pedidos...');
    
    const ordersModal = document.getElementById('ordersModalOverlay');
    if (ordersModal) {
      ordersModal.classList.add('active');
      document.body.style.overflow = 'hidden';
      console.log('Modal de pedidos aberto com sucesso');
      
      // Forçar atualização dos pedidos após abrir o modal
      setTimeout(() => {
        if (typeof loadUserOrders === 'function') {
          console.log('Carregando pedidos...');
          loadUserOrders();
        } else {
          console.log('Função loadUserOrders não encontrada');
        }
      }, 300);
    } else {
      console.error('Modal de pedidos não encontrado');
    }
  }

  // Event listeners - garantir que funcionem sempre
  function setupCheckoutListeners() {
    const checkoutForm = document.getElementById('simpleCheckoutForm');
    if (checkoutForm) {
      // Remover listeners antigos para evitar duplicação
      checkoutForm.removeEventListener('submit', processSimpleCheckout);
      
      // Adicionar novo listener
      checkoutForm.addEventListener('submit', function(e) {
        console.log('Formulário submetido!');
        e.preventDefault();
        processSimpleCheckout(e);
      });
      console.log('Event listener do formulário adicionado');
    } else {
      console.error('Formulário de checkout não encontrado');
    }
    
    // Adicionar listeners para opções de entrega
    document.querySelectorAll('input[name="delivery"]').forEach(input => {
      input.removeEventListener('change', updatePaymentOptions);
      input.addEventListener('change', function() {
        console.log('Opção de entrega mudada');
        updatePaymentOptions();
      });
    });
    
    console.log('Event listeners do checkout configurados');
  }

  // Chamar setup quando o DOM estiver pronto e quando o modal for aberto
  document.addEventListener('DOMContentLoaded', setupCheckoutListeners);

  // Também chamar quando o modal for aberto
  const originalOpenSimpleCheckout = openSimpleCheckout;
  openSimpleCheckout = function() {
    originalOpenSimpleCheckout();
    setTimeout(setupCheckoutListeners, 300); // Configurar listeners após o modal abrir
  };

  // Global functions
  window.openSimpleCheckout = openSimpleCheckout;
  window.closeSimpleCheckout = closeSimpleCheckout;
  window.updatePaymentOptions = updatePaymentOptions;
  window.calculateDeliveryFee = calculateDeliveryFee;
  window.cancelOrder = cancelOrder;
  window.openOrdersModal = openOrdersModal;

// === NOVO SISTEMA DE CHECKOUT ===

function openSimpleCheckout() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  if (cart.length === 0) {
    alert('Seu carrinho está vazio!');
    return;
  }
  
  updateSimpleCheckoutSummary();
  document.getElementById('simpleCheckoutOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Garantir que as opções de entrega estejam corretas ao abrir
  setTimeout(() => {
    updatePaymentOptions();
  }, 100);
}

function closeSimpleCheckout() {
  document.getElementById('simpleCheckoutOverlay').classList.remove('active');
  document.body.style.overflow = 'auto';
  document.getElementById('simpleCheckoutForm').reset();
  clearSimpleErrors();
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

// Variável global para taxa de entrega
let currentDeliveryFee = 15; // Padrão inicial

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
    deliveryCalc.style.display = 'block'; // Sempre mostrar para entrega
    
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
    deliveryCalc.style.display = 'none'; // Esconder para retirada
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
  // Na prática, você usaria uma API de cálculo de frete
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
  event.preventDefault();
  
  if (!validateSimpleCheckout()) {
    return;
  }
  
  const formData = new FormData(event.target);
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const deliveryOption = formData.get('delivery');
  const paymentOption = formData.get('payment');
  
  const order = {
    id: Date.now(),
    customer: {
      nome: formData.get('nome'),
      telefone: formData.get('telefone'),
      endereco: deliveryOption === 'retirada' ? 'Retirada na Loja' : formData.get('endereco')
    },
    delivery: deliveryOption,
    payment: paymentOption,
    items: cart,
    totals: {
      subtotal: cart.reduce((sum, item) => {
        const itemPrice = item.price || item.preco || 0;
        const itemQuantity = item.quantity || item.quantidade || 1;
        return sum + (itemPrice * itemQuantity);
      }, 0),
      delivery: deliveryOption === 'uber' ? currentDeliveryFee : 0
    },
    createdAt: new Date().toISOString()
  };
  
  order.totals.total = order.totals.subtotal + order.totals.delivery;
  
  // Salvar pedido
  const orders = JSON.parse(localStorage.getItem('orders') || '[]');
  orders.push(order);
  localStorage.setItem('orders', JSON.stringify(orders));
  
  // Limpar carrinho
  localStorage.removeItem('cart');
  
  // Atualizar interface do carrinho (se existir função no script principal)
  if (typeof updateCartUI === 'function') {
    updateCartUI();
  } else {
    // Fallback: recarregar página para atualizar carrinho
    console.log('Função updateCartUI não encontrada, recarregando página...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
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
  
  const whatsappUrl = `https://wa.me/556133406740?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
  
  alert('Pedido enviado com sucesso! Você será redirecionado para o WhatsApp.');
}

// Event listeners
document.getElementById('simpleCheckoutForm').addEventListener('submit', processSimpleCheckout);
document.querySelectorAll('input[name="delivery"]').forEach(input => {
  input.addEventListener('change', updatePaymentOptions);
});

// Global functions
window.openSimpleCheckout = openSimpleCheckout;
window.closeSimpleCheckout = closeSimpleCheckout;
window.updatePaymentOptions = updatePaymentOptions;
window.calculateDeliveryFee = calculateDeliveryFee;

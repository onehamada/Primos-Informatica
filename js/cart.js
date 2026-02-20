// === CART MODULE - Sistema de carrinho de compras ===

// Sistema de carrinho
let cart = [];

// Carregar carrinho do localStorage
function loadCart() {
  try {
    const savedCart = localStorage.getItem('cart');
    cart = savedCart ? JSON.parse(savedCart) : [];
    debugLog('🛒 Carrinho carregado:', cart.length, 'itens');
    updateCartUI();
  } catch (error) {
    console.error('❌ Erro ao carregar carrinho:', error);
    cart = [];
  }
}

// Salvar carrinho no localStorage
function saveCart() {
  try {
    localStorage.setItem('cart', JSON.stringify(cart));
    debugLog('💾 Carrinho salvo:', cart.length, 'itens');
  } catch (error) {
    console.error('❌ Erro ao salvar carrinho:', error);
  }
}

// Adicionar produto ao carrinho
function addToCart(productCode, quantity = 1) {
  if (!productCode) {
    notificationManager.show('Código do produto inválido', 'error');
    return;
  }

  // Encontrar produto
  const product = allProducts.find(p => p.codigo === productCode);
  if (!product) {
    notificationManager.show('Produto não encontrado', 'error');
    return;
  }

  // Verificar se já existe no carrinho
  const existingItem = cart.find(item => item.codigo === productCode);

  if (existingItem) {
    existingItem.quantidade += quantity;
    notificationManager.show(`Quantidade de ${product.nome} atualizada no carrinho!`, 'success');
  } else {
    cart.push({
      codigo: product.codigo,
      nome: product.nome,
      preco: product.preco,
      quantidade: quantity,
      imagem: product.imagem,
      categoria: product.categoria
    });
    notificationManager.show(`${product.nome} adicionado ao carrinho!`, 'success');
  }

  saveCart();
  updateCartUI();
  updateCartBadge();
}

// Remover produto do carrinho
function removeFromCart(productCode) {
  const index = cart.findIndex(item => item.codigo === productCode);
  if (index > -1) {
    const removedItem = cart.splice(index, 1)[0];
    notificationManager.show(`${removedItem.nome} removido do carrinho`, 'info');
    saveCart();
    updateCartUI();
    updateCartBadge();
  }
}

// Atualizar quantidade de um produto no carrinho
function updateCartItemQuantity(productCode, newQuantity) {
  if (newQuantity <= 0) {
    removeFromCart(productCode);
    return;
  }

  const item = cart.find(item => item.codigo === productCode);
  if (item) {
    item.quantidade = newQuantity;
    saveCart();
    updateCartUI();
    updateCartBadge();
  }
}

// Limpar carrinho
function clearCart() {
  cart = [];
  saveCart();
  updateCartUI();
  updateCartBadge();
  notificationManager.show('Carrinho limpo!', 'info');
}

// Calcular total do carrinho
function getCartTotal() {
  return cart.reduce((total, item) => {
    // Verificar se há promoção
    let itemPrice = item.preco;
    if (item.categoria && (item.promocao === true || item.promocao === 'sim')) {
      const promoData = calcularValorPromocional(item.preco, item.categoria);
      itemPrice = promoData.desconto;
    }
    return total + (itemPrice * item.quantidade);
  }, 0);
}

// Calcular quantidade total de itens
function getCartItemCount() {
  return cart.reduce((total, item) => total + item.quantidade, 0);
}

// Atualizar badge do carrinho
function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (badge) {
    const count = getCartItemCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

// Atualizar interface do carrinho
function updateCartUI() {
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  const cartCount = document.getElementById('cart-count');
  const emptyCart = document.getElementById('empty-cart');

  if (!cartItems) return;

  if (cart.length === 0) {
    if (emptyCart) emptyCart.style.display = 'block';
    if (cartItems) cartItems.style.display = 'none';
    if (cartTotal) cartTotal.textContent = 'R$ 0,00';
    if (cartCount) cartCount.textContent = '0 itens';
    return;
  }

  if (emptyCart) emptyCart.style.display = 'none';
  if (cartItems) cartItems.style.display = 'block';

  let itemsHTML = '';
  cart.forEach(item => {
    // Calcular preço com possível desconto
    let itemPrice = item.preco;
    let originalPrice = null;

    if (item.categoria && (item.promocao === true || item.promocao === 'sim')) {
      const promoData = calcularValorPromocional(item.preco, item.categoria);
      itemPrice = promoData.desconto;
      originalPrice = item.preco;
    }

    const itemTotal = itemPrice * item.quantidade;

    itemsHTML += `
      <div class="cart-item">
        <div class="cart-item-image">
          <img src="/images/products/thumbnail/${item.imagem || item.codigo + '.webp'}"
               alt="${item.nome}"
               onerror="this.src='/images/products/thumbnail/default.webp'">
        </div>
        <div class="cart-item-info">
          <h4>${item.nome}</h4>
          <div class="cart-item-price">
            ${originalPrice ? `<span class="original-price">R$ ${originalPrice.toFixed(2).replace('.', ',')}</span>` : ''}
            <span class="current-price">R$ ${itemPrice.toFixed(2).replace('.', ',')}</span>
          </div>
          <div class="cart-item-controls">
            <button onclick="updateCartItemQuantity('${item.codigo}', ${item.quantidade - 1})">-</button>
            <span>${item.quantidade}</span>
            <button onclick="updateCartItemQuantity('${item.codigo}', ${item.quantidade + 1})">+</button>
            <button onclick="removeFromCart('${item.codigo}')" class="remove-btn">🗑️</button>
          </div>
        </div>
        <div class="cart-item-total">
          R$ ${itemTotal.toFixed(2).replace('.', ',')}
        </div>
      </div>
    `;
  });

  cartItems.innerHTML = itemsHTML;

  // Atualizar totais
  if (cartTotal) {
    cartTotal.textContent = formatPrice(getCartTotal());
  }

  if (cartCount) {
    const count = getCartItemCount();
    cartCount.textContent = `${count} ${count === 1 ? 'item' : 'itens'}`;
  }
}

// Toggle carrinho mobile
function toggleCart() {
  const cartModal = document.getElementById('cart-modal');
  if (cartModal) {
    cartModal.classList.toggle('active');
  }
}

// Checkout
function proceedToCheckout() {
  if (cart.length === 0) {
    notificationManager.show('Seu carrinho está vazio!', 'error');
    return;
  }

  // Salvar carrinho para o checkout
  localStorage.setItem('checkout_cart', JSON.stringify(cart));

  // Redirecionar para página de checkout
  window.location.href = '/checkout.html';
}

// Inicializar carrinho
function initCart() {
  loadCart();

  // Adicionar event listeners
  document.addEventListener('DOMContentLoaded', function() {
    // Botão do carrinho
    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn) {
      cartBtn.addEventListener('click', toggleCart);
    }

    // Botão fechar carrinho
    const closeCart = document.getElementById('close-cart');
    if (closeCart) {
      closeCart.addEventListener('click', toggleCart);
    }

    // Botão limpar carrinho
    const clearCartBtn = document.getElementById('clear-cart');
    if (clearCartBtn) {
      clearCartBtn.addEventListener('click', clearCart);
    }

    // Botão checkout
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', proceedToCheckout);
    }
  });

  debugLog('🛒 Sistema de carrinho inicializado');
}

// Exportar funções
window.cart = cart;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartItemQuantity = updateCartItemQuantity;
window.clearCart = clearCart;
window.getCartTotal = getCartTotal;
window.getCartItemCount = getCartItemCount;
window.updateCartUI = updateCartUI;
window.updateCartBadge = updateCartBadge;
window.toggleCart = toggleCart;
window.proceedToCheckout = proceedToCheckout;
window.initCart = initCart;
window.loadCart = loadCart;

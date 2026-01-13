/**
 * SISTEMA DE PRODUTOS - PRIMOS INFORMÁTICA
 * Carregamento, exibição e gerenciamento de produtos
 */

class ProductsSystem {
    constructor() {
        this.products = [];
        this.currentCategory = 'inicio';
        this.searchTerm = '';
        this.filters = {
            priceMin: null,
            priceMax: null,
            categories: [],
            brands: []
        };
        
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.setupEventListeners();
        this.displayProducts();
        
        console.log('📦 ProductsSystem inicializado');
        console.log(`📦 ${this.products.length} produtos carregados`);
    }

    // === CARREGAMENTO DE PRODUTOS ===
    async loadProducts() {
        try {
            // Tentar carregar do JSON local
            const response = await fetch('data/products.json');
            if (response.ok) {
                this.products = await response.json();
                console.log('✅ Produtos carregados do JSON');
                return;
            }
        } catch (error) {
            console.warn('⚠️ Erro ao carregar JSON, usando dados de exemplo');
        }

        // Dados de exemplo caso o JSON falhe
        this.products = [
            {
                codigo: "1006",
                nome: "MONITOR 19\" HAYOM MO6001 PROMOÇÃO",
                categoria: "monitor",
                preco: 285.00,
                qt: 1,
                descricao: "Monitor 19\" MO6001",
                marca: "Hayom",
                promocao: true,
                imagem: "monitor-hayom-19-mo6001.webp"
            },
            {
                codigo: "400772",
                nome: "MONITOR 21.5 PHILIPS LED FULL HD 221V8 WVA HDMI",
                categoria: "monitor",
                preco: 825.00,
                qt: 1,
                descricao: "Monitor 21,5\" Full HD 221V8 WVA HDMI",
                marca: "Philips",
                promocao: false,
                imagem: "monitor-philips-215-fullhd-221v8.webp"
            },
            {
                codigo: "1117",
                nome: "MONITOR 15,4 HAYOM MO 6006",
                categoria: "monitor",
                preco: 300.00,
                qt: 1,
                descricao: "Monitor 15,4\" MO6006",
                marca: "Hayom",
                promocao: false,
                imagem: "monitor-hayom-154-mo6006.webp"
            }
        ];
        
        console.log('📦 Usando dados de exemplo');
    }

    // === CONFIGURAÇÃO DE EVENT LISTENERS ===
    setupEventListeners() {
        // Busca
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.searchProducts(e.target.value);
            });
        }

        // Filtros
        const applyFiltersBtn = document.querySelector('.apply-filters-btn');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        }

        const clearFiltersBtn = document.querySelector('.clear-filters-btn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }

        // Categorias
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.target || e.currentTarget.textContent.toLowerCase();
                this.showCategory(category);
            });
        });
    }

    // === EXIBIÇÃO DE PRODUTOS ===
    displayProducts(products = this.products) {
        const container = document.getElementById('products-container');
        if (!container) {
            console.warn('⚠️ Container de produtos não encontrado');
            return;
        }

        if (products.length === 0) {
            container.innerHTML = `
                <div class="no-products">
                    <div class="no-products-icon">📦</div>
                    <h3>Nenhum produto encontrado</h3>
                    <p>Tente ajustar os filtros ou fazer uma nova busca</p>
                </div>
            `;
            return;
        }

        container.innerHTML = products.map(product => this.createProductCard(product)).join('');
        
        // Adicionar event listeners aos botões
        this.attachProductEventListeners();
        
        // Lazy loading nas imagens
        this.setupImageLoading();
    }

    createProductCard(product) {
        const price = this.formatPrice(product.preco);
        const originalPrice = product.promocao ? this.formatPrice(product.preco * 1.2) : '';
        const promoBadge = product.promocao ? '<span class="promo-badge">PROMOÇÃO</span>' : '';
        const imageSrc = `images/products/${product.imagem}`;
        const placeholderSrc = 'images/placeholder.png';

        return `
            <div class="product-card" data-category="${product.categoria}" data-brand="${product.marca}" data-price="${product.preco}">
                <div class="product-image">
                    <img src="${placeholderSrc}" data-src="${imageSrc}" alt="${product.nome}" loading="lazy">
                    ${promoBadge}
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.nome}</h3>
                    <p class="product-description">${product.descricao}</p>
                    <div class="product-meta">
                        <span class="product-brand">${product.marca}</span>
                        <span class="product-code">Cód: ${product.codigo}</span>
                    </div>
                    <div class="product-price">
                        ${originalPrice ? `<span class="original-price">${originalPrice}</span>` : ''}
                        <span class="current-price">${price}</span>
                    </div>
                    <div class="product-actions">
                        <button class="btn-primary add-to-cart" data-product='${JSON.stringify(product).replace(/'/g, "&apos;")}'>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            Adicionar
                        </button>
                        <button class="btn-outline quick-view" data-product='${JSON.stringify(product).replace(/'/g, "&apos;")}'>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // === GERENCIAMENTO DE CATEGORIAS ===
    showCategory(category) {
        this.currentCategory = category;
        
        // Atualizar navegação
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-target="${category}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Filtrar produtos
        let filteredProducts = this.products;
        
        if (category !== 'inicio' && category !== 'promo') {
            filteredProducts = this.products.filter(product => 
                product.categoria.toLowerCase().includes(category.toLowerCase())
            );
        } else if (category === 'promo') {
            filteredProducts = this.products.filter(product => product.promocao);
        }

        // Exibir produtos
        this.displayProducts(filteredProducts);
        
        // Atualizar título da página
        this.updatePageTitle(category);
    }

    // === BUSCA ===
    handleSearch(e) {
        const term = e.target.value.toLowerCase();
        this.searchTerm = term;
        
        if (term.length < 2) {
            this.displayProducts();
            return;
        }

        const filteredProducts = this.products.filter(product => 
            product.nome.toLowerCase().includes(term) ||
            product.descricao.toLowerCase().includes(term) ||
            product.marca.toLowerCase().includes(term) ||
            product.categoria.toLowerCase().includes(term)
        );

        this.displayProducts(filteredProducts);
    }

    searchProducts(term) {
        this.searchTerm = term.toLowerCase();
        this.handleSearch({ target: { value: term } });
    }

    // === FILTROS ===
    applyFilters() {
        const minPrice = document.getElementById('minPrice')?.value;
        const maxPrice = document.getElementById('maxPrice')?.value;
        const categoryCheckboxes = document.querySelectorAll('input[name="category"]:checked');
        const brandCheckboxes = document.querySelectorAll('input[name="brand"]:checked');

        this.filters = {
            priceMin: minPrice ? parseFloat(minPrice) : null,
            priceMax: maxPrice ? parseFloat(maxPrice) : null,
            categories: Array.from(categoryCheckboxes).map(cb => cb.value),
            brands: Array.from(brandCheckboxes).map(cb => cb.value)
        };

        let filteredProducts = this.products;

        // Aplicar filtros
        if (this.filters.priceMin) {
            filteredProducts = filteredProducts.filter(p => p.preco >= this.filters.priceMin);
        }

        if (this.filters.priceMax) {
            filteredProducts = filteredProducts.filter(p => p.preco <= this.filters.priceMax);
        }

        if (this.filters.categories.length > 0) {
            filteredProducts = filteredProducts.filter(p => 
                this.filters.categories.includes(p.categoria)
            );
        }

        if (this.filters.brands.length > 0) {
            filteredProducts = filteredProducts.filter(p => 
                this.filters.brands.includes(p.marca)
            );
        }

        this.displayProducts(filteredProducts);
        this.closeFilters();
    }

    clearFilters() {
        // Limpar inputs
        document.getElementById('minPrice').value = '';
        document.getElementById('maxPrice').value = '';
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);

        // Resetar filtros
        this.filters = {
            priceMin: null,
            priceMax: null,
            categories: [],
            brands: []
        };

        // Recarregar produtos
        this.displayProducts();
        this.closeFilters();
    }

    // === CARRINHO ===
    attachProductEventListeners() {
        // Botões de adicionar ao carrinho
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productData = e.currentTarget.dataset.product;
                const product = JSON.parse(productData);
                this.addToCart(product);
            });
        });

        // Botões de quick view
        document.querySelectorAll('.quick-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productData = e.currentTarget.dataset.product;
                const product = JSON.parse(productData);
                this.showQuickView(product);
            });
        });
    }

    addToCart(product) {
        // Verificar se existe sistema de carrinho
        if (window.cartSystem) {
            window.cartSystem.addItem(product);
        } else {
            // Sistema básico de carrinho
            let cart = JSON.parse(localStorage.getItem('primos_cart')) || [];
            
            const existingItem = cart.find(item => item.codigo === product.codigo);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({
                    ...product,
                    quantity: 1
                });
            }
            
            localStorage.setItem('primos_cart', JSON.stringify(cart));
            this.updateCartCount();
            this.showNotification('Produto adicionado ao carrinho!');
        }
    }

    updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            const cart = JSON.parse(localStorage.getItem('primos_cart')) || [];
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'inline' : 'none';
        }
    }

    // === IMAGENS ===
    setupImageLoading() {
        const images = document.querySelectorAll('img[data-src]');
        
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    
                    // Criar imagem temporária para verificar se carrega
                    const tempImg = new Image();
                    tempImg.onload = () => {
                        img.src = src;
                        img.classList.add('loaded');
                        img.parentElement.classList.add('loaded');
                    };
                    tempImg.onerror = () => {
                        img.src = 'images/placeholder.png';
                        img.classList.add('error');
                    };
                    tempImg.src = src;
                    
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    // === UTILITÁRIOS ===
    formatPrice(price) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price);
    }

    updatePageTitle(category) {
        const titles = {
            'inicio': 'Início - Primos Informática',
            'promo': 'Promoções - Primos Informática',
            'monitor': 'Monitores - Primos Informática',
            'processador': 'Processadores - Primos Informática',
            'placa de vídeo': 'Placas de Vídeo - Primos Informática',
            'placa mãe': 'Placas Mãe - Primos Informática'
        };

        const title = titles[category] || `${category} - Primos Informática`;
        document.title = title;
    }

    showQuickView(product) {
        // Implementar quick view modal
        console.log('Quick view para:', product);
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    closeFilters() {
        const filtersPanel = document.getElementById('filtersPanel');
        if (filtersPanel) {
            filtersPanel.classList.remove('active');
        }
    }

    // === PÁGINA INICIAL ===
    displayHomeCategories() {
        const container = document.getElementById('home-categories-grid');
        if (!container) return;

        const categories = [
            { name: 'Promoções', icon: '⚡', target: 'promo', color: '#ef4444' },
            { name: 'Processadores', icon: '💻', target: 'processador', color: '#3b82f6' },
            { name: 'Placas de Vídeo', icon: '🎮', target: 'placa de vídeo', color: '#8b5cf6' },
            { name: 'Monitores', icon: '🖥️', target: 'monitor', color: '#10b981' },
            { name: 'SSDs', icon: '💾', target: 'ssd', color: '#f59e0b' },
            { name: 'Fontes', icon: '⚡', target: 'fonte', color: '#06b6d4' }
        ];

        container.innerHTML = categories.map(cat => `
            <div class="category-card" onclick="productsSystem.showCategory('${cat.target}')">
                <div class="category-icon" style="background: ${cat.color}20; color: ${cat.color}">
                    ${cat.icon}
                </div>
                <h3>${cat.name}</h3>
            </div>
        `).join('');
    }

    displayHomeHighlights() {
        const container = document.getElementById('home-highlights-grid');
        if (!container) return;

        const highlights = this.products.filter(p => p.promocao).slice(0, 4);
        
        if (highlights.length === 0) {
            container.innerHTML = '<p>Nenhuma promoção no momento.</p>';
            return;
        }

        container.innerHTML = highlights.map(product => this.createProductCard(product)).join('');
        this.attachProductEventListeners();
        this.setupImageLoading();
    }
}

// === INICIALIZAÇÃO ===
let productsSystem;

document.addEventListener('DOMContentLoaded', () => {
    productsSystem = new ProductsSystem();
    
    // Expor globalmente
    window.productsSystem = productsSystem;
    window.showCategory = (category) => productsSystem.showCategory(category);
    window.searchProducts = (term) => productsSystem.searchProducts(term);
    window.applyFilters = () => productsSystem.applyFilters();
    window.clearFilters = () => productsSystem.clearFilters();
    
    // Carregar página inicial
    setTimeout(() => {
        productsSystem.displayHomeCategories();
        productsSystem.displayHomeHighlights();
        productsSystem.updateCartCount();
    }, 100);
});

// Exportar para uso em outros scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductsSystem;
}

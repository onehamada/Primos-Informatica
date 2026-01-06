// Script de teste para diagnosticar problemas

// Estado global
let __allProducts = [];

// Função principal para mostrar categorias
function showCategory(id) {
  console.log('🔍 Mostrando categoria:', id);
  console.log('📦 Produtos disponíveis:', __allProducts.length);
  
  // Esconde todas as categorias
  document.querySelectorAll('.category').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  
  // Mostra a categoria selecionada
  const target = document.getElementById(id);
  console.log('🎯 Elemento alvo encontrado:', !!target);
  if (target) {
    target.style.display = 'block';
    console.log('✅ Categoria exibida');
  } else {
    console.log('❌ Elemento da categoria não encontrado:', id);
  }
  
  // Ativa o botão da tab
  const btn = document.querySelector(`[data-target="${id}"]`);
  if (btn) {
    btn.classList.add('active');
    console.log('✅ Botão ativado');
  } else {
    console.log('❌ Botão não encontrado:', id);
  }
}

// Função para carregar produtos
async function loadProducts() {
  try {
    console.log('🔄 Carregando produtos...');
    const response = await fetch('data/products.csv');
    const csvText = await response.text();
    
    // Parse simples do CSV
    const lines = csvText.split('\n');
    const headers = lines[0].split(';');
    
    __allProducts = lines.slice(1).filter(line => line.trim()).map(line => {
      const values = line.split(';');
      const product = {};
      headers.forEach((header, index) => {
        product[header.trim()] = values[index] ? values[index].trim() : '';
      });
      return product;
    });
    
    console.log('✅ Produtos carregados:', __allProducts.length);
    
    // Mostra categoria inicial
    showCategory('inicio');
    
  } catch (error) {
    console.error('❌ Erro ao carregar produtos:', error);
  }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Página carregada, iniciando...');
  loadProducts();
});

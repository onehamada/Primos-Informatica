// Teste simples para verificar o processamento de preços
async function testPriceProcessing() {
    console.log('🧪 Iniciando teste de processamento de preços...');
    
    try {
        // Carregar CSV
        const response = await fetch('data/products.csv');
        const csvText = await response.text();
        
        // Processar como o site faz
        const lines = csvText.split('\n').filter(line => line.trim());
        const headers = lines[0].split(';').map(h => h.trim());
        
        const products = lines.slice(1, 6).map((line, index) => { // Testar só os 5 primeiros
            const values = line.split(';');
            const product = {};
            
            headers.forEach((header, headerIndex) => {
                let value = values[headerIndex] || '';
                value = value.trim();
                
                if (header === 'preco') {
                    product.precoRaw = parseFloat(value.replace(',', '.')) || 0;
                    product.preco = formatPrice(product.precoRaw);
                } else if (header === 'nome') {
                    product.nome = value;
                }
            });
            
            return product;
        });
        
        console.log('📊 Resultados do teste:');
        products.forEach((product, index) => {
            console.log(`Produto ${index + 1}:`);
            console.log(`  Nome: ${product.nome}`);
            console.log(`  Preço Raw: ${product.precoRaw}`);
            console.log(`  Preço Formatado: ${product.preco}`);
            console.log('---');
        });
        
        return products;
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

function formatPrice(value) {
    if (typeof value === 'number') return `R$ ${value.toFixed(2).replace('.', ',')}`;
    if (typeof value === 'string') {
        const num = parseFloat(value.replace(',', '.').replace(/[^\d.]/g, ''));
        if (!isNaN(num)) return `R$ ${num.toFixed(2).replace('.', ',')}`;
    }
    return 'R$ 0,00';
}

// Executar teste
testPriceProcessing();

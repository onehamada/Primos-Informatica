const fs = require('fs');
const path = require('path');

// Função para converter CSV para JSON
function convertCSVToJSON(csvText) {
    try {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('CSV precisa ter cabeçalho e pelo menos uma linha de dados');
        }

        const headers = lines[0].split(';').map(h => h.trim());
        const result = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(';');
            if (values.length === headers.length) {
                const obj = {};
                headers.forEach((header, index) => {
                    let value = values[index] ? values[index].trim() : '';

                    // Conversões específicas
                    if (header === 'preco') {
                        // Limpar preço e converter para número
                        value = parseFloat(value.replace(',', '.').replace(/[^\d.]/g, '')) || 0;
                    } else if (header === 'qt') {
                        // Quantidade para número
                        value = parseInt(value) || 1;
                    } else if (header === 'promocao') {
                        // Promoção para booleano
                        value = value.toLowerCase() === 'sim' || value.toLowerCase() === 'true';
                    } else if (header === 'codigo') {
                        // Código para string
                        value = String(value);
                    }

                    obj[header] = value;
                });
                result.push(obj);
            }
        }

        return result;
    } catch (err) {
        throw new Error(`Erro ao processar CSV: ${err.message}`);
    }
}

// Função principal
function regenerateJSON() {
    try {
        console.log('📁 Lendo arquivo products.csv...');
        const csvPath = path.join(__dirname, 'data', 'products.csv');
        const csvContent = fs.readFileSync(csvPath, 'utf8');

        console.log('🔄 Convertendo CSV para JSON...');
        const jsonResult = convertCSVToJSON(csvContent);

        console.log('💾 Salvando products.json...');
        const jsonPath = path.join(__dirname, 'data', 'products.json');
        const jsonString = JSON.stringify(jsonResult, null, 2);
        fs.writeFileSync(jsonPath, jsonString, 'utf8');

        // Estatísticas
        const categories = {};
        let promocoes = 0;

        jsonResult.forEach(product => {
            categories[product.categoria] = (categories[product.categoria] || 0) + 1;
            if (product.promocao) promocoes++;
        });

        console.log('\n' + '='.repeat(50));
        console.log('🎉 CONVERSÃO CSV → JSON CONCLUÍDA!');
        console.log('='.repeat(50));
        console.log(`📊 Total de produtos: ${jsonResult.length}`);
        console.log(`📊 Categorias únicas: ${Object.keys(categories).length}`);
        console.log(`📊 Produtos em promoção: ${promocoes}`);
        console.log(`📊 Marcas únicas: ${[...new Set(jsonResult.map(p => p.marca))].length}`);
        console.log('='.repeat(50));

        // Verificar se o produto específico está em promoção
        const targetProduct = jsonResult.find(p => p.nome === 'FONTE REAL 750 W 80 PLUS MGS');
        if (targetProduct) {
            console.log('\n🔍 Verificação do produto solicitado:');
            console.log(`📦 Nome: ${targetProduct.nome}`);
            console.log(`💰 Preço: R$ ${targetProduct.preco}`);
            console.log(`🏷️ Em promoção: ${targetProduct.promocao ? 'SIM' : 'NÃO'}`);
            console.log(`📊 Quantidade: ${targetProduct.qt}`);
        }

        return {
            success: true,
            stats: {
                total: jsonResult.length,
                categorias: Object.keys(categories).length,
                promocoes: promocoes,
                marcas: [...new Set(jsonResult.map(p => p.marca))].length
            }
        };

    } catch (error) {
        console.error('❌ Erro durante a conversão:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Executar conversão
const result = regenerateJSON();

if (result.success) {
    console.log('✅ Arquivo products.json atualizado com sucesso!');
    console.log('🚀 Site pronto com dados atualizados!');
} else {
    console.error('❌ Falha na conversão');
    process.exit(1);
}

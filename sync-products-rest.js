#!/usr/bin/env node
/**
 * Script para sincronizar produtos usando REST API do Firestore
 * Este script NÃO requer autenticação de serviço, apenas o ProjectId
 * Uso: node sync-products-rest.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'primos-informatica-ecommerce';
const API_KEY = 'AIzaSyAvJUdjnY7xjnlTSYJAQZ6safylKXKlzLc'; // Sua chave do firebase-config.js

/**
 * Fazer requisição HTTPS
 */
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'firestore.googleapis.com',
      port: 443,
      path: `${path}?key=${API_KEY}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch {
          resolve(body);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Sincronizar produtos
 */
async function syncProductsToFirestore() {
  try {
    console.log('🚀 Iniciando sincronização de produtos...\n');

    // Ler produtos
    const productsPath = path.join(__dirname, 'data', 'products.json');
    if (!fs.existsSync(productsPath)) {
      console.error('❌ Arquivo não encontrado:', productsPath);
      process.exit(1);
    }

    const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    const products = Array.isArray(productsData) ? productsData : [];

    console.log(`📊 Total de produtos a sincronizar: ${products.length}`);

    if (products.length === 0) {
      console.error('❌ Nenhum produto encontrado!');
      process.exit(1);
    }

    // Sincronizar cada produto
    let synchronized = 0;
    let errors = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      try {
        const docPath = `/v1/projects/${PROJECT_ID}/databases/(default)/documents/products/${product.codigo}`;
        
        const docData = {
          fields: {
            codigo: { stringValue: String(product.codigo || '') },
            nome: { stringValue: String(product.nome || '').trim() },
            categoria: { stringValue: String(product.categoria || '').toLowerCase().trim() },
            preco: { doubleValue: parseFloat(String(product.preco).replace(',', '.')) || 0 },
            qt: { integerValue: String(parseInt(product.qt) || 0) },
            descricao: { stringValue: String(product.descricao || '').trim() },
            marca: { stringValue: String(product.marca || '').trim() },
            promocao: { booleanValue: Boolean(product.promocao && product.promocao !== 'não') },
            imagem: { stringValue: String(product.imagem || '').trim() },
            ativo: { booleanValue: product.ativo !== false && product.ativo !== 'não' }
          }
        };

        const result = await makeRequest('PATCH', docPath, { fields: docData.fields });
        
        synchronized++;
        if ((i + 1) % 50 === 0) {
          console.log(`✓ Sincronizados ${i + 1}/${products.length} produtos...`);
        }
      } catch (error) {
        errors++;
        console.error(`❌ Erro ao sincronizar produto ${product.codigo}:`, error.message);
      }
    }

    console.log('\n✅ Sincronização concluída!');
    console.log(`   📊 Produtos sincronizados: ${synchronized}`);
    if (errors > 0) {
      console.log(`   ⚠️  Erros: ${errors}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante sincronização:', error.message);
    process.exit(1);
  }
}

syncProductsToFirestore();

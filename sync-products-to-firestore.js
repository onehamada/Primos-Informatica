#!/usr/bin/env node
/**
 * Script para sincronizar produtos do products.json para Firestore
 * Uso: node sync-products-to-firestore.js
 */

const fs = require('fs');
const path = require('path');

// Importar Firebase Admin SDK
const admin = require('firebase-admin');

// Se não estiver em produção, usar arquivo de credenciais local
if (!process.env.FIREBASE_CONFIG) {
  const serviceAccountPath = path.join(__dirname, 'firebase-key.json');
  if (fs.existsSync(serviceAccountPath)) {
    process.env.FIREBASE_CONFIG = serviceAccountPath;
  }
}

// Inicializar Firebase Admin
try {
  if (process.env.FIREBASE_CONFIG && fs.existsSync(process.env.FIREBASE_CONFIG)) {
    const serviceAccount = require(process.env.FIREBASE_CONFIG);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://primos-informatica-ecommerce-default-rtdb.firebaseio.com'
    });
  } else {
    // Tentar usar credenciais padrão (funciona em produção)
    admin.initializeApp();
  }
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase Admin:', error.message);
  console.log('\n💡 Para usar este script localmente, você precisa:');
  console.log('1. Baixar a chave privada do Firebase Console');
  console.log('2. Salvar em minha-loja/firebase-key.json');
  console.log('3. Executar de novo');
  process.exit(1);
}

const db = admin.firestore();

/**
 * Sincronizar produtos para Firestore
 */
async function syncProductsToFirestore() {
  try {
    console.log('🚀 Iniciando sincronização de produtos...\n');

    // Ler arquivo de produtos
    const productsPath = path.join(__dirname, 'data', 'products.json');
    
    if (!fs.existsSync(productsPath)) {
      console.error('❌ Arquivo não encontrado:', productsPath);
      process.exit(1);
    }

    const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    const products = Array.isArray(productsData) ? productsData : [];

    console.log(`📊 Total de produtos a sincronizar: ${products.length}`);
    
    if (products.length === 0) {
      console.error('❌ Nenhum produto encontrado no arquivo!');
      process.exit(1);
    }

    // Verificar quantos produtos já existem
    const existingSnapshot = await db.collection('products').get();
    console.log(`📦 Produtos existentes no Firebase: ${existingSnapshot.size}`);

    // Opção de limpar antes de sincronizar
    if (existingSnapshot.size > 0) {
      console.log('⚠️  Firebase já tem produtos. Deletando antes de resincronizar...');
      
      const batch = db.batch();
      let count = 0;
      
      for (const doc of existingSnapshot.docs) {
        batch.delete(doc.ref);
        count++;
        if (count % 500 === 0) {
          await batch.commit();
          console.log(`  ✓ Deletrados ${count} documentos...`);
        }
      }
      
      if (count % 500 !== 0) {
        await batch.commit();
      }
      
      console.log(`✅ ${count} produtos antigos deletados\n`);
    }

    // Sincronizar novos produtos em lotes
    const batchSize = 500;
    let synchronized = 0;
    let errors = 0;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = db.batch();
      const batchEnd = Math.min(i + batchSize, products.length);
      const batchProducts = products.slice(i, batchEnd);

      for (const product of batchProducts) {
        try {
          const docRef = db.collection('products').doc(String(product.codigo));
          
          // Normalizar dados do produto
          const normalizedProduct = {
            codigo: String(product.codigo || ''),
            nome: String(product.nome || '').trim(),
            categoria: String(product.categoria || '').toLowerCase().trim(),
            preco: parseFloat(String(product.preco).replace(',', '.')) || 0,
            qt: parseInt(product.qt) || 0,
            descricao: String(product.descricao || '').trim(),
            marca: String(product.marca || '').trim(),
            promocao: Boolean(product.promocao && product.promocao !== 'não'),
            imagem: String(product.imagem || '').trim(),
            modelo: String(product.modelo || '').trim(),
            origem: String(product.origem || 'admin').trim(),
            ativo: product.ativo !== false && product.ativo !== 'não',
            criadoEm: admin.firestore.FieldValue.serverTimestamp(),
            atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
          };

          batch.set(docRef, normalizedProduct);
          synchronized++;
        } catch (error) {
          errors++;
          console.error(`❌ Erro ao processar produto ${product.codigo}:`, error.message);
        }
      }

      await batch.commit();
      console.log(`✓ Sincronizados ${Math.min(synchronized + batchProducts.length, products.length)}/${products.length} produtos...`);
    }

    console.log('\n✅ Sincronização concluída!');
    console.log(`   📊 Produtos sincronizados: ${synchronized}`);
    if (errors > 0) {
      console.log(`   ⚠️  Erros: ${errors}`);
    }

    // Verificar resultado final
    const finalSnapshot = await db.collection('products').get();
    console.log(`   🔍 Produtos no Firebase agora: ${finalSnapshot.size}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante sincronização:', error);
    process.exit(1);
  }
}

// Executar sincronização
syncProductsToFirestore();

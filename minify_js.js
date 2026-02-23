const fs = require('fs');
const path = require('path');

// Função avançada de minificação JavaScript
function minifyJS(js) {
  return js
    // Remover comentários de bloco
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remover comentários de linha
    .replace(/\/\/.*$/gm, '')
    // Remover quebras de linha e tabs extras
    .replace(/[\r\n\t]+/g, ' ')
    // Remover espaços múltiplos
    .replace(/\s+/g, ' ')
    // Remover espaços antes e depois de símbolos específicos
    .replace(/\s*([{}();,:=+\-*/&|!<>?\[\]])\s*/g, '$1')
    // Remover espaços após palavras-chave
    .replace(/\b(if|for|while|function|return|var|let|const|class)\s+/g, '$1')
    // Remover espaços desnecessários em estruturas de controle
    .replace(/}\s*else/g, '}else')
    .replace(/else\s*{/g, 'else{')
    // Remover espaços em arrays e objetos
    .replace(/,\s*/g, ',')
    .replace(/:\s*/g, ':')
    // Remover ponto e vírgula desnecessário no final
    .replace(/;$/, '')
    // Trim final
    .trim();
}

// Função para otimizar nomes de variáveis (básica)
function optimizeVariableNames(js) {
  // Esta é uma implementação básica - uma completa seria muito complexa
  // Por enquanto, apenas remove declarações var desnecessárias em loops
  return js.replace(/for\s*\(\s*var\s+/g, 'for(let ');
}

// Função para remover código morto (console.log em produção)
function removeDeadCode(js) {
  // Remover console.log, console.debug, etc. em produção
  return js
    .replace(/console\.(log|debug|info|warn|error|table|trace)\s*\([^)]*\)\s*;?\s*/g, '')
    .replace(/DEBUG\s*&&\s*console\.(log|debug|info|warn|error|table|trace)\s*\([^)]*\)\s*;?\s*/g, '');
}

// Função para comprimir strings
function compressStrings(js) {
  // Comprimir strings duplicadas (básico)
  return js;
}

// Função principal
function minifyJSFile(inputPath, outputPath) {
  try {
    console.log('📁 Lendo arquivo JavaScript...');
    const jsContent = fs.readFileSync(inputPath, 'utf8');

    console.log('🔧 Aplicando minificação básica...');
    let minified = minifyJS(jsContent);

    console.log('🧹 Removendo código morto...');
    minified = removeDeadCode(minified);

    console.log('🏷️ Otimizando variáveis...');
    minified = optimizeVariableNames(minified);

    console.log('📝 Comprimindo strings...');
    minified = compressStrings(minified);

    console.log('💾 Salvando arquivo minificado...');
    fs.writeFileSync(outputPath, minified, 'utf8');

    // Estatísticas
    const originalSize = jsContent.length;
    const minifiedSize = minified.length;
    const reduction = ((originalSize - minifiedSize) / originalSize * 100);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 JAVASCRIPT MINIFICADO COM SUCESSO!');
    console.log('='.repeat(50));
    console.log(`📊 Tamanho original: ${originalSize.toLocaleString()} bytes`);
    console.log(`📊 Tamanho minificado: ${minifiedSize.toLocaleString()} bytes`);
    console.log(`📊 Redução: ${reduction.toFixed(2)}%`);
    console.log(`📊 Bytes economizados: ${(originalSize - minifiedSize).toLocaleString()}`);
    console.log('='.repeat(50));

    return {
      originalSize,
      minifiedSize,
      reduction,
      success: true
    };

  } catch (error) {
    console.error('❌ Erro durante a minificação:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Função para minificar todos os arquivos JS do projeto
function minifyAllJS() {
  const jsFiles = [
    { input: 'js/main.js', output: 'js/main.min.js' },
    { input: 'js/core.js', output: 'js/core.min.js' },
    { input: 'js/router.js', output: 'js/router.min.js' },
    { input: 'js/products.js', output: 'js/products.min.js' },
    { input: 'js/cart.js', output: 'js/cart.min.js' },
    { input: 'js/reviews.js', output: 'js/reviews.min.js' },
    { input: 'js/ui.js', output: 'js/ui.min.js' }
  ];

  let totalOriginal = 0;
  let totalMinified = 0;

  console.log('🚀 Iniciando minificação de todos os arquivos JavaScript...\n');

  for (const file of jsFiles) {
    const inputPath = path.join(__dirname, file.input);
    const outputPath = path.join(__dirname, file.output);

    if (fs.existsSync(inputPath)) {
      console.log(`\n📄 Processando ${file.input}...`);
      const result = minifyJSFile(inputPath, outputPath);

      if (result.success) {
        totalOriginal += result.originalSize;
        totalMinified += result.minifiedSize;
        console.log(`✅ ${file.output} criado`);
      }
    } else {
      console.log(`⚠️ Arquivo ${file.input} não encontrado, pulando...`);
    }
  }

  // Estatísticas totais
  if (totalOriginal > 0) {
    const totalReduction = ((totalOriginal - totalMinified) / totalOriginal * 100);

    console.log('\n' + '='.repeat(60));
    console.log('🎊 TODOS OS ARQUIVOS JAVASCRIPT MINIFICADOS!');
    console.log('='.repeat(60));
    console.log(`📊 Tamanho total original: ${totalOriginal.toLocaleString()} bytes`);
    console.log(`📊 Tamanho total minificado: ${totalMinified.toLocaleString()} bytes`);
    console.log(`📊 Redução total: ${totalReduction.toFixed(2)}%`);
    console.log(`📊 Bytes totais economizados: ${(totalOriginal - totalMinified).toLocaleString()}`);
    console.log('='.repeat(60));
  }
}

// Verificar argumentos da linha de comando
const args = process.argv.slice(2);

if (args.includes('--all')) {
  // Minificar todos os arquivos JS
  minifyAllJS();
} else if (args.length >= 2) {
  // Minificar arquivo específico
  const inputPath = path.resolve(args[0]);
  const outputPath = path.resolve(args[1]);
  const result = minifyJSFile(inputPath, outputPath);

  if (result.success) {
    console.log('✅ Arquivo minificado com sucesso!');
  } else {
    console.error('❌ Falha na minificação');
    process.exit(1);
  }
} else {
  // Modo padrão: minificar main.js
  console.log('🔧 Modo padrão: minificando js/main.js para js/main.min.js');
  console.log('💡 Use --all para minificar todos os arquivos JavaScript');
  console.log('💡 Ou especifique: node minify_js.js input.js output.js');

  const result = minifyJSFile(
    path.join(__dirname, 'js', 'main.js'),
    path.join(__dirname, 'js', 'main.min.js')
  );

  if (result.success) {
    console.log('✅ Arquivo main.min.js criado com sucesso!');
  } else {
    console.error('❌ Falha na minificação');
    process.exit(1);
  }
}

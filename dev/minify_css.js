const fs = require('fs');
const path = require('path');

// Ler o arquivo CSS
const cssPath = path.join(__dirname, 'css', 'styles.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

// Minificar CSS
let minified = cssContent
  // Remover comentários
  .replace(/\/\*[\s\S]*?\*\//g, '')
  // Remover espaços em branco extras
  .replace(/\s+/g, ' ')
  // Remover espaços antes e depois de ; : , { }
  .replace(/\s*([:;,{}])\s*/g, '$1')
  // Remover espaços no início e fim
  .trim();

// Salvar arquivo minificado
const minPath = path.join(__dirname, 'css', 'styles.min.css');
fs.writeFileSync(minPath, minified, 'utf8');

console.log('CSS minificado com sucesso!');
console.log(`Tamanho original: ${cssContent.length} bytes`);
console.log(`Tamanho minificado: ${minified.length} bytes`);
console.log(`Redução: ${((cssContent.length - minified.length) / cssContent.length * 100).toFixed(2)}%`);

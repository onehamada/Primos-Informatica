const fs = require('fs');
const path = require('path');

// Criar pasta de desenvolvimento
const devFolder = 'dev';

// Arquivos de desenvolvimento para mover
const devFiles = [
    'convert_csv_to_json.js',
    'minify_css.js',
    'minify_js.js',
    'minify_js_safe.py',
    'netlify.toml'
];

// Função para criar pasta se não existir
function ensureFolderExists(folderPath) {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`✅ Pasta criada: ${folderPath}`);
    }
}

// Função para mover arquivo
function moveFile(oldPath, newPath) {
    if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`📁 Movido: ${oldPath} → ${newPath}`);
    } else {
        console.log(`⚠️  Arquivo não encontrado: ${oldPath}`);
    }
}

// Criar pasta dev
console.log('🔧 Criando pasta de desenvolvimento...');
ensureFolderExists(devFolder);

// Mover arquivos de desenvolvimento
console.log('\n📦 Movendo arquivos de desenvolvimento...');
devFiles.forEach(file => {
    const oldPath = file;
    const newPath = path.join(devFolder, file);
    moveFile(oldPath, newPath);
});

console.log('\n🎉 Organização final concluída!');
console.log('\n📋 Estrutura final:');
console.log('   • Arquivos de produção: raiz do projeto');
console.log('   • Arquivos de desenvolvimento: pasta dev/');
console.log('   • Backups: pasta backups/');
console.log('   • Testes: pasta tests/');
console.log('   • Obsoletos: pasta deprecated/');
console.log('   • Temporários: pasta temp/');
console.log('\n✨ Site organizado e otimizado!');

const fs = require('fs');
const path = require('path');

// Criar pastas de organização
const folders = [
    'backups',
    'tests',
    'temp',
    'deprecated'
];

// Arquivos para mover
const filesToMove = {
    'backups/': [
        'js/script.js.backup',
        'js/script.js.backup-20260121-165328',
        'js/script_broken.js',
        'orders-fix-backup.js',
        'orders-script-backup.js'
    ],
    'tests/': [
        'test-converter.html',
        'test-orders.html',
        'new-checkout-modal.html',
        'new-checkout-script-clean.js',
        'new-checkout-script.js',
        'new-checkout-styles.css',
        'orders-fix-backup.js',
        'orders-modal-fix.css',
        'orders-modal.html',
        'orders-script-disabled.js',
        'orders-styles.css'
    ],
    'deprecated/': [
        'index-backup.html',
        'index-simple.html',
        'admin-new.html',
        'firebase_clean.json',
        'google447c5f6c05f876db.html',
        'seo-google.html'
    ],
    'temp/': [
        'Novo Documento de Texto.js'
    ]
};

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

// Criar pastas
console.log('🔧 Criando estrutura de pastas...');
folders.forEach(folder => {
    ensureFolderExists(folder);
});

// Mover arquivos
console.log('\n📦 Organizando arquivos...');
Object.entries(filesToMove).forEach(([folder, files]) => {
    console.log(`\n📂 Processando pasta: ${folder}`);
    files.forEach(file => {
        const oldPath = file;
        const newPath = path.join(folder, path.basename(file));
        moveFile(oldPath, newPath);
    });
});

console.log('\n🎉 Organização concluída!');
console.log('\n📋 Resumo:');
console.log('   • Backups movidos para pasta backups/');
console.log('   • Arquivos de teste movidos para pasta tests/');
console.log('   • Arquivos obsoletos movidos para pasta deprecated/');
console.log('   • Arquivos temporários movidos para pasta temp/');
console.log('\n✨ Estrutura organizada com sucesso!');

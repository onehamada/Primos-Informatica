# Relatório de Limpeza do Site - Primos Informática

## 📊 Resumo
- **Tamanho total atual**: ~9.04 MB
- **Arquivos desnecessários identificados**: ~0.55 MB (6% do total)
- **Status**: Aguardando confirmação para remoção

## 🗂️ Arquivos que Podem Ser Removidos com Segurança

### 1. Arquivos de Backup e Versões Antigas (~0.15 MB)
```
js/script_backup.js        (69 KB) - Backup do script principal
js/script_original.js      (69 KB) - Versão original do script
js/script_clean.js         (19 KB) - Versão limpa do script
js/script_test.js          (2 KB) - Script de testes
data/products.csv.backup   (7 KB) - Backup do CSV de produtos
```

### 2. Arquivos de Teste e Debug (~0.04 MB)
```
debug_prices.html          (7 KB) - Página de debug de preços
test_prices.html           (4 KB) - Teste de preços
test_prices_debug.js       (2 KB) - Script de debug
test_scroll.html           (7 KB) - Teste de scroll
test_search.html           (10 KB) - Teste de busca
tools/test-images.bat      (1 KB) - Batch de teste de imagens
```

### 3. Arquivos Duplicados ou Obsoletos (~0.03 MB)
```
index_fixed.html           (24 KB) - Versão antiga do index
```

### 4. Logs e Arquivos Temporários (~0.31 MB)
```
image_download.log        (328 KB) - Log de download de imagens
```

### 5. Documentação de Desenvolvimento (~0.01 MB)
```
CORRECOES_BUSCA.md         (3 KB) - Notas de correção da busca
CORRECOES_PRECOS.md        (2 KB) - Notas de correção de preços
LIMPEZA_CONSOLE.md         (2 KB) - Notas de limpeza
README_IMAGE_DOWNLOADER.md (6 KB) - Doc de ferramenta interna
```

## ✅ Arquivos Essenciais (NÃO REMOVER)

### Site Principal
- `index.html` - Página principal
- `css/styles.css` - Estilos do site
- `js/script.js` - Script principal
- `data/products.csv` - Base de dados de produtos
- `data/products.json` - Dados em JSON

### Imagens e Recursos
- `images/` - Todas as imagens de produtos e logos
- `images/favicons/` - Ícones do site
- `favicon.ico`, `favicon-32x32.ico` - Favicons principais

### Funcionalidades
- `sw.js` - Service Worker
- `manifest.json` - Manifest do PWA
- `server.py` - Servidor local
- `sitemap.xml` - Sitemap para SEO
- `robots.txt` - Diretrizes para robôs de busca

## 🧹 Recomendações de Limpeza

### Prioridade Alta (Seguro remover)
1. **Arquivos de log**: `image_download.log` (328 KB)
2. **Arquivos de teste**: Todos os arquivos `test_*` e `debug_*`
3. **Backups antigos**: `*_backup.js`, `*_original.js`

### Prioridade Média (Verificar antes)
1. **Documentação interna**: Arquivos `*.md` (exceto README.md principal)
2. **Versões antigas**: `index_fixed.html`

### Prioridade Baixa (Mantenha por enquanto)
1. **Ferramentas da pasta `tools/`** - Podem ser úteis futuramente
2. **Arquivos de configuração** - Pequenos e podem ser necessários

## 📈 Benefícios Esperados
- **Redução de tamanho**: ~0.55 MB (6% de redução)
- **Organização**: Estrutura mais limpa e profissional
- **Manutenibilidade**: Menos confusão entre arquivos ativos e obsoletos
- **Performance**: Tempo de deploy reduzido

## ⚠️ Antes de Remover
1. **Backup**: Faça um backup completo do site
2. **Verificação**: Confirme que nenhum arquivo está sendo referenciado
3. **Teste**: Teste o site após a remoção

## 🔄 Comandos para Remoção (PowerShell)
```powershell
# Remover arquivos de backup e teste
Remove-Item "js\script_backup.js", "js\script_original.js", "js\script_clean.js", "js\script_test.js"
Remove-Item "data\products.csv.backup"
Remove-Item "debug_prices.html", "test_prices.html", "test_prices_debug.js", "test_scroll.html", "test_search.html"
Remove-Item "tools\test-images.bat"

# Remover log
Remove-Item "image_download.log"

# Remover versão antiga (opcional)
Remove-Item "index_fixed.html"

# Remover documentação interna (opcional)
Remove-Item "CORRECOES_BUSCA.md", "CORRECOES_PRECOS.md", "LIMPEZA_CONSOLE.md", "README_IMAGE_DOWNLOADER.md"
```

---
**Status**: Aguardando sua aprovação para prosseguir com a limpeza.

# Estrutura de Pastas Sugerida

## 📁 Estrutura Organizada

```
minha-loja/
├── 📄 index.html                 # Página principal
├── 📄 auth.html                 # Página de autenticação
├── 📄 admin.html                # Página de administração
├── 📄 reviews.html              # Página de avaliações
├── 📄 pagamento.html            # Página de pagamento
├── 📄 politica-devolucao.html   # Política de devolução
├── 📄 manifest.json             # Manifesto PWA
├── 📄 robots.txt               # Robots para SEO
├── 📄 sitemap.xml              # Sitemap para SEO
├── 📄 sw.js                    # Service Worker
├── 📄 firebase.json            # Configuração Firebase
├── 📄 .firebaserc             # Configuração Firebase
├── 📄 .gitignore              # Ignore do Git
├── 📄 .nojekyll               # Config Netlify
│
├── 📁 css/                     # Estilos CSS
│   ├── styles.css              # Estilos principais
│   └── styles.min.css          # Estilos minificados
│
├── 📁 js/                      # JavaScript
│   ├── script.js               # Script principal
│   └── [outros arquivos JS]
│
├── 📁 data/                    # Dados do site
│   ├── products.csv            # Produtos (CSV)
│   ├── products.json           # Produtos (JSON)
│   └── google_merchant_feed.csv # Feed Google
│
├── 📁 images/                  # Imagens
│   ├── favicons/              # Favicones
│   ├── products/              # Produtos
│   │   ├── large/           # Imagens grandes
│   │   ├── medium/          # Imagens médias
│   │   └── thumbnail/       # Miniaturas
│   └── logo.png               # Logo principal
│
├── 📁 public/                  # Arquivos públicos (deploy)
│   └── data/                 # Cópia dos dados
│
├── 📁 tools/                   # Ferramentas de desenvolvimento
│   └── [scripts Python/Batch]
│
├── 📁 docs/                    # Documentação
│   └── [arquivos .md]
│
├── 📁 servers/                 # Servidores de desenvolvimento
│   └── [arquivos de servidor]
│
└── 📁 .git/                   # Controle de versão
    └── [arquivos Git]
```

## 🗑️ Arquivos para Remover

### Arquivos Desnecessários:
- `Novo Documento de Texto.js`
- `index-backup.html`
- `index-simple.html`
- `admin-new.html`
- `new-checkout-modal.html`
- `new-checkout-script-clean.js`
- `new-checkout-script.js`
- `new-checkout-styles.css`
- `orders-fix-backup.js`
- `orders-modal-fix.css`
- `orders-modal.html`
- `orders-script-backup.js`
- `orders-script-disabled.js`
- `orders-styles.css`
- `test-converter.html`
- `test-orders.html`
- `google447c5f6c05f876db.html`
- `seo-google.html`
- `firebase_clean.json`

### Backups no JS:
- `script.js.backup`
- `script.js.backup-20260121-165328`
- `script_broken.js`

## 📝 Sugestões de Organização

1. **Mover backups** para pasta `backups/`
2. **Mover arquivos de teste** para pasta `tests/`
3. **Consolidar CSS** em um único arquivo
4. **Consolidar JS** em módulos organizados
5. **Remover arquivos duplicados** e temporários

## 🚀 Benefícios

- ✅ Manutenção mais fácil
- ✅ Deploy mais rápido
- ✅ Código mais limpo
- ✅ Melhor performance
- ✅ Facilidade para encontrar arquivos

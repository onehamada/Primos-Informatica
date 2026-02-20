# 🏪 Primos Informatica - E-commerce

## 📁 Estrutura de Pastas Organizada

```
minha-loja/
├── 📄 index.html                 # Página principal
├── 📄 auth.html                 # Autenticação
├── 📄 admin.html                # Administração
├── 📄 reviews.html              # Avaliações
├── 📄 pagamento.html            # Pagamento
├── 📄 politica-devolucao.html   # Política de devolução
├── 📄 manifest.json             # PWA Manifest
├── 📄 robots.txt               # SEO Robots
├── 📄 sitemap.xml              # SEO Sitemap
├── 📄 sw.js                    # Service Worker
├── 📄 firebase.json            # Firebase Config
├── 📄 .firebaserc             # Firebase Project
├── 📄 .gitignore              # Git Ignore
├── 📄 .nojekyll               # Netlify Config
│
├── 📁 css/                     # Estilos CSS
│   ├── styles.css              # Estilos principais
│   └── styles.min.css          # Estilos minificados
│
├── 📁 js/                      # JavaScript
│   ├── script.js               # Script principal
│   ├── cart.js                 # Carrinho
│   ├── core.js                 # Core functions
│   ├── products.js             # Sistema de produtos
│   ├── reviews.js              # Sistema de avaliações
│   ├── router.js               # Router SPA
│   ├── ui.js                   # UI components
│   └── [outros arquivos]
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
│   └── logo.png               # Logo
│
├── 📁 public/                  # Arquivos públicos (deploy)
│   └── data/                 # Cópia dos dados
│
├── 📁 tools/                   # Ferramentas
│   ├── organizar_arquivos.js  # Organização
│   ├── organizar_final.js     # Organização final
│   ├── image_optimizer.py     # Otimizador de imagens
│   ├── [scripts Python/Batch]
│   └── README.md              # Docs das ferramentas
│
├── 📁 docs/                    # Documentação
│   ├── ESTRUTURA_ORGANIZACAO.md # Estrutura
│   ├── README.md              # Docs principal
│   └── [outros arquivos .md]
│
├── 📁 servers/                 # Servidores de desenvolvimento
│   ├── server.js              # Node.js
│   ├── server.py              # Python
│   └── simple_server.py       # Python Simple
│
├── 📁 dev/                     # Desenvolvimento
│   ├── convert_csv_to_json.js # Conversor CSV→JSON
│   ├── minify_css.js          # Minificador CSS
│   ├── minify_js.js           # Minificador JS
│   └── [arquivos de dev]
│
├── 📁 backups/                 # Backups
│   ├── script.js.backup       # Backup principal
│   └── [outros backups]
│
├── 📁 tests/                   # Testes
│   ├── test-converter.html    # Teste conversor
│   ├── test-orders.html       # Teste pedidos
│   └── [arquivos de teste]
│
├── 📁 deprecated/              # Arquivos obsoletos
│   ├── index-backup.html      # Backup index
│   └── [arquivos obsoletos]
│
├── 📁 temp/                    # Arquivos temporários
│   └── [arquivos temporários]
│
└── 📁 .git/                   # Controle de versão
    └── [arquivos Git]
```

## 🚀 Deploy

### Firebase Hosting
```bash
firebase deploy --only hosting
```

### Atualizar Produtos
```bash
# Converter CSV para JSON
node dev/convert_csv_to_json.js

# Deploy
firebase deploy --only hosting
```

## 📝 Scripts Úteis

### Organizar Arquivos
```bash
node tools/organizar_arquivos.js
node tools/organizar_final.js
```

### Otimizar Imagens
```bash
python tools/image_optimizer.py
```

## 🛠️ Desenvolvimento

### Estrutura Limpada
- ✅ Backups organizados em `backups/`
- ✅ Testes em `tests/`
- ✅ Obsoletos em `deprecated/`
- ✅ Temporários em `temp/`
- ✅ Desenvolvimento em `dev/`
- ✅ Produção na raiz

### Benefícios
- 🎯 Manutenção mais fácil
- ⚡ Deploy mais rápido
- 🧹 Código mais limpo
- 📈 Melhor performance
- 🔍 Facilidade para encontrar arquivos

## 📊 Estatísticas

- **Arquivos movidos**: 25+
- **Pastas criadas**: 5
- **Estrutura otimizada**: 100%
- **Performance**: Melhorada

---

**Status**: ✅ Organizado e Otimizado

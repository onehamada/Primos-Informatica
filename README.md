# Primos Informatica - Minha Loja

Loja virtual estatica da Primos Informatica, publicada a partir da raiz do projeto e mantida com HTML, CSS e JavaScript vanilla.

## Estrutura atual

```text
minha-loja/
|-- index.html
|-- admin.html
|-- auth.html
|-- pagamento.html
|-- politica-devolucao.html
|-- reviews.html
|-- manifest.json
|-- robots.txt
|-- sitemap.xml
|-- sw.js
|-- firebase.json
|-- netlify.toml
|-- .firebaserc
|-- .gitignore
|-- css/
|   `-- styles.css
|-- data/
|   |-- products.json
|   |-- products.csv
|   |-- products.csv.backup
|   |-- produtos_exemplo.csv
|   `-- google_merchant_feed.csv
|-- images/
|   |-- logo.png
|   |-- placeholder.png
|   |-- favicons/
|   `-- products/
|       `-- thumbnail/
|-- js/
|   |-- script.js
|   |-- lazy-loading.js
|   |-- notifications.js
|   |-- firebase-config.js
|   `-- firebase-orders.js
`-- .github/
    `-- workflows/
        `-- pages.yml
```

## Paginas

- `index.html`: pagina principal da loja
- `admin.html`: painel administrativo
- `auth.html`: autenticacao
- `pagamento.html`: checkout
- `politica-devolucao.html`: politica comercial
- `reviews.html`: pagina auxiliar de avaliacoes

## Dados

Os produtos usados pelo site ficam em `data/products.json`.

Arquivos complementares:

- `data/products.csv`: base fonte para atualizacao
- `data/products.csv.backup`: backup local do CSV
- `data/produtos_exemplo.csv`: exemplo de importacao
- `data/google_merchant_feed.csv`: feed para integracoes externas

## JavaScript em uso

- `js/script.js`: logica principal da loja
- `js/lazy-loading.js`: carregamento otimizado de imagens
- `js/notifications.js`: notificacoes da interface
- `js/firebase-config.js`: inicializacao do Firebase
- `js/firebase-orders.js`: operacoes de pedidos no Firebase

## Executar localmente

Nao existe etapa de build. Para abrir localmente:

```bash
python -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000
```

## Deploy

### Firebase Hosting

```bash
firebase deploy --only hosting
```

O `firebase.json` publica a raiz do projeto e faz rewrite para `index.html`.

### Netlify

O `netlify.toml` tambem publica a raiz e redireciona qualquer rota para `index.html`.

## Limpeza aplicada

- removidos modulos JS que nao eram carregados por nenhuma pagina
- removidos servidores locais redundantes
- removidas pastas de imagens `large/` e `medium/`, que nao eram usadas pelo site atual
- removidos arquivos internos de documentacao de pasta e cache local do Firebase

# 🖼️  Download Automatizado de Imagens de Produtos

## 📋 Descrição
Script Python inteligente para baixar automaticamente imagens de produtos do Google Images com verificação prévia de imagens existentes.

## 🎯 Funcionalidade Principal
- ✅ **Verificação automática** de imagens existentes
- ✅ **Download apenas** de imagens faltantes
- ✅ **Conversão automática** para WebP
- ✅ **Integração direta** com CSV do site

## 🔧 Requisitos
```bash
pip install requests pillow
```

## 📂 Estrutura de Arquivos
```
minha-loja/
├── image_downloader.py          # Script principal
├── produtos_exemplo.csv         # Arquivo de exemplo
├── data/products.csv           # CSV do site (integrado)
├── images/products/thumbnail/   # Pasta de saída
└── image_download.log          # Log do processo
```

## 🚀 Como Usar

### 1. Instalar dependências
```bash
# Execute o instalador automático
install_dependencies.bat

# Ou manualmente:
pip install requests pillow
```

### 2. Executar o script
```bash
python image_downloader.py
```

### 3. Menu de Opções
```
📋 Escolha uma opção:
1. Usar CSV do site (data/products.csv) ← RECOMENDADO
2. Usar arquivo CSV personalizado
3. Usar arquivo TXT personalizado
4. Verificar imagens existentes
0. Sair
```

## 🔄 Fluxo de Trabalho Inteligente

### 📊 **Opção 1 - CSV do Site (Recomendado)**
1. **Verificação automática**: Lê `data/products.csv`
2. **Análise de imagens**: Compara com pasta `images/products/thumbnail/`
3. **Relatório**: Mostra quantos produtos precisam de imagens
4. **Confirmação**: Pergunta se deseja baixar as faltantes
5. **Download**: Baixa apenas as imagens que faltam

### 📋 **Exemplo de execução:**
```
🖼️  Download Automatizado de Imagens de Produtos
==================================================

📋 Escolha uma opção:
1. Usar CSV do site (data/products.csv)
2. Usar arquivo CSV personalizado
3. Usar arquivo TXT personalizado
4. Verificar imagens existentes
0. Sair

👉 Digite sua opção (0-4): 1

📦 64 produtos encontrados no site
📁 45 imagens já existentes
🎯 19 produtos precisam de imagens
📊 45 produtos já têm imagens

📥 Deseja baixar as imagens faltantes? (S/N): S

==================================================
📦 Processando produto 1/19
🔍 Buscando: PROCESSADOR INTEL I5 14400
✅ Imagem salva: images/products/thumbnail/processador-intel-i5-14400.webp
```

## 📝 Formatos de Entrada Suportados

### 📊 **CSV do Site (Formato Automático)**
O script lê diretamente do `data/products.csv`:
```csv
codigo;nome;categoria;preco;qt;descricao;marca;promocao;imagem
1006;MONITOR 19 HAYOM MO6001;monitor;285,00;1;Monitor 19;Hayom;sim;monitor-hayom-19-mo6001.webp
```

### 📊 **CSV Personalizado**
```csv
nome,modelo
Monitor Samsung 24,LF24T450F
Mouse Logitech,MX Master 3
```

### 📄 **Formato TXT**
```
Monitor Samsung 24|LF24T450F
Mouse Logitech|MX Master 3
```

## 📁 Saída
As imagens são salvas automaticamente em:
```
images/products/thumbnail/
├── processador-intel-i5-14400.webp
├── monitor-samsung-24-lf24t450f.webp
├── mouse-logitech-mx-master-3.webp
└── ...
```

## ✅ Recursos Avançados

### 🎯 **Verificação Inteligente**
- ✅ **Detecta imagens existentes** pelo nome do arquivo
- ✅ **Slugify automático** para nomenclatura padronizada
- ✅ **Evita downloads duplicados**
- ✅ **Relatório detalhado** do status

### 🛡️ **Segurança e Performance**
- ✅ **Rate limiting** (1 segundo entre requisições)
- ✅ **User-Agent realista**
- ✅ **Timeout configurado**
- ✅ **Tratamento de erros**
- ✅ **Exponential backoff**

### 📊 **Logs e Relatórios**
- ✅ **Log detalhado** em arquivo
- ✅ **Contadores** de sucesso/erro
- ✅ **Resumo final** do processo
- ✅ **Verificação visual** de imagens existentes

## 🔧 Funcionalidades Especiais

### 📋 **Opção 4 - Verificar Imagens**
Lista todas as imagens existentes:
```
📁 45 imagens encontradas:
  ✅ monitor-hayom-19-mo6001.webp
  ✅ mouse-multilaser-mo307.webp
  ✅ processador-intel-i5-14400.webp
  ...
```

### 🔄 **Processo Inteligente**
1. **Lê CSV do site** automaticamente
2. **Separa nome/modelo** inteligentemente
3. **Verifica imagens existentes**
4. **Baixa apenas faltantes**
5. **Converte para WebP** otimizado

## 🚨 Importante

### ⚠️ **Limitações**
- Google pode bloquear requisições excessivas
- Algumas imagens podem ter direitos autorais
- A qualidade depende dos resultados da busca

### 📝 **Recomendações**
- Use para fins pessoais/educacionais
- Verifique direitos de uso das imagens
- Execute em horários de baixo tráfego
- Teste com pequenas quantidades primeiro

## 🐛 Solução de Problemas

### **"Todos os produtos já têm imagens!"**
- ✅ Isso é bom! Significa que seu site está completo
- 📁 Use opção 4 para verificar quais imagens existem

### **"Nenhuma imagem encontrada"**
- 🔍 Verifique conexão com internet
- 📝 Tente termos mais específicos na busca
- 🔄 Algumas imagens podem estar protegidas

### **"Arquivo não encontrado"**
- 📂 Verifique se `data/products.csv` existe
- 📍 Use caminho relativo correto
- 📁 Execute o script da pasta principal

## 📞 Suporte
- 📋 Verifique `image_download.log` para detalhes
- 🔍 Use opção 4 para status atual das imagens
- 📊 O script mostra relatório completo ao final

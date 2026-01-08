# Ferramentas do Projeto

## Scripts disponíveis:

### 1. Baixar Imagens (Principal)
**Arquivo:** `baixar_imagens.bat`

**O que faz:**
- Baixa imagens do Google Images automaticamente
- Verifica o `products.csv` e encontra imagens faltantes
- Converte para WebP e salva na pasta correta

**Como usar:**
1. Dê duplo clique em `baixar_imagens.bat`
2. Escolha:
   - `1` - Apenas verificar imagens faltantes
   - `2` - Baixar imagens faltantes

**Requisitos:**
- Python instalado
- Conexão com internet
- Arquivo `../data/products.csv`

---

### 2. Upload Images (Original)
**Arquivo:** `upload-images.bat`

**O que faz:**
- Verifica quais imagens faltam
- Gera lista manual para download
- Não baixa automaticamente

**Como usar:**
1. Execute `upload-images.bat`
2. Veja a lista em `missing_images.txt`
3. Baixe as imagens manualmente

---

### 3. test-images.bat
Testa se todas as imagens dos produtos estão presentes.

### 4. validate_html.py
Valida o HTML do site em busca de erros.

### 5. crop_logo.py
Recorta e otimiza o logo da loja.

### 6. download_images.py
Baixa imagens dos produtos automaticamente.

### 7. generate_favicon.py
Gera favicons a partir do logo.

### 8. .env
Arquivo de configuração com variáveis de ambiente.

## Como usar:

1. **Baixar Imagens:**
   ```
   Clique duplo em: tools\baixar_imagens.bat
   ```

2. **Upload de imagens:**
   ```
   Clique duplo em: tools\upload-images.bat
   ```

3. **Testar imagens:**
   ```
   Clique duplo em: tools\test-images.bat
   ```

4. **Validar HTML:**
   ```
   python tools/validate_html.py
   ```

## Exemplo de saída do upload-images.bat:

```
FALTA: i513400.webp (Produto: 1042)
FALTA: rtx3060.webp (Produto: 1828)
OK: gtx550.webp

Total de produtos: 35
Imagens faltando: 2
```

## Dicas:
- Use imagens 150x150px para melhor performance
- Formato `.webp` é obrigatório
- Nomes devem ser exatamente como mostrados
- Mantenha esta pasta organizada para facilitar manutenção

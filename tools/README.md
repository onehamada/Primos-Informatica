# Ferramentas do Projeto

## Scripts disponíveis:

### 1. upload-images.bat
Verifica quais imagens faltam para os produtos e ajuda a organizá-las.

### 2. test-images.bat
Testa se todas as imagens dos produtos estão presentes.

### 3. validate_html.py
Valida o HTML do site em busca de erros.

### 4. crop_logo.py
Recorta e otimiza o logo da loja.

### 5. download_images.py
Baixa imagens dos produtos automaticamente.

### 6. generate_favicon.py
Gera favicons a partir do logo.

### 7. .env
Arquivo de configuração com variáveis de ambiente.

## Como usar:

1. **Upload de imagens:**
   ```
   Clique duplo em: tools\upload-images.bat
   ```

2. **Testar imagens:**
   ```
   Clique duplo em: tools\test-images.bat
   ```

3. **Validar HTML:**
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

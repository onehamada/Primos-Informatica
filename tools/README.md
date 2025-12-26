# Ferramenta de Upload de Imagens

## Como usar:

1. **Execute o script:**
   ```
   Clique duplo em: tools\upload-images.bat
   ```

2. **O script vai:**
   - Ler seu `data/products.csv`
   - Verificar quais imagens faltam
   - Mostrar lista de imagens necessárias
   - Abrir automaticamente a pasta de imagens

3. **Adicione as imagens:**
   - Copie suas imagens para `images/products/thumbnail/`
   - Renomeie com os nomes exatos mostrados
   - Formato deve ser `.webp`

4. **Verifique novamente:**
   - Rode o script de novo para confirmar
   - Se tudo OK, faça upload para GitHub

## Exemplo de saída:

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
- Nomes devem ser exatamente como mostrado
- O script cria arquivo `missing_images.txt` com lista completa

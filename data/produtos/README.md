# CSVs por Categoria

## Arquivos Disponíveis

Esta pasta contém os arquivos CSV separados por categoria:

- `processador.csv` - 17 processadores
- `placa_de_video.csv` - 9 placas de vídeo
- `placa_mae.csv` - 12 placas mãe
- `ssd.csv` - 13 SSDs
- `hd_externo.csv` - 3 HDs externos
- `hd_interno.csv` - 1 HD interno

## Como Usar

### Para editar produtos:

1. **Abra o CSV da categoria desejada** (ex: `placa_de_video.csv` para editar placas de vídeo)
2. **Faça suas alterações** (adicionar, remover, modificar produtos)
3. **Use o script para atualizar o arquivo principal**:
   ```
   Clique duplo em: tools\separar-csv.bat
   ```

### Para recriar todos os CSVs:
```
Clique duplo em: tools\separar-csv.bat
```

## Formato dos Arquivos

Todos os CSVs usam o mesmo formato (separados por ponto e vírgula):

```
codigo;nome;categoria;preco;qt;descricao;marca;promocao;imagem
1234;NOME DO PRODUTO;Categoria;999,99;10;Descrição completa;Marca;nao;imagem.webp
```

## Importante

- **O site continua lendo apenas o `data/products.csv`**
- **Estes arquivos são apenas para facilitar sua edição**
- **Sempre mantenha o backup do arquivo principal**
- **Verifique se as imagens existem após adicionar novos produtos**

## Exemplo Prático

Para adicionar uma nova placa de vídeo:

1. Abra `placa_de_video.csv`
2. Adicione a linha: `9999;NOVA PLACA;Placa de vídeo;1500,00;5;Descrição;Marca;nao;nova_placa.webp`
3. Execute `tools\separar-csv.bat` para atualizar
4. Gere a imagem: `tools\gerar-imagens.bat`
5. Faça upload do site

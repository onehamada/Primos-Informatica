# Tools

Esta pasta foi reduzida para manter apenas o fluxo atual de download automatico
de imagens dos produtos.

## Arquivos mantidos

- `baixar_primeiro_produto_otimizado.py`
  Script principal. Busca imagens, valida marca e modelo, trata fundo quando
  necessario e salva em `images/products/thumbnail`.
  Prioriza Kabum, Terabyte, Pichau, PCYes e outras lojas de hardware, usando
  Google e Bing antes do fallback geral.
  Quando encontra imagem boa com fundo branco ou preto chapado, tenta limpar
  o fundo e preservar transparencia no `.webp`.
- `baixar_primeiro_produto_otimizado.bat`
  Atalho para executar o script no Windows.
- `instalar_dependencias.bat`
  Instala as bibliotecas do fluxo.
- `requirements.txt`
  Lista de dependencias usadas pelo script.

## Como usar

1. Execute `tools\instalar_dependencias.bat`
2. Execute `tools\baixar_primeiro_produto_otimizado.bat`

Por padrao o script tenta primeiro as lojas confiaveis de hardware.
Se nenhuma loja prioritaria retornar imagem, ele tenta Google e Bing
como fallback, ainda com validacao de marca, modelo e qualidade.
Se ainda assim falhar, usa marketplaces como ultimo recurso.
Produtos apontando para `placeholder.webp` ou `placeholder.png` tambem
entram automaticamente na fila de processamento.

Se quiser travar a busca apenas nas lojas confiaveis de hardware, use
`--strict-sites-only`.

Opcional: se algum produto especifico nunca deve ser baixado automaticamente,
coloque o codigo ou o nome do arquivo em `tools\image_download_ignore.txt`,
um por linha. Por padrao esse arquivo fica vazio.

## Exemplos

- Baixar imagens faltantes:
  `tools\baixar_primeiro_produto_otimizado.bat`
- Reprocessar um produto:
  `tools\baixar_primeiro_produto_otimizado.bat --codigo 1812`
- Reprocessar varios produtos:
  `tools\baixar_primeiro_produto_otimizado.bat --codigo 1812,2119`
- Reprocessar tudo:
  `tools\baixar_primeiro_produto_otimizado.bat --force-all`
- Forcar modo estrito:
  `tools\baixar_primeiro_produto_otimizado.bat --strict-sites-only`

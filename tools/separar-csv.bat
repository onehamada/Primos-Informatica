@echo off
echo.
echo === SEPARAR PRODUTOS POR CATEGORIA ===
echo.
python -c "
import csv
import os

# Criar pasta para CSVs
os.makedirs('data/produtos', exist_ok=True)

# Ler CSV principal
with open('data/products.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f, delimiter=';')
    products = list(reader)

# Agrupar por categoria
categorias = {}
for product in products:
    cat = product['categoria']
    if cat not in categorias:
        categorias[cat] = []
    categorias[cat].append(product)

# Header padrão
header = ['codigo', 'nome', 'categoria', 'preco', 'qt', 'descricao', 'marca', 'promocao', 'imagem']

print('Criando CSVs por categoria...')

# Criar CSV para cada categoria
for cat, products_list in categorias.items():
    # Nome seguro para arquivo
    filename = cat.lower().replace(' ', '_').replace('ã', 'a').replace('ç', 'c').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u').replace('á', 'a') + '.csv'
    filepath = f'data/produtos/{filename}'
    
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, delimiter=';')
        writer.writerow(header)
        for product in products_list:
            writer.writerow([
                product['codigo'],
                product['nome'],
                product['categoria'],
                product['preco'],
                product['qt'],
                product['descricao'],
                product['marca'],
                product['promocao'],
                product['imagem']
            ])
    
    print('OK: ' + cat + ' - ' + str(len(products_list)) + ' produtos -> ' + filename)

print('Total: ' + str(len(categorias)) + ' arquivos CSV criados')
"
echo.
pause

#!/usr/bin/env python3
import csv
import os
from PIL import Image, ImageDraw, ImageFont

def create_placeholder_image(product_name, image_path):
    """Cria uma imagem placeholder para um produto"""
    # Criar imagem 150x150
    img = Image.new('RGB', (150, 150), color='#f0f0f0')
    draw = ImageDraw.Draw(img)
    
    # Tentar usar fonte Arial, senão usar padrão
    try:
        font = ImageFont.truetype('arial.ttf', 12)
    except:
        font = ImageFont.load_default()
    
    # Desenhar borda
    draw.rectangle([5, 5, 145, 145], outline='#333', width=2)
    
    # Adicionar texto baseado no nome do produto
    if 'SSD' in product_name.upper():
        draw.text((75, 30), 'SSD', fill='#333', anchor='mt', font=font)
    elif 'PROCESSADOR' in product_name.upper() or 'INTEL' in product_name.upper() or 'AMD' in product_name.upper():
        draw.text((75, 30), 'CPU', fill='#333', anchor='mt', font=font)
    elif 'PLACA MAE' in product_name.upper():
        draw.text((75, 30), 'MB', fill='#333', anchor='mt', font=font)
    elif 'PLACA DE VIDEO' in product_name.upper():
        draw.text((75, 30), 'GPU', fill='#333', anchor='mt', font=font)
    else:
        draw.text((75, 30), 'PROD', fill='#333', anchor='mt', font=font)
    
    # Adicionar nome do produto (quebrado em linhas)
    parts = product_name.replace('_', ' ').upper().split()
    y_pos = 60
    for part in parts:
        if len(part) > 8:
            # Quebrar palavras longas
            mid = len(part) // 2
            draw.text((75, y_pos), part[:mid], fill='#555', anchor='mt', font=font)
            y_pos += 15
            draw.text((75, y_pos), part[mid:], fill='#555', anchor='mt', font=font)
        else:
            draw.text((75, y_pos), part, fill='#555', anchor='mt', font=font)
        y_pos += 15
        if y_pos > 130:
            break
    
    # Salvar como WebP
    img.save(image_path, 'WebP', quality=80)
    print(f'Created: {image_path}')

def main():
    print("Verificando imagens faltantes...")
    
    # Garantir que o diretório existe
    output_dir = 'images/products/thumbnail'
    os.makedirs(output_dir, exist_ok=True)
    
    # Ler CSV e verificar imagens faltantes
    missing_images = []
    products_info = {}
    
    with open('data/products.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            image_name = row['imagem']
            product_name = row['nome']
            image_path = os.path.join(output_dir, image_name)
            
            products_info[image_name] = product_name
            
            if not os.path.exists(image_path):
                missing_images.append((image_name, product_name, image_path))
    
    print(f'Total de produtos: {len(products_info)}')
    print(f'Imagens existentes: {len(products_info) - len(missing_images)}')
    print(f'Imagens faltando: {len(missing_images)}')
    
    if missing_images:
        print('\nCriando imagens faltantes:')
        for image_name, product_name, image_path in missing_images:
            create_placeholder_image(product_name, image_path)
        
        print(f'\n{len(missing_images)} imagens criadas com sucesso!')
    else:
        print('\nTodas as imagens ja estao presentes!')
    
    # Verificar se há imagens sem produtos (órfãs)
    existing_files = set(os.listdir(output_dir)) if os.path.exists(output_dir) else set()
    product_images = set(products_info.keys())
    orphan_images = existing_files - product_images
    
    if orphan_images:
        print(f'\nImagens orfas (sem produto correspondente): {len(orphan_images)}')
        for img in orphan_images:
            print(f'  - {img}')

if __name__ == '__main__':
    main()

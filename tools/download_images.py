import os
from PIL import Image, ImageDraw, ImageFont

def setup_directories():
    """Cria a estrutura de diretórios necessária."""
    dirs = [
        'src/images/products/thumbnail',
        'src/images/products/medium',
        'src/images/products/large',
        'src/images/placeholders'
    ]
    for directory in dirs:
        os.makedirs(directory, exist_ok=True)

def generate_image(category):
    try:
        bg = (30 + (hash(category) & 0x7F), 30 + ((hash(category) >> 7) & 0x7F), 30 + ((hash(category) >> 14) & 0x7F))
        img = Image.new('RGB', (800, 800), bg)
        draw = ImageDraw.Draw(img)

        title = (category or 'produto').upper()
        font = ImageFont.load_default()

        bbox = draw.textbbox((0, 0), title, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        x = (800 - tw) // 2
        y = (800 - th) // 2
        draw.text((x, y), title, fill=(255, 255, 255), font=font)

        sizes = {
            'thumbnail': (150, 150),
            'medium': (400, 400),
            'large': (800, 800)
        }

        for size_name, size in sizes.items():
            img_copy = img.copy()
            img_copy.thumbnail(size, Image.Resampling.LANCZOS)
            output_path = f'src/images/products/{size_name}/{category}.webp'
            img_copy.save(output_path, 'WEBP', quality=80, optimize=True)

            if size_name == 'thumbnail':
                img_placeholder = img_copy.copy().convert('RGB')
                img_placeholder.save(
                    f'src/images/placeholders/{category}.jpg',
                    'JPEG',
                    quality=30,
                    optimize=True
                )

        return True
    except Exception as e:
        print(f"Erro ao gerar imagem para {category}: {e}")
        return False

def main():
    print("Configurando diretórios...")
    setup_directories()

    categories = [
        'default',
        'gamer',
        'fones',
        'cabos',
        'hdmi',
        'monitor',
        'rede',
        'energia',
        'adaptadores',
        'conversores',
        'hardware',
        'coolers',
        'acessorios',
        'conectividade'
    ]

    print("Gerando imagens locais...")
    for category in categories:
        print(f"Gerando imagem para {category}...")
        generate_image(category)
    
    print("Processo concluído!")

if __name__ == "__main__":
    main()

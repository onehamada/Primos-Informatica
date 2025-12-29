#!/usr/bin/env python3
from PIL import Image
import os

def generate_favicons():
    """Gera favicons a partir do logo.png existente"""
    
    logo_path = 'images/logo.png'
    
    if not os.path.exists(logo_path):
        print(f"ERRO: {logo_path} não encontrado!")
        return False
    
    try:
        # Abrir o logo original
        with Image.open(logo_path) as img:
            # Criar diretório para favicons se não existir
            os.makedirs('images/favicons', exist_ok=True)
            
            # Tamanhos necessários para diferentes dispositivos
            sizes = {
                'favicon-16x16.png': 16,
                'favicon-32x32.png': 32,
                'favicon-96x96.png': 96,
                'favicon-128x128.png': 128,
                'favicon-196x196.png': 196,
                'favicon-256x256.png': 256,
                'favicon-512x512.png': 512,
                'apple-touch-icon.png': 180,
                'android-chrome-192x192.png': 192,
                'android-chrome-512x512.png': 512
            }
            
            print("Gerando favicons...")
            
            for filename, size in sizes.items():
                # Redimensionar mantendo qualidade
                resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
                
                # Salvar com transparência se tiver
                if img.mode in ('RGBA', 'LA', 'P'):
                    resized_img.save(f'images/favicons/{filename}', format='PNG', optimize=True)
                else:
                    # Converter para RGBA se não tiver transparência
                    rgba_img = Image.new('RGBA', resized_img.size, (255, 255, 255, 0))
                    rgba_img.paste(resized_img)
                    rgba_img.save(f'images/favicons/{filename}', format='PNG', optimize=True)
                
                print(f"  OK: {filename} ({size}x{size})")
            
            # Gerar favicon.ico (múltiplos tamanhos em um arquivo)
            ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128)]
            ico_images = []
            
            for size in ico_sizes:
                resized_img = img.resize(size, Image.Resampling.LANCZOS)
                if img.mode in ('RGBA', 'LA', 'P'):
                    ico_images.append(resized_img)
                else:
                    rgba_img = Image.new('RGBA', resized_img.size, (255, 255, 255, 0))
                    rgba_img.paste(resized_img)
                    ico_images.append(rgba_img)
            
            # Salvar favicon.ico
            ico_images[0].save('favicon.ico', format='ICO', sizes=[(size[0], size[1]) for size in ico_sizes])
            print(f"  OK: favicon.ico (multiplos tamanhos)")
            
            # Copiar para raiz também
            import shutil
            shutil.copy('favicon.ico', 'images/favicons/favicon.ico')
            
            print(f"\nOK: {len(sizes) + 1} favicons gerados com sucesso!")
            return True
            
    except Exception as e:
        print(f"ERRO: {e}")
        return False

if __name__ == '__main__':
    generate_favicons()

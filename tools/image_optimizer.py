#!/usr/bin/env python3
"""
Script para converter imagens para WebP com fallback automático.
Versão simplificada usando apenas PIL (sem AVIF).
"""

import os
import sys
from pathlib import Path
from PIL import Image
import logging

# Configuração de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ImageOptimizer:
    def __init__(self, source_dir, output_dir=None):
        self.source_dir = Path(source_dir)
        self.output_dir = Path(output_dir) if output_dir else self.source_dir
        self.supported_formats = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}
        self.quality_webp = 85

    def convert_image(self, image_path):
        """Converte uma imagem para WebP"""
        try:
            # Abrir imagem
            with Image.open(image_path) as img:
                # Converter para RGB se necessário
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')

                # Caminhos de saída
                stem = image_path.stem
                parent = image_path.parent

                # Output directory relativo ao source
                if self.output_dir != self.source_dir:
                    relative_path = image_path.relative_to(self.source_dir)
                    output_parent = self.output_dir / relative_path.parent
                    output_parent.mkdir(parents=True, exist_ok=True)
                else:
                    output_parent = parent

                webp_path = output_parent / f"{stem}.webp"

                # Pular se WebP já existe e é mais recente
                if webp_path.exists():
                    webp_mtime = webp_path.stat().st_mtime
                    original_mtime = image_path.stat().st_mtime
                    if webp_mtime > original_mtime:
                        logger.info(f"⏭️ WebP já existe e é atual: {webp_path}")
                        return True

                # Converter para WebP
                img.save(webp_path, 'WEBP', quality=self.quality_webp, optimize=True)

                # Calcular economia de espaço
                original_size = image_path.stat().st_size
                webp_size = webp_path.stat().st_size
                savings = ((original_size - webp_size) / original_size) * 100

                logger.info(f"✅ WebP criado: {webp_path} ({savings:.1f}% menor)")

                return True

        except Exception as e:
            logger.error(f"❌ Erro ao converter {image_path}: {e}")
            return False

    def process_directory(self):
        """Processa todas as imagens do diretório"""
        converted = 0
        skipped = 0
        total = 0

        for ext in self.supported_formats:
            for image_path in self.source_dir.rglob(f"*{ext}"):
                if image_path.is_file():
                    total += 1
                    webp_path = image_path.parent / f"{image_path.stem}.webp"
                    if webp_path.exists() and webp_path.stat().st_mtime > image_path.stat().st_mtime:
                        skipped += 1
                        continue

                    if self.convert_image(image_path):
                        converted += 1

        logger.info(f"📊 Conversão concluída: {converted} convertidas, {skipped} puladas, {total} total")

    def generate_picture_element(self, image_path):
        """Gera elemento <picture> com fallbacks"""
        stem = image_path.stem
        parent = image_path.parent.relative_to(self.source_dir)

        webp_path = f"/images/{parent}/{stem}.webp"
        original_path = f"/images/{parent}/{image_path.name}"

        picture_html = f'''<picture>
  <source srcset="{webp_path}" type="image/webp">
  <img src="{original_path}" alt="" loading="lazy">
</picture>'''

        return picture_html

def main():
    if len(sys.argv) < 2:
        print("Uso: python image_optimizer.py <diretorio_imagens> [diretorio_saida]")
        sys.exit(1)

    source_dir = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else None

    if not os.path.exists(source_dir):
        print(f"❌ Diretório não encontrado: {source_dir}")
        sys.exit(1)

    print("🚀 Iniciando otimização de imagens...")
    print(f"📁 Diretório: {source_dir}")

    optimizer = ImageOptimizer(source_dir, output_dir)
    optimizer.process_directory()

    # Gerar relatório
    print("\n" + "="*60)
    print("RELATÓRIO DE CONVERSÃO DE IMAGENS")
    print("="*60)
    print("✅ Imagens convertidas para WebP (85% quality)")
    print("✅ Fallback automático mantido")
    print("✅ Compatibilidade com navegadores modernos")
    print("\nPara usar as imagens otimizadas no HTML:")
    print('<picture>')
    print('  <source srcset="imagem.webp" type="image/webp">')
    print('  <img src="imagem.jpg" alt="" loading="lazy">')
    print('</picture>')
    print("\nOu simplesmente use o atributo data-webp no img:")
    print('<img src="imagem.jpg" data-webp="imagem.webp" alt="" loading="lazy">')

if __name__ == "__main__":
    main()

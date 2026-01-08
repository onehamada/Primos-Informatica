#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Download Automatizado de Imagens de Produtos v4.0
Ultra simplificado - sem bugs, sem complicacoes
"""

import os
import csv
import time
import requests
import re
from urllib.parse import quote
from PIL import Image
from io import BytesIO
import logging
from pathlib import Path
import json
from datetime import datetime

# Configuracao de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('image_download.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

class ProductImageDownloader:
    def __init__(self, output_dir="images/products/thumbnail"):
        self.output_dir = Path(output_dir)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        # Criar diretório de saída
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Contadores
        self.success_count = 0
        self.error_count = 0
        self.skip_count = 0
        
        # Arquivo de status
        self.status_file = Path("download_status.json")
        self.load_status()
        
    def load_status(self):
        """Carrega status de downloads anteriores"""
        if self.status_file.exists():
            try:
                with open(self.status_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.downloaded_images = set(data.get('downloaded', []))
                logging.info(f"Status carregado: {len(self.downloaded_images)} imagens ja baixadas")
            except:
                self.downloaded_images = set()
        else:
            self.downloaded_images = set()
    
    def save_status(self):
        """Salva status dos downloads"""
        status_data = {
            'last_update': datetime.now().isoformat(),
            'downloaded': list(self.downloaded_images),
            'success_count': self.success_count,
            'error_count': self.error_count,
            'skip_count': self.skip_count
        }
        
        with open(self.status_file, 'w', encoding='utf-8') as f:
            json.dump(status_data, f, indent=2, ensure_ascii=False)
    
    def slugify(self, text):
        """Converte texto para formato de nome de arquivo seguro"""
        text = text.lower()
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'[-\s]+', '-', text)
        return text.strip('-')
    
    def search_google_images(self, query, max_retries=3):
        """Busca imagens no Google Images"""
        for attempt in range(max_retries):
            try:
                search_url = f"https://www.google.com/search?q={quote(query)}&tbm=isch"
                
                logging.info(f"Buscando: {query} (tentativa {attempt + 1})")
                
                response = self.session.get(search_url, timeout=15)
                response.raise_for_status()
                
                # Extrair URLs das imagens
                pattern = r'"https://[^"]*\.(?:jpg|jpeg|png|webp|gif)[^"]*"'
                matches = re.findall(pattern, response.text, re.IGNORECASE)
                
                if matches:
                    return matches[0].strip('"')
                    
            except Exception as e:
                logging.error(f"Erro na busca (tentativa {attempt + 1}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                    
        return None
    
    def download_and_convert_image(self, img_url, filename):
        """Baixa e converte imagem para WebP"""
        try:
            if filename in self.downloaded_images:
                logging.info(f"Imagem ja baixada: {filename}.webp")
                self.skip_count += 1
                return True
            
            response = self.session.get(img_url, timeout=20)
            response.raise_for_status()
            
            img = Image.open(BytesIO(response.content))
            
            # Converter para RGB se necessário
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            
            # Redimensionar se muito grande
            max_size = 800
            if img.width > max_size or img.height > max_size:
                img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            
            # Salvar como WebP
            output_path = self.output_dir / f"{filename}.webp"
            img.save(output_path, 'WebP', quality=85, optimize=True)
            
            self.downloaded_images.add(filename)
            
            logging.info(f"Imagem salva: {output_path}")
            self.success_count += 1
            return True
            
        except Exception as e:
            logging.error(f"Erro ao processar imagem: {e}")
            self.error_count += 1
            return False
    
    def read_site_products_csv(self, filename="data/products.csv"):
        """Le arquivo CSV de produtos do site"""
        products = []
        
        if not Path(filename).exists():
            logging.error(f"Arquivo do site nao encontrado: {filename}")
            return []
        
        with open(filename, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file, delimiter=';')
            for row in reader:
                full_name = row.get('nome', '').strip()
                
                if ' ' in full_name:
                    parts = full_name.split(' ', 1)
                    name = parts[0]
                    model = parts[1] if len(parts) > 1 else ''
                else:
                    name = full_name
                    model = ''
                
                if not model and row.get('categoria'):
                    model = row.get('categoria', '').strip()
                
                products.append({
                    'name': name,
                    'model': model,
                    'codigo': row.get('codigo', ''),
                    'categoria': row.get('categoria', '')
                })
                
        return products
    
    def show_summary(self):
        """Mostra resumo final"""
        logging.info(f"\n{'='*60}")
        logging.info(f"RESUMO FINAL")
        logging.info(f"Sucessos: {self.success_count}")
        logging.info(f"Pulados: {self.skip_count}")
        logging.info(f"Erros: {self.error_count}")
        logging.info(f"Imagens salvas em: {self.output_dir.absolute()}")
        logging.info(f"{'='*60}")
    
    def process_downloads(self, products):
        """Processa downloads dos produtos"""
        # Contar imagens existentes
        existing_images = set()
        if self.output_dir.exists():
            for file in self.output_dir.glob("*.webp"):
                existing_images.add(file.stem)
        
        # Contar produtos que precisam de download
        products_to_download = []
        for product in products:
            filename = self.slugify(f"{product['name']}_{product['model']}")
            
            if filename not in existing_images and filename not in self.downloaded_images:
                products_to_download.append(product)
                logging.info(f"Imagem faltante: {filename}.webp")
            else:
                logging.info(f"Imagem ja existe: {filename}.webp")
        
        # Mostrar resultados
        total_products = len(products)
        missing_products = len(products_to_download)
        existing_products = total_products - missing_products
        
        print("")
        print("RELATORIO FINAL:")
        print(f"Total de produtos no CSV: {total_products}")
        print(f"Imagens ja existentes: {existing_images}")
        print(f"Produtos que precisam de imagens: {missing_products}")
        print("")
        print(f"{missing_products} produtos precisam de imagens (de {total_products} total)")
        
        if missing_products == 0:
            print("Todos os produtos ja tem imagens!")
            self.show_summary()
            return
        
        confirm = input("Deseja baixar as imagens faltantes? (S/N): ").strip().upper()
        
        if confirm != "S":
            print("Operacao cancelada.")
            return
        
        print("Iniciando download das imagens faltantes...")
        print("")
        
        for i, product in enumerate(products_to_download, 1):
            print(f"Baixando produto {i}/{len(products_to_download)}: {product['name']} {product['model']}")
            
            query = f"{product['name']} {product['model']}".strip()
            filename = self.slugify(f"{product['name']}_{product['model']}")
            
            img_url = self.search_google_images(query)
            
            if img_url:
                success = self.download_and_convert_image(img_url, filename)
                if success:
                    print(f"Sucesso: {filename}.webp")
                else:
                    print(f"Erro ao baixar: {filename}.webp")
            else:
                print(f"Nao foi possivel encontrar imagem para: {query}")
                self.error_count += 1
            
            if i < len(products_to_download):
                time.sleep(1)
        
        self.save_status()
        self.show_summary()

def main():
    """Funcao principal"""
    print("Download Automatizado de Imagens de Produtos v4.0")
    print("=" * 60)
    print("Versao ULTRA SIMPLIFICADA - Sem bugs!")
    print("")
    
    downloader = ProductImageDownloader()
    
    print("Menu de Opcoes:")
    print("1. Usar CSV do site (data/products.csv)")
    print("2. Verificar imagens existentes")
    print("0. Sair")
    print("")
    
    try:
        choice = input("Digite sua opcao (0-2): ").strip()
    except EOFError:
        print("\nPrograma encerrado.")
        return
    except KeyboardInterrupt:
        print("\nPrograma interrompido.")
        return
    
    if choice == "0":
        print("Ate logo!")
        return
    elif choice == "1":
        input_file = "data/products.csv"
        if not os.path.exists(input_file):
            print(f"Arquivo do site nao encontrado: {input_file}")
            return
        
        products = downloader.read_site_products_csv()
        print(f"{len(products)} produtos encontrados no site")
        
        downloader.process_downloads(products)
            
    elif choice == "2":
        if downloader.output_dir.exists():
            existing_images = list(downloader.output_dir.glob("*.webp"))
            print(f"\n{len(existing_images)} imagens encontradas:")
            for img in sorted(existing_images):
                try:
                    size_kb = img.stat().st_size / 1024
                    print(f"  {img.name} ({size_kb:.1f} KB)")
                except:
                    print(f"  {img.name}")
        else:
            print("Nenhuma imagem encontrada. A pasta nao existe.")
            
    else:
        print("Opcao invalida!")

if __name__ == "__main__":
    main()

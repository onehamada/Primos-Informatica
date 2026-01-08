#!/usr/bin/env python3
"""
🖼️  Download Automatizado de Imagens de Produtos
Autor: Cascade AI
Descrição: Baixa automaticamente imagens de produtos do Google Images
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

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('image_download.log'),
        logging.StreamHandler()
    ]
)

class ProductImageDownloader:
    def __init__(self, output_dir="images/products/thumbnail"):
        self.output_dir = Path(output_dir)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        # Criar diretório de saída
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Contadores
        self.success_count = 0
        self.error_count = 0
        
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
                # URL de busca do Google Images
                search_url = f"https://www.google.com/search?q={quote(query)}&tbm=isch"
                
                logging.info(f"🔍 Buscando: {query} (tentativa {attempt + 1})")
                
                response = self.session.get(search_url, timeout=10)
                response.raise_for_status()
                
                # Extrair URLs das imagens do HTML
                img_urls = self.extract_image_urls(response.text)
                
                if img_urls:
                    return img_urls[0]  # Retornar primeira imagem
                    
                logging.warning(f"⚠️  Nenhuma imagem encontrada para: {query}")
                
            except Exception as e:
                logging.error(f"❌ Erro na busca (tentativa {attempt + 1}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                    
        return None
    
    def extract_image_urls(self, html_content):
        """Extrai URLs das imagens do HTML do Google Images"""
        # Padrão regex para encontrar URLs de imagens
        pattern = r'"https://[^"]*\.(?:jpg|jpeg|png|webp|gif)[^"]*"'
        matches = re.findall(pattern, html_content)
        
        # Limpar e filtrar URLs
        img_urls = []
        for match in matches:
            url = match.strip('"')
            if 'googleusercontent' in url or 'gstatic' in url or len(url) > 100:
                img_urls.append(url)
                
        return img_urls[:5]  # Retornar até 5 URLs
    
    def download_and_convert_image(self, img_url, filename):
        """Baixa e converte imagem para WebP"""
        try:
            # Baixar imagem
            response = self.session.get(img_url, timeout=15)
            response.raise_for_status()
            
            # Abrir imagem com PIL
            img = Image.open(BytesIO(response.content))
            
            # Converter para RGB se necessário
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            
            # Redimensionar se muito grande (max 800x800)
            max_size = 800
            if img.width > max_size or img.height > max_size:
                img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            
            # Salvar como WebP
            output_path = self.output_dir / f"{filename}.webp"
            img.save(output_path, 'WebP', quality=85, optimize=True)
            
            logging.info(f"✅ Imagem salva: {output_path}")
            self.success_count += 1
            return True
            
        except Exception as e:
            logging.error(f"❌ Erro ao processar imagem: {e}")
            self.error_count += 1
            return False
    
    def check_existing_images(self, products):
        """Verifica quais produtos já têm imagens"""
        existing_images = set()
        
        # Listar arquivos .webp existentes
        if self.output_dir.exists():
            for file in self.output_dir.glob("*.webp"):
                existing_images.add(file.stem)  # Nome sem extensão
        
        logging.info(f"📁 {len(existing_images)} imagens já existentes")
        
        # Verificar quais produtos precisam de download
        products_to_download = []
        for product in products:
            filename = self.slugify(f"{product['name']}_{product['model']}")
            
            if filename in existing_images:
                logging.info(f"✅ Imagem já existe: {filename}.webp")
            else:
                logging.info(f"❌ Imagem faltante: {filename}.webp")
                products_to_download.append(product)
        
        return products_to_download
    
    def process_product_list(self, input_file):
        """Processa lista de produtos de um arquivo CSV ou TXT"""
        products = []
        
        if input_file.endswith('.csv'):
            products = self.read_csv_file(input_file)
        else:
            products = self.read_txt_file(input_file)
            
        logging.info(f"📦 {len(products)} produtos encontrados no arquivo")
        
        # Verificar imagens existentes
        products_to_download = self.check_existing_images(products)
        
        if not products_to_download:
            logging.info("🎉 Todos os produtos já têm imagens! Nada a baixar.")
            self.show_summary()
            return
        
        logging.info(f"🎯 {len(products_to_download)} produtos precisam de imagens")
        logging.info(f"📊 {len(products) - len(products_to_download)} produtos já têm imagens")
        
        for i, product in enumerate(products_to_download, 1):
            logging.info(f"\n{'='*50}")
            logging.info(f"📦 Processando produto {i}/{len(products_to_download)}")
            
            # Criar query de busca
            query = f"{product['name']} {product['model']}".strip()
            filename = self.slugify(f"{product['name']}_{product['model']}")
            
            # Buscar imagem
            img_url = self.search_google_images(query)
            
            if img_url:
                # Baixar e converter
                self.download_and_convert_image(img_url, filename)
            else:
                logging.error(f"❌ Não foi possível encontrar imagem para: {query}")
                self.error_count += 1
            
            # Rate limiting - esperar entre requisições
            if i < len(products_to_download):
                time.sleep(1)  # 1 segundo entre requisições
    
    def read_site_products_csv(self, filename="data/products.csv"):
        """Lê arquivo CSV de produtos do site (formato específico)"""
        products = []
        
        with open(filename, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file, delimiter=';')
            for row in reader:
                # Extrair nome e modelo do campo 'nome'
                full_name = row.get('nome', '').strip()
                
                # Tentar separar nome e modelo
                if ' ' in full_name:
                    parts = full_name.split(' ', 1)
                    name = parts[0]
                    model = parts[1] if len(parts) > 1 else ''
                else:
                    name = full_name
                    model = ''
                
                # Usar categoria como fallback se não tiver modelo
                if not model and row.get('categoria'):
                    model = row.get('categoria', '').strip()
                
                products.append({
                    'name': name,
                    'model': model,
                    'codigo': row.get('codigo', ''),
                    'categoria': row.get('categoria', '')
                })
                
        return products
    
    def read_csv_file(self, filename):
        """Lê arquivo CSV com produtos"""
        products = []
        
        with open(filename, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                products.append({
                    'name': row.get('nome', '').strip(),
                    'model': row.get('modelo', '').strip()
                })
                
        return products
    
    def read_txt_file(self, filename):
        """Lê arquivo TXT com produtos (formato: nome|modelo)"""
        products = []
        
        with open(filename, 'r', encoding='utf-8') as file:
            for line in file:
                line = line.strip()
                if line and '|' in line:
                    name, model = line.split('|', 1)
                    products.append({
                        'name': name.strip(),
                        'model': model.strip()
                    })
                    
        return products
    
    def show_summary(self):
        """Mostra resumo final"""
        logging.info(f"\n{'='*50}")
        logging.info(f"📊 RESUMO FINAL")
        logging.info(f"✅ Sucessos: {self.success_count}")
        logging.info(f"❌ Erros: {self.error_count}")
        logging.info(f"📁 Imagens salvas em: {self.output_dir.absolute()}")
        logging.info(f"{'='*50}")

def main():
    """Função principal"""
    print("🖼️  Download Automatizado de Imagens de Produtos")
    print("=" * 50)
    
    # Criar downloader
    downloader = ProductImageDownloader()
    
    # Menu de opções
    print("\n📋 Escolha uma opção:")
    print("1. Usar CSV do site (data/products.csv)")
    print("2. Usar arquivo CSV personalizado")
    print("3. Usar arquivo TXT personalizado")
    print("4. Verificar imagens existentes")
    print("0. Sair")
    
    choice = input("\n👉 Digite sua opção (0-4): ").strip()
    
    if choice == "0":
        print("👋 Até logo!")
        return
    elif choice == "1":
        input_file = "data/products.csv"
        if not os.path.exists(input_file):
            print(f"❌ Arquivo do site não encontrado: {input_file}")
            return
        
        # Usar função especial para CSV do site
        products = downloader.read_site_products_csv()
        print(f"📦 {len(products)} produtos encontrados no site")
        
        # Verificar imagens existentes
        products_to_download = downloader.check_existing_images(products)
        
        if not products_to_download:
            print("🎉 Todos os produtos já têm imagens! Nada a baixar.")
            downloader.show_summary()
            return
        
        print(f"🎯 {len(products_to_download)} produtos precisam de imagens")
        confirm = input("📥 Deseja baixar as imagens faltantes? (S/N): ").strip().upper()
        
        if confirm == "S":
            downloader.process_product_list(input_file)
            downloader.show_summary()
        else:
            print("❌ Operação cancelada.")
            
    elif choice == "2":
        input_file = input("📂 Digite o caminho do arquivo CSV: ").strip()
        if os.path.exists(input_file):
            downloader.process_product_list(input_file)
            downloader.show_summary()
        else:
            print(f"❌ Arquivo não encontrado: {input_file}")
            
    elif choice == "3":
        input_file = input("📂 Digite o caminho do arquivo TXT: ").strip()
        if os.path.exists(input_file):
            downloader.process_product_list(input_file)
            downloader.show_summary()
        else:
            print(f"❌ Arquivo não encontrado: {input_file}")
            
    elif choice == "4":
        # Verificar imagens existentes
        if downloader.output_dir.exists():
            existing_images = list(downloader.output_dir.glob("*.webp"))
            print(f"\n📁 {len(existing_images)} imagens encontradas:")
            for img in sorted(existing_images):
                print(f"  ✅ {img.name}")
        else:
            print("📁 Nenhuma imagem encontrada. A pasta não existe.")
            
    else:
        print("❌ Opção inválida!")
        
    try:
        pass
    except KeyboardInterrupt:
        print("\n⏹️  Processo interrompido pelo usuário")
    except Exception as e:
        print(f"❌ Erro durante o processamento: {e}")

if __name__ == "__main__":
    main()

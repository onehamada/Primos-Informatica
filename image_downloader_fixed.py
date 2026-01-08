#!/usr/bin/env python3
"""
Download Automatizado de Imagens de Produtos v2.0
Autor: Cascade AI
Descricao: Baixa automaticamente imagens de produtos do Google Images
"""

import os
import csv
import time
import requests
import re
from urllib.parse import quote, urlparse
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
        logging.FileHandler('image_download.log'),
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
        
        # Criar diretorio de saida
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
                    self.downloaded_images = set(json.load(f).get('downloaded', []))
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
                search_url = f"https://www.google.com/search?q={quote(query)}&tbm=isch&tbs=itp:photo,ift:jpg"
                
                logging.info(f"Buscando: {query} (tentativa {attempt + 1})")
                
                response = self.session.get(search_url, timeout=15)
                response.raise_for_status()
                
                img_urls = self.extract_image_urls(response.text)
                
                if img_urls:
                    for url in img_urls[:3]:
                        if self.validate_image_url(url):
                            return url
                    
                    logging.warning(f"Nenhuma imagem valida encontrada para: {query}")
                
            except Exception as e:
                logging.error(f"Erro na busca (tentativa {attempt + 1}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                    
        return None
    
    def validate_image_url(self, url):
        """Valida se URL e uma imagem valida"""
        try:
            parsed = urlparse(url)
            valid_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
            return any(url.lower().endswith(ext) for ext in valid_extensions)
        except:
            return False
    
    def extract_image_urls(self, html_content):
        """Extrai URLs das imagens do HTML"""
        patterns = [
            r'"https://[^"]*\.(?:jpg|jpeg|png|webp|gif)[^"]*"',
            r"'https://[^']*\.(?:jpg|jpeg|png|webp|gif)[^']*'",
            r'https://[^\s]*\.(?:jpg|jpeg|png|webp|gif)[^\s]*',
        ]
        
        img_urls = []
        for pattern in patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches:
                url = match.strip('"\'')
                if self.validate_image_url(url):
                    img_urls.append(url)
        
        unique_urls = list(dict.fromkeys(img_urls))
        return unique_urls[:10]
    
    def download_and_convert_image(self, img_url, filename):
        """Baixa e converte imagem para WebP"""
        try:
            if filename in self.downloaded_images:
                logging.info(f"Imagem ja baixada anteriormente: {filename}.webp")
                self.skip_count += 1
                return True
            
            response = self.session.get(img_url, timeout=20)
            response.raise_for_status()
            
            try:
                img = Image.open(BytesIO(response.content))
                img.verify()
                img = Image.open(BytesIO(response.content))
            except Exception as e:
                logging.error(f"Imagem invalida: {e}")
                return False
            
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            
            max_size = 800
            if img.width > max_size or img.height > max_size:
                img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            
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
    
    def check_existing_images(self, products):
        """Verifica quais produtos ja tem imagens"""
        existing_images = set()
        
        if self.output_dir.exists():
            for file in self.output_dir.glob("*.webp"):
                existing_images.add(file.stem)
        
        logging.info(f"{len(existing_images)} imagens ja existentes no disco")
        logging.info(f"{len(self.downloaded_images)} imagens no status de downloads")
        
        products_to_download = []
        for product in products:
            filename = self.slugify(f"{product['name']}_{product['model']}")
            
            if filename in existing_images or filename in self.downloaded_images:
                logging.info(f"Imagem ja existe: {filename}.webp")
            else:
                logging.info(f"Imagem faltante: {filename}.webp")
                products_to_download.append(product)
        
        return products_to_download
    
    def process_product_list(self, input_file):
        """Processa lista de produtos"""
        products = []
        
        if input_file.endswith('.csv'):
            products = self.read_csv_file(input_file)
        else:
            products = self.read_txt_file(input_file)
            
        logging.info(f"{len(products)} produtos encontrados no arquivo")
        
        products_to_download = self.check_existing_images(products)
        
        if not products_to_download:
            logging.info("Todos os produtos ja tem imagens! Nada a baixar.")
            self.show_summary()
            return
        
        logging.info(f"{len(products_to_download)} produtos precisam de imagens")
        logging.info(f"{len(products) - len(products_to_download)} produtos ja tem imagens")
        
        print(f"\nResumo:")
        print(f"   • {len(products_to_download)} imagens para baixar")
        print(f"   • {len(products) - len(products_to_download)} imagens ja existentes")
        
        confirm = input("\nDeseja baixar as imagens faltantes? (S/N): ").strip().upper()
        
        if confirm != "S":
            logging.info("Operacao cancelada pelo usuario.")
            return
        
        start_time = time.time()
        
        for i, product in enumerate(products_to_download, 1):
            logging.info(f"\n{'='*60}")
            logging.info(f"Processando produto {i}/{len(products_to_download)}")
            
            query = f"{product['name']} {product['model']}".strip()
            filename = self.slugify(f"{product['name']}_{product['model']}")
            
            img_url = self.search_google_images(query)
            
            if img_url:
                success = self.download_and_convert_image(img_url, filename)
                if not success:
                    logging.warning(f"Tentando proxima imagem para: {query}")
                    alternative_query = f"{product['name']} {product.get('categoria', '')}"
                    img_url_alt = self.search_google_images(alternative_query)
                    if img_url_alt:
                        self.download_and_convert_image(img_url_alt, filename)
            else:
                logging.error(f"Nao foi possivel encontrar imagem para: {query}")
                self.error_count += 1
            
            if i < len(products_to_download):
                delay = min(1 + (i * 0.1), 3)
                time.sleep(delay)
        
        self.save_status()
        
        total_time = time.time() - start_time
        logging.info(f"Tempo total: {total_time:.2f} segundos")
        
        self.show_summary()
    
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
    
    def read_csv_file(self, filename):
        """Le arquivo CSV com produtos"""
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
        """Le arquivo TXT com produtos"""
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
        logging.info(f"\n{'='*60}")
        logging.info(f"RESUMO FINAL")
        logging.info(f"Sucessos: {self.success_count}")
        logging.info(f"Pulados: {self.skip_count}")
        logging.info(f"Erros: {self.error_count}")
        logging.info(f"Imagens salvas em: {self.output_dir.absolute()}")
        logging.info(f"Status salvo em: {self.status_file.absolute()}")
        logging.info(f"{'='*60}")

def main():
    """Funcao principal"""
    print("Download Automatizado de Imagens de Produtos v2.0")
    print("=" * 60)
    
    downloader = ProductImageDownloader()
    
    print("\nEscolha uma opcao:")
    print("1. Usar CSV do site (data/products.csv)")
    print("2. Usar arquivo CSV personalizado")
    print("3. Usar arquivo TXT personalizado")
    print("4. Verificar imagens existentes")
    print("5. Limpar status de downloads")
    print("6. Mostrar resumo do status")
    print("0. Sair")
    
    choice = input("\nDigite sua opcao (0-6): ").strip()
    
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
        
        products_to_download = downloader.check_existing_images(products)
        
        if not products_to_download:
            print("Todos os produtos ja tem imagens! Nada a baixar.")
            downloader.show_summary()
            return
        
        print(f"{len(products_to_download)} produtos precisam de imagens")
        confirm = input("Deseja baixar as imagens faltantes? (S/N): ").strip().upper()
        
        if confirm == "S":
            downloader.process_product_list(input_file)
        else:
            print("Operacao cancelada.")
            
    elif choice == "2":
        input_file = input("Digite o caminho do arquivo CSV: ").strip()
        if os.path.exists(input_file):
            downloader.process_product_list(input_file)
        else:
            print(f"Arquivo nao encontrado: {input_file}")
            
    elif choice == "3":
        input_file = input("Digite o caminho do arquivo TXT: ").strip()
        if os.path.exists(input_file):
            downloader.process_product_list(input_file)
        else:
            print(f"Arquivo nao encontrado: {input_file}")
            
    elif choice == "4":
        if downloader.output_dir.exists():
            existing_images = list(downloader.output_dir.glob("*.webp"))
            print(f"\n{len(existing_images)} imagens encontradas:")
            for img in sorted(existing_images):
                size_kb = img.stat().st_size / 1024
                print(f"  {img.name} ({size_kb:.1f} KB)")
        else:
            print("Nenhuma imagem encontrada. A pasta nao existe.")
            
    elif choice == "5":
        if downloader.status_file.exists():
            downloader.status_file.unlink()
            downloader.downloaded_images.clear()
            print("Status de downloads limpo!")
        else:
            print("Nenhum status encontrado para limpar.")
            
    elif choice == "6":
        if downloader.status_file.exists():
            try:
                with open(downloader.status_file, 'r', encoding='utf-8') as f:
                    status = json.load(f)
                
                print(f"\nRESUMO DO STATUS:")
                print(f"Ultima atualizacao: {status.get('last_update', 'N/A')}")
                print(f"Downloads bem-sucedidos: {status.get('success_count', 0)}")
                print(f"Erros: {status.get('error_count', 0)}")
                print(f"Pulados: {status.get('skip_count', 0)}")
                print(f"Imagens no status: {len(status.get('downloaded', []))}")
            except:
                print("Erro ao ler arquivo de status.")
        else:
            print("Nenhum status encontrado.")
            
    else:
        print("Opcao invalida!")
        
    try:
        pass
    except KeyboardInterrupt:
        print("\nProcesso interrompido pelo usuario")
        downloader.save_status()
    except Exception as e:
        print(f"Erro durante o processamento: {e}")
        downloader.save_status()

if __name__ == "__main__":
    main()

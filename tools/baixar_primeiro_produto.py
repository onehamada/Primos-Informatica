#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Download SUPER PERSISTENTE
Faz DE TUDO para baixar imagem do primeiro produto
"""

import os
import csv
import requests
from PIL import Image
import io
from urllib.parse import quote
import re
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class SuperPersistentDownloader:
    def __init__(self):
        self.csv_file = '../data/products.csv'
        self.image_folder = '../images/products/thumbnail'
        
        os.makedirs(self.image_folder, exist_ok=True)
        
        # Headers realistas
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
        })
    
    def get_all_missing_products(self):
        """Pega TODOS os produtos sem imagem"""
        missing_products = []
        
        if not os.path.exists(self.csv_file):
            print("ERRO: CSV não encontrado!")
            return missing_products
        
        try:
            with open(self.csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f, delimiter=';')
                
                for row in reader:
                    if row.get('codigo') and row.get('nome'):
                        codigo = row['codigo'].strip()
                        nome = row['nome'].strip()
                        imagem = row.get('imagem', f"{codigo}.webp").strip()
                        
                        image_path = os.path.join(self.image_folder, imagem)
                        
                        if not os.path.exists(image_path):
                            missing_products.append({
                                'codigo': codigo,
                                'nome': nome,
                                'imagem': imagem
                            })
        
        except Exception as e:
            print(f"ERRO ao ler CSV: {e}")
        
        print(f"Encontrados {len(missing_products)} produtos sem imagem")
        return missing_products
    
    def method_1_requests_google(self, product):
        """Método 1: Requests direto no Google - MELHORADO"""
        print("\n" + "="*60)
        print("MÉTODO 1: Requests direto no Google")
        print("="*60)
        
        # Headers diferentes para evitar bloqueio
        headers_list = [
            {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none'
            },
            {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Connection': 'keep-alive'
            }
        ]
        
        # Tentar com diferentes headers
        for i, headers in enumerate(headers_list):
            try:
                print(f"  Tentando com headers {i+1}/3...")
                
                # Criar sessão com headers específicos
                session = requests.Session()
                session.headers.update(headers)
                
                url = f"https://www.google.com/search?q={quote(product['nome'])}&tbm=isch&hl=pt-BR"
                response = session.get(url, timeout=15)
                
                if response.status_code == 200:
                    html = response.text
                    
                    # Múltiplos padrões de imagem melhorados
                    patterns = [
                        r'"https://[^"]*googleusercontent[^"]*\.(?:jpg|jpeg|png|webp)[^"]*"',
                        r'"https://[^"]*gstatic[^"]*\.(?:jpg|jpeg|png|webp)[^"]*"',
                        r'data-src="(https://[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
                        r'src="(https://[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
                        r'https://[^"]*\.googleusercontent\.com[^"]*\.(?:jpg|jpeg|png|webp)[^"]*',
                        r'https://[^"]*\.gstatic\.com[^"]*\.(?:jpg|jpeg|png|webp)[^"]*'
                    ]
                    
                    for pattern in patterns:
                        matches = re.findall(pattern, html)
                        
                        for match in matches:
                            # Limpar URL - remover aspas se existirem
                            clean_url = match.strip('"').replace('\\u003d', '=').replace('\\', '')
                            
                            # Filtros melhorados
                            if ('ssl.gstatic.com' not in clean_url and 
                                'al-icon' not in clean_url and 
                                'logo' not in clean_url.lower() and
                                'icon' not in clean_url.lower() and
                                len(clean_url) > 50):
                                
                                print(f"  URL encontrada: {clean_url[:80]}...")
                                
                                if self.download_image_from_url(clean_url, product):
                                    return True
                    
                    print(f"  Nenhuma imagem válida com headers {i+1}")
                else:
                    print(f"  HTTP {response.status_code} com headers {i+1}")
                
            except Exception as e:
                print(f"  Erro com headers {i+1}: {e}")
                continue
        
        print("  Nenhuma imagem válida encontrada com nenhum header")
        return False
    
    def method_2_selenium_google(self, product):
        """Método 2: Selenium no Google Images - CORRIGIDO"""
        print("\n" + "="*60)
        print("MÉTODO 2: Selenium no Google Images")
        print("="*60)
        
        try:
            from webdriver_manager.chrome import ChromeDriverManager
            
            options = Options()
            options.add_argument('--headless')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--disable-gpu')
            options.add_argument('--window-size=1920,1080')
            options.add_argument('--disable-blink-features=AutomationControlled')
            options.add_experimental_option("excludeSwitches", ["enable-automation"])
            options.add_experimental_option('useAutomationExtension', False)
            options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
            
            # CORRIGIDO: Usar webdriver-manager sem Service
            driver = webdriver.Chrome(
                ChromeDriverManager().install(),
                options=options
            )
            driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            
            url = f"https://www.google.com/search?q={quote(product['nome'])}&tbm=isch&hl=pt-BR"
            print(f"  Acessando: {url}")
            
            driver.get(url)
            time.sleep(3)
            
            # Procurar por imagens
            images = driver.find_elements(By.CSS_SELECTOR, "img")
            print(f"  {len(images)} imagens encontradas na página")
            
            for i, img in enumerate(images[:10]):  # Primeiras 10
                try:
                    src = img.get_attribute('src')
                    data_src = img.get_attribute('data-src')
                    
                    image_url = data_src or src
                    
                    if image_url and 'http' in image_url:
                        if 'ssl.gstatic.com' not in image_url and 'al-icon' not in image_url:
                            print(f"  Imagem {i+1}: {image_url[:80]}...")
                            
                            if self.download_image_from_url(image_url, product):
                                driver.quit()
                                return True
                
                except Exception as e:
                    print(f"  Erro na imagem {i+1}: {e}")
                    continue
            
            driver.quit()
            print("  Nenhuma imagem baixada com Selenium")
            
        except Exception as e:
            print(f"  Erro no Selenium: {e}")
            print("  Continuando com outros métodos...")
        
        return False
    
    def method_3_alternative_sources(self, product):
        """Método 3: Fontes alternativas - OTIMIZADO"""
        print("\n" + "="*60)
        print("MÉTODO 3: Fontes alternativas")
        print("="*60)
        
        # Fontes expandidas com Mercado Livre e AliExpress
        sources = [
            ("Bing Images", f"https://www.bing.com/images/search?q={quote(product['nome'])}&form=QBLH"),
            ("Yahoo Images", f"https://images.search.yahoo.com/search/images?p={quote(product['nome'])}"),
            ("DuckDuckGo Images", f"https://duckduckgo.com/i.js?q={quote(product['nome'])}"),
            ("Mercado Livre", f"https://lista.mercadolivre.com.br/{quote(product['nome'])}"),
            ("AliExpress", f"https://www.aliexpress.com/wholesale?SearchText={quote(product['nome'])}&catId=0&SortType=default")
        ]
        
        for source_name, url in sources:
            print(f"\n  Tentando {source_name}...")
            
            try:
                response = self.session.get(url, timeout=10)
                
                if response.status_code == 200:
                    html = response.text
                    
                    # Padrões específicos por fonte
                    if source_name == "Mercado Livre":
                        # Mercado Livre tem padrão específico
                        patterns = [
                            r'"(https://[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
                            r'data-src="(https://[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
                            r'src="(https://mlstatic[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"'
                        ]
                    elif source_name == "AliExpress":
                        # AliExpress tem padrão específico
                        patterns = [
                            r'"(https://[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
                            r'data-src="(https://[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
                            r'src="(https://ae01[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"'
                        ]
                    else:
                        # Padrão genérico para outras fontes
                        patterns = [
                            r'"(https://[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
                            r'data-src="(https://[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
                            r'src="(https://[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"'
                        ]
                    
                    for pattern in patterns:
                        matches = re.findall(pattern, html)
                        
                        for match in matches[:5]:  # Primeiras 5 por padrão
                            # Limpar URL - remover aspas se existirem
                            clean_url = match.strip('"')
                            
                            # Filtros otimizados
                            if (len(clean_url) > 30 and 
                                'http' in clean_url and
                                'logo' not in clean_url.lower() and
                                'icon' not in clean_url.lower() and
                                'sprite' not in clean_url.lower() and
                                'placeholder' not in clean_url.lower() and
                                'loading' not in clean_url.lower()):
                                
                                print(f"    URL: {clean_url[:60]}...")
                                
                                if self.download_image_from_url(clean_url, product):
                                    return True
                    
                    print(f"    Nenhuma imagem válida em {source_name}")
                else:
                    print(f"    HTTP {response.status_code} em {source_name}")
                
            except Exception as e:
                print(f"    Erro em {source_name}: {e}")
        
        return False
    
    def method_4_direct_product_search(self, product):
        """Método 4: Busca direta por produto - EXPANDIDO"""
        print("\n" + "="*60)
        print("MÉTODO 4: Busca direta por produto")
        print("="*60)
        
        # Termos de busca específicos
        search_terms = [
            product['nome'],
            product['nome'] + " produto",
            product['nome'] + " original",
            product['nome'] + " foto real",
            product['nome'] + " imagem",
            product['nome'] + " photo"
        ]
        
        # Adicionar categoria
        name_lower = product['nome'].lower()
        if 'mouse' in name_lower:
            search_terms.extend([
                "mouse computador", "mouse gamer", "mouse sem fio", 
                "mouse usb", "mouse bluetooth", "mouse wireless"
            ])
        elif 'monitor' in name_lower:
            search_terms.extend([
                "monitor led", "monitor computador", "monitor gamer",
                "monitor hd", "monitor full hd", "monitor 4k"
            ])
        elif 'notebook' in name_lower:
            search_terms.extend([
                "notebook laptop", "computador portatil", "notebook gamer",
                "ultrabook", "notebook profissional"
            ])
        elif 'roteador' in name_lower:
            search_terms.extend([
                "roteador wifi", "router wireless", "roteador mesh",
                "roteador dual band", "roteador gigabit"
            ])
        elif 'teclado' in name_lower:
            search_terms.extend([
                "teclado computador", "teclado gamer", "teclado mecânico",
                "teclado usb", "teclado wireless"
            ])
        elif 'adaptador' in name_lower:
            search_terms.extend([
                "adaptador rede", "adaptador wireless", "adaptador wifi",
                "adaptador usb", "adaptador bluetooth"
            ])
        elif 'fonte' in name_lower:
            search_terms.extend([
                "fonte computador", "fonte gamer", "fonte atx",
                "fonte modular", "fonte 80 plus"
            ])
        elif 'placa' in name_lower:
            if 'mãe' in name_lower or 'mae' in name_lower:
                search_terms.extend([
                    "placa mae", "motherboard", "placa mae gamer",
                    "placa mae atx", "placa mae ddr4"
                ])
            elif 'vídeo' in name_lower:
                search_terms.extend([
                    "placa de video", "gpu", "placa video gamer",
                    "placa video nvidia", "placa video amd"
                ])
        
        # Fontes expandidas para busca direta
        for term in search_terms:
            print(f"\n  Buscando: {term}")
            
            search_engines = [
                ("Google Images", f"https://www.google.com/search?q={quote(term)}&tbm=isch&hl=pt-BR"),
                ("Bing Images", f"https://www.bing.com/images/search?q={quote(term)}&form=QBLH"),
                ("Yahoo Images", f"https://images.search.yahoo.com/search/images?p={quote(term)}"),
                ("DuckDuckGo Images", f"https://duckduckgo.com/i.js?q={quote(term)}")
            ]
            
            for engine_name, search_url in search_engines:
                try:
                    print(f"    Tentando {engine_name}...")
                    response = self.session.get(search_url, timeout=10)
                    
                    if response.status_code == 200:
                        html = response.text
                        
                        # Padrões de imagem expandidos
                        patterns = [
                            r'"https://[^"]*\.(?:jpg|jpeg|png|webp)[^"]*"',
                            r'data-src="(https://[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
                            r'src="(https://[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
                            r'https://[^"]*\.amazon[^"]*\.(?:jpg|jpeg|png|webp)[^"]*',
                            r'https://[^"]*\.americanas[^"]*\.(?:jpg|jpeg|png|webp)[^"]*',
                            r'https://[^"]*\.mercadolivre[^"]*\.(?:jpg|jpeg|png|webp)[^"]*',
                            r'https://[^"]*\.kabum[^"]*\.(?:jpg|jpeg|png|webp)[^"]*',
                            r'https://[^"]*\.mundomax[^"]*\.(?:jpg|jpeg|png|webp)[^"]*'
                        ]
                        
                        for pattern in patterns:
                            matches = re.findall(pattern, html)
                            
                            for match in matches[:3]:  # Primeiras 3 por padrão
                                # Limpar URL - remover aspas se existirem
                                clean_url = match.strip('"')
                                
                                # Filtros avançados
                                if (len(clean_url) > 40 and 
                                    'ssl.gstatic.com' not in clean_url and
                                    'logo' not in clean_url.lower() and
                                    'icon' not in clean_url.lower() and
                                    'sprite' not in clean_url.lower() and
                                    'placeholder' not in clean_url.lower() and
                                    'loading' not in clean_url.lower() and
                                    'thumbnail' not in clean_url.lower() and
                                    'small' not in clean_url.lower() and
                                    'mini' not in clean_url.lower()):
                                    
                                    print(f"      Tentando: {clean_url[:60]}...")
                                    
                                    if self.download_image_from_url(clean_url, product):
                                        print(f"      ✓ SUCESSO com {engine_name}!")
                                        return True
                    
                    else:
                        print(f"      HTTP {response.status_code} em {engine_name}")
                
                except Exception as e:
                    print(f"      Erro em {engine_name}: {e}")
                    continue
        
        return False
    
    def download_image_from_url(self, url, product):
        """Baixa imagem de uma URL específica usando o nome exato do CSV"""
        try:
            print(f"    Baixando: {url[:80]}...")
            
            response = self.session.get(url, timeout=15)
            
            if response.status_code == 200:
                # Verificar tamanho mínimo antes de processar
                if len(response.content) < 5000:  # Menos de 5KB = provavelmente ícone
                    print(f"    Imagem muito pequena: {len(response.content)} bytes")
                    return False
                
                # Tentar abrir como imagem
                img = Image.open(io.BytesIO(response.content))
                
                # Verificar tamanho mínimo da imagem
                width, height = img.size
                if width < 150 or height < 150:
                    print(f"    Imagem muito pequena: {width}x{height}")
                    return False
                
                # Verificar se não é uma imagem genérica (baseado no conteúdo)
                if self.is_generic_image(img, url):
                    print(f"    Imagem parece ser genérica/placeholder")
                    return False
                
                # Salvar como WebP com nome exato do CSV
                filename = product['imagem']
                if not filename.lower().endswith('.webp'):
                    filename += '.webp'
                
                filepath = os.path.join(self.image_folder, filename)
                
                # Converter e salvar
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                img.save(filepath, 'WEBP', quality=85, optimize=True)
                
                print(f"    ✓ SUCESSO: {filename} ({len(response.content)//1024}KB)")
                return True
            else:
                print(f"    Erro HTTP: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"    Erro ao baixar: {e}")
            return False
    
    def is_generic_image(self, img, url):
        """Verifica se a imagem parece ser genérica/placeholder"""
        try:
            # Verificar URLs de imagens genéricas
            generic_patterns = [
                'placeholder', 'generic', 'default', 'no-image',
                'not-found', 'coming-soon', 'icon', 'logo',
                'sprite', 'loading', 'thumbnail-small'
            ]
            
            url_lower = url.lower()
            for pattern in generic_patterns:
                if pattern in url_lower:
                    return True
            
            # Verificar dimensões muito pequenas
            width, height = img.size
            if width < 100 or height < 100:
                return True
            
            # Verificar proporções muito estranhas (muito altas ou muito largas)
            ratio = width / height if height > 0 else 0
            if ratio > 5 or ratio < 0.2:  # Mais de 5:1 ou menos de 1:5
                return True
            
            # Verificar se é uma imagem quase quadrada muito pequena (ícone)
            if width < 200 and height < 200 and abs(ratio - 1) < 0.2:
                return True
            
            return False
            
        except:
            return False
    
    def download_all_missing_images(self):
        """Faz DE TUDO para baixar TODAS as imagens faltantes"""
        missing_products = self.get_all_missing_products()
        
        if not missing_products:
            print("Nenhum produto sem imagem encontrado!")
            return
        
        print(f"\nINICIANDO DOWNLOAD DE {len(missing_products)} IMAGENS FALTANTES")
        print("="*80)
        
        successful = 0
        failed = 0
        
        for i, product in enumerate(missing_products, 1):
            print(f"\n{'='*80}")
            print(f"PRODUTO {i}/{len(missing_products)}: {product['nome']}")
            print(f"CÓDIGO: {product['codigo']}")
            print(f"{'='*80}")
            
            # Tentar todos os métodos para este produto
            if self.download_single_product_image(product):
                successful += 1
                print(f"\n✅ SUCESSO: Imagem baixada para {product['nome']}")
            else:
                failed += 1
                print(f"\n❌ FALHA: Não foi possível baixar imagem para {product['nome']}")
            
            # Progresso
            if i % 5 == 0 or i == len(missing_products):
                progress = (i / len(missing_products)) * 100
                print(f"\n{'='*80}")
                print(f"PROGRESSO: {progress:.1f}% - Sucesso: {successful}, Falhas: {failed}")
                print(f"{'='*80}")
            
            # Pequeno delay entre produtos
            time.sleep(1)
        
        # Resumo final
        print(f"\n{'='*80}")
        print("RESUMO FINAL:")
        print(f"Total processado: {len(missing_products)}")
        print(f"Sucessos: {successful}")
        print(f"Falhas: {failed}")
        print(f"Taxa de sucesso: {(successful/len(missing_products))*100:.1f}%")
        print(f"{'='*80}")
    
    def download_single_product_image(self, product):
        """Tenta todos os métodos para um único produto - OTIMIZADO"""
        # Métodos reordenados por eficiência (Método 4 primeiro)
        methods = [
            ("Busca Direta", lambda: self.method_4_direct_product_search(product)),
            ("Fontes Alternativas", lambda: self.method_3_alternative_sources(product)),
            ("Requests Google", lambda: self.method_1_requests_google(product)),
            ("Selenium Google", lambda: self.method_2_selenium_google(product))
        ]
        
        for method_name, method_func in methods:
            print(f"\n{'='*20} {method_name} {'='*20}")
            
            try:
                if method_func():
                    print(f"\n✅ SUCESSO com método: {method_name}")
                    return True
            except Exception as e:
                print(f"Erro no método {method_name}: {e}")
                continue
            
            time.sleep(0.5)  # Reduzido para mais velocidade
        
        return False

def main():
    print("="*80)
    print("   DOWNLOAD SUPER PERSISTENTE - TODAS AS IMAGENS V2")
    print("="*80)
    print("Faz DE TUDO para baixar TODAS as imagens faltantes:")
    print("✅ MÉTODO 1: Requests direto no Google - MELHORADO com 3 headers")
    print("✅ MÉTODO 2: Selenium no Google Images - CORRIGIDO sem erros")
    print("✅ MÉTODO 3: Fontes alternativas - EXPANDIDO com Mercado Livre + AliExpress")
    print("✅ MÉTODO 4: Busca direta por produto - EXPANDIDO com + fontes e termos")
    print("- NÃO DESISTE JAMAIS!")
    print("- Processa TODOS os produtos sem imagem")
    print("- OTIMIZADO para máxima eficiência!")
    print("="*80)
    print()
    
    downloader = SuperPersistentDownloader()
    downloader.download_all_missing_images()

if __name__ == "__main__":
    main()

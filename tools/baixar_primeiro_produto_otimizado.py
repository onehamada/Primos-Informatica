#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Download SUPER PERSISTENTE - VERSÃO OTIMIZADA
Faz DE TUDO para baixar imagem do primeiro produto
COM DETECÇÃO E REMOÇÃO DE FUNDO PRETO
"""

import os
import csv
import requests
from PIL import Image, ImageFilter, ImageEnhance
import io
from urllib.parse import quote
import re
import time
import numpy as np
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class OptimizedPersistentDownloader:
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
    
    def analyze_background(self, img):
        """Analisa o fundo da imagem e retorna informações"""
        try:
            # Converter para RGB se necessário
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Reduzir tamanho para análise mais rápida
            small_img = img.copy()
            if max(small_img.size) > 200:
                ratio = 200 / max(small_img.size)
                new_size = (int(small_img.size[0] * ratio), int(small_img.size[1] * ratio))
                small_img = small_img.resize(new_size, Image.Resampling.LANCZOS)
            
            # Converter para numpy array
            img_array = np.array(small_img)
            
            # Analisar bordas (onde provavelmente está o fundo)
            height, width = img_array.shape[:2]
            
            # Coletar pixels das bordas
            border_pixels = []
            
            # Bordas superior e inferior
            for x in range(width):
                border_pixels.append(img_array[0, x])  # Superior
                border_pixels.append(img_array[height-1, x])  # Inferior
            
            # Bordas esquerda e direita
            for y in range(height):
                border_pixels.append(img_array[y, 0])  # Esquerda
                border_pixels.append(img_array[y, width-1])  # Direita
            
            # Calcular cor média do fundo
            border_pixels = np.array(border_pixels)
            avg_color = np.mean(border_pixels, axis=0)
            
            # Determinar tipo de fundo
            r, g, b = avg_color
            
            # Verificar se é fundo preto
            if r < 30 and g < 30 and b < 30:
                return {
                    'type': 'black',
                    'color': (int(r), int(g), int(b)),
                    'confidence': max(0, 100 - (r + g + b) / 3 * 3.33)
                }
            
            # Verificar se é fundo branco
            elif r > 225 and g > 225 and b > 225:
                return {
                    'type': 'white',
                    'color': (int(r), int(g), int(b)),
                    'confidence': min(100, ((r + g + b) / 3 - 225) * 4)
                }
            
            # Verificar se é transparente (PNG)
            elif img.mode == 'RGBA':
                alpha_channel = img_array[:, :, 3] if len(img_array.shape) > 2 else None
                if alpha_channel is not None:
                    transparent_ratio = np.sum(alpha_channel < 128) / alpha_channel.size
                    if transparent_ratio > 0.1:
                        return {
                            'type': 'transparent',
                            'color': (255, 255, 255),
                            'confidence': transparent_ratio * 100
                        }
            
            # Cor intermediária
            return {
                'type': 'colored',
                'color': (int(r), int(g), int(b)),
                'confidence': 50
            }
            
        except Exception as e:
            print(f"    Erro ao analisar fundo: {e}")
            return {
                'type': 'unknown',
                'color': (128, 128, 128),
                'confidence': 0
            }
    
    def remove_black_background(self, img):
        """Remove fundo preto usando técnicas avançadas"""
        try:
            # Converter para RGB se necessário
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Converter para numpy array
            img_array = np.array(img)
            
            # Criar máscara para pixels não pretos
            # Considerar como "não preto" pixels com brilho > 30
            grayscale = np.mean(img_array, axis=2)
            mask = grayscale > 30
            
            # Aplicar filtro de morfologia para remover ruído
            from scipy import ndimage
            mask = ndimage.binary_closing(mask, structure=np.ones((3,3)))
            mask = ndimage.binary_opening(mask, structure=np.ones((2,2)))
            
            # Criar imagem com fundo transparente
            result_img = Image.new('RGBA', img.size, (255, 255, 255, 0))
            result_array = np.array(result_img)
            
            # Copiar apenas pixels não pretos
            for y in range(img_array.shape[0]):
                for x in range(img_array.shape[1]):
                    if mask[y, x]:
                        result_array[y, x] = (*img_array[y, x], 255)
            
            result_img = Image.fromarray(result_array)
            
            # Criar nova imagem com fundo branco
            final_img = Image.new('RGB', img.size, (255, 255, 255))
            final_img.paste(result_img, (0, 0), result_img)
            
            return final_img
            
        except ImportError:
            # Fallback sem scipy
            return self.remove_black_background_simple(img)
        except Exception as e:
            print(f"    Erro na remoção avançada de fundo: {e}")
            return self.remove_black_background_simple(img)
    
    def remove_black_background_simple(self, img):
        """Remove fundo preto usando método simples"""
        try:
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            img_array = np.array(img)
            
            # Criar máscara simples
            mask = np.mean(img_array, axis=2) > 35
            
            # Criar imagem resultante
            result_array = np.copy(img_array)
            result_array[~mask] = [255, 255, 255]  # Trocar preto por branco
            
            return Image.fromarray(result_array)
            
        except Exception as e:
            print(f"    Erro na remoção simples de fundo: {e}")
            return img
    
    def enhance_product_image(self, img):
        """Melhora a qualidade da imagem do produto"""
        try:
            # Aumentar contraste
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.1)
            
            # Aumentar nitidez
            enhancer = ImageEnhance.Sharpness(img)
            img = enhancer.enhance(1.1)
            
            # Aumentar saturação levemente
            enhancer = ImageEnhance.Color(img)
            img = enhancer.enhance(1.05)
            
            return img
            
        except Exception as e:
            print(f"    Erro ao melhorar imagem: {e}")
            return img
    
    def is_suitable_product_image(self, img, url=""):
        """Verifica se a imagem é adequada para produto"""
        try:
            # Verificar dimensões mínimas
            width, height = img.size
            if width < 200 or height < 200:
                return False, "Imagem muito pequena"
            
            # Verificar se é muito quadrado (possível ícone)
            ratio = width / height if height > 0 else 0
            if 0.8 < ratio < 1.2 and max(width, height) < 300:
                return False, "Imagem muito quadrada e pequena (possível ícone)"
            
            # NOVO: Verificar proporções adequadas para produtos
            # Proporções ideais para produtos: entre 0.7:1 e 2:1
            if ratio > 2.5:  # Muito larga (como 800x294 = 2.72:1)
                return False, f"Imagem muito larga (proporção {ratio:.2f}:1)"
            if ratio < 0.4:  # Muito alta
                return False, f"Imagem muito alta (proporção {ratio:.2f}:1)"
            
            # NOVO: Verificar dimensões máximas razoáveis
            if max(width, height) > 1200:  # Imagens muito grandes
                return False, f"Imagem muito grande ({width}x{height})"
            
            # NOVO: Verificar área mínima para garantir qualidade
            area = width * height
            if area < 40000:  # Menos de 200x200 pixels
                return False, f"Área muito pequena ({area} pixels)"
            
            # Analisar fundo
            bg_analysis = self.analyze_background(img)
            
            # Verificar se é fundo preto
            if bg_analysis['type'] == 'black' and bg_analysis['confidence'] > 60:
                print(f"    ⚠️  Imagem com fundo preto detectado (confiança: {bg_analysis['confidence']:.1f}%)")
                return False, "Fundo preto detectado"
            
            # Verificar se é muito escura
            grayscale = img.convert('L')
            avg_brightness = np.mean(np.array(grayscale))
            if avg_brightness < 50:
                return False, "Imagem muito escura"
            
            # Verificar se tem marca d'água ou logo
            if self.has_watermark_or_logo(img):
                return False, "Marca d'água ou logomarca detectada"
            
            # Verificar se está cortada
            if self.is_cropped_image(img):
                return False, "Imagem appears to be cropped"
            
            # Verificar se tem texto sobreposto
            if self.has_text_overlay(img):
                return False, "Texto sobreposto detectado"
            
            return True, "Imagem adequada"
            
        except Exception as e:
            print(f"    Erro ao verificar adequação: {e}")
            return True, "Verificação falhou"
    
    def resize_product_image(self, img):
        """Redimensiona imagem para proporções adequadas de produto"""
        try:
            width, height = img.size
            ratio = width / height if height > 0 else 1
            
            # Dimensões padrão para produtos
            standard_sizes = [
                (400, 400),   # Quadrado
                (500, 375),   # 4:3
                (600, 400),   # 3:2
                (800, 450),   # 16:9
                (500, 500),   # Quadrado maior
            ]
            
            # Se a proporção for muito inadequada, redimensionar
            if ratio > 2.5 or ratio < 0.4:
                # Escolher o tamanho padrão mais próximo
                best_size = (500, 375)  # Default 4:3
                
                # Calcular proporção atual
                current_ratio = width / height
                
                # Encontrar tamanho padrão com proporção mais próxima
                min_diff = float('inf')
                for std_width, std_height in standard_sizes:
                    std_ratio = std_width / std_height
                    diff = abs(current_ratio - std_ratio)
                    if diff < min_diff:
                        min_diff = diff
                        best_size = (std_width, std_height)
                
                # Redimensionar mantendo qualidade
                print(f"    📏 Redimensionando de {width}x{height} para {best_size[0]}x{best_size[1]}")
                
                # Usar LANCZOS para melhor qualidade
                img_resized = img.resize(best_size, Image.Resampling.LANCZOS)
                
                # Melhorar um pouco após redimensionamento
                img_resized = self.enhance_product_image(img_resized)
                
                return img_resized
            
            # Se dimensões forem muito grandes, reduzir mantendo proporção
            elif max(width, height) > 800:
                max_size = 800
                if width > height:
                    new_width = max_size
                    new_height = int(height * max_size / width)
                else:
                    new_height = max_size
                    new_width = int(width * max_size / height)
                
                new_size = (new_width, new_height)
                print(f"    📏 Reduzindo de {width}x{height} para {new_width}x{new_height}")
                
                img_resized = img.resize(new_size, Image.Resampling.LANCZOS)
                img_resized = self.enhance_product_image(img_resized)
                
                return img_resized
            
            return img
            
        except Exception as e:
            print(f"    Erro ao redimensionar: {e}")
            return img
    
    def process_image_background(self, img):
        """Processa o fundo da imagem conforme necessário"""
        try:
            # Analisar fundo
            bg_analysis = self.analyze_background(img)
            
            print(f"    📊 Análise de fundo: {bg_analysis['type']} (confiança: {bg_analysis['confidence']:.1f}%)")
            
            # Se for fundo preto, tentar remover
            if bg_analysis['type'] == 'black':
                print(f"    🔄 Removendo fundo preto...")
                img = self.remove_black_background(img)
                print(f"    ✅ Fundo preto removido")
            
            # Redimensionar se necessário
            img = self.resize_product_image(img)
            
            # Melhorar qualidade da imagem
            img = self.enhance_product_image(img)
            
            return img
            
        except Exception as e:
            print(f"    Erro ao processar fundo: {e}")
            return img
    
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
        """Método 1: Requests direto no Google - MELHORADO COM FILTRO DE FUNDO"""
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
                
                # Adicionar termos para evitar fundo preto
                search_terms = [
                    product['nome'] + " white background",
                    product['nome'] + " transparent background",
                    product['nome'] + " png",
                    product['nome'] + " produto foto"
                ]
                
                for term in search_terms:
                    url = f"https://www.google.com/search?q={quote(term)}&tbm=isch&hl=pt-BR"
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
                    
                    time.sleep(1)  # Delay entre termos de busca
                
                print(f"  Nenhuma imagem válida com headers {i+1}")
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
            
            # Buscar com termos para fundo branco
            search_term = product['nome'] + " white background"
            url = f"https://www.google.com/search?q={quote(search_term)}&tbm=isch&hl=pt-BR"
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
            ("Bing Images", f"https://www.bing.com/images/search?q={quote(product['nome'] + ' white background')}&form=QBLH"),
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
        
        # Termos de busca específicos com foco em fundo branco
        search_terms = [
            product['nome'] + " white background",
            product['nome'] + " transparent background",
            product['nome'] + " png",
            product['nome'] + " produto foto",
            product['nome'] + " original",
            product['nome'] + " imagem"
        ]
        
        # Adicionar categoria
        name_lower = product['nome'].lower()
        if 'mouse' in name_lower:
            search_terms.extend([
                "mouse computador white background", "mouse gamer png", 
                "mouse sem fio transparent", "mouse usb produto"
            ])
        elif 'monitor' in name_lower:
            search_terms.extend([
                "monitor led white background", "monitor computador png",
                "monitor gamer produto", "monitor hd imagem"
            ])
        elif 'notebook' in name_lower:
            search_terms.extend([
                "notebook laptop white background", "computador portatil png",
                "notebook gamer produto", "ultrabook imagem"
            ])
        elif 'roteador' in name_lower:
            search_terms.extend([
                "roteador wifi white background", "router wireless png",
                "roteador mesh produto", "roteador gigabit imagem"
            ])
        elif 'teclado' in name_lower:
            search_terms.extend([
                "teclado computador white background", "teclado gamer png",
                "teclado mecânico transparent", "teclado usb produto"
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
        """Baixa imagem de uma URL específica usando o nome exato do CSV COM PROCESSAMENTO DE FUNDO"""
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
                
                # Verificar se é adequada para produto
                is_suitable, reason = self.is_suitable_product_image(img, url)
                if not is_suitable:
                    print(f"    ❌ Imagem inadequada: {reason}")
                    return False
                
                # Processar fundo da imagem
                img = self.process_image_background(img)
                
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
    
    def download_all_missing_images(self):
        """Faz DE TUDO para baixar TODAS as imagens faltantes"""
        missing_products = self.get_all_missing_products()
        
        if not missing_products:
            print("Nenhum produto sem imagem encontrado!")
            return
        
        print(f"\nINICIANDO DOWNLOAD DE {len(missing_products)} IMAGENS FALTANTES")
        print("="*80)
        print("🎨 VERSÃO OTIMIZADA COM DETECÇÃO E REMOÇÃO DE FUNDO PRETO")
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
            time.sleep(2)  # Aumentado para evitar bloqueio
        
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
            
            time.sleep(1)  # Aumentado para mais segurança
        
        return False

def main():
    print("="*80)
    print("   DOWNLOAD SUPER PERSISTENTE - VERSÃO OTIMIZADA V3")
    print("="*80)
    print("🎨 NOVAS FUNCIONALIDADES:")
    print("✅ DETECÇÃO AUTOMÁTICA DE FUNDO PRETO")
    print("✅ REMOÇÃO AVANÇADA DE FUNDO PRETO")
    print("✅ BUSCA POR IMAGENS COM FUNDO BRANCO/TRANSPARENTE")
    print("✅ MELHORIA AUTOMÁTICA DE QUALIDADE")
    print("✅ FILTRO INTELIGENTE DE IMAGENS ADEQUADAS")
    print("="*80)
    print("MÉTODOS DISPONÍVEIS:")
    print("✅ MÉTODO 1: Requests Google - COM BUSCA POR FUNDO BRANCO")
    print("✅ MÉTODO 2: Selenium Google - OTIMIZADO")
    print("✅ MÉTODO 3: Fontes alternativas - MERCADO LIVRE + ALIEXPRESS")
    print("✅ MÉTODO 4: Busca direta - COM TERMOS ESPECÍFICOS")
    print("- EVITA IMAGENS COM FUNDO PRETO")
    print("- REMOVE FUNDO PRETO QUANDO NECESSÁRIO")
    print("- MELHORA QUALIDADE DA IMAGEM")
    print("- MAIOR TAXA DE SUCESSO!")
    print("="*80)
    print()
    
    # Verificar dependências
    try:
        import numpy as np
        print("✅ NumPy encontrado")
    except ImportError:
        print("❌ NumPy não encontrado. Instale com: pip install numpy")
        return
    
    try:
        from scipy import ndimage
        print("✅ SciPy encontrado")
    except ImportError:
        print("⚠️  SciPy não encontrado. Usando método simples de remoção de fundo")
        print("   Para melhor qualidade, instale com: pip install scipy")
    
    downloader = OptimizedPersistentDownloader()
    downloader.download_all_missing_images()

if __name__ == "__main__":
    main()

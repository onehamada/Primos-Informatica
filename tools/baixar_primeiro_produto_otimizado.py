#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Download SUPER PERSISTENTE - VERSÃO OTIMIZADA
Faz DE TUDO para baixar imagem do primeiro produto
COM DETECÇÃO E REMOÇÃO DE FUNDO PRETO
"""

import os
import csv
import html
import sys
import json
import argparse
import unicodedata
from collections import deque
import requests
from PIL import Image, ImageFilter, ImageEnhance
import io
from urllib.parse import quote, urlparse
import re
import time
import traceback
import subprocess
import numpy as np
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass


def launched_from_windows_explorer():
    """Detecta quando o script foi aberto por duplo clique no Explorer."""
    if os.name != 'nt':
        return False

    try:
        parent_pid = os.getppid()
        result = subprocess.run(
            [
                'powershell',
                '-NoProfile',
                '-Command',
                f"(Get-Process -Id {parent_pid} -ErrorAction SilentlyContinue).ProcessName"
            ],
            capture_output=True,
            text=True,
            timeout=3,
        )
        parent_name = (result.stdout or '').strip().lower()
        return parent_name == 'explorer'
    except Exception:
        return False


def pause_if_opened_from_explorer():
    """Evita que a janela feche instantaneamente apos duplo clique."""
    if not launched_from_windows_explorer():
        return

    try:
        print()
        input("Pressione Enter para fechar...")
    except EOFError:
        pass

class OptimizedPersistentDownloader:
    def __init__(self):
        self.tools_dir = os.path.dirname(os.path.abspath(__file__))
        self.project_dir = os.path.dirname(self.tools_dir)
        self.csv_file = os.path.join(self.project_dir, 'data', 'products.csv')
        self.json_file = os.path.join(self.project_dir, 'data', 'products.json')
        self.google_feed_file = os.path.join(self.project_dir, 'data', 'google_merchant_feed.csv')
        self.image_folder = os.path.join(self.project_dir, 'images', 'products', 'thumbnail')
        self.ignore_file = os.path.join(self.tools_dir, 'image_download_ignore.txt')
        self._signature_cache = {}
        self.strict_sites_only = False

        os.makedirs(self.image_folder, exist_ok=True)
        
        # Headers realistas
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
        })

    def slugify_filename(self, value):
        """Converte texto em um nome de arquivo previsivel."""
        text = unicodedata.normalize('NFKD', str(value or '')).encode('ascii', 'ignore').decode('ascii')
        text = re.sub(r'[^a-zA-Z0-9]+', '-', text.lower()).strip('-')
        text = re.sub(r'-{2,}', '-', text)
        return text or 'produto'

    def build_product_image_filename(self, product):
        """Gera um nome proprio quando o produto ainda usa placeholder."""
        base_name = str(product.get('nome') or product.get('descricao') or product.get('codigo') or 'produto').strip()
        filename = self.slugify_filename(base_name)
        return f"{filename}.webp"

    def resolve_output_filename(self, product):
        """Define o arquivo final da imagem evitando sobrescrever placeholder."""
        current_name = str(product.get('imagem') or '').strip()
        if not current_name or current_name.lower() in {'placeholder.webp', 'placeholder.png'}:
            return self.build_product_image_filename(product)
        if not current_name.lower().endswith('.webp'):
            return f"{current_name}.webp"
        return current_name

    def load_ignored_entries(self):
        """Carrega codigos ou nomes de imagem que nao devem ser rebaixados."""
        ignored = set()
        if not os.path.exists(self.ignore_file):
            return ignored

        try:
            with open(self.ignore_file, 'r', encoding='utf-8') as ignore_file:
                for raw_line in ignore_file:
                    line = raw_line.strip()
                    if not line or line.startswith('#'):
                        continue
                    ignored.add(line.lower())
        except Exception as e:
            print(f"Aviso: nao foi possivel ler a lista de bloqueio: {e}")

        return ignored

    def is_ignored_product(self, product, ignored_entries):
        """Verifica se o produto foi marcado para nunca baixar imagem automaticamente."""
        if not ignored_entries:
            return False

        code = str(product.get('codigo') or '').strip().lower()
        image_name = str(product.get('imagem') or '').strip().lower()
        name = str(product.get('nome') or '').strip().lower()
        return code in ignored_entries or image_name in ignored_entries or name in ignored_entries

    def update_product_image_references(self, product, filename):
        """Atualiza os arquivos de catalogo com a imagem nova do produto."""
        code = str(product.get('codigo') or '').strip()
        if not code or not filename:
            return

        csv_changed = False
        with open(self.csv_file, 'r', encoding='utf-8', newline='') as csv_file:
            csv_rows = list(csv.reader(csv_file, delimiter=';'))

        for row in csv_rows[1:]:
            if row and row[0].strip() == code and len(row) >= 9 and row[8] != filename:
                row[8] = filename
                csv_changed = True

        if csv_changed:
            with open(self.csv_file, 'w', encoding='utf-8', newline='') as csv_file:
                writer = csv.writer(csv_file, delimiter=';')
                writer.writerows(csv_rows)

        json_changed = False
        with open(self.json_file, 'r', encoding='utf-8') as json_file:
            json_data = json.load(json_file)

        for item in json_data:
            if str(item.get('codigo', '')).strip() == code and item.get('imagem') != filename:
                item['imagem'] = filename
                json_changed = True

        if json_changed:
            with open(self.json_file, 'w', encoding='utf-8') as json_file:
                json.dump(json_data, json_file, ensure_ascii=False, indent=2)

        feed_changed = False
        with open(self.google_feed_file, 'r', encoding='utf-8', newline='') as feed_file:
            feed_rows = list(csv.reader(feed_file))

        image_url = f"https://www.primosinformatica.com.br/images/products/thumbnail/{filename}"
        for row in feed_rows[1:]:
            if row and row[0].strip() == code and len(row) >= 8 and row[7] != image_url:
                row[7] = image_url
                feed_changed = True

        if feed_changed:
            with open(self.google_feed_file, 'w', encoding='utf-8', newline='') as feed_file:
                writer = csv.writer(feed_file)
                writer.writerows(feed_rows)

    def encode_query_component(self, value):
        """Codifica consultas preservando modelos com /, + e caracteres especiais."""
        return quote(str(value or '').strip(), safe='')

    def normalize_text(self, value):
        """Normaliza texto para comparacoes mais confiaveis."""
        text = html.unescape(str(value or ''))
        text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
        text = text.lower()
        text = re.sub(r'[^a-z0-9/+\-.]+', ' ', text)
        return re.sub(r'\s+', ' ', text).strip()

    def split_normalized_tokens(self, value):
        """Quebra texto normalizado em tokens uteis."""
        normalized = self.normalize_text(value)
        return [token for token in normalized.split() if token]

    def unique_preserve_order(self, tokens):
        """Remove duplicados preservando a ordem."""
        seen = set()
        result = []
        for token in tokens:
            if token in seen:
                continue
            seen.add(token)
            result.append(token)
        return result

    def build_product_signature(self, product):
        """Extrai marca, modelos e tokens importantes para validar resultados."""
        if isinstance(product, str):
            product = {'nome': product}

        cache_key = (
            str(product.get('nome', '')).strip(),
            str(product.get('marca', '')).strip(),
            str(product.get('categoria', '')).strip(),
        )
        if cache_key in self._signature_cache:
            return self._signature_cache[cache_key]

        stopwords = {
            'de', 'da', 'do', 'das', 'dos', 'e', 'com', 'para', 'por', 'sem',
            'preto', 'preta', 'branco', 'branca', 'azul', 'vermelho', 'vermelha',
            'cinza', 'grafite', 'wireless', 'bluetooth', 'bivolt', 'real',
            'universal', 'grande', 'pequeno', 'pequena'
        }
        family_tokens_whitelist = {
            'kcas', 'vx', 'rx', 'rtx', 'gtx', 'ddr3', 'ddr4', 'ddr5', 'ows',
            'tws', 'dps', 'atx', 'hdmi', 'usb', 'usb-c', 'microusb', 'type-c'
        }
        generic_brand_tokens = {'generico', 'generic', 'oem'}

        name = str(product.get('nome', '')).strip()
        brand = str(product.get('marca', '')).strip()
        category = str(product.get('categoria', '')).strip()

        name_tokens = []
        strict_model_tokens = []
        family_tokens = []
        spec_tokens = []

        for token in self.split_normalized_tokens(name):
            token = token.strip('.')
            core = token.strip('/+-')
            if not core or core in stopwords:
                continue

            name_tokens.append(token)

            has_digit = any(char.isdigit() for char in core)
            has_alpha = any(char.isalpha() for char in core)
            has_separator = any(char in token for char in ('/', '-', '+'))

            if (has_digit and has_alpha) or has_separator:
                strict_model_tokens.append(token)
            elif token in family_tokens_whitelist:
                family_tokens.append(token)
            elif has_digit:
                spec_tokens.append(token)

        brand_tokens = [
            token for token in self.split_normalized_tokens(brand)
            if token not in generic_brand_tokens and len(token) >= 2
        ]

        keyword_tokens = [
            token for token in name_tokens
            if token not in brand_tokens and len(token) >= 2
        ]

        signature = {
            'normalized_name': self.normalize_text(name),
            'normalized_brand': self.normalize_text(brand),
            'normalized_category': self.normalize_text(category),
            'brand_tokens': self.unique_preserve_order(brand_tokens),
            'keyword_tokens': self.unique_preserve_order(keyword_tokens),
            'strict_model_tokens': self.unique_preserve_order(strict_model_tokens),
            'family_tokens': self.unique_preserve_order(family_tokens),
            'spec_tokens': self.unique_preserve_order(spec_tokens),
        }
        self._signature_cache[cache_key] = signature
        return signature

    def candidate_text_score(self, product, *parts):
        """Pontua um candidato com foco em marca e modelo."""
        signature = self.build_product_signature(product)
        combined_text = " ".join(str(part or '') for part in parts)
        normalized_text = self.normalize_text(combined_text)
        tokens_in_text = set(self.split_normalized_tokens(normalized_text))

        brand_matches = [
            token for token in signature['brand_tokens']
            if token in tokens_in_text or token in normalized_text
        ]
        strict_model_matches = [
            token for token in signature['strict_model_tokens']
            if token in normalized_text
        ]
        family_matches = [
            token for token in signature['family_tokens']
            if token in normalized_text
        ]
        spec_matches = [
            token for token in signature['spec_tokens']
            if token in normalized_text
        ]
        keyword_matches = [
            token for token in signature['keyword_tokens']
            if token in normalized_text
        ]

        score = 0.0
        if signature['brand_tokens']:
            score += 0.40 * (len(brand_matches) / len(signature['brand_tokens']))
        if signature['strict_model_tokens']:
            score += 0.35 * (len(strict_model_matches) / len(signature['strict_model_tokens']))
        if signature['family_tokens']:
            score += 0.10 * (len(family_matches) / len(signature['family_tokens']))
        if signature['spec_tokens']:
            score += 0.05 * min(1.0, len(spec_matches) / max(1, min(len(signature['spec_tokens']), 2)))
        if signature['keyword_tokens']:
            score += 0.20 * min(1.0, len(keyword_matches) / max(1, min(len(signature['keyword_tokens']), 5)))
        if signature['normalized_name'] and signature['normalized_name'] in normalized_text:
            score += 0.20

        conflicting_brand_tokens = {
            'philips', 'havit', 'jbl', 'fortrek', 'aerocool', 'kingston',
            'hayom', 'kimaster', 'peining', 'kaidi', 'kapbom', 'pioneiro',
            'multilaser', 'unipower', 'segato', 'troyatools', 'startools',
            'pratic', 'pratik', 'migol', 'mcm', 'feasso', 'corsair', 'pcyes',
            'asus', 'galax', 'logitech', 'intel', 'amd', 'gigabyte', 'brazil',
            'brazilpc', 'tplink', 'mercusys', 'ubiquiti', 'xcell', 'x-cell', 'lity'
        }
        expected_brand_set = set(signature['brand_tokens'])
        conflicting_brands = sorted(
            token for token in conflicting_brand_tokens
            if token in tokens_in_text and token not in expected_brand_set
        )
        if conflicting_brands:
            score -= 0.45

        min_keyword_matches = 2 if len(signature['keyword_tokens']) >= 4 else 1
        accepted = True
        reasons = []

        if signature['brand_tokens'] and not brand_matches:
            accepted = False
            reasons.append('marca ausente')
        if signature['strict_model_tokens'] and not strict_model_matches:
            accepted = False
            reasons.append('modelo ausente')
        if len(keyword_matches) < min_keyword_matches:
            accepted = False
            reasons.append('poucos termos do produto')
        if conflicting_brands:
            accepted = False
            reasons.append(f"marca conflitante: {', '.join(conflicting_brands[:2])}")

        minimum_score = 0.52
        if not signature['brand_tokens'] and signature['strict_model_tokens']:
            minimum_score = 0.42
        elif not signature['brand_tokens'] and not signature['strict_model_tokens']:
            minimum_score = 0.35
        elif signature['brand_tokens'] and not signature['strict_model_tokens']:
            minimum_score = 0.46

        return {
            'score': round(score, 4),
            'accepted': accepted and score >= minimum_score,
            'minimum_score': minimum_score,
            'normalized_text': normalized_text,
            'brand_matches': brand_matches,
            'strict_model_matches': strict_model_matches,
            'family_matches': family_matches,
            'spec_matches': spec_matches,
            'keyword_matches': keyword_matches,
            'reasons': reasons,
            'conflicting_brands': conflicting_brands,
        }
    
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
            alpha_channel = None
            if img.mode in ('RGBA', 'LA', 'P'):
                rgba_img = img.convert('RGBA')
                alpha_channel = rgba_img.getchannel('A')
                rgb_img = Image.new('RGB', rgba_img.size, (255, 255, 255))
                rgb_img.paste(rgba_img.convert('RGB'), mask=alpha_channel)
                img = rgb_img
            elif img.mode != 'RGB':
                img = img.convert('RGB')

            # Aumentar contraste
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.1)
            
            # Aumentar nitidez
            enhancer = ImageEnhance.Sharpness(img)
            img = enhancer.enhance(1.1)
            
            # Aumentar saturação levemente
            enhancer = ImageEnhance.Color(img)
            img = enhancer.enhance(1.05)
            
            if alpha_channel is not None:
                rgba_result = img.convert('RGBA')
                rgba_result.putalpha(alpha_channel)
                return rgba_result

            return img
            
        except Exception as e:
            print(f"    Erro ao melhorar imagem: {e}")
            return img

    def has_watermark_or_logo(self, img):
        """Heuristica leve para detectar logos ou marcas d'agua dominantes."""
        try:
            grayscale = np.array(img.convert('L'))
            edge_h = max(1, grayscale.shape[0] // 12)
            edge_w = max(1, grayscale.shape[1] // 12)
            edge_pixels = np.concatenate([
                grayscale[:edge_h, :].flatten(),
                grayscale[-edge_h:, :].flatten(),
                grayscale[:, :edge_w].flatten(),
                grayscale[:, -edge_w:].flatten(),
            ])

            if edge_pixels.size == 0:
                return False

            bright_ratio = np.mean(edge_pixels > 245)
            dark_ratio = np.mean(edge_pixels < 10)
            return bright_ratio > 0.92 or dark_ratio > 0.92
        except Exception:
            return False

    def is_cropped_image(self, img):
        """Detecta cortes muito agressivos nas bordas."""
        try:
            rgb = np.array(img.convert('RGB'))

            def border_is_uniform(border):
                return np.std(border) < 8

            uniform_borders = sum([
                border_is_uniform(rgb[0, :, :]),
                border_is_uniform(rgb[-1, :, :]),
                border_is_uniform(rgb[:, 0, :]),
                border_is_uniform(rgb[:, -1, :]),
            ])
            return uniform_borders >= 3 and min(img.size) < 220
        except Exception:
            return False

    def has_text_overlay(self, img):
        """Heuristica simples para rejeitar imagens com muito texto sobreposto."""
        try:
            grayscale = np.array(img.convert('L'))
            if grayscale.size == 0:
                return False

            contrast_mask = (grayscale < 40) | (grayscale > 245)
            contrast_ratio = np.mean(contrast_mask)
            return 0.18 < contrast_ratio < 0.45 and min(img.size) < 500
        except Exception:
            return False

    def is_probable_image_url(self, url):
        """Evita tentar baixar paginas HTML como se fossem imagens."""
        try:
            parsed = urlparse(url)
            path = parsed.path.lower()

            if parsed.scheme not in ('http', 'https'):
                return False

            if re.search(r"\.(jpg|jpeg|png|webp|gif|bmp|avif)$", path):
                return True

            image_hosts = (
                'mlstatic.com',
                'kabum.com.br',
                'images.kabum.com.br',
                'http2.kabum.com.br',
                'img.terabyteshop.com.br',
                'terabyteshop.com.br',
                'media.pichau.com.br',
                'pichau.com.br',
                'pcyes.com.br',
                'images.tcdn.com.br',
                'cdn.awsli.com.br',
                'googleusercontent.com',
                'gstatic.com',
                'bing.com',
                'bing.net',
                'yimg.com',
                'alicdn.com',
                'ae01.alicdn.com',
            )
            return any(host in parsed.netloc.lower() for host in image_hosts) and '/produto/' not in path
        except Exception:
            return False
    
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
            transparent_ratio_before = self.get_transparent_ratio(img)
            
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
    
    def analyze_background(self, img):
        """Analisa o fundo da imagem e retorna informacoes mais detalhadas."""
        try:
            alpha_ratio = 0.0
            if 'A' in img.getbands():
                alpha_img = img.convert('RGBA')
                alpha_channel = np.array(alpha_img)[:, :, 3]
                alpha_ratio = float(np.mean(alpha_channel < 245))
                if alpha_ratio > 0.08:
                    return {
                        'type': 'transparent',
                        'color': (255, 255, 255),
                        'confidence': min(100.0, alpha_ratio * 100.0),
                        'alpha_ratio': alpha_ratio,
                    }

            if img.mode != 'RGB':
                img = img.convert('RGB')

            small_img = img.copy()
            if max(small_img.size) > 200:
                ratio = 200 / max(small_img.size)
                new_size = (int(small_img.size[0] * ratio), int(small_img.size[1] * ratio))
                small_img = small_img.resize(new_size, Image.Resampling.LANCZOS)

            img_array = np.array(small_img)
            height, width = img_array.shape[:2]
            border_h = max(2, int(height * 0.08))
            border_w = max(2, int(width * 0.08))

            border_pixels = np.concatenate([
                img_array[:border_h, :, :].reshape(-1, 3),
                img_array[-border_h:, :, :].reshape(-1, 3),
                img_array[:, :border_w, :].reshape(-1, 3),
                img_array[:, -border_w:, :].reshape(-1, 3),
            ], axis=0)

            avg_color = np.mean(border_pixels, axis=0)
            r, g, b = avg_color
            border_brightness = np.mean(border_pixels, axis=1)
            dark_ratio = float(np.mean(border_brightness < 40))
            very_dark_ratio = float(np.mean(border_brightness < 22))
            bright_ratio = float(np.mean(border_brightness > 235))
            border_variation = float(np.std(border_pixels))

            center_y1 = max(0, height // 4)
            center_y2 = min(height, height - center_y1)
            center_x1 = max(0, width // 4)
            center_x2 = min(width, width - center_x1)
            center_pixels = img_array[center_y1:center_y2, center_x1:center_x2, :].reshape(-1, 3)
            if center_pixels.size:
                center_brightness = float(np.mean(np.mean(center_pixels, axis=1)))
            else:
                center_brightness = float(np.mean(border_brightness))

            if (
                (dark_ratio > 0.72 and np.mean(avg_color) < 48 and border_variation < 38) or
                (very_dark_ratio > 0.55 and center_brightness - np.mean(border_brightness) > 30)
            ):
                confidence = min(100.0, 55.0 + dark_ratio * 30.0 + very_dark_ratio * 15.0)
                return {
                    'type': 'black',
                    'color': (int(r), int(g), int(b)),
                    'confidence': confidence,
                    'dark_ratio': dark_ratio,
                    'bright_ratio': bright_ratio,
                    'border_variation': border_variation,
                    'center_brightness': center_brightness,
                }

            if bright_ratio > 0.68 and np.mean(avg_color) > 220:
                return {
                    'type': 'white',
                    'color': (int(r), int(g), int(b)),
                    'confidence': min(100.0, 55.0 + bright_ratio * 45.0),
                    'dark_ratio': dark_ratio,
                    'bright_ratio': bright_ratio,
                    'border_variation': border_variation,
                    'center_brightness': center_brightness,
                }

            return {
                'type': 'colored',
                'color': (int(r), int(g), int(b)),
                'confidence': 50,
                'dark_ratio': dark_ratio,
                'bright_ratio': bright_ratio,
                'border_variation': border_variation,
                'center_brightness': center_brightness,
            }

        except Exception as e:
            print(f"    Erro ao analisar fundo: {e}")
            return {
                'type': 'unknown',
                'color': (128, 128, 128),
                'confidence': 0
            }

    def remove_white_background(self, img):
        """Remove fundo branco conectado as bordas, preservando partes brancas internas."""
        try:
            rgba_img = img.convert('RGBA')
            img_array = np.array(rgba_img)
            rgb = img_array[:, :, :3].astype(np.int16)
            alpha = img_array[:, :, 3]
            height, width = alpha.shape

            if height < 2 or width < 2:
                return rgba_img

            border_h = max(2, int(height * 0.08))
            border_w = max(2, int(width * 0.08))
            border_pixels = np.concatenate([
                img_array[:border_h, :, :].reshape(-1, 4),
                img_array[-border_h:, :, :].reshape(-1, 4),
                img_array[:, :border_w, :].reshape(-1, 4),
                img_array[:, -border_w:, :].reshape(-1, 4),
            ], axis=0)

            opaque_border = border_pixels[border_pixels[:, 3] > 200][:, :3]
            if opaque_border.size == 0:
                return rgba_img

            border_brightness = np.mean(opaque_border, axis=1)
            bright_border = opaque_border[border_brightness > 220]
            if bright_border.size == 0:
                return rgba_img

            base_color = np.mean(bright_border, axis=0)
            avg_base = float(np.mean(base_color))
            threshold = max(220.0, min(248.0, avg_base - 5.0))
            distance_limit = 42.0 if avg_base > 240 else 34.0
            saturation_limit = 36.0 if avg_base > 240 else 30.0

            brightness = np.mean(rgb, axis=2)
            max_delta = np.max(np.abs(rgb - base_color), axis=2)
            saturation = np.max(rgb, axis=2) - np.min(rgb, axis=2)

            candidate_mask = (
                (alpha > 0) &
                (brightness >= threshold) &
                (max_delta <= distance_limit) &
                (saturation <= saturation_limit)
            )

            if not np.any(candidate_mask):
                return rgba_img

            removable_mask = np.zeros((height, width), dtype=bool)
            visited = np.zeros((height, width), dtype=bool)
            queue = deque()

            def push_seed(y, x):
                if candidate_mask[y, x] and not visited[y, x]:
                    visited[y, x] = True
                    queue.append((y, x))

            for x in range(width):
                push_seed(0, x)
                push_seed(height - 1, x)
            for y in range(height):
                push_seed(y, 0)
                push_seed(y, width - 1)

            while queue:
                y, x = queue.popleft()
                removable_mask[y, x] = True
                for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                    if 0 <= ny < height and 0 <= nx < width and not visited[ny, nx] and candidate_mask[ny, nx]:
                        visited[ny, nx] = True
                        queue.append((ny, nx))

            removed_ratio = float(np.mean(removable_mask))
            if removed_ratio < 0.03:
                return rgba_img

            feather_mask = (
                (alpha > 0) &
                (brightness >= max(205.0, threshold - 10.0)) &
                (max_delta <= distance_limit + 10.0) &
                (saturation <= saturation_limit + 8.0)
            )

            expanded_feather = np.zeros((height, width), dtype=bool)
            for y, x in zip(*np.where(removable_mask)):
                for ny in range(max(0, y - 1), min(height, y + 2)):
                    for nx in range(max(0, x - 1), min(width, x + 2)):
                        if feather_mask[ny, nx] and not removable_mask[ny, nx]:
                            expanded_feather[ny, nx] = True

            img_array[removable_mask, 3] = 0
            img_array[expanded_feather, 3] = np.minimum(img_array[expanded_feather, 3], 110)
            return Image.fromarray(img_array, 'RGBA')

        except Exception as e:
            print(f"    Erro na remocao de fundo branco: {e}")
            return img

    def has_watermark_or_logo(self, img):
        """Heuristica leve para detectar logos ou marcas d'agua dominantes."""
        try:
            grayscale = np.array(img.convert('L'))
            edge_h = max(1, grayscale.shape[0] // 12)
            edge_w = max(1, grayscale.shape[1] // 12)
            edge_pixels = np.concatenate([
                grayscale[:edge_h, :].flatten(),
                grayscale[-edge_h:, :].flatten(),
                grayscale[:, :edge_w].flatten(),
                grayscale[:, -edge_w:].flatten(),
            ])

            if edge_pixels.size == 0:
                return False

            bright_ratio = np.mean(edge_pixels > 245)
            edge_std = np.std(edge_pixels)
            return bright_ratio > 0.94 and edge_std < 12
        except Exception:
            return False

    def is_suitable_product_image(self, img, url=""):
        """Verifica se a imagem e adequada para produto."""
        try:
            width, height = img.size
            if width < 200 or height < 200:
                return False, "Imagem muito pequena"

            ratio = width / height if height > 0 else 0
            if 0.8 < ratio < 1.2 and max(width, height) < 300:
                return False, "Imagem muito quadrada e pequena (possivel icone)"
            if ratio > 2.5:
                return False, f"Imagem muito larga (proporcao {ratio:.2f}:1)"
            if ratio < 0.4:
                return False, f"Imagem muito alta (proporcao {ratio:.2f}:1)"
            if max(width, height) > 1200:
                return False, f"Imagem muito grande ({width}x{height})"

            area = width * height
            if area < 40000:
                return False, f"Area muito pequena ({area} pixels)"

            bg_analysis = self.analyze_background(img)
            if bg_analysis['type'] == 'black' and bg_analysis['confidence'] > 60:
                print(f"    Fundo preto detectado (confianca: {bg_analysis['confidence']:.1f}%) - tentando corrigir")

            avg_brightness = float(np.mean(np.array(img.convert('L'))))
            if avg_brightness < 38 and bg_analysis['type'] != 'black':
                return False, "Imagem muito escura"
            if bg_analysis['type'] == 'black' and avg_brightness < 25:
                return False, "Imagem muito escura mesmo com deteccao de fundo preto"

            if self.has_watermark_or_logo(img):
                return False, "Marca d'agua ou logomarca detectada"
            if self.is_cropped_image(img):
                return False, "Imagem parece cortada"
            if self.has_text_overlay(img):
                return False, "Texto sobreposto detectado"

            return True, "Imagem adequada"

        except Exception as e:
            print(f"    Erro ao verificar adequacao: {e}")
            return True, "Verificacao falhou"

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
    
    def get_transparent_ratio(self, img):
        """Calcula quanto da imagem usa transparencia parcial ou total."""
        try:
            rgba = np.array(img.convert('RGBA'))
            alpha = rgba[:, :, 3]
            return float(np.mean(alpha < 250))
        except Exception:
            return 0.0

    def has_bright_opaque_border(self, img, bright_threshold=232.0, min_ratio=0.55):
        """Detecta bordas opacas claras, tipicas de fundo branco residual."""
        try:
            rgba = np.array(img.convert('RGBA'))
            height, width = rgba.shape[:2]
            if height < 4 or width < 4:
                return False

            border_h = max(2, min(10, height // 12))
            border_w = max(2, min(10, width // 12))
            border = np.concatenate([
                rgba[:border_h, :, :].reshape(-1, 4),
                rgba[-border_h:, :, :].reshape(-1, 4),
                rgba[:, :border_w, :].reshape(-1, 4),
                rgba[:, -border_w:, :].reshape(-1, 4),
            ], axis=0)

            opaque_border = border[border[:, 3] > 245][:, :3]
            if opaque_border.size == 0:
                return False

            bright_ratio = float(np.mean(np.mean(opaque_border, axis=1) > bright_threshold))
            return bright_ratio >= min_ratio
        except Exception:
            return False

    def process_image_background(self, img):
        """Processa o fundo da imagem conforme necessário"""
        try:
            # Analisar fundo
            bg_analysis = self.analyze_background(img)
            
            print(f"    📊 Análise de fundo: {bg_analysis['type']} (confiança: {bg_analysis['confidence']:.1f}%)")
            transparent_ratio_before = self.get_transparent_ratio(img)
            
            # Se for fundo preto, tentar remover
            if bg_analysis['type'] == 'black':
                print(f"    🔄 Removendo fundo preto...")
                img = self.remove_black_background(img)
                print(f"    ✅ Fundo preto removido")
            elif (
                bg_analysis['type'] == 'white' and (
                    bg_analysis['confidence'] >= 60 or
                    bg_analysis.get('bright_ratio', 0) >= 0.78
                )
            ):
                print(f"    🔄 Removendo fundo branco...")
                img = self.remove_white_background(img)
                processed_bg = self.analyze_background(img)
                print(f"    ✅ Fundo branco processado: {processed_bg['type']} ({processed_bg['confidence']:.1f}%)")
            elif self.has_bright_opaque_border(img):
                print("    Ajustando borda branca residual...")
                candidate_img = self.remove_white_background(img)
                transparent_ratio_after = self.get_transparent_ratio(candidate_img)
                if transparent_ratio_after > transparent_ratio_before + 0.03:
                    img = candidate_img
                    print(f"    Borda branca reduzida (alpha {transparent_ratio_before:.3f} -> {transparent_ratio_after:.3f})")
                else:
                    print("    Sem ganho relevante na remocao da borda branca")
            
            # Redimensionar se necessário
            img = self.resize_product_image(img)
            
            # Melhorar qualidade da imagem
            img = self.enhance_product_image(img)
            
            return img
            
        except Exception as e:
            print(f"    Erro ao processar fundo: {e}")
            return img
    
    def repair_existing_white_backgrounds(self, force_codes=None):
        """Reprocessa imagens ja salvas que ainda parecem ter fundo branco."""
        force_codes = set(str(code).strip() for code in (force_codes or []) if str(code).strip())
        repaired = 0
        inspected = 0

        if not os.path.exists(self.csv_file):
            print("ERRO: CSV nao encontrado para reparo das imagens.")
            return repaired

        try:
            with open(self.csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f, delimiter=';')

                for row in reader:
                    codigo = str(row.get('codigo') or '').strip()
                    imagem = str(row.get('imagem') or '').strip()
                    if not codigo or not imagem:
                        continue
                    if imagem.lower() == 'placeholder.webp':
                        continue
                    if force_codes and codigo not in force_codes:
                        continue

                    filepath = os.path.join(self.image_folder, imagem)
                    if not os.path.exists(filepath):
                        continue

                    try:
                        inspected += 1
                        img = Image.open(filepath)
                        before_ratio = self.get_transparent_ratio(img)

                        if not self.has_bright_opaque_border(img) and before_ratio > 0.02:
                            continue

                        repaired_img = self.remove_white_background(img)
                        after_ratio = self.get_transparent_ratio(repaired_img)

                        if after_ratio <= before_ratio + 0.05:
                            continue

                        if repaired_img.mode == 'P':
                            repaired_img = repaired_img.convert('RGBA')
                        elif repaired_img.mode == 'LA':
                            repaired_img = repaired_img.convert('RGBA')
                        elif repaired_img.mode not in ('RGB', 'RGBA'):
                            repaired_img = repaired_img.convert('RGB')

                        repaired_img.save(filepath, 'WEBP', quality=88, method=6)
                        repaired += 1
                        print(f"REPARADA: {imagem} (alpha {before_ratio:.3f} -> {after_ratio:.3f})")
                    except Exception as image_error:
                        print(f"Falha ao reparar {imagem}: {image_error}")

            print(f"Reparo concluido: {repaired} imagem(ns) atualizada(s) apos inspecionar {inspected}.")
            return repaired
        except Exception as e:
            print(f"ERRO ao reparar imagens existentes: {e}")
            return repaired

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
    
    def method_1_kabum_priority(self, product):
        """Método 1: Kabum Priority - Busca EXATA e precisa"""
        print("\n" + "="*60)
        print("MÉTODO 1: Kabum Priority (Busca EXATA)")
        print("="*60)
        
        product_name = product['nome'].strip()
        compact_name = self.build_compact_search_query(product_name)
        print(f"  Buscando EXATAMENTE: '{product_name}'")
        
        search_strategies = [
            {
                'name': 'Busca EXATA',
                'urls': [
                    f"https://www.kabum.com.br/busca/{self.encode_query_component(product_name)}",
                    f"https://www.kabum.com.br/busca/{self.encode_query_component(product_name)}?sort=exact"
                ],
                'priority': 1
            },
            {
                'name': 'Busca Compacta',
                'urls': [
                    f"https://www.kabum.com.br/busca/{self.encode_query_component(compact_name)}"
                ],
                'priority': 2
            }
        ]

        exact_match_found = False
        
        for strategy in search_strategies:
            print(f"\n  🎯 {strategy['name']} (Prioridade {strategy['priority']})")
            
            for url in strategy['urls']:
                try:
                    print(f"    🔍 Buscando: {url}")
                    response = self.session.get(url, timeout=15)
                    
                    if response.status_code == 200:
                        html = response.text
                        
                        # Verificar se encontrou o produto exato
                        exact_match_found = self.check_exact_product_match(html, product)
                        
                        if exact_match_found or strategy['priority'] > 1:
                            # Padrões ESPECÍFICOS da Kabum
                            kabum_patterns = [
                                r'"(https://http2\.kabum\.com\.br/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
                                r'"(https://http2\.kabum\.com\.br/produtos/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
                                r'"(https://images\.kabum\.com\.br/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
                                r'data-src="(https://http2\.kabum\.com\.br/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
                                r'src="(https://http2\.kabum\.com\.br/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"'
                            ]
                            
                            for pattern in kabum_patterns:
                                matches = re.findall(pattern, html)
                                
                                # Ordenar por relevância (URLs mais específicas primeiro)
                                matches = self.sort_kabum_urls_by_relevance(matches, product)
                                
                                for i, match in enumerate(matches[:4]):  # Primeiras 4 por padrão
                                    # Limpar URL
                                    clean_url = match.strip('"').replace('\\', '')
                                    
                                    # Verificar se é URL da Kabum genuína
                                    if ('http2.kabum.com.br' in clean_url or 
                                        'images.kabum.com.br' in clean_url):
                                        
                                        # Verificar se a URL corresponde ao produto exato
                                        url_relevance = self.calculate_url_relevance(clean_url, product)
                                        
                                        # Filtros específicos para Kabum
                                        if (len(clean_url) > 50 and 
                                            self.is_probable_image_url(clean_url) and
                                            '/produtos/' in clean_url and  # Apenas URLs de produtos
                                            'placeholder' not in clean_url.lower() and
                                            'logo' not in clean_url.lower() and
                                            'icon' not in clean_url.lower() and
                                            'sprite' not in clean_url.lower() and
                                            url_relevance > 0.3):  # Mínimo de relevância
                                            
                                            print(f"      📸 URL Kabum (relevância {url_relevance:.2f}): {clean_url[:80]}...")
                                            
                                            if self.download_image_from_url(clean_url, product):
                                                print(f"      ✅ SUCESSO com Kabum - Produto EXATO!")
                                                return True
                        
                        print(f"      ❌ Nenhuma imagem válida encontrada")
                    else:
                        print(f"      HTTP {response.status_code} na Kabum")
                    
                    time.sleep(0.2)
                    
                except Exception as e:
                    print(f"      Erro na busca Kabum: {e}")
                    continue
            
            # Se encontrou correspondência exata, não continua para próximas estratégias
            if exact_match_found:
                break
        
        print("  ❌ Nenhuma imagem encontrada na Kabum via busca direta")
        print("  Tentando Kabum via Bing Images...")
        return self.search_bing_site_images(
            product,
            "Kabum via Bing",
            "kabum.com.br",
            allowed_hosts=("images.kabum.com.br", "http2.kabum.com.br")
        )
    
    def check_exact_product_match(self, html, product_name):
        """Verifica se o HTML contém correspondência exata do produto"""
        try:
            # Converter para minúsculas para comparação
            html_lower = html.lower()
            product_lower = product_name.lower()
            
            # Procurar pelo nome exato do produto no HTML
            exact_patterns = [
                f'"{product_lower}"',  # Entre aspas
                f'>{product_lower}<',  # Em tags
                f'product-name.*{product_lower}',  # Em classes de produto
                f'title.*{product_lower}',  # Em títulos
                f'data-name.*{product_lower}',  # Em atributos de dados
            ]
            
            for pattern in exact_patterns:
                if pattern in html_lower:
                    print(f"      ✅ Correspondência exata encontrada: {pattern}")
                    return True
            
            # Verificar correspondência parcial alta (pelo menos 80% do nome)
            words = product_lower.split()
            if len(words) >= 2:
                # Para produtos com múltiplas palavras
                word_matches = sum(1 for word in words if word in html_lower)
                if word_matches >= len(words) * 0.8:
                    print(f"      ⚠️ Correspondência parcial alta: {word_matches}/{len(words)} palavras")
                    return True
            
            return False
            
        except Exception as e:
            print(f"      Erro ao verificar correspondência: {e}")
            return False
    
    def sort_kabum_urls_by_relevance(self, urls, product_name):
        """Ordena URLs da Kabum por relevância com o produto"""
        try:
            def calculate_relevance(url):
                url_lower = url.lower()
                product_lower = product_name.lower()
                
                relevance = 0.0
                
                # Palavras do produto
                product_words = product_lower.split()
                
                # Verificar cada palavra do produto na URL
                for word in product_words:
                    if word in url_lower:
                        relevance += 1.0
                
                # Bônus para URLs mais específicas
                if '/produtos/' in url_lower:
                    relevance += 0.5
                
                # Penalidade para URLs genéricas
                if any(generic in url_lower for generic in ['generic', 'default', 'placeholder']):
                    relevance -= 0.3
                
                return relevance
            
            # Ordenar URLs por relevância (maior primeiro)
            return sorted(urls, key=calculate_relevance, reverse=True)
            
        except Exception as e:
            print(f"      Erro ao ordenar URLs: {e}")
            return urls
    
    def calculate_url_relevance(self, url, product_name):
        """Calcula relevância de uma URL específica para o produto"""
        try:
            url_lower = url.lower()
            product_lower = product_name.lower()
            
            relevance = 0.0
            product_words = product_lower.split()
            
            # Contar palavras do produto na URL
            matched_words = sum(1 for word in product_words if word in url_lower)
            
            if len(product_words) > 0:
                relevance = matched_words / len(product_words)
            
            # Bônus para correspondências exatas
            if product_lower in url_lower:
                relevance += 0.3
            
            # Bônus para URLs de produtos
            if '/produtos/' in url_lower:
                relevance += 0.2
            
            return min(relevance, 1.0)  # Máximo 1.0
            
        except Exception as e:
            print(f"      Erro ao calcular relevância: {e}")
            return 0.0

    def build_compact_search_query(self, product_name, max_tokens=6):
        """Reduz o nome do produto para uma busca mais rápida e objetiva."""
        normalized = unicodedata.normalize('NFKD', product_name).encode('ascii', 'ignore').decode('ascii')
        normalized = re.sub(r'[^a-zA-Z0-9]+', ' ', normalized).strip()
        stopwords = {'de', 'da', 'do', 'das', 'dos', 'e', 'com', 'para', 'por'}
        seen = set()
        tokens = []

        for token in normalized.split():
            key = token.lower()
            if key in stopwords or key in seen:
                continue
            seen.add(key)
            tokens.append(token)
            if len(tokens) >= max_tokens:
                break

        return " ".join(tokens) if tokens else product_name

    def build_generic_fallback_queries(self, product, max_queries=7):
        """Monta buscas genericas com foco em modelo, familia e nome compacto."""
        name = str(product.get('nome') or '').strip()
        compact_name = self.build_compact_search_query(name)
        signature = self.build_product_signature(product)

        brand = " ".join(signature['brand_tokens'][:2]).strip()
        model = " ".join(signature['strict_model_tokens'][:2]).strip()
        family = " ".join(signature['family_tokens'][:2]).strip()
        specs = " ".join(signature['spec_tokens'][:2]).strip()
        keywords = " ".join(signature['keyword_tokens'][:3]).strip()
        model_parts = []
        for token in signature['strict_model_tokens']:
            for part in re.split(r'[-+/._\s]+', token):
                part = part.strip()
                if not part:
                    continue
                if len(part) >= 3 or any(char.isdigit() for char in part):
                    model_parts.append(part)
        split_model = " ".join(self.unique_preserve_order(model_parts)[:3]).strip()
        queries = []

        def add(query):
            query = re.sub(r'\s+', ' ', str(query or '')).strip()
            if query and query not in queries:
                queries.append(query)

        add(name)
        if keywords and model:
            add(f"{keywords} {model}")
        if keywords and split_model:
            add(f"{keywords} {split_model}")
        if brand and model:
            add(f"{brand} {model}")
            add(f"{brand} {model} produto")
        if brand and split_model:
            add(f"{brand} {split_model}")
        if keywords and brand and model:
            add(f"{keywords} {brand} {model}")
        if keywords and split_model:
            add(f"{keywords} {split_model} produto")
        if brand and family:
            add(f"{brand} {family} {specs}".strip())
        if compact_name:
            add(f"{compact_name} produto hardware")
            add(f"{compact_name} foto produto")
            add(f"{compact_name} kabum terabyte pichau pcyes")

        return queries[:max_queries]

    def get_product_tokens(self, product_name, max_tokens=8):
        """Quebra o nome em tokens úteis para validar relevância."""
        compact_name = self.build_compact_search_query(product_name, max_tokens=max_tokens)
        tokens = []
        for token in compact_name.lower().split():
            if len(token) >= 3 or token in {'rx', 'rtx', 'gtx'} or any(char.isdigit() for char in token):
                tokens.append(token)
        return tokens

    def url_matches_product_tokens(self, url, product_name):
        """Exige um mínimo de palavras-chave do produto na URL da imagem."""
        tokens = self.get_product_tokens(product_name)
        url_lower = url.lower()
        matches = sum(1 for token in tokens if token in url_lower)
        required_matches = 2 if len(tokens) >= 3 else 1
        return matches >= required_matches

    def extract_bing_image_urls(self, html_content, allowed_hosts=None):
        """Extrai URLs reais de imagem da busca do Bing Images."""
        urls = []
        seen = set()
        patterns = [
            r'murl&quot;:&quot;([^&]+)&quot;',
            r'"murl":"([^"]+)"',
        ]

        for pattern in patterns:
            for match in re.findall(pattern, html_content):
                clean_url = html.unescape(match).replace('\\/', '/').strip()

                if not self.is_probable_image_url(clean_url):
                    continue

                host = urlparse(clean_url).netloc.lower()
                if allowed_hosts and not any(allowed_host in host for allowed_host in allowed_hosts):
                    continue

                if clean_url not in seen:
                    seen.add(clean_url)
                    urls.append(clean_url)

        return urls

    def search_bing_site_images(self, product, site_name, domain, allowed_hosts=None):
        """Busca imagens no Bing limitadas a um domínio específico."""
        print("\n" + "="*60)
        print(f"MÉTODO: {site_name} Priority")
        print("="*60)

        product_name = product['nome'].strip()
        compact_name = self.build_compact_search_query(product_name)
        search_terms = [
            f'site:{domain} "{product_name}"',
            f'site:{domain} {compact_name}',
        ]

        for term in search_terms:
            try:
                search_url = f"https://www.bing.com/images/search?q={quote(term)}&form=HDRSC3"
                print(f"  Buscando em {site_name}: {term}")
                response = self.session.get(search_url, timeout=8)

                if response.status_code != 200:
                    print(f"    HTTP {response.status_code} em {site_name}")
                    continue

                matches = self.extract_bing_image_urls(response.text, allowed_hosts=allowed_hosts)
                matches = sorted(
                    matches,
                    key=lambda url: self.calculate_url_relevance(url, product_name),
                    reverse=True
                )
                filtered_matches = [
                    url for url in matches
                    if self.url_matches_product_tokens(url, product_name)
                ]
                if filtered_matches:
                    matches = filtered_matches

                if not matches:
                    print(f"    Nenhuma imagem encontrada em {site_name}")
                    continue

                for clean_url in matches[:4]:
                    print(f"    URL: {clean_url[:80]}...")
                    if self.download_image_from_url(clean_url, product):
                        print(f"    ✅ SUCESSO com {site_name}")
                        return True

            except Exception as e:
                print(f"    Erro em {site_name}: {e}")

        return False

    def method_1_kabum_priority(self, product):
        """Metodo 1: prioridade para Kabum com validacao mais rigida."""
        print("\n" + "="*60)
        print("METODO 1: Kabum Priority (Busca EXATA)")
        print("="*60)

        product_name = product['nome'].strip()
        compact_name = self.build_compact_search_query(product_name)
        print(f"  Buscando EXATAMENTE: '{product_name}'")

        search_strategies = [
            {
                'name': 'Busca EXATA',
                'urls': [
                    f"https://www.kabum.com.br/busca/{self.encode_query_component(product_name)}",
                    f"https://www.kabum.com.br/busca/{self.encode_query_component(product_name)}?sort=exact",
                ],
                'priority': 1,
            },
            {
                'name': 'Busca Compacta',
                'urls': [
                    f"https://www.kabum.com.br/busca/{self.encode_query_component(compact_name)}",
                ],
                'priority': 2,
            },
        ]

        for strategy in search_strategies:
            print(f"\n  {strategy['name']} (Prioridade {strategy['priority']})")

            for url in strategy['urls']:
                try:
                    print(f"    Buscando: {url}")
                    response = self.session.get(url, timeout=15)

                    if response.status_code != 200:
                        print(f"      HTTP {response.status_code} na Kabum")
                        continue

                    html_content = response.text
                    exact_match_found = self.check_exact_product_match(html_content, product)
                    if not exact_match_found and strategy['priority'] == 1:
                        print("      Resultado muito generico para esta busca exata")
                        continue

                    product_page_urls = re.findall(
                        r'https://www\.kabum\.com\.br/produto/\d+/[^"\'<>\s]+',
                        html_content,
                    )
                    product_page_urls = self.sort_kabum_urls_by_relevance(
                        self.unique_preserve_order(product_page_urls),
                        product,
                    )
                    closest_kabum_page = None
                    closest_kabum_score = None
                    if product_page_urls:
                        closest_kabum_page = product_page_urls[0]
                        closest_kabum_score = self.candidate_text_score(product, closest_kabum_page)

                    kabum_patterns = [
                        r'"(https://http2\.kabum\.com\.br/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
                        r'"(https://http2\.kabum\.com\.br/produtos/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
                        r'"(https://images\.kabum\.com\.br/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
                        r'data-src="(https://http2\.kabum\.com\.br/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
                        r'src="(https://http2\.kabum\.com\.br/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
                    ]

                    candidate_urls = []
                    for pattern in kabum_patterns:
                        candidate_urls.extend(re.findall(pattern, html_content))

                    candidate_urls = self.sort_kabum_urls_by_relevance(
                        self.unique_preserve_order(candidate_urls),
                        product,
                    )

                    for clean_url in candidate_urls[:6]:
                        clean_url = clean_url.strip('"').replace('\\', '')
                        if (
                            len(clean_url) <= 50 or
                            not self.is_probable_image_url(clean_url) or
                            '/produtos/' not in clean_url or
                            'placeholder' in clean_url.lower() or
                            'logo' in clean_url.lower() or
                            'icon' in clean_url.lower() or
                            'sprite' in clean_url.lower()
                        ):
                            continue

                        url_relevance = self.calculate_url_relevance(clean_url, product)
                        url_score_data = self.candidate_text_score(product, clean_url)
                        url_slug = urlparse(clean_url).path.lower()
                        url_has_named_slug = bool(re.search(r'[a-z]{4,}', url_slug))
                        url_has_blocking_reason = any(
                            reason.startswith('marca ausente') or
                            reason.startswith('modelo ausente') or
                            reason.startswith('marca conflitante')
                            for reason in url_score_data['reasons']
                        )

                        if url_has_named_slug and url_has_blocking_reason:
                            continue
                        if not exact_match_found and url_relevance < 0.18:
                            continue

                        print(f"      URL Kabum (relevancia {url_relevance:.2f}): {clean_url[:80]}...")
                        if self.download_image_from_url(clean_url, product):
                            print("      SUCESSO com Kabum - Produto validado!")
                            return True

                    if closest_kabum_page and closest_kabum_score:
                        blocking_reasons = [
                            reason for reason in closest_kabum_score['reasons']
                            if reason.startswith('marca ausente') or
                            reason.startswith('modelo ausente') or
                            reason.startswith('marca conflitante')
                        ]
                        if blocking_reasons:
                            print(f"      Kabum retornou item parecido, mas diferente: {closest_kabum_page}")
                            print(f"      Motivo do bloqueio: {', '.join(blocking_reasons)}")

                    print("      Nenhuma imagem valida encontrada")
                    time.sleep(0.2)

                except Exception as e:
                    print(f"      Erro na busca Kabum: {e}")

        print("  Nenhuma imagem encontrada na Kabum via busca direta")
        print("  Tentando Kabum via Google e Bing Images...")
        return self.search_priority_site_images(
            product,
            "Kabum",
            "kabum.com.br",
            allowed_hosts=("images.kabum.com.br", "http2.kabum.com.br"),
        )

    def check_exact_product_match(self, html_content, product):
        """Valida se a pagina realmente contem o produto desejado."""
        try:
            text_only = re.sub(r'<[^>]+>', ' ', html_content or '')
            text_only = html.unescape(text_only)
            score_data = self.candidate_text_score(product, text_only[:250000])
            return score_data['accepted'] or score_data['score'] >= max(0.48, score_data['minimum_score'] - 0.05)
        except Exception as e:
            print(f"      Erro ao verificar correspondencia: {e}")
            return False

    def sort_kabum_urls_by_relevance(self, urls, product):
        """Ordena URLs da Kabum por relevancia com o produto."""
        try:
            return sorted(
                urls,
                key=lambda current_url: self.calculate_url_relevance(current_url, product),
                reverse=True
            )
        except Exception as e:
            print(f"      Erro ao ordenar URLs: {e}")
            return urls

    def calculate_url_relevance(self, url, product):
        """Calcula relevancia de uma URL especifica para o produto."""
        try:
            score_data = self.candidate_text_score(product, url)
            url_lower = str(url or '').lower()
            relevance = score_data['score']

            if '/produtos/' in url_lower:
                relevance += 0.18
            if '/fotos/' in url_lower or '/photos/' in url_lower:
                relevance += 0.08
            if any(term in url_lower for term in ('placeholder', 'logo', 'icon', 'sprite', 'banner')):
                relevance -= 0.35

            return max(0.0, min(1.0, relevance))
        except Exception as e:
            print(f"      Erro ao calcular relevancia: {e}")
            return 0.0

    def get_product_tokens(self, product, max_tokens=8):
        """Quebra o produto em tokens uteis para validar relevancia."""
        signature = self.build_product_signature(product)
        ordered_tokens = (
            signature['brand_tokens'] +
            signature['strict_model_tokens'] +
            signature['family_tokens'] +
            signature['keyword_tokens'] +
            signature['spec_tokens']
        )

        tokens = []
        seen = set()
        for token in ordered_tokens:
            normalized = self.normalize_text(token)
            if not normalized or normalized in seen:
                continue
            seen.add(normalized)
            tokens.append(normalized)
            if len(tokens) >= max_tokens:
                break

        return tokens

    def url_matches_product_tokens(self, url, product):
        """Exige um minimo de tokens relevantes na URL."""
        tokens = self.get_product_tokens(product)
        url_lower = self.normalize_text(url)
        matches = sum(1 for token in tokens if token and token in url_lower)
        required_matches = 2 if len(tokens) >= 3 else 1
        score_data = self.candidate_text_score(product, url_lower)
        return matches >= required_matches or score_data['score'] >= max(0.34, score_data['minimum_score'] - 0.08)

    def extract_bing_image_candidates(self, html_content, product, allowed_hosts=None, expected_domain=None):
        """Extrai candidatos do Bing Images com titulo, descricao e pagina de origem."""
        candidates = []
        seen = set()

        raw_meta_entries = re.findall(r'\bm="([^"]+)"', html_content or '')
        raw_meta_entries.extend(re.findall(r"\bm='([^']+)'", html_content or ''))

        for raw_meta in raw_meta_entries:
            try:
                payload = html.unescape(raw_meta).replace('\\/', '/')
                data = json.loads(payload)
            except Exception:
                continue

            image_url = (data.get('murl') or '').strip()
            page_url = (data.get('purl') or '').strip()
            title = (data.get('t') or '').strip()
            desc = (data.get('desc') or '').strip()

            if not image_url or image_url in seen or not self.is_probable_image_url(image_url):
                continue

            image_host = urlparse(image_url).netloc.lower()
            page_host = urlparse(page_url).netloc.lower()
            if allowed_hosts and not any(host in image_host for host in allowed_hosts):
                continue

            score_data = self.candidate_text_score(product, title, desc, page_url, image_url)
            final_score = score_data['score']
            if expected_domain and expected_domain in page_host:
                final_score += 0.15
            if allowed_hosts and any(host in image_host for host in allowed_hosts):
                final_score += 0.08

            blocking_reasons = any(
                reason.startswith('marca ausente') or
                reason.startswith('modelo ausente') or
                reason.startswith('marca conflitante')
                for reason in score_data['reasons']
            )
            accepted = score_data['accepted'] or (
                not blocking_reasons and
                final_score >= max(0.45, score_data['minimum_score'] - 0.04)
            )

            seen.add(image_url)
            candidates.append({
                'image_url': image_url,
                'page_url': page_url,
                'title': title,
                'desc': desc,
                'score': round(final_score, 4),
                'accepted': accepted,
                'score_data': score_data,
            })

        if candidates:
            return candidates

        for image_url in self.extract_bing_image_urls(html_content, allowed_hosts=allowed_hosts):
            score_data = self.candidate_text_score(product, image_url)
            candidates.append({
                'image_url': image_url,
                'page_url': '',
                'title': '',
                'desc': '',
                'score': score_data['score'],
                'accepted': self.url_matches_product_tokens(image_url, product),
                'score_data': score_data,
            })

        return candidates

    def search_bing_site_images(self, product, site_name, domain, allowed_hosts=None):
        """Busca imagens no Bing limitadas a um dominio especifico."""
        print("\n" + "="*60)
        print(f"METODO: {site_name} Priority")
        print("="*60)

        product_name = product['nome'].strip()
        compact_name = self.build_compact_search_query(product_name)
        search_terms = [
            f'site:{domain} "{product_name}"',
            f'site:{domain} {compact_name}',
        ]

        for term in search_terms:
            try:
                search_url = f"https://www.bing.com/images/search?q={self.encode_query_component(term)}&form=HDRSC3"
                print(f"  Buscando em {site_name}: {term}")
                response = self.session.get(search_url, timeout=8)

                if response.status_code != 200:
                    print(f"    HTTP {response.status_code} em {site_name}")
                    continue

                candidates = self.extract_bing_image_candidates(
                    response.text,
                    product,
                    allowed_hosts=allowed_hosts,
                    expected_domain=domain,
                )
                candidates = sorted(candidates, key=lambda item: item['score'], reverse=True)
                strong_candidates = [item for item in candidates if item['accepted']]
                if not strong_candidates:
                    print(f"    Nenhuma imagem validada em {site_name} para esse termo")
                    continue
                candidates = strong_candidates

                for candidate in candidates[:4]:
                    details = candidate['score_data']
                    if details['conflicting_brands']:
                        continue

                    title_preview = candidate['title'] or candidate['desc'] or candidate['page_url']
                    print(f"    Score {candidate['score']:.2f}: {title_preview[:90]}")
                    if self.download_image_from_url(candidate['image_url'], product):
                        print(f"    SUCESSO com {site_name}")
                        return True

            except Exception as e:
                print(f"    Erro em {site_name}: {e}")

        return False

    def method_1_requests_google(self, product):
        """Metodo 4: Google fallback mais conservador."""
        print("\n" + "="*60)
        print("GOOGLE FALLBACK")
        print("="*60)

        search_terms = [
            product['nome'],
            self.build_compact_search_query(product['nome']) + " produto",
        ]
        patterns = [
            r'data-src="(https://[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
            r'src="(https://[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
            r'"(https://[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"'
        ]

        for term in search_terms:
            try:
                url = f"https://www.google.com/search?q={self.encode_query_component(term)}&tbm=isch&hl=pt-BR"
                print(f"  Buscando no Google: {term}")
                response = self.session.get(url, timeout=8)

                if response.status_code != 200:
                    print(f"    HTTP {response.status_code} no Google")
                    continue

                tried = set()
                for pattern in patterns:
                    for match in re.findall(pattern, response.text):
                        clean_url = html.unescape(match.strip('"').replace('\\u003d', '=').replace('\\', ''))
                        if clean_url in tried:
                            continue
                        tried.add(clean_url)

                        if (
                            'ssl.gstatic.com' in clean_url or
                            'gstatic.com' in clean_url or
                            'googleusercontent' in clean_url or
                            'logo' in clean_url.lower() or
                            'icon' in clean_url.lower() or
                            not self.is_probable_image_url(clean_url)
                        ):
                            continue

                        score_data = self.candidate_text_score(product, clean_url)
                        if score_data['conflicting_brands']:
                            continue
                        if not self.url_matches_product_tokens(clean_url, product):
                            continue

                        print(f"    URL aprovada: {clean_url[:80]}...")
                        if self.download_image_from_url(clean_url, product):
                            return True

            except Exception as e:
                print(f"    Erro no Google: {e}")

        print("  Nenhuma imagem valida encontrada no Google")
        return False

    def method_2_terabyte_priority(self, product):
        """Prioriza resultados da Terabyte via Google e Bing."""
        return self.search_priority_site_images(
            product,
            "Terabyte",
            "terabyteshop.com.br",
            allowed_hosts=("img.terabyteshop.com.br", "images.tcdn.com.br")
        )

    def method_3_pichau_priority(self, product):
        """Prioriza resultados da Pichau via Google e Bing."""
        return self.search_priority_site_images(
            product,
            "Pichau",
            "pichau.com.br",
            allowed_hosts=("media.pichau.com.br", "pichau-media.s3.amazonaws.com", "images.tcdn.com.br")
        )

    def method_1_requests_google(self, product):
        """Método 4: Google fallback enxuto."""
        print("\n" + "="*60)
        print("GOOGLE FALLBACK")
        print("="*60)

        search_terms = [
            product['nome'],
            self.build_compact_search_query(product['nome']) + " produto"
        ]
        patterns = [
            r'data-src="(https://[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
            r'src="(https://[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
            r'"(https://[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"'
        ]

        for term in search_terms:
            try:
                url = f"https://www.google.com/search?q={quote(term)}&tbm=isch&hl=pt-BR"
                print(f"  Buscando no Google: {term}")
                response = self.session.get(url, timeout=8)

                if response.status_code != 200:
                    print(f"    HTTP {response.status_code} no Google")
                    continue

                html_content = response.text
                tried = set()
                for pattern in patterns:
                    for match in re.findall(pattern, html_content):
                        clean_url = html.unescape(match.strip('"').replace('\\u003d', '=').replace('\\', ''))
                        if clean_url in tried:
                            continue
                        tried.add(clean_url)

                        if ('ssl.gstatic.com' in clean_url or
                            'gstatic.com' in clean_url or
                            'googleusercontent' in clean_url or
                            'logo' in clean_url.lower() or
                            'icon' in clean_url.lower() or
                            not self.is_probable_image_url(clean_url)):
                            continue

                        print(f"    URL: {clean_url[:80]}...")
                        if self.download_image_from_url(clean_url, product):
                            return True

            except Exception as e:
                print(f"    Erro no Google: {e}")

        print("  Nenhuma imagem válida encontrada no Google")
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
        """Fallback final em marketplaces."""
        print("\n" + "="*60)
        print("MARKETPLACE FALLBACK")
        print("="*60)
        
        # Ultimo recurso: marketplaces
        sources = [
            ("Mercado Livre", f"https://lista.mercadolivre.com.br/{quote(product['nome'])}"),
            ("AliExpress", f"https://www.aliexpress.com/wholesale?SearchText={quote(product['nome'])}&catId=0&SortType=default")
        ]
        
        for source_name, url in sources:
            print(f"\n  Tentando {source_name}...")
            
            try:
                response = self.session.get(url, timeout=10)
                
                if response.status_code == 200:
                    page_html = response.text
                    tried_urls = set()
                    attempts = 0
                    
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
                        for match in re.finditer(pattern, page_html):
                            attempts += 1
                            if attempts > 20:
                                break

                            # Limpar URL - remover aspas se existirem
                            clean_url = match.group(1).strip('"')
                            if clean_url in tried_urls:
                                continue
                            tried_urls.add(clean_url)
                            
                            # Filtros otimizados
                            if (len(clean_url) > 30 and 
                                'http' in clean_url and
                                self.is_probable_image_url(clean_url) and
                                'logo' not in clean_url.lower() and
                                'icon' not in clean_url.lower() and
                                'sprite' not in clean_url.lower() and
                                'placeholder' not in clean_url.lower() and
                                'loading' not in clean_url.lower()):
                                
                                context_start = max(0, match.start() - 450)
                                context_end = min(len(page_html), match.end() + 450)
                                context_html = page_html[context_start:context_end]
                                context_text = html.unescape(re.sub(r'<[^>]+>', ' ', context_html))
                                score_data = self.candidate_text_score(
                                    product,
                                    source_name,
                                    url,
                                    clean_url,
                                    context_text,
                                )
                                if score_data['conflicting_brands']:
                                    continue
                                if not (
                                    score_data['accepted'] or
                                    score_data['score'] >= max(0.34, score_data['minimum_score'] - 0.10)
                                ):
                                    continue

                                print(f"    Score {score_data['score']:.2f}: {clean_url[:60]}...")

                                if self.download_image_from_url(clean_url, product):
                                    return True

                        if attempts > 20:
                            break
                    
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
                ("Bing Images", f"https://www.bing.com/images/search?q={quote(term)}&form=QBLH")
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
                                    self.is_probable_image_url(clean_url) and
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
            
            if not self.is_probable_image_url(url):
                print("    URL descartada: nao parece ser uma imagem direta")
                return False
            
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                content_type = response.headers.get('Content-Type', '').lower()
                if content_type and not content_type.startswith('image/'):
                    print(f"    Conteudo ignorado: {content_type}")
                    return False

                # Verificar tamanho mínimo antes de processar
                if len(response.content) < 5000:  # Menos de 5KB = provavelmente ícone
                    print(f"    Imagem muito pequena: {len(response.content)} bytes")
                    return False
                
                # Tentar abrir como imagem
                try:
                    img = Image.open(io.BytesIO(response.content))
                    img.load()
                except Exception as e:
                    print(f"    Conteudo nao e imagem valida: {e}")
                    return False
                
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
            
            # Delay curto para manter agilidade
            time.sleep(0.1)
        
        # Resumo final
        print(f"\n{'='*80}")
        print("RESUMO FINAL:")
        print(f"Total processado: {len(missing_products)}")
        print(f"Sucessos: {successful}")
        print(f"Falhas: {failed}")
        print(f"Taxa de sucesso: {(successful/len(missing_products))*100:.1f}%")
        print(f"{'='*80}")
    
    def get_all_missing_products(self, force_codes=None, force_all=False):
        """Pega os produtos sem imagem ou os codigos forcados."""
        missing_products = []
        force_codes = {str(code).strip() for code in (force_codes or []) if str(code).strip()}
        found_force_codes = set()
        ignored_entries = self.load_ignored_entries()
        ignored_count = 0

        if not os.path.exists(self.csv_file):
            print("ERRO: CSV nao encontrado!")
            return missing_products

        try:
            with open(self.csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f, delimiter=';')

                for row in reader:
                    if not row.get('codigo') or not row.get('nome'):
                        continue

                    codigo = row['codigo'].strip()
                    if codigo in force_codes:
                        found_force_codes.add(codigo)

                    if force_codes and not force_all and codigo not in force_codes:
                        continue

                    imagem = row.get('imagem', f"{codigo}.webp").strip()
                    image_path = os.path.join(self.image_folder, imagem)
                    should_force = force_all or codigo in force_codes
                    is_placeholder_image = imagem.lower() in {'placeholder.webp', 'placeholder.png'}

                    if should_force or is_placeholder_image or not os.path.exists(image_path):
                        product = dict(row)
                        product['codigo'] = codigo
                        product['nome'] = row['nome'].strip()
                        product['imagem'] = imagem
                        if self.is_ignored_product(product, ignored_entries):
                            ignored_count += 1
                        else:
                            missing_products.append(product)

        except Exception as e:
            print(f"ERRO ao ler CSV: {e}")

        missing_force_codes = sorted(force_codes - found_force_codes)
        if missing_force_codes:
            print(f"Codigos nao encontrados no CSV: {', '.join(missing_force_codes)}")
        if ignored_count:
            print(f"Ignorados pela lista de bloqueio: {ignored_count}")

        print(f"Encontrados {len(missing_products)} produtos para processar")
        return missing_products

    def search_priority_site_images(self, product, site_name, domain, allowed_hosts=None):
        """Tenta Google Images e Bing para um site prioritario."""
        if self.search_google_site_images(
            product,
            f"{site_name} via Google",
            domain,
            allowed_hosts=allowed_hosts,
        ):
            return True

        print(f"  Tentando {site_name} via Bing Images...")
        return self.search_bing_site_images(
            product,
            f"{site_name} via Bing",
            domain,
            allowed_hosts=allowed_hosts,
        )

    def extract_generic_image_candidates(self, html_content, product, allowed_hosts=None):
        """Extrai candidatos de mecanismos genericos de busca por imagem."""
        candidates = []
        seen = set()
        patterns = [
            r'"iurl":"([^"]+)"',
            r'"imgUrl":"([^"]+)"',
            r'"thumbnailUrl":"([^"]+)"',
            r'data-src="(https://[^"]+)"',
            r'src="(https://[^"]+)"',
            r'"(https://[^"]+\.(?:jpg|jpeg|png|webp|gif|bmp|avif)[^"]*)"',
        ]

        for pattern in patterns:
            for match in re.findall(pattern, html_content or ''):
                clean_url = html.unescape(str(match)).replace('\\/', '/')
                clean_url = clean_url.replace('\\u003a', ':').replace('\\u002f', '/')
                clean_url = clean_url.strip().strip('"').strip("'")

                if clean_url.startswith('//'):
                    clean_url = f"https:{clean_url}"

                if clean_url in seen or not self.is_probable_image_url(clean_url):
                    continue

                host = urlparse(clean_url).netloc.lower()
                if allowed_hosts and not any(allowed_host in host for allowed_host in allowed_hosts):
                    continue

                if any(blocked in clean_url.lower() for blocked in ('logo', 'icon', 'sprite', 'placeholder', 'avatar')):
                    continue

                score_data = self.candidate_text_score(product, clean_url)
                blocking_reasons = any(
                    reason.startswith('marca ausente') or
                    reason.startswith('modelo ausente') or
                    reason.startswith('marca conflitante')
                    for reason in score_data['reasons']
                )
                accepted = self.url_matches_product_tokens(clean_url, product) or (
                    not blocking_reasons and
                    score_data['score'] >= max(0.34, score_data['minimum_score'] - 0.08)
                )

                seen.add(clean_url)
                candidates.append({
                    'image_url': clean_url,
                    'score': score_data['score'],
                    'accepted': accepted,
                    'score_data': score_data,
                })

        return sorted(candidates, key=lambda item: item['score'], reverse=True)

    def search_google_site_images(self, product, site_name, domain, allowed_hosts=None):
        """Busca imagens no Google limitadas a um dominio especifico."""
        print("\n" + "="*60)
        print(f"METODO: {site_name}")
        print("="*60)

        product_name = product['nome'].strip()
        compact_name = self.build_compact_search_query(product_name)
        search_terms = [
            f'site:{domain} "{product_name}"',
            f'site:{domain} {compact_name}',
            f'{compact_name} site:{domain} produto',
        ]

        patterns = [
            r'data-src="(https://[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
            r'src="(https://[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
            r'"(https://[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"',
        ]

        for term in search_terms:
            try:
                search_url = f"https://www.google.com/search?q={self.encode_query_component(term)}&tbm=isch&hl=pt-BR"
                print(f"  Buscando no Google: {term}")
                response = self.session.get(search_url, timeout=8)

                if response.status_code != 200:
                    print(f"    HTTP {response.status_code} no Google")
                    continue

                tried = set()
                candidates = []
                for pattern in patterns:
                    for match in re.findall(pattern, response.text):
                        clean_url = html.unescape(match.strip('"').replace('\\u003d', '=').replace('\\', ''))
                        if clean_url in tried or not self.is_probable_image_url(clean_url):
                            continue
                        tried.add(clean_url)

                        host = urlparse(clean_url).netloc.lower()
                        if allowed_hosts and not any(allowed_host in host for allowed_host in allowed_hosts):
                            continue
                        if any(blocked in clean_url.lower() for blocked in ('logo', 'icon', 'sprite', 'placeholder', 'avatar')):
                            continue

                        score_data = self.candidate_text_score(product, term, clean_url)
                        if score_data['conflicting_brands']:
                            continue

                        accepted = self.url_matches_product_tokens(clean_url, product) or (
                            score_data['accepted'] or
                            score_data['score'] >= max(0.34, score_data['minimum_score'] - 0.08)
                        )
                        candidates.append({
                            'image_url': clean_url,
                            'score': score_data['score'],
                            'accepted': accepted,
                            'score_data': score_data,
                        })

                strong_candidates = sorted(
                    [item for item in candidates if item['accepted']],
                    key=lambda item: item['score'],
                    reverse=True,
                )
                if not strong_candidates:
                    print(f"    Nenhuma imagem validada no Google para {site_name}")
                    continue

                for candidate in strong_candidates[:4]:
                    details = candidate['score_data']
                    if details['conflicting_brands']:
                        continue

                    print(f"    Score {candidate['score']:.2f}: {candidate['image_url'][:90]}")
                    if self.download_image_from_url(candidate['image_url'], product):
                        print(f"    SUCESSO com {site_name}")
                        return True

            except Exception as e:
                print(f"    Erro no Google para {site_name}: {e}")

        return False

    def method_4_pcyes_priority(self, product):
        """Prioriza resultados da PCYes via Google e Bing."""
        return self.search_priority_site_images(
            product,
            "PCYes",
            "pcyes.com.br",
            allowed_hosts=("pcyes.com.br", "images.tcdn.com.br", "cdn.awsli.com.br"),
        )

    def method_5_hardware_sites_priority(self, product):
        """Tenta outras lojas de hardware antes dos mecanismos genericos."""
        additional_sites = [
            ("WAZ", "waz.com.br", None),
            ("Guerra Digital", "guerradigital.com.br", None),
            ("Oficina dos Bits", "oficinadosbits.com.br", None),
            ("HardStore", "hardstore.com.br", None),
            ("Shopinfo", "shopinfo.com.br", None),
        ]

        for site_name, domain, allowed_hosts in additional_sites:
            print(f"\nTentando loja de hardware adicional: {site_name}")
            if self.search_priority_site_images(
                product,
                site_name,
                domain,
                allowed_hosts=allowed_hosts,
            ):
                return True

        return False

    def method_6_bing_fallback(self, product):
        """Bing generico com foco em produtos de hardware."""
        print("\n" + "="*60)
        print("BING FALLBACK")
        print("="*60)

        search_terms = self.build_generic_fallback_queries(product)

        for term in search_terms:
            try:
                search_url = f"https://www.bing.com/images/search?q={self.encode_query_component(term)}&form=HDRSC3"
                print(f"  Buscando no Bing: {term}")
                response = self.session.get(search_url, timeout=8)

                if response.status_code != 200:
                    print(f"    HTTP {response.status_code} no Bing")
                    continue

                candidates = self.extract_bing_image_candidates(response.text, product)
                strong_candidates = sorted(
                    [item for item in candidates if item['accepted']],
                    key=lambda item: item['score'],
                    reverse=True,
                )
                if not strong_candidates:
                    print("    Nenhuma imagem validada no Bing")
                    continue

                for candidate in strong_candidates[:5]:
                    details = candidate['score_data']
                    if details['conflicting_brands']:
                        continue

                    title_preview = candidate['title'] or candidate['desc'] or candidate['page_url'] or candidate['image_url']
                    print(f"    Score {candidate['score']:.2f}: {title_preview[:90]}")
                    if self.download_image_from_url(candidate['image_url'], product):
                        print("    SUCESSO com Bing")
                        return True

            except Exception as e:
                print(f"    Erro no Bing: {e}")

        print("  Nenhuma imagem valida encontrada no Bing")
        return False

    def method_1_requests_google(self, product):
        """Metodo 4: Google fallback mais conservador."""
        print("\n" + "="*60)
        print("GOOGLE FALLBACK")
        print("="*60)

        search_terms = self.build_generic_fallback_queries(product, max_queries=5)
        patterns = [
            r'data-src="(https://[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
            r'src="(https://[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
            r'"(https://[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"'
        ]

        for term in search_terms:
            try:
                url = f"https://www.google.com/search?q={self.encode_query_component(term)}&tbm=isch&hl=pt-BR"
                print(f"  Buscando no Google: {term}")
                response = self.session.get(url, timeout=8)

                if response.status_code != 200:
                    print(f"    HTTP {response.status_code} no Google")
                    continue

                tried = set()
                for pattern in patterns:
                    for match in re.findall(pattern, response.text):
                        clean_url = html.unescape(match.strip('"').replace('\\u003d', '=').replace('\\', ''))
                        if clean_url in tried:
                            continue
                        tried.add(clean_url)

                        if (
                            'ssl.gstatic.com' in clean_url or
                            'gstatic.com' in clean_url or
                            'googleusercontent' in clean_url or
                            'logo' in clean_url.lower() or
                            'icon' in clean_url.lower() or
                            not self.is_probable_image_url(clean_url)
                        ):
                            continue

                        score_data = self.candidate_text_score(product, clean_url)
                        if score_data['conflicting_brands']:
                            continue
                        if not self.url_matches_product_tokens(clean_url, product):
                            continue

                        print(f"    URL aprovada: {clean_url[:80]}...")
                        if self.download_image_from_url(clean_url, product):
                            return True

            except Exception as e:
                print(f"    Erro no Google: {e}")

        print("  Nenhuma imagem valida encontrada no Google")
        return False

    def download_image_from_url(self, url, product):
        """Baixa imagem de uma URL especifica usando o nome exato do CSV."""
        try:
            print(f"    Baixando: {url[:80]}...")

            if not self.is_probable_image_url(url):
                print("    URL descartada: nao parece ser uma imagem direta")
                return False

            response = self.session.get(url, timeout=10)
            if response.status_code != 200:
                print(f"    Erro HTTP: {response.status_code}")
                return False

            content_type = response.headers.get('Content-Type', '').lower()
            if content_type and not content_type.startswith('image/'):
                print(f"    Conteudo ignorado: {content_type}")
                return False

            if len(response.content) < 5000:
                print(f"    Imagem muito pequena: {len(response.content)} bytes")
                return False

            try:
                img = Image.open(io.BytesIO(response.content))
                img.load()
            except Exception as e:
                print(f"    Conteudo nao e imagem valida: {e}")
                return False

            width, height = img.size
            if width < 150 or height < 150:
                print(f"    Imagem muito pequena: {width}x{height}")
                return False

            is_suitable, reason = self.is_suitable_product_image(img, url)
            if not is_suitable:
                print(f"    Imagem inadequada: {reason}")
                return False

            img = self.process_image_background(img)

            processed_bg = self.analyze_background(img)
            processed_brightness = float(np.mean(np.array(img.convert('L'))))
            if processed_bg['type'] == 'black' and processed_bg['confidence'] > 70:
                print("    Imagem descartada: fundo preto persistiu apos o processamento")
                return False
            if processed_brightness < 40:
                print("    Imagem descartada: ainda ficou escura demais apos o processamento")
                return False

            filename = self.resolve_output_filename(product)

            filepath = os.path.join(self.image_folder, filename)

            if img.mode == 'P':
                img = img.convert('RGBA')
            elif img.mode == 'LA':
                img = img.convert('RGBA')
            elif img.mode not in ('RGB', 'RGBA'):
                img = img.convert('RGB')

            save_kwargs = {'quality': 88, 'method': 6}
            img.save(filepath, 'WEBP', **save_kwargs)
            self.update_product_image_references(product, filename)
            product['imagem'] = filename

            print(f"    SUCESSO: {filename} ({len(response.content)//1024}KB)")
            return True

        except Exception as e:
            print(f"    Erro ao baixar: {e}")
            return False

    def download_all_missing_images(self, force_codes=None, force_all=False):
        """Baixa imagens faltantes ou reprocesa os codigos solicitados."""
        products_to_process = self.get_all_missing_products(force_codes=force_codes, force_all=force_all)

        if not products_to_process:
            print("Nenhum produto para processar!")
            return

        print(f"\nINICIANDO DOWNLOAD DE {len(products_to_process)} IMAGENS")
        print("="*80)
        print("VERSAO OTIMIZADA COM VALIDACAO DE MARCA/MODELO E FUNDO PRETO")
        print("="*80)

        successful = 0
        failed = 0

        for i, product in enumerate(products_to_process, 1):
            print(f"\n{'='*80}")
            print(f"PRODUTO {i}/{len(products_to_process)}: {product['nome']}")
            print(f"CODIGO: {product['codigo']}")
            print(f"{'='*80}")

            if self.download_single_product_image(product):
                successful += 1
                print(f"\nSUCESSO: Imagem baixada para {product['nome']}")
            else:
                failed += 1
                print(f"\nFALHA: Nao foi possivel baixar imagem para {product['nome']}")

            if i % 5 == 0 or i == len(products_to_process):
                progress = (i / len(products_to_process)) * 100
                print(f"\n{'='*80}")
                print(f"PROGRESSO: {progress:.1f}% - Sucesso: {successful}, Falhas: {failed}")
                print(f"{'='*80}")

            time.sleep(0.1)

        print(f"\n{'='*80}")
        print("RESUMO FINAL:")
        print(f"Total processado: {len(products_to_process)}")
        print(f"Sucessos: {successful}")
        print(f"Falhas: {failed}")
        print(f"Taxa de sucesso: {(successful/len(products_to_process))*100:.1f}%")
        print(f"{'='*80}")

    def download_single_product_image(self, product):
        """Tenta todos os métodos para um único produto com prioridade em hardware."""
        priority_methods = [
            ("Kabum Priority", lambda: self.method_1_kabum_priority(product)),
            ("Terabyte Priority", lambda: self.method_2_terabyte_priority(product)),
            ("Pichau Priority", lambda: self.method_3_pichau_priority(product)),
            ("PCYes Priority", lambda: self.method_4_pcyes_priority(product)),
            ("Hardware Stores Priority", lambda: self.method_5_hardware_sites_priority(product)),
        ]
        fallback_methods = [
            ("Google Fallback", lambda: self.method_1_requests_google(product)),
            ("Bing Fallback", lambda: self.method_6_bing_fallback(product)),
            ("Marketplace Fallback", lambda: self.method_3_alternative_sources(product)),
        ]

        methods = priority_methods if self.strict_sites_only else priority_methods + fallback_methods

        if self.strict_sites_only:
            print("Modo estrito ativo: somente lojas de hardware confiaveis serao usadas.")
        else:
            print("Modo padrao ativo: lojas de hardware primeiro, depois Google/Bing com validacao.")
        
        for method_name, method_func in methods:
            print(f"\n{'='*20} {method_name} {'='*20}")
            
            try:
                if method_func():
                    print(f"\n✅ SUCESSO com método: {method_name}")
                    return True
            except Exception as e:
                print(f"Erro no método {method_name}: {e}")
                continue
            
            time.sleep(0.1)
        
        return False

def main():
    print("="*80)
    print("   DOWNLOAD SUPER PERSISTENTE - VERSÃO OTIMIZADA V4")
    print("="*80)
    print("🎨 NOVAS FUNCIONALIDADES:")
    print("✅ KABUM PRIORITY - Busca prioritária na Kabum")
    print("✅ DETECÇÃO AUTOMÁTICA DE FUNDO PRETO")
    print("✅ REMOÇÃO AVANÇADA DE FUNDO PRETO")
    print("✅ BUSCA POR IMAGENS COM FUNDO BRANCO/TRANSPARENTE")
    print("✅ MELHORIA AUTOMÁTICA DE QUALIDADE")
    print("✅ FILTRO INTELIGENTE DE IMAGENS ADEQUADAS")
    print("✅ REDIMENSIONAMENTO AUTOMÁTICO")
    print("="*80)
    print("MÉTODOS DISPONÍVEIS:")
    print("🥇 MÉTODO 1: Kabum Priority - PRIORIDADE MÁXIMA")
    print("✅ MÉTODO 2: Terabyte Priority - VIA BING IMAGES")
    print("✅ MÉTODO 3: Pichau Priority - VIA BING IMAGES")
    print("✅ MÉTODO 4: Google Fallback - MAIS RÁPIDO")
    print("- PRIORIZA LOJAS DE HARDWARE ANTES DO GOOGLE")
    print("- EVITA FONTES GENÉRICAS E ETAPAS LENTAS")
    print("- REMOVE FUNDO PRETO QUANDO NECESSÁRIO")
    print("- MELHORA QUALIDADE DA IMAGEM")
    print("- REDIMENSIONA PARA TAMANHOS PADRÃO")
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

def parse_code_arguments(raw_values):
    """Aceita codigos repetidos ou separados por virgula/espaco."""
    codes = []
    for raw_value in raw_values or []:
        for item in re.split(r'[\s,;]+', str(raw_value or '').strip()):
            if item:
                codes.append(item)
    return list(dict.fromkeys(codes))


def main():
    parser = argparse.ArgumentParser(
        description="Baixa imagens de produtos com validacao mais rigida de marca/modelo."
    )
    parser.add_argument(
        '--codigo',
        action='append',
        default=[],
        help='Reprocessa apenas estes codigos. Pode repetir a flag ou separar por virgula.',
    )
    parser.add_argument(
        '--force-all',
        action='store_true',
        help='Reprocessa todos os produtos mesmo se a imagem ja existir.',
    )
    parser.add_argument(
        '--repair-existing-white-bg',
        action='store_true',
        help='Reprocessa imagens ja existentes que ainda parecem ter fundo branco conectado as bordas.',
    )
    mode_group = parser.add_mutually_exclusive_group()
    mode_group.add_argument(
        '--strict-sites-only',
        action='store_true',
        help='Usa apenas lojas de hardware confiaveis e nao tenta fallbacks genericos.',
    )
    mode_group.add_argument(
        '--allow-generic-fallbacks',
        action='store_true',
        help='Mantido por compatibilidade. O comportamento padrao ja tenta fallbacks genericos validados.',
    )
    args = parser.parse_args()
    force_codes = parse_code_arguments(args.codigo)

    print("="*80)
    print("   DOWNLOAD SUPER PERSISTENTE - VERSAO OTIMIZADA V5")
    print("="*80)
    print("NOVAS FUNCIONALIDADES:")
    print("OK KABUM PRIORITY - Busca prioritaria na Kabum")
    print("OK PRIORIDADE PARA TERABYTE, PICHAU, PCYES E OUTRAS LOJAS DE HARDWARE")
    print("OK VALIDACAO DE MARCA E MODELO")
    print("OK LEITURA DE TITULO/DESCRICAO NO BING")
    print("OK BUSCA VIA GOOGLE IMAGES")
    print("OK LOJAS DE HARDWARE PRIMEIRO + FALLBACK GENERICO VALIDADO")
    print("OK DETECCAO MELHOR DE FUNDO PRETO")
    print("OK REPROCESSAMENTO POR CODIGO")
    print("="*80)
    print("METODOS DISPONIVEIS:")
    print("- Metodo 1: Kabum Priority")
    print("- Metodo 2: Terabyte Priority via Google e Bing")
    print("- Metodo 3: Pichau Priority via Google e Bing")
    print("- Metodo 4: PCYes Priority via Google e Bing")
    print("- Metodo 5: Outras lojas de hardware")
    print("- Metodo 6: Google Fallback mais conservador")
    print("- Metodo 7: Bing Fallback")
    print("- Metodo 8: Marketplace Fallback (Mercado Livre / AliExpress)")
    print("="*80)
    print()

    try:
        import numpy as np  # noqa: F401
        print("NumPy encontrado")
    except ImportError:
        print("NumPy nao encontrado. Instale com: pip install numpy")
        return

    try:
        from scipy import ndimage  # noqa: F401
        print("SciPy encontrado")
    except ImportError:
        print("SciPy nao encontrado. Usando metodo simples de remocao de fundo")
        print("Para melhor qualidade, instale com: pip install scipy")

    if force_codes:
        print(f"Codigos solicitados para reprocessar: {', '.join(force_codes)}")
    if args.force_all:
        print("Modo force-all ativo: todas as imagens serao reprocessadas.")

    downloader = OptimizedPersistentDownloader()
    downloader.strict_sites_only = args.strict_sites_only
    if downloader.strict_sites_only:
        print("Modo estrito ativo: apenas lojas de hardware confiaveis.")
    else:
        print("Modo padrao ativo: lojas de hardware primeiro, depois Google/Bing com validacao forte.")

    if args.repair_existing_white_bg:
        downloader.repair_existing_white_backgrounds(force_codes=force_codes)
        return

    downloader.download_all_missing_images(
        force_codes=force_codes,
        force_all=args.force_all,
    )

if __name__ == "__main__":
    exit_code = 0
    try:
        main()
    except KeyboardInterrupt:
        exit_code = 1
        print("\nProcesso interrompido pelo usuario.")
    except Exception as exc:
        exit_code = 1
        print(f"\nERRO inesperado: {exc}")
        traceback.print_exc()
    finally:
        pause_if_opened_from_explorer()

    raise SystemExit(exit_code)

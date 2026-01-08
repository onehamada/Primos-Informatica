#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Baixar Imagens - Ferramenta única para baixar imagens do navegador
Verifica produtos.csv e baixa imagens faltantes automaticamente
"""

import os
import csv
import requests
import time
from PIL import Image
import io
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class BaixarImagens:
    def __init__(self):
        self.csv_file = '../data/products.csv'
        self.image_folder = '../images/products/thumbnail'
        self.image_size = (150, 150)
        
        # Garantir que a pasta exista
        os.makedirs(self.image_folder, exist_ok=True)
    
    def verificar_imagens_faltantes(self):
        """Verifica quais imagens estão faltando no CSV"""
        print("🔍 Verificando imagens faltantes...")
        
        if not os.path.exists(self.csv_file):
            print(f"❌ Erro: Arquivo CSV não encontrado em {self.csv_file}")
            return []
        
        faltantes = []
        
        try:
            with open(self.csv_file, 'r', encoding='utf-8') as f:
                reader = csv.reader(f, delimiter=';')
                next(reader)  # Pular cabeçalho
                
                for row in reader:
                    if len(row) >= 9:
                        codigo = row[0].strip()
                        nome = row[1].strip()
                        imagem = row[8].strip()
                        
                        if not imagem:
                            imagem = f"{codigo}.webp"
                        
                        caminho_imagem = os.path.join(self.image_folder, imagem)
                        if not os.path.exists(caminho_imagem):
                            faltantes.append({
                                'codigo': codigo,
                                'nome': nome,
                                'imagem': imagem
                            })
        
        except Exception as e:
            print(f"❌ Erro ao ler CSV: {e}")
            return []
        
        print(f"📊 Encontradas {len(faltantes)} imagens faltando")
        return faltantes
    
    def configurar_navegador(self):
        """Configura navegador Chrome para busca"""
        try:
            options = Options()
            options.add_argument('--headless')  # Modo invisível
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--disable-gpu')
            options.add_argument('--window-size=1920,1080')
            options.add_argument('--disable-blink-features=AutomationControlled')
            options.add_experimental_option("excludeSwitches", ["enable-automation"])
            options.add_experimental_option('useAutomationExtension', False)
            
            # User agent real
            options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
            
            service = Service()
            driver = webdriver.Chrome(service=service, options=options)
            
            # Ocultar automação
            driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            
            return driver
            
        except Exception as e:
            print(f"❌ Erro ao configurar navegador: {e}")
            print("💡 Tente instalar: pip install selenium webdriver-manager")
            return None
    
    def buscar_google_images(self, driver, termo_busca):
        """Busca imagem no Google Images"""
        try:
            # Montar URL de busca
            from urllib.parse import quote
            url = f"https://www.google.com/search?q={quote(termo_busca)}&tbm=isch&hl=pt-BR"
            
            driver.get(url)
            time.sleep(2)
            
            # Tentar encontrar imagens
            seletores = [
                'img.Q4LuWd',
                'img[src*="googleusercontent"]',
                'img[src*="gstatic"]',
                '.islrc img'
            ]
            
            for seletor in seletores:
                try:
                    wait = WebDriverWait(driver, 5)
                    imagens = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, seletor)))
                    
                    if imagens:
                        # Tentar pegar a primeira imagem
                        primeira = imagens[0]
                        
                        # Tentar diferentes atributos
                        for attr in ['src', 'data-src']:
                            url_img = primeira.get_attribute(attr)
                            if url_img and url_img.startswith('http') and len(url_img) > 30:
                                return url_img
                        
                except:
                    continue
            
            # Tentar clicar na primeira imagem
            try:
                img_clicavel = driver.find_element(By.CSS_SELECTOR, 'img[src*="http"]')
                img_clicavel.click()
                time.sleep(2)
                
                # Procurar imagem ampliada
                preview = driver.find_element(By.CSS_SELECTOR, 'img.n3VNCb')
                url_img = preview.get_attribute('src')
                if url_img and url_img.startswith('http'):
                    return url_img
                    
            except:
                pass
            
            return None
            
        except Exception as e:
            print(f"   Erro na busca: {e}")
            return None
    
    def baixar_e_converter_imagem(self, url, nome_arquivo):
        """Baixa imagem e converte para WebP"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.google.com/'
            }
            
            response = requests.get(url, headers=headers, timeout=15, stream=True)
            
            if response.status_code == 200:
                # Ler conteúdo
                conteudo = b''
                for chunk in response.iter_content(chunk_size=8192):
                    conteudo += chunk
                    if len(conteudo) > 500000:  # Limitar tamanho
                        break
                
                if len(conteudo) > 2000:  # Verificar tamanho mínimo
                    # Abrir imagem
                    img = Image.open(io.BytesIO(conteudo))
                    
                    # Converter para RGB se necessário
                    if img.mode in ('RGBA', 'LA', 'P'):
                        fundo = Image.new('RGB', img.size, (255, 255, 255))
                        if img.mode == 'P':
                            img = img.convert('RGBA')
                        if img.mode == 'RGBA':
                            fundo.paste(img, mask=img.split()[-1])
                        else:
                            fundo.paste(img)
                        img = fundo
                    
                    # Redimensionar
                    img.thumbnail(self.image_size, Image.Resampling.LANCZOS)
                    
                    # Salvar como WebP
                    caminho = os.path.join(self.image_folder, nome_arquivo)
                    img.save(caminho, 'WEBP', quality=85)
                    
                    return True, f"{len(conteudo)} bytes"
            
            return False, f"HTTP {response.status_code}"
            
        except Exception as e:
            return False, f"Erro: {str(e)[:30]}"
    
    def baixar_todas_imagens(self):
        """Baixa todas as imagens faltantes"""
        faltantes = self.verificar_imagens_faltantes()
        
        if not faltantes:
            print("🎉 Todas as imagens já estão presentes!")
            return
        
        print(f"🚀 Baixando {len(faltantes)} imagens...")
        print("   (Usando Google Images com navegador)")
        print()
        
        # Configurar navegador
        driver = self.configurar_navegador()
        if not driver:
            print("❌ Não foi possível configurar o navegador")
            print("💡 Instale: pip install selenium webdriver-manager")
            return
        
        baixadas = []
        falhas = []
        
        try:
            for i, produto in enumerate(faltantes, 1):
                print(f"📦 [{i}/{len(faltantes)}] {produto['nome']}")
                
                # Gerar termos de busca
                termos = [
                    produto['nome'],
                    f"{produto['codigo']} {produto['nome']}",
                    f"{produto['nome']} produto"
                ]
                
                sucesso = False
                
                for termo in termos:
                    if sucesso:
                        break
                    
                    print(f"   🔍 Buscando: {termo}")
                    
                    # Buscar no Google Images
                    url_img = self.buscar_google_images(driver, termo)
                    
                    if url_img:
                        print(f"   📥 Baixando...")
                        sucesso, msg = self.baixar_e_converter_imagem(url_img, produto['imagem'])
                        
                        if sucesso:
                            print(f"   ✅ {produto['imagem']} - {msg}")
                            baixadas.append(produto['imagem'])
                            break
                        else:
                            print(f"   ❌ Falha: {msg}")
                    
                    time.sleep(1)  # Delay entre buscas
                
                if not sucesso:
                    print(f"   ❌ Não encontrada: {produto['imagem']}")
                    falhas.append(produto['imagem'])
                
                # Delay entre produtos
                if i < len(faltantes):
                    time.sleep(2)
                
                print()
        
        finally:
            driver.quit()
        
        # Salvar resultados
        with open('imagens_baixadas.txt', 'w', encoding='utf-8') as f:
            for img in baixadas:
                f.write(f"{img}\n")
        
        with open('imagens_falhas.txt', 'w', encoding='utf-8') as f:
            for img in falhas:
                f.write(f"{img}\n")
        
        # Resumo
        print("=" * 60)
        print("📊 RESUMO FINAL:")
        print(f"✅ Baixadas com sucesso: {len(baixadas)}")
        print(f"❌ Falhas: {len(falhas)}")
        print(f"📁 Salvas em: {self.image_folder}")
        
        if baixadas:
            taxa = (len(baixadas) / len(faltantes)) * 100
            print(f"📈 Taxa de sucesso: {taxa:.1f}%")
        
        if falhas:
            print(f"\n⚠️ Imagens que falharam:")
            for img in falhas[:5]:
                print(f"   • {img}")
            if len(falhas) > 5:
                print(f"   ... e mais {len(falhas) - 5}")
        
        print("=" * 60)

def main():
    print("=" * 60)
    print("   BAIXAR IMAGENS - Primos Informática")
    print("=" * 60)
    print()
    print("🌐 Baixa imagens do Google Images automaticamente")
    print("📦 Verifica products.csv e completa imagens faltantes")
    print()
    
    baixador = BaixarImagens()
    
    print("Escolha uma opção:")
    print("1 - Apenas verificar imagens faltantes")
    print("2 - Baixar imagens faltantes")
    print()
    
    try:
        opcao = input("Digite 1 ou 2: ").strip()
        
        if opcao == "1":
            faltantes = baixador.verificar_imagens_faltantes()
            if faltantes:
                print(f"\n📋 Imagens faltando ({len(faltantes)}):")
                for p in faltantes[:10]:
                    print(f"   • {p['imagem']} - {p['nome']}")
                if len(faltantes) > 10:
                    print(f"   ... e mais {len(faltantes) - 10}")
            else:
                print("\n🎉 Todas as imagens já estão presentes!")
                
        elif opcao == "2":
            baixador.baixar_todas_imagens()
        else:
            print("❌ Opção inválida!")
    
    except KeyboardInterrupt:
        print("\n\n👋 Operação cancelada")
    except Exception as e:
        print(f"\n❌ Erro: {e}")
        print("\n💡 Verifique:")
        print("   - Python instalado")
        print("   - Conexão com internet")
        print("   - Arquivo products.csv existe")
    
    print("\n🏁 Fim do processo")
    input("\nPressione Enter para sair...")

if __name__ == "__main__":
    main()

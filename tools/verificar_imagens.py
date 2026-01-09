#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verificador Rápido de Imagens
Apenas verifica quantidade e nomes das imagens
"""

import os
import csv

class FastImageChecker:
    def __init__(self):
        self.csv_file = '../data/products.csv'
        self.image_folder = '../images/products/thumbnail'
    
    def load_products(self):
        """Carrega produtos do CSV"""
        products = []
        
        if not os.path.exists(self.csv_file):
            print(f"ERRO: CSV não encontrado: {self.csv_file}")
            return products
        
        try:
            with open(self.csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f, delimiter=';')
                
                for row in reader:
                    if row.get('codigo') and row.get('nome'):
                        imagem = row.get('imagem', f"{row['codigo'].strip()}.webp").strip()
                        products.append({
                            'codigo': row['codigo'].strip(),
                            'nome': row['nome'].strip(),
                            'imagem': imagem
                        })
        
        except Exception as e:
            print(f"ERRO ao ler CSV: {e}")
            return products
        
        return products
    
    def check_images(self):
        """Verifica quais imagens existem"""
        products = self.load_products()
        
        if not products:
            print("Nenhum produto encontrado!")
            return
        
        print(f"Verificando {len(products)} produtos...")
        print("="*60)
        
        existing = []
        missing = []
        small_files = []
        
        for product in products:
            image_path = os.path.join(self.image_folder, product['imagem'])
            
            if os.path.exists(image_path):
                file_size = os.path.getsize(image_path)
                if file_size < 5000:  # Menos de 5KB
                    small_files.append(product)
                else:
                    existing.append(product)
            else:
                missing.append(product)
        
        # Gerar relatório em TXT
        self.generate_report(products, existing, missing, small_files)
        
        # Resultados na tela
        print(f"✓ Imagens existentes: {len(existing)}")
        print(f"✗ Imagens faltando: {len(missing)}")
        print(f"⚠ Imagens muito pequenas: {len(small_files)}")
        
        if missing:
            print(f"\nIMAGENS FALTANDO ({len(missing)}):")
            for i, product in enumerate(missing[:20]):  # Primeiras 20
                print(f"  {i+1}. {product['imagem']} - {product['nome']}")
            
            if len(missing) > 20:
                print(f"  ... e mais {len(missing) - 20}")
        
        if small_files:
            print(f"\nIMAGENS MUITO PEQUENAS ({len(small_files)}):")
            for i, product in enumerate(small_files[:10]):  # Primeiras 10
                file_size = os.path.getsize(os.path.join(self.image_folder, product['imagem']))
                print(f"  {i+1}. {product['imagem']} - {file_size} bytes")
        
        print("\n" + "="*60)
        print(f"TOTAL: {len(products)} produtos")
        print(f"COM IMAGEM: {len(existing)} ({len(existing)/len(products)*100:.1f}%)")
        print(f"SEM IMAGEM: {len(missing)} ({len(missing)/len(products)*100:.1f}%)")
        print("="*60)
        print(f"\n📄 Relatório salvo em: relatorio_imagens.txt")
    
    def generate_report(self, products, existing, missing, small_files):
        """Gera relatório detalhado em TXT"""
        from datetime import datetime
        
        report_file = 'relatorio_imagens.txt'
        
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write("="*80 + "\n")
            f.write("RELATÓRIO DE IMAGENS DOS PRODUTOS\n")
            f.write("="*80 + "\n")
            f.write(f"Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}\n")
            f.write(f"Arquivo CSV: {self.csv_file}\n")
            f.write(f"Pasta Imagens: {self.image_folder}\n")
            f.write("\n")
            
            # Resumo
            f.write("RESUMO GERAL\n")
            f.write("-" * 40 + "\n")
            f.write(f"Total de Produtos: {len(products)}\n")
            f.write(f"Imagens Existentes: {len(existing)} ({len(existing)/len(products)*100:.1f}%)\n")
            f.write(f"Imagens Faltando: {len(missing)} ({len(missing)/len(products)*100:.1f}%)\n")
            f.write(f"Imagens Pequenas (<5KB): {len(small_files)} ({len(small_files)/len(products)*100:.1f}%)\n")
            f.write("\n")
            
            # Imagens existentes
            if existing:
                f.write("IMAGENS EXISTENTES\n")
                f.write("-" * 40 + "\n")
                for i, product in enumerate(existing, 1):
                    image_path = os.path.join(self.image_folder, product['imagem'])
                    file_size = os.path.getsize(image_path)
                    f.write(f"{i:3d}. {product['imagem']} - {file_size//1024}KB - {product['codigo']} - {product['nome']}\n")
                f.write("\n")
            
            # Imagens faltando
            if missing:
                f.write("IMAGENS FALTANDO\n")
                f.write("-" * 40 + "\n")
                for i, product in enumerate(missing, 1):
                    f.write(f"{i:3d}. {product['imagem']} - {product['codigo']} - {product['nome']}\n")
                f.write("\n")
            
            # Imagens pequenas
            if small_files:
                f.write("IMAGENS MUITO PEQUENAS (<5KB)\n")
                f.write("-" * 40 + "\n")
                for i, product in enumerate(small_files, 1):
                    image_path = os.path.join(self.image_folder, product['imagem'])
                    file_size = os.path.getsize(image_path)
                    f.write(f"{i:3d}. {product['imagem']} - {file_size} bytes - {product['codigo']} - {product['nome']}\n")
                f.write("\n")
            
            # Estatísticas por categoria (se houver)
            f.write("ESTATÍSTICAS\n")
            f.write("-" * 40 + "\n")
            
            # Contar por tipo de produto
            categories = {}
            for product in products:
                nome_lower = product['nome'].lower()
                categoria = 'outros'
                
                if 'monitor' in nome_lower:
                    categoria = 'monitores'
                elif 'mouse' in nome_lower:
                    categoria = 'mouses'
                elif 'notebook' in nome_lower or 'laptop' in nome_lower:
                    categoria = 'notebooks'
                elif 'roteador' in nome_lower or 'router' in nome_lower:
                    categoria = 'roteadores'
                elif 'teclado' in nome_lower or 'keyboard' in nome_lower:
                    categoria = 'teclados'
                elif 'headset' in nome_lower or 'fone' in nome_lower:
                    categoria = 'fones'
                elif 'impressora' in nome_lower:
                    categoria = 'impressoras'
                elif 'celular' in nome_lower:
                    categoria = 'celulares'
                elif 'hd' in nome_lower or 'ssd' in nome_lower:
                    categoria = 'hd/ssd'
                elif 'placa' in nome_lower:
                    categoria = 'placas'
                
                if categoria not in categories:
                    categories[categoria] = {'total': 0, 'com_imagem': 0, 'sem_imagem': 0}
                
                categories[categoria]['total'] += 1
                
                # Verificar se tem imagem
                if product in existing:
                    categories[categoria]['com_imagem'] += 1
                else:
                    categories[categoria]['sem_imagem'] += 1
            
            for categoria, stats in sorted(categories.items()):
                total = stats['total']
                com_imagem = stats['com_imagem']
                sem_imagem = stats['sem_imagem']
                percent = (com_imagem / total * 100) if total > 0 else 0
                f.write(f"{categoria.capitalize()}: {com_imagem}/{total} ({percent:.1f}%)\n")
            
            f.write("\n")
            f.write("="*80 + "\n")
            f.write("FIM DO RELATÓRIO\n")
            f.write("="*80 + "\n")

def main():
    print("="*60)
    print("   VERIFICADOR RÁPIDO DE IMAGENS")
    print("="*60)
    print("Verificação instantânea de imagens dos produtos")
    print("="*60)
    print()
    
    checker = FastImageChecker()
    checker.check_images()

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Upload para GitHub
Faz upload do site e dos scripts para o GitHub
"""

import os
import subprocess
import json
from datetime import datetime

class GitHubUploader:
    def __init__(self):
        self.site_dir = '..'  # Diretório do site
        self.scripts_dir = '.'  # Diretório dos scripts (tools)
        
    def check_git_status(self):
        """Verifica status do repositório Git"""
        try:
            # Mudar para o diretório raiz
            os.chdir('..')
            
            # Verificar se é um repositório Git
            result = subprocess.run(['git', 'status'], 
                                  capture_output=True, text=True, cwd='..')
            
            if result.returncode == 0:
                print("✅ Repositório Git encontrado")
                return True
            else:
                print("❌ Este não é um repositório Git")
                return False
                
        except Exception as e:
            print(f"❌ Erro ao verificar Git: {e}")
            return False
    
    def configure_git_if_needed(self):
        """Configura Git se necessário"""
        try:
            # Verificar se tem usuário configurado
            result = subprocess.run(['git', 'config', '--global', 'user.name'], 
                                  capture_output=True, text=True)
            
            if not result.stdout.strip():
                print("⚠️  Git não configurado. Configurando...")
                
                # Pedir informações do usuário
                name = input("Digite seu nome no GitHub: ").strip()
                email = input("Digite seu email no GitHub: ").strip()
                
                # Configurar Git
                subprocess.run(['git', 'config', '--global', 'user.name', name], check=True)
                subprocess.run(['git', 'config', '--global', 'user.email', email], check=True)
                
                print("✅ Git configurado com sucesso!")
            
            return True
            
        except Exception as e:
            print(f"❌ Erro ao configurar Git: {e}")
            return False
    
    def check_github_cli(self):
        """Verifica se tem GitHub CLI"""
        try:
            result = subprocess.run(['gh', '--version'], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0:
                print("✅ GitHub CLI encontrado")
                return True
            else:
                print("❌ GitHub CLI não encontrado")
                return False
                
        except FileNotFoundError:
            print("❌ GitHub CLI não encontrado")
            return False
    
    def install_github_cli(self):
        """Instala GitHub CLI"""
        try:
            print("📦 Instalando GitHub CLI...")
            
            # Tentar instalar com pip
            subprocess.run(['pip', 'install', 'github-cli'], check=True)
            print("✅ GitHub CLI instalado com sucesso!")
            return True
            
        except subprocess.CalledProcessError:
            print("❌ Falha ao instalar GitHub CLI com pip")
            return False
    
    def authenticate_github(self):
        """Autentica no GitHub"""
        try:
            print("🔐 Autenticando no GitHub...")
            
            # Tentar autenticar
            result = subprocess.run(['gh', 'auth', 'login'], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0:
                print("✅ Autenticado com sucesso!")
                return True
            else:
                print("❌ Falha na autenticação")
                print("Por favor, execute: gh auth login")
                return False
                
        except Exception as e:
            print(f"❌ Erro na autenticação: {e}")
            return False
    
    def create_github_repo_if_needed(self, repo_name):
        """Cria repositório no GitHub se não existir"""
        try:
            print(f"📁 Verificando repositório: {repo_name}")
            
            # Tentar criar repositório (se já existir, vai falhar)
            result = subprocess.run(['gh', 'repo', 'create', repo_name, 
                                  '--public', '--description', 'Loja Primos Informatica'],
                                  capture_output=True, text=True)
            
            if result.returncode == 0:
                print(f"✅ Repositório {repo_name} criado com sucesso!")
                return True
            else:
                if "already exists" in result.stderr.lower():
                    print(f"✅ Repositório {repo_name} já existe!")
                    return True
                else:
                    print(f"❌ Erro ao criar repositório: {result.stderr}")
                    return False
                    
        except Exception as e:
            print(f"❌ Erro ao criar repositório: {e}")
            return False
    
    def add_and_commit_changes(self, message):
        """Adiciona e comita mudanças"""
        try:
            print("📝 Adicionando arquivos...")
            
            # Adicionar todos os arquivos
            subprocess.run(['git', 'add', '.'], check=True, cwd='..')
            
            print("💾 Fazendo commit...")
            
            # Fazer commit
            subprocess.run(['git', 'commit', '-m', message], check=True, cwd='..')
            
            print("✅ Commit realizado com sucesso!")
            return True
            
        except Exception as e:
            print(f"❌ Erro no commit: {e}")
            return False
    
    def push_to_github(self, branch='main'):
        """Envia mudanças para o GitHub"""
        try:
            print(f"🚀 Enviando para GitHub (branch: {branch})...")
            
            # Push para o GitHub
            result = subprocess.run(['git', 'push', 'origin', branch], 
                                  capture_output=True, text=True, cwd='..')
            
            if result.returncode == 0:
                print("✅ Enviado para GitHub com sucesso!")
                return True
            else:
                print(f"❌ Erro no push: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Erro no push: {e}")
            return False
    
    def upload_site_and_scripts(self):
        """Faz upload completo do site e scripts"""
        print("="*80)
        print("   UPLOAD PARA GITHUB")
        print("="*80)
        print("Fazendo upload do site e scripts para o GitHub...")
        print("="*80)
        
        # 1. Verificar status do Git
        if not self.check_git_status():
            print("❌ Não é um repositório Git. Execute 'git init' primeiro.")
            return False
        
        # 2. Configurar Git se necessário
        if not self.configure_git_if_needed():
            return False
        
        # 3. Verificar GitHub CLI
        if not self.check_github_cli():
            if not self.install_github_cli():
                print("❌ Não foi possível instalar GitHub CLI")
                return False
        
        # 4. Autenticar no GitHub
        if not self.authenticate_github():
            return False
        
        # 5. Criar repositório se necessário
        repo_name = "minha-loja"
        if not self.create_github_repo_if_needed(repo_name):
            return False
        
        # 6. Adicionar e comitar mudanças
        timestamp = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        commit_message = f"Upload automático - {timestamp}"
        
        if not self.add_and_commit_changes(commit_message):
            return False
        
        # 7. Enviar para GitHub
        if not self.push_to_github():
            return False
        
        print("\n" + "="*80)
        print("✅ UPLOAD CONCLUÍDO COM SUCESSO!")
        print("="*80)
        print(f"📁 Site e scripts enviados para: https://github.com/SEU_USUARIO/{repo_name}")
        print("🌐 Seu site está disponível em: https://SEU_USUARIO.github.io/" + repo_name)
        print("="*80)
        
        return True

def main():
    print("="*80)
    print("   UPLOAD PARA GITHUB")
    print("="*80)
    print("Este script vai:")
    print("- Verificar configuração Git")
    print("- Instalar GitHub CLI se necessário")
    print("- Autenticar no GitHub")
    print("- Fazer upload do site completo")
    print("- Fazer upload dos scripts")
    print("="*80)
    print()
    
    uploader = GitHubUploader()
    
    # Mudar para o diretório correto
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    success = uploader.upload_site_and_scripts()
    
    if success:
        print("\n🎉 Upload realizado com sucesso!")
    else:
        print("\n❌ Falha no upload!")
    
    print("\nPressione Enter para sair...")
    input()

if __name__ == "__main__":
    main()

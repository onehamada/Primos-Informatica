@echo off
cls
title Baixar Imagens - Primos Informatica

echo ============================================
echo   BAIXAR IMAGENS - Primos Informatica
echo ============================================
echo.
echo Este script vai baixar imagens do Google Images
echo para os produtos que estao faltando no seu CSV.
echo.
echo ============================================
echo.

echo [PASSO 1] Verificando Python...
python --version
if errorlevel 1 (
    echo.
    echo ============================================
    echo ERRO: Python nao encontrado!
    echo ============================================
    echo.
    echo Voce precisa instalar Python primeiro:
    echo 1. Acesse: https://www.python.org/downloads/
    echo 2. Baixe e instale o Python
    echo 3. MARQUE a opcao "Add Python to PATH"
    echo 4. Execute este script novamente
    echo.
    echo ============================================
    pause
    exit /b 1
)

echo.
echo [PASSO 2] Verificando pasta atual...
echo Pasta atual: %CD%
if not "%CD:~-5%"=="tools" (
    echo AVISO: Voce nao esta na pasta tools!
    echo Navegue para a pasta tools antes de executar.
    echo.
)

echo.
echo [PASSO 3] Instalando dependencias...
echo Isso pode demorar um pouco...
echo.
pip install pillow selenium webdriver-manager requests

if errorlevel 1 (
    echo.
    echo ============================================
    echo ERRO: Falha ao instalar dependencias!
    echo ============================================
    echo.
    echo Possiveis solucoes:
    echo 1. Execute como administrador
    echo 2. Verifique sua conexao com internet
    echo 3. Tente: pip install --upgrade pip
    echo.
    echo ============================================
    pause
    exit /b 1
)

echo.
echo [PASSO 4] Iniciando baixador de imagens...
echo.
python baixar_imagens.py

echo.
echo ============================================
echo SCRIPT CONCLUIDO!
echo ============================================
echo.
echo Verifique os arquivos gerados:
echo - imagens_baixadas.txt
echo - imagens_falhas.txt
echo.
echo As imagens foram salvas em: images\products\thumbnail\
echo.
echo ============================================
pause

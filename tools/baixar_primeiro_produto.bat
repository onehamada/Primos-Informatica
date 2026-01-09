@echo off
cls
title Download SUPER PERSISTENTE V2 - Todas as Imagens

echo ================================================================
echo   DOWNLOAD SUPER PERSISTENTE V2 - TODAS AS IMAGENS
echo ================================================================
echo.
echo FAZ DE TUDO para baixar TODAS as imagens faltantes:
echo ✅ Metodo 1: Requests direto no Google - MELHORADO com 3 headers
echo ✅ Metodo 2: Selenium no Google Images - CORRIGIDO sem erros
echo ✅ Metodo 3: Fontes alternativas - EXPANDIDO com Mercado Livre + AliExpress
echo ✅ Metodo 4: Busca direta por produto - EXPANDIDO com + fontes e termos
echo - NAO DESISTE JAMAIS!
echo - Processa TODOS os produtos sem imagem
echo - OTIMIZADO para maxima eficiencia!
echo.
echo VAI baixar TUDO - Versao 2.0!
echo ================================================================
echo.

cd /d "%~dp0"

echo [1] Verificando Python...
python --version
if errorlevel 1 (
    echo.
    echo ERRO: Python nao encontrado!
    pause
    exit /b 1
)

echo.
echo [2] Instalando TUDO que precisa...
pip install --quiet pillow requests selenium webdriver-manager

echo.
echo [3] INICIANDO ATAQUE PERSISTENTE TOTAL V2...
echo.
python baixar_primeiro_produto.py

echo.
echo ================================================================
echo ATAQUE PERSISTENTE TOTAL V2 CONCLUIDO!
echo ================================================================
echo.
echo Tentou DE TUDO para TODAS as imagens faltantes!
echo Verifique o resultado na pasta products/thumbnail/
echo.
echo ================================================================
pause

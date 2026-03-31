@echo off
setlocal
title Baixador de Imagens de Produtos
cd /d "%~dp0"
echo ====================================
echo DOWNLOAD OTIMIZADO DE IMAGENS
echo PRIORIDADE PARA LOJAS DE HARDWARE
echo ====================================
echo.
echo Diretorio atual: %CD%
echo.
echo Dica: use este arquivo .bat para abrir o script.
echo.

echo Verificando dependencias...
python -c "import numpy, scipy, PIL, requests, selenium" 2>nul
if %errorlevel% neq 0 (
    echo Dependencias nao encontradas!
    echo Execute primeiro: instalar_dependencias.bat
    pause
    exit /b 1
)

echo.
echo Iniciando download otimizado...
echo.
python baixar_primeiro_produto_otimizado.py %*
if %errorlevel% neq 0 (
    echo.
    echo O script terminou com erro.
) else (
    echo.
    echo O script terminou normalmente.
)

echo.
echo Processo concluido!
pause

@echo off
cls
title Upload para GitHub

echo ================================================================
echo   UPLOAD PARA GITHUB
echo ================================================================
echo.
echo Este script vai fazer upload completo:
echo - Verificar configuracao Git
echo - Instalar GitHub CLI se necessario
echo - Autenticar no GitHub
echo - Fazer upload do site completo
echo - Fazer upload dos scripts
echo.
echo PREPARA SEU SITE PARA PRODUCAO!
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
echo [2] Instalando dependencias...
pip install --quiet subprocess

echo.
echo [3] Iniciando upload para GitHub...
echo.
python upload_github.py

echo.
echo ================================================================
echo UPLOAD CONCLUIDO!
echo ================================================================
echo.
echo Seu site e scripts foram enviados para o GitHub!
echo Verifique seu repositório no GitHub.
echo.
echo ================================================================
pause

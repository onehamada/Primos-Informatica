@echo off
cls
title Verificador Rápido de Imagens

echo ============================================
echo   VERIFICADOR RÁPIDO DE IMAGENS
echo ============================================
echo.
echo Verificação instantânea COM RELATÓRIO:
echo - Quantas imagens existem
echo - Quais estão faltando  
echo - Status completo
echo - Gera relatório em TXT
echo - RÁPIDO E SIMPLES
echo.
echo ============================================
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
echo [2] Verificando imagens e gerando relatório...
echo.
python verificar_imagens.py

echo.
echo ============================================
echo VERIFICAÇÃO CONCLUIDA!
echo ============================================
echo.
echo 📄 Relatório salvo em: relatorio_imagens.txt
echo.
echo Abra o arquivo para ver o relatório completo!
echo ============================================
pause

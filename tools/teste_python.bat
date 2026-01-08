@echo off
cls
title Teste Python

echo ============================================
echo   TESTE PYTHON - Primos Informatica
echo ============================================
echo.

echo Verificando se Python esta instalado...
echo.

python --version

if errorlevel 1 (
    echo.
    echo ============================================
    echo ERRO: Python nao encontrado!
    echo ============================================
    echo.
    echo Solucao:
    echo 1. Va para https://www.python.org/downloads/
    echo 2. Baixe o Python 3.11 ou superior
    echo 3. INSTALE MARCANDO "Add Python to PATH"
    echo 4. Abra NOVO prompt de comando e teste novamente
    echo.
    echo ============================================
) else (
    echo.
    echo ============================================
    echo SUCESSO: Python esta funcionando!
    echo ============================================
    echo.
    echo Agora voce pode executar:
    echo - baixar_imagens.bat
    echo.
)

echo.
pause

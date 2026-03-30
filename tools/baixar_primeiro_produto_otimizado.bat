@echo off
cd /d "%~dp0"
echo ====================================
echo DOWNLOAD OTIMIZADO DE IMAGENS
echo COM DETECAO E REMOCAO DE FUNDO PRETO
echo ====================================
echo.
echo Diretorio atual: %CD%
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

echo.
echo Processo concluido!
pause

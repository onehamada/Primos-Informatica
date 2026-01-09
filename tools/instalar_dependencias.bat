@echo off
cd /d "%~dp0"
echo ====================================
echo INSTALANDO DEPENDENCIAS DO SCRIPT
echo ====================================
echo.
echo Diretorio atual: %CD%
echo.

echo Verificando Python...
python --version
if %errorlevel% neq 0 (
    echo ERRO: Python nao encontrado!
    echo Por favor, instale Python em https://python.org
    pause
    exit /b 1
)

echo.
echo Instalando dependencias...
pip install -r requirements.txt

if %errorlevel% equ 0 (
    echo.
    echo ====================================
    echo SUCESSO! Dependencias instaladas
    echo ====================================
    echo.
    echo Agora voce pode executar:
    echo baixar_primeiro_produto_otimizado.bat
) else (
    echo.
    echo ====================================
    echo ERRO! Falha na instalacao
    echo ====================================
)

echo.
pause

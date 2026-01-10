@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   Teste Simplificado - Upload de Imagens
echo ============================================
echo.

set CSV_FILE=..\data\products.csv
set IMAGE_FOLDER=..\images\products\thumbnail

if not exist "%CSV_FILE%" (
    echo ERRO: Arquivo CSV nao encontrado: %CSV_FILE%
    pause
    exit /b 1
)

echo Verificando produtos...
set count=0

for /f "skip=1 tokens=1,8 delims=;" %%a in ('type "%CSV_FILE%"') do (
    set /a count+=1
    set "codigo=%%a"
    set "imagem=%%b"
    
    echo Produto !count!: !codigo! - Imagem: !imagem!
    
    if "!imagem!"=="" (
        set "imagem=!codigo!.webp"
    )
    
    if not exist "%IMAGE_FOLDER%\!imagem!" (
        echo FALTA: !imagem!
    ) else (
        echo OK: !imagem!
    )
)

echo.
echo Total de produtos verificados: !count!
pause

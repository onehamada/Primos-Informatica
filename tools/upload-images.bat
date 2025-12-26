@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   Ferramenta de Upload de Imagens de Produtos
echo ============================================
echo.

:: Configurações
set CSV_FILE=..\data\products.csv
set IMAGE_FOLDER=..\images\products\thumbnail
set MISSING_IMAGES=missing_images.txt

:: Verificar se CSV existe
if not exist "%CSV_FILE%" (
    echo ERRO: Arquivo CSV nao encontrado: %CSV_FILE%
    echo.
    pause
    exit /b 1
)

:: Verificar se pasta de imagens existe
if not exist "%IMAGE_FOLDER%" (
    echo ERRO: Pasta de imagens nao encontrada: %IMAGE_FOLDER%
    echo.
    pause
    exit /b 1
)

:: Limpar arquivo anterior
if exist "%MISSING_IMAGES%" del "%MISSING_IMAGES%"

echo Analisando produtos no CSV...
echo.

:: Ler CSV e extrair nomes de imagens
set count=0
set missing_count=0

:: Pular primeira linha (cabeçalho)
for /f "skip=1 tokens=1,9 delims=;" %%a in ('type "%CSV_FILE%"') do (
    set /a count+=1
    set "codigo=%%a"
    set "imagem=%%b"
    
    :: Remover espaços em branco
    set "codigo=!codigo: =!"
    set "imagem=!imagem: =!"
    
    if "!imagem!"=="" (
        :: Se não tem imagem, usar código
        set "imagem=!codigo!.webp"
    )
    
    :: Verificar se arquivo existe
    if not exist "%IMAGE_FOLDER%\!imagem!" (
        echo FALTA: !imagem! (Produto: !codigo!)
        echo !imagem! >> "%MISSING_IMAGES%"
        set /a missing_count+=1
    ) else (
        echo OK: !imagem!
    )
)

echo.
echo ============================================
echo   Resumo da Analise
echo ============================================
echo Total de produtos: %count%
echo Imagens faltando: %missing_count%

if %missing_count% gtr 0 (
    echo.
    echo Imagens que faltam estao salvas em: %MISSING_IMAGES%
    echo.
    echo Abrindo pasta de imagens...
    explorer "%IMAGE_FOLDER%"
    echo.
    echo Copie suas imagens para a pasta e renomeie conforme a lista acima.
    echo.
    echo Dicas:
    echo - Formato aceito: .webp
    echo - Tamanho recomendado: 150x150px
    echo - Nome deve ser exatamente como mostrado acima
    echo.
    
    set /p choice="Deseja verificar novamente? (S/N): "
    if /i "!choice!"=="S" goto :inicio
) else (
    echo.
    echo PARABENS! Todas as imagens estao presentes!
    echo.
    echo Voce pode fazer o upload para o GitHub agora.
)

echo.
pause
exit /b 0

:inicio
cls
goto :eof

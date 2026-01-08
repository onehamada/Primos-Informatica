@echo off
echo 🖼️  Instalando dependências para Download de Imagens de Produtos
echo ========================================================

echo.
echo 📦 Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python não encontrado! Por favor, instale Python primeiro.
    echo 📥 Download: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Python encontrado
echo.

echo 📦 Instalando bibliotecas necessárias...
echo.

pip install requests pillow

if errorlevel 1 (
    echo.
    echo ❌ Erro na instalação! Tente executar como administrador.
    echo 💡 Ou execute manualmente: pip install requests pillow
    pause
    exit /b 1
)

echo.
echo ✅ Dependências instaladas com sucesso!
echo.
echo 🚀 Para usar o script:
echo    1. Prepare seu arquivo CSV/TXT com produtos
echo    2. Execute: python image_downloader.py
echo    3. Informe o caminho do arquivo
echo.
echo 📁 As imagens serão salvas em: images/products/thumbnail/
echo.

pause

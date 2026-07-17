$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$productsPath = Join-Path $repoRoot 'data/products.json'
$project = 'primos-informatica-ecommerce'
$apiKey = 'AIzaSyAvJUdjnY7xjnlTSYJAQZ6safylKXKlzLc'

if (-not (Test-Path $productsPath)) {
    throw "Arquivo de produtos não encontrado: $productsPath"
}

$products = Get-Content $productsPath -Raw | ConvertFrom-Json
$products = @($products)

Write-Host "Sincronizando $($products.Count) produtos para o Firestore..."

$success = 0
$failures = 0

foreach ($index in 0..($products.Count - 1)) {
    $product = $products[$index]
    $docId = [string]($product.codigo)
    $escapedDocId = [System.Uri]::EscapeDataString($docId)
    $url = "https://firestore.googleapis.com/v1/projects/$project/databases/(default)/documents/products/$escapedDocId?key=$apiKey"

    $body = @{
        fields = @{
            codigo = @{ stringValue = [string]($product.codigo) }
            nome = @{ stringValue = [string]($product.nome) }
            categoria = @{ stringValue = [string]($product.categoria).ToLower() }
            preco = @{ doubleValue = [double]($product.preco) }
            qt = @{ integerValue = [string]([int]($product.qt)) }
            descricao = @{ stringValue = [string]($product.descricao) }
            marca = @{ stringValue = [string]($product.marca) }
            promocao = @{ booleanValue = ([string]($product.promocao) -eq 'sim') }
            imagem = @{ stringValue = [string]($product.imagem) }
            modelo = @{ stringValue = [string]($product.modelo) }
            origem = @{ stringValue = [string]($product.origem) }
            ativo = @{ booleanValue = ([string]($product.ativo) -ne 'não') }
        }
    }

    try {
        $null = Invoke-RestMethod -Uri $url -Method Patch -Headers @{ Accept = 'application/json' } -ContentType 'application/json' -Body ($body | ConvertTo-Json -Depth 10)
        $success++
    }
    catch {
        $failures++
        Write-Warning ("Falha ao sincronizar {0}: {1}" -f $docId, $_.Exception.Message)
    }

    if ($index % 25 -eq 0 -or $index -eq ($products.Count - 1)) {
        Write-Host ("Progresso: {0}/{1} produtos processados" -f ($index + 1), $products.Count)
    }

    Start-Sleep -Milliseconds 200
}

Write-Host "Finalizado. Sucesso=$success Falhas=$failures"

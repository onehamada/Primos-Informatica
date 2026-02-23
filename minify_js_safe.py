import re

# Ler o arquivo JavaScript
with open('js/script.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

# Minificação mais segura - preservando quebras de linha importantes
minified = js_content
# Remover linhas de DEBUG console.log
minified = re.sub(r'^\s*DEBUG && console\.log.*;\s*\n?', '', minified, flags=re.MULTILINE)
# Remover comentários de uma linha (mas preservar URLs)
minified = re.sub(r'(?<!http:|https:)//.*$', '', minified, flags=re.MULTILINE)
# Remover comentários de múltiplas linhas
minified = re.sub(r'/\*.*?\*/', '', minified, flags=re.DOTALL)
# Remover espaços em branco extras (mas manter estrutura básica)
minified = re.sub(r'[ \t]+', ' ', minified)
# Remover espaços em branco no início e fim das linhas
minified = re.sub(r'^[ \t]+|[ \t]+$', '', minified, flags=re.MULTILINE)
# Remover linhas vazias extras
minified = re.sub(r'\n\s*\n', '\n', minified)
# Remover espaços antes e depois de operadores (mas não em strings)
minified = re.sub(r'(?<=[\w\d])\s*([=+\-*/%<>&|,;{}()[\]])\s*', r'\1', minified)
minified = re.sub(r'([=+\-*/%<>&|,;{}()[\]])\s*(?=[\w\d])', r'\1', minified)

# Salvar arquivo minificado
with open('js/script.js', 'w', encoding='utf-8') as f:
    f.write(minified)

print('JavaScript minificado com segurança!')
print(f'Tamanho original: {len(js_content)} bytes')
print(f'Tamanho minificado: {len(minified)} bytes')
print(f'Redução: {((len(js_content) - len(minified)) / len(js_content) * 100):.2f}%')

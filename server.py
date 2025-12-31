import http.server
import socketserver
import os

# Mudar para o diretório do projeto
project_dir = r"c:\Users\Primos Informatica\Documents\Vscode\primosinformatica\minha-loja"
os.chdir(project_dir)

# Criar o servidor
handler = http.server.SimpleHTTPRequestHandler
httpd = socketserver.TCPServer(('127.0.0.1', 8080), handler)

print('Servidor rodando em http://localhost:8080')
print('Diretório atual:', os.getcwd())
print('Arquivos no diretório:')
for file in os.listdir('.'):
    if file.endswith('.html') or file.endswith('.css') or file.endswith('.js'):
        print(f'  - {file}')

# Iniciar servidor
httpd.serve_forever()

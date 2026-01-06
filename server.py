import http.server
import socketserver
import os

# Mudar para o diretório do projeto
project_dir = r"c:\Users\Primos Informatica\Documents\Vscode\primosinformatica\minha-loja"
os.chdir(project_dir)

# Custom handler para UTF-8
class UTF8HTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs, directory='.')

    def send_response(self, code, message=None):
        super().send_response(code, message)
        
        # Enviar charset UTF-8 para diferentes tipos de arquivo
        if self.path.endswith('.html'):
            self.send_header('Content-Type', 'text/html; charset=utf-8')
        elif self.path.endswith('.css'):
            self.send_header('Content-Type', 'text/css; charset=utf-8')
        elif self.path.endswith('.js'):
            self.send_header('Content-Type', 'application/javascript; charset=utf-8')
        elif self.path.endswith('.csv'):
            self.send_header('Content-Type', 'text/csv; charset=utf-8')
        elif self.path.endswith('.json'):
            self.send_header('Content-Type', 'application/json; charset=utf-8')

# Criar o servidor
handler = UTF8HTTPRequestHandler
httpd = socketserver.TCPServer(('127.0.0.1', 8080), handler)

print('Servidor rodando em http://localhost:8080')
print('Diretório atual:', os.getcwd())
print('Arquivos no diretório:')
for file in os.listdir('.'):
    if file.endswith('.html') or file.endswith('.css') or file.endswith('.js'):
        print(f'  - {file}')

# Iniciar servidor
httpd.serve_forever()

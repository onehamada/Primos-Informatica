import http.server
import socketserver
import os
import sys

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        # Adicionar headers CORS
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        # Servir o arquivo index.html para a raiz
        if self.path == '/' or self.path == '':
            try:
                with open('index.html', 'r', encoding='utf-8') as f:
                    self.wfile.write(f.read().encode('utf-8'))
                return
            except FileNotFoundError:
                self.send_error(404, "File not found")
                return
        
        # Para outros arquivos, usar o comportamento padrão
        super().do_GET()

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"Servidor rodando em http://localhost:{PORT}")
        print("Pressione Ctrl+C para parar")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor encerrado")
            sys.exit(0)

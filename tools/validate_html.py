from html.parser import HTMLParser
import os
p = r'c:\Users\Primos Informatica\Documents\Vscode\primosinformatica\minha-loja\src\index.html'
with open(p, encoding='utf-8') as f:
    text = f.read()

class My(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.issues = []
    def handle_starttag(self, tag, attrs):
        if tag in ('img','meta','link','br','input','hr'):
            return
        self.stack.append((tag, self.getpos()))
    def handle_endtag(self, tag):
        if not self.stack:
            self.issues.append(f"Unexpected closing </{tag}> at line {self.getpos()[0]}")
            return
        last, pos = self.stack.pop()
        if last != tag:
            self.issues.append(f"Mismatched tag </{tag}> at line {self.getpos()[0]} closes <{last}> opened at line {pos[0]}")

parser = My()
parser.feed(text)

if parser.issues:
    print('ISSUES:')
    for i in parser.issues:
        print(i)
else:
    if parser.stack:
        print('Unclosed tags:')
        for tag, pos in parser.stack:
            print(f"<{tag}> opened at line {pos[0]} not closed")
    else:
        print('No structural issues found')

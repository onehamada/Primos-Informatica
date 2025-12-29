from PIL import Image


def main():
    src = 'src/images/logo.png'

    img = Image.open(src).convert('RGBA')

    # Recorta pelo alpha (caso ainda tenha bordas transparentes)
    bbox = img.getchannel('A').getbbox()
    if bbox:
        img = img.crop(bbox)

    # Gera PNG 32x32
    png32 = img.copy()
    png32.thumbnail((32, 32), Image.LANCZOS)
    out_png32 = 'src/favicon-32x32.png'
    png32.save(out_png32, 'PNG', optimize=True)

    # Gera ICO com múltiplos tamanhos
    out_ico = 'src/favicon.ico'
    ico_base = img.copy()
    ico_base.thumbnail((256, 256), Image.LANCZOS)
    ico_base.save(out_ico, format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])

    print('OK:', out_png32)
    print('OK:', out_ico)


if __name__ == '__main__':
    main()

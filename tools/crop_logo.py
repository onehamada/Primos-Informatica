from PIL import Image
from collections import deque


def main():
    path = 'src/images/logo.png'
    img = Image.open(path).convert('RGBA')
    px = img.load()
    w, h = img.size

    # Considera como fundo "quase branco" (tolerância)
    th = 245

    def is_bg(x, y):
        r, g, b, a = px[x, y]
        return a > 0 and r >= th and g >= th and b >= th

    # Flood-fill do fundo conectado às bordas, para não apagar brancos internos do desenho
    mask = [[False] * w for _ in range(h)]
    q = deque()

    for x in range(w):
        if is_bg(x, 0):
            mask[0][x] = True
            q.append((x, 0))
        if is_bg(x, h - 1):
            mask[h - 1][x] = True
            q.append((x, h - 1))

    for y in range(h):
        if is_bg(0, y):
            mask[y][0] = True
            q.append((0, y))
        if is_bg(w - 1, y):
            mask[y][w - 1] = True
            q.append((w - 1, y))

    while q:
        x, y = q.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and (not mask[ny][nx]) and is_bg(nx, ny):
                mask[ny][nx] = True
                q.append((nx, ny))

    # Aplica transparência no fundo
    for y in range(h):
        row = mask[y]
        for x in range(w):
            if row[x]:
                r, g, b, _ = px[x, y]
                px[x, y] = (r, g, b, 0)

    # Recorta para o conteúdo
    bbox = img.getchannel('A').getbbox()
    if bbox:
        img = img.crop(bbox)

    img.save(path, 'PNG', optimize=True)
    print(f'OK: {path} -> {img.size}')


if __name__ == '__main__':
    main()

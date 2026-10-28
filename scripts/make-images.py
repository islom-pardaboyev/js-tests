"""Draws the PNG icons from the JSTests mark. The share image comes from scripts/og-image.html
(see scripts/make-og.mjs). Run: python3 scripts/make-images.py   (needs Pillow)"""
from PIL import Image, ImageDraw

TILE, INK, AMBER, BLUE, TEAL = (20, 22, 26), (244, 242, 236), (240, 180, 90), (91, 125, 255), (23, 165, 138)

def mark(draw, cx, cy, u):
    pts = [(cx + x * u, cy + y * u) for x, y in [(-24, -20), (-3, 0), (-24, 20)]]
    w = 9 * u
    draw.line(pts, fill=INK, width=int(w), joint='curve')
    for x, y in pts:
        draw.ellipse((x - w / 2, y - w / 2, x + w / 2, y + w / 2), fill=INK)
    draw.rounded_rectangle((cx + 6 * u, cy + 12 * u, cx + 32 * u, cy + 21 * u), radius=4.5 * u, fill=AMBER)
    for x, y, r, col in [(14, -14, 3, BLUE), (26, -14, 4.5, TEAL)]:
        draw.ellipse((cx + (x - r) * u, cy + (y - r) * u, cx + (x + r) * u, cy + (y + r) * u), fill=col)

def icon(size, path, maskable=False):
    big = size * 4
    im = Image.new('RGBA', (big, big), (0, 0, 0, 0)); g = ImageDraw.Draw(im)
    g.rounded_rectangle((0, 0, big, big), radius=0 if maskable else int(big * 0.26), fill=TILE + (255,))
    mark(g, big / 2, big / 2, big / 100 * (0.8 if maskable else 1.0))
    im.resize((size, size), Image.LANCZOS).save(path, optimize=True)

icon(32, 'public/favicon-32.png'); icon(180, 'public/apple-touch-icon.png'); icon(192, 'public/icon-192.png'); icon(512, 'public/icon-512.png')
print('icons written')

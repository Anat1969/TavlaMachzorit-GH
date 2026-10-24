"""מייצר את אייקוני האפליקציה: ספירלת יסודות על רקע כהה, בלי טקסט."""
import math, pathlib
from PIL import Image, ImageDraw, ImageFilter
OUT = pathlib.Path(__file__).resolve().parent.parent / "public"
COLS = ["#ff6b6b", "#ffb347", "#7ee081", "#4fd1ff", "#a78bfa", "#f472b6"]

def points(s, pad):
    c = s / 2; pts = []
    for i in range(46):
        t = i / 45; a = t * 2.6 * 2 * math.pi; r = (pad + t * (c - pad - s * 0.08))
        pts.append((c + r * math.cos(a), c + r * math.sin(a), i))
    return pts

def draw(s, safe):
    im = Image.new("RGB", (s, s), "#06080f"); d = ImageDraw.Draw(im)
    for k in range(s // 2, 0, -4):
        v = int(30 * (1 - k / (s / 2)))
        d.ellipse([s/2-k, s/2-k, s/2+k, s/2+k], fill=(6+v, 8+v, 22+v*2))
    glow = Image.new("RGBA", (s, s), (0, 0, 0, 0)); g = ImageDraw.Draw(glow)
    pts = points(s * (0.72 if safe else 1), s * 0.03)
    off = s * 0.14 if safe else 0
    for x, y, i in pts:
        r = s * (0.012 + 0.03 * i / 45)
        col = COLS[i % len(COLS)]
        g.rectangle([x+off-r, y+off-r, x+off+r, y+off+r], fill=col)
    im.paste(glow.filter(ImageFilter.GaussianBlur(s/60)), (0, 0), glow.filter(ImageFilter.GaussianBlur(s/60)))
    im.paste(glow, (0, 0), glow)
    return im

draw(192, False).save(OUT / "icon-192.png"); draw(512, False).save(OUT / "icon-512.png"); draw(512, True).save(OUT / "icon-maskable-512.png")
pts = points(64, 2)
rects = "".join(f'<rect x="{x - (0.8+1.9*i/45):.1f}" y="{y - (0.8+1.9*i/45):.1f}" width="{2*(0.8+1.9*i/45):.1f}" height="{2*(0.8+1.9*i/45):.1f}" fill="{COLS[i % 6]}"/>' for x, y, i in pts)
(OUT / "icon.svg").write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#06080f"/>{rects}</svg>')
print("icons ok")

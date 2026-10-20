# El favicon de la web (Naza, 20/10): las iniciales V·F en Playfair Display, blanco sobre tinta.
# Se probaron el toroide de siete anillos (a 16-48 px se empasta) y el anillo de afuera solo (no
# representaba la marca); Naza eligió las iniciales, que se leen hasta en 16 px.
# Genera favicon.ico (16/32/48), icono-512.png (web/src/app/icon.png) e icono-180.png (apple-icon.png).
# Uso, desde la carpeta donde quieras los archivos: python <repo>/marca/favicon/hacer.py  (necesita Pillow)
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parents[2]
FUENTE = REPO / "fabrica/fuentes-imprenta/PlayfairDisplay-normal-700.ttf"
TINTA = (0x14, 0x14, 0x0F)
BLANCO = (255, 255, 255)

def icono(S, sobre=8):
    G = S * sobre
    im = Image.new("RGB", (G, G), TINTA)
    d = ImageDraw.Draw(im)
    f = ImageFont.truetype(str(FUENTE), int(G * 0.42 * 1.45))
    b = d.textbbox((0, 0), "V·F", font=f)
    d.text((G / 2 - (b[0] + b[2]) / 2, G / 2 - (b[1] + b[3]) / 2), "V·F", font=f, fill=BLANCO)
    return im.resize((S, S), Image.LANCZOS).convert("RGBA")  # Next solo lee el .ico en RGBA

ims = {s: icono(s) for s in (16, 32, 48, 180, 512)}
ims[48].save("favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)], append_images=[ims[16], ims[32]])
ims[512].save("icono-512.png")
ims[180].save("icono-180.png")

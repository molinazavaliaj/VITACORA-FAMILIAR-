# El favicon de la web (20/10): el toroide de marca (docs/design.md §3, "favicon"), blanco sobre tinta.
# Misma geometría que marca/avatar-toroide-negro.svg, pero solo el anillo de afuera (Naza, 20/10: con los siete,
# a 16-48 px se empasta). El trazo es más grueso para que se vea chico.
# Genera favicon.ico (16/32/48), icono-512.png (web/src/app/icon.png) e icono-180.png (apple-icon.png).
# Uso: python hacer.py  (necesita Pillow)
import sys
from PIL import Image, ImageDraw
ANILLOS=[(86.14,13.86,17.63),(73.23,26.77,34.07),(60.65,39.35,50.08),(48.29,51.71,65.82),(36.08,63.92,81.36),(23.99,76.01,96.74),(12.0,88.0,112.0)]
def icono(S, grosor_px, ancho=0.86, sobre=4):
    G=S*sobre
    im=Image.new("RGB",(G,G),(0x14,0x14,0x0F)); d=ImageDraw.Draw(im)
    esc=ancho*G/352; cx0=100; cy0=145
    w=max(1,round(grosor_px*sobre))
    for cx,rx,ry in ANILLOS[-1:]:  # solo el contorno de afuera
        for c in (cx,200-cx):
            x=G/2+(c-cx0)*esc; y=G/2
            d.ellipse([x-rx*esc,y-ry*esc,x+rx*esc,y+ry*esc],outline=(255,255,255),width=w)
    return im.resize((S,S),Image.LANCZOS).convert("RGBA")  # Next solo lee el .ico en RGBA
# grosor en px finales: se nota a 16-48 sin empastar
grosor={16:1.3,32:2.0,48:2.8,180:7,192:7.5,512:18}
ims={s:icono(s,g) for s,g in grosor.items()}
for s,im in ims.items(): im.save(f"icono-{s}.png")
ims[48].save("favicon.ico",sizes=[(16,16),(32,32),(48,48)],append_images=[ims[16],ims[32]])
# hoja para mirar: cada tamaño ampliado sin suavizar + tamaño real
hoja=Image.new("RGB",(900,300),(240,236,228))
x=10
for s in (16,32,48):
    hoja.paste(ims[s].resize((s*5,s*5),Image.NEAREST).convert("RGB"),(x,10)); hoja.paste(ims[s].convert("RGB"),(x,260)); x+=s*5+20
hoja.paste(ims[192].resize((240,240)).convert("RGB"),(x,10))
hoja.save("hoja.png")

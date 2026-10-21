"""Genera los archivos de impresión de «El cuaderno de su vida» para Amazon KDP (tapa blanda A5).

Lee ../preguntas.md (texto aprobado) y arma:
  interior.html -> interior.pdf   (A5 5,83 x 8,27 in, sin sangrado, B/N)
  cubierta.html -> cubierta.pdf   (contratapa + lomo + frente, sangrado 0,125 in)
  prev-interior.png, prev-cubierta.png (si está PyMuPDF + Pillow)

Uso:  python generar.py
Necesita Microsoft Edge (para el PDF) y el paquete «qrcode» de Python (para el QR).
PyMuPDF y Pillow solo se usan para verificar y para las previsualizaciones.
"""
import html
import json
import os
import re
import subprocess
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
FUENTE = os.path.join(AQUI, '..', 'preguntas.md')
EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
URL_QR = 'https://vitacorafamiliar.com/cuaderno'

# Medidas KDP
TRIM_W, TRIM_H = 5.83, 8.27          # A5 en pulgadas
SANGRADO = 0.125
GROSOR_PAGINA = 0.0025               # papel crema
MM = 25.4

# Márgenes del interior (mm). KDP 24-150 págs: interior >= 9,5 mm; 151-300: >= 12,7 mm; exterior >= 6,35 mm.
M_INTERIOR = 17.0
M_EXTERIOR = 13.0
M_ARRIBA = 15.0
M_ABAJO = 17.0
FOLIO_ABAJO = 8.0
HOLGURA = 0.2                        # in de más en la página de Edge; se recorta después sin escalar
RENGLON = 9.0                        # mm entre renglones, como la muestra
TEXTO_CONTRATAPA = (
    'Un cuaderno para que alguien de tu familia escriba su vida a mano. '
    'Son cincuenta y seis preguntas en diez capítulos, desde la casa donde empezó todo '
    'hasta lo que quiere decir a los que vienen detrás. '
    'Cada pregunta tiene dos páginas de renglones para escribir sin prisa. '
    'Al final hay sitio para sus fotos. '
    'Lo que escriba se queda en la familia.'
)  # BORRADOR, pendiente de aprobación (ver ficha-kdp.md)


# ---------------------------------------------------------------- lectura de preguntas.md

def leer_fuente():
    texto = open(FUENTE, encoding='utf-8').read()

    def seccion(titulo):
        m = re.search(r'^### ' + re.escape(titulo) + r'.*?$(.*?)(?=^#{2,3} |\Z)', texto, re.M | re.S)
        if not m:
            sys.exit('No encuentro la sección «%s» en preguntas.md' % titulo)
        return m.group(1)

    def cita(bloque):
        """Párrafos del blockquote, separados por líneas '>' vacías."""
        parrafos, actual = [], []
        for linea in bloque.splitlines():
            if not linea.startswith('>'):
                continue
            contenido = linea[1:].strip()
            if contenido:
                actual.append(contenido)
            elif actual:
                parrafos.append(' '.join(actual)); actual = []
        if actual:
            parrafos.append(' '.join(actual))
        return parrafos

    regala = cita(seccion('Página 1'))
    instrucciones = cita(seccion('Página 2'))
    qr = cita(seccion('Última página'))

    capitulos = []
    parte = texto.split('## Los capítulos', 1)[1].split('## Páginas de cierre', 1)[0]
    for m in re.finditer(r'^### (\d+)\. (.+?)$(.*?)(?=^### |\Z)', parte, re.M | re.S):
        num, titulo, cuerpo = int(m.group(1)), m.group(2).strip(), m.group(3)
        bajada, notas, preguntas = None, [], []
        for linea in cuerpo.splitlines():
            linea = linea.strip()
            if re.match(r'^\*[^*].*\*$', linea) and bajada is None:
                bajada = linea.strip('*')
            elif linea.startswith('[Nota al pie'):
                nota = re.search(r'\*(.+)\*', linea).group(1)
                notas.append({'texto': nota, 'grande': 'más grande' in linea})
            elif re.match(r'^\d+\. ', linea):
                n, q = linea.split('. ', 1)
                paginas_extra = 2 if 'dos páginas de renglones' in q else 1
                q = re.sub(r'\[.*?\]', '', q)                       # notas de maqueta
                q = q.replace('☐ foto', '')                         # historial
                q = re.sub(r'\s*\((?:[A-Z]{2}\d+(?:,\s*[A-Z]{2}\d+)*|nueva)\)', '', q)  # clave del banco
                preguntas.append({'n': int(n), 'texto': q.strip(), 'vueltas': paginas_extra})
        capitulos.append({'n': num, 'titulo': titulo, 'bajada': bajada, 'notas': notas, 'preguntas': preguntas})

    total_q = sum(len(c['preguntas']) for c in capitulos)
    if len(capitulos) != 10 or total_q != 56:
        sys.exit('Esperaba 10 capítulos y 56 preguntas, encontré %d y %d' % (len(capitulos), total_q))
    return regala, instrucciones, capitulos, qr


# ---------------------------------------------------------------- piezas comunes

def e(s):
    return html.escape(s, quote=False)


def inline(s):
    """**negrita** y *cursiva* del markdown a HTML."""
    s = e(s)
    s = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', s)
    s = re.sub(r'\*(.+?)\*', r'<em>\1</em>', s)
    return s


TOROIDE = '''<svg class="toroide" viewBox="8 29 184 232" aria-hidden="true"><g fill="none" stroke="{c}" stroke-width="{w}">
<ellipse cx="86.14" cy="145" rx="13.86" ry="17.63"/><ellipse cx="113.86" cy="145" rx="13.86" ry="17.63"/>
<ellipse cx="73.23" cy="145" rx="26.77" ry="34.07"/><ellipse cx="126.77" cy="145" rx="26.77" ry="34.07"/>
<ellipse cx="60.65" cy="145" rx="39.35" ry="50.08"/><ellipse cx="139.35" cy="145" rx="39.35" ry="50.08"/>
<ellipse cx="48.29" cy="145" rx="51.71" ry="65.82"/><ellipse cx="151.71" cy="145" rx="51.71" ry="65.82"/>
</g></svg>'''

LOGO_CAMPO = '''<svg class="logo" viewBox="-80 8 360 274" aria-label="Vitácora Familiar">
<line x1="100" y1="20.32" x2="100" y2="269.68" stroke="#FFF" stroke-width="0.9" stroke-dasharray="3 4" opacity="0.55"/>
<path d="M100 12 l5.2 5.2 l-5.2 5.2 l-5.2 -5.2 Z" fill="#FFF" opacity="0.75"/>
<path d="M100 278 l5.2 -5.2 l-5.2 -5.2 l-5.2 5.2 Z" fill="#FFF" opacity="0.75"/>
<g fill="none" stroke="#FFF" stroke-width="1.15">
<ellipse cx="86.14" cy="145" rx="13.86" ry="17.63"/><ellipse cx="113.86" cy="145" rx="13.86" ry="17.63"/>
<ellipse cx="73.23" cy="145" rx="26.77" ry="34.07"/><ellipse cx="126.77" cy="145" rx="26.77" ry="34.07"/>
<ellipse cx="60.65" cy="145" rx="39.35" ry="50.08"/><ellipse cx="139.35" cy="145" rx="39.35" ry="50.08"/>
<ellipse cx="48.29" cy="145" rx="51.71" ry="65.82"/><ellipse cx="151.71" cy="145" rx="51.71" ry="65.82"/>
<ellipse cx="36.08" cy="145" rx="63.92" ry="81.36"/><ellipse cx="163.92" cy="145" rx="63.92" ry="81.36"/>
<ellipse cx="23.99" cy="145" rx="76.01" ry="96.74"/><ellipse cx="176.01" cy="145" rx="76.01" ry="96.74"/>
<ellipse cx="12" cy="145" rx="88" ry="112"/><ellipse cx="188" cy="145" rx="88" ry="112"/>
</g>
<ellipse cx="52" cy="145" rx="33.5" ry="43" fill="#14140F"/><ellipse cx="148" cy="145" rx="33.5" ry="43" fill="#14140F"/>
<text x="52" y="171" text-anchor="middle" font-family="Playfair Display, Georgia, serif" font-weight="500" font-size="76" fill="#FFF">V</text>
<text x="148" y="171" text-anchor="middle" font-family="Playfair Display, Georgia, serif" font-weight="500" font-size="76" fill="#FFF">F</text>
</svg>'''

# Fuentes TrueType estáticas del repo (Chromium imprime las variables de Google Fonts como Type 3,
# ver fabrica/fuentes-imprenta/LEEME.md). Rutas relativas a esta carpeta.
RAIZ = '../../../../'
_CARAS = [
    ('Archivo', 'normal', 400, 'fabrica/fuentes-imprenta/Archivo-normal-400.ttf'),
    ('Archivo', 'normal', 600, 'fabrica/fuentes-imprenta/Archivo-normal-600.ttf'),
    ('Playfair Display', 'normal', 500, 'web/src/app/_compartir/fuentes/playfair-500.ttf'),
    ('Source Serif 4', 'normal', 400, 'fabrica/fuentes-imprenta/SourceSerif4-normal-400.ttf'),
    ('Source Serif 4', 'normal', 600, 'fabrica/fuentes-imprenta/SourceSerif4-normal-600.ttf'),
    ('Source Serif 4', 'italic', 400, 'fabrica/fuentes-imprenta/SourceSerif4-italic-400.ttf'),
]
for _f in _CARAS:
    if not os.path.exists(os.path.join(AQUI, RAIZ, _f[3])):
        sys.exit('Falta la fuente ' + _f[3])
FUENTES = '<style>' + ''.join(
    "@font-face{font-family:'%s';font-style:%s;font-weight:%d;src:url('%s%s') format('truetype');}" % (f, st, w, RAIZ, r)
    for f, st, w, r in _CARAS) + '</style>'


def qr_svg(url, tam_mm):
    import qrcode
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=0)
    q.add_data(url)
    q.make(fit=True)
    m = q.get_matrix()
    n = len(m)
    caminos = ''.join('M%d %dh1v1h-1z' % (x, y) for y, fila in enumerate(m) for x, v in enumerate(fila) if v)
    return ('<svg class="qr" viewBox="0 0 %d %d" width="%smm" height="%smm" shape-rendering="crispEdges">'
            '<path d="%s" fill="#000"/></svg>') % (n, n, tam_mm, tam_mm, caminos)


def renglones(n=34):
    return '<div class="renglones">' + '<i></i>' * n + '</div>'


# ---------------------------------------------------------------- interior

def armar_paginas(regala, instrucciones, capitulos, qr):
    """Devuelve la lista de páginas (dicts) en orden; la posición + 1 es el número de página."""
    pags = []

    def add(tipo, **kw):
        kw['tipo'] = tipo
        pags.append(kw)

    add('titulo')                       # 1 (impar)
    add('regala', parrafos=regala)      # 2
    add('instrucciones', parrafos=instrucciones)  # 3
    add('indice')                       # 4
    for c in capitulos:
        if len(pags) % 2 == 1:          # la portadilla va en impar: si la siguiente sería par, blanca
            add('blanca')
        c['pagina'] = len(pags) + 1
        add('portadilla', cap=c)
        for q in c['preguntas']:
            assert (len(pags) + 1) % 2 == 0, 'cada pregunta empieza en par'
            add('pregunta', cap=c, q=q)
            for _ in range(q['vueltas']):
                add('vuelta', cap=c, q=q)
    # Fotos: 6 páginas que empiecen en par para que queden de a pares enfrentadas.
    if len(pags) % 2 == 0:
        add('blanca')
    for _ in range(6):
        add('fotos')
    # QR en la última página del libro (par).
    if len(pags) % 2 == 0:
        add('blanca')
    add('qr', parrafos=qr)
    assert len(pags) % 2 == 0
    return pags


def html_pagina(p, num, capitulos):
    recto = num % 2 == 1
    izq, der = (M_INTERIOR, M_EXTERIOR) if recto else (M_EXTERIOR, M_INTERIOR)
    estilo = 'padding:%smm %smm %smm %smm' % (M_ARRIBA, der, M_ABAJO, izq)
    folio_estilo = 'left:%smm;right:%smm' % (izq, der)
    t = p['tipo']
    con_folio = t not in ('titulo', 'portadilla', 'blanca')
    folio = '<span class="folio" style="%s">%d</span>' % (folio_estilo, num) if con_folio else ''
    cuerpo = ''

    if t == 'titulo':
        cuerpo = (TOROIDE.format(c='#000', w='2.2') +
                  '<h1>El cuaderno<br>de su vida</h1><span class="etiqueta">Vitácora Familiar</span>')
    elif t == 'regala':
        pre, despues = p['parrafos'][0], p['parrafos'][2:]
        cuerpo = '<span class="etiqueta">De quien regala</span>'
        cuerpo += '<p class="regalo">%s</p>' % inline(pre)
        cuerpo += '<div class="renglones fijos">' + '<i></i>' * 8 + '</div>'
        for par in despues:
            if '____' in par:
                trozos = re.split(r'_{3,}', par)
                linea = ''
                for i, tr in enumerate(trozos):
                    linea += e(tr)
                    if i < len(trozos) - 1:
                        linea += '<span class="hueco%s"></span>' % (' corto' if 'Fecha' in par else '')
                cuerpo += '<p class="firma">%s</p>' % linea
            else:
                cuerpo += '<p class="dedicatoria">%s</p>' % inline(par)
    elif t == 'instrucciones':
        cuerpo = '<span class="etiqueta">Para quien escribe</span>' + ''.join('<p>%s</p>' % inline(x) for x in p['parrafos'])
    elif t == 'indice':
        filas = ''.join('<li><span class="n">%d</span><span class="t">%s</span><span class="pun"></span><span class="pg">%d</span></li>'
                        % (c['n'], e(c['titulo']), c['pagina']) for c in capitulos)
        cuerpo = '<span class="etiqueta">Índice</span><ol>%s</ol>' % filas
    elif t == 'portadilla':
        c = p['cap']
        cuerpo = (TOROIDE.format(c='#000', w='2.2') + '<span class="numero">%d</span><h2>%s</h2><p class="bajada">%s</p>'
                  % (c['n'], e(c['titulo']), e(c['bajada'])))
        for nota in c['notas']:
            cuerpo += '<p class="nota%s">%s</p>' % (' grande' if nota['grande'] else '', e(nota['texto']))
    elif t in ('pregunta', 'vuelta'):
        c = p['cap']
        cuerpo = '<span class="etiqueta">%s · %d</span>' % (e(c['titulo']), c['n'])
        if t == 'pregunta':
            cuerpo += '<h3>%s</h3>' % e(p['q']['texto'])
        else:
            cuerpo += '<div class="aire"></div>'
        cuerpo += renglones()
    elif t == 'fotos':
        celda = '<div><div class="foto"><span>Foto</span></div><p class="pie-foto">Quién sale y en qué año</p></div>'
        cuerpo = '<span class="etiqueta">Tus fotos</span><div class="grilla">%s</div>' % (celda * 4)
    elif t == 'qr':
        pr = p['parrafos']
        cuerpo = '<p class="qr-titulo">%s</p><p>%s</p>' % (inline(pr[0]), inline(pr[1]))
        cuerpo += '<div class="qr-caja">%s<span class="url">%s</span></div>' % (
            qr_svg(URL_QR, 34), e(pr[2].replace('[QR]', '').strip()))
        cuerpo += '<p class="cierre">%s</p>' % inline(pr[3])

    return '<section class="hoja %s" style="%s">%s%s</section>' % (t, estilo, cuerpo, folio)


CSS_INTERIOR = '''
@page { size: %(pw)sin %(ph)sin; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; font-optical-sizing: none; }
html, body { background: #fff; }
body { font-family: 'Source Serif 4', Georgia, serif; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.hoja { width: %(w)sin; height: %(h)sin; position: relative; overflow: hidden; display: flex; flex-direction: column;
        break-after: page; page-break-after: always; background: #fff; }
.etiqueta { font-family: 'Archivo', Helvetica, Arial, sans-serif; font-size: 7.5pt; letter-spacing: .3em; text-transform: uppercase; color: #6e6e6e; }
.folio { position: absolute; bottom: %(folio)smm; text-align: center; font-family: 'Archivo', Helvetica, Arial, sans-serif; font-size: 7pt; letter-spacing: .2em; color: #6e6e6e; }
.renglones { flex: 1; overflow: hidden; }
.renglones i { display: block; height: %(r)smm; border-bottom: .25mm solid #a8a8a8; }
.renglones.fijos { flex: none; margin: 4mm 0 8mm; }

.titulo { justify-content: center; align-items: center; text-align: center; }
.titulo .toroide { width: 16mm; margin-bottom: 12mm; }
.titulo h1 { font-family: 'Playfair Display', Georgia, serif; font-weight: 500; font-size: 28pt; line-height: 1.2; margin-bottom: 14mm; }

.regala .etiqueta { margin-bottom: 9mm; }
.regala .regalo { font-weight: 600; font-size: 14pt; }
.regala .dedicatoria { font-style: italic; font-size: 12pt; line-height: 1.5; margin-bottom: 12mm; }
.regala .firma { font-size: 11.5pt; margin-bottom: 9mm; display: flex; align-items: flex-end; gap: 2mm; white-space: nowrap; }
.regala .hueco { flex: 1; border-bottom: .25mm solid #6e6e6e; height: 5mm; }
.regala .hueco.corto { flex: none; width: 45mm; }

.instrucciones { justify-content: center; }
.instrucciones p { font-size: 15pt; line-height: 1.55; margin-bottom: 7mm; }
.instrucciones .etiqueta { margin-bottom: 10mm; }

.indice .etiqueta { margin-bottom: 12mm; }
.indice ol { list-style: none; }
.indice li { display: flex; align-items: baseline; font-size: 13pt; line-height: 1; margin-bottom: 7.5mm; }
.indice .n { font-family: 'Playfair Display', Georgia, serif; width: 9mm; color: #333; }
.indice .pun { flex: 1; border-bottom: .25mm dotted #8a8a8a; margin: 0 3mm; }
.indice .pg { font-family: 'Archivo', Helvetica, Arial, sans-serif; font-size: 9pt; letter-spacing: .1em; color: #333; }

.portadilla { justify-content: center; align-items: center; text-align: center; }
.portadilla .toroide { width: 14mm; margin-bottom: 10mm; opacity: .8; }
.portadilla .numero { font-family: 'Playfair Display', Georgia, serif; font-size: 54pt; color: #333; line-height: 1; }
.portadilla h2 { font-family: 'Playfair Display', Georgia, serif; font-weight: 500; font-size: 26pt; margin: 6mm 0 5mm; }
.portadilla .bajada { font-style: italic; font-size: 12pt; color: #3a3a3a; max-width: 110mm; line-height: 1.5; }
.portadilla .nota { position: absolute; bottom: 22mm; left: 0; right: 0; margin: 0 auto; max-width: 96mm; font-style: italic; font-size: 10pt; line-height: 1.5; color: #3a3a3a; }
.portadilla .nota.grande { font-size: 11.5pt; }

.pregunta h3 { font-weight: 400; font-size: 13.5pt; line-height: 1.45; margin: 5mm 0 7mm; }
.vuelta .aire { height: 6mm; }

.fotos .grilla { flex: 1; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 8mm 6mm; margin-top: 8mm; }
.fotos .grilla > div { display: flex; flex-direction: column; }
.fotos .foto { flex: 1; border: .3mm dashed #8a8a8a; display: flex; align-items: center; justify-content: center; }
.fotos .foto span { font-family: 'Archivo', Helvetica, Arial, sans-serif; font-size: 7.5pt; letter-spacing: .2em; text-transform: uppercase; color: #8a8a8a; }
.pie-foto { font-family: 'Archivo', Helvetica, Arial, sans-serif; font-size: 7pt; letter-spacing: .15em; text-transform: uppercase; color: #6e6e6e; border-top: .25mm solid #a8a8a8; padding-top: 2mm; margin-top: 7mm; }

.qr { justify-content: center; align-items: center; text-align: center; }
.qr p { font-size: 13pt; line-height: 1.5; max-width: 108mm; }
.qr .qr-titulo { font-family: 'Playfair Display', Georgia, serif; font-size: 22pt; margin-bottom: 6mm; }
.qr .qr-titulo strong { font-weight: 500; }
.qr .qr-caja { display: flex; flex-direction: column; align-items: center; gap: 4mm; margin: 12mm 0; }
.qr .url { font-family: 'Archivo', Helvetica, Arial, sans-serif; font-size: 8.5pt; letter-spacing: .12em; color: #333; }
.qr .cierre { font-style: italic; font-size: 11pt; color: #3a3a3a; }
'''


def interior(regala, instrucciones, capitulos, qr):
    pags = armar_paginas(regala, instrucciones, capitulos, qr)
    css = CSS_INTERIOR % {'w': TRIM_W, 'h': TRIM_H, 'pw': TRIM_W + HOLGURA, 'ph': TRIM_H + HOLGURA, 'folio': FOLIO_ABAJO, 'r': RENGLON}
    cuerpo = '\n'.join(html_pagina(p, i + 1, capitulos) for i, p in enumerate(pags))
    doc = ('<!doctype html><html lang="es"><head><meta charset="utf-8"><title>El cuaderno de su vida · interior</title>'
           '%s<style>%s</style></head><body>%s</body></html>'
           % (FUENTES, css, cuerpo))
    return doc, pags


# ---------------------------------------------------------------- cubierta

def cubierta(n_paginas):
    lomo = round(n_paginas * GROSOR_PAGINA, 4)
    W = SANGRADO + TRIM_W + lomo + TRIM_W + SANGRADO
    H = SANGRADO + TRIM_H + SANGRADO
    x_lomo = SANGRADO + TRIM_W
    x_frente = x_lomo + lomo
    texto_lomo = n_paginas > 79
    # Código de barras: 2 x 1,2 in abajo a la derecha de la contratapa, a 0,25 in de los cortes.
    bc_w, bc_h = 2.0, 1.2
    bc_x = x_lomo - 0.25 - bc_w
    bc_y = SANGRADO + TRIM_H - 0.25 - bc_h

    css = '''
@page { size: %(PW)sin %(PH)sin; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; font-optical-sizing: none; }
html, body { width: %(W)sin; height: %(H)sin; background: #14140F; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.lienzo { position: relative; width: %(W)sin; height: %(H)sin; background: #14140F; overflow: hidden; color: #fff; }
.panel { position: absolute; top: %(S)sin; height: %(TH)sin; }
.etiqueta { font-family: 'Archivo', Helvetica, Arial, sans-serif; font-size: 7.5pt; letter-spacing: .3em; text-transform: uppercase; color: rgba(255,255,255,.65); }
.frente { left: %(XF)sin; width: %(TW)sin; display: flex; flex-direction: column; align-items: center; text-align: center;
          justify-content: space-between; padding: 22mm 16mm 18mm; }
.frente .logo { width: 92mm; height: auto; }
.frente h1 { font-family: 'Playfair Display', Georgia, serif; font-weight: 500; font-size: 24pt; line-height: 1.2; }
.frente .nombre { margin: 6mm auto 0; border-bottom: .3mm solid rgba(255,255,255,.6); width: 80mm; height: 9mm; }
.contra { left: %(S)sin; width: %(TW)sin; padding: 22mm 18mm 18mm; }
.contra .etiqueta { display: block; margin-bottom: 14mm; }
.contra p { font-family: 'Source Serif 4', Georgia, serif; font-size: 12.5pt; line-height: 1.6; max-width: 104mm; }
.contra .toroide { position: absolute; left: 18mm; bottom: 18mm; width: 12mm; }
.barras { position: absolute; left: %(BX)sin; top: %(BY)sin; width: %(BW)sin; height: %(BH)sin; background: #fff; }
.lomo { left: %(XL)sin; width: %(L)sin; }
.lomo .giro { position: absolute; left: 50%%; top: 50%%; width: %(TH)sin; height: %(L)sin; transform: translate(-50%%, -50%%) rotate(90deg);
              display: flex; align-items: center; justify-content: space-between; padding: 0 .45in; }
.lomo .t { font-family: 'Playfair Display', Georgia, serif; font-weight: 500; font-size: 11pt; line-height: 1; white-space: nowrap; }
.lomo .m { font-family: 'Archivo', Helvetica, Arial, sans-serif; font-size: 6pt; letter-spacing: .3em; text-transform: uppercase; color: rgba(255,255,255,.7); line-height: 1; white-space: nowrap; }
''' % {'W': W, 'H': H, 'PW': W + HOLGURA, 'PH': H + HOLGURA, 'S': SANGRADO, 'TH': TRIM_H, 'TW': TRIM_W, 'XF': x_frente, 'XL': x_lomo, 'L': lomo,
       'BX': bc_x, 'BY': bc_y, 'BW': bc_w, 'BH': bc_h}

    lomo_html = ('<div class="panel lomo"><div class="giro"><span class="t">El cuaderno de su vida</span>'
                 '<span class="m">Vitácora Familiar</span></div></div>') if texto_lomo else ''
    cuerpo = ('<div class="lienzo">'
              '<div class="panel contra"><span class="etiqueta">Vitácora Familiar</span><p>%s</p>%s</div>'
              '<div class="barras"></div>'
              '%s'
              '<div class="panel frente"><span class="etiqueta">Vitácora Familiar</span>%s'
              '<div><h1>El cuaderno<br>de su vida</h1><div class="nombre"></div></div></div>'
              '</div>') % (e(TEXTO_CONTRATAPA), TOROIDE.format(c='#FFF', w='2.2'), lomo_html, LOGO_CAMPO)
    doc = ('<!doctype html><html lang="es"><head><meta charset="utf-8"><title>El cuaderno de su vida · cubierta</title>'
           '%s<style>%s</style></head><body>%s</body></html>'
           % (FUENTES, css, cuerpo))
    medidas = {'paginas': n_paginas, 'lomo_in': lomo, 'ancho_in': round(W, 4), 'alto_in': round(H, 4),
               'texto_en_lomo': texto_lomo}
    return doc, medidas


# ---------------------------------------------------------------- PDF y verificación

def a_pdf(html_path, pdf_path):
    if os.path.exists(pdf_path):
        os.remove(pdf_path)
    url = 'file:///' + html_path.replace('\\', '/')
    subprocess.run([EDGE, '--headless=new', '--disable-gpu', '--virtual-time-budget=10000',
                    '--no-pdf-header-footer', '--print-to-pdf=' + pdf_path, url],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if not os.path.exists(pdf_path):
        sys.exit('Edge no generó ' + pdf_path)


def tamano_exacto(pdf_path, ancho_in, alto_in):
    """Edge redondea el tamaño de página a píxeles, así que se imprime con HOLGURA de más y aquí se
    recorta cada página a la medida exacta de KDP, en vectorial, con sus fuentes y sin escalar."""
    import pymupdf as fitz
    src = fitz.open(pdf_path)
    out = fitz.open()
    for i in range(len(src)):
        pg = out.new_page(width=ancho_in * 72, height=alto_in * 72)
        pg.show_pdf_page(pg.rect, src, i, clip=fitz.Rect(0, 0, ancho_in * 72, alto_in * 72))
    out.save(pdf_path + '.tmp', garbage=3, deflate=True)
    out.close(); src.close()
    os.replace(pdf_path + '.tmp', pdf_path)


def verificar(pdf_path, ancho_in, alto_in, paginas=None):
    import pymupdf as fitz
    doc = fitz.open(pdf_path)
    errores = []
    for i, pg in enumerate(doc):
        w, h = pg.rect.width / 72, pg.rect.height / 72
        if abs(w - ancho_in) > 0.001 or abs(h - alto_in) > 0.001:
            errores.append('página %d mide %.3f x %.3f in' % (i + 1, w, h))
    if paginas is not None and len(doc) != paginas:
        errores.append('tiene %d páginas, esperaba %d' % (len(doc), paginas))
    fuentes = set()
    for i in range(len(doc)):
        for f in doc.get_page_fonts(i, full=True):
            fuentes.add((f[3], f[1] not in ('n/a', '') and f[2] != 'Type3'))
    no_embebidas = [f for f, emb in fuentes if not emb]
    nombres = sorted({f.split('+')[-1] for f, _ in fuentes})
    for falta in ('Archivo', 'VitacoraTitulo', 'SourceSerif'):  # VitacoraTitulo = Playfair Display 500
        if not any(falta.lower() in n.lower().replace(' ', '') for n in nombres):
            errores.append('no aparece la fuente %s' % falta)
    w0, h0 = doc[0].rect.width / 72, doc[0].rect.height / 72
    info = {'archivo': os.path.basename(pdf_path), 'paginas': len(doc), 'ancho_in': round(w0, 4), 'alto_in': round(h0, 4),
            'ancho_mm': round(w0 * MM, 1), 'alto_mm': round(h0 * MM, 1), 'fuentes': nombres,
            'no_embebidas': no_embebidas, 'mb': round(os.path.getsize(pdf_path) / 1e6, 2), 'errores': errores}
    doc.close()
    return info


def previsualizaciones(pags):
    import pymupdf as fitz
    from PIL import Image, ImageDraw
    doc = fitz.open(os.path.join(AQUI, 'interior.pdf'))
    elegir = [1, 2, 3, 4, 5, 6, 7]
    elegir.append(next(i + 1 for i, p in enumerate(pags) if p['tipo'] == 'portadilla' and p['cap']['n'] == 8))
    elegir.append(next(i + 1 for i, p in enumerate(pags) if p['tipo'] == 'fotos'))
    elegir.append(len(pags))
    imgs = []
    for n in elegir:
        pix = doc[n - 1].get_pixmap(dpi=60)
        imgs.append((n, Image.frombytes('RGB', (pix.width, pix.height), pix.samples)))
    w, h = imgs[0][1].size
    gap, cols = 24, 5
    filas = (len(imgs) + cols - 1) // cols
    tira = Image.new('RGB', (cols * w + (cols + 1) * gap, filas * (h + 28) + (filas + 1) * gap), (233, 230, 223))
    d = ImageDraw.Draw(tira)
    for k, (n, im) in enumerate(imgs):
        x = gap + (k % cols) * (w + gap)
        y = gap + (k // cols) * (h + 28 + gap)
        tira.paste(im, (x, y))
        d.rectangle([x - 1, y - 1, x + w, y + h], outline=(160, 160, 160))
        d.text((x, y + h + 8), 'p. %d' % n, fill=(60, 60, 60))
    tira.save(os.path.join(AQUI, 'prev-interior.png'))
    doc.close()
    doc = fitz.open(os.path.join(AQUI, 'cubierta.pdf'))
    doc[0].get_pixmap(dpi=110).save(os.path.join(AQUI, 'prev-cubierta.png'))
    doc.close()


def main():
    regala, instrucciones, capitulos, qr = leer_fuente()
    doc_i, pags = interior(regala, instrucciones, capitulos, qr)
    n = len(pags)
    doc_c, medidas = cubierta(n)
    hi, hc = os.path.join(AQUI, 'interior.html'), os.path.join(AQUI, 'cubierta.html')
    open(hi, 'w', encoding='utf-8').write(doc_i)
    open(hc, 'w', encoding='utf-8').write(doc_c)
    a_pdf(hi, os.path.join(AQUI, 'interior.pdf'))
    a_pdf(hc, os.path.join(AQUI, 'cubierta.pdf'))
    tamano_exacto(os.path.join(AQUI, 'interior.pdf'), TRIM_W, TRIM_H)
    tamano_exacto(os.path.join(AQUI, 'cubierta.pdf'), medidas['ancho_in'], medidas['alto_in'])
    resultado = {'medidas': medidas,
                 'mapa': [{'pagina': i + 1, 'tipo': p['tipo'],
                           'capitulo': p.get('cap', {}).get('n') if p.get('cap') else None,
                           'pregunta': p['q']['n'] if p.get('q') else None} for i, p in enumerate(pags)]}
    try:
        resultado['interior'] = verificar(os.path.join(AQUI, 'interior.pdf'), TRIM_W, TRIM_H, n)
        resultado['cubierta'] = verificar(os.path.join(AQUI, 'cubierta.pdf'), medidas['ancho_in'], medidas['alto_in'], 1)
        previsualizaciones(pags)
    except ImportError as ex:
        print('Sin verificación ni previsualización (%s)' % ex)
    json.dump(resultado, open(os.path.join(AQUI, 'verificacion.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(json.dumps({k: v for k, v in resultado.items() if k != 'mapa'}, ensure_ascii=False, indent=1))
    malos = resultado.get('interior', {}).get('errores', []) + resultado.get('cubierta', {}).get('errores', [])
    if malos:
        sys.exit('FALLA: ' + '; '.join(malos))


if __name__ == '__main__':
    main()

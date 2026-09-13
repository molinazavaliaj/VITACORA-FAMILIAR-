# Genera los artboards del lienzo "Vitácora · Direcciones del panel".
# Tokens tal cual docs/design.md. Tres direcciones, mismos tokens, distinta
# composición. Correr: python3 generar.py
import textwrap

T = dict(negro="#14140F", blanco="#FFFFFF", grafito="#2B2B24", pizarra="#45453C", acero="#5F5F55",
         humo="#83837A", ceniza="#AEAEA6", niebla="#D4D4CE", bruma="#EBEBE7", papel="#F7F7F5",
         violeta="#5D3FD3", violetaClaro="#8F7BE0")
TIT = "'Playfair Display', Georgia, serif"
MIC = "'Archivo', Helvetica, Arial, sans-serif"
CUE = "'Source Serif 4', Georgia, serif"

CAPS = ["La infancia", "Las raíces", "La juventud", "El amor", "El oficio", "Los hijos", "Las pruebas", "La sabiduría"]
PREG = {
  "La infancia": [
    (1, "Cuénteme de la casa donde pasó su infancia. Si cierra los ojos y entra por la puerta, ¿qué ve, qué huele, quién está?", "3:40", "12 de septiembre"),
    (2, "¿Cómo eran su mamá y su papá? ¿Qué hacían, cómo era vivir con ellos?", "2:05", "13 de septiembre"),
    (3, "¿A qué jugaba de chico, y con quién? Cuénteme alguna travesura que todavía lo haga reír.", "4:51", "14 de septiembre"),
    (4, "¿Cómo era su escuela? ¿Tuvo algún maestro o compañero que nunca se olvidó?", None, None),
  ],
  "Las raíces": [
    (5, "Hábleme de sus abuelos y de dónde viene su familia. ¿Qué historias le contaban de antes de que usted naciera?", None, None),
    (6, "Hábleme de sus hermanos. ¿Cómo era cada uno, con quién se llevaba mejor?", None, None),
  ],
}
TRANSCRIPCION = "La casa tenía un patio largo con una parra que mi padre había plantado el año que nací. En verano almorzábamos debajo, y yo me acuerdo del olor a uva caliente…"

def head(bg):
    return f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,500&family=Archivo:wght@400;500&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;1,8..60,300&display=swap">
  <style>
    body {{ margin: 0; background: {bg}; color: {T['negro']}; font-family: {CUE}; -webkit-font-smoothing: antialiased; }}
    a {{ color: {T['violeta']}; }} a:hover {{ color: #4F35BC; }}
    * {{ box-sizing: border-box; }}
  </style>
</helmet>
"""
FOOT = "</x-dc>\n</body>\n</html>\n"

def svg(name, size=20, color="currentColor"):
    d = {
      "inicio": '<path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10v9h11v-9"/>',
      "historia": '<path d="M5 4.5h5.5a2 2 0 0 1 2 2v13a1.5 1.5 0 0 0-1.5-1.5H5z"/><path d="M19 4.5h-5.5a2 2 0 0 0-2 2v13a1.5 1.5 0 0 1 1.5-1.5H19z"/>',
      "preguntas": '<path d="M4.5 5.5h15v10h-8l-4 3.5v-3.5h-3z"/><path d="M10 9.2a2 2 0 1 1 2.6 1.9c-.5.2-.6.5-.6 1M12 13.6v.2"/>',
      "libro": '<path d="M6 3.5h12v17H6z"/><path d="M6 3.5v17M9 8h6M9 11h6"/>',
      "lapiz": '<path d="M4 20h4l10.5-10.5a1.5 1.5 0 0 0 0-2.1l-1.9-1.9a1.5 1.5 0 0 0-2.1 0L4 16z"/><path d="M13 7l4 4"/>',
      "foto": '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M20 15l-4.5-4.5L8 18"/>',
      "play": '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
      "mas": '<path d="M12 5v14M5 12h14"/>',
      "izq": '<path d="m15 6-6 6 6 6"/>',
      "der": '<path d="m9 6 6 6-6 6"/>',
      "check": '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
      "arriba": '<path d="M12 19V5M6 11l6-6 6 6"/>',
      "abajo": '<path d="M12 5v14M6 13l6 6 6-6"/>',
      "x": '<path d="M6 6l12 12M18 6L6 18"/>',
      "tapa": '<path d="M6 3.5h12v17H6z"/><path d="M9 7.5h6M9 10.5h4"/>',
      "marco": '<rect x="4" y="4" width="16" height="16" rx="1"/><rect x="7.5" y="7.5" width="9" height="9"/>',
    }[name]
    return f'<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="{color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink: 0;">{d}</svg>'

def sidebar(activa, oscuro=True, ancho=256):
    bg = T['negro'] if oscuro else T['blanco']
    fg = T['blanco'] if oscuro else T['negro']
    sub = T['niebla'] if oscuro else T['pizarra']
    men = T['ceniza'] if oscuro else T['acero']
    lin = T['grafito'] if oscuro else T['bruma']
    items = ""
    for clave, nombre in [("inicio","Inicio"),("historia","Historias"),("preguntas","Preguntas"),("libro","Encargar libro")]:
        act = clave == activa
        items += f"""<a href="#" style="display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-radius: 6px; font-family: {MIC}; font-size: 15px; text-decoration: none; color: {fg if act else sub}; background: {lin if act else 'transparent'};">{svg(clave, 20)}{nombre}</a>"""
    return f"""<aside style="width: {ancho}px; flex-shrink: 0; display: flex; flex-direction: column; background: {bg}; color: {fg}; border-right: 1px solid {lin};">
  <div style="display: flex; align-items: center; gap: 12px; padding: 28px 24px 24px;">
    <svg viewBox="-78 31 356 228" width="38" height="24" style="flex-shrink: 0;" aria-hidden="true"><g fill="none" stroke="{fg}" stroke-width="2.4"><ellipse cx="86.14" cy="145" rx="13.86" ry="17.63"/><ellipse cx="113.86" cy="145" rx="13.86" ry="17.63"/><ellipse cx="73.23" cy="145" rx="26.77" ry="34.07"/><ellipse cx="126.77" cy="145" rx="26.77" ry="34.07"/><ellipse cx="60.65" cy="145" rx="39.35" ry="50.08"/><ellipse cx="139.35" cy="145" rx="39.35" ry="50.08"/><ellipse cx="48.29" cy="145" rx="51.71" ry="65.82"/><ellipse cx="151.71" cy="145" rx="51.71" ry="65.82"/><ellipse cx="36.08" cy="145" rx="63.92" ry="81.36"/><ellipse cx="163.92" cy="145" rx="63.92" ry="81.36"/><ellipse cx="23.99" cy="145" rx="76.01" ry="96.74"/><ellipse cx="176.01" cy="145" rx="76.01" ry="96.74"/><ellipse cx="12.0" cy="145" rx="88.0" ry="112.0"/><ellipse cx="188.00" cy="145" rx="88.0" ry="112.0"/></g></svg>
    <span style="font-family: {MIC}; font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase;">Vitácora Familiar</span>
  </div>
  <div style="margin: 0 16px; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 12px 16px; border: 1px solid {lin}; border-radius: 8px;">
    <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0;">
      <span style="font-family: {MIC}; font-size: 10px; letter-spacing: 0.24em; text-transform: uppercase; color: {men};">Historia</span>
      <span style="font-family: {TIT}; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">La historia de Roberto</span>
    </div>
    {svg("abajo", 16, men)}
  </div>
  <nav style="display: flex; flex-direction: column; gap: 2px; padding: 24px 16px 0;">{items}</nav>
  <p style="margin: auto 24px 24px; font-family: {CUE}; font-style: italic; font-size: 11px; line-height: 1.6; color: {men};">Para las vidas que merecen su propio libro</p>
</aside>"""

def boton(texto, icono=None, primario=False, oscuro=False, chico=False):
    h = 40 if chico else 48
    if primario:
        bg, fg, bd = (T['violetaClaro'], T['negro'], T['violetaClaro']) if oscuro else (T['violeta'], T['blanco'], T['violeta'])
    else:
        bg, fg, bd = ("transparent", T['blanco'] if oscuro else T['negro'], T['pizarra'] if oscuro else T['ceniza'])
    ic = svg(icono, 18, fg) if icono else ""
    return f"""<a href="#" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: {h}px; padding: 0 {18 if chico else 24}px; border-radius: 999px; border: 1px solid {bd}; background: {bg}; color: {fg}; font-family: {MIC}; font-size: {14 if chico else 15}px; font-weight: 500; text-decoration: none; white-space: nowrap;">{ic}{texto}</a>"""

def etiqueta(texto, color=None):
    return f'<p style="margin: 0; font-family: {MIC}; font-size: 11px; letter-spacing: 0.24em; text-transform: uppercase; color: {color or T["acero"]};">{texto}</p>'

def reproductor(dur, ancho="100%", oscuro=False):
    bg = T['grafito'] if oscuro else T['papel']
    bd = T['pizarra'] if oscuro else T['niebla']
    fg = T['blanco'] if oscuro else T['negro']
    inv = T['negro'] if oscuro else T['blanco']
    return f"""<div style="display: flex; align-items: center; gap: 12px; width: {ancho}; padding: 6px 16px 6px 6px; border-radius: 999px; border: 1px solid {bd}; background: {bg};">
  <span style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 999px; background: {fg}; color: {inv}; flex-shrink: 0;">{svg("play", 16, inv)}</span>
  <div style="flex: 1; height: 4px; border-radius: 999px; background: {bd}; overflow: hidden;"><div style="width: 32%; height: 100%; background: {fg};"></div></div>
  <span style="font-family: {MIC}; font-size: 12px; color: {T['ceniza'] if oscuro else T['acero']}; font-variant-numeric: tabular-nums;">{dur}</span>
</div>"""

def foto_ph(w, h, texto="foto", radio=8, oscuro=False):
    # Sin caras, sin stock: un bloque con textura de papel fotográfico en gris.
    return f"""<div style="width: {w}; height: {h}; border-radius: {radio}px; background: repeating-linear-gradient(135deg, {T['niebla']} 0 6px, {T['bruma']} 6px 12px); display: flex; align-items: flex-end; padding: 10px; flex-shrink: 0;"><span style="font-family: {MIC}; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: {T['acero']};">{texto}</span></div>"""

def cabecera_historia(estilo):
    return ""

# ───────────────────────── Dirección A · Editorial ─────────────────────────
def A_historia():
    h = head(T['papel'])
    cuerpo = f"""<div style="width: 1280px; height: 900px; display: flex; overflow: hidden; background: {T['papel']};">
{sidebar("historia")}
<main style="flex: 1; overflow: hidden; padding: 56px 0 0;">
 <div style="width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 32px;">
  <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 24px;">
    <div style="display: flex; flex-direction: column; gap: 8px;">
      {etiqueta("Historia")}
      <h1 style="margin: 0; font-family: {TIT}; font-weight: 500; font-size: 40px; line-height: 1.1; letter-spacing: -0.01em;">La historia de Roberto</h1>
      <p style="margin: 0; font-size: 15px; color: {T['pizarra']};">Está respondiendo, día a día · <span style="color: {T['negro']};">34 min</span> de su voz</p>
    </div>
    <div style="display: flex; gap: 8px; padding-top: 28px;">{boton("Editar preguntas", "lapiz", chico=True)}{boton("Agregar fotos", "foto", chico=True)}</div>
  </div>
  <div style="display: flex; flex-direction: column; gap: 8px;">
    <div style="height: 6px; border-radius: 999px; background: {T['bruma']}; overflow: hidden;"><div style="width: 37%; height: 100%; background: {T['negro']};"></div></div>
    <p style="margin: 0; font-family: {MIC}; font-size: 13px; color: {T['acero']}; font-variant-numeric: tabular-nums;">11 de 30 respuestas</p>
  </div>
  <nav style="display: flex; gap: 8px; flex-wrap: wrap;">
    {"".join(f'<a href="#" style="display: inline-flex; align-items: center; gap: 8px; height: 34px; padding: 0 14px; border-radius: 999px; border: 1px solid {T["negro"] if i < 2 else T["niebla"]}; background: {T["negro"] if i == 0 else "transparent"}; color: {T["blanco"] if i == 0 else (T["negro"] if i == 1 else T["acero"])}; font-family: {MIC}; font-size: 13px; text-decoration: none;"><span style="opacity: 0.7;">{i+1}</span>{c}</a>' for i, c in enumerate(CAPS))}
  </nav>
  <section style="display: flex; flex-direction: column; gap: 28px;">
    <div style="display: flex; align-items: flex-end; justify-content: space-between; border-bottom: 1px solid {T['negro']}; padding-bottom: 16px;">
      <div style="display: flex; align-items: baseline; gap: 16px;"><span style="font-family: {TIT}; font-size: 40px; line-height: 1; color: {T['ceniza']};">1</span><h2 style="margin: 0; font-family: {TIT}; font-weight: 500; font-size: 26px; line-height: 1;">La infancia</h2></div>
      <span style="font-family: {MIC}; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: {T['acero']};">3 de 4</span>
    </div>
    <div style="display: flex; gap: 12px;">{foto_ph("140px","100px","abre el capítulo")}{foto_ph("100px","100px","")}<a href="#" style="display: flex; align-items: center; justify-content: center; width: 100px; height: 100px; border: 1px dashed {T['ceniza']}; border-radius: 8px; color: {T['acero']}; text-decoration: none;">{svg("mas", 20, T['acero'])}</a></div>
    <article style="display: flex; gap: 16px;">
      <span style="width: 24px; text-align: right; font-family: {MIC}; font-size: 14px; color: {T['acero']}; padding-top: 4px;">1</span>
      <div style="flex: 1; display: flex; flex-direction: column; gap: 14px;">
        {etiqueta("12 de septiembre")}
        <h3 style="margin: 0; font-family: {TIT}; font-weight: 500; font-size: 18px; line-height: 1.4;">Cuénteme de la casa donde pasó su infancia. Si cierra los ojos y entra por la puerta, ¿qué ve, qué huele, quién está?</h3>
        {reproductor("3:40")}
        <p style="margin: 0; font-size: 16px; line-height: 1.7; font-weight: 300; color: {T['pizarra']};">{TRANSCRIPCION}</p>
        <a href="#" style="font-family: {MIC}; font-size: 13px; text-decoration: underline; text-underline-offset: 4px; text-decoration-color: {T['ceniza']};">Pedirle que cuente más sobre esto</a>
      </div>
    </article>
    <article style="display: flex; gap: 16px;">
      <span style="width: 24px; text-align: right; font-family: {MIC}; font-size: 14px; color: {T['acero']}; padding-top: 4px;">2</span>
      <div style="flex: 1; display: flex; flex-direction: column; gap: 14px;">
        {etiqueta("13 de septiembre")}
        <h3 style="margin: 0; font-family: {TIT}; font-weight: 500; font-size: 18px; line-height: 1.4;">¿Cómo eran su mamá y su papá? ¿Qué hacían, cómo era vivir con ellos?</h3>
        {reproductor("2:05")}
      </div>
    </article>
    <article style="display: flex; gap: 16px; color: {T['acero']};">
      <span style="width: 24px; text-align: right; font-family: {MIC}; font-size: 14px; padding-top: 2px;">4</span>
      <p style="margin: 0; flex: 1; font-size: 15px; line-height: 1.6; font-weight: 300;">¿Cómo era su escuela? ¿Tuvo algún maestro o compañero que nunca se olvidó? <span style="font-family: {MIC}; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; margin-left: 8px;">todavía no</span></p>
    </article>
  </section>
 </div>
</main>
</div>"""
    return h + cuerpo + FOOT

def A_historia_edicion():
    h = head(T['papel'])
    filas = ""
    for n, txt in [(5, "Hábleme de sus abuelos y de dónde viene su familia. ¿Qué historias le contaban de antes de que usted naciera?"), (6, "Hábleme de sus hermanos. ¿Cómo era cada uno, con quién se llevaba mejor?"), (7, "¿Qué tradiciones había en su casa? Las comidas, las fiestas, los domingos…")]:
        filas += f"""<div style="display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border: 1px solid {T['niebla']}; border-radius: 12px; background: {T['blanco']};">
      <span style="width: 24px; text-align: right; font-family: {MIC}; font-size: 14px; color: {T['acero']}; padding-top: 2px;">{n}</span>
      <p style="margin: 0; flex: 1; font-size: 15px; line-height: 1.6;">{txt}</p>
      <div style="display: flex; gap: 4px;">
        {"".join(f'<a href="#" title="{t}" style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 999px; border: 1px solid {T["niebla"]}; color: {T["pizarra"]}; text-decoration: none;">{svg(i, 16, T["pizarra"])}</a>' for i, t in [("lapiz","Editar"),("arriba","Subir"),("abajo","Bajar"),("x","Sacar")])}
      </div>
    </div>"""
    cuerpo = f"""<div style="width: 1280px; height: 900px; display: flex; overflow: hidden; background: {T['papel']};">
{sidebar("historia")}
<main style="flex: 1; overflow: hidden; padding: 56px 0 0;">
 <div style="width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 28px;">
  <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 24px;">
    <div style="display: flex; flex-direction: column; gap: 8px;">
      {etiqueta("Historia · editando el guion")}
      <h1 style="margin: 0; font-family: {TIT}; font-weight: 500; font-size: 40px; line-height: 1.1;">La historia de Roberto</h1>
      <p style="margin: 0; font-size: 15px; color: {T['pizarra']};">Las que ya se mandaron no se tocan. Las que vienen, sí: editá, sacá, mové.</p>
    </div>
    <div style="display: flex; gap: 8px; padding-top: 28px;">{boton("Listo", "check", primario=True, chico=True)}</div>
  </div>
  <div style="display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-radius: 12px; border: 1px solid {T['violeta']}; background: {T['blanco']};">
    {svg("mas", 20, T['violeta'])}
    <div style="flex: 1; display: flex; flex-direction: column; gap: 2px;">
      <span style="font-family: {MIC}; font-size: 15px; font-weight: 500;">Agregar una pregunta</span>
      <span style="font-size: 14px; color: {T['acero']};">Con o sin foto, al capítulo que elijas. Lugar libre: 6 de 36.</span>
    </div>
    {svg("der", 18, T['violeta'])}
  </div>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <div style="display: flex; align-items: flex-end; justify-content: space-between; border-bottom: 1px solid {T['negro']}; padding-bottom: 12px;">
      <div style="display: flex; align-items: baseline; gap: 16px;"><span style="font-family: {TIT}; font-size: 40px; line-height: 1; color: {T['ceniza']};">2</span><h2 style="margin: 0; font-family: {TIT}; font-weight: 500; font-size: 26px; line-height: 1;">Las raíces</h2></div>
      <span style="font-family: {MIC}; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: {T['acero']};">las que vienen</span>
    </div>
    {filas}
  </section>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <div style="display: flex; align-items: flex-end; justify-content: space-between; border-bottom: 1px solid {T['niebla']}; padding-bottom: 12px;">
      <div style="display: flex; align-items: baseline; gap: 16px;"><span style="font-family: {TIT}; font-size: 40px; line-height: 1; color: {T['ceniza']};">1</span><h2 style="margin: 0; font-family: {TIT}; font-weight: 500; font-size: 26px; line-height: 1; color: {T['acero']};">La infancia</h2></div>
      <span style="font-family: {MIC}; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: {T['acero']};">ya se mandaron · no se tocan</span>
    </div>
  </section>
 </div>
</main>
</div>"""
    return h + cuerpo + FOOT

def libro_mini(oscuro=False, escala=1.0):
    # Un libro abierto: dos páginas, flechas a los costados.
    pw, ph = int(220*escala), int(320*escala)
    pagina_izq = f"""<div style="width: {pw}px; height: {ph}px; background: {T['blanco']}; border: 1px solid {T['niebla']}; border-right: none; border-radius: 4px 0 0 4px; padding: 28px 22px; display: flex; flex-direction: column; gap: 10px; box-shadow: inset -12px 0 20px -16px rgba(20,20,15,0.25);">
      {foto_ph("100%", "110px", "foto · la infancia", 2)}
      <p style="margin: 0; font-family: {MIC}; font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase; color: {T['acero']};">Mar del Plata, verano del 68</p>
      <p style="margin: 6px 0 0; font-size: 9.5px; line-height: 1.6; font-weight: 300; color: {T['pizarra']};">{TRANSCRIPCION} Éramos cinco chicos y un perro que se llamaba Tango.</p>
      <p style="margin: auto 0 0; text-align: center; font-family: {MIC}; font-size: 8px; color: {T['ceniza']};">8</p>
    </div>"""
    pagina_der = f"""<div style="width: {pw}px; height: {ph}px; background: {T['blanco']}; border: 1px solid {T['niebla']}; border-left: none; border-radius: 0 4px 4px 0; padding: 28px 22px; display: flex; flex-direction: column; gap: 10px; box-shadow: inset 12px 0 20px -16px rgba(20,20,15,0.25);">
      <p style="margin: 0; font-family: {MIC}; font-size: 8px; letter-spacing: 0.28em; text-transform: uppercase; color: {T['acero']};">Capítulo dos</p>
      <p style="margin: 0; font-family: {TIT}; font-size: 20px; font-weight: 500;">Las raíces</p>
      <p style="margin: 8px 0 0; font-size: 9.5px; line-height: 1.6; font-weight: 300; color: {T['pizarra']};"><span style="float: left; font-family: {TIT}; font-size: 30px; line-height: 0.8; margin: 2px 4px 0 0;">M</span>is abuelos vinieron de Asturias con una mano atrás y otra adelante. Mi abuelo Ramón tenía las manos como palas y no hablaba nunca de España, salvo cuando tomaba sidra.</p>
      <p style="margin: auto 0 0; text-align: center; font-family: {MIC}; font-size: 8px; color: {T['ceniza']};">9</p>
    </div>"""
    fl = T['blanco'] if oscuro else T['negro']
    flecha = lambda i: f'<a href="#" style="display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 999px; border: 1px solid {T["pizarra"] if oscuro else T["ceniza"]}; color: {fl}; text-decoration: none; flex-shrink: 0;">{svg(i, 18, fl)}</a>'
    return f"""<div style="display: flex; align-items: center; gap: 24px;">
  {flecha("izq")}
  <div style="display: flex; filter: drop-shadow(0 24px 40px rgba(20,20,15,0.25));">{pagina_izq}{pagina_der}</div>
  {flecha("der")}
</div>"""

def productos(cols=3, seleccion=("pdf",), oscuro=False):
    # Ricitos de oro: tres, y al menos uno.
    fg = T['blanco'] if oscuro else T['negro']
    lin = T['pizarra'] if oscuro else T['niebla']
    sub = T['niebla'] if oscuro else T['pizarra']
    men = T['ceniza'] if oscuro else T['acero']
    P = [
      ("pdf", "El libro en PDF", "Se lee en la web, capítulo por capítulo, con sus fotos. Siempre disponible, nunca se pierde.", "$ 85.750", "en la nube"),
      ("audio", "El audiolibro", "La historia completa contada en primera persona: con su voz, clonada de sus audios reales, o con un narrador.", "$ 61.250", "en la nube"),
      ("impreso", "El libro impreso", "Tapa dura, con un código en la contratapa que hace sonar su voz. En tu repisa, para siempre.", "$ 70.000", "B/N · a color $ 80.500"),
    ]
    out = ""
    for clave, nom, det, precio, nota in P:
        sel = clave in seleccion
        bd = fg if sel else lin
        marca = f'<span style="display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 999px; background: {fg}; color: {T["negro"] if oscuro else T["blanco"]};">{svg("check", 14, T["negro"] if oscuro else T["blanco"])}</span>' if sel else f'<span style="width: 22px; height: 22px; border-radius: 999px; border: 1px solid {lin};"></span>'
        out += f"""<div style="flex: 1; display: flex; flex-direction: column; gap: 12px; padding: 24px; border-radius: 16px; border: {2 if sel else 1}px solid {bd}; background: {'transparent'};">
      <div style="display: flex; align-items: center; justify-content: space-between;"><span style="font-family: {MIC}; font-size: 10px; letter-spacing: 0.24em; text-transform: uppercase; color: {men};">{nota}</span>{marca}</div>
      <p style="margin: 0; font-family: {TIT}; font-size: 22px; font-weight: 500; color: {fg};">{nom}</p>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; font-weight: 300; color: {sub};">{det}</p>
      <p style="margin: auto 0 0; padding-top: 8px; font-family: {TIT}; font-size: 26px; color: {fg}; font-variant-numeric: tabular-nums;">{precio}</p>
    </div>"""
    return f'<div style="display: flex; gap: 16px;">{out}</div>'

def A_libro():
    h = head(T['papel'])
    cuerpo = f"""<div style="width: 1280px; height: 900px; display: flex; overflow: hidden; background: {T['papel']};">
{sidebar("libro")}
<main style="flex: 1; overflow: hidden; padding: 56px 0 0;">
 <div style="width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 36px;">
  <div style="display: flex; flex-direction: column; gap: 8px;">
    {etiqueta("Encargar libro · La historia de Roberto")}
    <h1 style="margin: 0; font-family: {TIT}; font-weight: 500; font-size: 40px; line-height: 1.1;">Su libro</h1>
    <p style="margin: 0; font-size: 16px; line-height: 1.6; font-weight: 300; color: {T['pizarra']};">Así va quedando, con lo que contó hasta hoy. Pasá las páginas. Cuando termine, elegís tapa, contratapa y la foto del marco acá mismo.</p>
  </div>
  <div style="display: flex; justify-content: center; padding: 8px 0;">{libro_mini()}</div>
  <div style="display: flex; justify-content: center; gap: 24px; font-family: {MIC}; font-size: 12px; color: {T['acero']};"><span>páginas 8–9 de 64</span><span>·</span><span>capítulo 2 · Las raíces</span></div>
  <div style="display: flex; gap: 12px;">
    {"".join(f'<a href="#" style="flex: 1; display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: 1px solid {T["niebla"]}; border-radius: 12px; background: {T["blanco"]}; text-decoration: none; color: {T["negro"]};">{svg(i, 20, T["pizarra"])}<span style="display: flex; flex-direction: column; gap: 2px;"><span style="font-family: {MIC}; font-size: 14px; font-weight: 500;">{t}</span><span style="font-size: 13px; color: {T["acero"]};">{s}</span></span></a>' for i, t, s in [("tapa","Tapa","Elegir la foto"),("libro","Contratapa","Elegir la foto"),("marco","Marco","La foto de los marcos")])}
  </div>
  <section style="display: flex; flex-direction: column; gap: 16px; border-top: 1px solid {T['niebla']}; padding-top: 32px;">
    {etiqueta("Lo que compraste")}
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-radius: 12px; border: 1px solid {T['niebla']}; background: {T['blanco']};">
      <span style="font-size: 15px;">El libro en PDF · <span style="color: {T['acero']};">se lee acá cuando esté cerrado</span></span>
      <span style="font-family: {MIC}; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: {T['acero']};">pagado</span>
    </div>
  </section>
 </div>
</main>
</div>"""
    return h + cuerpo + FOOT

# ───────────────────────── Dirección B · Estudio ─────────────────────────
def B_historia():
    h = head(T['blanco'])
    rail = "".join(f"""<a href="#" style="display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 12px; border-radius: 8px; text-decoration: none; color: {T['negro'] if i < 3 else T['acero']}; background: {T['bruma'] if i == 0 else 'transparent'}; font-family: {MIC}; font-size: 14px;"><span style="display: flex; align-items: center; gap: 10px;"><span style="font-variant-numeric: tabular-nums; color: {T['humo']};">{str(i+1).zfill(2)}</span>{c}</span><span style="font-size: 11px; color: {T['humo']}; font-variant-numeric: tabular-nums;">{["3/4","0/3","0/5","0/3","0/3","0/3","0/2","0/3"][i]}</span></a>""" for i, c in enumerate(CAPS))
    def fila(n, txt, dur, fecha, respondida=True):
        if respondida:
            return f"""<div style="display: grid; grid-template-columns: 40px minmax(0, 1fr) 200px; gap: 16px; align-items: start; padding: 18px 20px; border: 1px solid {T['bruma']}; border-radius: 12px;">
      <span style="font-family: {TIT}; font-size: 22px; color: {T['ceniza']}; line-height: 1.2;">{n}</span>
      <div style="display: flex; flex-direction: column; gap: 8px; min-width: 0;">
        <p style="margin: 0; font-family: {TIT}; font-size: 16px; font-weight: 500; line-height: 1.4;">{txt}</p>
        <p style="margin: 0; font-size: 14px; line-height: 1.6; font-weight: 300; color: {T['pizarra']}; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">{TRANSCRIPCION}</p>
        <div style="display: flex; gap: 12px; align-items: center;"><span style="font-family: {MIC}; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: {T['acero']};">{fecha}</span><a href="#" style="font-family: {MIC}; font-size: 12px;">Pedirle más</a></div>
      </div>
      {reproductor(dur, "200px")}
    </div>"""
        return f"""<div style="display: grid; grid-template-columns: 40px minmax(0, 1fr) 200px; gap: 16px; align-items: center; padding: 14px 20px; border: 1px dashed {T['niebla']}; border-radius: 12px; color: {T['acero']};">
      <span style="font-family: {TIT}; font-size: 22px; color: {T['niebla']};">{n}</span>
      <p style="margin: 0; font-size: 14px; line-height: 1.5; font-weight: 300;">{txt}</p>
      <span style="justify-self: end; font-family: {MIC}; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;">todavía no</span>
    </div>"""
    cuerpo = f"""<div style="width: 1280px; height: 900px; display: flex; overflow: hidden; background: {T['blanco']};">
{sidebar("historia", oscuro=False, ancho=224)}
<main style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
  <header style="display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 20px 32px; border-bottom: 1px solid {T['bruma']};">
    <div style="display: flex; align-items: center; gap: 20px;">
      <h1 style="margin: 0; font-family: {TIT}; font-weight: 500; font-size: 24px;">La historia de Roberto</h1>
      <span style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: {T['bruma']}; font-family: {MIC}; font-size: 12px;"><span style="width: 8px; height: 8px; border-radius: 999px; background: {T['negro']};"></span>Respondiendo · día 11</span>
    </div>
    <div style="display: flex; gap: 8px;">{boton("Editar preguntas", "lapiz", chico=True)}{boton("Agregar fotos", "foto", chico=True)}{boton("Compartir", None, chico=True)}</div>
  </header>
  <div style="display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 32px; padding: 28px 32px; flex: 1; overflow: hidden;">
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div style="display: flex; flex-direction: column; gap: 10px; padding: 16px; border-radius: 12px; background: {T['papel']};">
        <div style="display: flex; justify-content: space-between; font-family: {MIC}; font-size: 12px; color: {T['acero']};"><span>11 de 30</span><span>34 min de voz</span></div>
        <div style="height: 6px; border-radius: 999px; background: {T['niebla']}; overflow: hidden;"><div style="width: 37%; height: 100%; background: {T['negro']};"></div></div>
      </div>
      <nav style="display: flex; flex-direction: column; gap: 2px;">{rail}</nav>
    </div>
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <h2 style="margin: 0; font-family: {TIT}; font-weight: 500; font-size: 28px;"><span style="color: {T['ceniza']}; margin-right: 12px;">01</span>La infancia</h2>
        <div style="display: flex; gap: 8px;">{foto_ph("56px","40px","",6)}{foto_ph("56px","40px","",6)}<a href="#" style="display: flex; align-items: center; justify-content: center; width: 56px; height: 40px; border: 1px dashed {T['ceniza']}; border-radius: 6px; text-decoration: none;">{svg("mas", 16, T['acero'])}</a></div>
      </div>
      {fila(1, PREG["La infancia"][0][1], "3:40", "12 sep")}
      {fila(2, PREG["La infancia"][1][1], "2:05", "13 sep")}
      {fila(3, PREG["La infancia"][2][1], "4:51", "14 sep")}
      {fila(4, PREG["La infancia"][3][1], None, None, respondida=False)}
    </div>
  </div>
</main>
</div>"""
    return h + cuerpo + FOOT

def B_libro():
    h = head(T['blanco'])
    cuerpo = f"""<div style="width: 1280px; height: 900px; display: flex; overflow: hidden; background: {T['blanco']};">
{sidebar("libro", oscuro=False, ancho=224)}
<main style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
  <header style="display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 20px 32px; border-bottom: 1px solid {T['bruma']};">
    <h1 style="margin: 0; font-family: {TIT}; font-weight: 500; font-size: 24px;">Su libro</h1>
    <span style="font-family: {MIC}; font-size: 12px; color: {T['acero']};">Se cierra cuando termine de contar · vos aprobás</span>
  </header>
  <div style="display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 32px; padding: 28px 32px; flex: 1; overflow: hidden;">
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 32px 24px; border-radius: 16px; background: {T['papel']};">
        {libro_mini(escala=0.95)}
        <div style="display: flex; gap: 20px; font-family: {MIC}; font-size: 12px; color: {T['acero']};"><span>8–9 de 64</span><span>Las raíces</span></div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px;">
        {"".join(f'<div style="display: flex; flex-direction: column; gap: 10px; padding: 14px; border: 1px solid {T["bruma"]}; border-radius: 12px;"><div style="display: flex; align-items: center; justify-content: space-between;"><span style="font-family: {MIC}; font-size: 13px; font-weight: 500;">{t}</span>{svg(i, 18, T["pizarra"])}</div>{foto_ph("100%","72px", s, 6)}</div>' for i, t, s in [("tapa","Tapa","elegir"),("libro","Contratapa","elegir"),("marco","Marco","elegir")])}
      </div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 12px;">
      {etiqueta("Lo que compraste")}
      <div style="display: flex; flex-direction: column; gap: 8px;">
        {"".join(f'<div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-radius: 12px; border: 1px solid {T["negro"] if ok else T["bruma"]};"><span style="display: flex; align-items: center; gap: 10px;">{svg("check" if ok else "mas", 16, T["negro"] if ok else T["acero"])}<span style="font-size: 15px; color: {T["negro"] if ok else T["acero"]};">{n}</span></span><span style="font-family: {MIC}; font-size: 13px; font-variant-numeric: tabular-nums; color: {T["acero"]};">{p}</span></div>' for n, p, ok in [("El libro en PDF","pagado",True),("El audiolibro · con su voz","$ 61.250",False),("El libro impreso · a color","$ 80.500",False),("Marcos con su voz","$ 35.000 c/u",False)])}
      </div>
      <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 8px;">{boton("Sumar al pedido", None, primario=True)}<span style="font-family: {MIC}; font-size: 12px; color: {T['acero']}; text-align: center;">2 copias −10 % · 3 −15 % · 4 o más −20 %</span></div>
    </div>
  </div>
</main>
</div>"""
    return h + cuerpo + FOOT

# ───────────────────────── Dirección C · Álbum ─────────────────────────
def C_historia():
    h = head(T['blanco'])
    cuerpo = f"""<div style="width: 1280px; height: 900px; display: flex; overflow: hidden; background: {T['blanco']};">
{sidebar("historia")}
<main style="flex: 1; overflow: hidden; display: flex; flex-direction: column;">
  <div style="position: relative; height: 300px; background: repeating-linear-gradient(135deg, {T['grafito']} 0 8px, {T['pizarra']} 8px 16px); display: flex; align-items: flex-end; padding: 32px 48px; color: {T['blanco']};">
    <div style="display: flex; align-items: flex-end; justify-content: space-between; width: 100%; gap: 24px;">
      <div style="display: flex; flex-direction: column; gap: 8px;">
        {etiqueta("Historia · 34 min de su voz", T['ceniza'])}
        <h1 style="margin: 0; font-family: {TIT}; font-weight: 500; font-size: 52px; line-height: 1;">Roberto</h1>
        <p style="margin: 0; font-family: {CUE}; font-style: italic; font-size: 17px; font-weight: 300; color: {T['niebla']};">La historia de una vida · 11 de 30 respuestas</p>
      </div>
      <div style="display: flex; gap: 8px;">{boton("Editar preguntas", "lapiz", oscuro=True, chico=True)}{boton("Agregar fotos", "foto", oscuro=True, chico=True)}</div>
    </div>
    <span style="position: absolute; top: 20px; right: 24px; font-family: {MIC}; font-size: 10px; letter-spacing: 0.24em; text-transform: uppercase; color: {T['ceniza']};">foto de portada · elegís en Encargar libro</span>
  </div>
  <div style="display: flex; gap: 0; padding: 0 48px; border-bottom: 1px solid {T['bruma']};">
    {"".join(f'<a href="#" style="padding: 16px 16px 14px; border-bottom: 2px solid {T["negro"] if i == 0 else "transparent"}; font-family: {MIC}; font-size: 13px; color: {T["negro"] if i < 2 else T["acero"]}; text-decoration: none; white-space: nowrap;">{c}</a>' for i, c in enumerate(CAPS))}
  </div>
  <div style="display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 40px; padding: 32px 48px; flex: 1; overflow: hidden;">
    <div style="display: flex; flex-direction: column; gap: 12px;">
      {foto_ph("100%","220px","abre el capítulo", 4)}
      <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px;">{foto_ph("100%","64px","",4)}{foto_ph("100%","64px","",4)}<a href="#" style="display: flex; align-items: center; justify-content: center; height: 64px; border: 1px dashed {T['ceniza']}; border-radius: 4px; text-decoration: none;">{svg("mas", 18, T['acero'])}</a></div>
      <p style="margin: 4px 0 0; font-size: 13px; line-height: 1.5; color: {T['acero']};">Las fotos de esta época van al capítulo. Las de tapa, contratapa y marco se eligen al encargar.</p>
    </div>
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <div style="display: flex; align-items: baseline; gap: 16px;"><span style="font-family: {TIT}; font-size: 48px; line-height: 1; color: {T['ceniza']};">1</span><h2 style="margin: 0; font-family: {TIT}; font-weight: 500; font-size: 32px; line-height: 1;">La infancia</h2><span style="margin-left: auto; font-family: {MIC}; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: {T['acero']};">3 de 4</span></div>
      <article style="display: flex; flex-direction: column; gap: 12px;">
        <p style="margin: 0; font-family: {TIT}; font-size: 20px; font-weight: 500; line-height: 1.35;"><span style="color: {T['ceniza']}; margin-right: 10px;">1</span>Cuénteme de la casa donde pasó su infancia. Si cierra los ojos y entra por la puerta, ¿qué ve, qué huele, quién está?</p>
        <div style="display: flex; align-items: center; gap: 16px;">{reproductor("3:40", "320px")}<span style="font-family: {MIC}; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: {T['acero']};">12 de septiembre</span></div>
        <p style="margin: 0; font-size: 17px; line-height: 1.7; font-weight: 300; color: {T['pizarra']};">{TRANSCRIPCION}</p>
      </article>
      <article style="display: flex; flex-direction: column; gap: 12px;">
        <p style="margin: 0; font-family: {TIT}; font-size: 20px; font-weight: 500; line-height: 1.35;"><span style="color: {T['ceniza']}; margin-right: 10px;">2</span>¿Cómo eran su mamá y su papá? ¿Qué hacían, cómo era vivir con ellos?</p>
        <div style="display: flex; align-items: center; gap: 16px;">{reproductor("2:05", "320px")}<span style="font-family: {MIC}; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: {T['acero']};">13 de septiembre</span></div>
      </article>
    </div>
  </div>
</main>
</div>"""
    return h + cuerpo + FOOT

def C_libro():
    h = head(T['negro'])
    cuerpo = f"""<div style="width: 1280px; height: 900px; display: flex; overflow: hidden; background: {T['negro']}; color: {T['blanco']};">
{sidebar("libro")}
<main style="flex: 1; overflow: hidden; display: flex; flex-direction: column; align-items: center; padding: 48px 48px 0; gap: 28px;">
  <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center;">
    {etiqueta("Encargar libro", T['ceniza'])}
    <h1 style="margin: 0; font-family: {TIT}; font-weight: 500; font-size: 44px; line-height: 1.05;">El libro de Roberto</h1>
    <p style="margin: 0; max-width: 520px; font-size: 16px; line-height: 1.6; font-weight: 300; color: {T['niebla']};">Así va quedando. Cuando termine, le das los últimos retoques y lo cerrás: recién ahí se produce.</p>
  </div>
  {libro_mini(oscuro=True, escala=1.05)}
  <div style="display: flex; gap: 20px; font-family: {MIC}; font-size: 12px; color: {T['ceniza']};"><span>8–9 de 64</span><span>·</span><span>Las raíces</span></div>
  <div style="width: 100%; max-width: 960px;">{productos(seleccion=("pdf",), oscuro=True)}</div>
  <p style="margin: 0; font-family: {MIC}; font-size: 12px; color: {T['ceniza']};">Tapa, contratapa y la foto del marco se eligen acá cuando el libro esté terminado.</p>
</main>
</div>"""
    return h + cuerpo + FOOT

def Precios():
    h = head(T['papel'])
    cuerpo = f"""<div style="width: 1100px; height: 720px; display: flex; flex-direction: column; gap: 32px; padding: 56px 64px; background: {T['papel']};">
  <div style="display: flex; flex-direction: column; gap: 10px; max-width: 640px;">
    {etiqueta("Comprar · paso 2 de 3")}
    <h1 style="margin: 0; font-family: {TIT}; font-weight: 500; font-size: 40px; line-height: 1.1;">¿Cómo querés su libro?</h1>
    <p style="margin: 0; font-size: 16px; line-height: 1.6; font-weight: 300; color: {T['pizarra']};">Elegí al menos uno. Los tres se hacen con la misma entrevista: 30 preguntas por WhatsApp, un audio por día.</p>
  </div>
  {productos(seleccion=("pdf","impreso"))}
  <div style="display: flex; align-items: center; gap: 16px; padding: 16px 20px; border-radius: 12px; border: 1px solid {T['niebla']}; background: {T['blanco']};">
    {svg("marco", 22, T['pizarra'])}
    <div style="flex: 1; display: flex; flex-direction: column; gap: 2px;"><span style="font-family: {MIC}; font-size: 15px; font-weight: 500;">Marcos con su voz</span><span style="font-size: 14px; color: {T['acero']};">Para cada primo y cada tío: se acerca el teléfono y suena. $ 35.000 cada uno.</span></div>
    <div style="display: flex; align-items: center; gap: 12px;"><span style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 999px; border: 1px solid {T['ceniza']};">−</span><span style="font-family: {MIC}; font-size: 16px; width: 20px; text-align: center;">0</span><span style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 999px; border: 1px solid {T['ceniza']};">+</span></div>
  </div>
  <div style="display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-top: auto;">
    <div style="display: flex; flex-direction: column; gap: 4px;"><span style="font-family: {MIC}; font-size: 11px; letter-spacing: 0.24em; text-transform: uppercase; color: {T['acero']};">Total · pago único</span><span style="font-family: {TIT}; font-size: 36px; font-variant-numeric: tabular-nums;">$ 155.750</span></div>
    {boton("Continuar", "der", primario=True)}
  </div>
</div>"""
    return h + cuerpo + FOOT

if __name__ == "__main__":
  for nombre, fn in [("A_Edicion", A_historia_edicion), ("A_Libro", A_libro), ("B_Historia", B_historia), ("B_Libro", B_libro), ("C_Historia", C_historia), ("C_Libro", C_libro), ("Precios", Precios)]:
    open(f"{nombre}.dc.html", "w").write(fn())
  open("A_Historia.dc.html", "w").write(A_historia())
  print("ok")

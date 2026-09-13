# La dirección elegida (13/09): la historia de B (Estudio) con los capítulos por
# venir en el formato de A·Edición, Encargar libro en negro (C), y un botón de
# tema claro/oscuro arriba a la derecha, siempre a la vista. Correr: python3 final.py
from generar import T, TIT, MIC, CUE, CAPS, PREG, TRANSCRIPCION, head, FOOT, svg, foto_ph, libro_mini, productos

# Un juego de roles por tema, como .oscuro en globals.css: se invierten los
# roles, no se reescriben las piezas.
def roles(oscuro):
    if oscuro:
        return dict(fondo=T['negro'], texto=T['blanco'], suave=T['niebla'], menor=T['ceniza'], linea=T['grafito'], lineaF=T['pizarra'], papel=T['grafito'], acento=T['violetaClaro'], acentoTexto=T['negro'], inv=T['negro'])
    return dict(fondo=T['blanco'], texto=T['negro'], suave=T['pizarra'], menor=T['acero'], linea=T['bruma'], lineaF=T['ceniza'], papel=T['papel'], acento=T['violeta'], acentoTexto=T['blanco'], inv=T['blanco'])

def toggle_tema(R, oscuro):
    # El botón del tema: sol / luna, arriba a la derecha, siempre.
    sol = '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>'
    luna = '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'
    return f'<a href="#" title="Cambiar tema" style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 999px; border: 1px solid {R["lineaF"]}; color: {R["texto"]}; text-decoration: none; flex-shrink: 0;"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{sol if oscuro else luna}</svg></a>'

def boton(R, texto, icono=None, primario=False, chico=False, ancho=None):
    h = 40 if chico else 48
    if primario: bg, fg, bd = R['acento'], R['acentoTexto'], R['acento']
    else: bg, fg, bd = "transparent", R['texto'], R['lineaF']
    ic = svg(icono, 18, fg) if icono else ""
    w = f"width: {ancho};" if ancho else ""
    return f'<a href="#" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: {h}px; padding: 0 {18 if chico else 24}px; border-radius: 999px; border: 1px solid {bd}; background: {bg}; color: {fg}; font-family: {MIC}; font-size: {14 if chico else 15}px; font-weight: 500; text-decoration: none; white-space: nowrap; {w}">{ic}{texto}</a>'

def etiqueta(R, texto):
    return f'<p style="margin: 0; font-family: {MIC}; font-size: 11px; letter-spacing: 0.24em; text-transform: uppercase; color: {R["menor"]};">{texto}</p>'

def reproductor(R, dur, ancho="100%"):
    return f"""<div style="display: flex; align-items: center; gap: 12px; width: {ancho}; padding: 6px 16px 6px 6px; border-radius: 999px; border: 1px solid {R['linea']}; background: {R['papel']};">
  <span style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 999px; background: {R['texto']}; color: {R['inv']}; flex-shrink: 0;">{svg("play", 16, R['inv'])}</span>
  <div style="flex: 1; height: 4px; border-radius: 999px; background: {R['lineaF']}; overflow: hidden;"><div style="width: 32%; height: 100%; background: {R['texto']};"></div></div>
  <span style="font-family: {MIC}; font-size: 12px; color: {R['menor']}; font-variant-numeric: tabular-nums;">{dur}</span>
</div>"""

def sidebar(R, activa):
    items = ""
    for clave, nombre in [("inicio","Inicio"),("historia","Historias"),("libro","Encargar libro")]:
        act = clave == activa
        items += f'<a href="#" style="display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-radius: 6px; font-family: {MIC}; font-size: 15px; text-decoration: none; color: {R["texto"] if act else R["suave"]}; background: {R["linea"] if act else "transparent"};">{svg(clave, 20)}{nombre}</a>'
    anillos = [(86.14,13.86,17.63),(73.23,26.77,34.07),(60.65,39.35,50.08),(48.29,51.71,65.82),(36.08,63.92,81.36),(23.99,76.01,96.74),(12.0,88.0,112.0)]
    el = "".join(f'<ellipse cx="{cx}" cy="145" rx="{rx}" ry="{ry}"/><ellipse cx="{200-cx:.2f}" cy="145" rx="{rx}" ry="{ry}"/>' for cx,rx,ry in anillos)
    return f"""<aside style="width: 224px; flex-shrink: 0; display: flex; flex-direction: column; background: {R['fondo']}; color: {R['texto']}; border-right: 1px solid {R['linea']};">
  <div style="display: flex; align-items: center; gap: 12px; padding: 24px 24px 20px;">
    <svg viewBox="-78 31 356 228" width="38" height="24" style="flex-shrink: 0;" aria-hidden="true"><g fill="none" stroke="{R['texto']}" stroke-width="2.4">{el}</g></svg>
    <span style="font-family: {MIC}; font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase;">Vitácora Familiar</span>
  </div>
  <nav style="display: flex; flex-direction: column; gap: 2px; padding: 8px 16px 0;">{items}</nav>
  <p style="margin: auto 24px 24px; font-family: {CUE}; font-style: italic; font-size: 11px; line-height: 1.6; color: {R['menor']};">Para las vidas que merecen su propio libro</p>
</aside>"""

def cabecera(R, oscuro, titulo, derecha=""):
    return f"""<header style="display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 18px 32px; border-bottom: 1px solid {R['linea']};">
    <h1 style="margin: 0; font-family: {TIT}; font-weight: 500; font-size: 24px; color: {R['texto']};">{titulo}</h1>
    <div style="display: flex; align-items: center; gap: 8px;">{derecha}{toggle_tema(R, oscuro)}</div>
  </header>"""

def riel(R, historias_activa=0, capitulo_activo=0, con_capitulos=True):
    # La columna de la izquierda: primero las historias creadas + el botón
    # violeta de empezar otra; debajo, los capítulos de la historia abierta.
    hist = ""
    for i, (nombre, estado) in enumerate([("Roberto", "día 11 · 34 min"), ("Dora", "esperando que acepte")]):
        act = i == historias_activa
        hist += f'<a href="#" style="display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border-radius: 8px; text-decoration: none; color: {R["texto"]}; background: {R["linea"] if act else "transparent"};"><span style="font-family: {TIT}; font-size: 15px;">La historia de {nombre}</span><span style="font-family: {MIC}; font-size: 11px; color: {R["menor"]};">{estado}</span></a>'
    caps = ""
    if con_capitulos:
        cuentas = ["3/4","0/3","0/5","0/3","0/3","0/3","0/2","0/3"]
        for i, c in enumerate(CAPS):
            act = i == capitulo_activo
            hecho = i == 0 and False
            caps += f'<a href="#" style="display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 9px 12px; border-radius: 8px; text-decoration: none; color: {R["texto"] if i < 2 else R["menor"]}; background: {R["linea"] if act else "transparent"}; font-family: {MIC}; font-size: 14px;"><span style="display: flex; align-items: center; gap: 10px;"><span style="font-variant-numeric: tabular-nums; color: {R["menor"]};">{str(i+1).zfill(2)}</span>{c}</span><span style="font-size: 11px; color: {R["menor"]}; font-variant-numeric: tabular-nums;">{cuentas[i]}</span></a>'
        caps = f"""<div style="display: flex; flex-direction: column; gap: 10px; padding: 14px 16px; border-radius: 12px; background: {R['papel']};">
        <div style="display: flex; justify-content: space-between; font-family: {MIC}; font-size: 12px; color: {R['menor']};"><span>11 de 30</span><span>34 min de voz</span></div>
        <div style="height: 6px; border-radius: 999px; background: {R['lineaF']}; overflow: hidden;"><div style="width: 37%; height: 100%; background: {R['texto']};"></div></div>
      </div>
      {etiqueta(R, "Capítulos")}
      <nav style="display: flex; flex-direction: column; gap: 2px;">{caps}</nav>"""
    return f"""<div style="display: flex; flex-direction: column; gap: 14px;">
      {etiqueta(R, "Historias")}
      <nav style="display: flex; flex-direction: column; gap: 2px;">{hist}</nav>
      <div style="display: flex; justify-content: center;">{boton(R, "Empezar una historia", "mas", primario=True, chico=True)}</div>
      <div style="height: 1px; background: {R['linea']}; margin: 6px 0;"></div>
      {caps}
    </div>"""

def fila_respondida(R, n, txt, dur, fecha):
    return f"""<div style="display: grid; grid-template-columns: 40px minmax(0, 1fr) 200px; gap: 16px; align-items: start; padding: 18px 20px; border: 1px solid {R['linea']}; border-radius: 12px;">
      <span style="font-family: {TIT}; font-size: 22px; color: {R['lineaF']}; line-height: 1.2;">{n}</span>
      <div style="display: flex; flex-direction: column; gap: 8px; min-width: 0;">
        <p style="margin: 0; font-family: {TIT}; font-size: 16px; font-weight: 500; line-height: 1.4; color: {R['texto']};">{txt}</p>
        <p style="margin: 0; font-size: 14px; line-height: 1.6; font-weight: 300; color: {R['suave']}; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">{TRANSCRIPCION}</p>
        <div style="display: flex; gap: 12px; align-items: center;"><span style="font-family: {MIC}; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: {R['menor']};">{fecha}</span><a href="#" style="font-family: {MIC}; font-size: 12px; color: {R['acento']};">Pedirle más</a></div>
      </div>
      {reproductor(R, dur, "200px")}
    </div>"""

def fila_pendiente(R, n, txt):
    return f"""<div style="display: grid; grid-template-columns: 40px minmax(0, 1fr) auto; gap: 16px; align-items: center; padding: 14px 20px; border: 1px dashed {R['lineaF']}; border-radius: 12px; color: {R['menor']};">
      <span style="font-family: {TIT}; font-size: 22px; color: {R['lineaF']};">{n}</span>
      <p style="margin: 0; font-size: 14px; line-height: 1.5; font-weight: 300;">{txt}</p>
      <span style="font-family: {MIC}; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;">todavía no</span>
    </div>"""

def fila_editable(R, n, txt):
    botones = "".join(f'<a href="#" title="{t}" style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 999px; border: 1px solid {R["lineaF"]}; color: {R["suave"]}; text-decoration: none;">{svg(i, 16, R["suave"])}</a>' for i, t in [("lapiz","Editar"),("arriba","Subir"),("abajo","Bajar"),("x","Sacar")])
    return f"""<div style="display: grid; grid-template-columns: 40px minmax(0, 1fr) auto; gap: 16px; align-items: center; padding: 14px 20px; border: 1px solid {R['lineaF']}; border-radius: 12px; background: {R['fondo']};">
      <span style="font-family: {TIT}; font-size: 22px; color: {R['lineaF']};">{n}</span>
      <p style="margin: 0; font-size: 15px; line-height: 1.5; color: {R['texto']};">{txt}</p>
      <div style="display: flex; gap: 4px;">{botones}</div>
    </div>"""

def cap_titulo(R, i, nombre, derecha):
    return f"""<div style="display: flex; align-items: center; justify-content: space-between; gap: 16px;">
        <h2 style="margin: 0; font-family: {TIT}; font-weight: 500; font-size: 28px; color: {R['texto']};"><span style="color: {R['lineaF']}; margin-right: 12px;">{str(i).zfill(2)}</span>{nombre}</h2>
        {derecha}
      </div>"""

def fotos_cap(R):
    return f'<div style="display: flex; gap: 8px;">{foto_ph("56px","40px","",6)}{foto_ph("56px","40px","",6)}<a href="#" style="display: flex; align-items: center; justify-content: center; width: 56px; height: 40px; border: 1px dashed {R["lineaF"]}; border-radius: 6px; text-decoration: none;">{svg("mas", 16, R["menor"])}</a></div>'

def historia(oscuro=False, editando=False):
    R = roles(oscuro)
    h = head(R['fondo'])
    if editando:
        derecha = boton(R, "Listo", "check", primario=True, chico=True)
        subt = f'<span style="font-family: {MIC}; font-size: 12px; color: {R["menor"]};">Las que ya se mandaron no se tocan. Las que vienen, sí: editá, sacá, mové.</span>'
    else:
        derecha = boton(R, "Editar preguntas", "lapiz", chico=True) + boton(R, "Agregar fotos", "foto", chico=True) + boton(R, "Compartir", None, chico=True)
        subt = f'<span style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: {R["linea"]}; font-family: {MIC}; font-size: 12px; color: {R["texto"]};"><span style="width: 8px; height: 8px; border-radius: 999px; background: {R["texto"]};"></span>Respondiendo · día 11</span>'
    titulo = f'<span style="display: flex; align-items: center; gap: 20px;">La historia de Roberto {subt}</span>'
    burbuja = f"""<div style="display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-radius: 12px; border: 1px solid {R['acento']}; background: {R['fondo']};">
        {svg("mas", 20, R['acento'])}
        <div style="flex: 1; display: flex; flex-direction: column; gap: 2px;">
          <span style="font-family: {MIC}; font-size: 15px; font-weight: 500; color: {R['texto']};">Agregar una pregunta</span>
          <span style="font-size: 14px; color: {R['menor']};">Con o sin foto, al capítulo que elijas. Lugar libre: 6 de 36.</span>
        </div>
        {svg("der", 18, R['acento'])}
      </div>""" if editando else ""
    cap1 = f"""{cap_titulo(R, 1, "La infancia", fotos_cap(R) if not editando else f'<span style="font-family: {MIC}; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: {R["menor"]};">ya se mandaron · no se tocan</span>')}
      {fila_respondida(R, 1, PREG["La infancia"][0][1], "3:40", "12 sep")}
      {fila_respondida(R, 2, PREG["La infancia"][1][1], "2:05", "13 sep")}
      {fila_pendiente(R, 4, PREG["La infancia"][3][1])}"""
    if editando:
        cap1 = f"""{cap_titulo(R, 1, "La infancia", f'<span style="font-family: {MIC}; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: {R["menor"]};">ya se mandaron · no se tocan</span>')}
      {fila_pendiente(R, 3, PREG["La infancia"][2][1]).replace("todavía no", "enviada")}"""
    cap2_filas = [(5, PREG["Las raíces"][0][1]), (6, PREG["Las raíces"][1][1]), (7, "¿Qué tradiciones había en su casa? Las comidas, las fiestas, los domingos…")]
    cap2 = f"""{cap_titulo(R, 2, "Las raíces", f'<span style="font-family: {MIC}; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: {R["menor"]};">las que vienen</span>')}
      {"".join((fila_editable if editando else fila_pendiente)(R, n, t) for n, t in cap2_filas)}"""
    cuerpo = f"""<div style="width: 1280px; height: 900px; display: flex; overflow: hidden; background: {R['fondo']};">
{sidebar(R, "historia")}
<main style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
  {cabecera(R, oscuro, titulo, derecha)}
  <div style="display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 32px; padding: 24px 32px; flex: 1; overflow: hidden;">
    {riel(R, capitulo_activo=1 if editando else 0)}
    <div style="display: flex; flex-direction: column; gap: 14px;">
      {burbuja}
      {cap2 if editando else cap1}
      <div style="height: 8px;"></div>
      {cap1 if editando else cap2}
    </div>
  </div>
</main>
</div>"""
    return h + cuerpo + FOOT

def historias_lista(oscuro=False):
    # Historias sin una abierta: el riel con las creadas y el botón violeta;
    # a la derecha, las tarjetas (lo que hoy está en Inicio).
    R = roles(oscuro)
    h = head(R['fondo'])
    def tarjeta(nombre, estado, prog, voz, paso, invitada=False):
        return f"""<div style="display: flex; flex-direction: column; gap: 16px; padding: 24px; border: 1px solid {R['linea']}; border-radius: 12px;">
        <div style="display: flex; justify-content: space-between; gap: 16px;">
          <div style="display: flex; flex-direction: column; gap: 6px;">{etiqueta(R, "Te invitaron a esta historia" if invitada else "Historia")}<span style="font-family: {TIT}; font-size: 24px; font-weight: 500; color: {R['texto']};">La historia de {nombre}</span><span style="font-size: 15px; color: {R['suave']};">{estado}</span></div>
          {f'<span style="text-align: right; font-family: {MIC}; font-size: 13px; color: {R["menor"]};"><span style="color: {R["texto"]};">{voz}</span><br><span style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;">de su voz</span></span>' if voz else ''}
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px;"><div style="height: 6px; border-radius: 999px; background: {R['linea']}; overflow: hidden;"><div style="width: {prog}%; height: 100%; background: {R['texto']};"></div></div><span style="font-family: {MIC}; font-size: 13px; color: {R['menor']};">{int(prog*30/100)} de 30 respuestas</span></div>
        <a href="#" style="display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border: 1px solid {R['acento']}; border-radius: 12px; font-family: {MIC}; font-size: 15px; font-weight: 500; color: {R['texto']}; text-decoration: none;">{paso}<span style="color: {R['acento']};">→</span></a>
      </div>"""
    cuerpo = f"""<div style="width: 1280px; height: 900px; display: flex; overflow: hidden; background: {R['fondo']};">
{sidebar(R, "historia")}
<main style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
  {cabecera(R, oscuro, "Tus historias")}
  <div style="display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 32px; padding: 24px 32px; flex: 1; overflow: hidden;">
    {riel(R, historias_activa=-1, con_capitulos=False)}
    <div style="display: flex; flex-direction: column; gap: 16px; max-width: 720px;">
      {tarjeta("Roberto", "Está respondiendo, día a día", 37, "34 min", "Escuchá lo último que contó")}
      {tarjeta("Dora", "Le mandamos la invitación, falta que acepte", 0, None, "Mientras esperás, repasá las preguntas y sumá fotos")}
    </div>
  </div>
</main>
</div>"""
    return h + cuerpo + FOOT

def libro(oscuro=True):
    R = roles(oscuro)
    h = head(R['fondo'])
    cuerpo = f"""<div style="width: 1280px; height: 1000px; display: flex; overflow: hidden; background: {R['fondo']}; color: {R['texto']};">
{sidebar(R, "libro")}
<main style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
  {cabecera(R, oscuro, "Su libro", f'<span style="font-family: {MIC}; font-size: 12px; color: {R["menor"]}; margin-right: 8px;">Se cierra cuando termine de contar · vos aprobás</span>')}
  <div style="display: flex; flex-direction: column; align-items: center; gap: 24px; padding: 32px 48px 0; overflow: hidden;">
    <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center;">
      <h2 style="margin: 0; font-family: {TIT}; font-weight: 500; font-size: 40px; line-height: 1.05;">El libro de Roberto</h2>
      <p style="margin: 0; max-width: 520px; font-size: 15px; line-height: 1.6; font-weight: 300; color: {R['suave']};">Así va quedando, con lo que contó hasta hoy. Pasá las páginas.</p>
    </div>
    {libro_mini(oscuro=oscuro, escala=1.0)}
    <div style="display: flex; gap: 20px; font-family: {MIC}; font-size: 12px; color: {R['menor']};"><span>8–9 de 64</span><span>·</span><span>Las raíces</span></div>
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; width: 100%; max-width: 760px;">
      {"".join(f'<div style="display: flex; flex-direction: column; gap: 10px; padding: 14px; border: 1px solid {R["linea"]}; border-radius: 12px;"><div style="display: flex; align-items: center; justify-content: space-between;"><span style="font-family: {MIC}; font-size: 13px; font-weight: 500;">{t}</span>{svg(i, 18, R["suave"])}</div>{foto_ph("100%","64px", s, 6)}</div>' for i, t, s in [("tapa","Tapa","elegir"),("libro","Contratapa","elegir"),("marco","Marco","elegir")])}
    </div>
    <div style="width: 100%; max-width: 960px; display: flex; flex-direction: column; gap: 12px; padding-top: 8px;">
      {etiqueta(R, "Lo que compraste y lo que podés sumar")}
      {productos(seleccion=("pdf",), oscuro=oscuro)}
    </div>
  </div>
</main>
</div>"""
    return h + cuerpo + FOOT

def comprar():
    R = roles(False)
    h = head(T['papel'])
    pasos = "".join(f'<div style="display: flex; align-items: center; gap: 10px; font-family: {MIC}; font-size: 13px; color: {T["negro"] if i == 3 else T["acero"]};"><span style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 999px; background: {T["negro"] if i <= 3 else "transparent"}; color: {T["blanco"]}; border: 1px solid {T["negro"] if i <= 3 else T["ceniza"]}; font-size: 12px;">{svg("check", 14, T["blanco"]) if i < 3 else i+1}</span>{p}</div>' for i, p in enumerate(["Quién cuenta", "Su WhatsApp", "Tu mail", "Pagar"]))
    cuerpo = f"""<div style="width: 1100px; height: 820px; display: flex; flex-direction: column; gap: 28px; padding: 40px 64px; background: {T['papel']};">
  <div style="display: flex; align-items: center; gap: 28px; padding-bottom: 20px; border-bottom: 1px solid {T['niebla']};">{pasos}</div>
  <div style="display: flex; flex-direction: column; gap: 10px; max-width: 640px;">
    {etiqueta(R, "Paso 4 de 4 · Pagar")}
    <h1 style="margin: 0; font-family: {TIT}; font-weight: 500; font-size: 36px; line-height: 1.1;">¿Cómo querés el libro de Roberto?</h1>
    <p style="margin: 0; font-size: 16px; line-height: 1.6; font-weight: 300; color: {T['pizarra']};">Elegí al menos uno. Los tres salen de la misma entrevista: 30 preguntas por WhatsApp, un audio por día.</p>
  </div>
  {productos(seleccion=("pdf","impreso"))}
  <div style="display: flex; align-items: center; gap: 16px; padding: 14px 20px; border-radius: 12px; border: 1px solid {T['niebla']}; background: {T['blanco']};">
    {svg("marco", 22, T['pizarra'])}
    <div style="flex: 1; display: flex; flex-direction: column; gap: 2px;"><span style="font-family: {MIC}; font-size: 15px; font-weight: 500;">Marcos con su voz</span><span style="font-size: 14px; color: {T['acero']};">Para cada primo y cada tío. $ 35.000 cada uno.</span></div>
    <div style="display: flex; align-items: center; gap: 12px;"><span style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 999px; border: 1px solid {T['ceniza']};">−</span><span style="font-family: {MIC}; font-size: 16px; width: 20px; text-align: center;">0</span><span style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 999px; border: 1px solid {T['ceniza']};">+</span></div>
  </div>
  <div style="display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-top: auto;">
    <div style="display: flex; flex-direction: column; gap: 4px;"><span style="font-family: {MIC}; font-size: 11px; letter-spacing: 0.24em; text-transform: uppercase; color: {T['acero']};">Total · pago único</span><span style="font-family: {TIT}; font-size: 36px; font-variant-numeric: tabular-nums;">$ 155.750</span><span style="font-family: {MIC}; font-size: 12px; color: {T['acero']};">Si él no acepta participar, te devolvemos el dinero.</span></div>
    {boton(R, "Pagar con Mercado Pago", "der", primario=True)}
  </div>
</div>"""
    return h + cuerpo + FOOT

if __name__ == "__main__":
    open("Main.dc.html", "w").write(historia())
    open("Historia_Editando.dc.html", "w").write(historia(editando=True))
    open("Historia_Oscura.dc.html", "w").write(historia(oscuro=True))
    open("Historias.dc.html", "w").write(historias_lista())
    open("Libro.dc.html", "w").write(libro(oscuro=True))
    open("Libro_Claro.dc.html", "w").write(libro(oscuro=False))
    open("Comprar.dc.html", "w").write(comprar())
    print("ok")

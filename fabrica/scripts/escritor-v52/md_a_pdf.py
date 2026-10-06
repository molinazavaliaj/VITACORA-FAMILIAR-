# Libro en markdown → PDF angosto para leer en el celular (Georgia, capítulos en página nueva).
# Uso: python md_a_pdf.py <libro.md> <salida.pdf> "<título>"
import re, sys
from xml.sax.saxutils import escape
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

F = 'C:/Windows/Fonts/'
pdfmetrics.registerFont(TTFont('G', F + 'georgia.ttf'))
pdfmetrics.registerFont(TTFont('GB', F + 'georgiab.ttf'))
pdfmetrics.registerFont(TTFont('GI', F + 'georgiai.ttf'))
pdfmetrics.registerFontFamily('G', normal='G', bold='GB', italic='GI', boldItalic='GB')

src, dst, titulo = sys.argv[1], sys.argv[2], sys.argv[3]
# Página angosta, pensada para leer en el celular
doc = SimpleDocTemplate(dst, pagesize=(105 * mm, 170 * mm), leftMargin=9 * mm, rightMargin=9 * mm,
                        topMargin=11 * mm, bottomMargin=11 * mm, title=titulo)
cuerpo = ParagraphStyle('c', fontName='G', fontSize=11.5, leading=16.5, spaceAfter=7, alignment=TA_LEFT)
cita = ParagraphStyle('q', parent=cuerpo, fontName='GI', leftIndent=10, textColor='#444444')
cap = ParagraphStyle('h', fontName='GB', fontSize=17, leading=22, spaceAfter=14, alignment=TA_LEFT)
tapa = ParagraphStyle('t', fontName='GB', fontSize=24, leading=30, alignment=TA_CENTER)

def inline(t):
    t = escape(t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'<i>\1</i>', t)
    return t

story, primero = [], True
bloques = re.split(r'\n\s*\n', open(src, encoding='utf8').read().replace('\r', ''))
for b in bloques:
    b = b.strip()
    if not b:
        continue
    if b.startswith('# '):
        texto = b[2:].strip()
        if primero:  # título del libro: tapa
            story += [Spacer(1, 45 * mm), Paragraph(inline(texto), tapa), PageBreak()]
            primero = False
        else:
            story += [PageBreak(), Paragraph(inline(texto), cap)]
        continue
    primero = False
    if b.startswith('>'):
        story.append(Paragraph(inline(' '.join(l.lstrip('> ').strip() for l in b.split('\n'))), cita))
    else:
        story.append(Paragraph(inline(' '.join(l.strip() for l in b.split('\n'))), cuerpo))
doc.build(story)
print('ok', dst)

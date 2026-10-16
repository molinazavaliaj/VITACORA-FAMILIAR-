import { describe, expect, it } from 'vitest';
import { suVozValida } from '../../src/escritor-kids/controles.js';
import { dirDeFijo } from '../../src/escritor-kids/material/de-fijo.js';
import { correrKids, salidasDe } from '../../src/escritor-kids/orquestador.js';
import { fuenteDeDisco } from '../../src/escritor-kids/salida/fotos.js';
import { htmlLibroKids, htmlSobreKids, TEXTOS_KIDS_ES_ES } from '../../src/escritor-kids/salida/html.js';
import { armarLibro, libroMd, sobreMd } from '../../src/escritor-kids/salida/libro-md.js';
import { pdfsKids } from '../../src/escritor-kids/salida/pdf.js';
import { armarKids } from './ayuda.js';

async function libroDelChico() {
  const a = armarKids('chico-inventado');
  await correrKids(a.x);
  const lectura = JSON.parse(a.c.leer('salidas/lectura.json'));
  return { a, libro: armarLibro(a.m, salidasDe(a.x, a.m), suVozValida(a.m, lectura)) };
}
const opciones = { fotos: fuenteDeDisco(dirDeFijo('chico-inventado')), urlDeAudio: (v: { respuesta: { respuestaId: string } }) => `https://ejemplo.test/voz#${v.respuesta.respuestaId}`, conFuentes: false };

describe('armado del libro de Kids', () => {
  it('libro.md: tapa, las cuatro partes con sus títulos y piezas, las del padre al final con su línea, el álbum y «Su voz»', async () => {
    const { libro } = await libroDelChico();
    const md = libroMd(libro);
    expect(md.startsWith('# Benjamín Sosa\n\nCapítulo Uno: 11 años\n\n## De chiquito\n\n### Una pileta azul\n')).toBe(true);
    for (const t of ['## Mi gente', '## Mi mundo ahora', '## Lo que me pasó', '## Mis cosas a los 11', '## Su voz']) expect(md).toContain(t);
    expect(md).toContain('*Esta pregunta te la manda tu mamá*\n\n**¿Qué es lo que más te gusta de tu hermana Delfi, aunque se peleen?**');
    expect(md).toContain('**¿Qué te acordás del día que nació Simón?**'); // sin línea
    expect(md).not.toContain('Esta pregunta te la manda tu mamá*\n\n**¿Qué te acordás');
    expect(libro.suVoz.map((v) => v.id)).toEqual(['R04', 'R14', 'R27', 'R43', 'R56', 'R64', 'R72']);
    expect(libro.album.fotos).toHaveLength(14);
  });

  it('sobre.md aparte, con cada pregunta y su respuesta; el libro no tiene nada del sobre', async () => {
    const { libro } = await libroDelChico();
    const s = sobreMd(libro);
    expect(s).toContain('# Para cuando seas grande');
    expect(s).toContain('**Hacele una pregunta a la persona que vas a ser cuando abras el sobre. La que quieras.**\n\n¿Seguís siendo de Vélez?');
    expect(libroMd(libro)).not.toContain('¿Seguís siendo de Vélez?');
  });

  it('el HTML lleva las fotos del disco y un QR por respuesta de «Su voz»; el sobre ninguno', async () => {
    const { libro } = await libroDelChico();
    const html = await htmlLibroKids(libro, opciones);
    expect(html.match(/<img src="data:image\/jpeg;base64/g)).toHaveLength(14);
    expect(html.match(/alt="Código para escuchar esta respuesta"/g)).toHaveLength(7);
    expect(html).toContain('Capítulo Uno: 11 años');
    expect(html).toContain('window.__libroPaginado = true');
    expect(htmlSobreKids(libro, opciones)).not.toContain('Código para escuchar');
  });

  it('es-AR (sin idioma o es-AR): los textos fijos en vos, como siempre', async () => {
    const { libro } = await libroDelChico();
    expect(libro.idioma).toBe('es-AR');
    const html = await htmlLibroKids(libro, opciones);
    expect(html).toContain('Apuntá el teléfono al código y la escuchás.');
    expect(html).toContain('>Escuchala<');
    expect(html).toContain('<h2>Su voz</h2>');
    expect(html).toContain('Parte Uno');
    expect(await htmlLibroKids({ ...libro, idioma: undefined }, opciones)).toBe(html);
  });

  it('un chico de España: los textos fijos del libro y del sobre en tú (aprobados 16/10, tanda 8)', async () => {
    const { a, libro: deAr } = await libroDelChico();
    const m = { ...a.m, ficha: { ...a.m.ficha, idioma: 'es-ES' } };
    const libro = armarLibro(m, salidasDe(a.x, a.m), { ids: deAr.suVoz.map((v) => v.id) });
    expect(libro.idioma).toBe('es-ES');
    const html = await htmlLibroKids(libro, opciones);
    expect(TEXTOS_KIDS_ES_ES.suVozBajada).toBe('Estas respuestas están también en audio, tal como las dijo. Apunta el móvil al código y la escuchas.');
    expect(html).toContain('<p class="bajada">Estas respuestas están también en audio, tal como las dijo. Apunta el móvil al código y la escuchas.</p>');
    expect(html.match(/>Escúchala</g)).toHaveLength(7);
    expect(html.match(/alt="Código para escuchar esta respuesta"/g)).toHaveLength(7);
    expect(html).toContain('<h2>Su voz</h2>');
    expect(html).toContain('Parte Uno');
    expect(html).toContain('VITÁCORA');
    expect(html).not.toMatch(/Apuntá el teléfono|>Escuchala</);
    const sobre = htmlSobreKids(libro, opciones);
    expect(sobre).toContain('VITÁCORA');
    expect(sobre).not.toMatch(/Apuntá el teléfono|>Escuchala</);
  });

  it('genera los dos PDF A5 con Chromium', async () => {
    const { libro } = await libroDelChico();
    const p = await pdfsKids(libro, opciones);
    for (const b of [p.libro, p.sobre]) {
      expect(b.subarray(0, 5).toString()).toBe('%PDF-');
      // A5 en puntos (Chromium redondea a 420 x 595,92)
      expect(/MediaBox \[0 0 (419\.\d+|420) 595\.\d+\]/.test(b.toString('latin1'))).toBe(true);
    }
    expect(p.libro.length).toBeGreaterThan(p.sobre.length);
  }, 120_000);
});

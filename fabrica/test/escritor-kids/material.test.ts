import { describe, expect, it } from 'vitest';
import { corregir, destinoDe, idiomaDelChico, lineaDelPadre, materialDeFilas, preguntaDe, textoDeFila, textoNombres, todasLasRespuestas } from '../../src/escritor-kids/material/de-filas.js';
import { bancoDe, preguntaEn } from '../../src/kids-v2/banco.js';
import { filasDeFijo } from '../../src/escritor-kids/material/de-fijo.js';
import type { FilasKids } from '../../src/escritor-kids/material/tipos.js';
import { fichaXml, itemXml, llamadaAlbum, llamadaArreglo, llamadaLeer, llamadaParte, llamadaSobre, llamadaVeedor, materialXml } from '../../src/escritor-kids/llamadas.js';

const m = materialDeFilas(filasDeFijo('chico-inventado'));
const item = (clave: string) => [...m.partes.flatMap((p) => p.items), ...m.sobre.items].find((i) => i.clave === clave);

describe('material de Kids', () => {
  it('la ficha: apodo, género m/f, quién regala y las preguntas del padre con su línea', () => {
    expect(m.ficha).toMatchObject({ nombre: 'Benjamín Sosa', llamado: 'Benja', edad: 11, genero: 'm', quienRegala: 'tu mamá' });
    expect(m.ficha.preguntasPadre.map((p) => [p.clave, p.quien, p.linea])).toEqual([
      ['PADRE-1', 'tu mamá', 'Esta pregunta te la manda tu mamá'],
      ['PADRE-2', 'tu mamá', ''],
      ['PADRE-3', 'tu papá', 'Esta pregunta te la manda tu papá'],
    ]);
    expect(lineaDelPadre('tus abuelos')).toBe('Esta pregunta te la mandan tus abuelos');
    expect(lineaDelPadre('Papá y mamá')).toBe('Esta pregunta te la mandan Papá y mamá');
  });

  it('saltea null, ∅, botones y lo vacío; ids cortos R01… sin huecos', () => {
    const rs = todasLasRespuestas(m);
    expect(rs.map((r) => r.id)).toEqual(rs.map((_, i) => `R${String(i + 1).padStart(2, '0')}`));
    expect(rs.some((r) => r.texto.includes('⟦'))).toBe(false);
    expect(rs.some((r) => /holaa|cuando llega el libro/.test(r.texto))).toBe(false);
    expect(textoDeFila({ id: 'x', pregunta_orden: 1, audio_path: null, texto_directo: '⟦botón:Paso⟧', transcripcion: null, clave_kids: 'K9' })).toBeNull();
    expect(item('K9')).toBeUndefined(); // la pasó
    expect(item('K19')).toBeUndefined();
  });

  it('agrupa por item del banco en su orden: principal, rama y otra puerta; extras y cierre al final; las del padre al final de la 4', () => {
    expect(m.partes.map((p) => p.titulo)).toEqual(['De chiquito', 'Mi gente', 'Mi mundo ahora', 'Lo que me pasó']);
    expect(item('K12')?.respuestas.map((r) => r.clave)).toEqual(['K12-R1', 'K12-OP']);
    expect(item('K12')?.respuestas[0].pregunta).toContain('Contame la última vez que te reíste mucho con un hermano');
    expect(m.partes[1].items.map((i) => i.clave).slice(-2)).toEqual(['X2-9', 'CIERRE-2']);
    expect(m.partes[3].items.map((i) => i.clave).slice(-3)).toEqual(['PADRE-1', 'PADRE-2', 'PADRE-3']);
    expect(item('PADRE-3')?.padre).toEqual({ quien: 'tu papá', conLinea: true, linea: 'Esta pregunta te la manda tu papá' });
    expect(item('K5')?.pregunta).toContain('de chico'); // {{o/a}} con su género
  });

  it('la parte 5, sus extras y el CIERRE-FINAL van al sobre', () => {
    expect(m.sobre.titulo).toBe('Para cuando seas grande');
    expect(m.sobre.items.map((i) => i.clave)).toEqual(['K41', 'K42', 'K43', 'K44', 'K45', 'K46', 'K47', 'X5-2', 'X5-3', 'CIERRE-FINAL']);
    expect(item('X5-2')?.respuestas[0]).toMatchObject({ texto: 'Pancho. Para un perro. Para un hijo no se, Bautista', audio: false });
  });

  it('las fotos van al álbum con lo que mandó con ella y lo que contó después; sin foto, lo que contó va a su item', () => {
    expect(m.fotos).toHaveLength(14);
    const f1 = m.fotos[0];
    expect(f1).toMatchObject({ id: 'F01', clave: 'K1-FOTO', item: 'K1', parte: 1, fotoId: 'bb89c3d4-1afb-5bcc-9067-6727111d2c4e' });
    expect(f1.respuestas.map((r) => [r.texto.slice(0, 10), r.audio])).toEqual([['el buzz', false], ['Este es el', true]]);
    // K4: tocó «No tengo» y contó igual: va a K4.
    expect(item('K4')?.respuestas.map((r) => r.clave)).toEqual(['K4', 'K4-FOTO']);
  });

  it('aplica cada corrección de nombre SOLO en la respuesta donde la marcó el padre (en la copia) y sabe qué tiene audio', () => {
    expect(m.correcciones).toEqual([{ dice: 'Oriel', es: 'Uriel', veces: 3 }, { dice: 'Mate', es: 'Maite', veces: 3 }]);
    const rs = todasLasRespuestas(m);
    const marcada = rs.find((r) => r.respuestaId === '87d1515a-3083-5d24-8636-11ec3174df35')!;
    expect(marcada.texto).toContain('Uriel');
    expect(marcada.texto).not.toContain('Oriel');
    // En las otras queda como lo dijo: lo corrige el modelo, con la lista, solo si es ese nombre.
    expect(rs.filter((r) => r.texto.includes('Oriel')).length).toBeGreaterThan(0);
    expect(corregir('Mate y mate, Matea', [{ dice: 'Mate', es: 'Maite' }])).toEqual({ texto: 'Maite y mate, Matea', veces: [1] });
    expect(rs.filter((r) => r.audio).every((r) => r.audioPath)).toBe(true);
    const filas = filasDeFijo('chico-inventado');
    expect(filas.respuestas.find((r) => r.id === '87d1515a-3083-5d24-8636-11ec3174df35')?.transcripcion ?? '').toContain('Oriel'); // lo guardado no cambia
  });

  it('«Mate»→«Maite» no toca «tomamos mate con la abuela» en otra respuesta, ni «Mate» con mayúscula en otra', () => {
    const f: FilasKids = structuredClone(filasDeFijo('chico-preocupante'));
    f.respuestas.push({ id: 'otra', pregunta_orden: 17.5, audio_path: 'x.ogg', texto_directo: null, transcripcion: 'Mate. Los domingos tomamos mate con la abuela.', clave_kids: 'K13-OP' });
    f.respuestas.push({ id: 'la-seño', pregunta_orden: 17.6, audio_path: 'y.ogg', texto_directo: null, transcripcion: 'La seño Mate es la de Naturales.', clave_kids: 'X2-1' });
    f.kids.correcciones = [{ respuesta_id: 'la-seño', dice: 'Mate', es: 'Maite' }];
    const mm = materialDeFilas(f);
    const rs = todasLasRespuestas(mm);
    expect(rs.find((r) => r.respuestaId === 'otra')?.texto).toBe('Mate. Los domingos tomamos mate con la abuela.');
    expect(rs.find((r) => r.respuestaId === 'la-seño')?.texto).toBe('La seño Maite es la de Naturales.');
    expect(mm.correcciones).toEqual([{ dice: 'Mate', es: 'Maite', veces: 1 }]);
    expect(textoNombres(mm.correcciones)).toBe('Estos nombres se escriben así, «Maite» y no «Mate». Corregilos solo cuando es ese nombre, no cuando es otra palabra que se escribe igual.');
    expect(textoNombres([])).toBe('No hay.');
  });

  it('la lista de nombres llega como dato a Leer todo, Parte, Sobre, Álbum y Arreglo; no al Veedor', () => {
    const lista = 'Estos nombres se escriben así, «Uriel» y no «Oriel», «Maite» y no «Mate».';
    expect(textoNombres(m.correcciones).startsWith(lista)).toBe(true);
    for (const l of [llamadaLeer(m), llamadaParte(m, 2), llamadaSobre(m), llamadaAlbum(m), llamadaArreglo(m, 2, [], [])]) {
      expect(l.instr, l.nombre).toContain(`Nombres que corrigió la familia. ${lista}`);
      expect(l.instr, l.nombre).not.toContain('{{');
    }
    expect(llamadaVeedor(m, 2, { piezas: [], afuera: [] }).instr).not.toContain('Nombres que corrigió');
  });

  it('destino de cada clave', () => {
    expect(destinoDe('K12-R1-2')).toEqual({ item: 'K12', parte: 2 });
    expect(destinoDe('UNA-MAS-3')).toEqual({ item: 'CIERRE-3', parte: 3 });
    expect(destinoDe('EXTRAS')).toEqual({ item: 'CIERRE-FINAL', parte: 5 });
    expect(destinoDe('PREG-NUEVA-CHICO')).toBeNull();
  });

  it('lo que llegó sin item propio va con lo anterior; si no hay nada antes, a sinLugar', () => {
    const f: FilasKids = structuredClone(filasDeFijo('chico-preocupante'));
    f.respuestas.push({ id: 'a', pregunta_orden: 0, audio_path: null, texto_directo: 'hola soy yo', transcripcion: null, clave_kids: 'BIEN-CHICO' });
    f.respuestas.push({ id: 'b', pregunta_orden: 8.5, audio_path: null, texto_directo: 'me olvidé de algo', transcripcion: null, clave_kids: 'PREG-NUEVA-CHICO' });
    const mm = materialDeFilas(f);
    expect(mm.sinLugar.map((x) => x.texto)).toEqual(['hola soy yo']);
    expect(mm.partes[0].items.find((i) => i.clave === 'K2')?.respuestas.map((r) => r.texto)).toContain('me olvidé de algo');
  });

  it('el XML que lee el modelo: ficha, items con sus respuestas y el material entero', () => {
    expect(fichaXml(m.ficha)).toContain('<pregunta_del_padre clave="PADRE-3" quien="tu papá" conLinea="si">');
    expect(itemXml(item('K12')!)).toMatch(/^<item clave="K12" pregunta="Vamos con hermanos.">\n<respuesta id="R26" clave="K12-R1" pregunta="[^"]+" audio="si">Delfi y Simón. Con Simón, siempre.<\/respuesta>/);
    const x = materialXml(m);
    expect(x).toContain('<parte n="5" titulo="Para cuando seas grande">');
    expect(x).toContain('<foto id="F01" clave="K1-FOTO"');
  });
});

describe('material de Kids en el idioma del chico (ficha.idioma)', () => {
  const base = filasDeFijo('chico-inventado');
  const enEs = (kids: Partial<FilasKids['kids']>, ficha: Record<string, unknown> = {}): FilasKids => ({ ...base, kids: { ...base.kids, ...kids, ficha: { ...base.kids.ficha, ...ficha } } });
  const es = materialDeFilas(enEs({ idioma: 'es-ES' }, { idioma: 'es-ES', temasSacados: ['papa'] }));
  const itemEs = (clave: string) => [...es.partes.flatMap((p) => p.items), ...es.sobre.items].find((i) => i.clave === clave);

  it('el idioma: ficha.idioma si la web lo puso; si no, la columna; si no es de Kids, es-AR', () => {
    expect(idiomaDelChico(base)).toBe('es-AR');
    expect(idiomaDelChico(enEs({}, { idioma: 'es-ES' }))).toBe('es-ES');
    expect(idiomaDelChico(enEs({ idioma: 'es-ES' }))).toBe('es-ES');
    expect(idiomaDelChico(enEs({ idioma: 'ca' }))).toBe('es-AR');
    expect(es.ficha.idioma).toBe('es-ES');
  });

  it('los títulos de las partes y del sobre salen del banco de España', () => {
    expect(es.partes.map((p) => p.titulo)).toEqual(['De pequeño', 'Mi gente', 'Mi mundo ahora', 'Lo que me ha pasado']);
    expect(es.partes.map((p) => p.titulo)).toEqual(bancoDe('es-ES').capitulos.slice(0, 4).map((c) => c.titulo));
    expect(es.sobre.titulo).toBe('Para cuando seas mayor');
  });

  it('las preguntas del libro y del sobre son las que le llegaron, en tú (principal, rama, extra, cierre)', () => {
    expect(itemEs('K12')?.respuestas[0].pregunta).toContain('Cuéntame la última vez que te reíste mucho con un hermano');
    expect(itemEs('K5')?.pregunta).toContain('de pequeño');
    expect(itemEs('X2-9')?.pregunta).toBe(preguntaDe('X2-9', 'chico', [], [], 'es-ES'));
    expect(itemEs('X2-9')?.pregunta).toContain('para que no te regañaran');
    expect(itemEs('CIERRE-2')?.pregunta).toBe(bancoDe('es-ES').mensajes.find((x) => x.id === 'CIERRE-2')?.texto);
    expect(itemEs('K41')?.pregunta).toBe(preguntaEn('K41', 'es-ES').texto);
    for (const i of [...es.partes.flatMap((p) => p.items), ...es.sobre.items]) if (!i.clave.startsWith('PADRE-')) expect(i.pregunta, i.clave).not.toMatch(/Contame|\bvos\b|tenés/);
    expect(es.fotos.filter((f) => f.pregunta).every((f) => !/Contame|Mostrame|Sacale/.test(f.pregunta))).toBe(true);
  });

  it('K18 con un tema sacado: la frase de España recortada (sin la de es-AR)', () => {
    expect(preguntaDe('K18', 'chico', ['papa'], [], 'es-ES')).toBe('¿Hay alguien que ahora es de tu familia pero antes no, como la pareja de tu madre, o alguien que ha venido a vivir con vosotros? Cuéntame el día que os conocisteis.');
    expect(preguntaDe('K18', 'chico', ['mama', 'papa'], [], 'es-ES')).toContain('como alguien que ha venido a vivir con vosotros');
    expect(preguntaDe('K18', 'chico', ['papa'], [])).toContain('como la pareja de tu mamá, o alguien que vino a vivir con ustedes');
  });

  it('es-AR queda igual que antes', () => {
    expect(m.partes.map((p) => p.titulo)).toEqual(['De chiquito', 'Mi gente', 'Mi mundo ahora', 'Lo que me pasó']);
  });
});

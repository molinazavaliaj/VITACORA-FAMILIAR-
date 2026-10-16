// Kids V2 en catalán (ca): mismo molde que es-ES (kids-v2-idiomas.test.ts). La estructura sale SIEMPRE de banco.md y
// mensajes.md; docs/kids/v2/idiomas/banco-ca.md solo trae los textos, por ID. Lo propio del catalán: el género por
// palabra entera ({{petit/petita}}), el plural de «els teus», los botones con «en» y las listas de «algo
// preocupante» y de «dice que no» (BORRADOR). Chicos INVENTADOS.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsearTextosIdiomaKidsMd } from '../src/kids-v2/banco-idioma-md.js';
import { BANCO, bancoDe, botonCanonico, botonEn, entradasDelBanco, extraEn, fijoEn, pregunta, preguntaEn } from '../src/kids-v2/banco.js';
import bancoCaJson from '../src/kids-v2/banco-ca.json' with { type: 'json' };
import { temaDeExtra, textoSegunTemas, validarFicha, type Ficha, type Tema } from '../src/kids-v2/compra.js';
import { idiomaDe, IDIOMAS_KIDS, nombrePlantilla, PLANTILLA_KIDS_IDIOMA } from '../src/kids-v2/idioma.js';
import { nuevoEstado, paso, type Enviado, type Fase, type Salida } from '../src/kids-v2/motor.js';
import { preguntaMsg } from '../src/kids-v2/motor/mensajes.js';
import { diceQueNo, procesarRafaga, sumarARafaga } from '../src/kids-v2/motor/rafaga.js';
import { FRASES_EXCLUIDAS_CA, FRASES_PREOCUPANTES_CA, fraseQueSalta, normalizar } from '../src/kids-v2/preocupante.js';
import { correrUno, idiomaDeSemilla } from '../src/kids-v2/simulacion.js';
import { conGenero, esPlural, normalizarQuienRegala } from '../src/kids-v2/texto.js';
import { correr, type Accion } from '../src/kids-v2/corrida.js';
import { ctx, estadoEn, FICHA, ids, iso } from './kids-v2-ayuda.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const leer = (...p: string[]) => readFileSync(path.join(RAIZ, 'docs', 'kids', 'v2', ...p), 'utf8').replace(/\r\n/g, '\n');
const TEXTOS = parsearTextosIdiomaKidsMd(leer('idiomas', 'banco-ca.md'));
const ES = parsearTextosIdiomaKidsMd(leer('idiomas', 'banco-es-ES.md'));
const ENTRADAS = entradasDelBanco();
const FICHA_CA: Ficha = { ...FICHA, nombre: 'Jana Puig', apodo: 'Jana', genero: 'chica', quienRegala: 'Els teus pares', zona: 'Europe/Madrid', idioma: 'ca' };

const GENERO = /^[^/]+\/[^/]+$/;
/** Las marcas que no son de género ({{1}}, {{2}}, {{3}}), ordenadas. */
const posicionales = (s: string) => [...s.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1]).filter((x) => !GENERO.test(x)).sort().join(',');
const deGenero = (s: string) => [...s.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1]).filter((x) => GENERO.test(x));

// ── El json y las ataduras ───────────────────────────────────────────────────

describe('kids v2 catalán: banco-ca.md atado a banco.md', () => {
  it('el json commiteado está al día con el md (si falla: npx tsx scripts/kids-v2-json.ts)', () => {
    expect(bancoCaJson).toEqual(TEXTOS);
  });

  it('los 271 IDs, ni uno de más', () => {
    const idsBanco = ENTRADAS.map((e) => e.id);
    expect(idsBanco).toHaveLength(271);
    expect(idsBanco.filter((id) => !(id in TEXTOS)), 'faltan').toEqual([]);
    expect(Object.keys(TEXTOS).filter((id) => !idsBanco.includes(id)), 'sobran').toEqual([]);
  });

  it('las mismas variables ({{1}}, {{2}}, {{3}}) que el banco, y género donde España lo tiene (K40 lleva dos)', () => {
    expect(ENTRADAS.filter((e) => posicionales(e.texto) !== posicionales(TEXTOS[e.id])).map((e) => e.id)).toEqual([]);
    const mal = ENTRADAS.filter((e) => {
      const ca = deGenero(TEXTOS[e.id]).length;
      const es = deGenero(ES[e.id]).length;
      return e.id === 'K40' ? !(es === 1 && ca === 2) : ca !== es;
    }).map((e) => `${e.id}: es-ES ${deGenero(ES[e.id]).length}, ca ${deGenero(TEXTOS[e.id]).length}`);
    expect(mal).toEqual([]);
    // En catalán no queda ningún {{o/a}}: el género va con la palabra entera.
    expect(Object.entries(TEXTOS).filter(([, t]) => t.includes('{{o/a}}')).map(([id]) => id)).toEqual([]);
    expect(deGenero(TEXTOS.K40)).toEqual(['trist/trista', 'enfadat/enfadada']);
  });

  it('los botones caben en WhatsApp (hasta 20 letras) y ningún texto lleva dos puntos', () => {
    expect(ENTRADAS.filter((e) => e.boton && TEXTOS[e.id].length > 20).map((e) => e.id)).toEqual([]);
    expect(Object.entries(TEXTOS).filter(([, t]) => t.includes(':')).map(([id]) => id)).toEqual([]);
  });

  it('bancoDe(ca): las mismas preguntas, ramas, fotos, marcas y orden, con los textos del md', () => {
    const b = bancoDe('ca');
    const forma = (x: typeof BANCO) => ({
      preguntas: x.preguntas.map((p) => [p.id, p.cap, p.ramas.map((r) => (r.accion.tipo === 'preguntar' ? r.accion.pasos.length : r.accion.tipo)), !!p.op, p.foto?.botones.length ?? 0, p.sensible]),
      extras: x.extras.map((e) => [e.id, e.cap, e.foto, e.sensible]),
      mensajes: x.mensajes.map((m) => [m.id, m.botones.length, m.plantilla !== null]),
    });
    expect(forma(b)).toEqual(forma(BANCO));
    expect(entradasDelBanco(b).map((e) => [e.id, e.texto])).toEqual(ENTRADAS.map((e) => [e.id, TEXTOS[e.id]]));
    expect(preguntaEn('K12', 'ca').ramas.map((r) => r.boton)).toEqual(['Tinc germans', 'No tinc germans']);
    expect(fijoEn('B-SEGUIR', 'ca').botones).toEqual(["D'acord, una altra", 'Demà segueixo']);
    expect(bancoDe('ca').capitulos.map((c) => c.titulo)).toEqual(['Els primers anys', 'La meva gent', 'El meu món ara', "El que m'ha passat", 'Per quan siguis gran (la càpsula)']);
  });

  it('las plantillas: mismo nombre con _ca, idioma de Meta «ca», y son las 13 de plantillas-meta-kids-ca.md', () => {
    expect(PLANTILLA_KIDS_IDIOMA.ca).toEqual({ sufijo: '_ca', idiomaMeta: 'ca' });
    expect(nombrePlantilla('kids_final', 'ca')).toBe('kids_final_ca');
    const md = leer('idiomas', 'plantillas-meta-kids-ca.md');
    const enMd = [...md.matchAll(/^## \d+b?\. `(kids_[a-z0-9_]+)`/gm)].map((m) => m[1]).sort();
    const delBanco = bancoDe('ca').mensajes.flatMap((m) => (m.plantilla ? [m.plantilla] : []));
    expect(delBanco.every((n) => n.endsWith('_ca'))).toBe(true);
    expect(BANCO.mensajes.flatMap((m) => (m.plantilla ? [`${m.plantilla}_ca`] : []))).toEqual(delBanco);
    expect(enMd).toHaveLength(13);
    expect(enMd).toEqual(expect.arrayContaining([...delBanco, 'kids_final_ca', 'kids_final_plural_ca']));
  });

  it('las extras de la madre y el padre salen con su tema también en catalán', () => {
    for (const x of BANCO.extras) expect(temaDeExtra(extraEn(x.id, 'ca')), x.id).toBe(temaDeExtra(x));
  });
});

// ── El género por palabra entera ─────────────────────────────────────────────

describe('kids v2 catalán: el género por palabra entera', () => {
  it('{{petit/petita}} se llena con la palabra entera, y {{o/a}} sigue igual', () => {
    expect(conGenero('quan eres més {{petit/petita}}', 'chico')).toBe('quan eres més petit');
    expect(conGenero('quan eres més {{petit/petita}}', 'chica')).toBe('quan eres més petita');
    expect(conGenero('{{nerviós/nerviosa}} i {{sol/sola}}', 'chica')).toBe('nerviosa i sola');
    expect(conGenero('pequeñ{{o/a}}', 'chico')).toBe('pequeño');
    expect(conGenero('pequeñ{{o/a}}', 'chica')).toBe('pequeña');
    // Lo que no es de género no se toca.
    expect(conGenero('Hola {{1}}, {{nombre}}', 'chica')).toBe('Hola {{1}}, {{nombre}}');
  });

  it('K40 lleva dos marcas y las dos se llenan', () => {
    const k40 = (genero: 'chico' | 'chica') => preguntaMsg(nuevoEstado({ ...FICHA_CA, genero }), pregunta('K40')).texto;
    expect(k40('chico')).toBe("Pensa en l'última vegada que estaves trist o enfadat i algú et va fer sentir millor. Explica-m'ho, i digues-me qui.");
    expect(k40('chica')).toBe("Pensa en l'última vegada que estaves trista o enfadada i algú et va fer sentir millor. Explica-m'ho, i digues-me qui.");
  });

  it('ningún texto en catalán deja una marca de género sin llenar', () => {
    for (const [id, t] of Object.entries(TEXTOS)) for (const g of ['chico', 'chica'] as const) expect(conGenero(t, g), id).not.toMatch(/\{\{[^}]*\/[^}]*\}\}/);
  });
});

// ── Quien regala y el plural ─────────────────────────────────────────────────

describe('kids v2 catalán: quien regala', () => {
  it('«Els teus» y «Les teves» son plural; «La teva» y «El teu», no', () => {
    expect(esPlural('Els teus pares')).toBe(true);
    expect(esPlural('les teves àvies')).toBe(true);
    expect(esPlural('La teva mare')).toBe(false);
    expect(esPlural('el teu pare')).toBe(false);
    expect(esPlural('Tus abuelos')).toBe(true);
    expect(esPlural('Tu mamá')).toBe(false);
  });

  it('va en el medio de la oración: «La teva mare» → «la teva mare» (un nombre propio queda como está)', () => {
    expect(normalizarQuienRegala('La teva mare')).toBe('la teva mare');
    expect(normalizarQuienRegala('Els  teus avis')).toBe('els teus avis');
    expect(normalizarQuienRegala('La Mercè')).toBe('La Mercè');
    expect(normalizarQuienRegala('Tu mamá')).toBe('tu mamá');
  });

  it('la bienvenida en plural para «Els teus pares», con «els teus pares» en minúscula', () => {
    const k = paso(nuevoEstado(validarFicha({ ...FICHA_CA, zona: FICHA.zona })), { tipo: 'inicio' }, iso('2026-10-10', '18:05'));
    const ms = k.salidas.filter((x): x is Extract<Salida, { tipo: 'mensaje' }> => x.tipo === 'mensaje');
    expect(ms.map((m) => m.plantilla?.nombre)).toEqual(['kids_bienvenida_plural_ca', 'kids_aviso_padre_ca']);
    expect(ms[0].texto).toContain("perquè els teus pares t'han fet un regal");
    expect(ms[0].botones).toEqual(["D'acord, som-hi"]);
  });
});

// ── La ficha ─────────────────────────────────────────────────────────────────

describe('kids v2 catalán: la ficha', () => {
  it('ca se acepta; otro idioma frena', () => {
    expect(IDIOMAS_KIDS).toEqual(['es-AR', 'es-ES', 'ca']);
    expect(validarFicha(FICHA_CA).idioma).toBe('ca');
    expect(idiomaDe({ idioma: 'ca' })).toBe('ca');
    expect(() => validarFicha({ ...FICHA, idioma: 'pt' as never })).toThrow(/idioma/);
  });
});

// ── K18 ──────────────────────────────────────────────────────────────────────

describe('kids v2 catalán: K18 se recorta con su propia frase, solo borrando palabras', () => {
  it('sin la madre, sin el padre, sin los dos', () => {
    const k18 = (temasSacados: Tema[]) => preguntaMsg(nuevoEstado({ ...FICHA_CA, temasSacados }), pregunta('K18')).texto;
    const aprobado = preguntaEn('K18', 'ca').texto;
    expect(k18([])).toBe(aprobado);
    expect(k18(['papa'])).toBe("Hi ha algú que ara és de la teva família però abans no, com la parella de la teva mare, o algú que ha vingut a viure amb vosaltres? Explica'm el dia que us vau conèixer.");
    expect(k18(['mama'])).toBe("Hi ha algú que ara és de la teva família però abans no, com la parella del teu pare, o algú que ha vingut a viure amb vosaltres? Explica'm el dia que us vau conèixer.");
    expect(k18(['mama', 'papa'])).toBe("Hi ha algú que ara és de la teva família però abans no, com algú que ha vingut a viure amb vosaltres? Explica'm el dia que us vau conèixer.");
    const palabras = (t: string) => t.split(/\s+/).map((w) => w.replace(/[,.?¿]/g, ''));
    for (const temas of [['papa'], ['mama'], ['mama', 'papa']] as Tema[][]) {
      const ap = palabras(aprobado);
      let i = 0;
      for (const w of palabras(k18(temas))) {
        while (i < ap.length && ap[i] !== w) i++;
        expect(i, `"${w}" no está en el K18 en catalán`).toBeLessThan(ap.length);
        i++;
      }
    }
    expect(k18(['papa'])).not.toMatch(/pare/);
    expect(k18(['mama'])).not.toMatch(/mare/);
    expect(k18(['mama', 'papa'])).not.toMatch(/(mare|pare)/);
    expect(() => textoSegunTemas('K18', aprobado, ['papa'], 'es-ES')).toThrow(/K18/);
  });
});

// ── Los botones ──────────────────────────────────────────────────────────────

describe('kids v2 catalán: los botones que toca un chico de Catalunya', () => {
  it('cada botón en catalán vale por el mismo ID de banco.md, ida y vuelta', () => {
    for (const e of ENTRADAS.filter((x) => x.boton)) {
      expect(botonCanonico('ca', TEXTOS[e.id]), e.id).toBe(e.texto);
      expect(botonEn('ca', e.texto), e.id).toBe(TEXTOS[e.id]);
    }
    expect(botonCanonico('ca', 'No en tinc')).toBe('No tengo');
  });

  const preg = (clave: string): Fase => ({ tipo: 'pregunta', clave, rama: null, pasoRama: 0 });
  const toca = (clave: string, fase: Fase, boton: string) => paso(estadoEn(clave, fase, { idioma: 'ca' }), { tipo: 'boton', boton, id: 'w1' }, iso('2026-10-10', '18:05'));

  it('hacen lo mismo que en rioplatense (K12 empieza por «Tinc», no por «Tengo»)', () => {
    const igual: [string, Fase, string, string][] = [
      ['K5', { tipo: 'seguir' }, "D'acord, una altra", 'Dale, otra'],
      ['K39', { tipo: 'tranquila' }, 'Sí, una tranquil·la', 'Dale, una tranquila'],
      ['CIERRE-1', { tipo: 'cierre' }, 'No, ja està tot', 'No, eso fue todo'],
      ['EXTRAS', { tipo: 'extras-otra' }, 'Ho deixem aquí', 'Lo dejamos acá'],
      ['K20', preg('K20'), "No m'ha passat", 'No me pasó'],
      ['K21', { tipo: 'foto', clave: 'K21' }, 'No en miro cap', 'No miro'],
      ['K12', preg('K12'), 'Tinc germans', 'Tengo hermanos'],
      ['K12', preg('K12'), 'No tinc germans', 'No tengo hermanos'],
      ['K24', { tipo: 'foto', clave: 'K24' }, 'Avui no en menjo', 'Hoy no la como'],
    ];
    for (const [clave, fase, ca, ar] of igual) {
      const r = ids(toca(clave, fase, ca).salidas);
      expect(r, ca).toEqual(ids(paso(estadoEn(clave, fase), { tipo: 'boton', boton: ar, id: 'w1' }, iso('2026-10-10', '18:05')).salidas));
    }
    const m = toca('K12', preg('K12'), 'No tinc germans').salidas.find((x): x is Extract<Salida, { tipo: 'mensaje' }> => x.tipo === 'mensaje')!;
    expect(m.id).toBe('K12-R2');
    expect(m.texto).toBe(TEXTOS['K12-R2']);
    expect(m.botones).toEqual(['Passo']);
  });
});

// ── «Algo preocupante» y «dice que no» (BORRADOR) ────────────────────────────

describe('kids v2 catalán: la lista de algo preocupante (BORRADOR)', () => {
  it.each([
    ['el meu cosí em pega quan ningú mira', 'em pega'],
    ['a casa em peguen', 'em peguen'],
    ["el meu tiet m'ha pegat", "m'ha pegat"],
    ['a vegades em vull morir', 'em vull morir'],
    ['no vull viure', 'no vull viure'],
    ['a vegades em tallo', 'em tallo'],
    ["ningú m'estima", "ningú m'estima"],
    ["un noi de l'escola m'amenaça", "m'amenaça"],
    ['tinc por de tornar a casa', 'tinc por de tornar a casa'],
    ['em van tocar allà', 'em van tocar allà'],
    ['em toca allà i no m’agrada', 'em toca allà'],
  ])('salta: «%s»', (t, frase) => {
    expect(fraseQueSalta(t, 'ca')).toBe(frase);
  });

  it('también lo que dice en castellano (quien habla catalán mezcla)', () => {
    expect(fraseQueSalta('i el meu cosí me pega', 'ca')).toBe('me pega');
    expect(fraseQueSalta('me quiero morir', 'ca')).toBe('me quiero morir');
  });

  it.each([
    'em moro de riure amb el meu germà',
    'demà em tallo els cabells',
    'em tallo les ungles els diumenges',
    "em tallo el serrell jo sola",
    'em vull morir de riure',
    'em fa mal la panxa',
    'em toca a mi rentar els plats',
    "em tanca la porta als nassos",
    'la mare em mataria si ho sabés',
    "va ser un abús de confiança del meu germà",
    'em vaig fer mal jugant a futbol',
    'el pare em renya quan no faig els deures',
  ])('no salta: «%s»', (t) => {
    expect(fraseQueSalta(t, 'ca')).toBeNull();
  });

  it('una exclusión no tapa lo otro de la misma ráfaga', () => {
    expect(fraseQueSalta('em tallo els cabells i a vegades em tallo', 'ca')).toBe('em tallo');
    expect(fraseQueSalta("em moro de riure però de debò ningú m'estima", 'ca')).toBe("ningú m'estima");
  });

  it('el castellano de siempre no usa la lista catalana', () => {
    expect(fraseQueSalta('em pega')).toBeNull();
    expect(fraseQueSalta('em pega', 'es-ES')).toBeNull();
  });

  it('ninguna frase vacía ni repetida', () => {
    for (const lista of [FRASES_PREOCUPANTES_CA, FRASES_EXCLUIDAS_CA]) {
      const norm = lista.map(normalizar);
      expect(norm.every((f) => f.trim().length > 0)).toBe(true);
      expect(new Set(norm).size).toBe(norm.length);
    }
  });

  it('en el motor: un chico en catalán que lo cuenta tiene su día sobrio y la marca para Naza', () => {
    const c = ctx(estadoEn('K1', { tipo: 'pregunta', clave: 'K1', rama: null, pasoRama: 0 }, { idioma: 'ca' }));
    sumarARafaga(c, { tipo: 'audio', seg: 70, transcripcion: 'i el meu cosí em va pegar quan ningú mirava' });
    procesarRafaga(c);
    expect(ids(c.salidas)).toEqual(['B-DIAFEO-ACUSE-1', 'marca:preocupante']);
    expect(c.salidas[1]).toMatchObject({ detalle: '"em va pegar" en K1' });
    const m = c.salidas[0];
    expect(m.tipo === 'mensaje' && m.texto).toBe(TEXTOS['B-DIAFEO-ACUSE-1']);
  });
});

describe('kids v2 catalán: dice que no en la foto (BORRADOR)', () => {
  it('«res», «no en tinc», «mai», «cap ni una» dicen que no; «cap al vespre» y «ara te l\'envio», no', () => {
    for (const t of ['res', 'no en tinc', 'mai', 'cap ni una', 'tampoc', 'gens', 'nada']) expect(diceQueNo([t], 'ca'), t).toBe(true);
    for (const t of ["ara te l'envio", "te l'envio cap al vespre", 'ja va', 'aquí la tens']) expect(diceQueNo([t], 'ca'), t).toBe(false);
    expect(diceQueNo(['res'])).toBe(false);
  });

  it('en el motor: «No en tinc» escrito en una foto vale como el botón [No en tinc]', () => {
    const c = ctx(estadoEn('K1', { tipo: 'foto', clave: 'K1' }, { idioma: 'ca' }));
    sumarARafaga(c, { tipo: 'texto', texto: 'res, no en tinc' });
    procesarRafaga(c);
    expect(ids(c.salidas)).toEqual(['B-FOTO-NOTENGO']);
    expect(c.e.fase.tipo).toBe('foto-audio');
  });
});

// ── Un chico entero en catalán ───────────────────────────────────────────────

/** Palabras del castellano que no pueden salir en catalán (ninguna es catalana). */
const CASTELLANO = /(?<![\p{L}'])(cuéntame|cuéntamelo|contame|tienes|tengo|tenés|quieres|puedes|vale|dale|está|estás|estoy|ahora|cuando|también|cómo|qué|hermanos|mañana|sigo|otra|hay|muy|eso|fue|todo|ninguno|nada|hoy|mamá|papá|madre|padre|nos|vemos|gracias|pero|vos|sos|y|pasó|acá)(?![\p{L}'])/giu;

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** El texto con el género del chico ya puesto y las variables como comodines. */
const patron = (t: string) => new RegExp(`^${escapar(t).replace(/\\\{\\\{\d\\\}\\\}/g, '[\\s\\S]+')}$`);
const BOTONES_CA = new Set(ENTRADAS.filter((e) => e.boton).map((e) => TEXTOS[e.id]));

function malEnCatala(ficha: Ficha, mensajes: Enviado[]): string[] {
  const mal: string[] = [];
  for (const m of mensajes) {
    for (const b of m.botones) if (!BOTONES_CA.has(b)) mal.push(`${m.id}: botón «${b}» no es catalán`);
    if (/^PADRE-\d$/.test(m.id)) continue; // lo escribió el padre, tal cual
    const crudo = TEXTOS[m.id];
    if (crudo === undefined) {
      mal.push(`${m.id}: no tiene texto en banco-ca.md`);
      continue;
    }
    const esperado = conGenero(/^K\d+$/.test(m.id) ? textoSegunTemas(m.id, crudo, ficha.temasSacados, 'ca') : crudo, ficha.genero);
    if (!patron(esperado).test(m.texto)) mal.push(`${m.id}: «${m.texto.slice(0, 70)}» no es el texto en catalán`);
    for (const w of m.texto.match(CASTELLANO) ?? []) mal.push(`${m.id}: «${w}» en «${m.texto.slice(0, 70)}»`);
  }
  return mal;
}

describe('kids v2 catalán: un chico entero en ca', () => {
  it('banco-ca.md no tiene ninguna palabra de la lista de castellano', () => {
    expect(Object.entries(TEXTOS).flatMap(([id, t]) => (t.match(CASTELLANO) ?? []).map((w) => `${id}: ${w}`))).toEqual([]);
  });

  it('canal A y canal B, de la bienvenida al final, chico y chica: todo sale de banco-ca.md y nada en castellano', () => {
    for (const [canal, genero] of [['A', 'chica'], ['B', 'chico']] as const) {
      const ficha: Ficha = { ...FICHA_CA, canal, genero, preguntasPadre: [{ texto: "Explica'm la primera vegada que vas anar a la platja", conLinea: true }] };
      const corrida = correr(ficha, (llegaron) => {
        const u = llegaron.filter((m) => canal === 'B' || m.a === 'chico').at(-1);
        if (!u) return [];
        const contar: Accion = { trasMs: 5 * 60_000, evento: { tipo: 'respuesta', contenido: { tipo: 'audio', seg: 60 } }, dice: 'audio de 60 s' };
        if (/^(K\d+|X\d-\d+|PADRE-\d)$/.test(u.id) && u.botones.length <= 1) return [contar];
        if (/-FOTO$/.test(u.id)) return [{ trasMs: 5 * 60_000, evento: { tipo: 'respuesta', contenido: { tipo: 'foto' } }, dice: 'foto' }];
        if (u.botones.length) return [{ trasMs: 2 * 60_000, evento: { tipo: 'boton', boton: u.botones[0], aMensaje: u.envio }, dice: `[${u.botones[0]}]` }];
        return [];
      }, { desde: '2026-10-06T15:00:00.000Z', dias: 200 });
      expect(corrida.estado.fase.tipo, canal).toBe('terminado');
      const mensajes = corrida.lineas.flatMap((l) => (l.de === 'bot' ? [l.mensaje] : []));
      expect(mensajes.some((m) => m.id === 'K47'), canal).toBe(true);
      expect(mensajes.some((m) => m.id === 'PADRE-PREG-LINEA-PL'), canal).toBe(true);
      expect(mensajes.some((m) => m.id === 'FINAL-CHICO-PL'), canal).toBe(true);
      expect(malEnCatala(ficha, mensajes), canal).toEqual([]);
      for (const m of mensajes) if (m.plantilla) expect(m.plantilla.nombre, m.id).toMatch(/_ca$/);
    }
  }, 60_000);

  it('60 chicos de la simulación en ca (todas las conductas): sin violaciones y ni un texto en castellano', () => {
    const mal: string[] = [];
    for (let s = 1; s <= 60; s++) {
      const r = correrUno(s, 'ca');
      expect(r.ficha.idioma).toBe('ca');
      expect(r.violaciones, `semilla ${s}`).toEqual([]);
      mal.push(...malEnCatala(r.ficha, r.corrida.lineas.flatMap((l) => (l.de === 'bot' ? [l.mensaje] : []))).map((x) => `semilla ${s}: ${x}`));
    }
    expect(mal).toEqual([]);
  }, 120_000);

  it('el control detecta el castellano (la misma semilla en es-ES no pasa)', () => {
    const r = correrUno(2, 'es-ES');
    const mal = malEnCatala({ ...r.ficha, idioma: 'ca' }, r.corrida.lineas.flatMap((l) => (l.de === 'bot' ? [l.mensaje] : [])));
    expect(mal.some((x) => /no es catalán/.test(x))).toBe(true);
    expect(mal.some((x) => /«[Cc]uéntame»/.test(x))).toBe(true);
  });

  it('la misma semilla sigue el mismo camino en ca que en es-AR; tercios reparte los tres idiomas', () => {
    const idsDe = (r: ReturnType<typeof correrUno>) => r.corrida.lineas.flatMap((l) => (l.de === 'bot' ? [l.mensaje.id] : []));
    for (const s of [1, 7]) expect(idsDe(correrUno(s, 'ca'))).toEqual(idsDe(correrUno(s)));
    expect([1, 2, 3, 4, 5, 6].map((s) => idiomaDeSemilla(s, 'tercios'))).toEqual(['es-AR', 'es-ES', 'ca', 'es-AR', 'es-ES', 'ca']);
  }, 60_000);
});

// Los idiomas de Kids V2: es-AR (el de siempre, vos) y es-ES (castellano de España, tú).
//
// La estructura (orden, ramas, qué vale cada botón, fotos, marcas, reglas) sale SIEMPRE de banco.md y
// mensajes.md; docs/kids/v2/idiomas/banco-es-ES.md solo trae los textos, por ID. Los tests de "ataduras"
// fallan si alguien cambia banco.md y se olvida del idioma. Chicos INVENTADOS.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsearTextosIdiomaKidsMd } from '../src/kids-v2/banco-idioma-md.js';
import { BANCO, bancoDe, botonCanonico, botonEn, entradasDelBanco, extraEn, fijoEn, pregunta, preguntaEn } from '../src/kids-v2/banco.js';
import { extrasDisponibles } from '../src/kids-v2/extras.js';
import { preguntaMsg } from '../src/kids-v2/motor/mensajes.js';
import bancoEsEsJson from '../src/kids-v2/banco-es-ES.json' with { type: 'json' };
import { temaDeExtra, textoSegunTemas, validarFicha, type Ficha, type Tema } from '../src/kids-v2/compra.js';
import { idiomaDe, IDIOMAS_KIDS } from '../src/kids-v2/idioma.js';
import { nuevoEstado, paso, type Enviado, type Fase, type Salida } from '../src/kids-v2/motor.js';
import { correrUno } from '../src/kids-v2/simulacion.js';
import { correr, type Accion } from '../src/kids-v2/corrida.js';
import { FICHA, estadoEn, iso, ids } from './kids-v2-ayuda.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const leer = (...p: string[]) => readFileSync(path.join(RAIZ, 'docs', 'kids', 'v2', ...p), 'utf8').replace(/\r\n/g, '\n');
const TEXTOS = parsearTextosIdiomaKidsMd(leer('idiomas', 'banco-es-ES.md'));
const ENTRADAS = entradasDelBanco();
const FICHA_ES: Ficha = { ...FICHA, nombre: 'Lucía Martín', apodo: 'Lucía', genero: 'chica', quienRegala: 'Tus padres', zona: 'Europe/Madrid', idioma: 'es-ES' };

const marcas = (s: string) => [...s.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1]).sort().join(',');

// ── El parser ────────────────────────────────────────────────────────────────

describe('kids v2 idiomas: parser de banco-<idioma>.md', () => {
  it('lee "ID | texto" solo entre «## Textos» y ---; \\n\\n escrito es un salto de párrafo', () => {
    const md = ['# Título', '| `K12` | La pregunta | otra |', '', '## Textos', '', 'K1 | Hola {{o/a}}.', 'B-MAÑANA | Uno.\\n\\nDos | con barra', '---', 'K2 | una nota'].join('\n');
    expect(parsearTextosIdiomaKidsMd(md)).toEqual({ K1: 'Hola {{o/a}}.', 'B-MAÑANA': 'Uno.\n\nDos | con barra' });
  });

  it('un ID repetido, una línea suelta, un texto vacío o sin «## Textos» tiran error', () => {
    expect(() => parsearTextosIdiomaKidsMd('## Textos\nK1 | a\nK1 | b')).toThrow(/K1.*repetido/);
    expect(() => parsearTextosIdiomaKidsMd('## Textos\nuna línea suelta')).toThrow(/línea suelta/);
    expect(() => parsearTextosIdiomaKidsMd('## Textos\nK1 |  ')).toThrow(/línea suelta|sin texto/);
    expect(() => parsearTextosIdiomaKidsMd('K1 | a')).toThrow(/## Textos/);
  });

  it('el json commiteado está al día con el md (si falla: npx tsx scripts/kids-v2-json.ts)', () => {
    expect(bancoEsEsJson).toEqual(TEXTOS);
  });
});

// ── Las ataduras: fallan si banco.md cambia y es-ES se queda atrás ──────────

describe('kids v2 idiomas: es-ES atado a banco.md y mensajes.md', () => {
  it('cada texto del banco tiene su ID en es-ES (271), y no sobra ninguno', () => {
    const idsBanco = ENTRADAS.map((e) => e.id);
    expect(idsBanco).toHaveLength(271);
    expect(new Set(idsBanco).size).toBe(idsBanco.length);
    expect(idsBanco.filter((id) => !(id in TEXTOS)), 'faltan').toEqual([]);
    expect(Object.keys(TEXTOS).filter((id) => !idsBanco.includes(id)), 'sobran').toEqual([]);
  });

  it('las mismas marcas ({{o/a}}, {{1}}, {{2}}, {{3}}) en cada texto', () => {
    const mal = ENTRADAS.filter((e) => marcas(e.texto) !== marcas(TEXTOS[e.id])).map((e) => `${e.id}: ${marcas(e.texto)} → ${marcas(TEXTOS[e.id])}`);
    expect(mal).toEqual([]);
  });

  it('los botones caben en WhatsApp (hasta 20 letras) y ningún texto lleva dos puntos', () => {
    expect(ENTRADAS.filter((e) => e.boton && TEXTOS[e.id].length > 20).map((e) => e.id)).toEqual([]);
    expect(Object.entries(TEXTOS).filter(([, t]) => t.includes(':')).map(([id]) => id)).toEqual([]);
  });

  it('bancoDe(es-ES): las mismas preguntas, ramas, fotos, marcas y orden, con los textos del md', () => {
    const b = bancoDe('es-ES');
    expect(bancoDe('es-AR')).toBe(BANCO);
    const forma = (x: typeof BANCO) => ({
      caps: x.capitulos.map((c) => c.n),
      preguntas: x.preguntas.map((p) => [p.id, p.cap, p.ramas.map((r) => r.accion.tipo === 'preguntar' ? r.accion.pasos.length : r.accion.tipo), !!p.op, p.op?.soloRama ? p.ramas.findIndex((r) => r.boton === p.op!.soloRama) : null, p.foto?.de ?? null, p.foto?.botones.length ?? 0, !!p.foto?.noTengo, p.estrella, p.sacable, p.sensible, p.avisoAntes]),
      extras: x.extras.map((e) => [e.id, e.cap, e.foto, e.deOp, e.soloSi, e.sacable, e.sensible, e.liviana]),
      mensajes: x.mensajes.map((m) => [m.id, m.botones.length, m.plantilla !== null]),
    });
    expect(forma(b)).toEqual(forma(BANCO));
    expect(entradasDelBanco(b).map((e) => [e.id, e.texto])).toEqual(ENTRADAS.map((e) => [e.id, TEXTOS[e.id]]));
    expect(preguntaEn('K12', 'es-ES').ramas.map((r) => r.boton)).toEqual(['Tengo hermanos', 'No tengo hermanos']);
    expect(preguntaEn('K21', 'es-ES').foto?.botones).toEqual(['No veo a ninguno', 'No tengo']);
    expect(fijoEn('B-SEGUIR', 'es-ES').botones).toEqual(['Vale, otra', 'Mañana sigo']);
  });

  it('las plantillas: mismo nombre con _es_es, y son las 13 de plantillas-meta-kids-es-ES.md', () => {
    const md = leer('idiomas', 'plantillas-meta-kids-es-ES.md');
    const enMd = [...md.matchAll(/^## \d+b?\. `(kids_[a-z0-9_]+)`/gm)].map((m) => m[1]).sort();
    const delBanco = bancoDe('es-ES').mensajes.flatMap((m) => (m.plantilla ? [m.plantilla] : []));
    expect(delBanco.every((n) => n.endsWith('_es_es'))).toBe(true);
    expect(BANCO.mensajes.flatMap((m) => (m.plantilla ? [`${m.plantilla}_es_es`] : []))).toEqual(delBanco);
    expect(enMd).toHaveLength(13);
    expect(enMd).toEqual(expect.arrayContaining([...delBanco, 'kids_final_es_es', 'kids_final_plural_es_es']));
  });

  it('K18 en España se recorta con su propia frase (tu madre / tu padre), solo borrando palabras', () => {
    const k18 = (temasSacados: Tema[]) => preguntaMsg(nuevoEstado({ ...FICHA_ES, temasSacados }), pregunta('K18')).texto;
    const aprobado = preguntaEn('K18', 'es-ES').texto;
    expect(aprobado).toBe('¿Hay alguien que ahora es de tu familia pero antes no, como la pareja de tu madre o de tu padre, o alguien que ha venido a vivir con vosotros? Cuéntame el día que os conocisteis.');
    expect(k18([])).toBe(aprobado);
    expect(k18(['escuela', 'mudanza', 'abuelo-murio'])).toBe(aprobado);
    expect(k18(['papa'])).toBe('¿Hay alguien que ahora es de tu familia pero antes no, como la pareja de tu madre, o alguien que ha venido a vivir con vosotros? Cuéntame el día que os conocisteis.');
    expect(k18(['mama'])).toBe('¿Hay alguien que ahora es de tu familia pero antes no, como la pareja de tu padre, o alguien que ha venido a vivir con vosotros? Cuéntame el día que os conocisteis.');
    expect(k18(['mama', 'papa'])).toBe('¿Hay alguien que ahora es de tu familia pero antes no, como alguien que ha venido a vivir con vosotros? Cuéntame el día que os conocisteis.');
    // Cada variante: solo palabras del texto aprobado de España, en su orden.
    const palabras = (t: string) => t.split(/\s+/).map((w) => w.replace(/[,.?¿]/g, ''));
    for (const temas of [['papa'], ['mama'], ['mama', 'papa']] as Tema[][]) {
      const ap = palabras(aprobado);
      let i = 0;
      for (const w of palabras(k18(temas))) {
        while (i < ap.length && ap[i] !== w) i++;
        expect(i, `"${w}" no está en el K18 aprobado de España`).toBeLessThan(ap.length);
        i++;
      }
      expect(k18(temas)).not.toMatch(/mam[aá]|pap[aá]/);
    }
    // La frase de un idioma no vale para el otro: si no está, tira (nunca un K18 que nombra a quien sacaron).
    expect(() => textoSegunTemas('K18', aprobado, ['papa'], 'es-AR')).toThrow(/K18/);
    expect(() => textoSegunTemas('K18', pregunta('K18').texto, ['papa'], 'es-ES')).toThrow(/K18/);
  });

  it('«madre / padre» en España (tanda 8): ningún texto dice mamá o papá, y solo K10, K11, K18 y X2-1…X2-8 nombran a la madre o al padre', () => {
    expect(Object.entries(TEXTOS).filter(([, t]) => /mam[aá]|pap[aá]/i.test(t)).map(([id]) => id)).toEqual([]);
    const conMadrePadre = Object.entries(TEXTOS).filter(([, t]) => /\b(tu|su) (madre|padre)\b/i.test(t)).map(([id]) => id);
    expect(conMadrePadre.sort()).toEqual(['K10', 'K10-OP', 'K11', 'K11-OP', 'K18', 'X2-1', 'X2-2', 'X2-3', 'X2-4', 'X2-5', 'X2-6', 'X2-7', 'X2-8'].sort());
    expect(TEXTOS['X2-4']).toBe('¿Cómo le llamas tú a tu madre? Cuéntame de dónde salió eso.');
    expect(TEXTOS['AVISO-PADRE']).toContain('"Vale, vamos"');
    expect(TEXTOS['AVISO-PADRE']).not.toContain('Dale');
  });

  it('las extras de la madre y el padre salen con su tema también en España (temaDeExtra decide por el ID)', () => {
    const temaEs = (id: string) => temaDeExtra(extraEn(id, 'es-ES'));
    for (const id of ['X2-1', 'X2-2', 'X2-3', 'X2-4']) expect(temaEs(id), id).toBe('mama');
    for (const id of ['X2-5', 'X2-6', 'X2-7', 'X2-8']) expect(temaEs(id), id).toBe('papa');
    expect(temaEs('X3-2')).toBe('escuela');
    expect(temaEs('X1-1')).toBeNull();
    for (const x of BANCO.extras) expect(temaDeExtra(extraEn(x.id, 'es-ES')), x.id).toBe(temaDeExtra(x));
    const h = { opsUsadas: [], extrasUsadas: [], hermanos: true, peleaK36: true };
    const disponibles = extrasDisponibles({ ...FICHA_ES, temasSacados: ['mama'] }, h).map((x) => x.id);
    expect(disponibles.filter((id) => ['X2-1', 'X2-2', 'X2-3', 'X2-4'].includes(id))).toEqual([]);
    expect(disponibles).toContain('X2-5');
  });
});

// ── La ficha y los botones ───────────────────────────────────────────────────

describe('kids v2 idiomas: la ficha', () => {
  it('sin idioma es es-AR (y la ficha queda sin el campo); es-ES se acepta; otro frena (ca: kids-v2-catala.test.ts)', () => {
    expect(IDIOMAS_KIDS).toEqual(['es-AR', 'es-ES', 'ca']);
    expect(idiomaDe(FICHA)).toBe('es-AR');
    expect('idioma' in validarFicha(FICHA)).toBe(false);
    expect(validarFicha(FICHA_ES).idioma).toBe('es-ES');
    expect(idiomaDe({ idioma: '' })).toBe('es-AR');
    expect(() => validarFicha({ ...FICHA, idioma: 'pt' as never })).toThrow(/idioma/);
    expect(() => idiomaDe({ idioma: 'pt' })).toThrow(/pt/);
  });
});

describe('kids v2 idiomas: los botones que toca un chico de España', () => {
  it('cada botón de España vale por el mismo ID de banco.md, ida y vuelta', () => {
    for (const e of ENTRADAS.filter((x) => x.boton)) {
      expect(botonCanonico('es-ES', TEXTOS[e.id]), e.id).toBe(e.texto);
      expect(botonEn('es-ES', e.texto), e.id).toBe(TEXTOS[e.id]);
      // Pasar dos veces no cambia nada (lo de la noche se traduce una sola vez, pero por las dudas).
      expect(botonCanonico('es-ES', botonCanonico('es-ES', TEXTOS[e.id])), e.id).toBe(e.texto);
    }
    expect(botonCanonico('es-AR', 'Vale, otra')).toBe('Vale, otra');
    expect(botonCanonico('es-ES', 'algo que no es un botón')).toBe('algo que no es un botón');
  });

  const preg = (clave: string): Fase => ({ tipo: 'pregunta', clave, rama: null, pasoRama: 0 });
  const toca = (clave: string, fase: Fase, boton: string, extra = {}) => {
    const e = estadoEn(clave, fase, { idioma: 'es-ES', zona: FICHA.zona }, extra);
    return paso(e, { tipo: 'boton', boton, id: 'w1' }, iso('2026-10-10', '18:05'));
  };
  const textos = (s: Salida[]) => s.flatMap((x) => (x.tipo === 'mensaje' ? [x.texto] : []));

  it('los que cambian de texto hacen lo mismo que en rioplatense', () => {
    expect(ids(toca('K5', { tipo: 'seguir' }, 'Vale, otra').salidas)).toEqual(['K6', 'recibido:w1:K5']);
    // Los ocho que cambian, contra lo mismo tocado en rioplatense.
    const igual: [string, Fase, string, string][] = [
      ['K5', { tipo: 'seguir' }, 'Vale, otra', 'Dale, otra'],
      ['K39', { tipo: 'tranquila' }, 'Vale, una tranquila', 'Dale, una tranquila'],
      ['UNA-MAS-1', { tipo: 'una-mas' }, 'Vale, otra', 'Dale, otra'],
      ['CIERRE-1', { tipo: 'cierre' }, 'No, ya está todo', 'No, eso fue todo'],
      ['EXTRAS', { tipo: 'extras-oferta' }, 'Vale, otra', 'Dale, otra'],
      ['EXTRAS', { tipo: 'extras-otra' }, 'Lo dejamos aquí', 'Lo dejamos acá'],
      ['K20', preg('K20'), 'No me ha pasado', 'No me pasó'],
      ['K21', { tipo: 'foto', clave: 'K21' }, 'No veo a ninguno', 'No miro'],
    ];
    for (const [clave, fase, es, ar] of igual) {
      const r = ids(toca(clave, fase, es).salidas);
      expect(r.length, es).toBeGreaterThan(1);
      expect(r, es).toEqual(ids(paso(estadoEn(clave, fase), { tipo: 'boton', boton: ar, id: 'w1' }, iso('2026-10-10', '18:05')).salidas));
    }
    const retenido = estadoEn('K5', { tipo: 'retenido', mensajes: [], luego: { tipo: 'libre', siguiente: 5 } }, { idioma: 'es-ES' });
    expect(paso(retenido, { tipo: 'boton', boton: 'Vale, mándamela' }, iso('2026-10-10', '18:05')).estado.fase).toEqual({ tipo: 'libre', siguiente: 5 });
    const bien = paso({ ...nuevoEstado({ ...FICHA_ES, zona: FICHA.zona }), fase: { tipo: 'bienvenida' }, ultimaEntrada: iso('2026-10-10', '12:00') }, { tipo: 'boton', boton: 'Vale, vamos' }, iso('2026-10-10', '18:05'));
    expect(ids(bien.salidas)).toEqual(['ENTRADA-1', 'K1']);
    expect(textos(bien.salidas)).toEqual([TEXTOS['ENTRADA-1'].replace('{{o/a}}', 'a'), TEXTOS.K1]);
    const k = paso(nuevoEstado({ ...FICHA_ES, zona: FICHA.zona }), { tipo: 'inicio' }, iso('2026-10-10', '18:05'));
    expect(k.salidas.flatMap((x) => (x.tipo === 'mensaje' ? [x.plantilla?.nombre] : []))).toEqual(['kids_bienvenida_plural_es_es', 'kids_aviso_padre_es_es']);
  });

  it('el rioplatense no se rompe: [Dale, otra] sigue valiendo en una ficha sin idioma', () => {
    const e = estadoEn('K5', { tipo: 'seguir' });
    expect(ids(paso(e, { tipo: 'boton', boton: 'Dale, otra' }, iso('2026-10-10', '18:05')).salidas)).toEqual(['K6']);
    expect(ids(paso(e, { tipo: 'boton', boton: 'Vale, otra' }, iso('2026-10-10', '18:05')).salidas)).toEqual([]);
  });

  it('lo que sale para España lleva los botones de España', () => {
    const r = toca('K12', preg('K12'), 'No tengo hermanos');
    const m = r.salidas.find((x): x is Extract<Salida, { tipo: 'mensaje' }> => x.tipo === 'mensaje')!;
    expect(m.id).toBe('K12-R2');
    expect(m.texto).toBe(TEXTOS['K12-R2']);
    expect(m.botones).toEqual([TEXTOS['BOTON-PASO']]);
  });
});

// ── Un chico entero en castellano de España ─────────────────────────────────

/** Palabras del rioplatense que no pueden salir en es-ES, salvo que el texto de España de ese ID las tenga («dale un empujoncito»). */
const RIOPLATENSE = /\b(vos|sos|contame|contámelo|contá|contás|contaste|dale|tenés|querés|podés|sabés|acá|allá|decime|mandame|mandámela|mostrame|sacale|tocá|tocás|ustedes|lindo|linda|celular|plata|chiquit[oa]|mirás|miro|quedó|pasó|salteamos|enojad[oa]|retaran|apuro|listo)\b/gi;

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** El texto de España con sus marcas como comodines: {{o/a}} → o|a, {{n}} → lo que sea. */
const patron = (t: string) => new RegExp(`^${escapar(t).replace(/\\\{\\\{o\/a\\\}\\\}/g, '[oa]').replace(/\\\{\\\{\d\\\}\\\}/g, '[\\s\\S]+')}$`);
const BOTONES_ES = new Set(ENTRADAS.filter((e) => e.boton).map((e) => TEXTOS[e.id]));

function malEnEspana(ficha: Ficha, mensajes: Enviado[]): string[] {
  const mal: string[] = [];
  for (const m of mensajes) {
    const esPadre = /^PADRE-\d$/.test(m.id);
    for (const b of m.botones) if (!BOTONES_ES.has(b)) mal.push(`${m.id}: botón «${b}» no es de España`);
    if (esPadre) continue; // lo escribió el padre, tal cual
    const crudo = TEXTOS[m.id];
    if (crudo === undefined) {
      mal.push(`${m.id}: no tiene texto en banco-es-ES.md`);
      continue;
    }
    const esperado = /^K\d+$/.test(m.id) ? textoSegunTemas(m.id, crudo, ficha.temasSacados, 'es-ES') : crudo;
    if (!patron(esperado).test(m.texto)) mal.push(`${m.id}: «${m.texto.slice(0, 70)}» no es el texto de España`);
    for (const w of m.texto.match(RIOPLATENSE) ?? []) if (!new RegExp(`\\b${w}\\b`, 'i').test(crudo)) mal.push(`${m.id}: «${w}» en «${m.texto.slice(0, 70)}»`);
  }
  return mal;
}

describe('kids v2 idiomas: un chico entero en es-ES', () => {
  it('canal A y canal B, de la bienvenida al final: todo sale de banco-es-ES.md y nada en rioplatense', () => {
    for (const canal of ['A', 'B'] as const) {
      const ficha: Ficha = { ...FICHA_ES, canal, preguntasPadre: [{ texto: 'Cuéntame la primera vez que fuiste a la playa', conLinea: true }] };
      // Un chico que toca siempre el primer botón (o cuenta algo largo cuando es una pregunta): pasa por todo.
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
      expect(mensajes.some((m) => m.id === 'FINAL-CHICO-PL'), canal).toBe(true);
      expect(malEnEspana(ficha, mensajes), canal).toEqual([]);
    }
  }, 60_000);

  it('60 chicos de la simulación en es-ES (todas las conductas, botones al azar): ni un texto rioplatense', () => {
    const mal: string[] = [];
    for (let s = 1; s <= 60; s++) {
      const r = correrUno(s, 'es-ES');
      expect(r.ficha.idioma).toBe('es-ES');
      expect(r.violaciones, `semilla ${s}`).toEqual([]);
      mal.push(...malEnEspana(r.ficha, r.corrida.lineas.flatMap((l) => (l.de === 'bot' ? [l.mensaje] : []))).map((x) => `semilla ${s}: ${x}`));
      const plantillas = r.corrida.lineas.flatMap((l) => (l.de === 'bot' && l.mensaje.plantilla ? [l.mensaje.plantilla.nombre] : []));
      for (const p of plantillas) expect(p, `semilla ${s}`).toMatch(/_es_es$/);
    }
    expect(mal).toEqual([]);
  }, 120_000);

  it('el control detecta el rioplatense (la misma semilla en es-AR no pasa)', () => {
    const r = correrUno(1);
    const mal = malEnEspana(FICHA_ES, r.corrida.lineas.flatMap((l) => (l.de === 'bot' ? [l.mensaje] : [])));
    expect(mal.some((x) => /botón «Dale, vamos» no es de España/.test(x))).toBe(true);
    expect(mal.some((x) => /«[Cc]ontame»/.test(x))).toBe(true);
  });

  it('la misma semilla en es-AR sale idéntica a la de siempre (mismos IDs) y en es-ES sigue el mismo camino', () => {
    const idsDe = (r: ReturnType<typeof correrUno>) => r.corrida.lineas.flatMap((l) => (l.de === 'bot' ? [l.mensaje.id] : []));
    for (const s of [1, 2, 7, 13]) {
      const ar = correrUno(s);
      expect('idioma' in ar.ficha).toBe(false);
      expect(idsDe(correrUno(s, 'es-ES'))).toEqual(idsDe(ar));
    }
  }, 60_000);
});

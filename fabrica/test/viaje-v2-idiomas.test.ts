// Los idiomas de Vitácora de Viaje V2: es-AR (el de siempre, vos), es-ES
// (castellano de España, tú) y ca (catalán).
//
// La estructura (IDs, momentos, orden, reglas) sale SIEMPRE de banco.md; los
// archivos de idioma (docs/viajes-v2/idiomas/banco-ca.md y banco-es-ES.md)
// solo traen el texto. Los tests de "ataduras" fallan si alguien cambia
// banco.md y se olvida de un idioma.
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsearBancoViajeMd } from '../src/viaje-v2/banco-md.js';
import { parsearTextosIdiomaMd } from '../src/viaje-v2/banco-idioma-md.js';
import { BANCO, bancoDe, porId, deMomento } from '../src/viaje-v2/banco.js';
import { idiomaDe, IDIOMAS, type Idioma } from '../src/viaje-v2/idioma.js';
import { paqueteDe } from '../src/viaje-v2/paquete.js';
import { entender } from '../src/viaje-v2/palabras.js';
import { renderizar, datosDeCompra, textoFormato } from '../src/viaje-v2/texto.js';
import { arranque, alDecirSi, despedida, partirDes, preguntaProgramada, reaccion, ROTACION_INICIAL } from '../src/viaje-v2/mensajes.js';
import { armarCalendario } from '../src/viaje-v2/calendario.js';
import { iniciarAlbum, pasoAlbum } from '../src/viaje-v2/album.js';
import bancoCaJson from '../src/viaje-v2/banco-ca.json' with { type: 'json' };
import bancoEsEsJson from '../src/viaje-v2/banco-es-ES.json' with { type: 'json' };
import type { Compra } from '../src/viaje-v2/tipos.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const leer = (...p: string[]) => readFileSync(path.join(RAIZ, 'docs', 'viajes-v2', ...p), 'utf8');
const FILAS = parsearBancoViajeMd(leer('banco.md'));
const OTROS = ['ca', 'es-ES'] as const;
const MD_IDIOMA: Record<(typeof OTROS)[number], ReturnType<typeof parsearTextosIdiomaMd>> = {
  ca: parsearTextosIdiomaMd(leer('idiomas', 'banco-ca.md')),
  'es-ES': parsearTextosIdiomaMd(leer('idiomas', 'banco-es-ES.md')),
};

const COMPRA: Compra = {
  nombre: 'Laia',
  salida: '2026-10-10',
  vuelta: '2026-10-17',
  zonaCasa: 'Europe/Madrid',
  zonaViaje: 'Europe/Lisbon',
  regalo: { quienRegala: 'Jordi' },
  preguntasPropias: ['Quin lloc em portaries?'],
  formato: 'impreso',
  fotosAlbum: 20,
};
const en = (idioma: Idioma): Compra => ({ ...COMPRA, idioma });

// ── El parser de los archivos de idioma ─────────────────────────────────────

describe('viaje v2 idiomas: parser de banco-<idioma>.md', () => {
  it('lee "ID | texto", "ID~viaje | texto", FORMATO y PLANTILLA; lo de después de --- son notas', () => {
    const md = [
      'AS1 | Hola {{nombre}}.',
      'AS1~viaje | Ja ets de viatge.',
      'NO1 | Comença per alguna cosa | amb barra',
      '',
      'FORMATO-impreso | un llibre imprès',
      'FORMATO-pdf | un llibre en PDF',
      'PLANTILLA-mensaje | Hola, {{1}}.<br><br>{{2}}',
      '---',
      '1. NO2 | esto es una nota y no cuenta',
    ].join('\n');
    expect(parsearTextosIdiomaMd(md)).toEqual({
      textos: { AS1: 'Hola {{nombre}}.', NO1: 'Comença per alguna cosa | amb barra' },
      yaDeViaje: { AS1: 'Ja ets de viatge.' },
      formato: { impreso: 'un llibre imprès', pdf: 'un llibre en PDF' },
      plantillaMensaje: 'Hola, {{1}}.\n\n{{2}}',
    });
  });

  it('la plantilla acepta saltos como <br> o como \\n escrito', () => {
    const base = 'FORMATO-impreso | a\nFORMATO-pdf | b\n';
    expect(parsearTextosIdiomaMd(`${base}PLANTILLA-mensaje | A\\n\\nB`).plantillaMensaje).toBe('A\n\nB');
  });

  it('un ID repetido, una línea sin " | " o un FORMATO que falta tiran error', () => {
    const base = 'FORMATO-impreso | a\nFORMATO-pdf | b\nPLANTILLA-mensaje | c\n';
    expect(() => parsearTextosIdiomaMd(`${base}X1 | a\nX1 | b`)).toThrow(/X1.*repetido/);
    expect(() => parsearTextosIdiomaMd(`${base}una línea suelta`)).toThrow(/línea suelta/);
    expect(() => parsearTextosIdiomaMd('PLANTILLA-mensaje | c\nX1 | a')).toThrow(/FORMATO-impreso/);
    expect(() => parsearTextosIdiomaMd(`${base}X1 | `)).toThrow(/X1.*sin texto/);
  });
});

// ── Las ataduras: fallan si banco.md cambia y un idioma se queda atrás ──────

const contar = (s: string, c: string) => s.split(c).length - 1;
const marcasConCantidad = (s: string) => [...s.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort();

for (const idioma of OTROS) {
  describe(`viaje v2 idiomas: ${idioma} atado a banco.md`, () => {
    const t = MD_IDIOMA[idioma];

    it('cada ID de banco.md tiene su texto, y no sobra ninguno', () => {
      const ids = FILAS.map((f) => f.id);
      expect(ids.filter((id) => !(id in t.textos)), 'faltan').toEqual([]);
      expect(Object.keys(t.textos).filter((id) => !ids.includes(id)), 'sobran').toEqual([]);
    });

    it('las variantes "ya de viaje": las 4 de antes de salir, ni una más ni una menos', () => {
      const con = FILAS.filter((f) => f.yaDeViaje !== null).map((f) => f.id);
      expect(con).toEqual(['AS1', 'AS2', 'IM1', 'VA1']);
      expect(Object.keys(t.yaDeViaje).sort()).toEqual([...con].sort());
    });

    it('las mismas marcas {{…}} (y cuántas veces) y la misma cantidad de «» por fila', () => {
      const mal: string[] = [];
      for (const f of FILAS) {
        const pares: [string, string | null, string | undefined][] = [[f.id, f.texto, t.textos[f.id]]];
        if (f.yaDeViaje) pares.push([`${f.id}~viaje`, f.yaDeViaje, t.yaDeViaje[f.id]]);
        for (const [id, orig, trad] of pares) {
          if (trad === undefined || orig === null) continue;
          if (marcasConCantidad(orig).join() !== marcasConCantidad(trad).join()) mal.push(`${id}: marcas ${marcasConCantidad(orig)} → ${marcasConCantidad(trad)}`);
          for (const c of ['«', '»']) if (contar(orig, c) !== contar(trad, c)) mal.push(`${id}: ${c} ${contar(orig, c)} → ${contar(trad, c)}`);
        }
      }
      expect(mal).toEqual([]);
    });

    it(`las puertas sin punto final; los cierres empiezan con "${idioma === 'ca' ? ', i ' : ', y '}"`, () => {
      const inicio = idioma === 'ca' ? ', i ' : ', y ';
      for (const f of FILAS.filter((x) => x.momento === 'noche-puerta')) expect(t.textos[f.id], f.id).not.toMatch(/[.!?…]\s*$/);
      for (const f of FILAS.filter((x) => x.momento === 'noche-cierre')) expect(t.textos[f.id]?.startsWith(inicio), `${f.id}: ${t.textos[f.id]}`).toBe(true);
    });

    it('trae los dos valores de {{formato}} y la plantilla de Meta, sin <br> ni \\n escrito', () => {
      expect(t.formato.impreso).toBeTruthy();
      expect(t.formato.pdf).toMatch(/PDF/);
      expect(t.plantillaMensaje).toContain('{{1}}');
      expect(t.plantillaMensaje).toContain('{{2}}');
      expect(t.plantillaMensaje).not.toMatch(/<br>|\\n/);
    });

    it('el json commiteado está al día con el md (si falla: npx tsx scripts/viaje-v2-json.ts)', () => {
      expect(idioma === 'ca' ? bancoCaJson : bancoEsEsJson).toEqual(t);
    });
  });
}

// ── El paquete de idioma ─────────────────────────────────────────────────────

describe('viaje v2 idiomas: el paquete', () => {
  it('idiomaDe: vacío es es-AR (nada de hoy cambia); uno desconocido frena', () => {
    expect(idiomaDe(undefined)).toBe('es-AR');
    expect(idiomaDe({})).toBe('es-AR');
    expect(idiomaDe({ idioma: '' })).toBe('es-AR');
    expect(idiomaDe({ idioma: 'ca' })).toBe('ca');
    expect(() => idiomaDe({ idioma: 'pt' })).toThrow(/pt/);
    expect(IDIOMAS).toEqual(['es-AR', 'es-ES', 'ca']);
  });

  it('bancoDe(es-AR) es el banco de siempre', () => {
    expect(bancoDe('es-AR')).toBe(BANCO);
    expect(bancoDe()).toBe(BANCO);
  });

  for (const idioma of OTROS) {
    it(`bancoDe(${idioma}): las mismas filas (ID, momento, orden) con los textos del idioma`, () => {
      const b = bancoDe(idioma);
      expect(b.map((f) => [f.id, f.momento, f.orden])).toEqual(BANCO.map((f) => [f.id, f.momento, f.orden]));
      expect(porId('AS1', idioma).texto).toBe(MD_IDIOMA[idioma].textos.AS1);
      expect(porId('AS1', idioma).yaDeViaje).toBe(MD_IDIOMA[idioma].yaDeViaje.AS1);
      expect(porId('UC1', idioma).yaDeViaje).toBeNull();
      expect(deMomento('mediodia', idioma).map((f) => f.id)).toEqual(deMomento('mediodia').map((f) => f.id));
      expect(() => porId('NO99', idioma)).toThrow(/NO99/);
    });
  }

  it('{{formato}} sale del paquete', () => {
    expect(textoFormato('impreso')).toBe('un libro impreso');
    expect(textoFormato('pdf', 'es-ES')).toBe('un libro en PDF');
    expect(textoFormato('impreso', 'ca')).toBe(MD_IDIOMA.ca.formato.impreso);
    expect(datosDeCompra(en('ca')).formato).toBe(MD_IDIOMA.ca.formato.impreso);
    expect(datosDeCompra({ ...en('ca'), formato: 'pdf' }).formato).toBe(MD_IDIOMA.ca.formato.pdf);
  });

  it('la plantilla es-AR es la aprobada en plantillas-meta.md (mensaje_viaje_v2)', () => {
    const md = leer('plantillas-meta.md');
    const bloque = /## 3\. `mensaje_viaje_v2`[^\n]*\n\n```\n([\s\S]*?)\n```/.exec(md)![1];
    expect(paqueteDe('es-AR').plantillaMensaje).toBe(bloque);
    for (const i of OTROS) expect(paqueteDe(i).plantillaMensaje).toBe(MD_IDIOMA[i].plantillaMensaje);
  });
});

// ── Los mensajes en cada idioma ──────────────────────────────────────────────

describe('viaje v2 idiomas: los mensajes salen en el idioma de la compra', () => {
  const r = (id: string, idioma: Idioma, extra: Record<string, string> = {}) => renderizar(porId(id, idioma).texto, { ...datosDeCompra(en(idioma)), ...extra });

  for (const idioma of OTROS) {
    it(`${idioma}: arranque, SÍ, la noche, un acuse y el álbum`, () => {
      const c = en(idioma);
      expect(arranque(c)).toEqual({ ids: ['BIEN-1R'], texto: r('BIEN-1R', idioma) });
      expect(arranque(c).texto).toContain(MD_IDIOMA[idioma].formato.impreso);
      const [b2, as1] = alDecirSi(c);
      expect(b2.texto).toBe(r('BIEN-2', idioma));
      expect(as1.texto).toBe(r('AS1', idioma));
      // SÍ después de salir: AS1 "ya de viaje" en el idioma.
      const [, tarde] = alDecirSi(c, new Date('2026-10-12T10:00:00Z'));
      expect(tarde.texto).toBe(renderizar(MD_IDIOMA[idioma].yaDeViaje.AS1, datosDeCompra(c)));

      const noche = armarCalendario(c, []).programados.find((p) => p.tipo === 'noche')!;
      const [ci, no, fi] = noche.ids;
      const m = preguntaProgramada(noche, c, 0, ROTACION_INICIAL).mensaje;
      expect(m.texto).toBe(`${r(ci, idioma)} ${r(no, idioma)}${r(fi, idioma)}`);

      const ac = reaccion({ tipo: 'noche' }, { tipo: 'audio' }, c, ROTACION_INICIAL);
      expect(ac.mensajes[0].texto).toBe(r(ac.mensajes[0].ids[0], idioma));

      const a = iniciarAlbum(new Date('2026-10-19T08:00:00Z'), c);
      const al2 = pasoAlbum({ ...a, fotos: 3, ids: ['a', 'b', 'c'], recibidas: 3 }, { tipo: 'reloj', en: new Date(a.vence!) }, c);
      expect(al2.salidas).toEqual([{ tipo: 'mensaje', mensaje: { ids: ['AL2'], texto: r('AL2', idioma) } }]);
    });
  }

  it('es-AR: DES+ antes de "Fue lindo acompañarte", como siempre', () => {
    const c = en('es-AR');
    const m = despedida(c, 23);
    expect(m.ids).toEqual(['DES', 'DES+']);
    expect(m.texto).toBe(r('DES', 'es-AR').replace('Fue lindo acompañarte', `${r('DES+', 'es-AR')} Fue lindo acompañarte`));
  });

  it('DES+ va antes de las dos últimas oraciones de DES, sin buscar ninguna frase (ca y es-ES)', () => {
    const frase: Record<(typeof OTROS)[number], string> = { ca: "M'ha agradat molt acompanyar-te.", 'es-ES': 'Ha sido bonito acompañarte.' };
    for (const idioma of OTROS) {
      const m = despedida(en(idioma), 23);
      expect(m.ids).toEqual(['DES', 'DES+']);
      expect(m.texto, idioma).toContain(`${r('DES+', idioma)} ${frase[idioma]}`);
      expect(despedida(en(idioma), 20)).toEqual({ ids: ['DES'], texto: r('DES', idioma) });
    }
  });

  it('el corte de DES cae en el mismo lugar en los tres idiomas: antes de "acompañarte" y del "Gracias" final', () => {
    const esperado: Record<Idioma, [string, string]> = {
      'es-AR': ['ahí cambiás lo que haga falta.', 'Fue lindo acompañarte. Gracias por dejarme entrar en tu viaje.'],
      'es-ES': ['ahí cambias lo que haga falta.', 'Ha sido bonito acompañarte. Gracias por dejarme entrar en tu viaje.'],
      ca: ['allà canvies el que calgui.', "M'ha agradat molt acompanyar-te. Gràcies per explicar-me el teu viatge."],
    };
    for (const idioma of IDIOMAS) {
      const [antes, despues] = partirDes(porId('DES', idioma).texto);
      expect(antes.endsWith(esperado[idioma][0]), `${idioma}: ${antes}`).toBe(true);
      expect(despues, idioma).toBe(esperado[idioma][1]);
      expect(despedida(en(idioma), 21).texto, idioma).toBe(`${renderizar(antes, datosDeCompra(en(idioma)))} ${r('DES+', idioma)} ${despues}`);
    }
  });

  it('ningún texto armado en ca o es-ES deja marcas sin llenar', () => {
    for (const idioma of OTROS) {
      const datos = { ...datosDeCompra(en(idioma)), pregunta: 'x', fotos_mandadas: '23' };
      for (const f of bancoDe(idioma)) {
        expect(renderizar(f.texto, datos), f.id).not.toContain('{{');
        if (f.yaDeViaje) expect(renderizar(f.yaDeViaje, datos), f.id).not.toContain('{{');
      }
    }
  });
});

// ── Mayúscula al principio de oración ───────────────────────────────────────

describe('viaje v2 idiomas: una marca al principio de oración va con mayúscula', () => {
  it('el valor en minúscula sube la primera letra si la marca abre una oración (cualquier marca, cualquier idioma)', () => {
    const d = { quien_regala: 'el teu pare', nombre: 'àngels', formato: 'un llibre imprès' };
    expect(renderizar('{{quien_regala}} ha volgut saber això.', d)).toBe('El teu pare ha volgut saber això.');
    expect(renderizar("Hola. {{quien_regala}} t'ha regalat {{formato}}.", d)).toBe("Hola. El teu pare t'ha regalat un llibre imprès.");
    expect(renderizar('Quina sorpresa! {{nombre}}, digues.', d)).toBe('Quina sorpresa! Àngels, digues.');
    expect(renderizar('Fet?\n\n{{quien_regala}} espera.', d)).toBe('Fet?\n\nEl teu pare espera.');
    expect(renderizar('¿{{quien_regala}} lo sabe?', d)).toBe('¿El teu pare lo sabe?');
  });

  it('en medio de una oración queda como lo escribieron', () => {
    const d = { quien_regala: 'el teu pare', formato: 'un llibre imprès' };
    expect(renderizar("La resposta l'espera {{quien_regala}}, així que parla-li.", d)).toBe("La resposta l'espera el teu pare, així que parla-li.");
    expect(renderizar('Te escribo porque {{quien_regala}} te hizo un regalo: {{formato}} con tu viaje.', d)).toBe('Te escribo porque el teu pare te hizo un regalo: un llibre imprès con tu viaje.');
  });

  it('en los textos reales: PR-R3 y PR-R2 en los tres idiomas, BIEN-1R en catalán', () => {
    for (const idioma of IDIOMAS) {
      const c: Compra = { ...en(idioma), regalo: { quienRegala: 'el teu pare' } };
      const t = renderizar(porId('PR-R3', idioma).texto, { ...datosDeCompra(c), pregunta: 'x' });
      expect(t.startsWith('El teu pare '), `${idioma}: ${t}`).toBe(true);
      expect(renderizar(porId('PR-R2', idioma).texto, { ...datosDeCompra(c), pregunta: 'x' }), idioma).toContain('El teu pare ');
    }
    const ca: Compra = { ...en('ca'), regalo: { quienRegala: 'el teu pare' } };
    expect(arranque(ca).texto).toContain(". El teu pare t'ha regalat");
  });
});

// ── Las palabras que entiende el sistema ─────────────────────────────────────

describe('viaje v2 idiomas: el detector (SÍ, paso, listo, no)', () => {
  it('es-AR: lo de siempre', () => {
    for (const x of ['SÍ', 'sí', 'Si', 'sí!', 'dale', 'Ok', 'vale']) expect(entender(x, 'es-AR'), x).toBe('si');
    for (const x of ['paso', 'Paso.', 'PASO']) expect(entender(x, 'es-AR'), x).toBe('paso');
    for (const x of ['listo', 'Listo!', 'listo, son esas', 'ya está']) expect(entender(x, 'es-AR'), x).toBe('listo');
    for (const x of ['no', 'no, me faltan', 'todavía no']) expect(entender(x, 'es-AR'), x).toBe('no');
    expect(entender('passo', 'es-AR')).toBeNull();
    expect(entender('ja està', 'es-AR')).toBeNull();
  });

  it('es-ES: "ya está", "hecho", "terminado" y "listo"; "vale" es sí', () => {
    for (const x of ['ya está', 'Ya está!', 'hecho', 'terminado', 'listo', 'ya está, son estas']) expect(entender(x, 'es-ES'), x).toBe('listo');
    for (const x of ['vale', 'Vale.', 'venga', 'ok', 'SÍ', 'si']) expect(entender(x, 'es-ES'), x).toBe('si');
    for (const x of ['paso', 'paso de esta', 'me la salto']) expect(entender(x, 'es-ES'), x).toBe('paso');
    expect(entender('todavía no', 'es-ES')).toBe('no');
  });

  it('ca: "passo", "ja està", "fet", "d\'acord"; y también las de castellano (quien habla catalán mezcla)', () => {
    for (const x of ['passo', 'Passo!', 'paso']) expect(entender(x, 'ca'), x).toBe('paso');
    for (const x of ['ja està', 'Ja està!', 'fet', 'ja esta', 'listo', 'ya está', 'hecho']) expect(entender(x, 'ca'), x).toBe('listo');
    for (const x of ["d'acord", 'D’acord!', 'vale', 'ok', 'SÍ', 'sí', 'si']) expect(entender(x, 'ca'), x).toBe('si');
    for (const x of ['no', 'encara no', "no, me'n falten"]) expect(entender(x, 'ca'), x).toBe('no');
  });

  it('una frase larga que empieza igual no es una palabra del sistema', () => {
    expect(entender('paso por la plaza todos los días y me encanta', 'es-AR')).toBeNull();
    expect(entender('si quieres te mando más mañana por la tarde', 'es-ES')).toBeNull();
    expect(entender('fet i fet, el millor va ser el mar de nit', 'ca')).toBeNull();
    expect(entender('', 'ca')).toBeNull();
  });

  it('lo que cada texto le pide escribir, el detector de ese idioma lo entiende', () => {
    for (const idioma of IDIOMAS) {
      const comillas = (id: string) => [...porId(id, idioma).texto.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
      expect(comillas('AL1').map((w) => entender(w, idioma)), `${idioma} AL1`).toEqual(['listo']);
      expect(comillas('AL1-P').map((w) => entender(w, idioma)), `${idioma} AL1-P`).toEqual(['listo']);
      for (const id of ['BIEN-2', 'REC1', 'REC1-U']) expect(comillas(id).map((w) => entender(w, idioma)), `${idioma} ${id}`).toEqual(['paso']);
      expect(porId('BIEN-1', idioma).texto).toMatch(/(^|[^\p{L}])SÍ([^\p{L}]|$)/u);
      expect(entender('SÍ', idioma)).toBe('si');
    }
  });

  it('las palabras de cada idioma están en su paquete', () => {
    expect(paqueteDe('ca').palabras.paso).toContain('passo');
    expect(paqueteDe('ca').palabras.listo).toEqual(expect.arrayContaining(['ja està', 'fet', 'listo', 'ya está']));
    expect(paqueteDe('es-ES').palabras.listo).toEqual(expect.arrayContaining(['ya está', 'listo', 'hecho', 'terminado']));
    expect(paqueteDe('ca').palabras.si).toEqual(expect.arrayContaining(['vale', 'ok', "d'acord"]));
  });
});

// ── Fijado letra por letra (preparado, SIN ACTIVAR) ─────────────────────────
//
// ACTIVO desde el 05/10: Naza cerró los textos de es-AR, ca y es-ES. Cómo se activó:
//   1. npx tsx scripts/viaje-v2-json.ts --fijar   (escribe test/viaje-v2-idiomas-fijados.json)
//   2. poner FIJADOS_ACTIVOS = true acá.
// Desde ahí, cambiar un texto aprobado obliga a cambiar también el fijado, a
// propósito: nadie toca un texto aprobado sin darse cuenta.
const FIJADOS_ACTIVOS = true;
const FIJADOS = path.join(path.dirname(fileURLToPath(import.meta.url)), 'viaje-v2-idiomas-fijados.json');

describe.skipIf(!FIJADOS_ACTIVOS)('viaje v2 idiomas: textos aprobados fijados letra por letra', () => {
  it('cada texto de es-AR, ca y es-ES es el aprobado', () => {
    expect(existsSync(FIJADOS), 'falta correr: npx tsx scripts/viaje-v2-json.ts --fijar').toBe(true);
    const fijados = JSON.parse(readFileSync(FIJADOS, 'utf8')) as Record<string, unknown>;
    const esAR = BANCO.map((f) => ({ id: f.id, texto: f.texto, yaDeViaje: f.yaDeViaje }));
    expect({ 'es-AR': esAR, ca: bancoCaJson, 'es-ES': bancoEsEsJson }).toEqual(fijados);
  });
});


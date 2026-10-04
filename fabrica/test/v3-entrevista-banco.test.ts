import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsearEntrevistaMd, parsearDepende } from '../src/v3/entrevista/banco-md.js';
import { BANCO, condicionesDe, MENSAJES, preguntaPorId } from '../src/v3/entrevista/banco.js';
import { idsEnVariantes } from '../src/v3/entrevista/texto.js';
import { BANCO as BANCO_VIEJO } from '../src/v3/banco.js';
import bancoJson from '../src/v3/entrevista/banco.json' with { type: 'json' };

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MD = readFileSync(path.join(RAIZ, 'docs', 'v3', 'entrevista', 'banco.md'), 'utf8');
const BORRADOR = readFileSync(path.join(RAIZ, 'docs', 'v3', 'banco-final-borrador.md'), 'utf8');

const celdas = (linea: string) =>
  linea.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

/** Espacios colapsados y la variante «sino:X: a ‖ b» vuelta a "a o b" (así estaba en el borrador). */
const normalizar = (t: string) =>
  t.replace(/«sino:[^:]+: (.*?) ‖ (.*?)»/g, '$1 o $2').replace(/\s+/g, ' ').trim();

type FilaBorrador = { clave: string; bloque: number; texto: string; sale: boolean };

/** Las filas de los bloques del borrador; la clave de los cierres lleva el bloque ("Cierre (bloque 3)"). */
function filasBorrador(): FilaBorrador[] {
  const filas: FilaBorrador[] = [];
  let bloque = 0;
  for (const linea of BORRADOR.split(/\r?\n/)) {
    const b = /^## Bloque (\d+)/.exec(linea);
    if (b) bloque = Number(b[1]);
    else if (/^## /.test(linea)) bloque = 0;
    if (!bloque || !linea.startsWith('|') || /^\|\s*(ID \||---)/.test(linea)) continue;
    const [id, texto, , , estado] = celdas(linea);
    filas.push({ clave: id === 'Cierre' ? `Cierre (bloque ${bloque})` : id, bloque, texto, sale: estado === 'sale' });
  }
  return filas;
}

/** La tabla "Equivalencias de IDs" del banco nuevo: ID del borrador → ID nuevo. */
function equivalencias(): Map<string, string> {
  const desde = MD.indexOf('## Equivalencias de IDs');
  const m = new Map<string, string>();
  for (const linea of MD.slice(desde).split(/\r?\n/)) {
    if (!linea.startsWith('|') || /^\|\s*(ID del|---)/.test(linea)) continue;
    const [de, a] = celdas(linea);
    m.set(de, a);
  }
  return m;
}

// IDs que ya existían en el banco viejo (docs/v3/banco-v3.md) y siguen con el
// mismo tema (se reescribió el texto, no el sentido). Sale de comparar los dos
// bancos pregunta por pregunta el 30/09.
const MISMO_SENTIDO = [
  'OR1', 'OR2', 'OR5', 'OR6', 'OR6.2', 'CA1', 'CA2', 'CA3', 'CA4', 'CA5', 'CA6', 'CA7', 'CA8', 'CA9', 'CA10', 'CA12', 'CA13',
  'CA14', 'CA15', 'CA16', 'CA17', 'ES1', 'ES2', 'ES3', 'ES5', 'ES6', 'ES7', 'ES8', 'ES9', 'ES10', 'AD2', 'AD1', 'AD2b', 'AD3',
  'AD5', 'AD6', 'AD8', 'AD9', 'AD10', 'AD11', 'JU1', 'JU2', 'JU2b', 'JU4', 'JU8', 'JU10', 'JU11', 'JU12', 'JU13', 'JU15',
  'JU16', 'JU17', 'AM1', 'AM2', 'AM3', 'AM4', 'AM5', 'AM6', 'AM8', 'AM9', 'AM7', 'AM14', 'AM15', 'TR1', 'TR6', 'OF1', 'MA1',
  'TR2', 'TR3', 'OF2', 'TR5', 'TR4', 'OF4', 'OB1', 'OB2', 'TR8', 'CS1', 'CP1', 'PR1', 'TR9', 'HI1', 'HI2', 'HI3', 'HI4', 'HI5',
  'HI6', 'HI7', 'HI10', 'HI8', 'HI9', 'NC1', 'LU3', 'LU4', 'PA1', 'LU5', 'AS1', 'AS1b', 'AY1', 'AS4', 'AS5', 'RE1', 'PE1',
  'PE5', 'PE6', 'ID1', 'PE4', 'HG1', 'HG2', 'HG4', 'HG3', 'DE1', 'GI1', 'GI2', 'GI8', 'HJ1', 'GI4', 'GI9', 'HJ5', 'HO1', 'PA2',
  'HO2', 'HO2.2', 'HO4', 'HO5', 'HO6', 'CO1', 'FU1', 'HO9', 'LE1', 'LE2', 'LE6', 'LE7', 'LE8', 'LE9',
];
// Existían en el banco viejo con OTRA pregunta; el borrador les mantuvo el ID.
// Anotado en "Dudas" de banco.md (AM16 y LU6 ya estaban en banco-descartadas.md).
// AM16 salió del banco después de la prueba de Naza en la página (30/09).
const OTRO_SENTIDO = ['AM13', 'LU6', 'AD12', 'JU9'];

describe('entrevista: el banco (md ↔ json)', () => {
  const parseado = parsearEntrevistaMd(MD);

  it('el json está al día con el md (si falla: npx tsx scripts/v3-entrevista-json.ts)', () => {
    expect(bancoJson).toEqual(parseado);
  });

  it('tiene 198 filas en 15 bloques, 65 mensajes, y las clases esperadas', () => {
    // Prueba de Naza en la página (30/09): salen AM16 y AM20, entran AMH, AM21 y HO11. Naza, 04/10: sale JU5 (la mili).
    expect(BANCO).toHaveLength(198);
    expect(new Set(BANCO.map((p) => p.bloque))).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]));
    // 22 + M24.1-M24.4, M25.1-M25.3, M26, DD1 y DD2 + 12 entradas de bloque (30/09) + M27.1-3, M28.1-3, M29, M30 y M31 (simulaciones, 30/09)
    // + M28.4, M32.1 y M32.2 (ronda 2, 30/09) + M28.5 (prueba de Naza en la página) + M33.1-M33.8 (la segunda oportunidad, Naza 01/10)
    expect(MENSAJES).toHaveLength(65);
    const clase = (c: string) => BANCO.filter((p) => p.clase === c).map((p) => p.id);
    expect(clase('cierre')).toEqual(['CI1', 'CI2', 'CI3', 'CI4', 'CI5', 'CI6', 'CI7', 'CI8', 'CI9', 'CI10', 'CI11', 'CI12', 'CI13', 'CI14']);
    expect(clase('aviso')).toEqual(['AV11']);
    expect(clase('foto')).toEqual(['FO1']);
    expect(clase('final')).toEqual(['FIN']);
    expect(BANCO.map((p) => p.orden)).toEqual(BANCO.map((_, i) => i + 1));
  });

  it('los mensajes: arranque, M3.1-M3.8, M4.1-M4.4 y los fijos', () => {
    expect(MENSAJES.map((m) => m.id)).toEqual([
      'BIEN', 'M6', 'M1', 'M3.1', 'M3.2', 'M3.3', 'M3.4', 'M3.5', 'M3.6', 'M3.7', 'M3.8',
      'M4.1', 'M4.2', 'M4.3', 'M4.4', 'M8', 'M9', 'M10', 'M15', 'M21', 'M22', 'M23', 'M24.1', 'M24.2', 'M24.3', 'M24.4', 'M25.1', 'M25.2', 'M25.3', 'M26',
      'M27.1', 'M27.2', 'M27.3', 'M28.1', 'M28.2', 'M28.3', 'M28.4', 'M28.5', 'M29', 'M30', 'M31', 'M32.1', 'M32.2',
      'M33.1', 'M33.2', 'M33.3', 'M33.4', 'M33.5', 'M33.6', 'M33.7', 'M33.8', 'DD1', 'DD2',
      'EN2', 'EN3', 'EN4', 'EN5', 'EN7', 'EN8', 'EN9', 'EN10', 'EN12', 'EN13', 'EN14', 'EN15',
    ]);
  });

  it('el orden de los bloques 4, 6 y 8 es el de la última vuelta', () => {
    const ids = (b: number) => BANCO.filter((p) => p.bloque === b).map((p) => p.id);
    expect(ids(4).slice(0, 2)).toEqual(['AD2', 'AD1']);
    // Simulaciones (Naza, 30/09): AM13 pasa antes de AM8 (la pelea antes de la despedida). Prueba de Naza en la
    // página (30/09): entra AMH después de AM0, y AM21 en lugar de AM16 y AM20 (v3-entrevista-prueba-naza.test.ts).
    expect(ids(6)).toEqual([
      'AM0', 'AMH', 'AM1', 'AM2', 'AM3', 'AM4', 'AM5', 'AM6', 'AM13', 'AM8', 'AM9', 'AM7', 'AM19', 'AM21', 'AM17', 'AM14', 'AM15', 'CI6',
    ]);
    const b8 = ids(8);
    expect(b8.slice(0, 2)).toEqual(['PG1', 'HI0']);
    expect(b8.indexOf('HS1')).toBeGreaterThan(b8.indexOf('HI3'));
    expect(b8.indexOf('HS1')).toBeLessThan(b8.indexOf('HI6'));
  });

  it('sensibles: el momento difícil de cada época, la plata ajustada, AM9 y todo el bloque 11 (Naza, 30/09, ronda 2)', () => {
    const sensibles = BANCO.filter((p) => p.sensible).map((p) => p.id);
    expect(sensibles).toEqual(['CA17', 'AD15', 'JU17', 'AM9', 'TR11', ...BANCO.filter((p) => p.bloque === 11).map((p) => p.id)]);
  });

  it('parsea "Depende de" con si:, sino: y " o "', () => {
    expect(parsearDepende('')).toEqual([]);
    expect(parsearDepende('si:AM0')).toEqual([{ tipo: 'si', de: 'AM0' }]);
    expect(parsearDepende('sino:AM9 o si:AM16')).toEqual([
      { tipo: 'sino', de: 'AM9' },
      { tipo: 'si', de: 'AM16' },
    ]);
    expect(() => parsearDepende('AM0 (si no fue "no")')).toThrow();
    // AM13 dependía de "sino:AM9 o si:AM16"; desde las simulaciones (Naza, 30/09) depende de AM3.
    expect(preguntaPorId('AM13')?.depende).toEqual([{ tipo: 'si', de: 'AM3' }]);
  });
});

describe('entrevista: el banco contra el borrador aprobado', () => {
  const borrador = filasBorrador();
  const equiv = equivalencias();
  const idNuevo = (clave: string) => equiv.get(clave) ?? clave;

  // Después de las simulaciones (Naza, 30/09) cambiaron 28 textos, HI2b salió
  // y entró AM20: esos se prueban letra por letra en
  // v3-entrevista-simulaciones-banco.test.ts, no contra el borrador.
  const CAMBIADAS_SIMULACIONES = new Set([
    'CA6', 'CA16', 'AD5', 'JU8', 'JU12', 'AM0', 'AM1', 'AM3', 'AM4', 'AM13', 'AM19', 'AM16', 'AM14', 'PG1', 'HI0', 'HS1', 'HI8',
    'TR5', 'HG4', 'GI1', 'GI2', 'GI9', 'HO2', 'PE1', 'PE4', 'CI1', 'FO1', 'FIN',
  ]);
  // Después de la prueba de Naza en la página (30/09) cambiaron estos (AM7 solo la variante de tiempo);
  // AMH, AM21 y HO11 son nuevas y AM16 salió: v3-entrevista-prueba-naza.test.ts.
  const CAMBIADAS_PRUEBA_NAZA = new Set(['CI3', 'CI4', 'CI6', 'CI7', 'CI8', 'CI9', 'CI10', 'CI13', 'CA3', 'AD15', 'JU17', 'AM9', 'AM7']);
  // Y después, con las propuestas de Fable que faltaban (textos-fable-extras.md, 30/09).
  const CAMBIADAS_FABLE_EXTRAS = new Set(['AD6', 'CS1', 'PA1', 'TR8', 'HO10', 'HE2']);
  // Y después, los pedidos de nombre (propuesta-nombres.md, OK de Naza 01/10): v3-entrevista-nombres.test.ts.
  const CAMBIADAS_NOMBRES = new Set(['OR2', 'CA2', 'CA3', 'CA6', 'ES2', 'ES5', 'AD6', 'AM1', 'HI8', 'AS1', 'TR3']);
  const NUEVAS = ['AM20', 'AMH', 'AM21', 'HO11'];
  // Naza, 04/10 (después de la simulación en catalán): cambiaron estos textos y salió JU5 (la mili).
  const CAMBIADAS_0410 = new Set(['JU20', 'AM0', 'AMH', 'AM9', 'HE2']);

  it('toda fila viva del borrador está, con el mismo texto (salvo lo que cambió en las simulaciones)', () => {
    const vivas = borrador.filter((f) => !f.sale && idNuevo(f.clave) !== 'HI2b' && idNuevo(f.clave) !== 'AM16' && idNuevo(f.clave) !== 'JU5');
    expect(vivas).toHaveLength(BANCO.filter((p) => !NUEVAS.includes(p.id)).length);
    for (const f of vivas) {
      const p = preguntaPorId(idNuevo(f.clave));
      expect(p, `${f.clave} → ${idNuevo(f.clave)}`).toBeDefined();
      // FI7 y FU1 cambiaron de bloque en la ronda 2 del 30/09 (correcciones-lectura.md).
      if (p!.id !== 'FI7' && p!.id !== 'FU1') expect(p!.bloque, f.clave).toBe(f.bloque);
      // CI14 se reescribió el 30/09 después de la lectura corrida (correcciones-lectura.md): ahora pregunta.
      // CI11 perdió su primera frase en la ronda 2.
      if (p!.id === 'CI14' || p!.id === 'CI11' || p!.id === 'FO1') continue; // FO1: "Otra cosa" desde la ronda 3
      if (CAMBIADAS_SIMULACIONES.has(p!.id) || CAMBIADAS_PRUEBA_NAZA.has(p!.id) || CAMBIADAS_FABLE_EXTRAS.has(p!.id) || CAMBIADAS_NOMBRES.has(p!.id) || CAMBIADAS_0410.has(p!.id)) continue;
      expect(normalizar(p!.texto), f.clave).toBe(normalizar(f.texto));
    }
  });

  it('ninguna fila "sale" está en el banco', () => {
    const salen = borrador.filter((f) => f.sale);
    expect(salen.map((f) => f.clave)).toEqual(['AD14', 'N1 (bl. 5)', 'CS3', 'AM18', 'LU1', 'PE9', 'PE10', 'HJ6']);
    for (const f of salen) expect(preguntaPorId(idNuevo(f.clave)), f.clave).toBeUndefined();
  });

  it('los mensajes son los del borrador (M3 y M4 partidos en sus acuses)', () => {
    const texto = (id: string) => MENSAJES.find((m) => m.id === id)!.texto;
    expect(texto('M3.1')).toBe('Gracias, {{nombre}}. Ya lo guardé.');
    // M4.4 cambió después de la prueba de Naza en la página (30/09; antes: "…Cuando quieras, seguimos.").
    expect(texto('M4.4')).toBe('Gracias por animarte a contarlo. Lo guardo con cuidado.');
    expect(texto('M1')).toBe('_Si no va con vos, decí paso y vamos a otra._');
    // M24, M25, DD1-DD2, las entradas EN y la bienvenida en un solo mensaje (BIEN) los aprobó Naza el 30/09, después del borrador (metodo-entrevista.md §26, correcciones-lectura.md).
    // M27 a M31 los aprobó Naza después de las simulaciones (30/09, simulaciones/textos-finales.md).
    // M33.1-M33.8 (la segunda oportunidad) los aprobó Naza el 01/10: v3-entrevista-segunda-oportunidad.test.ts.
    for (const m of MENSAJES.filter((m) => !/^M[34]\./.test(m.id) && !/^(M24\.|M25\.|M26$|M2[789]|M3[0123]|DD|EN|BIEN$)/.test(m.id))) {
      const clave = m.id === 'BIEN' ? '| Bienvenida |' : m.id === 'M6' ? '| M6 (después de la bienvenida) |' : `| ${m.id} |`;
      const linea = BORRADOR.split(/\r?\n/).find((l) => l.startsWith(clave));
      expect(linea, m.id).toBeDefined();
      expect(linea!.includes(m.texto), m.id).toBe(true);
    }
  });
});

describe('entrevista: IDs y dependencias', () => {
  const ids = BANCO.map((p) => p.id);

  it('IDs únicos y limpios (sin paréntesis ni espacios), también contra los mensajes', () => {
    const todos = [...ids, ...MENSAJES.map((m) => m.id)];
    expect(new Set(todos).size).toBe(todos.length);
    for (const id of todos) expect(id).toMatch(/^[A-Z]{1,4}\d*(\.\d+)?b?$/);
  });

  it('ningún ID nuevo reusa uno del banco viejo, salvo las listas explícitas', () => {
    const viejos = new Set(BANCO_VIEJO.map((p) => p.id));
    const reusados = ids.filter((id) => viejos.has(id));
    expect(new Set(reusados)).toEqual(new Set([...MISMO_SENTIDO, ...OTRO_SENTIDO]));
    // Los IDs creados para el banco nuevo (en las equivalencias, los que no son
    // el mismo ID sin el paréntesis: "PA3 (hincha)" → PA3 no cuenta) no existían.
    const creados = [...equivalencias()].filter(([clave, nuevo]) => !/^M[34] /.test(clave) && !clave.startsWith(`${nuevo} `));
    expect(creados.map(([, nuevo]) => nuevo)).toContain('JU22');
    for (const [clave, nuevo] of creados) expect(viejos.has(nuevo), `${clave} → ${nuevo}`).toBe(false);
  });

  it('toda dependencia (y toda variante «sino:X») apunta a una pregunta que existe y va antes', () => {
    for (const p of BANCO) {
      // Con las condiciones de " y " (el AM3 de AM19, ronda 2).
      const refs = [...p.depende.flatMap(condicionesDe).map((c) => c.de), ...idsEnVariantes(p.texto)];
      if (p.id === 'AM19') expect(refs).toContain('AM3');
      for (const de of refs) {
        const otra = preguntaPorId(de);
        expect(otra, `${p.id} depende de ${de}, que no existe`).toBeDefined();
        expect(otra!.orden, `${p.id} depende de ${de}, que va después`).toBeLessThan(p.orden);
      }
    }
  });

  it('ninguna pregunta del núcleo depende de una extra (la extra llega después)', () => {
    for (const p of BANCO.filter((q) => q.parte === 'nucleo')) {
      for (const c of p.depende.flatMap(condicionesDe)) expect(preguntaPorId(c.de)!.parte, `${p.id} → ${c.de}`).toBe('nucleo');
    }
  });

  it('las dependencias son las de la última vuelta', () => {
    const dep = (id: string) => preguntaPorId(id)!.depende.map((c) => [c, ...(c.y ?? [])].map((x) => `${x.tipo}:${x.de}`).join(' y ')).join(' o ');
    const esperado: Record<string, string> = {
      CA7: 'si:CA6', JU10: 'si:JU8', JU11: 'si:JU8',
      // Simulaciones (Naza, 30/09): AM4, AM5 y AM13 dependen de AM3; HI8 de HI0; HI3, HS1 y HI6 de HI2; HI2b salió.
      AM1: 'si:AM0', AM2: 'si:AM0', AM3: 'si:AM0', AM4: 'si:AM3', AM5: 'si:AM3', AM6: 'si:AM0', AM8: 'si:AM0', AM7: 'si:AM0', AM17: 'si:AM0',
      // Prueba de Naza en la página (30/09): AMH nueva; AM9 y AM19 dependen de AMH; AM21 reemplaza a AM16 y AM20; AM14 solo sin pareja; HE2 de CA6.
      AMH: 'si:AM0', AM9: 'sino:AMH', AM19: 'sino:AMH y si:AM3', AM21: 'si:AM0', AM14: 'sino:AM0', HE2: 'si:CA6',
      AM13: 'si:AM3', AM15: 'sino:AM0',
      HI1: 'si:HI0', HI2: 'si:HI0', HI3: 'si:HI2', HI4: 'si:HI0', HI5: 'si:HI0', HS1: 'si:HI2', HI6: 'si:HI2', HI7: 'si:HI0', HI12: 'si:HI0', HI13: 'si:HI0',
      HI10: 'sino:HI0', HI8: 'si:HI0', HI9: 'si:HI8', NC1: 'si:HI8', AS1b: 'si:AS1', HG2: 'si:HG1',
    };
    for (const p of BANCO) expect(dep(p.id), p.id).toBe(esperado[p.id] ?? '');
  });
});

describe('entrevista: textos limpios', () => {
  const textos = [...BANCO.map((p) => [p.id, p.texto]), ...MENSAJES.map((m) => [m.id, m.texto])] as const;

  it('sin placeholders viejos ni genéricos entre corchetes', () => {
    const viejos = ['{{madre}}', '{{padre}}', '{{hermanos}}', '{{pareja_1}}', '{{destinatarios}}', '{{ciudad_infancia}}', '{{lugar_origen}}', '{{lugar_destino}}'];
    for (const [id, t] of textos) {
      for (const v of viejos) expect(t.includes(v), `${id} tiene ${v}`).toBe(false);
      expect(t, id).not.toMatch(/\[[^\]]+\]/);
      // Solo las marcas nuevas.
      for (const m of t.matchAll(/\{\{([^}]+)\}\}/g)) expect(['o/a', 'padre/madre', 'nombre', 'etapa', 'quien_regala', 'tema'], `${id}: {{${m[1]}}}`).toContain(m[1]);
    }
  });

  it('sin "pausa" ni "elegí"', () => {
    for (const [id, t] of textos) {
      expect(t.toLowerCase(), id).not.toMatch(/pausa/);
      expect(t.toLowerCase(), id).not.toMatch(/elegí/);
    }
  });
});

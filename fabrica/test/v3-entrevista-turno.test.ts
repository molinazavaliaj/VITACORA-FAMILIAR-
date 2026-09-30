// El script que hace de WhatsApp para las simulaciones con narradores
// inventados (scripts/v3-entrevista-turno.ts; docs/v3/entrevista/
// simulaciones/PLAN.md). Lo central: con las mismas respuestas, manda
// exactamente lo mismo que la lectura corrida aprobada.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { mensajePorId } from '../src/v3/entrevista/banco.js';
import { VIDAS_EJEMPLO } from '../src/v3/entrevista/vidas-ejemplo.js';
import { charlaMd, main, nuevaEntrevista, responder, salidaParaNarrador, textoDeGlobo, tocarBoton, type EstadoSimulacion, type Parte, type Resultado } from '../scripts/v3-entrevista-turno.js';

const dir = mkdtempSync(join(tmpdir(), 'v3-turno-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const MARTA = { nombre: 'Marta', genero: 'mujer' as const };
const CUENTA = 'Sí, te cuento: fue una historia larga que me acuerdo muy bien.';
const m = (id: string) => mensajePorId(id)!.texto;

/** Contesta hasta el final con `responder`; si `json`, pasa el estado por JSON en cada vuelta (como el CLI). */
function hastaElFinal(r: Resultado, contestar: (id: string) => string, json = false): Resultado {
  for (let i = 0; i < 300 && !r.estado.terminada; i++) {
    const estado = json ? (JSON.parse(JSON.stringify(r.estado)) as EstadoSimulacion) : r.estado;
    r = responder(estado, contestar(estado.esperando!));
  }
  return r;
}

describe('arranque', () => {
  it('bienvenida en un mensaje y la primera pregunta con la frase del paso', () => {
    const r = nuevaEntrevista(MARTA);
    expect(r.mensajes).toHaveLength(2);
    expect(r.mensajes[0]).toBe(m('BIEN').replace(/\{\{nombre\}\}/g, 'Marta'));
    expect(r.mensajes[1]).toMatch(/\n_Si no va con vos, decí paso y vamos a otra\._$/);
    expect(r.estado.esperando).toBe('OR1');
    expect(r.estado.terminada).toBe(false);
  });

  it('los párrafos de la bienvenida van separados por una línea en blanco; las líneas de otro ID, por un salto', () => {
    const partes: Parte[] = [{ id: 'A', texto: 'uno' }, { id: 'A', texto: 'dos' }, { id: 'B', texto: 'tres' }];
    expect(textoDeGlobo(partes)).toBe('uno\n\ndos\ntres');
  });
});

describe('igual que la lectura corrida aprobada', () => {
  it('con las respuestas de Rogelio, los mismos mensajes del biógrafo, en el mismo orden', () => {
    const json = join(dir, 'lectura.json');
    execFileSync(process.execPath, ['--import', 'tsx', 'scripts/v3-entrevista-lectura.ts', join(dir, 'lectura.md'), json], { cwd: join(__dirname, '..'), stdio: 'pipe' });
    const lectura = JSON.parse(readFileSync(json, 'utf8')) as { globos: ({ de: string; partes?: Parte[] })[]; mensajesBio: number };

    const vida = VIDAS_EJEMPLO.find((v) => v.clave === 'sigue-con-la-primera')!;
    const cortas: Record<string, string> = { CI9: 'No, nada más.', CI12: 'Paso' };
    const r = hastaElFinal(nuevaEntrevista(vida.ficha, [{ id: 'FAM1', texto: '[acá va la pregunta que escribió alguien de la familia]' }]), (id) =>
      id === 'FAM1' ? 'Sí, te cuento.' : (cortas[id] ?? vida.respuestas[id] ?? CUENTA),
    );

    const esperados = lectura.globos.filter((g) => g.de === 'bio').map((g) => g.partes);
    const obtenidos = r.estado.charla.flatMap((g) => (g.de === 'bio' ? [g.partes] : []));
    expect(obtenidos).toEqual(esperados);
    expect(obtenidos).toHaveLength(lectura.mensajesBio);
    expect(r.estado.terminada).toBe(true);
    expect(r.mensajes.at(-1)).toMatch(/^Hasta acá llegamos, Rogelio\./);
  }, 60_000);

  it('pasar el estado por JSON entre turnos (como el CLI) da lo mismo que en memoria', () => {
    const contestar = (id: string) => (id === 'AM0' ? 'No, nunca me casé.' : id === 'CA6' ? 'Paso' : CUENTA);
    const a = hastaElFinal(nuevaEntrevista(MARTA), contestar);
    const b = hastaElFinal(nuevaEntrevista(MARTA), contestar, true);
    expect(b.estado).toEqual(a.estado);
  });
});

describe('cada turno', () => {
  it('"paso" en una pregunta común: "Dale, la salteamos" pegado arriba de lo que sigue', () => {
    let r = nuevaEntrevista(MARTA);
    r = responder(r.estado, 'Paso');
    expect(r.mensajes[0].startsWith(`${m('M21')}\n`)).toBe(true);
  });

  it('una respuesta no cambia el estado anterior (se puede repetir un turno)', () => {
    const r0 = nuevaEntrevista(MARTA);
    const copia = JSON.stringify(r0.estado);
    responder(r0.estado, 'Nací en un pueblo chico.');
    expect(JSON.stringify(r0.estado)).toBe(copia);
  });

  it('el aviso del bloque 11 llega junto con la primera pregunta del bloque, en el mismo turno', () => {
    let r = nuevaEntrevista(MARTA);
    while (r.estado.esperando && !r.estado.charla.some((g) => g.de === 'bio' && g.partes.some((p) => p.id === 'AV11'))) r = responder(r.estado, CUENTA);
    const ids = r.estado.charla.slice(-3).flatMap((g) => (g.de === 'bio' ? g.partes.map((p) => p.id) : []));
    expect(ids).toContain('AV11');
    expect(r.estado.enviados).toContain('AV11');
    expect(r.estado.esperando).toMatch(/^[A-Z]+\d/);
    expect(r.estado.esperando).not.toBe('AV11');
  });

  it('las preguntas de la familia llegan con "Esta pregunta te la hace tu familia."', () => {
    const r = hastaElFinal(nuevaEntrevista(MARTA, [{ id: 'FAM1', texto: '¿Cómo era la casa de la abuela?' }]), () => CUENTA);
    const i = r.estado.charla.findIndex((g) => g.de === 'bio' && g.partes.some((p) => p.id === 'FAM1'));
    const antes = r.estado.charla[i - 1];
    expect(antes.de === 'bio' && antes.partes.some((p) => p.id === 'M15')).toBe(true);
    expect(r.estado.respuestas.some(([id]) => id === 'FAM1')).toBe(true);
  });

  it('termina con el mensaje final y después no acepta más respuestas', () => {
    const r = hastaElFinal(nuevaEntrevista(MARTA), () => CUENTA);
    expect(r.estado.terminada).toBe(true);
    expect(r.estado.esperando).toBeUndefined();
    expect(r.estado.enviados).toContain('FIN');
    expect(() => responder(r.estado, 'Hola?')).toThrow(/terminó/);
  });

  it('los saltos de línea de Windows (CRLF) quedan como saltos comunes', () => {
    const r = responder(nuevaEntrevista(MARTA).estado, 'Nací en Rosario.\r\nFue lindo.\r\n');
    expect(r.estado.respuestas[0]).toEqual(['OR1', 'Nací en Rosario.\nFue lindo.']);
  });

  it('no acepta una respuesta vacía', () => {
    expect(() => responder(nuevaEntrevista(MARTA).estado, '   ')).toThrow(/vacía/);
  });

  it('el género del narrador llega a los textos', () => {
    const r = hastaElFinal(nuevaEntrevista({ nombre: 'Tito', genero: 'varon' }), () => CUENTA);
    const todo = r.estado.charla.flatMap((g) => (g.de === 'bio' ? [textoDeGlobo(g.partes)] : [])).join('\n');
    expect(todo).not.toMatch(/\{\{/);
  });
});

/** Contesta contando algo hasta que la pregunta que espera es `id`. */
function hasta(id: string, r: Resultado = nuevaEntrevista(MARTA)): Resultado {
  for (let i = 0; i < 300 && r.estado.esperando !== id; i++) r = responder(r.estado, CUENTA);
  expect(r.estado.esperando).toBe(id);
  return r;
}

describe('botones (Naza, 30/09, simulaciones)', () => {
  it('se muestran debajo del mensaje; el primero con botones (CI1) lleva la ayuda M31', () => {
    const r = hasta('CI1');
    const ultimo = r.mensajes.at(-1)!;
    expect(ultimo).toMatch(/\n_Podés tocar el botón de abajo, o contestarme en audio como siempre\._\n\[botones: \(No, está todo\)\]$/);
    const ca6 = hasta('CA6', r).mensajes.at(-1)!;
    expect(ca6).toMatch(/\[botones: \(Sí, tuve\) \(No tuve hermanos\)\]$/);
    expect(ca6).not.toContain('Podés tocar');
  });

  it('"Sí": llega M30 solo, sigue esperando la misma pregunta y el audio se suma a esa respuesta', () => {
    let r = hasta('CA6');
    r = tocarBoton(r.estado, 'Sí, tuve');
    expect(r.mensajes).toEqual(['Contame, te escucho.']);
    expect(r.estado.esperando).toBe('CA6');
    r = responder(r.estado, 'Éramos cuatro y con el más chico hicimos de todo.');
    expect(r.estado.respuestas.at(-1)).toEqual(['CA6', '⟦botón:Sí, tuve⟧ Éramos cuatro y con el más chico hicimos de todo.']);
    expect(r.estado.esperando).toBe('CA10'); // CA10 pasó al núcleo (Naza, 30/09)
    expect(r.mensajes[0]).not.toMatch(/^Bien, seguimos\./); // contó algo: acuse común
  });

  it('"No": la respuesta queda cerrada, va M25 arriba y no llegan las que dependen', () => {
    let r = hasta('HI0');
    r = tocarBoton(r.estado, 'No tuve hijos');
    expect(r.estado.respuestas.at(-1)).toEqual(['HI0', '⟦botón:No tuve hijos⟧']);
    expect(r.mensajes[0]).toMatch(/^Bien, (seguimos|entonces)\.\n/);
    expect(r.estado.esperando).toBe('HI10');
  });

  it('[Prefiero no contarla] (antes [Paso esta]) en una sensible: M27 arriba de lo que sigue', () => {
    let r = hasta('CA17');
    r = tocarBoton(r.estado, 'Prefiero no contarla');
    expect(r.mensajes[0]).toMatch(/^(Está bien, Marta\. Lo dejamos ahí y seguimos por otro lado\.|Claro, sin problema\. Vamos con otra\.)\n/);
  });

  it('errores claros: un botón que la pregunta no tiene, o tocar otro después de "Sí"', () => {
    const r = hasta('CA6');
    expect(() => tocarBoton(r.estado, 'No tuve hijos')).toThrow(/Sí, tuve.*No tuve hermanos/);
    const si = tocarBoton(r.estado, 'Sí, tuve');
    expect(() => tocarBoton(si.estado, 'No tuve hermanos')).toThrow(/Ya tocó/);
  });

  it('el md muestra los botones y el toque', () => {
    let r = hasta('CA6');
    r = tocarBoton(r.estado, 'Sí, tuve');
    r = responder(r.estado, 'Éramos cuatro.');
    const md = charlaMd(r.estado, 'Prueba');
    expect(md).toContain('> [botones: (Sí, tuve) (No tuve hermanos)]');
    expect(md).toContain('**Narrador** `[CA6]`: [toca: Sí, tuve]');
    expect(md).toContain('**Biógrafo** `[M30]`:');
    expect(md).toContain('**Narrador** `[CA6]`: Éramos cuatro.');
  });

  it('por la CLI: responder <estado> --boton "<texto>"', () => {
    const estado = join(dir, 'boton.json');
    main(['nueva', estado, '--nombre', 'Marta', '--genero', 'mujer']);
    for (let i = 0; i < 5; i++) main(['responder', estado, '--respuesta', CUENTA]); // OR1, OR2, OR5, OR6, OR6.2 (Naza, 30/09)
    const salida = main(['responder', estado, '--boton', 'No, está todo']);
    expect(salida).toMatch(/Te toca contestar/);
    const e = JSON.parse(readFileSync(estado, 'utf8')) as EstadoSimulacion;
    expect(e.respuestas.at(-1)).toEqual(['CI1', '⟦botón:No, está todo⟧']);
    expect(() => main(['responder', estado, '--boton'])).toThrow(/sin texto/);
  });
});

describe('lo que ve el narrador y lo que lee el equipo', () => {
  it('el narrador ve los mensajes sin IDs, numerados, y si le toca contestar', () => {
    const r = nuevaEntrevista(MARTA);
    const s = salidaParaNarrador(r);
    expect(s).toMatch(/^\[mensaje 1 de 2\]\nHola, Marta/);
    expect(s).not.toMatch(/OR1|BIEN/);
    expect(s).toMatch(/>> Te toca contestar\.$/);
  });

  it('la charla en md lleva los IDs, los bloques y las respuestas', () => {
    let r = nuevaEntrevista(MARTA);
    r = responder(r.estado, 'Nací en Rosario, en el cuarenta y ocho.');
    const md = charlaMd(r.estado, 'Prueba');
    expect(md).toMatch(/^# Prueba/);
    expect(md).toContain('## Bloque 1 ·');
    expect(md).toContain('**Biógrafo** `[BIEN]`:');
    expect(md).toContain('**Narrador** `[OR1]`: Nací en Rosario, en el cuarenta y ocho.');
    expect(md).toContain('**no terminó**');
  });
});

describe('CLI', () => {
  it('nueva → responder → md, con el estado en un archivo', () => {
    const estado = join(dir, 'cli.json');
    expect(main(['nueva', estado, '--nombre', 'Marta', '--genero', 'mujer', '--familia', '¿Y la abuela?'])).toMatch(/Hola, Marta/);
    const e = JSON.parse(readFileSync(estado, 'utf8')) as EstadoSimulacion;
    expect(e.familia).toEqual([{ id: 'FAM1', texto: '¿Y la abuela?' }]);
    expect(main(['responder', estado, '--respuesta', 'Nací en un pueblo.'])).toMatch(/Te toca contestar/);
    const md = join(dir, 'cli.md');
    main(['md', estado, md, '--titulo', 'Marta']);
    expect(readFileSync(md, 'utf8')).toContain('Nací en un pueblo.');
  });

  it('la respuesta también puede llegar por stdin (así contesta el agente, sin problemas de comillas)', () => {
    const estado = join(dir, 'stdin.json');
    main(['nueva', estado, '--nombre', 'Marta', '--genero', 'mujer']);
    const salida = execFileSync(process.execPath, ['--import', 'tsx', 'scripts/v3-entrevista-turno.ts', 'responder', estado], {
      cwd: join(__dirname, '..'),
      input: 'Mirá, "nací" en el campo, con comillas y todo.\n',
      encoding: 'utf8',
    });
    expect(salida).toMatch(/Te toca contestar/);
    const e = JSON.parse(readFileSync(estado, 'utf8')) as EstadoSimulacion;
    expect(e.respuestas[0]).toEqual(['OR1', 'Mirá, "nací" en el campo, con comillas y todo.']);
  }, 30_000);

  it('errores claros: sin género, comando desconocido', () => {
    expect(() => main(['nueva', join(dir, 'x.json'), '--nombre', 'Ana'])).toThrow(/--genero/);
    expect(() => main(['otra', join(dir, 'x.json')])).toThrow(/Uso/);
    expect(() => main(['responder', join(dir, 'x.json'), '--respuesta'])).toThrow(/sin texto/);
  });
});

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IDS_REQUERIDOS, parsearBancoKids, parsearBancoMd, parsearMensajesMd, respuestaDe, textoYBotones } from '../src/kids-v2/banco-md.js';
import { BANCO, extra, fijo, pregunta } from '../src/kids-v2/banco.js';
import bancoJson from '../src/kids-v2/banco.json' with { type: 'json' };

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const leer = (f: string) => readFileSync(path.join(RAIZ, 'docs', 'kids', 'v2', f), 'utf8');
const BANCO_MD = leer('banco.md');
const MENSAJES_MD = leer('mensajes.md');

describe('kids v2: banco.md + mensajes.md → banco.json', () => {
  it('el json commiteado está al día con los md (si falla: npx tsx scripts/kids-v2-json.ts)', () => {
    expect(bancoJson).toEqual(parsearBancoKids(BANCO_MD, MENSAJES_MD));
  });

  it('47 principales en 5 capítulos, 16 fotos, 15 ★, 32 extras', () => {
    expect(BANCO.preguntas.map((p) => p.id)).toEqual(Array.from({ length: 47 }, (_, i) => `K${i + 1}`));
    expect(BANCO.capitulos.map((c) => c.n)).toEqual([1, 2, 3, 4, 5]);
    expect([1, 2, 3, 4, 5].map((n) => BANCO.preguntas.filter((p) => p.cap === n).length)).toEqual([9, 11, 10, 10, 7]);
    expect(BANCO.preguntas.filter((p) => p.foto).length).toBe(16);
    expect(BANCO.preguntas.filter((p) => p.estrella).map((p) => p.id)).toEqual(['K1', 'K2', 'K3', 'K10', 'K11', 'K12', 'K13', 'K15', 'K21', 'K22', 'K31', 'K40', 'K42', 'K46', 'K47']);
    expect([1, 2, 3, 4, 5].map((n) => BANCO.extras.filter((x) => x.cap === n).length)).toEqual([7, 11, 6, 5, 3]);
  });

  it('están todos los mensajes fijos que usa el motor', () => {
    const ids = new Set(BANCO.mensajes.map((m) => m.id));
    for (const id of IDS_REQUERIDOS) expect(ids.has(id), id).toBe(true);
    expect(BANCO.mensajes).toHaveLength(IDS_REQUERIDOS.length);
  });

  it('las anotaciones *(05/10)* no se cuelan en los textos', () => {
    expect(pregunta('K10').texto).toBe('Tu mamá. Contame cómo es, y una vez que te cuidó cuando estabas enferm{{o/a}}.');
    expect(pregunta('K1').texto).toBe('¿Cuál es el primer recuerdo de tu vida? Lo más viejo que tengas, aunque sea borroso.');
    expect(fijo('PREG-NUEVA-CHICO').texto).toBe('Hola {{1}}, hay una pregunta esperándote. Tocá el botón y te la mando.');
    expect(fijo('CIERRE-FINAL').texto).toBe('Esas eran todas las preguntas. Contaste un montón, y con todo eso se arma tu libro. ¿Quedó algo que quieras decir, de lo que sea?');
    for (const t of [...BANCO.preguntas.map((p) => p.texto), ...BANCO.mensajes.map((m) => m.texto), ...BANCO.extras.map((x) => x.texto)]) {
      expect(t).not.toMatch(/\*\(|→|\[|<br>/);
    }
  });

  it('botón para pasar: [Paso] salvo K10, K11, K39 ([Esta la paso]) y K41 ([Esta no, gracias])', () => {
    const raros = BANCO.preguntas.filter((p) => p.botonPaso !== 'Paso').map((p) => [p.id, p.botonPaso]);
    expect(raros).toEqual([['K10', 'Esta la paso'], ['K11', 'Esta la paso'], ['K39', 'Esta la paso'], ['K41', 'Esta no, gracias']]);
  });

  it('ramas: K12 con dos pasos en "No tengo hermanos"; los "no" de K16, K18, K20 y K38 no preguntan', () => {
    expect(pregunta('K12').ramas.map((r) => r.boton)).toEqual(['Tengo hermanos', 'No tengo hermanos']);
    const noTengo = pregunta('K12').ramas[1].accion;
    expect(noTengo).toEqual({ tipo: 'preguntar', pasos: ['¿Te hubiera gustado tener un hermano o una hermana?', '¿Y alguien que sea casi como un hermano o hermana para vos? Contame una vez juntos, y decime cómo se llama.'] });
    expect(pregunta('K12').op?.soloRama).toBe('Tengo hermanos');
    for (const [id, boton] of [['K16', 'No tengo'], ['K18', 'No hay nadie así'], ['K20', 'No me pasó'], ['K38', 'No se me ocurre']]) {
      expect(pregunta(id).ramas.find((r) => r.boton === boton)?.accion, id).toEqual({ tipo: 'no-aplica' });
    }
    expect(pregunta('K25').ramas.map((r) => r.boton)).toEqual(['Sí', 'Todavía no']);
  });

  it('fotos: botones propios, K24 con [Hoy no la como], K29 con su respuesta a [No tengo]', () => {
    expect(pregunta('K11').foto?.botones).toEqual(['No hago', 'No tengo']);
    expect(pregunta('K14').foto?.botones).toEqual(['De ninguno', 'No tengo']);
    expect(pregunta('K21').foto?.botones).toEqual(['No miro', 'No tengo']);
    expect(pregunta('K24').foto?.botones).toEqual(['Hoy no la como']);
    expect(pregunta('K29').foto?.noTengo).toBe(fijo('B-FOTO-PLATA').texto);
    expect(pregunta('K10').foto?.texto).toBe('Si tenés mascota, sacale una foto y mandámela. ¿Cómo llegó a tu casa? Y decime cómo se llama.');
  });

  it('marcas: sacables, sensible y aviso', () => {
    expect(BANCO.preguntas.filter((p) => p.sacable).map((p) => p.id)).toEqual(['K10', 'K11', 'K18', 'K38']);
    expect(BANCO.preguntas.filter((p) => p.sensible).map((p) => p.id)).toEqual(['K39']);
    expect(BANCO.preguntas.filter((p) => p.avisoAntes).map((p) => p.id)).toEqual(['K39']);
    expect(pregunta('K39').op).toBeNull();
  });

  it('extras: OP de origen, solo si, livianas, foto, sensible', () => {
    expect(BANCO.extras.filter((x) => x.deOp).map((x) => x.deOp)).toEqual(['K1', 'K2', 'K3', 'K4', 'K8']);
    expect(extra('X1-7')).toMatchObject({ foto: true, texto: 'Mostrame algo que guardás hace años aunque nadie entienda por qué. ¿De dónde salió?' });
    expect(BANCO.extras.filter((x) => x.soloSi === 'hermanos').map((x) => x.id)).toEqual(['X2-9', 'X2-10']);
    expect(extra('X2-9').sacable).toBe(false); // "ya no es sacable" (05/10)
    expect(BANCO.extras.filter((x) => x.soloSi === 'pelea-k36').map((x) => x.id)).toEqual(['X4-3']);
    expect(BANCO.extras.filter((x) => x.liviana).map((x) => x.id)).toEqual(['X4-1', 'X4-2']);
    expect(BANCO.extras.filter((x) => x.sensible).map((x) => x.id)).toEqual(['X3-2']);
  });

  it('mensajes del banco: textos y botones', () => {
    expect(fijo('B-SEGUIR')).toMatchObject({ texto: 'Esa ya está. ¿Seguimos con otra ahora o la dejamos para mañana?', botones: ['Dale, otra', 'Mañana sigo'] });
    expect(fijo('B-MAÑANA').texto).toBe('Ya está por hoy, mañana hay más.');
    expect(fijo('B-PASO').texto).toBe('Dale, esa la salteamos.');
    expect(fijo('B-NO-PASA-NADA').texto).toBe('Dale, no pasa nada.');
    expect(fijo('B-FOTO-NOTENGO').texto).toBe('Dale. Si igual hay algo así pero no lo tenés a mano, contámelo en un audio y vale igual.');
    expect(fijo('B-DIAFEO-ACUSE-1').texto).toBe('Gracias por contarme eso. Lo guardamos con cuidado.');
    expect(fijo('B-DIAFEO-ACUSE-2').texto).toBe('Gracias por confiarme eso. Ya está, ya lo contaste.');
    expect(fijo('B-TRANQUILA')).toMatchObject({ texto: 'Si querés, hay una más tranquila para no cerrar el día así. Vos elegís.', botones: ['Dale, una tranquila', 'Mañana sigo'] });
    expect(fijo('B-AVISO-SERIA').botones).toEqual(['Voy ahora', 'Mañana mejor']);
    expect(fijo('B-UNA-MAS').botones).toEqual(['Dale, otra', 'No, cerramos']);
    for (const id of ['CIERRE-1', 'CIERRE-2', 'CIERRE-3', 'CIERRE-4', 'CIERRE-FINAL'] as const) expect(fijo(id).botones, id).toEqual(['No, eso fue todo', 'Sí, hay algo']);
    expect(fijo('ENTRADA-2').texto).toBe('Ahora vamos con la gente de tu vida. Tu familia, tus amigos y los que querés.');
  });

  it('mensajes.md: plantillas, botones y el plural armado con "el resto, igual que"', () => {
    expect(fijo('BIEN-CHICO')).toMatchObject({ plantilla: 'kids_bienvenida', botones: ['Dale, vamos'] });
    expect(fijo('BIEN-CHICO-PL').plantilla).toBe('kids_bienvenida_plural');
    expect(fijo('BIEN-CHICO-PL').texto).toBe(fijo('BIEN-CHICO').texto.replace('te hizo un regalo', 'te hicieron un regalo'));
    expect(fijo('BIEN-CHICO-PL').botones).toEqual(['Dale, vamos']);
    expect(fijo('BIEN-CHICO').texto.split('\n\n')).toHaveLength(5);
    expect(fijo('RECORD-B-8')).toMatchObject({ plantilla: 'kids_recordatorio_lo_hago_yo_8', botones: ['Estamos listos'] });
    expect(fijo('AVISO-PADRE')).toMatchObject({ plantilla: 'kids_aviso_padre', botones: [] });
    expect(fijo('EXTRAS-OTRA')).toMatchObject({ plantilla: null, botones: ['Dale, otra', 'Lo dejamos acá'] });
    expect(fijo('FINAL-CHICO-PL').texto).toContain('te lo van a dar {{2}}, que fueron quienes te hicieron este regalo');
    expect(fijo('ACUSE-4').texto).toBe('Ya lo escuché, lo tengo.');
    const plantillas = BANCO.mensajes.filter((m) => m.plantilla).map((m) => m.plantilla);
    expect(plantillas.sort()).toEqual([
      'kids_aviso_padre', 'kids_bienvenida', 'kids_bienvenida_padre', 'kids_bienvenida_plural', 'kids_pregunta_nueva', 'kids_pregunta_nueva_padre',
      'kids_recordatorio_lo_hago_yo', 'kids_recordatorio_lo_hago_yo_8', 'kids_recordatorio_padre', 'kids_recordatorio_padre_8', 'kids_termino_padre',
    ]);
  });

  it('ningún texto del banco tiene dos puntos (paso-3-sin-dos-puntos.md)', () => {
    for (const m of BANCO.mensajes) expect(m.texto, m.id).not.toContain(':');
    for (const p of BANCO.preguntas) {
      expect(p.texto, p.id).not.toContain(':');
      if (p.op) expect(p.op.texto, `${p.id} OP`).not.toContain(':');
      if (p.foto) expect(p.foto.texto, `${p.id} foto`).not.toContain(':');
    }
    for (const x of BANCO.extras) expect(x.texto, x.id).not.toContain(':');
  });

  it('si falta un mensaje que el motor usa, el parseo falla con su ID', () => {
    expect(() => parsearBancoKids(BANCO_MD.replace('**Seguir ahora o mañana**', '**Otra cosa**'), MENSAJES_MD)).toThrow(/B-SEGUIR/);
    expect(() => parsearBancoKids(BANCO_MD, MENSAJES_MD.replace('### TERMINO-PADRE', '### OTRO-ID'))).toThrow(/TERMINO-PADRE/);
    expect(() => fijo('NO-EXISTE' as never)).toThrow(/NO-EXISTE/);
    expect(() => pregunta('K99')).toThrow(/K99/);
  });

  it('ayudas del parser', () => {
    expect(textoYBotones('Hola. *(05/10)* — [A] [B, c]  *(nota)*')).toEqual({ texto: 'Hola.', botones: ['A', 'B, c'] });
    expect(respuestaDe('- [No tengo] → Dale. Vale igual. (una sola vez por foto)')).toBe('Dale. Vale igual.');
    expect(respuestaDe('- [Paso] → Dale. *(Naza)* y más cosas')).toBe('Dale.');
    expect(parsearMensajesMd('### X-1 · algo\n- **Plantilla** `kids_x` · {{1}}\n\n> Hola {{1}}.\n>\n> Chau.\n>\n> [Uno] [Dos]\n')).toEqual([
      { id: 'X-1', texto: 'Hola {{1}}.\n\nChau.', botones: ['Uno', 'Dos'], plantilla: 'kids_x' },
    ]);
    const tabla = '## Capítulo 1 · Uno\n\n| ID | Pregunta | Botones | Otra puerta | Foto pegada | Marcas |\n|---|---|---|---|---|---|\n';
    expect(() => parsearBancoMd(`${tabla}| K1 (b1) | Hola | — | — |\n`)).toThrow(/K1.*columnas/);
    expect(() => parsearBancoMd(`${tabla}| K1 (b1) | Hola | [Sí] sin flecha | — | — | |\n`)).toThrow(/K1.*→/);
  });
});

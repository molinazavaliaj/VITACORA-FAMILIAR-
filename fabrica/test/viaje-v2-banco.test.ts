import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsearBancoViajeMd } from '../src/viaje-v2/banco-md.js';
import { BANCO, porId, deMomento } from '../src/viaje-v2/banco.js';
import bancoJson from '../src/viaje-v2/banco.json' with { type: 'json' };

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MD = readFileSync(path.join(RAIZ, 'docs', 'viajes-v2', 'banco.md'), 'utf8');

const ENCABEZADO = '| ID | Momento | Orden | Texto | Ya de viaje |\n|---|---|---|---|---|\n';

describe('viaje v2: banco.md → filas', () => {
  it('el json commiteado está al día con el md (si falla: npx tsx scripts/viaje-v2-json.ts)', () => {
    expect(bancoJson).toEqual(parsearBancoViajeMd(MD));
  });

  it('están todas las filas del banco, por momento', () => {
    const cuenta = (m: string) => BANCO.filter((f) => f.momento === m).length;
    expect(cuenta('arranque')).toBe(3);
    expect(cuenta('antes')).toBe(4);
    expect(cuenta('noche-comienzo')).toBe(3);
    expect(cuenta('noche-puerta')).toBe(9);
    expect(cuenta('noche-cierre')).toBe(3);
    expect(cuenta('mediodia')).toBe(12);
    expect(cuenta('acuse-noche') + cuenta('acuse-mediodia') + cuenta('acuse-antes')).toBe(12);
    expect(cuenta('caso')).toBe(8); // con PAS-A2 (Fable), PAS-V2 y REC1-U (viajes cortos)
    expect(cuenta('atraso')).toBe(4);
    expect(cuenta('propia')).toBe(2);
    expect(cuenta('despedida')).toBe(2);
    expect(cuenta('album')).toBe(3); // AL1, AL1-P (revisión de Fable), AL2
    expect(BANCO).toHaveLength(72); // + IV1, PAS-V2, REC1-U
    expect(cuenta('dia-siguiente-vuelta')).toBe(2); // VU1 e IV1
  });

  it('las de antes de salir traen su variante "ya de viaje"; el resto no', () => {
    for (const f of BANCO) {
      if (f.momento === 'antes') expect(f.yaDeViaje, f.id).toBeTruthy();
      else expect(f.yaDeViaje, f.id).toBeNull();
    }
    expect(porId('AS2').yaDeViaje).toMatch(/^Ya saliste, así que esta te agarra allá\./);
  });

  it('el mediodía sale en el orden del md (v2), no en el de los IDs', () => {
    expect(deMomento('mediodia').map((f) => f.id)).toEqual([
      'MD1', 'MD5', 'MD3', 'MD4', 'MD9', 'MD2', 'MD10', 'MD6', 'MD7', 'MD12', 'MD8', 'MD11',
    ]);
  });

  it('las puertas no llevan punto final; los cierres empiezan con ", y"', () => {
    for (const f of deMomento('noche-puerta')) expect(f.texto, f.id).not.toMatch(/\.$/);
    for (const f of deMomento('noche-cierre')) expect(f.texto, f.id).toMatch(/^, y /);
  });

  it('las tablas de notación (Marca, Momento, Parte) no se cuelan como filas', () => {
    expect(BANCO.some((f) => f.id.startsWith('{{'))).toBe(false);
    expect(BANCO.some((f) => f.id === 'arranque' || f.id === 'Arranque, acuses, casos, atrasos, preguntas propias, despedida')).toBe(false);
  });

  it('porId tira un error claro si el ID no existe', () => {
    expect(porId('UC1').momento).toBe('salida');
    expect(() => porId('NO99')).toThrow(/NO99/);
  });

  it('una fila con columnas de más, un momento desconocido o un ID repetido tiran error', () => {
    expect(() => parsearBancoViajeMd(`${ENCABEZADO}| X1 | antes | 1 | hola | | sobra |\n`)).toThrow(/X1.*columnas/);
    expect(() => parsearBancoViajeMd(`${ENCABEZADO}| X1 | cualquiera | 1 | hola | |\n`)).toThrow(/X1.*Momento/);
    expect(() => parsearBancoViajeMd(`${ENCABEZADO}| X1 | antes | 1 | hola | |\n| X1 | antes | 2 | chau | |\n`)).toThrow(/X1.*repetido/);
  });

  it('corta en "## Reglas del flujo" y lee Orden vacío como null', () => {
    const filas = parsearBancoViajeMd(`${ENCABEZADO}| UC1 | salida | | hola | |\n\n## Reglas del flujo\n${ENCABEZADO}| X9 | antes | 1 | no | |\n`);
    expect(filas).toEqual([{ id: 'UC1', momento: 'salida', orden: null, texto: 'hola', yaDeViaje: null }]);
  });
});

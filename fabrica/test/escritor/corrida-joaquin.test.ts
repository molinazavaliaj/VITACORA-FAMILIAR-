// La corrida real del v5.5 (libro de Joaquín, 06/10), otra vez, con un modelo falso que devuelve sus
// respuestas guardadas: la fábrica tiene que llegar al mismo libro.md y a los mismos archivos de control,
// paso por paso. La carpeta tiene la vida de un narrador real y no está en el repo: el test corre solo con
//   ESCRITOR_V55_CORRIDA="C:/Users/Naza/Desktop/VITACORA FAMILIAR-v3/fabrica/prueba-v3-joaquin/escritor-v5-5"
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { AlmacenMemoria } from '../../src/escritor/almacen/memoria.js';
import { Ejecutor } from '../../src/escritor/ejecutor.js';
import { ModeloFalso } from '../../src/escritor/modelo/falso.js';
import { etapaC } from '../../src/escritor/orquestador/etapa-c.js';
import { deDisco, salidasDeCorrida } from './ayuda.js';

const CORRIDA = process.env.ESCRITOR_V55_CORRIDA;

describe.skipIf(!CORRIDA)('la corrida v5.5 de Joaquín, con el modelo falso', () => {
  it('llega al mismo libro.md y a los mismos controles, arreglos y estilo', async () => {
    const dir = CORRIDA as string;
    const leer = (r: string) => readFileSync(path.join(dir, r), 'utf8').replace(/\r\n/g, '\n');
    const c = deDisco(dir, ['entradas']);
    c.escribir('salidas/registro.json', leer('salidas/registro.json'));
    c.escribir('salidas/plan.json', leer('salidas/plan.json'));
    const almacen = new AlmacenMemoria();
    const modelo = new ModeloFalso(salidasDeCorrida(dir));
    await etapaC({ c, ej: new Ejecutor({ modelo, almacen, topeUsd: 1e9 }), almacen, log: () => {}, usarLote: false });

    const de = (sub: string, re: RegExp) => readdirSync(path.join(dir, sub)).filter((f) => re.test(f)).map((f) => `${sub}/${f}`);
    const rutas = [
      ...de('pendientes', /\.json$/),
      ...de('controles', /^(afuera-cap_|c9-|repite-|piezas|repaso)/),
      ...de('arreglos', /^(problemas-|respuesta-)/),
      ...de('estilo', /^(aplicado-|antes-)/),
      ...de('salidas', /\.md$/),
      'libro.md',
    ];
    for (const r of rutas) expect(c.leer(r), r).toBe(leer(r));
  }, 120_000); // el libro entero, en memoria: ~20 s
});

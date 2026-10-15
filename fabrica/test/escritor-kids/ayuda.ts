// Ayudas de los tests del escritor de Kids: el material de un fijo, el modelo falso y un contexto en memoria.
import { AlmacenMemoria } from '../../src/escritor/almacen/memoria.js';
import { Ejecutor } from '../../src/escritor/ejecutor.js';
import { LoteFalso, ModeloFalso } from '../../src/escritor/modelo/falso.js';
import { extrasFalsosDe } from '../../src/escritor-kids/cli.js';
import { salidasFalsasKids } from '../../src/escritor-kids/falso.js';
import { carpetaDeFilas, materialDe } from '../../src/escritor-kids/material/carpeta.js';
import { dirDeFijo, filasDeFijo } from '../../src/escritor-kids/material/de-fijo.js';
import type { ContextoKids } from '../../src/escritor-kids/orquestador.js';

export function armarKids(fijo = 'chico-inventado', o: { salidas?: Record<string, string>; almacen?: AlmacenMemoria; lote?: boolean; topeUsd?: number } = {}) {
  const c = carpetaDeFilas(filasDeFijo(fijo));
  const m = materialDe(c);
  const modelo = new ModeloFalso({ ...salidasFalsasKids(m, extrasFalsosDe(dirDeFijo(fijo))), ...(o.salidas ?? {}) });
  const almacen = o.almacen ?? new AlmacenMemoria();
  const avisos: string[] = [];
  const lineas: string[] = [];
  const lote = o.lote ? new LoteFalso(modelo) : undefined;
  const ej = new Ejecutor({ modelo, lote, almacen, ...(o.topeUsd ? { topeUsd: o.topeUsd } : {}) });
  const x: ContextoKids = { c, ej, almacen, log: (s) => lineas.push(s), usarLote: !!o.lote, avisar: async (a, t) => { avisos.push(`${a}\n${t}`); } };
  return { x, c, m, modelo, almacen, avisos, lineas, lote };
}

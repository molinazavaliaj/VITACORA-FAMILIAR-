// Corre el escritor v5.5 de la fábrica contra una carpeta del disco (con entradas/ y, para la etapa C,
// salidas/registro.json y plan.json). Sin --si NO llama a la API: muestra la estimación y sale.
//
//   npx tsx scripts/escritor-correr.ts --carpeta <dir> [--etapa A|B|C] [--solo-capitulo N] [--tope USD] [--sin-lote] [--correcciones <archivo>] [--si]
//
// Deja todo en <dir>/fabrica-escritor/: pasos/ (cada respuesta, para retomar sin pagar), lotes/,
// carpeta-<etapa>.json, carpeta/ (la carpeta final), libro.md, informe.md y costos.json.
// La clave sale de ANTHROPIC_API_KEY (nunca se imprime).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { AlmacenDisco } from '../src/escritor/almacen/disco.js';
import { cargarCarpeta, guardarCarpeta, leerArgs } from '../src/escritor/cli.js';
import { Ejecutor, OPCIONES_CLIENTE } from '../src/escritor/ejecutor.js';
import { estimarUsd } from '../src/escritor/estimar.js';
import { ModeloAnthropic, type ClienteMensajes } from '../src/escritor/modelo/anthropic.js';
import { LoteAnthropic, type ClienteLotes } from '../src/escritor/modelo/lote-anthropic.js';
import type { Contexto } from '../src/escritor/orquestador/contexto.js';
import { etapaA } from '../src/escritor/orquestador/etapa-a.js';
import { etapaB } from '../src/escritor/orquestador/etapa-b.js';
import { etapaC } from '../src/escritor/orquestador/etapa-c.js';

async function main(): Promise<void> {
  const a = leerArgs(process.argv.slice(2));
  const c = cargarCarpeta(a.carpeta);
  const destino = path.join(a.carpeta, 'fabrica-escritor');
  if (a.soloCapitulo !== undefined) {
    const e = estimarUsd(c, { soloCapitulo: a.soloCapitulo });
    console.log(`Estimación (cota alta, sin caché ni Batch) del capítulo ${a.soloCapitulo}:`);
    for (const f of e.filas) console.log(`  ${f.paso.padEnd(16)} entrada ~${f.entradaTokens} tok, salida ~${f.salidaTokens} tok  USD ${f.usd.toFixed(4)}`);
    console.log(`  TOTAL estimado: USD ${e.total.toFixed(2)} (tope: USD ${a.topeUsd})`);
  }
  if (!a.si) {
    console.log('No se llamó a la API. Para correr de verdad, agregar --si.');
    return;
  }
  const cliente = new Anthropic(OPCIONES_CLIENTE);
  const almacen = new AlmacenDisco(destino);
  const ej = new Ejecutor({
    modelo: new ModeloAnthropic(cliente as unknown as ClienteMensajes),
    lote: a.lote ? new LoteAnthropic(cliente as unknown as ClienteLotes, almacen) : undefined,
    almacen,
    topeUsd: a.topeUsd,
    log: (s) => console.log(s),
  });
  const x: Contexto = { c, ej, almacen, log: (s) => console.log(s), usarLote: a.lote };
  try {
    if (a.etapa === 'A') console.log(JSON.stringify(await etapaA(x), null, 1));
    else if (a.etapa === 'B') {
      const correcciones = readFileSync(a.correcciones as string, 'utf8').split('\n').map((t) => ({ texto: t })).filter((k) => k.texto.trim());
      console.log(JSON.stringify(await etapaB(x, correcciones), null, 1));
    } else {
      const r = await etapaC(x, { soloCapitulo: a.soloCapitulo });
      console.log(`libro: ${destino}/libro.md · ${r.controlesFinal} · arreglados: ${r.arreglados.join(', ') || 'ninguno'}`);
    }
  } finally {
    guardarCarpeta(c, path.join(destino, 'carpeta'));
    await ej.guardarCostos();
    const nuevas = ej.filas.filter((f) => !f.de_memoria);
    const leidas = ej.filas.reduce((s, f) => s + f.cache_read, 0);
    console.log(`Gasto real: USD ${ej.gastado.toFixed(4)} · ${nuevas.length} llamadas nuevas (${nuevas.filter((f) => f.lote).length} por lote) · caché leída: ${leidas} tokens · detalle en ${destino}/costos.json`);
  }
}

main().catch((err) => {
  console.error(`ERROR: ${(err as Error).message}`);
  process.exit(1);
});

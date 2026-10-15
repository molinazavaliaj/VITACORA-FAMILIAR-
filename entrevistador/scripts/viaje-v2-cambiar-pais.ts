// Cambio de país durante el viaje (paso 7 de plan-conexion-bot.md; el panel todavía no existe): los socios corrigen
// la zona del viaje y el planificador reubica lo que falta (`reubicar`). Qué pregunta va cada día no cambia; solo
// la hora. Lo que ya salió no se toca.
//
//   npm run viaje-v2-cambiar-pais -- <narradorId> --zona Europe/Rome            # muestra antes y después
//   npm run viaje-v2-cambiar-pais -- <narradorId> --zona Europe/Rome --aplicar  # guarda en la base REAL

import { pathToFileURL } from 'node:url';
import { conReintento } from '../src/viaje-v2/filas.js';
import { zonaValida } from '../src/viaje-v2/nucleo/horas.js';
import { reubicar } from '../src/viaje-v2/nucleo/planificador.js';
import type { Compra } from '../src/viaje-v2/nucleo/tipos.js';
import type { EstadoBotViaje } from '../src/viaje-v2/tipos.js';
import { baseReal, filaDe, opcion, pendientesLegibles } from './viaje-v2-comun.js';

async function main(args: string[]): Promise<void> {
  const narradorId = args[0];
  const zona = opcion(args, '--zona');
  if (!narradorId || narradorId.startsWith('--') || !zona) {
    console.log('Uso: npm run viaje-v2-cambiar-pais -- <narradorId> --zona <Zona/IANA> [--aplicar]');
    return;
  }
  if (!zonaValida(zona)) throw new Error(`Zona desconocida: ${zona} (tiene que ser IANA, por ejemplo Europe/Rome).`);
  const { db, host } = await baseReal();
  const fila = await filaDe(db, narradorId);
  const plan = fila.estado.plan;
  if (!plan) throw new Error(`${fila.compra.nombre} todavía no dijo SÍ: corregí la compra con el alta, no hace falta reubicar.`);
  const ahora = new Date();
  const compraNueva: Compra = { ...fila.compra, zonaViaje: zona };
  const nuevo = reubicar(plan, compraNueva, ahora);
  console.log(`${fila.compra.nombre}: ${fila.compra.zonaViaje} → ${zona}.\nAntes:\n${pendientesLegibles(plan).join('\n')}\nDespués:\n${pendientesLegibles(nuevo).join('\n')}`);
  if (!args.includes('--aplicar')) {
    console.log(`(No se escribió nada. Con --aplicar se guarda en ${host}.)`);
    return;
  }
  const r = await conReintento<Compra, EstadoBotViaje, true>(db, narradorId, (f) => {
    if (!f.estado.plan) return null;
    const c: Compra = { ...f.compra, zonaViaje: zona };
    return { cambio: { compra: c, estado: { ...f.estado, plan: reubicar(f.estado.plan, c, ahora) } }, resultado: true };
  });
  console.log(r ? 'Guardado: desde el próximo minuto el reloj usa la zona nueva.' : 'No se guardó (la fila cambió o no está).');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((err) => {
    console.error(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}

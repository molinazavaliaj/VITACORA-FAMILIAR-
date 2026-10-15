// Los socios cierran un álbum que quedó con cero fotos (paso 7 de plan-conexion-bot.md): sale la despedida (DES) y
// el viaje termina. Si no hacen nada, el reloj lo cierra solo a los 7 días del aviso (Naza, 10/10).
//
//   npm run viaje-v2-cerrar-album -- <narradorId>            # muestra en qué está el álbum (no escribe)
//   npm run viaje-v2-cerrar-album -- <narradorId> --aplicar  # cierra y MANDA la despedida por WhatsApp

import { pathToFileURL } from 'node:url';
import { conReintento } from '../src/viaje-v2/filas.js';
import { anotarNotas, mandarAvisos, sumarPaso } from '../src/viaje-v2/motor.js';
import { cerrarAlbum, type Paso } from '../src/viaje-v2/nucleo/planificador.js';
import type { Compra } from '../src/viaje-v2/nucleo/tipos.js';
import type { EstadoBotViaje } from '../src/viaje-v2/tipos.js';
import { baseReal, filaDe } from './viaje-v2-comun.js';

async function main(args: string[]): Promise<void> {
  const narradorId = args[0];
  if (!narradorId || narradorId.startsWith('--')) {
    console.log('Uso: npm run viaje-v2-cerrar-album -- <narradorId> [--aplicar]');
    return;
  }
  const { db, host } = await baseReal();
  const fila = await filaDe(db, narradorId);
  const album = fila.estado.plan?.album;
  if (!album) throw new Error(`El álbum de ${fila.compra.nombre} todavía no se abrió.`);
  console.log(`Álbum de ${fila.compra.nombre}: fase '${album.fase}', ${album.fotos} fotos.`);
  if (album.fase !== 'esperando-naza') {
    console.log('Solo se cierra a mano un álbum que espera a los socios con cero fotos. No se hace nada.');
    return;
  }
  if (!args.includes('--aplicar')) {
    console.log(`(No se escribió nada. Con --aplicar se cierra en ${host} y sale la despedida.)`);
    return;
  }
  const { depsViajeReales } = await import('../src/viaje-v2/deps-reales.js');
  const { drenar } = await import('../src/viaje-v2/enviar.js');
  const deps = depsViajeReales();
  const ahora = new Date();
  const r = await conReintento<Compra, EstadoBotViaje, Paso>(db, narradorId, (f) => {
    if (!f.estado.plan?.album || f.estado.plan.album.fase !== 'esperando-naza') return null;
    const p = cerrarAlbum(f.compra, f.estado.plan, ahora);
    return { cambio: { estado: sumarPaso(f.estado, p) }, resultado: p };
  });
  if (!r) {
    console.log('El álbum cambió mientras tanto (¿llegaron fotos?): no se hizo nada.');
    return;
  }
  anotarNotas(narradorId, r.resultado.notas);
  await mandarAvisos(deps, narradorId, r.resultado.avisos);
  console.log(`Cerrado. Envío: ${await drenar(deps, narradorId)}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((err) => {
    console.error(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}

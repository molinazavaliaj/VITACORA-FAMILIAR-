// Alta de un viajero en la Viaje V2 (paso 8 de plan-conexion-bot.md): crea su fila en `viajes_v2` con la compra.
// Hasta que exista /comprar/viaje V2, la compra se completa a mano en un JSON (la `Compra` de nucleo/tipos.ts).
// Con la fila, el reloj le manda la bienvenida (BIEN-1 o BIEN-1R) por plantilla, o se la contesta como texto si
// la persona escribe primero. El narrador tiene que existir y estar en 'invitado' (la compra de siempre lo crea).
//
//   npm run viaje-v2-alta -- <narradorId> --compra compra.json            # muestra qué haría (no escribe)
//   npm run viaje-v2-alta -- <narradorId> --compra compra.json --aplicar  # crea la fila en la base REAL
//
// compra.json, por ejemplo (viaje INVENTADO):
//   { "nombre": "Lucía", "salida": "2026-11-10", "vuelta": "2026-11-20",
//     "zonaCasa": "America/Argentina/Buenos_Aires", "zonaViaje": "Europe/Madrid", "horaNoche": "21:30",
//     "preguntasPropias": [], "formato": "pdf", "fotosAlbum": 20, "idioma": "es-AR",
//     "regalo": { "quienRegala": "Tomás" } }      ← solo si es un regalo

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { crearFila } from '../src/viaje-v2/filas.js';
import { arranque } from '../src/viaje-v2/nucleo/mensajes.js';
import { armarCalendario, CADENA_ANTES, validarCompra } from '../src/viaje-v2/nucleo/calendario.js';
import { aLocal } from '../src/viaje-v2/nucleo/horas.js';
import { idiomaDe } from '../src/viaje-v2/nucleo/idioma.js';
import type { Compra } from '../src/viaje-v2/nucleo/tipos.js';
import { estadoInicial } from '../src/viaje-v2/tipos.js';
import { baseReal, opcion } from './viaje-v2-comun.js';

const USO = 'Uso: npm run viaje-v2-alta -- <narradorId> --compra compra.json [--aplicar]';

export function leerCompra(ruta: string): Compra {
  const c = JSON.parse(readFileSync(ruta, 'utf8')) as Compra;
  c.preguntasPropias ??= [];
  validarCompra(c);
  idiomaDe(c); // un idioma desconocido frena acá
  return c;
}

async function main(args: string[]): Promise<void> {
  const narradorId = args[0];
  const ruta = opcion(args, '--compra');
  if (!narradorId || narradorId.startsWith('--') || !ruta) {
    console.log(USO);
    return;
  }
  const compra = leerCompra(ruta);
  const idioma = idiomaDe(compra);
  const cal = armarCalendario(compra, [...CADENA_ANTES]);
  console.log(`Viaje de ${compra.nombre} (${idioma}): sale ${compra.salida}, vuelve ${compra.vuelta}, ${compra.zonaCasa} → ${compra.zonaViaje}, ${compra.formato}, álbum de ${compra.fotosAlbum}${compra.regalo ? `, regalo de ${compra.regalo.quienRegala}` : ''}.`);
  console.log(`Calendario (con todas las de antes de salir sin contestar): ${cal.programados.length} mensajes, del ${aLocal(cal.programados[0].instante, compra.zonaCasa).fecha} al ${aLocal(cal.programados[cal.programados.length - 1].instante, compra.zonaCasa).fecha}.`);
  for (const a of cal.avisosNaza) console.log(`  OJO: ${a}`);
  console.log(`La bienvenida que le va a llegar:\n  ${arranque(compra).texto}`);

  const { db, host } = await baseReal();
  const { data: n, error } = await db.from('narradores').select('id,estado,como_le_dicen,contexto').eq('id', narradorId).maybeSingle();
  if (error || !n) throw new Error(`No encontré al narrador ${narradorId}: ${error?.message ?? 'no existe'}`);
  if ((n as { estado: string }).estado !== 'invitado') throw new Error(`${narradorId} está en '${(n as { estado: string }).estado}': el alta V2 es para un viajero nuevo ('invitado').`);
  if (!args.includes('--aplicar')) {
    console.log(`\n(No se escribió nada. Con --aplicar se crea la fila en ${host}.)`);
    return;
  }
  const r = await crearFila(db, { narrador_id: narradorId, idioma, compra, estado: estadoInicial() });
  console.log(r === 'creada' ? `Listo: ${narradorId} es viajero V2 en ${host}. El reloj le manda la bienvenida en el próximo minuto (si la plantilla está aprobada).` : `${narradorId} ya tenía fila en viajes_v2: no se tocó.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((err) => {
    console.error(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}

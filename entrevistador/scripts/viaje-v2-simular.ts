// Simulación de punta a punta de la Viaje V2 en el bot (paso 10 de plan-conexion-bot.md). Corre el código de verdad
// (entrante, reloj, envío, la fila en la base) con WhatsApp falso y "audios" que son texto: no gasta transcripción
// ni manda nada. Viajera INVENTADA ("Prueba Viaje"); nunca la vida de un narrador real.
//
//   npm run viaje-v2-simular -- --real [--idioma es-AR|es-ES|ca|todos] [--dejar]
//
// Sin --real no toca ninguna base: muestra el uso y sale. Con --real va contra la BASE REAL: crea una familia y un
// narrador "Prueba Viaje" por idioma (contexto.simulacion: el reloj de producción los saltea) y los borra al
// terminar (salvo --dejar). La charla queda en audios-crudos/viaje-v2-simulacion/<idioma>.md (fuera de git).

import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DepsViaje } from '../src/viaje-v2/deps.js';
import { procesarEntranteViajeV2 } from '../src/viaje-v2/entrante.js';
import { crearFila, leerFila } from '../src/viaje-v2/filas.js';
import { contestado } from '../src/viaje-v2/nucleo/estado.js';
import { aLocal, sumarDias } from '../src/viaje-v2/nucleo/horas.js';
import { IDIOMAS, esIdioma, type Idioma } from '../src/viaje-v2/nucleo/idioma.js';
import { proximaAccion, ultimaPregunta } from '../src/viaje-v2/nucleo/planificador.js';
import type { Compra } from '../src/viaje-v2/nucleo/tipos.js';
import { trabajarViajero } from '../src/viaje-v2/reloj.js';
import { estadoInicial, type EstadoBotViaje } from '../src/viaje-v2/tipos.js';
import type { MensajeEntrante } from '../src/whatsapp/webhook.js';

const MIN = 60_000;

/** Lo que "dice" la viajera inventada, por idioma. */
const DICE: Readonly<Record<Idioma, { si: string; relato: (clave: string) => string; paso: string; listo: string }>> = {
  'es-AR': { si: 'Sí', relato: (c) => `Te cuento lo de ${c}: fue un rato lindo, con mucha gente y una comida rica.`, paso: 'paso', listo: 'listo' },
  'es-ES': { si: 'Sí', relato: (c) => `Te cuento lo de ${c}: fue un rato muy bonito, con mucha gente y una comida buenísima.`, paso: 'paso', listo: 'ya está' },
  ca: { si: 'Sí', relato: (c) => `T'explico el de ${c}: va ser una estona molt bonica, amb molta gent i un menjar boníssim.`, paso: 'passo', listo: 'ja està' },
};

export type Linea = { en: Date; de: 'bot' | 'viajera'; texto: string };

export type ResultadoViaje = {
  idioma: Idioma; terminado: boolean; completado: boolean; pasos: number;
  mensajesBot: number; plantillas: number; reacciones: number; audios: number; fotos: number;
  respuestasConClave: number; respuestasSinClave: number; vencidos: string[]; charla: Linea[];
};

/** Una compra inventada que sale `dias` días después de `desde` (hora de casa) y dura una semana. */
export function compraDePrueba(idioma: Idioma, desde: Date, dias = 4): Compra {
  const zonaCasa = idioma === 'es-AR' ? 'America/Argentina/Buenos_Aires' : 'Europe/Madrid';
  const zonaViaje = idioma === 'es-AR' ? 'Europe/Madrid' : 'America/Mexico_City';
  const salida = sumarDias(aLocal(desde, zonaCasa).fecha, dias);
  return {
    nombre: 'Prueba Viaje', salida, vuelta: sumarDias(salida, 6), zonaCasa, zonaViaje, horaNoche: '21:30',
    preguntasPropias: [], formato: 'impreso', fotosAlbum: 20, ...(idioma === 'es-AR' ? {} : { idioma }),
  };
}

/**
 * Maneja un viaje entero como lo haría producción: el reloj salta a la próxima acción del planificador y llama a
 * trabajarViajero (como el tick); la viajera contesta cada pregunta a los 20 minutos con un audio (a veces "paso",
 * una vez un audio vacío, una foto al mediodía), manda 3 fotos al álbum y dice "listo". `pasar` mueve el reloj.
 */
export async function simularViaje(
  deps: DepsViaje, db: SupabaseClient, narrador: { id: string; telefono_whatsapp: string },
  o: { idioma: Idioma; pasar: (ms: number) => void; charla: Linea[]; maxPasos?: number },
): Promise<Omit<ResultadoViaje, 'charla' | 'mensajesBot' | 'plantillas' | 'reacciones'>> {
  const dice = DICE[o.idioma];
  let k = 0;
  let audios = 0;
  let fotos = 0;
  const leerN = async () => {
    const { data } = await db.from('narradores').select('*').eq('id', narrador.id).single();
    return data as { id: string; estado: string; telefono_whatsapp: string };
  };
  const entra = async (m: Omit<MensajeEntrante, 'telefono' | 'waMessageId'>) => {
    const waMessageId = `wamid.sim.${narrador.id.slice(0, 8)}.${++k}`;
    o.charla.push({ en: deps.ahora(), de: 'viajera', texto: m.tipo === 'imagen' ? '[foto]' : m.tipo === 'audio' ? `🎤 ${m.mediaId}` : m.texto ?? '' });
    await procesarEntranteViajeV2(deps, await leerN(), { telefono: narrador.telefono_whatsapp, waMessageId, ...m });
  };
  const leer = async () => (await leerFila<Compra, EstadoBotViaje>(db, narrador.id))!;

  await trabajarViajero(deps, await leer(), await leerN()); // la bienvenida
  o.pasar(30 * MIN);
  await entra({ tipo: 'texto', texto: dice.si });
  const contestadas = new Set<string>();
  let fotosAlAlbum = false;
  let pasos = 0;
  for (; pasos < (o.maxPasos ?? 2000); pasos++) {
    const fila = await leer();
    const plan = fila.estado.plan!;
    if (plan.terminado && fila.estado.salida.length === 0) break;
    // Contesta la última pregunta (a los 20 minutos), si todavía no la contestó.
    const u = ultimaPregunta(plan);
    if (!plan.album && u && !contestado(u) && !plan.grupo && !contestadas.has(`${u.clave}|${u.en}`)) {
      contestadas.add(`${u.clave}|${u.en}`);
      o.pasar(20 * MIN);
      const n = contestadas.size;
      if (n === 5) await entra({ tipo: 'texto', texto: dice.paso });
      else if (n === 7) await entra({ tipo: 'audio', mediaId: 'VACIO' });
      else if (u.tipo === 'MD' && n % 2 === 0) {
        fotos++;
        await entra({ tipo: 'imagen', mediaId: `foto-${n}`, mimeType: 'image/jpeg', sha256: `sha-${n}` });
      } else {
        audios++;
        await entra({ tipo: 'audio', mediaId: dice.relato(u.clave) });
      }
      continue;
    }
    // El álbum: tres fotos y "listo".
    if (plan.album && plan.album.fase === 'juntando' && !fotosAlAlbum) {
      fotosAlAlbum = true;
      o.pasar(30 * MIN);
      for (let i = 0; i < 3; i++) {
        fotos++;
        await entra({ tipo: 'imagen', mediaId: `album-${i}`, mimeType: 'image/jpeg', sha256: `sha-album-${i}` });
      }
      o.pasar(MIN);
      await entra({ tipo: 'texto', texto: dice.listo });
      continue;
    }
    // Nada que contestar: el reloj salta a lo próximo (como mínimo un minuto, como el tick).
    const prox = proximaAccion(fila.compra, plan);
    const t = Math.max(deps.ahora().getTime() + MIN, prox ? Date.parse(prox) : deps.ahora().getTime() + 60 * MIN);
    o.pasar(t - deps.ahora().getTime());
    await trabajarViajero(deps, await leer(), await leerN());
  }
  const fila = await leer();
  const { data: rs } = await db.from('respuestas').select('clave_viaje').eq('narrador_id', narrador.id);
  const filas = (rs as { clave_viaje: string | null }[] | null) ?? [];
  return {
    idioma: o.idioma, terminado: fila.estado.plan!.terminado, completado: (await leerN()).estado === 'completado', pasos, audios, fotos,
    respuestasConClave: filas.filter((r) => r.clave_viaje).length, respuestasSinClave: filas.filter((r) => !r.clave_viaje).length,
    vencidos: fila.estado.plan!.calendario.filter((g) => g.estado === 'vencido').map((g) => g.clave),
  };
}

/** Un WhatsApp falso que anota en la charla lo que mandaría el bot. */
export function whatsappDeMentira(charla: Linea[], ahora: () => Date) {
  const cuenta = { mensajes: 0, plantillas: 0, reacciones: 0 };
  let n = 0;
  const wa: DepsViaje['wa'] = {
    texto: async (_t, texto) => { cuenta.mensajes++; charla.push({ en: ahora(), de: 'bot', texto }); return `sim.out.${++n}`; },
    plantilla: async (_t, nombre, _i, variables) => { cuenta.plantillas++; charla.push({ en: ahora(), de: 'bot', texto: `[plantilla ${nombre}] ${variables.join(' | ')}` }); return `sim.out.${++n}`; },
    reaccion: async (_t, id, emoji) => { cuenta.reacciones++; charla.push({ en: ahora(), de: 'bot', texto: `${emoji} (sobre ${id})` }); return `sim.out.${++n}`; },
    descargar: async (mediaId) => Buffer.from(mediaId, 'utf8'),
  };
  return { wa, cuenta };
}

export function charlaMd(r: ResultadoViaje, compra: Compra): string {
  const l = [`# Simulación Viaje V2 en el bot (${r.idioma})`, '', `Viaje INVENTADO: sale ${compra.salida}, vuelve ${compra.vuelta}, ${compra.zonaCasa} → ${compra.zonaViaje}.`, ''];
  for (const x of r.charla) l.push(`**${x.de === 'bot' ? 'Bot' : 'Viajera'}** · ${aLocal(x.en, compra.zonaCasa).fecha} ${aLocal(x.en, compra.zonaCasa).hora} (casa)`, '', `> ${x.texto.replace(/\n/g, '\n> ')}`, '');
  return l.join('\n');
}

// ---------------------------------------------------------------- contra la base real

async function limpiar(db: SupabaseClient, narradorId: string, familiaId: string): Promise<void> {
  for (const carpeta of [narradorId, `${narradorId}/fotos`, `${narradorId}/paquete`]) {
    const { data } = await db.storage.from('audios').list(carpeta, { limit: 1000 });
    const rutas = ((data as { name: string }[] | null) ?? []).filter((a) => a.name.includes('.')).map((a) => `${carpeta}/${a.name}`);
    if (rutas.length > 0) {
      const { error } = await db.storage.from('audios').remove(rutas);
      if (error) console.error(`limpiar: no pude borrar archivos de ${carpeta}: ${error.message}`);
    }
  }
  const borrar = async (tabla: string, columna: string, valor: string) => {
    const { error } = await db.from(tabla).delete().eq(columna, valor);
    if (error) console.error(`limpiar: no pude borrar de ${tabla}: ${error.message}`);
  };
  for (const tabla of ['respuestas', 'envios', 'fotos', 'viajes_v2']) await borrar(tabla, 'narrador_id', narradorId);
  await borrar('narradores', 'id', narradorId);
  await borrar('familias', 'id', familiaId);
}

const USO = [
  'Uso: npm run viaje-v2-simular -- --real [--idioma es-AR|es-ES|ca|todos] [--dejar]',
  '  --real   obligatorio: escribe en la base REAL (crea y borra un narrador "Prueba Viaje"). No manda WhatsApp ni gasta.',
  '  --dejar  NO borra lo creado (el reloj de producción lo saltea), pero hay que borrarlo a mano.',
].join('\n');

async function main(args: string[]): Promise<void> {
  if (!args.includes('--real')) {
    console.log(USO);
    return;
  }
  const { baseReal } = await import('./viaje-v2-comun.js');
  const { db, host } = await baseReal();
  console.log(`>>> BASE REAL: ${host} — se crean y borran una familia y un narrador "Prueba Viaje". No sale ningún WhatsApp.`);
  const pedido = args.includes('--idioma') ? args[args.indexOf('--idioma') + 1] : 'todos';
  if (pedido !== 'todos' && !esIdioma(pedido)) throw new Error(`--idioma desconocido: ${pedido}`);
  const idiomas: readonly Idioma[] = pedido === 'todos' ? IDIOMAS : [pedido as Idioma];
  // Las plantillas "salen" (a WhatsApp de mentira): así se ve cuál se usaría con la ventana cerrada.
  process.env.WA_PLANTILLAS_VIAJE_V2_LISTAS = IDIOMAS.flatMap((i) => ['mensaje', 'recordatorio', 'recordatorio_ultima', 'bienvenida', 'bienvenida_regalo'].map((c) => `${i}:${c}`)).join(',');
  const salida = fileURLToPath(new URL('../../audios-crudos/viaje-v2-simulacion/', import.meta.url));
  mkdirSync(salida, { recursive: true });

  for (const idioma of idiomas) {
    let reloj = new Date();
    const charla: Linea[] = [];
    const { wa, cuenta } = whatsappDeMentira(charla, () => reloj);
    const deps: DepsViaje = {
      db, wa,
      transcribir: async (audio) => ({ texto: audio.toString('utf8') === 'VACIO' ? '' : audio.toString('utf8'), duracionSegundos: 30 }),
      avisar: async (clave, asunto) => { charla.push({ en: reloj, de: 'bot', texto: `[aviso que saldría a los socios] ${clave}: ${asunto}` }); },
      mailSi: async () => {},
      ahora: () => reloj,
    };
    const { data: familia, error: errorFamilia } = await db.from('familias')
      .insert({ email: `prueba-viaje-v2-${Date.now()}@vitacora.invalid`, nombre: 'Prueba Viaje', region: idioma === 'es-AR' ? 'AR' : 'ES' }).select('id').single();
    if (errorFamilia) throw new Error(`No pude crear la familia de prueba: ${errorFamilia.message}`);
    const familiaId = (familia as { id: string }).id;
    const compra = compraDePrueba(idioma, reloj);
    const { data: creado, error: errorNarrador } = await db.from('narradores').insert({
      familia_id: familiaId, nombre: 'Prueba Viaje', como_le_dicen: 'Prueba Viaje', telefono_whatsapp: `+0${Date.now()}`,
      hora_preferida: '03:00', zona_horaria: compra.zonaCasa, estado: 'invitado',
      contexto: { modo: 'viaje', prueba: 'viaje-v2-simulacion', simulacion: true },
    }).select('*').single();
    if (errorNarrador) {
      await db.from('familias').delete().eq('id', familiaId);
      throw new Error(`No pude crear el narrador de prueba: ${errorNarrador.message}`);
    }
    const n = creado as { id: string; telefono_whatsapp: string };
    // Candados de la fábrica publicada: con estos archivos en `paquete/` saltea al narrador inventado.
    for (const candado of ['anticipo_enviado.txt', 'anticipo.pdf', 'estructura.json', 'terminado_enviado.txt', 'recordatorio_cierre_3.txt',
      'recordatorio_cierre_7.txt', 'recordatorio_cierre_14.txt', 'cierre_automatico_enviado.txt', 'cierre_automatico.txt']) {
      await db.storage.from('audios').upload(`${n.id}/paquete/${candado}`, Buffer.from('simulacion'), { upsert: true });
    }
    try {
      await crearFila(db, { narrador_id: n.id, idioma, compra, estado: estadoInicial() });
      const r = await simularViaje(deps, db, n, { idioma, charla, pasar: (ms) => { reloj = new Date(reloj.getTime() + ms); } });
      const res: ResultadoViaje = { ...r, mensajesBot: cuenta.mensajes, plantillas: cuenta.plantillas, reacciones: cuenta.reacciones, charla };
      const { charla: _c, ...resumen } = res;
      console.log(JSON.stringify(resumen));
      writeFileSync(`${salida}${idioma}.md`, charlaMd(res, compra), 'utf8');
    } finally {
      if (args.includes('--dejar')) console.log(`Quedó en la base: narrador ${n.id}, familia ${familiaId}.`);
      else await limpiar(db, n.id, familiaId);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((err) => {
    console.error(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}

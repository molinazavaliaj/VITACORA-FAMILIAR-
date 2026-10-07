// Simulación de punta a punta de la entrevista V3 por WhatsApp (spec
// 2026-10-07, "Pruebas" 2). Corre el código de verdad con WhatsApp falso y
// "audios" que son texto: no gasta transcripción. Narrador INVENTADO
// ("Prueba V3"); nunca la vida de un narrador real.
//
//   npm run v3-simular -- [--idioma es-AR|es-ES|ca|todos] [--cazador] [--dejar]
//
// Va contra la BASE REAL: crea una familia y un narrador "Prueba V3" por
// idioma y los borra al terminar (salvo --dejar). --cazador GASTA PLATA
// (Opus 5.5, tope USD 3) y corre solo en es-AR. La charla de cada idioma
// queda en audios-crudos/v3-simulacion/<idioma>.md (fuera de git).

import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { SupabaseClient } from '@supabase/supabase-js';
import { esperarCazas, clienteCazador } from '../src/v3/cazador.js';
import type { DepsV3 } from '../src/v3/deps.js';
import { procesarEntranteV3 } from '../src/v3/entrante.js';
import { leerFila } from '../src/v3/estado.js';
import { preguntaPorId } from '../src/v3/nucleo/entrevista/banco.js';
import { botonesDeClave } from '../src/v3/nucleo/entrevista/flujo.js';
import { IDIOMAS, esIdioma, type Idioma } from '../src/v3/nucleo/entrevista/idioma.js';
import { leerBoton } from '../src/v3/nucleo/entrevista/respuesta.js';
import { VIDAS_EJEMPLO } from '../src/v3/nucleo/entrevista/vidas-ejemplo.js';
import { arrancarV3 } from '../src/v3/pasar.js';
import { trabajarNarrador } from '../src/v3/reloj.js';
import type { FilaV3, NarradorV3 } from '../src/v3/tipos.js';
import { cargarEntorno } from './cargar-entorno.js';

/** Lo que "dice" el narrador simulado cuando la vida inventada no trae nada para esa pregunta. */
export const GENERICA: Readonly<Record<Idioma, string>> = {
  'es-AR': 'Sí, fue una historia larga que te cuento con todos los detalles que me acuerdo.',
  'es-ES': 'Sí, fue una historia larga que te cuento con todos los detalles que recuerdo.',
  ca: 'Sí, va ser una història llarga que t’explico amb tots els detalls que recordo.',
};

export type RespuestaSimulada = { boton: string } | { audio: string };

export function respuestaSimulada(id: string, idioma: Idioma, tocoSi: boolean): RespuestaSimulada {
  if (tocoSi) return { audio: GENERICA[idioma] };
  const botones = botonesDeClave(id, idioma) ?? [];
  const deLaVida = idioma === 'es-AR' ? VIDAS_EJEMPLO[0].respuestas[id] : undefined;
  if (deLaVida !== undefined) {
    const { boton, resto } = leerBoton(deLaVida);
    if (boton !== undefined && !resto && botones.some((b) => b.texto === boton)) return { boton };
    return { audio: deLaVida };
  }
  const no = botones.find((b) => b.vale === 'no');
  if (preguntaPorId(id, idioma)?.clase === 'foto' && no) return { boton: no.texto };
  return { audio: GENERICA[idioma] };
}

export type ResultadoSimulacion = {
  idioma: Idioma; terminada: boolean; completado: boolean; pasos: number;
  mensajes: number; botones: number; audios: number; repreguntas: number; gastoCazadorUsd: number;
};

async function leerNarrador(db: SupabaseClient, id: string): Promise<NarradorV3> {
  const { data, error } = await db.from('narradores').select('*').eq('id', id).maybeSingle();
  if (error || !data) throw new Error(`simulación: no pude leer el narrador ${id}: ${error?.message ?? 'no existe'}`);
  return data as NarradorV3;
}

export async function simularEntrevista(deps: DepsV3, n: NarradorV3, o: { idioma: Idioma; pasar: (ms: number) => void; maxPasos?: number }): Promise<ResultadoSimulacion> {
  await arrancarV3(deps, n, o.idioma, { nombre: 'Prueba V3', genero: 'varon' }, { ventanaAbierta: true });
  let k = 0;
  let botones = 0;
  let audios = 0;
  let pasos = 0;
  for (; pasos < (o.maxPasos ?? 600); pasos++) {
    const fila = await leerFila(deps.db, n.id);
    if (!fila) throw new Error('simulación: no hay fila V3');
    if (fila.estado.terminada && fila.estado.salientes.length === 0) break;
    const id = fila.estado.esperando;
    if (id) {
      const r = respuestaSimulada(id, o.idioma, fila.estado.tocoSi === true);
      const waMessageId = `sim-${n.id}-${++k}`;
      const narrador = await leerNarrador(deps.db, n.id);
      if ('boton' in r) {
        botones++;
        await procesarEntranteV3(deps, narrador, { telefono: n.telefono_whatsapp, tipo: 'texto', texto: r.boton, esBoton: true, waMessageId });
      } else {
        audios++;
        await procesarEntranteV3(deps, narrador, { telefono: n.telefono_whatsapp, tipo: 'audio', mediaId: r.audio, waMessageId });
      }
    }
    o.pasar(4 * 60_000);
    await esperarCazas();
    await trabajarNarrador(deps, (await leerFila(deps.db, n.id))!, await leerNarrador(deps.db, n.id));
    await esperarCazas();
  }
  const final = (await leerFila(deps.db, n.id))!;
  return {
    idioma: o.idioma,
    terminada: final.estado.terminada,
    completado: (await leerNarrador(deps.db, n.id)).estado === 'completado',
    pasos,
    mensajes: final.estado.charla.filter((g) => g.de === 'bio').length,
    botones,
    audios,
    repreguntas: final.estado.repreguntas?.length ?? 0,
    gastoCazadorUsd: final.estado.cazador?.gastoUsd ?? 0,
  };
}

/** La charla para leerla: mensajes del biógrafo con sus IDs y lo que contestó. */
export function charlaMd(fila: FilaV3): string {
  const l = [`# Simulación V3 por WhatsApp: ${fila.ficha.nombre} (${fila.idioma})`, ''];
  for (const g of fila.estado.charla) {
    if (g.de === 'bloque') l.push(`## Bloque ${g.bloque} · ${g.nombre}`, '');
    else if (g.de === 'persona') l.push(`**Narrador** \`[${g.pregunta}]\`: ${g.texto}`, '');
    else l.push(`**Biógrafo** \`[${[...new Set(g.partes.map((p) => p.id))].join(' + ')}]\`:`, ...g.partes.map((p) => `> ${p.texto}`), ...(g.botones ? [`> [botones: ${g.botones.map((b) => `(${b})`).join(' ')}]`] : []), '');
  }
  return l.join('\n');
}

// ---------------------------------------------------------------- contra la base real

async function limpiar(db: SupabaseClient, narradorId: string, familiaId: string): Promise<void> {
  for (const carpeta of [narradorId, `${narradorId}/fotos`]) {
    const { data } = await db.storage.from('audios').list(carpeta);
    const rutas = ((data as { name: string }[] | null) ?? []).filter((a) => a.name.includes('.')).map((a) => `${carpeta}/${a.name}`);
    if (rutas.length > 0) await db.storage.from('audios').remove(rutas);
  }
  for (const tabla of ['respuestas', 'envios', 'fotos', 'entrevistas_v3']) await db.from(tabla).delete().eq('narrador_id', narradorId);
  await db.from('narradores').delete().eq('id', narradorId);
  await db.from('familias').delete().eq('id', familiaId);
}

async function main(args: string[]): Promise<void> {
  cargarEntorno();
  const { db } = await import('../src/db/cliente.js');
  const { cargarConfig } = await import('../src/config.js');
  const pedido = args.includes('--idioma') ? args[args.indexOf('--idioma') + 1] : 'todos';
  if (pedido !== 'todos' && !esIdioma(pedido)) throw new Error(`--idioma desconocido: ${pedido}`);
  const idiomas: readonly Idioma[] = pedido === 'todos' ? IDIOMAS : [pedido as Idioma];
  const conCazador = args.includes('--cazador');
  if (conCazador) console.log('OJO: --cazador GASTA PLATA (Opus 5.5, hasta USD 3 por entrevista). Corre solo en es-AR.');
  const salida = fileURLToPath(new URL('../../audios-crudos/v3-simulacion/', import.meta.url));
  mkdirSync(salida, { recursive: true });

  for (const idioma of idiomas) {
    let reloj = new Date();
    const deps: DepsV3 = {
      db,
      wa: {
        texto: async () => `sim.${Date.now()}`,
        botones: async () => `sim.${Date.now()}`,
        plantilla: async () => `sim.${Date.now()}`,
        descargar: async (mediaId) => Buffer.from(mediaId, 'utf8'),
      },
      transcribir: async (audio) => ({ texto: audio.toString('utf8'), duracionSegundos: 30 }),
      avisar: async (clave, asunto) => { console.log(`[aviso que saldría a los socios] ${clave}: ${asunto}`); },
      hito: async () => {},
      cazador: conCazador && idioma === 'es-AR' ? clienteCazador(cargarConfig().anthropicKey) : null,
      ahora: () => reloj,
    };
    const { data: familia, error: errorFamilia } = await db.from('familias')
      .insert({ email: `prueba-v3-${Date.now()}@vitacora.invalid`, nombre: 'Prueba V3', region: 'AR' }).select('id').single();
    if (errorFamilia) throw new Error(`No pude crear la familia de prueba: ${errorFamilia.message}`);
    const familiaId = (familia as { id: string }).id;
    const { data: creado, error: errorNarrador } = await db.from('narradores').insert({
      familia_id: familiaId, nombre: 'Prueba V3', como_le_dicen: 'Prueba V3', telefono_whatsapp: `+0${Date.now()}`,
      hora_preferida: '03:00', zona_horaria: 'America/Argentina/Buenos_Aires', estado: 'acepto',
      contexto: { ritmo: 'seguido', genero: 'varon', prueba: 'v3-simulacion', ...(idioma === 'es-AR' ? {} : { idioma }) },
    }).select('*').single();
    if (errorNarrador) {
      await db.from('familias').delete().eq('id', familiaId);
      throw new Error(`No pude crear el narrador de prueba: ${errorNarrador.message}`);
    }
    const n = creado as NarradorV3;
    try {
      const r = await simularEntrevista(deps, n, { idioma, pasar: (ms) => { reloj = new Date(reloj.getTime() + ms); } });
      console.log(JSON.stringify(r));
      const fila = await leerFila(db, n.id);
      if (fila) writeFileSync(`${salida}${idioma}.md`, charlaMd(fila), 'utf8');
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

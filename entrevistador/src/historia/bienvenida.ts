// La bienvenida de «Vitácora de una historia» (plan, Task 3.4). Dos caminos, como la V3:
//
// - Para uno mismo: el tick del scheduler (atenderHistorias) le da el alta y le manda la plantilla de Meta
//   (BIEN-H, bienvenida_historia_*), si está aprobada (WA_PLANTILLAS_HISTORIA_LISTAS). Si no, no sale nada y se
//   avisa: sale apenas se marque.
// - Regalo: el narrador escribe con su código (flujo/regalo.ts, canjearRegalo). La ventana está abierta y la
//   bienvenida (BIEN-HR o BIEN-HR-A) sale como texto. La plantilla de regalo queda solo para un regalo que llegue
//   sin canje.
//
// La marca (`estado.bienvenida`) va ANTES de mandar, con compare-and-swap: el tick y el canje a la vez no la mandan
// dos veces. Si Meta la rechaza, no se reintenta sola (como la V3): queda anotada en `envios` y se avisa.

import { PLANTILLAS_HISTORIA } from '../config.js';
import { asegurarAltaHistoria } from './alta.js';
import { bienvenidaDe, textoDeBienvenida } from './arranque.js';
import type { DepsHistoria } from './deps.js';
import { drenar, plantillaListaHistoria } from './enviar.js';
import { conReintento, leerFila } from './estado.js';
import type { NarradorHistoria } from './tipos.js';
import { encolar } from './turno.js';

export type ResultadoBienvenida = 'mandada' | 'ya-estaba' | 'frenada' | 'sin-plantilla' | 'fallo';

/** Para uno mismo, desde el tick: alta y plantilla. Un regalo no (le llega con el canje). */
export async function bienvenidaPorPlantilla(deps: DepsHistoria, n: NarradorHistoria): Promise<ResultadoBienvenida> {
  if (n.estado !== 'invitado') return 'ya-estaba';
  if ((await asegurarAltaHistoria(deps, n)) === 'frenada') return 'frenada';
  const fila = await leerFila(deps.db, n.id);
  if (!fila || fila.estado.fase !== 'bienvenida' || fila.estado.bienvenida) return 'ya-estaba';
  const b = bienvenidaDe(fila);
  const p = PLANTILLAS_HISTORIA[fila.idioma][b.plantilla];
  if (!plantillaListaHistoria(fila.idioma, b.plantilla)) {
    await deps.avisar(`historia-bienvenida-${fila.idioma}-${b.plantilla}`, `No sale la bienvenida de historia en ${fila.idioma}`,
      `${n.como_le_dicen} (${n.id}) espera la bienvenida de su historia, pero la plantilla ${p.nombre} no está marcada como aprobada (WA_PLANTILLAS_HISTORIA_LISTAS="${fila.idioma}:${b.plantilla}"). Sale apenas se marque.`);
    return 'sin-plantilla';
  }
  const en = deps.ahora().toISOString();
  const marcada = await conReintento(deps.db, n.id, (f) => {
    if (f.estado.fase !== 'bienvenida' || f.estado.bienvenida) return null;
    return { cambio: { estado: { ...f.estado, bienvenida: { en, por: 'plantilla' } } }, resultado: true };
  });
  if (!marcada) return 'ya-estaba';
  try {
    const waId = await deps.wa.plantilla(n.telefono_whatsapp, p.nombre, p.idiomaMeta, b.variables);
    const { error } = await deps.db.from('envios').insert({ narrador_id: n.id, tipo: 'bienvenida', pregunta_orden: null, wa_message_id: waId });
    if (error) console.warn(`historia: la bienvenida de ${n.id} salió pero no pude anotarla en envios: ${error.message}`);
    return 'mandada';
  } catch (err) {
    const detalle = (err instanceof Error ? err.message : String(err)).slice(0, 500);
    console.error(`historia: NO SALIÓ la bienvenida de ${n.id}: ${detalle}`);
    const { error } = await deps.db.from('envios').insert({
      narrador_id: n.id, tipo: 'bienvenida', pregunta_orden: null, wa_message_id: null,
      entrega: 'fallido', entrega_at: deps.ahora().toISOString(), error_detalle: detalle,
    });
    if (error) console.warn(`historia: tampoco pude anotar el fallo de ${n.id} en envios: ${error.message}`);
    await deps.avisar(`historia-bienvenida-fallo-${n.id}`, `No salió la bienvenida de historia de ${n.como_le_dicen || n.id}`,
      `Meta rechazó la plantilla ${p.nombre} para ${n.id}: ${detalle}. El bot no la reintenta sola: hay que verlo a mano.`);
    return 'fallo';
  }
}

/**
 * Regalo: el narrador acaba de escribir con su código (la ventana está abierta). Alta y bienvenida como texto.
 * Se anota su mensaje como entrante (`ultimoEntranteAt`): sin eso, drenar la tomaría como fuera de la ventana.
 */
export async function bienvenidaAlCanjear(deps: DepsHistoria, narradorId: string): Promise<boolean> {
  const { data, error } = await deps.db.from('narradores').select('*').eq('id', narradorId).maybeSingle();
  if (error || !data) {
    console.error(`historia: no pude leer a ${narradorId} para su bienvenida: ${error?.message ?? 'no existe'}`);
    return false;
  }
  const n = data as NarradorHistoria;
  if ((await asegurarAltaHistoria(deps, n)) === 'frenada') return false;
  const ahora = deps.ahora().toISOString();
  const r = await conReintento(deps.db, n.id, (f) => {
    if (f.estado.fase !== 'bienvenida' || f.estado.bienvenida) return null;
    const conBienvenida = encolar({ ...f.estado, ultimoEntranteAt: ahora }, { texto: textoDeBienvenida(f), tipo: 'bienvenida' });
    return { cambio: { estado: { ...conBienvenida, bienvenida: { en: ahora, por: 'texto' } } }, resultado: true };
  });
  if (!r) return true; // ya la tenía
  return (await drenar(deps, n.id)) !== 'fallo';
}

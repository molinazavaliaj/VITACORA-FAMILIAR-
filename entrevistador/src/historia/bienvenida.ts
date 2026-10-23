// La bienvenida de «Vitácora de una historia» (plan, Task 3.4), y lo que el tick le hace a un invitado de historia.
//
// - Regalo: el narrador escribe con su código (flujo/regalo.ts, canjearRegalo). La ventana está abierta y la
//   bienvenida (BIEN-HR o BIEN-HR-A) sale como texto (bienvenidaAlCanjear).
// - Para uno mismo, o un regalo al que no le llegó el texto (el alta quedó frenada al canjear, o la cola no salió):
//   el tick del scheduler (atenderInvitado) le da el alta y le manda la plantilla de Meta de su caso, si está aprobada
//   (WA_PLANTILLAS_HISTORIA_LISTAS). Si no, no sale nada y se avisa: sale apenas se marque.
//
// La marca (`estado.bienvenida`) va ANTES de mandar, con compare-and-swap: el tick y el canje a la vez no la mandan
// dos veces. Si Meta rechaza la plantilla, se saca la marca y el tick siguiente reintenta (como la V3, que solo da
// por salida la que tiene id de Meta); el fallo queda en `envios` y se avisa a los socios (una vez por día).

import { PLANTILLAS_HISTORIA } from '../config.js';
import { asegurarAltaHistoria } from './alta.js';
import { bienvenidaDe, textoDeBienvenida } from './arranque.js';
import type { DepsHistoria } from './deps.js';
import { drenar, plantillaListaHistoria } from './enviar.js';
import { conReintento, leerFila } from './estado.js';
import type { FilaHistoria, NarradorHistoria } from './tipos.js';
import { encolar } from './turno.js';

/** El mismo plazo que el Familiar (DIAS_PARA_NO_ACEPTO de flujo/scheduler.ts, que no se importa: carga el cron y la base). */
export const DIAS_PARA_NO_ACEPTO = 30;

export type ResultadoInvitado = 'mandada' | 'ya-estaba' | 'frenada' | 'sin-plantilla' | 'fallo' | 'activado' | 'drenada' | 'no-acepto';

/** Lo que el tick hace con un invitado de historia: alta, arreglos de un arranque cortado y la bienvenida. */
export async function atenderInvitado(deps: DepsHistoria, n: NarradorHistoria): Promise<ResultadoInvitado> {
  if (n.estado !== 'invitado') return 'ya-estaba';
  if ((await asegurarAltaHistoria(deps, n)) === 'frenada') return 'frenada';
  const fila = await leerFila(deps.db, n.id);
  if (!fila) return 'ya-estaba';
  // Dijo SÍ pero no se pudo pasar a activo (la base falló): sin esto, el reloj (solo activos) no lo atiende nunca.
  if (fila.estado.fase !== 'bienvenida') {
    const { error } = await deps.db.from('narradores').update({ estado: 'activo', alerta_silencio: false }).eq('id', n.id).in('estado', ['invitado', 'acepto']);
    if (error) throw new Error(`historia: no pude dejar activo a ${n.id}: ${error.message}`);
    return 'activado';
  }
  // Lo que quedó en la cola antes del SÍ (la bienvenida o el «no te entendí» que no salieron): sale ahora.
  if (fila.estado.salientes.length > 0) {
    await drenar(deps, n.id);
    return 'drenada';
  }
  if (fila.estado.bienvenida) return avisarSiNoAcepto(deps, n, fila);
  return bienvenidaPorPlantilla(deps, n, fila);
}

async function bienvenidaPorPlantilla(deps: DepsHistoria, n: NarradorHistoria, fila: FilaHistoria): Promise<ResultadoInvitado> {
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
    // Se saca la marca (solo la nuestra): el tick siguiente reintenta.
    await conReintento(deps.db, n.id, (f) => {
      if (f.estado.bienvenida?.en !== en || f.estado.bienvenida.por !== 'plantilla') return null;
      return { cambio: { estado: { ...f.estado, bienvenida: undefined } }, resultado: true };
    });
    const { error } = await deps.db.from('envios').insert({
      narrador_id: n.id, tipo: 'bienvenida', pregunta_orden: null, wa_message_id: null,
      entrega: 'fallido', entrega_at: deps.ahora().toISOString(), error_detalle: detalle,
    });
    if (error) console.warn(`historia: tampoco pude anotar el fallo de ${n.id} en envios: ${error.message}`);
    await deps.avisar(`historia-bienvenida-fallo-${n.id}`, `No salió la bienvenida de historia de ${n.como_le_dicen || n.id}`,
      `Meta rechazó la plantilla ${p.nombre} para ${n.id}: ${detalle}. El bot la reintenta en cada tick; si sigue fallando, hay que verlo a mano.`);
    return 'fallo';
  }
}

/**
 * A los DIAS_PARA_NO_ACEPTO días de la bienvenida sin SÍ, se avisa una vez a los socios para devolver (términos §8),
 * como hace el scheduler con el Familiar (marcarNoAceptaron). La marca va en la fila, antes de avisar.
 */
async function avisarSiNoAcepto(deps: DepsHistoria, n: NarradorHistoria, fila: FilaHistoria): Promise<ResultadoInvitado> {
  const desde = Date.parse(fila.estado.bienvenida!.en);
  const ahora = deps.ahora();
  const dias = (ahora.getTime() - desde) / 86_400_000;
  if (fila.estado.avisoNoAcepto || Number.isNaN(desde) || dias < DIAS_PARA_NO_ACEPTO) return 'ya-estaba';
  const marcada = await conReintento(deps.db, n.id, (f) => {
    if (f.estado.fase !== 'bienvenida' || f.estado.avisoNoAcepto) return null;
    return { cambio: { estado: { ...f.estado, avisoNoAcepto: ahora.toISOString() } }, resultado: true };
  });
  if (!marcada) return 'ya-estaba';
  await deps.avisar(`no-acepto:${n.id}`, `${n.como_le_dicen ?? n.id} no aceptó su historia en ${DIAS_PARA_NO_ACEPTO} días`,
    `${n.como_le_dicen ?? n.id} (${n.id}) recibió la bienvenida de «Vitácora de una historia» hace ${Math.floor(dias)} días y no dijo SÍ. `
      + 'Corresponde devolverle el dinero a quien compró, completo y sin que lo pida (términos §8). El bot no le escribe más.');
  return 'no-acepto';
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

import cron from 'node-cron';
import { db } from '../db/cliente.js';
import { enviarPlantilla, enviarAudioPorLink } from '../whatsapp/enviar.js';
import { generarReconocimiento, generarPreguntaReemplazo } from '../ia/cerebro.js';
import { generarAudioVoz } from '../ia/voz.js';
import { armarHistoria, ultimaTranscripcion } from '../db/historia.js';

const VENTANA_MINUTOS = 15;   // el cron corre cada 15 min
const HORAS_RECORDATORIO = 6; // recién después de 6 hs sin responder
const DIAS_SILENCIO = 3;      // 3 días sin señales → avisamos a la familia

type Narrador = {
  id: string;
  familia_id: string;
  como_le_dicen: string;
  telefono_whatsapp: string;
  hora_preferida: string;
  zona_horaria: string;
  contexto: Record<string, any>;
  estado: string;
  dia_actual: number;
  ultima_respuesta_at: string | null;
  alerta_silencio: boolean;
};

// ── Helpers de tiempo (puros, testeables) ──────────────────────────────

/** 'YYYY-MM-DD' en la zona del narrador. */
export function fechaLocal(fecha: Date, zona: string): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: zona }).format(fecha);
}

/** Minutos transcurridos del día en la zona del narrador. */
export function minutosLocales(fecha: Date, zona: string): number {
  const hhmm = new Intl.DateTimeFormat('es', {
    timeZone: zona, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(fecha);
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** ¿Estamos en la ventana de 15 min que arranca en su hora preferida? */
export function esHoraDeEnviar(horaPreferida: string, zona: string, ahora: Date): boolean {
  const [h, m] = horaPreferida.split(':').map(Number);
  const preferida = h * 60 + m;
  const actual = minutosLocales(ahora, zona);
  return actual >= preferida && actual < preferida + VENTANA_MINUTOS;
}

/** Capítulos que no aplican a esta vida, según el árbol que cargó la familia. */
export function capituloNoAplica(contexto: Record<string, any>, capitulo: string): boolean {
  const arbol = contexto?.arbol ?? {};
  if (capitulo === 'Los hijos' && arbol.hijos === 'no tuvo') return true;
  if (capitulo === 'El amor' && arbol.conyuge === 'no tuvo') return true;
  return false;
}

// ── Consultas cortas a la base ─────────────────────────────────────────

async function narradoresEn(estados: string[]): Promise<Narrador[]> {
  const { data } = await db.from('narradores').select('*').in('estado', estados);
  return (data as Narrador[] | null) ?? [];
}

async function ultimoEnvio(narradorId: string, tipo: string, orden?: number) {
  let q = db.from('envios').select('*')
    .eq('narrador_id', narradorId).eq('tipo', tipo)
    .order('enviado_at', { ascending: false }).limit(1);
  if (orden !== undefined) q = q.eq('pregunta_orden', orden);
  const { data } = await q;
  return (data as { enviado_at: string }[] | null)?.[0] ?? null;
}

async function registrarEnvio(narradorId: string, tipo: string, waMessageId: string, orden?: number) {
  await db.from('envios').insert({
    narrador_id: narradorId, tipo, pregunta_orden: orden ?? null, wa_message_id: waMessageId,
  });
}

async function tieneRespuesta(narradorId: string, orden: number): Promise<boolean> {
  const { data } = await db.from('respuestas').select('id')
    .eq('narrador_id', narradorId).eq('pregunta_orden', orden).limit(1);
  return (data?.length ?? 0) > 0;
}

/** La pregunta de ese orden: la propia del narrador si existe, si no la fija global. */
async function preguntaDeOrden(narradorId: string, orden: number) {
  const { data } = await db.from('preguntas').select('texto,capitulo,narrador_id')
    .or(`narrador_id.eq.${narradorId},narrador_id.is.null`)
    .eq('orden', orden)
    .order('narrador_id', { nullsFirst: false })
    .limit(1).maybeSingle();
  return data as { texto: string; capitulo: string; narrador_id: string | null } | null;
}

// ── Los 4 trabajos del tick ────────────────────────────────────────────

/** 1. Bienvenida: a los invitados que todavía no la recibieron. */
async function enviarBienvenidas(): Promise<void> {
  for (const n of await narradoresEn(['invitado'])) {
    if (await ultimoEnvio(n.id, 'bienvenida')) continue;
    const { data: familia } = await db.from('familias').select('nombre').eq('id', n.familia_id).maybeSingle();
    const vinculo = n.contexto?.vinculoComprador;
    const nombreFamilia = (familia as { nombre?: string } | null)?.nombre ?? 'su familia';
    const quienRegala = vinculo ? `su ${vinculo} ${nombreFamilia}` : nombreFamilia;
    const waId = await enviarPlantilla(n.telefono_whatsapp, 'bienvenida', [n.como_le_dicen, quienRegala]);
    await registrarEnvio(n.id, 'bienvenida', waId);
  }
}

/** 2. La pregunta del día, a la hora de cada uno. */
async function enviarPreguntasDelDia(ahora: Date): Promise<void> {
  for (const n of await narradoresEn(['acepto', 'activo'])) {
    if (!esHoraDeEnviar(n.hora_preferida, n.zona_horaria, ahora)) continue;

    // Si hay pregunta vigente sin responder, se reenvía LA MISMA (no avanza el orden).
    const vigenteRespondida = n.dia_actual === 0 || await tieneRespuesta(n.id, n.dia_actual);
    const orden = vigenteRespondida ? n.dia_actual + 1 : n.dia_actual;

    // Idempotencia: si ya salió hoy esa pregunta, no se repite.
    const envio = await ultimoEnvio(n.id, 'pregunta', orden);
    if (envio && fechaLocal(new Date(envio.enviado_at), n.zona_horaria) === fechaLocal(ahora, n.zona_horaria)) continue;

    const pregunta = await preguntaDeOrden(n.id, orden);
    if (!pregunta) continue; // no hay más preguntas: el cierre lo maneja la Task 10

    let texto = pregunta.texto;
    // Regla de reemplazo: el capítulo no aplica a esta vida y todavía no hay reemplazo propio.
    if (pregunta.narrador_id === null && capituloNoAplica(n.contexto, pregunta.capitulo)) {
      texto = await crearReemplazo(n, orden, pregunta.capitulo);
    }

    const reconocimiento = n.dia_actual === 0
      ? 'Hoy empezamos este viaje.'
      : await generarReconocimiento(
          n.como_le_dicen,
          await ultimaTranscripcion(n.id),
          texto,
          await armarHistoria(n.id),
          n.contexto?.arbol ?? {},
          n.contexto?.anioNacimiento,
        );

    const waId = await enviarPlantilla(n.telefono_whatsapp, 'pregunta_diaria', [reconocimiento, texto]);
    await enviarVozDeLaPregunta(n, orden, `${reconocimiento} ${texto}`);

    const avance: Record<string, unknown> = { dia_actual: orden };
    if (n.estado === 'acepto') avance.estado = 'activo';
    await db.from('narradores').update(avance).eq('id', n.id);
    await registrarEnvio(n.id, 'pregunta', waId, orden);
  }
}

/** Genera y guarda una pregunta personalizada que reemplaza a la fija que no aplica. */
async function crearReemplazo(n: Narrador, orden: number, capituloQueNoAplica: string): Promise<string> {
  const { data: caps } = await db.from('preguntas').select('capitulo').is('narrador_id', null);
  const capitulos = [...new Set(((caps as { capitulo: string }[] | null) ?? []).map((c) => c.capitulo))]
    .filter((c) => c !== capituloQueNoAplica);
  const nueva = await generarPreguntaReemplazo(
    n.como_le_dicen, await armarHistoria(n.id), capitulos, capituloQueNoAplica,
  );
  await db.from('preguntas').insert({
    narrador_id: n.id, orden, texto: nueva.texto, capitulo: nueva.capitulo, tipo: 'adaptativa',
  });
  return nueva.texto;
}

/** La versión hablada de la pregunta: se sube a Storage y se manda por link firmado. */
async function enviarVozDeLaPregunta(n: Narrador, orden: number, contenido: string): Promise<void> {
  const audio = await generarAudioVoz(contenido);
  const path = `${n.id}/sistema/pregunta_${String(orden).padStart(2, '0')}.mp3`;
  await db.storage.from('audios').upload(path, audio, { contentType: 'audio/mpeg', upsert: true });
  const { data } = await db.storage.from('audios').createSignedUrl(path, 3600);
  if (data?.signedUrl) await enviarAudioPorLink(n.telefono_whatsapp, data.signedUrl);
}

/** 3. Recordatorio suave: 6 hs después de la pregunta, si todavía no respondió. */
async function enviarRecordatorios(ahora: Date): Promise<void> {
  for (const n of await narradoresEn(['activo'])) {
    if (n.dia_actual < 1) continue;
    const envio = await ultimoEnvio(n.id, 'pregunta', n.dia_actual);
    if (!envio) continue;
    const enviado = new Date(envio.enviado_at);
    if (fechaLocal(enviado, n.zona_horaria) !== fechaLocal(ahora, n.zona_horaria)) continue;
    if (ahora.getTime() - enviado.getTime() < HORAS_RECORDATORIO * 3600_000) continue;
    if (await tieneRespuesta(n.id, n.dia_actual)) continue;

    const recordatorio = await ultimoEnvio(n.id, 'recordatorio');
    if (recordatorio && fechaLocal(new Date(recordatorio.enviado_at), n.zona_horaria) === fechaLocal(ahora, n.zona_horaria)) continue;

    const waId = await enviarPlantilla(n.telefono_whatsapp, 'recordatorio', [n.como_le_dicen]);
    await registrarEnvio(n.id, 'recordatorio', waId, n.dia_actual);
  }
}

/** 4. Tres días de silencio: se prende la alerta para que la web avise a la familia. */
async function prenderAlertasDeSilencio(ahora: Date): Promise<void> {
  for (const n of await narradoresEn(['activo'])) {
    if (n.alerta_silencio || !n.ultima_respuesta_at) continue;
    const dias = (ahora.getTime() - new Date(n.ultima_respuesta_at).getTime()) / 86_400_000;
    if (dias < DIAS_SILENCIO) continue;
    await db.from('narradores').update({ alerta_silencio: true }).eq('id', n.id);
  }
}

// ── El tick y el cron ──────────────────────────────────────────────────

export async function tick(ahora: Date = new Date()): Promise<void> {
  await enviarBienvenidas();
  await enviarPreguntasDelDia(ahora);
  await enviarRecordatorios(ahora);
  await prenderAlertasDeSilencio(ahora);
}

let corriendo = false;

export function iniciarScheduler() {
  return cron.schedule('*/15 * * * *', async () => {
    if (corriendo) return; // que dos ticks no se pisen
    corriendo = true;
    try {
      await tick(new Date());
    } catch (err) {
      console.error('Falló el tick del scheduler:', err);
    } finally {
      corriendo = false;
    }
  });
}

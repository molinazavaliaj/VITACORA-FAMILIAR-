import cron from 'node-cron';
import { db } from '../db/cliente.js';
import { enviarPlantilla } from '../whatsapp/enviar.js';
import { enviarPregunta, type Narrador } from './preguntar.js';

export { capituloNoAplica } from './preguntar.js';

const VENTANA_MINUTOS = 15;   // el cron corre cada 15 min
const HORAS_RECORDATORIO = 6; // recién después de 6 hs sin responder
const DIAS_SILENCIO = 3;      // 3 días sin señales → avisamos a la familia

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

// ── Los 4 trabajos del tick ────────────────────────────────────────────

/**
 * Corre el trabajo de UN narrador sin que su error contagie a los demás.
 * Sin esto, un solo narrador problemático (WhatsApp lo rechaza, token vencido)
 * dejaba sin mensaje a todo el resto en ese tick.
 */
async function aislado(narradorId: string, trabajo: () => Promise<void>): Promise<void> {
  try {
    await trabajo();
  } catch (err) {
    console.error(`Falló el trabajo del narrador ${narradorId}:`, err);
  }
}

/** 1. Bienvenida: a los invitados que todavía no la recibieron. */
async function enviarBienvenidas(): Promise<void> {
  for (const n of await narradoresEn(['invitado'])) {
    await aislado(n.id, async () => {
      if (await ultimoEnvio(n.id, 'bienvenida')) return;
      const { data: familia } = await db.from('familias').select('nombre').eq('id', n.familia_id).maybeSingle();
      const vinculo = n.contexto?.vinculoComprador;
      const nombreFamilia = (familia as { nombre?: string } | null)?.nombre ?? 'su familia';
      const quienRegala = vinculo ? `su ${vinculo} ${nombreFamilia}` : nombreFamilia;
      const waId = await enviarPlantilla(n.telefono_whatsapp, 'bienvenida', [n.como_le_dicen, quienRegala]);
      await registrarEnvio(n.id, 'bienvenida', waId);
    });
  }
}

/** 2. La pregunta del día, a la hora de cada uno. */
async function enviarPreguntasDelDia(ahora: Date): Promise<void> {
  for (const n of await narradoresEn(['acepto', 'activo'])) {
    await aislado(n.id, async () => {
      if (!esHoraDeEnviar(n.hora_preferida, n.zona_horaria, ahora)) return;

      // Si hay pregunta vigente sin responder, se reenvía LA MISMA (no avanza el orden).
      const vigenteRespondida = n.dia_actual === 0 || await tieneRespuesta(n.id, n.dia_actual);
      const orden = vigenteRespondida ? n.dia_actual + 1 : n.dia_actual;

      // Idempotencia: si ya salió hoy esa pregunta, no se repite.
      const envio = await ultimoEnvio(n.id, 'pregunta', orden);
      if (envio && fechaLocal(new Date(envio.enviado_at), n.zona_horaria) === fechaLocal(ahora, n.zona_horaria)) return;

      await enviarPregunta(n, orden, { plantilla: true });
    });
  }
}

/** 3. Recordatorio suave: 6 hs después de la pregunta, si todavía no respondió. */
async function enviarRecordatorios(ahora: Date): Promise<void> {
  for (const n of await narradoresEn(['activo'])) {
    await aislado(n.id, async () => {
      if (n.dia_actual < 1) return;
      const envio = await ultimoEnvio(n.id, 'pregunta', n.dia_actual);
      if (!envio) return;
      const enviado = new Date(envio.enviado_at);
      if (fechaLocal(enviado, n.zona_horaria) !== fechaLocal(ahora, n.zona_horaria)) return;
      if (ahora.getTime() - enviado.getTime() < HORAS_RECORDATORIO * 3600_000) return;
      if (await tieneRespuesta(n.id, n.dia_actual)) return;

      const recordatorio = await ultimoEnvio(n.id, 'recordatorio');
      if (recordatorio && fechaLocal(new Date(recordatorio.enviado_at), n.zona_horaria) === fechaLocal(ahora, n.zona_horaria)) return;

      const waId = await enviarPlantilla(n.telefono_whatsapp, 'recordatorio', [n.como_le_dicen]);
      await registrarEnvio(n.id, 'recordatorio', waId, n.dia_actual);
    });
  }
}

/** 4. Tres días de silencio: se prende la alerta para que la web avise a la familia. */
async function prenderAlertasDeSilencio(ahora: Date): Promise<void> {
  for (const n of await narradoresEn(['activo'])) {
    await aislado(n.id, async () => {
      if (n.alerta_silencio || !n.ultima_respuesta_at) return;
      const dias = (ahora.getTime() - new Date(n.ultima_respuesta_at).getTime()) / 86_400_000;
      if (dias < DIAS_SILENCIO) return;
      await db.from('narradores').update({ alerta_silencio: true }).eq('id', n.id);
    });
  }
}

// ── El tick y el cron ──────────────────────────────────────────────────

export async function tick(ahora: Date = new Date()): Promise<void> {
  // Cada fase por separado: si una falla (la base no responde), las otras corren igual.
  for (const [nombre, fase] of [
    ['bienvenidas', () => enviarBienvenidas()],
    ['preguntas', () => enviarPreguntasDelDia(ahora)],
    ['recordatorios', () => enviarRecordatorios(ahora)],
    ['alertas', () => prenderAlertasDeSilencio(ahora)],
  ] as const) {
    try {
      await fase();
    } catch (err) {
      console.error(`Falló la fase '${nombre}' del tick:`, err);
    }
  }
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

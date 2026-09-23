import { anotarLatido } from '../latido.js';
import cron from 'node-cron';
import { db } from '../db/cliente.js';
import { enviarPlantilla } from '../whatsapp/enviar.js';
import { enviarPregunta, type Narrador } from './preguntar.js';
import { mandarHito } from '../mail/hitos.js';
import { esViaje } from './viaje.js';

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

/**
 * ¿Ya salió su bienvenida DE VERDAD?
 *
 * Mira que haya id de Meta: una fila sin id es un intento fallido, anotado
 * para que se vea, y no tiene que impedir que se reintente (23/09).
 */
async function bienvenidaYaSalio(narradorId: string): Promise<boolean> {
  const { data } = await db.from('envios').select('id')
    .eq('narrador_id', narradorId).eq('tipo', 'bienvenida').not('wa_message_id', 'is', null).limit(1);
  return (data?.length ?? 0) > 0;
}

/**
 * Deja constancia EN LA BASE de que la bienvenida no salió, y por qué.
 *
 * El 21/09 tres bienvenidas no llegaron y estuvimos dos días sin poder decir
 * por qué: `enviarBienvenidas` era el único envío del sistema sin red — si la
 * plantilla fallaba, el error moría en la consola de Railway y desde afuera
 * parecía que el bot no había hecho nada. Una sola fila por narrador, que se
 * va actualizando: no impide el reintento y no ensucia la tabla cada 15 min.
 */
async function anotarBienvenidaFallida(narradorId: string, err: unknown): Promise<void> {
  const detalle = (err instanceof Error ? err.message : String(err)).slice(0, 500);
  console.error(`bienvenida: NO SALIÓ la de ${narradorId}: ${detalle}`);
  try {
    const { data } = await db.from('envios').select('id')
      .eq('narrador_id', narradorId).eq('tipo', 'bienvenida').is('wa_message_id', null).limit(1);
    const fila = (data as { id: string }[] | null)?.[0];
    const valores = { entrega: 'fallido', entrega_at: new Date().toISOString(), error_detalle: detalle };
    const { error } = fila
      ? await db.from('envios').update(valores).eq('id', fila.id)
      : await db.from('envios').insert({ narrador_id: narradorId, tipo: 'bienvenida', wa_message_id: null, ...valores });
    if (!error) return;
    console.warn(`bienvenida: no pude anotar el fallo de ${narradorId} en envios (¿falta la migración?):`, error.message);
    // Salida de emergencia (23/09): mientras las columnas de `envios` no estén
    // aplicadas, el motivo se guarda en el contexto del narrador. Es el único
    // lugar que ya existe y que podemos leer sin entrar a los logs de Railway.
    // Se saca cuando la migración esté puesta.
    await guardarFalloEnContexto(narradorId, detalle);
  } catch (e) {
    console.warn(`bienvenida: tampoco pude anotar el fallo de ${narradorId}:`, e);
  }
}

async function guardarFalloEnContexto(narradorId: string, detalle: string): Promise<void> {
  const { data } = await db.from('narradores').select('contexto').eq('id', narradorId).maybeSingle();
  const contexto = ((data as { contexto?: Record<string, unknown> } | null)?.contexto) ?? {};
  contexto.falloBienvenida = { cuando: new Date().toISOString(), detalle };
  await db.from('narradores').update({ contexto }).eq('id', narradorId);
}

/** 1. Bienvenida: a los invitados que todavía no la recibieron. */
async function enviarBienvenidas(): Promise<void> {
  for (const n of await narradoresEn(['invitado'])) {
    await aislado(n.id, async () => {
      if (await bienvenidaYaSalio(n.id)) return;
      // Vitácora de viaje: su plantilla es `bienvenida_viaje` (una variable). Hasta que Meta
      // la apruebe (WA_PLANTILLA_BIENVENIDA_VIAJE=1), el viajero escribe primero y procesar
      // le contesta la bienvenida como texto libre.
      if (esViaje(n.contexto)) {
        if (process.env.WA_PLANTILLA_BIENVENIDA_VIAJE !== '1') return;
        try {
          const waId = await enviarPlantilla(n.telefono_whatsapp, 'bienvenida_viaje', [n.como_le_dicen]);
          await registrarEnvio(n.id, 'bienvenida', waId);
        } catch (err) {
          await anotarBienvenidaFallida(n.id, err);
        }
        return;
      }
      const { data: familia } = await db.from('familias').select('nombre').eq('id', n.familia_id).maybeSingle();
      const vinculo = n.contexto?.vinculoComprador;
      const nombreFamilia = (familia as { nombre?: string } | null)?.nombre ?? 'su familia';
      const quienRegala = vinculo ? `su ${vinculo} ${nombreFamilia}` : nombreFamilia;
      try {
        const waId = await enviarPlantilla(n.telefono_whatsapp, 'bienvenida', [n.como_le_dicen, quienRegala]);
        await registrarEnvio(n.id, 'bienvenida', waId);
      } catch (err) {
        await anotarBienvenidaFallida(n.id, err);
      }
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
      await mandarHito(n, 'silencio'); // §9: "un llamado tuyo ayuda"
    });
  }
}

// ── El tick y el cron ──────────────────────────────────────────────────

export async function tick(ahora: Date = new Date()): Promise<void> {
  // El latido va PRIMERO: un tick recorre todos los narradores con HTTP real y
  // puede tardar minutos, y con el umbral de 3 × el intervalo el panel mostraría
  // el servicio caído justo mientras trabaja. También queda al final (abajo).
  await anotarLatido('entrevistador', { hora: ahora.toISOString() });

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

  // El latido, último y con su try adentro: si no se puede anotar que
  // estamos vivos, el tick no se cae por eso.
  await anotarLatido('entrevistador', { hora: ahora.toISOString() });
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

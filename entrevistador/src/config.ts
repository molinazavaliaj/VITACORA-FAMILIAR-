function exigir(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre}`);
  return valor;
}

export function cargarConfig() {
  return {
    supabaseUrl: exigir('SUPABASE_URL'),
    supabaseServiceKey: exigir('SUPABASE_SERVICE_ROLE_KEY'),
    anthropicKey: exigir('ANTHROPIC_API_KEY'),
    openaiKey: exigir('OPENAI_API_KEY'),
    waToken: exigir('WA_TOKEN'),
    waPhoneNumberId: exigir('WA_PHONE_NUMBER_ID'),
    waVerifyToken: exigir('WA_VERIFY_TOKEN'),
    // Railway (y casi todo PaaS) inyecta PORT y espera que el proceso escuche ahi.
    // PUERTO queda como alias para desarrollo local.
    puerto: Number(process.env.PORT ?? process.env.PUERTO ?? 3001),
  };
}
export type Config = ReturnType<typeof cargarConfig>;

/**
 * ¿La plantilla `bienvenida` aprobada en Meta ya lleva la frase que pide
 * permiso para clonar la voz? Mientras sea la vieja (sin la frase), el SÍ del
 * narrador NO vale como consentimiento y no se anota la fecha: en ese caso el
 * permiso se carga a mano (`npm run manual -- ficha <narrador> --voz-si`).
 * Se prende en Railway con WA_BIENVENIDA_PIDE_VOZ=1 cuando Meta apruebe la
 * plantilla nueva. Se lee en el momento (no al arrancar) para poder probarla.
 */
export function bienvenidaPideVoz(): boolean {
  return process.env.WA_BIENVENIDA_PIDE_VOZ === '1';
}

export type PlantillaV3 = { nombre: string; idiomaMeta: string };

/**
 * Las plantillas de Meta de la entrevista V3 (spec 2026-10-07), por idioma.
 * `pregunta`: una variable con la pregunta (`pregunta_diaria_vos` ya está
 * aprobada, PLANTILLAS.md). `recordatorio`: el texto de M8 del idioma, con una
 * variable (el nombre). Las carga Joaquín en Meta (el cuerpo lo aprueba Naza),
 * también `m8_vos` (es-AR), y se marcan como aprobadas en
 * WA_PLANTILLAS_V3_LISTAS (hasta entonces no salen). Si cambia un nombre
 * en Meta, se cambia acá.
 */
export const PLANTILLAS_V3: Readonly<Record<'es-AR' | 'es-ES' | 'ca', { pregunta: PlantillaV3; recordatorio: PlantillaV3; bienvenida: PlantillaV3 }>> = {
  'es-AR': { pregunta: { nombre: 'pregunta_diaria_vos', idiomaMeta: 'es' }, recordatorio: { nombre: 'm8_vos', idiomaMeta: 'es' }, bienvenida: { nombre: 'bienvenida_v3_vos', idiomaMeta: 'es' } },
  'es-ES': { pregunta: { nombre: 'pregunta_diaria_es_es', idiomaMeta: 'es_ES' }, recordatorio: { nombre: 'm8_es_es', idiomaMeta: 'es_ES' }, bienvenida: { nombre: 'bienvenida_v3_es_es', idiomaMeta: 'es_ES' } },
  ca: { pregunta: { nombre: 'pregunta_diaria_ca', idiomaMeta: 'ca' }, recordatorio: { nombre: 'm8_ca', idiomaMeta: 'ca' }, bienvenida: { nombre: 'bienvenida_v3_ca', idiomaMeta: 'ca' } },
};

/**
 * La plantilla del regalo que llega solo el día elegido (spec 2026-10-10), una
 * por idioma. La carga Joaquín en Meta (textos en docs/regalo/dia-de-entrega-textos.md,
 * tanda 3): cuerpo {{1}} = como_le_dicen, {{2}} = quien regala; botón de URL
 * con sufijo {{1}} = código. Sale solo si WA_PLANTILLAS_V3_LISTAS incluye
 * `<idioma>:regalo_entrega`.
 */
export const PLANTILLA_REGALO_ENTREGA: Readonly<Record<'es-AR' | 'es-ES' | 'ca', PlantillaV3>> = {
  'es-AR': { nombre: 'regalo_entrega_vos', idiomaMeta: 'es' },
  'es-ES': { nombre: 'regalo_entrega_es_es', idiomaMeta: 'es_ES' },
  ca: { nombre: 'regalo_entrega_ca', idiomaMeta: 'ca' },
};

export type CualPlantillaViaje = 'mensaje' | 'recordatorio' | 'recordatorio_ultima' | 'bienvenida' | 'bienvenida_regalo';

/**
 * Las plantillas de Meta de la Vitácora de Viaje V2 (docs/viajes-v2/plantillas-meta.md, textos aprobados por Naza
 * el 05/10), por idioma. Las carga Joaquín en Meta y se marcan como aprobadas en WA_PLANTILLAS_VIAJE_V2_LISTAS
 * (`es-AR:mensaje,es-AR:bienvenida,…`); hasta entonces no salen. Si cambia un nombre en Meta, se cambia acá.
 */
export const PLANTILLAS_VIAJE_V2: Readonly<Record<'es-AR' | 'es-ES' | 'ca', Record<CualPlantillaViaje, PlantillaV3>>> = {
  'es-AR': {
    mensaje: { nombre: 'mensaje_viaje_v2', idiomaMeta: 'es' },
    recordatorio: { nombre: 'recordatorio_viaje_v2', idiomaMeta: 'es' },
    recordatorio_ultima: { nombre: 'recordatorio_viaje_ultima_v2', idiomaMeta: 'es' },
    bienvenida: { nombre: 'bienvenida_viaje_v2', idiomaMeta: 'es' },
    bienvenida_regalo: { nombre: 'bienvenida_viaje_regalo_v2', idiomaMeta: 'es' },
  },
  'es-ES': {
    mensaje: { nombre: 'mensaje_viaje_v2_es_es', idiomaMeta: 'es_ES' },
    recordatorio: { nombre: 'recordatorio_viaje_v2_es_es', idiomaMeta: 'es_ES' },
    recordatorio_ultima: { nombre: 'recordatorio_viaje_ultima_v2_es_es', idiomaMeta: 'es_ES' },
    bienvenida: { nombre: 'bienvenida_viaje_v2_es_es', idiomaMeta: 'es_ES' },
    bienvenida_regalo: { nombre: 'bienvenida_viaje_regalo_v2_es_es', idiomaMeta: 'es_ES' },
  },
  ca: {
    mensaje: { nombre: 'mensaje_viaje_v2_ca', idiomaMeta: 'ca' },
    recordatorio: { nombre: 'recordatorio_viaje_v2_ca', idiomaMeta: 'ca' },
    recordatorio_ultima: { nombre: 'recordatorio_viaje_ultima_v2_ca', idiomaMeta: 'ca' },
    bienvenida: { nombre: 'bienvenida_viaje_v2_ca', idiomaMeta: 'ca' },
    bienvenida_regalo: { nombre: 'bienvenida_viaje_regalo_v2_ca', idiomaMeta: 'ca' },
  },
};

/** ¿Está aprobada en Meta? Se lee en el momento (WA_PLANTILLAS_VIAJE_V2_LISTAS), para poder prenderla sin deploy. */
export function plantillaViajeLista(idioma: 'es-AR' | 'es-ES' | 'ca', cual: CualPlantillaViaje, env: NodeJS.ProcessEnv = process.env): boolean {
  return (env.WA_PLANTILLAS_VIAJE_V2_LISTAS ?? '').split(',').map((s) => s.trim()).includes(`${idioma}:${cual}`);
}

/**
 * ¿Los viajeros NUEVOS van a la Viaje V2? (VIAJE_V2_PARA_NUEVOS=1, cuando Naza lo diga y con las bienvenidas
 * aprobadas en Meta). Prendido, a un viajero nuevo sin fila en `viajes_v2` no le sale la bienvenida vieja: se
 * avisa a los socios para que le creen la fila (npm run viaje-v2-alta) hasta que exista /comprar/viaje V2.
 */
export function viajeV2ParaNuevos(): boolean {
  return process.env.VIAJE_V2_PARA_NUEVOS === '1';
}

/**
 * ¿Los narradores NUEVOS entran a la entrevista V3? (spec 2026-10-07). Se
 * prende en Railway con V3_PARA_NUEVOS=1 cuando Naza lo diga; apagado, el alta
 * es la de siempre. Se lee en el momento (no al arrancar), como bienvenidaPideVoz.
 */
export function v3ParaNuevos(): boolean {
  return process.env.V3_PARA_NUEVOS === '1';
}

/**
 * ¿Este narrador nuevo entra a la V3? Con el interruptor prendido, los comprados por la web para otra persona.
 * «La mía» (vinculoComprador 'yo mismo') sigue por el flujo viejo hasta tener su bienvenida (la V3 dice «una
 * persona que te quiere mucho te regaló…»); el regalo va siempre por la V3 y el viaje nunca (por su lado).
 */
export function entraALaV3(contexto: Record<string, unknown> | null | undefined): boolean {
  if (contexto?.modo === 'viaje') return false;
  if (contexto?.regalo === true) return true;
  return v3ParaNuevos() && contexto?.vinculoComprador !== 'yo mismo';
}

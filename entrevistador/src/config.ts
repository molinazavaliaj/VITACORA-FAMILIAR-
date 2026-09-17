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

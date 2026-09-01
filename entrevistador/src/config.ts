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
    puerto: Number(process.env.PUERTO ?? 3001),
  };
}
export type Config = ReturnType<typeof cargarConfig>;

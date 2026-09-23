// Config leída de variables de entorno. Falla rápido si falta algo: mejor
// que la fábrica no arranque a que arranque a medias y falle en el primer tick.
export type Config = {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  anthropicApiKey: string;
  openaiApiKey: string;
  // Opcionales a propósito: el correo del anticipo se agregó después de que
  // la fábrica ya estaba corriendo en Railway. Si se exigieran acá, el
  // próximo deploy no arrancaría hasta que alguien cargue las variables —
  // peor que quedarse sin mandar un mail. Sin ellas, el anticipo se genera
  // igual y el envío avisa por consola.
  resendApiKey: string | null;
  urlBase: string;
};

export function cargarConfig(): Config {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey || !anthropicApiKey || !openaiApiKey) {
    throw new Error(
      'Faltan variables de entorno: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY'
    );
  }

  return {
    supabaseUrl,
    supabaseServiceRoleKey,
    anthropicApiKey,
    openaiApiKey,
    resendApiKey: process.env.RESEND_API_KEY ?? null,
    urlBase: process.env.URL_BASE ?? 'https://www.vitacorafamiliar.com',
  };
}

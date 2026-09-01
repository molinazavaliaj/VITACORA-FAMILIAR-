// Config leída de variables de entorno. Falla rápido si falta algo: mejor
// que la fábrica no arranque a que arranque a medias y falle en el primer tick.
export type Config = {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  anthropicApiKey: string;
  openaiApiKey: string;
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

  return { supabaseUrl, supabaseServiceRoleKey, anthropicApiKey, openaiApiKey };
}

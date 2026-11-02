// Los avisos a los socios, también en el panel (/admin/notificaciones, 02/11).
// Cada mail que va a MAIL_SOCIOS deja una fila en `avisos` (supabase/CONTRATO.md):
// los escriben la web (acá), el entrevistador y la fábrica, y /admin sólo marca
// `visto_at`. Nunca tira: un aviso que no se pudo anotar no puede frenar un pago.

export type Servicio = "web" | "entrevistador" | "fabrica";

export type FilaAviso = {
  id: string;
  creado_at: string;
  servicio: Servicio;
  asunto: string;
  detalle: string | null;
  clave: string | null;
  salio_mail: boolean | null;
  visto_at: string | null;
};

type Db = { from: (tabla: string) => { insert: (fila: Record<string, unknown>) => PromiseLike<{ error: { message: string } | null }> } };

/** `salioMail`: true salió, false falló, null no había a quién mandarlo. */
export async function anotarAviso(asunto: string, detalle: string, salioMail: boolean | null, db?: Db): Promise<void> {
  try {
    const cliente = db ?? (await import("./supabase/servidor")).crearClienteServidor();
    const { error } = await cliente.from("avisos").insert({ servicio: "web", asunto, detalle, salio_mail: salioMail });
    if (error) console.warn(`avisos: no quedó en el panel "${asunto}" (${error.message}).`);
  } catch (err) {
    console.warn(`avisos: no quedó en el panel "${asunto}":`, err instanceof Error ? err.message : err);
  }
}

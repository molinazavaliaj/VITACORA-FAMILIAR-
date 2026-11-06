// El contador del embudo de la compra (checkout etapa 1, 06/11). Público, sin sesión.
// Valida, suma uno al contador del día y contesta 204 siempre: nunca rompe ni frena la
// compra. No lee ni guarda IP, cookies, correo ni ningún identificador de persona.
// Lo que manda otro sitio se descarta igual, sin tocar la base. `Sec-Fetch-Site` lo pone
// el navegador: sin esa cabecera (navegador viejo) se cuenta.

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { validarEmbudo } from "@/lib/embudo";

export async function POST(request: Request) {
  const sitio = request.headers.get("sec-fetch-site");
  if (sitio && sitio !== "same-origin") return new Response(null, { status: 204 });
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    // JSON roto: nadie lo va a arreglar, no se anota.
    return new Response(null, { status: 204 });
  }
  try {
    const evento = validarEmbudo(cuerpo);
    if (evento) {
      const { error } = await crearClienteServidor().rpc("sumar_embudo", {
        p_compra: evento.compra,
        p_paso: evento.paso,
        p_region: evento.region,
        p_dispositivo: evento.dispositivo,
      });
      if (error) console.error("embudo POST: no pude sumar", error.message);
    }
  } catch (err) {
    console.error("embudo POST", err instanceof Error ? err.message : err);
  }
  return new Response(null, { status: 204 });
}

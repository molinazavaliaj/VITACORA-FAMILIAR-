// El contador del embudo de la compra (checkout etapa 1, 06/11). Público, sin sesión.
// Valida, suma uno al contador del día y contesta 204 siempre: nunca rompe ni frena la
// compra. No lee ni guarda IP, cookies, correo ni ningún identificador de persona.

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { validarEmbudo } from "@/lib/embudo";

export async function POST(request: Request) {
  try {
    const evento = validarEmbudo(await request.json());
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

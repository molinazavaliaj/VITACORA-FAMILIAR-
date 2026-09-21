import type { SupabaseClient } from "@supabase/supabase-js";

// El libro online (`{narrador}/paquete/libro.html`) para el código impreso.
// El criterio es el mismo que el de las frases: el libro está CERRADO
// (`libro_aprobado_at`) y el archivo existe — no el estado del pedido. Si el
// impreso se produce antes de que el pedido pase a `entregado`, el código de la
// contratapa tiene que abrir igual con el libro en la mano (Naza, 21/09).

export const RUTA_LIBRO_HTML = (narradorId: string) => `${narradorId}/paquete/libro.html`;

/** ¿Ya está el libro.html en el paquete? (la fábrica lo sube al producir el libro) */
export async function hayLibroOnline(admin: SupabaseClient, narradorId: string): Promise<boolean> {
  const { data } = await admin.storage.from("audios").list(`${narradorId}/paquete`, { search: "libro.html", limit: 5 });
  return Boolean(data?.some((a) => a.name === "libro.html"));
}

/**
 * Sirve el libro.html como HTML de verdad. Por qué no se redirige a la URL
 * firmada como con los mp3: Supabase Storage entrega cualquier HTML como
 * `text/plain` con `nosniff` (política de seguridad suya, aunque el archivo esté
 * guardado como text/html), así que en un iframe se ve el código crudo o nada.
 * Se baja acá y se responde con el tipo correcto. Sin scripts propios ni
 * cookies: el iframe que lo muestra va con `sandbox=""`.
 */
export async function responderLibroOnline(admin: SupabaseClient, narradorId: string): Promise<Response | null> {
  const { data, error } = await admin.storage.from("audios").download(RUTA_LIBRO_HTML(narradorId));
  if (error || !data) return null;
  return new Response(await data.text(), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

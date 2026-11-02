import type { SupabaseClient } from "@supabase/supabase-js";

// El libro online (`{narrador}/paquete/libro.html`) para el código impreso.
// El criterio es el mismo que el de las frases: el libro está CERRADO
// (`libro_aprobado_at`) y el archivo existe — no el estado del pedido. Si el
// impreso se produce antes de que el pedido pase a `entregado`, el código de la
// contratapa tiene que abrir igual con el libro en la mano (Naza, 21/09).

export const RUTA_LIBRO_HTML = (narradorId: string) => `${narradorId}/paquete/libro.html`;
/** El PDF que descargó la familia (no el de la imprenta, que lleva las frases y los códigos). */
export const RUTA_LIBRO_PDF = (narradorId: string) => `${narradorId}/paquete/libro.pdf`;

/** ¿Ya está el libro.html en el paquete? (la fábrica lo sube al producir el libro) */
export async function hayLibroOnline(admin: SupabaseClient, narradorId: string): Promise<boolean> {
  const { data } = await admin.storage.from("audios").list(`${narradorId}/paquete`, { search: "libro.html", limit: 5 });
  return Boolean(data?.some((a) => a.name === "libro.html"));
}

/** El libro online y su PDF, con una sola consulta (la página del QR muestra un botón por cada uno). */
export async function archivosDelLibro(admin: SupabaseClient, narradorId: string): Promise<{ html: boolean; pdf: boolean }> {
  const { data } = await admin.storage.from("audios").list(`${narradorId}/paquete`, { search: "libro.", limit: 20 });
  const nombres = new Set((data ?? []).map((a) => a.name));
  return { html: nombres.has("libro.html"), pdf: nombres.has("libro.pdf") };
}

/**
 * Sirve el libro.html como HTML de verdad. Por qué no se redirige a la URL
 * firmada como con los mp3: Supabase Storage entrega cualquier HTML como
 * `text/plain` con `nosniff` (política de seguridad suya, aunque el archivo esté
 * guardado como text/html), así que en un iframe se ve el código crudo o nada.
 * Se baja acá y se responde con el tipo correcto. Sin scripts propios ni
 * cookies: el iframe que lo muestra va con `sandbox=""`, y la respuesta lleva
 * `Content-Security-Policy: sandbox` para que se porte igual abierto a pantalla
 * completa, fuera del iframe (la página del QR, Naza 02/11).
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
      "Content-Security-Policy": "sandbox",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

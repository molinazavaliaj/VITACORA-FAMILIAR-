import type { SupabaseClient } from "@supabase/supabase-js";
import { fusionarCorrecciones, leerCorreccionesGuardadas, leerDudas, validarCorreccionesFamilia } from "./dudas";
import { archivosDelEscritor, carpetaDelEscritor, leerDelEscritor } from "./dudas-archivos";

// Guardar respuestas a las dudas en `correcciones.json`. Lo usan el panel (lo que no es privado, con sesión) y el link
// de quien contó (con el token): quién tiene permiso lo decide cada ruta antes de llamar acá.

export type ResultadoGuardarDudas =
  | { ok: true }
  /** `invalida` trae el mensaje de por qué. `falla` no: la ruta dice el suyo y el detalle queda en el log. */
  | { ok: false; motivo: "libro_escrito" | "sin_dudas" | "invalida" | "falla"; mensaje?: string };

export const ESTADO_DE_LA_FALLA: Record<"libro_escrito" | "sin_dudas" | "invalida" | "falla", number> = {
  libro_escrito: 409,
  sin_dudas: 404,
  invalida: 400,
  falla: 500,
};

export async function guardarRespuestasDudas(
  admin: SupabaseClient,
  narradorId: string,
  pedido: unknown,
  autor: { quien?: string; mail?: string },
): Promise<ResultadoGuardarDudas> {
  const falla = (motivo: string, detalle?: unknown): ResultadoGuardarDudas => {
    console.error(`dudas: ${motivo}`, detalle ?? "");
    return { ok: false, motivo: "falla" };
  };

  // Con el libro escrito, lo que se conteste ya no entra: no se guarda para que nadie crea que sí.
  const { nombres, error: errorListado } = await archivosDelEscritor(admin, narradorId);
  if (errorListado) return falla("fallo el listado de escritor/", errorListado);
  if (nombres.has("libro.md")) return { ok: false, motivo: "libro_escrito" };

  // Las dudas mandan: una respuesta que no apunta a ninguna no se sabe dónde
  // aplicar. Sin el archivo no hay nada que contestar; si no se pudo leer, es un error.
  const archivoDudas = await leerDelEscritor(admin, narradorId, "dudas-familia.json");
  if (archivoDudas.error) return falla("fallo la descarga de dudas-familia.json", archivoDudas.error);
  if (archivoDudas.texto === null) return { ok: false, motivo: "sin_dudas" };
  const dudas = leerDudas(archivoDudas.texto);
  if (!dudas) return falla("dudas-familia.json invalido");

  const resultado = validarCorreccionesFamilia(pedido, dudas);
  if (!resultado.ok) return { ok: false, motivo: "invalida", mensaje: resultado.mensaje };

  // Lo que ya está guardado, de otros familiares y de los socios. Si no se pudo
  // leer o está roto, no se escribe: reescribirlo perdería lo que había.
  const archivoCorrecciones = await leerDelEscritor(admin, narradorId, "correcciones.json");
  if (archivoCorrecciones.error) return falla("fallo la descarga de correcciones.json", archivoCorrecciones.error);
  let guardadas: unknown[] = [];
  if (archivoCorrecciones.texto !== null) {
    const leidas = leerCorreccionesGuardadas(archivoCorrecciones.texto);
    if (!leidas) return falla("correcciones.json invalido, no se pisa");
    guardadas = leidas;
  }

  const correcciones = fusionarCorrecciones(guardadas, resultado.correcciones, dudas, autor);

  // La carpeta ya se leyó arriba sin error (el listado la usa): una historia guarda en la suya.
  const { carpeta } = await carpetaDelEscritor(admin, narradorId);
  const { error: errorSubida } = await admin.storage
    .from("audios")
    .upload(`${carpeta}/correcciones.json`, JSON.stringify({ correcciones }), {
      contentType: "application/json",
      upsert: true,
      cacheControl: "0",
    });
  if (errorSubida) return falla("fallo la subida de correcciones.json", errorSubida);

  return { ok: true };
}

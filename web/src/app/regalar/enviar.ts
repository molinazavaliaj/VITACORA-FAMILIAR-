import type { Region } from "@/lib/precios";
import type { Genero } from "@/lib/regalo-reglas";
import { textosComprador, type IdiomaRegalo, type TratoComprador } from "@/lib/regalo-textos";

// El pago del regalo, separado del formulario para probarlo sin navegador:
// un POST a /api/compra con `regalo`; si salió bien y hay audio, se sube con
// el token que devolvió la compra y, salga bien, mal o tarde, se va al pago.
// El regalo vale sin audio.

export type PedidoRegalo = {
  nombre: string;
  comoLeDicen: string;
  genero: Genero | null;
  mensaje: string;
  fechaEntrega: string;
  nombreComprador: string;
  vinculoComprador: string;
  email: string;
  region: Region;
  /** En qué idioma le va a hablar el biógrafo a quien recibe el regalo. */
  idioma: IdiomaRegalo;
  audio: Blob | null;
};

export type Dependencias = {
  fetch: typeof fetch;
  /** Ir a la pasarela (en el navegador, `window.location.assign`). */
  asignar: (url: string) => void;
  /** Cuánto se espera la subida del audio antes de ir al pago igual. */
  esperaAudioMs?: number;
  /** El trato de quien compra, para el error genérico (vos si no se dice). */
  trato?: TratoComprador;
};

const ESPERA_AUDIO_MS = 30_000;

/** Lo que va a /api/compra. */
export function cuerpoCompra(p: PedidoRegalo) {
  return {
    nombreComprador: p.nombreComprador.trim(),
    vinculoComprador: p.vinculoComprador.trim(),
    region: p.region,
    email: p.email.trim(),
    narrador: { nombre: p.nombre.trim(), comoLeDicen: p.comoLeDicen.trim() },
    regalo: { mensaje: p.mensaje.trim(), fechaEntrega: p.fechaEntrega || undefined, genero: p.genero, idioma: p.idioma },
    productos: { impresos: 0, marcos: 0 },
  };
}

/** Devuelve `{ error }` si no se pudo ir al pago; si se pudo, redirige y devuelve `{ ok: true }`. */
export async function enviarRegalo(p: PedidoRegalo, deps: Dependencias): Promise<{ ok: true } | { error: string }> {
  const errorPago = textosComprador(deps.trato ?? "vos").errorPago;
  type Respuesta = { urlPago?: string; narradorId?: string; tokenFotos?: string; error?: string };
  let datos: Respuesta & { urlPago: string };
  try {
    const r = await deps.fetch("/api/compra", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpoCompra(p)),
    });
    const crudo = (await r.json()) as Respuesta;
    if (!r.ok || !crudo.urlPago) return { error: crudo.error ?? errorPago };
    datos = { ...crudo, urlPago: crudo.urlPago };
  } catch {
    return { error: errorPago };
  }

  if (p.audio && datos.narradorId && datos.tokenFotos) {
    const fd = new FormData();
    fd.append("audio", p.audio);
    const corte = new AbortController();
    const reloj = setTimeout(() => corte.abort(), deps.esperaAudioMs ?? ESPERA_AUDIO_MS);
    try {
      await deps.fetch(
        `/api/regalo/audio?narrador=${encodeURIComponent(datos.narradorId)}&token=${encodeURIComponent(datos.tokenFotos)}`,
        { method: "POST", body: fd, signal: corte.signal },
      );
    } catch {
      // Falló o tardó demasiado: se sigue al pago igual.
    } finally {
      clearTimeout(reloj);
    }
  }
  deps.asignar(datos.urlPago);
  return { ok: true };
}

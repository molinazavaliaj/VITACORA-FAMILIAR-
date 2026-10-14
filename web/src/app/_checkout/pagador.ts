// «Pagar», sin navegador para poder probarlo (lo usan /comprar y /comprar/viaje):
// un POST a /api/compra, después lo que se sube con el token de una hora que
// devuelve (el audio del regalo, las fotos del álbum) y recién ahí la pasarela.
//
// Dos reglas:
// - No se paga dos veces (MOTION.md §5 regla 6, «Pagar» no se puede pulsar dos
//   veces): mientras un pago está en curso, el segundo llamado vuelve sin hacer
//   nada. El botón además se deshabilita, pero dos clics en el mismo instante
//   llegan antes de que React lo pinte.
// - Si una foto falla, NO se va a pagar: se avisa, y el reintento no vuelve a
//   crear la compra (el narrador ya existe) ni a subir las fotos ya subidas.
//   Salvo que haya cambiado lo que se manda (p. ej. corrigió el email al volver
//   de la pasarela): entonces la compra se vuelve a crear con los datos nuevos,
//   para no cobrar ni mandar el acceso con los viejos.

export type RespuestaCompra = { urlPago: string; narradorId: string; tokenFotos: string };

export type Subible = { clave: string; nombre: string; subida: boolean };

export type DependenciasPago = {
  fetch: typeof fetch;
  /** Ir a la pasarela (en el navegador, `window.location.assign`). */
  asignar: (url: string) => void;
  /** Sube una foto del álbum con el token de la compra; tira si falla. */
  subirFoto?: (narradorId: string, token: string, clave: string) => Promise<void>;
  /** Sube el audio del regalo; si falla o tarda, se sigue al pago igual. */
  subirAudio?: (narradorId: string, token: string) => Promise<void>;
  /** Avisos de progreso («Subiendo foto 1 de 3…»); null al terminar. */
  alProgreso?: (texto: string | null) => void;
  /** Antes de irse a la pasarela: guardar lo elegido para un pago fallido. */
  antesDeIr?: (compra: RespuestaCompra) => void;
  /**
   * De qué anuncio vino (F4-5, lib/origen.ts): si devuelve algo, viaja en el
   * cuerpo como `origen`. Si no hay o tira, la compra va como siempre.
   */
  origen?: () => unknown;
};

export type TextosPago = {
  errorPago: string;
  errorConexion: string;
  subiendoFoto: (i: number, n: number) => string;
  noSubio: (nombre: string) => string;
  sacalaOIntenta: string;
};

export type ResultadoPago = { ok: true } | { ocupado: true } | { error: string };

export function crearPagador(deps: DependenciasPago, T: TextosPago) {
  let enCurso = false;
  let iniciada: RespuestaCompra | null = null;
  let cuerpoIniciado: string | null = null;

  function conOrigen(cuerpo: unknown): unknown {
    let origen: unknown = null;
    try {
      origen = deps.origen?.() ?? null;
    } catch {
      origen = null;
    }
    return origen && cuerpo && typeof cuerpo === "object" ? { ...cuerpo, origen } : cuerpo;
  }

  async function intentar(cuerpo: unknown, fotos: Subible[], alSubir: (clave: string) => void): Promise<ResultadoPago> {
    const cuerpoJson = JSON.stringify(conOrigen(cuerpo));
    if (iniciada && cuerpoIniciado !== cuerpoJson) iniciada = null;
    if (!iniciada) {
      let datos: Partial<RespuestaCompra> & { error?: string };
      let ok: boolean;
      try {
        const r = await deps.fetch("/api/compra", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: cuerpoJson,
        });
        ok = r.ok;
        datos = (await r.json().catch(() => ({}))) as typeof datos;
      } catch {
        return { error: T.errorConexion };
      }
      if (!ok || !datos.urlPago || !datos.narradorId || !datos.tokenFotos) return { error: datos.error ?? T.errorPago };
      iniciada = { urlPago: datos.urlPago, narradorId: datos.narradorId, tokenFotos: datos.tokenFotos };
      cuerpoIniciado = cuerpoJson;
    }
    const compra = iniciada;

    if (deps.subirAudio) {
      try {
        await deps.subirAudio(compra.narradorId, compra.tokenFotos);
      } catch {
        // El regalo vale sin audio: se sigue al pago.
      }
    }

    const pendientes = fotos.filter((f) => !f.subida);
    for (let i = 0; i < pendientes.length; i++) {
      const foto = pendientes[i];
      deps.alProgreso?.(T.subiendoFoto(i + 1, pendientes.length));
      try {
        await deps.subirFoto?.(compra.narradorId, compra.tokenFotos, foto.clave);
        alSubir(foto.clave);
      } catch (e) {
        deps.alProgreso?.(null);
        const motivo = e instanceof Error && e.message ? e.message : T.noSubio(foto.nombre);
        return { error: `${motivo} ${T.sacalaOIntenta}` };
      }
    }
    deps.alProgreso?.(null);
    deps.antesDeIr?.(compra);
    deps.asignar(compra.urlPago);
    return { ok: true };
  }

  return {
    /** Si cambia lo elegido, la compra se vuelve a crear en el próximo intento. */
    olvidar() {
      if (!enCurso) iniciada = null;
    },
    /** ¿Hay un pago en curso? */
    get ocupado() {
      return enCurso;
    },
    async pagar(cuerpo: unknown, fotos: Subible[], alSubir: (clave: string) => void = () => {}): Promise<ResultadoPago> {
      if (enCurso) return { ocupado: true };
      enCurso = true;
      try {
        const resultado = await intentar(cuerpo, fotos, alSubir);
        // Si se fue a la pasarela queda «en curso»: si el navegador vuelve atrás
        // sin recargar, el formulario lo libera al ver la página otra vez (pageshow).
        if (!("ok" in resultado)) enCurso = false;
        return resultado;
      } catch {
        // Algo que no esperábamos (guardar lo elegido, ir a la pasarela): el
        // botón no puede quedar bloqueado.
        enCurso = false;
        return { error: T.errorPago };
      }
    },
    /** Libera el pago cuando la página vuelve a verse desde el historial (pageshow). */
    liberar() {
      enCurso = false;
    },
  };
}

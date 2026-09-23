// Quién emite la etiqueta de envío (3t.26 fase 2, camino B del spec del 21/09).
//
// El diseño es un agregador de correos **por país**: en España Sendcloud o Packlink
// (Correos, SEUR, GLS) y en Argentina Enviopack, Zippin o Shipnow (Andreani, OCA,
// Correo). Cuál se usa en cada uno **todavía no está decidido** —depende del precio
// por etiqueta y de si pasan a retirar por la imprenta—, así que acá vive la forma
// del trabajo, no el proveedor.
//
// Mientras tanto anda el camino `manual`, que el CONTRATO ya contemplaba: el
// sistema calcula el bulto y deja la entrega lista para despachar, y quien va al
// correo carga el seguimiento desde `/admin`. Eso alcanza para los primeros envíos
// —que son de a uno— y no frena el lanzamiento esperando una cuenta.
//
// Cuando se elija el agregador, lo único que se agrega es un adaptador que cumpla
// `ProveedorDeEtiqueta`; nada de lo que llama a esto cambia.

import type { Bulto } from './bulto.js';

/** Los que el CONTRATO acepta en `entregas.etiqueta_proveedor`. */
export type NombreProveedor = 'sendcloud' | 'packlink' | 'enviopack' | 'zippin' | 'shipnow' | 'manual';

export type DatosDelEnvio = {
  /** El país que despacha: el centro de distribución, no el destino. */
  origen: 'AR' | 'ES';
  destinatario: { nombre: string | null; telefono: string | null; email: string | null };
  direccion: Record<string, unknown> | null;
  bulto: Bulto;
  /** Para que el operario sepa qué caja es cuál sin abrirla. */
  referencia: string;
};

export type EtiquetaEmitida = {
  proveedor: NombreProveedor;
  /** El PDF que imprime la imprenta. `null` con `manual`: la hace quien despacha. */
  etiquetaUrl: string | null;
  envioExternoId: string | null;
  transportista: string | null;
  seguimiento: string | null;
  seguimientoUrl: string | null;
};

export interface ProveedorDeEtiqueta {
  readonly nombre: NombreProveedor;
  /** Crea el envío y devuelve con qué se lo sigue. Tira si el proveedor falla. */
  emitir(datos: DatosDelEnvio): Promise<EtiquetaEmitida>;
}

/**
 * El camino de hoy: no llama a nadie. Deja constancia de que la etiqueta se hace a
 * mano, con el peso y las medidas ya calculados para no tener que medir la caja en
 * el mostrador del correo. El seguimiento lo carga una persona desde `/admin`, y
 * ahí sale solo el mail de "va en camino".
 */
export const PROVEEDOR_MANUAL: ProveedorDeEtiqueta = {
  nombre: 'manual',
  async emitir(): Promise<EtiquetaEmitida> {
    return {
      proveedor: 'manual',
      etiquetaUrl: null,
      envioExternoId: null,
      transportista: null,
      seguimiento: null,
      seguimientoUrl: null,
    };
  },
};

/**
 * Qué proveedor despacha desde cada país, leído de la config
 * (`AGREGADOR_ES` / `AGREGADOR_AR`). Sin variable —que es el estado de hoy— vale
 * `manual`, y el envío sale igual.
 *
 * Un nombre que no conocemos NO se acepta en silencio: se avisa y se cae a manual,
 * porque una etiqueta que nadie emitió es un paquete que no viaja.
 */
export function proveedorDe(origen: 'AR' | 'ES'): ProveedorDeEtiqueta {
  const elegido = process.env[origen === 'ES' ? 'AGREGADOR_ES' : 'AGREGADOR_AR']?.trim().toLowerCase();
  if (!elegido || elegido === 'manual') return PROVEEDOR_MANUAL;

  const conocidos: NombreProveedor[] = ['sendcloud', 'packlink', 'enviopack', 'zippin', 'shipnow'];
  if (!conocidos.includes(elegido as NombreProveedor)) {
    console.warn(`envio: el agregador "${elegido}" de ${origen} no existe; se despacha a mano.`);
    return PROVEEDOR_MANUAL;
  }

  // Elegido pero sin adaptador todavía: se dice con todas las letras en vez de
  // fallar raro más adelante.
  console.warn(
    `envio: ${origen} está configurado con "${elegido}", que todavía no tiene adaptador escrito; se despacha a mano.`
  );
  return PROVEEDOR_MANUAL;
}

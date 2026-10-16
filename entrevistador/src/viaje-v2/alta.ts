// El alta de un viajero en la Viaje V2: crear su fila en `viajes_v2` con la compra (docs/viajes-v2/compra-contrato.md).
// Desde el 16/10 la Vitácora de Viaje es solo V2: el bot da el alta solo, apenas ve a un viajero nuevo (el tick del
// scheduler, o procesar.ts si escribe primero). El script npm run viaje-v2-alta usa lo mismo.
//
// La compra sale de `contexto.viaje`:
//   · { v: 2, … }: lo que manda la compra nueva de la web, con los nombres de la `Compra` (nucleo/tipos.ts).
//   · el formulario viejo ({ salida, vuelta, etapas, … }): fechas tal cual; las zonas, la de su casa (el formulario
//     no preguntaba la del viaje); el formato, lo que se pagó en el pedido; el álbum, 20 fotos. Se avisa a los
//     socios qué se supuso, para que lo corrijan si hace falta.
// Si no alcanza para una compra válida (sin fechas, menos de 3 días, una zona rara), no se adivina: se avisa a los
// socios una sola vez y el narrador queda como está. Con los datos corregidos, el tick siguiente le da el alta.
// Dos ticks a la vez no crean dos filas: la clave primaria de `viajes_v2` es el narrador (crearFila).

import type { SupabaseClient } from '@supabase/supabase-js';
import { crearFila, esTablaAusente } from './filas.js';
import { NOCHE_DESDE, NOCHE_HASTA, validarCompra } from './nucleo/calendario.js';
import { esIdioma, idiomaDe } from './nucleo/idioma.js';
import { HORA_NOCHE_POR_DEFECTO, type Compra, type Formato, type FotosAlbum } from './nucleo/tipos.js';
import { estadoInicial } from './tipos.js';

/** ¿Es de la Vitácora de Viaje? Todo viajero tiene `contexto.modo = 'viaje'` (lo escribe la web al comprar). */
export function esModoViaje(contexto: Record<string, unknown> | null | undefined): boolean {
  return contexto?.modo === 'viaje';
}

/** Los estados en los que un viajero sin fila quedó en el viaje viejo (V1, borrado el 16/10): el bot no le escribe. */
export const ESTADOS_VIAJE_VIEJO = ['acepto', 'activo', 'pausado'] as const;

/** ¿Es un viajero que quedó en el viaje viejo? (modo viaje, ya había dicho SÍ y no tiene fila V2) */
export function quedoEnElViajeViejo(n: { estado: string; contexto?: Record<string, unknown> | null }, tieneFila: boolean): boolean {
  return !tieneFila && esModoViaje(n.contexto) && (ESTADOS_VIAJE_VIEJO as readonly string[]).includes(n.estado);
}

export type NarradorParaAlta = {
  id: string;
  estado: string;
  como_le_dicen: string;
  zona_horaria: string;
  hora_preferida?: string | null;
  contexto?: Record<string, unknown> | null;
};

/** Lo que importa del pedido pagado: si lleva libro impreso. Null = no se encontró pedido. */
export type PedidoDelViaje = { impreso: boolean } | null;

export type CompraArmada =
  | { ok: true; compra: Compra; forma: 'v2' | 'vieja'; supuestos: string[] }
  | { ok: false; motivo: string };

const FOTOS_ALBUM_POR_DEFECTO: FotosAlbum = 20;

function texto(x: unknown): string | undefined {
  return typeof x === 'string' && x.trim() ? x.trim() : undefined;
}

/** 'HH:MM' de lo que guarda la base ('21:00' o '21:00:00'); undefined si no es una hora. */
function horaCorta(x: unknown): string | undefined {
  const m = typeof x === 'string' ? /^(\d{2}):(\d{2})(:\d{2})?$/.exec(x.trim()) : null;
  return m ? `${m[1]}:${m[2]}` : undefined;
}

function listaDeTextos(x: unknown): string[] {
  return Array.isArray(x) ? x.map(texto).filter((s): s is string => s !== undefined) : [];
}

/** El formulario nuevo (`v: 2`). Acepta también los nombres del primer borrador del contrato (preguntas, album, quienRegala). */
function deFormaV2(n: NarradorParaAlta, v: Record<string, unknown>): Omit<Compra, 'nombre'> {
  const quienRegala = texto((v.regalo as { quienRegala?: unknown } | undefined)?.quienRegala) ?? texto(v.quienRegala);
  const compra: Omit<Compra, 'nombre'> = {
    salida: v.salida as string,
    vuelta: v.vuelta as string,
    zonaCasa: texto(v.zonaCasa) ?? n.zona_horaria,
    zonaViaje: v.zonaViaje as string,
    preguntasPropias: listaDeTextos(v.preguntasPropias ?? v.preguntas),
    formato: v.formato as Formato,
    fotosAlbum: Number(v.fotosAlbum ?? v.album) as FotosAlbum,
  };
  const horaNoche = horaCorta(v.horaNoche);
  if (horaNoche) compra.horaNoche = horaNoche;
  if (quienRegala) compra.regalo = { quienRegala };
  if (v.idioma !== undefined && v.idioma !== null && v.idioma !== '') compra.idioma = v.idioma as Compra['idioma'];
  return compra;
}

/** El formulario viejo (salida, vuelta, etapas…): lo que falta se supone, y se anota qué. */
function deFormaVieja(n: NarradorParaAlta, v: Record<string, unknown>, pedido: PedidoDelViaje, supuestos: string[]): Omit<Compra, 'nombre'> {
  const zonaCasa = n.zona_horaria;
  const zonaViaje = texto(v.zonaViaje) ?? zonaCasa;
  if (!texto(v.zonaViaje)) supuestos.push(`la zona del viaje es la de su casa (${zonaCasa}): el formulario viejo no la pedía`);
  const compra: Omit<Compra, 'nombre'> = {
    salida: v.salida as string,
    vuelta: v.vuelta as string,
    zonaCasa,
    zonaViaje,
    preguntasPropias: [],
    formato: pedido?.impreso ? 'impreso' : 'pdf',
    fotosAlbum: FOTOS_ALBUM_POR_DEFECTO,
  };
  if (!pedido) supuestos.push('no encontré su pedido: el formato queda en pdf');
  supuestos.push(`el álbum es de ${FOTOS_ALBUM_POR_DEFECTO} fotos`);
  // La hora que eligió, si cae en la franja de la noche; si no, la de siempre.
  const hora = horaCorta(n.hora_preferida);
  if (hora && hora >= NOCHE_DESDE && hora <= NOCHE_HASTA) compra.horaNoche = hora;
  else supuestos.push(`la hora de la noche es ${HORA_NOCHE_POR_DEFECTO}${hora ? ` (eligió ${hora}, fuera de la franja)` : ''}`);
  const idioma = n.contexto?.idioma;
  if (esIdioma(idioma)) compra.idioma = idioma;
  return compra;
}

/**
 * La `Compra` de un viajero a partir de su `contexto.viaje`. Pura. No adivina fechas: sin una compra válida
 * (validarCompra y un idioma conocido) devuelve el motivo.
 */
export function compraDeContexto(n: NarradorParaAlta, pedido: PedidoDelViaje): CompraArmada {
  const v = n.contexto?.viaje;
  if (!v || typeof v !== 'object') return { ok: false, motivo: 'no tiene los datos del viaje (contexto.viaje)' };
  const viaje = v as Record<string, unknown>;
  const nombre = texto(n.como_le_dicen) ?? '';
  const supuestos: string[] = [];
  const forma = viaje.v === 2 ? 'v2' : 'vieja';
  const compra: Compra = { nombre, ...(forma === 'v2' ? deFormaV2(n, viaje) : deFormaVieja(n, viaje, pedido, supuestos)) };
  try {
    validarCompra(compra);
    idiomaDe(compra); // un idioma desconocido frena acá
  } catch (err) {
    return { ok: false, motivo: err instanceof Error ? err.message : String(err) };
  }
  return { ok: true, compra, forma, supuestos };
}

/** Si el pedido pagado del narrador lleva impreso (pedidos.extras.impreso o copias). Null si no hay pedido. */
export async function pedidoDelViaje(db: SupabaseClient, narradorId: string): Promise<PedidoDelViaje> {
  const { data, error } = await db.from('pedidos').select('extras').eq('narrador_id', narradorId);
  if (error) throw new Error(`No pude leer el pedido de ${narradorId}: ${error.message}`);
  const filas = (data as { extras?: Record<string, unknown> | null }[] | null) ?? [];
  if (filas.length === 0) return null;
  const impreso = filas.some((f) => {
    const e = f.extras ?? {};
    return e.impreso === 'color' || e.impreso === 'bn' || (typeof e.copias === 'number' && e.copias > 0);
  });
  return { impreso };
}

/** Crea la fila con la compra ya validada. 'ya-existia' si otro (un tick, el script) la creó antes: no se toca. */
export function crearAlta(db: SupabaseClient, narradorId: string, compra: Compra): Promise<'creada' | 'ya-existia'> {
  return crearFila(db, { narrador_id: narradorId, idioma: idiomaDe(compra), compra, estado: estadoInicial() });
}

export type DepsAlta = {
  db: SupabaseClient;
  /** Aviso a los socios, una sola vez por clave (no por día). Nunca tira. */
  avisarUnaVez(clave: string, asunto: string, detalle: string): Promise<void>;
};

export type ResultadoAlta = 'creada' | 'ya-existia' | 'faltan-datos' | 'no-corresponde';

/**
 * Le da el alta en la V2 a un viajero nuevo ('invitado', modo viaje). Idempotente: si la fila ya existe, no la
 * toca. Sin datos suficientes, avisa a los socios (una vez) y no cambia nada del narrador.
 */
export async function asegurarAltaViajeV2(deps: DepsAlta, n: NarradorParaAlta): Promise<ResultadoAlta> {
  // La simulación con --real (scripts/viaje-v2-simular.ts) crea su propia fila: el alta no la toca.
  if (n.estado !== 'invitado' || !esModoViaje(n.contexto) || n.contexto?.simulacion === true) return 'no-corresponde';
  const forma = (n.contexto?.viaje as { v?: unknown } | undefined)?.v === 2 ? 'v2' : 'vieja';
  const armada = compraDeContexto(n, forma === 'vieja' ? await pedidoDelViaje(deps.db, n.id) : null);
  if (!armada.ok) {
    await deps.avisarUnaVez(`viaje-v2-alta-sin-datos:${n.id}:${armada.motivo}`, `Un viajero nuevo no pudo entrar a la Viaje V2`,
      `${n.como_le_dicen} (${n.id}) compró la Vitácora de Viaje, pero con sus datos no se arma la compra: ${armada.motivo}. `
        + 'El bot no le escribe nada. Hay que corregir narradores.contexto.viaje (ver docs/viajes-v2/compra-contrato.md): '
        + 'en el próximo tick (15 minutos) el bot le da el alta solo. También sirve npm run viaje-v2-alta con un compra.json.');
    return 'faltan-datos';
  }
  let r: 'creada' | 'ya-existia';
  try {
    r = await crearAlta(deps.db, n.id, armada.compra);
  } catch (err) {
    // Sin la migración de viajes_v2 no hay dónde darle el alta: como si faltaran datos (el narrador queda quieto).
    if (esTablaAusente(err as { code?: string; message?: string })) {
      console.error(`viaje V2: no existe la tabla viajes_v2; ${n.id} queda sin alta`);
      return 'faltan-datos';
    }
    throw err;
  }
  if (r === 'creada') {
    console.log(`viaje V2: alta automática de ${n.id} (formulario ${armada.forma})`);
    if (armada.supuestos.length > 0) {
      await deps.avisarUnaVez(`viaje-v2-alta-supuestos:${n.id}`, `Alta en la Viaje V2 con datos supuestos`,
        `${n.como_le_dicen} (${n.id}) compró con el formulario viejo y el bot le dio el alta en la Viaje V2 solo. `
          + `Se supuso que ${armada.supuestos.join('; ')}. `
          + `Sale ${armada.compra.salida} y vuelve ${armada.compra.vuelta}. Si viaja a otro país: `
          + `npm run viaje-v2-cambiar-pais -- ${n.id} --zona <Zona/IANA> --aplicar. La bienvenida V2 le sale sola.`);
    }
  }
  return r;
}

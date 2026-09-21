// Los frenos del panel de la empresa (§7 del spec): qué se frenó, con la misma vara
// que ya usa el repo donde existía, y una nueva donde no había nada.
//
// Es una función pura: recibe filas crudas y devuelve frenos. Acá no hay base ni HTTP,
// y por eso se puede probar entera sin dobles. Quien la llama (B3/B6) sólo le pasa las
// filas que leyó y una fecha; la fecha se pasa SIEMPRE para que el test no dependa del
// reloj (y para que el panel pueda mostrar "cómo estaba ayer" si algún día hace falta).
//
// Umbrales: silencio 3 días y voz 6 h son los criterios que ya estaban en el repo
// (fabrica/src/worker.ts y entrevistador/src/flujo/scheduler.ts); el pago sin confirmar
// (12 h) y el libro pagado sin arrancar (24 h) son nuevos y están en el spec §7.

export type Gravedad = "rojo" | "ambar" | "verde";

export type Freno = {
  /** `pago` · `libro` · `voz` · `narrador` · `latido` — para agrupar en la pantalla. */
  que: string;
  /** La frase que se lee de corrido, en castellano. */
  detalle: string;
  gravedad: Gravedad;
  desde: string | null;
  horas: number | null;
  quien: string | null;
};

export const UMBRALES = {
  silencioDias: 3,
  libroSinArrancarHoras: 24,
  vozSinAvanceHoras: 6,
  pagoSinConfirmarHoras: 12,
  latidoSinLatearVeces: 3,
  vozSinLatidoMinutos: 45,
};

// La vuelta de cada worker (Parte A del panel): a quien no late en `latidoSinLatearVeces`
// vueltas se lo declara caído. El entrevistador NO está acá a propósito: no es un bucle
// que da vueltas — lo despierta cada mensaje que llega (webhook), así que "no late" no
// significa "se cayó". Su vida se mira con las respuestas recibidas (mapa, B5).
const VUELTA_MS: Record<string, number> = {
  fabrica: 60_000,
  voz: 30_000,
};

export type FilaNarrador = {
  id: string;
  nombre: string | null;
  estado: string;
  dia_actual: number | null;
  ultima_respuesta_at: string | null;
  alerta_silencio: boolean | null;
  libro_aprobado_at?: string | null;
};

export type FilaPedido = {
  id: string;
  estado: string;
  created_at: string;
  narrador_id: string | null;
  monto: number | null;
  moneda: string | null;
};

export type FilaNarracion = {
  id: string;
  narrador_id: string | null;
  estado: string;
  created_at: string;
  actualizada_at: string | null;
};

export type FilaLatido = { servicio: string; ultimo_ping: string };  // la columna real de `latidos`

export type DatosDelPanel = {
  narradores: FilaNarrador[];
  pedidos: FilaPedido[];
  narraciones: FilaNarracion[];
  latidos: FilaLatido[];
};

/** Las horas entre una fecha en texto y el momento que le pasás. `null` si no se puede leer. */
export function horasEntre(desde: string | null | undefined, hasta: Date): number | null {
  if (!desde) return null;
  const t = Date.parse(desde);
  if (Number.isNaN(t)) return null;
  return (hasta.getTime() - t) / 3600_000;
}

const RANGO: Record<Gravedad, number> = { rojo: 0, ambar: 1, verde: 2 };

function quienEs(narradores: FilaNarrador[], id: string | null): string | null {
  if (!id) return null;
  return narradores.find((n) => n.id === id)?.nombre ?? null;
}

function enHoras(horas: number): string {
  return horas >= 48 ? `${Math.floor(horas / 24)} días` : `${Math.round(horas)} h`;
}

/** El libro ya está listo: sus pedidos viejos son ruido del cobro, no un freno. */
function libroListo(narradores: FilaNarrador[], pedidos: FilaPedido[], narradorId: string | null): boolean {
  if (!narradorId) return false;
  const n = narradores.find((x) => x.id === narradorId);
  if (n && (n.libro_aprobado_at || n.estado === "completado" || n.estado === "cerrado_anticipado")) return true;
  return pedidos.some((p) => p.narrador_id === narradorId && p.estado === "entregado");
}

function frenoDeSilencio(n: FilaNarrador, ahora: Date): Freno | null {
  // Un narrador pausado o cerrado no está frenado: pidió parar (o ya terminó).
  if (n.estado !== "activo") return null;

  const horas = horasEntre(n.ultima_respuesta_at, ahora);
  const porTiempo = horas !== null && horas > UMBRALES.silencioDias * 24;
  const porBandera = n.alerta_silencio === true;
  if (!porTiempo && !porBandera) return null;

  const dias = horas === null ? null : Math.floor(horas / 24);
  return {
    que: "narrador",
    gravedad: "ambar",
    detalle:
      dias === null
        ? `El entrevistador marcó que ${n.nombre ?? "este narrador"} no contesta`
        : `Hace ${dias} ${dias === 1 ? "día" : "días"} que ${n.nombre ?? "este narrador"} no contesta`,
    desde: n.ultima_respuesta_at,
    horas,
    quien: n.nombre,
  };
}

function frenoDePago(p: FilaPedido, datos: DatosDelPanel, ahora: Date): Freno | null {
  if (p.estado !== "pendiente") return null;
  const horas = horasEntre(p.created_at, ahora);
  if (horas === null || horas <= UMBRALES.pagoSinConfirmarHoras) return null;
  // El cobro viejo de un libro ya entregado no se cuenta dos veces (spec, Review Focus 3).
  if (libroListo(datos.narradores, datos.pedidos, p.narrador_id)) return null;

  const plata = p.monto === null ? "" : ` de ${p.monto} ${p.moneda ?? ""}`.trimEnd();
  return {
    que: "pago",
    gravedad: "rojo",
    detalle: `Hay un pago sin confirmar hace ${enHoras(horas)}${plata}`,
    desde: p.created_at,
    horas,
    quien: quienEs(datos.narradores, p.narrador_id),
  };
}

function frenoDeLibroEnCola(p: FilaPedido, datos: DatosDelPanel, ahora: Date): Freno | null {
  if (p.estado !== "pagado") return null;
  const horas = horasEntre(p.created_at, ahora);
  if (horas === null || horas <= UMBRALES.libroSinArrancarHoras) return null;

  return {
    que: "libro",
    gravedad: "rojo",
    detalle: `Pagado hace ${enHoras(horas)} y el libro sigue sin arrancar`,
    desde: p.created_at,
    horas,
    quien: quienEs(datos.narradores, p.narrador_id),
  };
}

function frenoDeVoz(x: FilaNarracion, datos: DatosDelPanel, ahora: Date): Freno | null {
  if (x.estado !== "procesando") return null;
  const horas = horasEntre(x.actualizada_at ?? x.created_at, ahora);
  if (horas === null || horas <= UMBRALES.vozSinAvanceHoras) return null;

  return {
    que: "voz",
    gravedad: "rojo",
    detalle: `La voz quedó sin avanzar hace ${enHoras(horas)}`,
    desde: x.actualizada_at ?? x.created_at,
    horas,
    quien: quienEs(datos.narradores, x.narrador_id),
  };
}

/** ¿La voz está narrando ahora? Mientras narra un capítulo no late (14-33 min medidos). */
function vozTrabajando(datos: DatosDelPanel, ahora: Date): boolean {
  return datos.narraciones.some((x) => {
    if (x.estado !== "procesando") return false;
    const horas = horasEntre(x.actualizada_at ?? x.created_at, ahora);
    return horas !== null && horas * 60 <= UMBRALES.vozSinLatidoMinutos;
  });
}

function frenosDeLatido(datos: DatosDelPanel, ahora: Date): Freno[] {
  const frenos: Freno[] = [];
  for (const [servicio, vueltaMs] of Object.entries(VUELTA_MS)) {
    const propios = datos.latidos.filter((l) => l.servicio === servicio);
    // Sin ningún latido no se acusa: la tabla puede estar vacía porque la migración
    // todavía no se aplicó, y eso la pantalla lo dice aparte, no como falla (§ Review Focus 2).
    if (propios.length === 0) continue;

    const ultimo = propios
      .map((l) => Date.parse(l.ultimo_ping))
      .filter((t) => !Number.isNaN(t))
      .sort((a, b) => b - a)[0];
    if (ultimo === undefined) continue;

    const horas = (ahora.getTime() - ultimo) / 3600_000;
    const toleranciaHoras = (vueltaMs * UMBRALES.latidoSinLatearVeces) / 3600_000;
    if (horas <= toleranciaHoras) continue;
    if (servicio === "voz" && vozTrabajando(datos, ahora)) continue;

    frenos.push({
      que: "latido",
      gravedad: "rojo",
      detalle: `Sin latido desde hace ${enHoras(horas)} (${servicio})`,
      desde: new Date(ultimo).toISOString(),
      horas,
      quien: null,
    });
  }
  return frenos;
}

/** Todos los frenos, primero los rojos y adentro el más viejo. */
export function frenosDe(datos: DatosDelPanel, ahora: Date): Freno[] {
  const frenos: Freno[] = [
    ...datos.pedidos.flatMap((p) => [frenoDePago(p, datos, ahora), frenoDeLibroEnCola(p, datos, ahora)]),
    ...datos.narraciones.map((x) => frenoDeVoz(x, datos, ahora)),
    ...datos.narradores.map((n) => frenoDeSilencio(n, ahora)),
    ...frenosDeLatido(datos, ahora),
  ].filter((f): f is Freno => f !== null);

  return frenos.sort((a, b) => {
    if (RANGO[a.gravedad] !== RANGO[b.gravedad]) return RANGO[a.gravedad] - RANGO[b.gravedad];
    return (b.horas ?? -1) - (a.horas ?? -1);
  });
}

export function contarPorGravedad(frenos: Freno[]): Record<Gravedad, number> {
  const cuenta: Record<Gravedad, number> = { rojo: 0, ambar: 0, verde: 0 };
  for (const f of frenos) cuenta[f.gravedad] += 1;
  return cuenta;
}

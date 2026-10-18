import { esPropia, type Historia } from "@/lib/panel";
import { textosComprador, tratoDeRegion, type RegionComprador } from "@/lib/regalo-textos";
import type { Viaje } from "@/lib/viaje";

// El próximo paso de cada tarjeta del Inicio. Vive aparte de page.tsx porque una
// página de Next no puede exportar otra cosa, y así se prueba.

export type Resumen = {
  respondidas: number;
  total: number;
  segundos: number;
  tieneAnticipo: boolean;
  /** Entrevista V3 (10/10): sin guion de 30, sin anticipo, y se cierra eligiendo la tapa. */
  v3?: boolean;
  /** Dudas del escritor sin contestar (CONTRATO, "Escritor V3 en la fábrica"). */
  dudasPendientes?: boolean;
};

/** El aviso de las dudas del escritor (aprobado, 12/10): en el Inicio, en la historia y en Encargar libro. */
export function textoDudas(propia: boolean, comoLeDicen: string, tu: boolean): string {
  const contestalas = tu ? "Contéstalas" : "Contestalas";
  return propia
    ? `Hay dudas sobre lo que contaste. ${contestalas} antes de que se escriba el libro.`
    : `Hay dudas sobre lo que contó ${comoLeDicen}. ${contestalas} antes de que se escriba el libro.`;
}

export function viajeDe(h: Historia): Viaje | null {
  const c = h.narrador.contexto as { modo?: unknown; viaje?: Viaje } | null | undefined;
  return c?.modo === "viaje" && c.viaje?.salida && c.viaje?.vuelta ? c.viaje : null;
}

/**
 * El único próximo paso de una historia, según dónde está. `region` es la de la
 * familia de la historia: decide el trato (vos/tú) de todos los pasos. Sin
 * región, AR.
 */
export function proximoPaso(h: Historia, r: Resumen, region: RegionComprador = "AR"): { href: string; texto: string } | null {
  const id = h.narrador.id;
  const esDuena = h.rol === "duena";
  const propia = esPropia(h.narrador);
  const tu = tratoDeRegion(region) === "tu";
  switch (h.narrador.estado) {
    case "completado":
    case "cerrado_anticipado":
      if (h.rol === "visitante") return { href: `/tablero/${id}/libro`, texto: tu ? "Pide tu copia impresa" : "Pedí tu copia impresa" };
      // Las dudas tienen plazo: pasado el rato de espera el libro se escribe con
      // o sin ellas. Elegir la tapa no vence, así que las dudas van primero.
      if (r.dudasPendientes) {
        return { href: `/tablero/${id}/dudas`, texto: textoDudas(propia && esDuena, h.narrador.como_le_dicen, tu) };
      }
      if (esDuena && r.v3) return { href: `/tablero/${id}/libro`, texto: tu
        ? (propia ? "Ya terminaste de contar. Elige la tapa y encarga tu libro" : "Ya terminó de contar. Elige la tapa y encarga su libro")
        : (propia ? "Ya terminaste de contar. Elegí la tapa y encargá tu libro" : "Ya terminó de contar. Elegí la tapa y encargá su libro") };
      return esDuena
        ? { href: `/tablero/${id}/libro`, texto: tu
          ? (propia ? "Ya terminaste de contar — dale los últimos retoques y encarga tu libro" : "Ya terminó de contar — dale los últimos retoques y encarga su libro")
          : (propia ? "Ya terminaste de contar — dale los últimos retoques y encargá tu libro" : "Ya terminó de contar — dale los últimos retoques y encargá su libro") }
        : { href: `/tablero/${id}`, texto: tu ? "Ya terminó de contar — lee su historia" : "Ya terminó de contar — leé su historia" };
    case "pausado":
      return { href: `/tablero/${id}`, texto: propia ? `Pediste una pausa — ${tu ? "retoma" : "retomá"} cuando quieras` : `Pidió una pausa — ${tu ? "mira" : "mirá"} qué pasó` };
    case "activo":
      if (!r.v3 && r.tieneAnticipo && r.respondidas < 6) return { href: `/tablero/${id}`, texto: tu ? "Ya puedes leer el capítulo 1" : "Ya podés leer el capítulo 1" };
      if (r.respondidas > 0) return { href: `/tablero/${id}`, texto: `${tu ? "Escucha" : "Escuchá"} lo último que ${propia ? "contaste" : "contó"}` };
      return null;
    case "acepto":
    case "invitado":
      if (viajeDe(h)) return { href: `/tablero/${id}`, texto: "Mientras esperás, revisá las etapas y sobre qué te preguntamos" };
      if (r.v3) return { href: `/tablero/${id}`, texto: tu ? "Mientras esperas, suma fotos o una pregunta tuya" : "Mientras esperás, sumá fotos o una pregunta tuya" };
      return { href: `/tablero/${id}?editar=1`, texto: tu ? "Mientras esperas, repasa las preguntas y suma fotos" : "Mientras esperás, repasá las preguntas y sumá fotos" };
    case "regalo_pendiente":
      return esDuena ? { href: `/tablero/${id}/regalo`, texto: textosComprador(tu ? "tu" : "vos").proximoPaso } : null;
    default:
      return null;
  }
}

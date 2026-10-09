import { esPropia, type Historia } from "@/lib/panel";
import { TEXTOS_REGALO } from "@/lib/regalo-textos";
import type { Viaje } from "@/lib/viaje";

// El próximo paso de cada tarjeta del Inicio. Vive aparte de page.tsx porque una
// página de Next no puede exportar otra cosa, y así se prueba.

export type Resumen = {
  respondidas: number;
  total: number;
  segundos: number;
  tieneAnticipo: boolean;
};

export function viajeDe(h: Historia): Viaje | null {
  const c = h.narrador.contexto as { modo?: unknown; viaje?: Viaje } | null | undefined;
  return c?.modo === "viaje" && c.viaje?.salida && c.viaje?.vuelta ? c.viaje : null;
}

/** El único próximo paso de una historia, según dónde está. */
export function proximoPaso(h: Historia, r: Resumen): { href: string; texto: string } | null {
  const id = h.narrador.id;
  const esDuena = h.rol === "duena";
  const propia = esPropia(h.narrador);
  switch (h.narrador.estado) {
    case "completado":
    case "cerrado_anticipado":
      if (h.rol === "visitante") return { href: `/tablero/${id}/libro`, texto: "Pedí tu copia impresa" };
      return esDuena
        ? { href: `/tablero/${id}/libro`, texto: propia ? "Ya terminaste de contar — dale los últimos retoques y encargá tu libro" : "Ya terminó de contar — dale los últimos retoques y encargá su libro" }
        : { href: `/tablero/${id}`, texto: "Ya terminó de contar — leé su historia" };
    case "pausado":
      return { href: `/tablero/${id}`, texto: propia ? "Pediste una pausa — retomá cuando quieras" : "Pidió una pausa — mirá qué pasó" };
    case "activo":
      if (r.tieneAnticipo && r.respondidas < 6) return { href: `/tablero/${id}`, texto: "Ya podés leer el capítulo 1" };
      if (r.respondidas > 0) return { href: `/tablero/${id}`, texto: propia ? "Escuchá lo último que contaste" : "Escuchá lo último que contó" };
      return null;
    case "acepto":
    case "invitado":
      if (viajeDe(h)) return { href: `/tablero/${id}`, texto: "Mientras esperás, revisá las etapas y sobre qué te preguntamos" };
      return { href: `/tablero/${id}?editar=1`, texto: "Mientras esperás, repasá las preguntas y sumá fotos" };
    case "regalo_pendiente":
      return esDuena ? { href: `/tablero/${id}/regalo`, texto: TEXTOS_REGALO.proximoPaso } : null;
    default:
      return null;
  }
}

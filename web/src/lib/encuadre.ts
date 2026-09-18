// Dónde va y cómo se encuadra la foto (3b.6, CONTRATO "Dónde va y cómo se
// encuadra la foto del capítulo", 18/09). Dos campos chicos en `fotos`:
//   posicion: 'arriba' | 'abajo' — solo importa en la principal del capítulo
//             (antes del título, o debajo del título antes del texto).
//   foco:     {x, y} en 0..1 — el punto que queda centrado al recortar al marco
//             (la cara, no el techo). En CSS: object-fit: cover + object-position.
// La fábrica aplica exactamente lo mismo; la miniatura es la vista estimada.

export const POSICIONES = ["arriba", "abajo"] as const;
export type Posicion = (typeof POSICIONES)[number];
export type Foco = { x: number; y: number };

export const FOCO_CENTRO: Foco = { x: 0.5, y: 0.5 };
export const POSICION_DEFAULT: Posicion = "arriba";

export const NOMBRE_POSICION: Record<Posicion, string> = {
  arriba: "Arriba del título",
  abajo: "Debajo del título, antes del texto",
};

export function validarPosicion(valor: unknown): valor is Posicion {
  return typeof valor === "string" && (POSICIONES as readonly string[]).includes(valor);
}

/** Un foco válido es un objeto {x, y} con números entre 0 y 1; se redondea a 3 decimales. */
export function validarFoco(valor: unknown): Foco | null {
  if (!valor || typeof valor !== "object") return null;
  const { x, y } = valor as { x?: unknown; y?: unknown };
  if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y)) return null;
  if (x < 0 || x > 1 || y < 0 || y > 1) return null;
  return { x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 };
}

/** Lo que guarda la base puede venir vacío (fila anterior a la migración) o roto: siempre un foco usable. */
export function focoDe(valor: unknown): Foco {
  return validarFoco(valor) ?? FOCO_CENTRO;
}

/** El valor de `object-position` para ese foco: "50% 50%" es el centro (lo de siempre). */
export function objectPosition(foco: Foco | null | undefined): string {
  const f = foco ?? FOCO_CENTRO;
  return `${Math.round(f.x * 100)}% ${Math.round(f.y * 100)}%`;
}

import type { BloqueHistoriaV3 } from "@/lib/v3";
import type { Momento } from "../tablero/momento";

// Los datos inventados de la muestra del panel (Antonio, contado a medias).
// Vivían en [vista]/page.tsx; salieron tal cual para que la maqueta escondida
// de la portada (/maqueta, el teléfono con la página de su historia) muestre
// lo mismo sin copiarlos. Nada de esto es de una persona real.

export function hoyMas(dias: number): string {
  return new Date(Date.now() + dias * 86_400_000).toISOString().slice(0, 10);
}
export function haceDias(dias: number, hora = "21:10:00"): string {
  return `${hoyMas(-dias)}T${hora}Z`;
}

/** La entrevista V3 de prueba: Antonio, contada a medias. Todo inventado. */
export function bloquesV3(momento: Momento): BloqueHistoriaV3[] {
  if (momento === "antes") return [];
  const r = (id: string, texto: string, duracion: number, dias: number) => ({ id, texto, audio: true, duracion, recibidoAt: haceDias(dias) });
  const bloques: BloqueHistoriaV3[] = [
    {
      nombre: null,
      preguntas: [
        { clave: "OR1", pregunta: "Para empezar, una fácil. ¿Dónde naciste y cómo era la casa en la que creciste?", estado: "contestada", reservada: false, respuestas: [r("r1", "En una casa baja con un patio y un limonero. Mi madre ponía la ropa a secar entre las ramas y olía todo a limón.", 348, 12)] },
      ],
    },
    {
      nombre: "La infancia",
      preguntas: [
        { clave: "CA2", pregunta: "¿Qué recuerdas del camino a la escuela?", estado: "contestada", reservada: false, respuestas: [r("r2", "Íbamos andando con mi hermano, media hora, y en invierno con las manos en los bolsillos del abrigo de mi padre.", 220, 9)] },
        { clave: "CA5", pregunta: "¿Quién te enseñó a montar en bicicleta?", estado: "contestada", reservada: false, respuestas: [r("r3", "El vecino de enfrente, que arreglaba bicicletas en la puerta de su casa. Me caí tres veces el primer día.", 291, 6)] },
      ],
    },
    {
      nombre: "El oficio",
      preguntas: [
        { clave: "OF1", pregunta: "¿Cuál fue tu primer trabajo y cuánto cobrabas?", estado: momento === "marcha" ? "esperando" : "contestada", reservada: false, respuestas: momento === "marcha" ? [] : [r("r4", "Repartía pan por las mañanas antes de clase. Con lo del primer mes me compré unas botas.", 255, 3)] },
      ],
    },
  ];
  return bloques;
}

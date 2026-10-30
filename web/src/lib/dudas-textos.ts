// Los textos de la pantalla de dudas (/tablero/[narradorId]/dudas).
//
// De otra persona (aprobados por Naza el 12/10): le habla de quien contó.
// «Para mí» (la dueña compró el libro para sí, `esPropia`): le habla de lo que
// contó ella, como el resto del panel. Esos textos son PROPUESTOS (15/10) y
// esperan el OK de Naza (docs/pendiente-aprobar-2026-10-15.md).
//
// Ninguno cambia entre vos y tú.

export type TextosPantallaDudas = {
  titulo: string;
  intro: string;
  /** Encima de las citas textuales de cada duda. */
  loQueDijo: string;
  /** Todavía no hay archivo de dudas. */
  sinDudas: string;
  /** El archivo existe pero la lista vino vacía. */
  ningunaDuda: string;
};

/**
 * `paraMi`: el libro es de quien mira (compró «para mí» y es la dueña). Un
 * invitado a una historia propia sigue leyendo en tercera persona: no fue él
 * quien contó.
 */
export function textosPantallaDudas(paraMi: boolean, comoLeDicen: string): TextosPantallaDudas {
  if (paraMi) {
    return {
      titulo: "Dudas sobre lo que contaste",
      intro:
        "Al escuchar tus audios quedaron algunas cosas sin resolver, como un nombre que se oye de dos formas o una fecha que no cierra. Lo que sepas entra al libro. Lo que dejes vacío queda tal como lo contaste.",
      loQueDijo: "Lo que dijiste",
      sinDudas: "Todavía no hay dudas sobre lo que contaste.",
      ningunaDuda: "No quedó ninguna duda. El biógrafo entendió todo lo que contaste.",
    };
  }
  return {
    titulo: `Dudas sobre lo que contó ${comoLeDicen}`,
    intro:
      "Al escuchar los audios quedaron algunas cosas sin resolver, como un nombre que se oye de dos formas o una fecha que no cierra. Lo que sepas entra al libro. Lo que dejes vacío queda tal como lo contó.",
    loQueDijo: "Lo que dijo",
    sinDudas: `Todavía no hay dudas sobre lo que contó ${comoLeDicen}.`,
    ningunaDuda: "No quedó ninguna duda. El biógrafo entendió todo lo que contó.",
  };
}

/**
 * El cartel de cuando ya están todas contestadas (aprobado por Naza el 30/10):
 * el libro no empieza solo, hay que encargarlo. Con el libro ya encargado, que
 * está en camino (sin botón).
 */
export function textoTodasContestadas(encargado: boolean, tu: boolean): { texto: string; boton: string | null } {
  if (encargado) {
    return { texto: "Ya están todas. El libro ya está en camino, te avisamos cuando esté.", boton: null };
  }
  return {
    texto: tu
      ? "Ya están todas. El libro todavía no empezó. Para que empiece, elige la tapa, suma las fotos que falten y toca Encargar."
      : "Ya están todas. El libro todavía no empezó. Para que empiece, elegí la tapa, sumá las fotos que falten y tocá Encargar.",
    boton: "Ir a encargar el libro",
  };
}

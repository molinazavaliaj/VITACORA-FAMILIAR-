// Tipos del escritor v5.5 en la fábrica. El registro y el plan son el JSON que devuelve el
// modelo (esquemas en docs/v5/escritor-v55/receta.md): se tipan como Json porque el código
// portado de los .mjs los lee campo por campo, con `|| []`, igual que el original.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = any;
export type Respuesta = { id: string; pregunta: string; texto: string };
export type PiezaTexto = { pieza: string; texto: string };
export type PiezaEscrita = PiezaTexto & { archivo: string };
export type Problema = { pieza?: string; control: string; tipo: string; frase: string; que: string; [extra: string]: unknown };
export type IdiomaLibro = 'es' | 'ca';

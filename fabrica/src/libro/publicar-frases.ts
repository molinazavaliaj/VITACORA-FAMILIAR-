// Por qué existe: `frases.json` es el contrato entre los tres (la fábrica, el worker de voz y la
// web) y el pedido de corte es la forma de encolarlo sin abrir un puerto ni esperar a nadie: el
// worker sondea el paquete, igual que sondeaba la tabla `narraciones`. Nada de esto toca la base:
// vive en el paquete del narrador, al lado de `estructura.json` y `narracion.json`.
import { obtenerClienteDb } from '../db.js';
import { descargarTextoOpcional, subirTexto } from './comun.js';
import type { FrasesJson } from './frases.js';

type Db = ReturnType<typeof obtenerClienteDb>;

export const RUTA_FRASES_JSON = (narradorId: string) => `${narradorId}/paquete/frases.json`;
/** El pedido de corte: su presencia es "hay frases para cortar"; el worker lo borra al terminar. */
export const RUTA_FRASES_PEDIDO = (narradorId: string) => `${narradorId}/paquete/frases_pedido.txt`;

/** Cuántas frases hay que cortar (elegidas + alternativas del panel). */
export const FRASES_CON_AUDIO = (frases: FrasesJson): number =>
  frases.capitulos.reduce((total, capitulo) => total + capitulo.candidatas.length, 0);

/** Deja el archivo y, si hay algo que cortar, el pedido. Idempotente: se puede volver a correr. */
export async function publicarFrases(db: Db, frases: FrasesJson): Promise<void> {
  await subirTexto(db, RUTA_FRASES_JSON(frases.narrador_id), JSON.stringify(frases, null, 2), 'application/json');
  if (FRASES_CON_AUDIO(frases) > 0) {
    await subirTexto(db, RUTA_FRASES_PEDIDO(frases.narrador_id), new Date().toISOString(), 'text/plain');
  }
}

/** Lee el archivo del paquete. Un archivo roto devuelve null: no puede tumbar la entrega. */
export async function leerFrases(db: Db, narradorId: string): Promise<FrasesJson | null> {
  const texto = await descargarTextoOpcional(db, RUTA_FRASES_JSON(narradorId));
  if (texto === null) return null;
  try {
    return JSON.parse(texto) as FrasesJson;
  } catch {
    return null;
  }
}

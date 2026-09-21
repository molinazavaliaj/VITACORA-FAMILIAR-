// El mapa de cerebros: qué robot trabaja, qué hace y dónde se cortó la cadena.
//
// Los 14 nodos son los del mockup (docs/panel-interno.html), y salen SIEMPRE los 14: un
// robot que nunca se usó aparece gris punteado ("sin_uso"), y eso NO es un freno — una caja
// gris no es una caja roja. Rojo ("frenado") es sólo cuando hay trabajo esperando a ese
// robot y el robot no dio señales.
//
// De dónde sale el "cuándo" de cada nodo:
// - el carril de la entrevista y el del libro, de la última fila de `consumo_ia` de sus pasos;
// - el carril de la voz, de `narraciones` (no deja consumo: es GPU propia, USD 0);
// - "Llega el audio del abuelo", del último audio recibido.

import type { DatosDelPanel } from "./datos";
import { horasEntre, UMBRALES } from "./frenos";

export type EstadoNodo = "trabajando" | "quieto" | "frenado" | "sin_uso";
export type Carril = "entrevista" | "libro" | "voz";

export type Nodo = {
  carril: Carril;
  nombre: string;
  modelo: string;
  queHace: string;
  estado: EstadoNodo;
  cuando: string | null;
};

/** Si un robot dio señales dentro de estas horas, está trabajando. Si no, está quieto
 *  (o frenado, si hay trabajo esperándolo). */
const TRABAJANDO_HORAS = 6;

type Definicion = {
  carril: Carril;
  nombre: string;
  modelo: string;
  queHace: string;
  /** Los pasos de `consumo_ia` que deja este robot (vacío = no llama a ningún modelo pago). */
  pasos?: string[];
  /** Los nodos de la voz se miran en `narraciones`. */
  deNarraciones?: "creada" | "avance" | "terminada";
  /** El último audio que llegó (no hay modelo: lo manda el narrador por WhatsApp). */
  deRespuestas?: boolean;
  /** El último pedido con PDF armado. */
  dePdf?: boolean;
  /** ¿Hay trabajo esperando a este robot? Sólo esto lo puede poner rojo. */
  pendiente?: (datos: DatosDelPanel, ahora: Date) => boolean;
};

const hayRespuestasSinTranscribir = (datos: DatosDelPanel, ahora: Date): boolean =>
  datos.respuestas.some((r) => {
    const horas = horasEntre(r.recibido_at, ahora);
    return !r.transcripcion && horas !== null && horas > TRABAJANDO_HORAS;
  });

const hayPedidoPagoSinTomar = (datos: DatosDelPanel, ahora: Date): boolean =>
  datos.pedidos.some((p) => {
    if (p.estado !== "pagado") return false;
    const horas = horasEntre(p.created_at, ahora);
    return horas !== null && horas > UMBRALES.libroSinArrancarHoras;
  });

const hayVozTrabada = (datos: DatosDelPanel, ahora: Date): boolean =>
  datos.narraciones.some((x) => {
    if (x.estado !== "procesando") return false;
    const horas = horasEntre(x.actualizada_at ?? x.created_at, ahora);
    return horas !== null && horas > UMBRALES.vozSinAvanceHoras;
  });

// Los 14 del mockup, en el orden en que se leen (los tres carriles, de arriba abajo).
const DEFINICIONES: Definicion[] = [
  {
    carril: "entrevista", nombre: "Llega el audio del abuelo", modelo: "", deRespuestas: true,
    queHace: "El narrador contesta por WhatsApp: el audio entra a la base",
  },
  {
    carril: "entrevista", nombre: "Lo pasa a texto", modelo: "gpt-transcribe", pasos: ["transcribir"],
    queHace: "Convierte el audio en texto para poder entenderlo",
    pendiente: hayRespuestasSinTranscribir,
  },
  {
    carril: "entrevista", nombre: "Decide si alcanza", modelo: "claude-opus-5",
    pasos: ["evaluar", "adaptativas", "intencion", "reserva", "reemplazo", "no_tuvo"],
    queHace: "Juzga si lo que contó alcanza y qué conviene repreguntar",
  },
  {
    carril: "entrevista", nombre: "Escribe la pregunta", modelo: "claude-haiku-4-5",
    pasos: ["personalizar", "personalizar_viaje", "resumenes", "sugeridas", "trato"],
    queHace: "Redacta la pregunta del día con las palabras de esa familia",
  },
  {
    carril: "entrevista", nombre: "La dice en voz alta", modelo: "gpt-4o-mini-tts", pasos: ["voz_pregunta"],
    queHace: "Pone la pregunta en audio para mandarla por WhatsApp",
  },
  {
    carril: "libro", nombre: "Arma el plan", modelo: "claude-fable-5", pasos: ["estructura"],
    queHace: "Decide los capítulos y en qué orden va la historia",
    pendiente: hayPedidoPagoSinTomar,
  },
  {
    carril: "libro", nombre: "Escribe el primer pedazo", modelo: "claude-fable-5", pasos: ["anticipo"],
    queHace: "Escribe el adelanto que se le muestra a la familia",
  },
  {
    carril: "libro", nombre: "Escribe los capítulos", modelo: "claude-fable-5", pasos: ["capitulo"],
    queHace: "Escribe el libro, capítulo por capítulo",
  },
  {
    carril: "libro", nombre: "Pasa el editor", modelo: "claude-fable-5", pasos: ["editor"],
    queHace: "Relee y corrige lo escrito antes de armarlo",
  },
  {
    carril: "libro", nombre: "Arma el PDF", modelo: "", dePdf: true,
    queHace: "Junta el texto y las fotos en el libro listo para imprimir",
  },
  {
    carril: "voz", nombre: "Pide las frases", modelo: "", deNarraciones: "creada",
    queHace: "Le pide a tu computadora que narre el libro con la voz clonada",
  },
  {
    carril: "voz", nombre: "Las ubica en el audio", modelo: "whisper", deNarraciones: "avance",
    queHace: "Encuentra en el audio dónde empieza y termina cada frase",
    pendiente: hayVozTrabada,
  },
  {
    carril: "voz", nombre: "Las corta y empareja", modelo: "qwen3tts", deNarraciones: "avance",
    queHace: "Corta cada frase y empareja el volumen de todo el libro",
    pendiente: hayVozTrabada,
  },
  {
    carril: "voz", nombre: "Les pone el QR", modelo: "", deNarraciones: "terminada",
    queHace: "Marca en el libro impreso dónde va cada código para oírlo",
  },
];

const masNuevo = (fechas: (string | null)[]): string | null => {
  const validas = fechas
    .filter((f): f is string => !!f)
    .map((f) => ({ iso: f, t: Date.parse(f) }))
    .filter((f) => !Number.isNaN(f.t));
  if (validas.length === 0) return null;
  return validas.sort((a, b) => b.t - a.t)[0].iso;
};

function cuandoDe(def: Definicion, datos: DatosDelPanel): string | null {
  if (datos.narraciones.length === 0 && datos.respuestas.length === 0 && datos.consumo.length === 0 && datos.pedidos.length === 0) {
    return null;
  }
  if (def.pasos?.length) {
    return masNuevo(datos.consumo.filter((c) => def.pasos!.includes(c.paso)).map((c) => c.fecha));
  }
  if (def.deRespuestas) return masNuevo(datos.respuestas.map((r) => r.recibido_at));
  if (def.deNarraciones === "creada") return masNuevo(datos.narraciones.map((x) => x.created_at));
  if (def.deNarraciones === "avance") return masNuevo(datos.narraciones.map((x) => x.actualizada_at ?? x.created_at));
  if (def.deNarraciones === "terminada") {
    return masNuevo(datos.narraciones.filter((x) => x.estado === "lista").map((x) => x.actualizada_at ?? x.created_at));
  }
  // La tabla de pedidos no guarda CUÁNDO se armó el PDF: de este nodo se sabe si alguna
  // vez se armó, no cuándo. Se dice así en la pantalla en vez de inventar una fecha.
  return null;
}

export function mapaDeCerebros(datos: DatosDelPanel, ahora: Date): Nodo[] {
  return DEFINICIONES.map((def) => {
    const cuando = cuandoDe(def, datos);
    const horas = cuando === null ? null : horasEntre(cuando, ahora);

    let estado: EstadoNodo;
    if (def.dePdf) {
      // Sin fecha no se puede decir "trabajando": o nunca se armó (gris) o ya se armó (quieto).
      estado = datos.pedidos.some((p) => !!p.libro_pdf_path) ? "quieto" : "sin_uso";
    } else if (horas !== null && horas <= TRABAJANDO_HORAS) {
      estado = "trabajando";
    } else if (def.pendiente?.(datos, ahora)) {
      // Va antes que `sin_uso`: un robot que nunca corrió pero tiene trabajo esperándolo
      // es justo "acá se cortó la cadena", y tiene que verse rojo, no gris.
      estado = "frenado";
    } else if (cuando === null) {
      estado = "sin_uso";
    } else {
      estado = "quieto";
    }

    return {
      carril: def.carril,
      nombre: def.nombre,
      modelo: def.modelo,
      queHace: def.queHace,
      estado,
      cuando,
    };
  });
}

/**
 * ¿Está viva la computadora que narra? No alcanza con el latido: mientras narra un capítulo
 * no late (14-33 minutos medidos), así que también cuenta que la narración haya avanzado.
 * Sin ningún dato NO se la declara caída: no se acusa a la máquina sin evidencia.
 */
export function livenessDeLaVoz(
  datos: DatosDelPanel,
  ahora: Date,
): { viva: boolean; porque: string } {
  const latido = datos.latidos.find((l) => l.servicio === "voz") ?? null;
  if (!latido) {
    return { viva: true, porque: "Todavía no hay latido suyo: no se puede saber si está viva." };
  }

  const minutosDeLatido = (horasEntre(latido.ultimo_ping, ahora) ?? Infinity) * 60;
  if (minutosDeLatido <= UMBRALES.vozSinLatidoMinutos) {
    return { viva: true, porque: `Latió hace ${Math.round(minutosDeLatido)} minutos.` };
  }

  const avanzando = datos.narraciones.find((x) => {
    if (x.estado !== "procesando") return false;
    const minutos = (horasEntre(x.actualizada_at ?? x.created_at, ahora) ?? Infinity) * 60;
    return minutos <= UMBRALES.vozSinLatidoMinutos;
  });
  if (avanzando) {
    return {
      viva: true,
      porque: "Está narrando: la narración avanzó hace unos minutos (mientras narra no late).",
    };
  }

  if (datos.narraciones.length === 0) {
    return {
      viva: true,
      porque: `No late desde hace ${Math.round(minutosDeLatido)} minutos y no tiene trabajo: puede estar apagada.`,
    };
  }

  return {
    viva: false,
    porque: `No late desde hace ${Math.round(minutosDeLatido / 60)} horas y ninguna narración avanzó.`,
  };
}

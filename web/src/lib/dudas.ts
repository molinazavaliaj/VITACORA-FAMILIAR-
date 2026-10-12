// Las dudas del escritor V3 (CONTRATO, "Escritor V3 en la fábrica"). La Etapa A
// deja en `{narrador}/escritor/dudas-familia.json` lo que no pudo resolver de los
// audios —un nombre que se oye de dos formas, un año que no cierra— y la familia
// lo contesta acá. Lo que se guarda va a `{narrador}/escritor/correcciones.json`,
// que la Etapa B lee antes de escribir el libro.
//
// El plazo manda: la fábrica espera ESCRITOR_ESPERA_DUDAS_HORAS desde el mail de
// dudas y después escribe igual, con o sin correcciones. Esto es lo puro: qué se
// puede guardar, cómo se junta con lo que ya había y cuánto tiempo queda. Sin red.

import { esZonaValida } from "./horario";
import { zonaDeRegion, type Region } from "./registro";

/** Lo que la fábrica escribe en `dudas-familia.json`. Solo `id` y `pregunta` se muestran siempre. */
export type DudaFamilia = {
  id: string;
  pregunta: string;
  tipo?: string;
  /** Qué quedó sin resolver, en palabras del escritor. */
  que?: string;
  /** Las respuestas del narrador de donde salió la duda. */
  ids?: string[];
  citas?: { id: string; texto: string }[];
  /** Si vienen, se ofrecen como botones; el campo libre queda igual. */
  opciones?: string[];
};

/**
 * Una respuesta de la familia, como queda en `correcciones.json`. La fábrica lee
 * solo `dudaId` y `texto`; el resto es nuestro. `quien` es el nombre de la
 * persona y se les muestra a los otros familiares: solo está si la base lo tiene.
 * `mail` es para los socios y nunca sale al navegador.
 */
export type CorreccionFamilia = {
  dudaId: string;
  texto: string;
  quien?: string;
  mail?: string;
  cuando?: string;
};

/**
 * Lo que manda el formulario por cada duda que cambió. `borrar` marca que el
 * familiar vació un campo que tenía texto (una vacía sin esa marca es un campo
 * sin tocar); `antes` es el texto que tenía cuando la abrió.
 */
export type PedidoRespuesta = { dudaId: string; texto: string; borrar?: true; antes?: string };

/**
 * Lo que espera la fábrica si `ESCRITOR_ESPERA_DUDAS_HORAS` no está. La web lee
 * la misma variable (`horasPlazoDudas`): en Vercel tiene que valer lo mismo que
 * en Railway, o la pantalla promete un plazo que no es el de la fábrica.
 */
export const HORAS_PLAZO_DUDAS = 24;

/** Como `esperaPorDudasMs` de la fábrica: 24 por defecto, 0 vale (no espera), basura es 24. */
export function horasPlazoDudas(valor: string | undefined = process.env.ESCRITOR_ESPERA_DUDAS_HORAS): number {
  const h = Number(valor ?? HORAS_PLAZO_DUDAS);
  return Number.isFinite(h) && h >= 0 ? h : HORAS_PLAZO_DUDAS;
}

/** Una respuesta de persona: se corta, no se rechaza. Perder lo que escribió es peor que guardarlo largo. */
const LARGO_MAXIMO = 2000;

export type EstadoPlazo = {
  /** `abierto`: se puede contestar. `vencido`: pasó el plazo pero el libro no salió. `libro_escrito`: ya no sirve. */
  estado: "abierto" | "vencido" | "libro_escrito";
  /** Cuándo deja de servir contestar. Null si no sabemos desde cuándo corre. */
  venceAt: Date | null;
};

/**
 * Hasta cuándo sirve contestar. `avisadasAt` es el contenido de `dudas-avisadas.txt`
 * (cuándo salió el mail): sin esa fecha no se inventa un plazo, porque mostrar una
 * cuenta regresiva equivocada es peor que no mostrar ninguna.
 *
 * Que el plazo haya vencido no cierra la pantalla: mientras el libro no esté escrito,
 * lo que la familia conteste todavía puede entrar (la fábrica reintenta si el mail falló).
 */
export function estadoDelPlazo(
  avisadasAt: string | null,
  libroEscrito: boolean,
  ahora: Date = new Date(),
  horas: number = horasPlazoDudas(),
): EstadoPlazo {
  if (libroEscrito) return { estado: "libro_escrito", venceAt: null };

  const desde = avisadasAt ? Date.parse(avisadasAt.trim()) : NaN;
  if (!Number.isFinite(desde)) return { estado: "abierto", venceAt: null };

  const venceAt = new Date(desde + horas * 3600_000);
  return { estado: ahora >= venceAt ? "vencido" : "abierto", venceAt };
}

/**
 * Valida lo que manda el formulario contra las dudas que existen de verdad.
 *
 * Un `dudaId` inventado se rechaza entero: el archivo lo lee la fábrica para
 * corregir el libro, y una corrección que no apunta a ninguna duda no se sabe
 * dónde aplicar. Las vacías se descartan en silencio (es un campo sin tocar),
 * salvo que vengan con `borrar`. Si la misma duda viene dos veces, gana la última.
 * Lo que diga el navegador sobre quién contesta no se usa: lo pone el servidor.
 */
export function validarCorreccionesFamilia(
  valor: unknown,
  dudas: DudaFamilia[],
): { ok: true; correcciones: PedidoRespuesta[] } | { ok: false; mensaje: string } {
  if (!Array.isArray(valor)) {
    return { ok: false, mensaje: "Las respuestas tienen que ser una lista." };
  }
  if (valor.length > dudas.length * 2 + 10) {
    return { ok: false, mensaje: "Llegaron más respuestas de las que hay dudas." };
  }

  const idsValidos = new Set(dudas.map((d) => d.id));
  const porDuda = new Map<string, PedidoRespuesta>();

  for (const item of valor) {
    if (typeof item !== "object" || item === null) {
      return { ok: false, mensaje: "Cada respuesta tiene que decir a qué duda contesta." };
    }
    const { dudaId, texto, borrar, antes } = item as { dudaId?: unknown; texto?: unknown; borrar?: unknown; antes?: unknown };
    if (typeof dudaId !== "string" || typeof texto !== "string") {
      return { ok: false, mensaje: "Cada respuesta tiene que decir a qué duda contesta." };
    }
    if (!idsValidos.has(dudaId)) {
      return { ok: false, mensaje: "Una de las respuestas no corresponde a ninguna duda." };
    }
    const limpio = texto.trim().slice(0, LARGO_MAXIMO);
    const conAntes = typeof antes === "string" ? { antes: antes.trim().slice(0, LARGO_MAXIMO) } : {};
    if (limpio === "") {
      if (borrar === true) porDuda.set(dudaId, { dudaId, texto: "", borrar: true, ...conAntes });
      continue; // campo sin tocar
    }
    porDuda.set(dudaId, { dudaId, texto: limpio, ...conAntes });
  }

  return { ok: true, correcciones: [...porDuda.values()] };
}

const dudaIdDe = (c: unknown): string | null =>
  typeof c === "object" && c !== null && typeof (c as { dudaId?: unknown }).dudaId === "string"
    ? (c as { dudaId: string }).dudaId
    : null;

const textoDe = (c: unknown): string =>
  typeof c === "object" && c !== null && typeof (c as { texto?: unknown }).texto === "string"
    ? (c as { texto: string }).texto.trim()
    : "";

/**
 * Junta lo que ya estaba en `correcciones.json` con lo que manda un familiar.
 * Dos familiares pueden estar contestando a la vez: el archivo nunca se arma
 * solo con lo que mandó uno.
 *
 * - Lo que no viene en el pedido queda como estaba.
 * - Las de los socios (sin `dudaId`, o con uno que no está en las dudas) no se tocan nunca.
 * - Si el texto no cambió, se conservan `quien` y `cuando` de quien la contestó.
 * - Una borrada se saca solo si sigue diciendo lo que el familiar vio al abrir la
 *   pantalla (`antes`): si otro la cambió mientras tanto, gana el cambio.
 */
export function fusionarCorrecciones(
  guardadas: unknown[],
  pedidos: PedidoRespuesta[],
  dudas: DudaFamilia[],
  autor: { quien?: string; mail?: string },
  ahora: Date = new Date(),
): unknown[] {
  const idsDudas = new Set(dudas.map((d) => d.id));
  let lista = [...guardadas];

  for (const p of pedidos) {
    if (!idsDudas.has(p.dudaId)) continue; // validarCorreccionesFamilia ya los rechaza; por las dudas
    const actuales = lista.filter((c) => dudaIdDe(c) === p.dudaId);
    const actual = actuales[actuales.length - 1];

    if (p.borrar) {
      if (actual !== undefined && (p.antes === undefined || textoDe(actual) === p.antes.trim())) {
        lista = lista.filter((c) => dudaIdDe(c) !== p.dudaId);
      }
      continue;
    }
    if (actual !== undefined && textoDe(actual) === p.texto) continue; // sin cambios

    lista = lista.filter((c) => dudaIdDe(c) !== p.dudaId);
    lista.push({
      dudaId: p.dudaId,
      texto: p.texto,
      ...(autor.quien ? { quien: autor.quien } : {}),
      ...(autor.mail ? { mail: autor.mail } : {}),
      cuando: ahora.toISOString(),
    });
  }

  return lista;
}

/**
 * `dudas-familia.json` leído. Null si está roto (no es JSON, o `dudas` no es una
 * lista): la pantalla lo muestra como error, no como "no hay dudas". Una duda
 * sin `id` o sin `pregunta` no se puede mostrar ni contestar: se saltea.
 */
export function leerDudas(texto: string): DudaFamilia[] | null {
  let j: unknown;
  try {
    j = JSON.parse(texto);
  } catch {
    return null;
  }
  if (typeof j !== "object" || j === null) return null;
  const lista = (j as { dudas?: unknown }).dudas ?? [];
  if (!Array.isArray(lista)) return null;
  return lista.filter(
    (d): d is DudaFamilia =>
      typeof d === "object" && d !== null && typeof (d as DudaFamilia).id === "string" && typeof (d as DudaFamilia).pregunta === "string",
  );
}

/**
 * `correcciones.json` leído como lo lee la fábrica (`leerCorrecciones`): un
 * objeto con la lista `correcciones`, o la lista sola. Se devuelven las entradas
 * tal cual, para volver a escribir intactas las de los socios. Null si está roto.
 */
export function leerCorreccionesGuardadas(texto: string): unknown[] | null {
  let j: unknown;
  try {
    j = JSON.parse(texto);
  } catch {
    return null;
  }
  const lista = Array.isArray(j) ? j : typeof j === "object" && j !== null ? (j as { correcciones?: unknown }).correcciones : null;
  return Array.isArray(lista) ? lista : null;
}

/** Lo guardado, por duda, para precargar el formulario y mostrar quién contestó. Gana la última. */
export function correccionesPorDuda(correcciones: unknown[]): Map<string, CorreccionFamilia> {
  const mapa = new Map<string, CorreccionFamilia>();
  for (const c of correcciones ?? []) {
    const id = dudaIdDe(c);
    if (id !== null && typeof (c as { texto?: unknown }).texto === "string") mapa.set(id, c as CorreccionFamilia);
  }
  return mapa;
}

/** ¿Queda alguna duda sin una respuesta con texto? Las de los socios sin `dudaId` no cuentan. */
export function hayDudasSinContestar(dudas: DudaFamilia[], correcciones: unknown[]): boolean {
  const porDuda = correccionesPorDuda(correcciones);
  return dudas.some((d) => (porDuda.get(d.id)?.texto ?? "").trim() === "");
}

/**
 * La zona en la que se muestran las fechas de esta pantalla. La página corre en
 * Vercel (UTC): sin zona explícita, la hora sale corrida. La del narrador si es
 * válida; si no, la de la región de la familia; si no, Argentina.
 */
export function zonaParaFechas(zonaNarrador: string | null | undefined, region: Region | null | undefined): string {
  if (esZonaValida(zonaNarrador)) return zonaNarrador;
  return zonaDeRegion(region === "ES" ? "ES" : "AR");
}

/** "martes 13, 14:00": el día de la semana, el número y la hora en esa zona. */
export function fechaDelPlazo(venceAt: Date, zona: string): string {
  return venceAt.toLocaleString("es-AR", {
    weekday: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: zona,
  });
}

/**
 * La fecha de una respuesta guardada, en esa zona. Se arma en el servidor y
 * llega armada al formulario: así el HTML del servidor y el del navegador dicen
 * lo mismo (sin hydration mismatch). Null si la fecha no se entiende.
 */
export function fechaDeRespuesta(cuando: string | undefined, zona: string): string | null {
  const t = cuando ? Date.parse(cuando) : NaN;
  if (!Number.isFinite(t)) return null;
  return new Date(t).toLocaleDateString("es-AR", { timeZone: zona });
}

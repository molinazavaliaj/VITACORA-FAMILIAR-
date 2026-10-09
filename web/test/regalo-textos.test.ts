import { describe, expect, it } from "vitest";
import {
  TEXTOS_REGALO,
  idiomaPorDefecto,
  textosAbuelo,
  textosComprador,
  tratoDeRegion,
  type IdiomaRegalo,
  type TratoComprador,
} from "@/lib/regalo-textos";

// Copias literales de los textos aprobados por Naza (es-AR / vos). No cambian ni una letra.
const ABUELO_AR = {
  tapaSlogan: "En cada familia hay un libro sin escribir.",
  esUnRegalo: "Esto es un regalo.",
  explica: [
    "Un biógrafo te va a hacer preguntas sobre tu vida por WhatsApp.",
    "Vos le contestás con audios, cuando puedas.",
    "Con lo que le cuentes se escribe el libro de tu vida.",
  ],
  apunta: "Apuntá la cámara del celular acá para empezar.",
  respaldo: "Si la cámara no te anda, mandá un WhatsApp al +54 9 11 1234-5678 con este código.",
  titulo: "Rosa, Lucía te hizo un regalo.",
  empezar: "Empezar",
  mensajeWhatsApp: "Hola, quiero empezar mi libro. VF-7K3M2Q",
  yaEmpezo: "Este regalo ya está en marcha. Para seguir, escribile al biógrafo por WhatsApp.",
  escucharAudioDe: "Escuchar el audio de Lucía",
};

const COMPRADOR_VOS = {
  mailAsunto: "Tu regalo para abuela está listo",
  mailCuerpo:
    "Ya podés descargar la tarjeta. Imprimila o mandala por WhatsApp. Cuando abuela la escanee, empieza su entrevista y lo vas a ver en tu tablero.",
  mailBoton: "Ver la tarjeta",
  estadoPanel: "Esperando que abra su regalo",
  estadoCorto: "esperando que abra el regalo",
  proximoPaso: "Descargá la tarjeta del regalo",
  botonImprimir: "Imprimir o guardar en PDF",
  botonImagen: "Descargar la imagen para WhatsApp",
  aQuien: "¿A quién se lo regalás?",
  comoLeDecis: "¿Cómo le decís?",
  comoLeDecisPista: "abuelo, papá, su nombre",
  genero: "¿Es hombre o mujer? Lo necesita el biógrafo para hablarle bien.",
  generos: { varon: "Hombre", mujer: "Mujer", otro: "Prefiero no decirlo" },
  tuMensaje: "Tu mensaje para la tarjeta",
  audio: "Si querés, grabale un audio. Lo escucha cuando escanea la tarjeta.",
  cuando: "¿Cuándo se lo vas a dar? (opcional)",
  tuNombre: "Tu nombre, como va a aparecer en la tarjeta",
  queEsTuyo: "¿Qué es tuyo?",
  queEsTuyoPista: "nieta, hijo…",
  tuCorreo: "Tu correo. Ahí te llega la tarjeta.",
  botonPagar: "Pagar y descargar la tarjeta",
  tituloPagina: "Regalar el libro",
  pasos: ["A quién", "Tu mensaje", "Tus datos", "Pagar"],
  contador: "3/280",
  grabar: "Grabar",
  parar: "Parar",
  escuchar: "Escuchar",
  borrar: "Borrar",
  elegirAudio: "Elegí un audio",
  audioNoSirve: "No pudimos usar ese audio. Probá grabarlo de nuevo.",
  atras: "Atrás",
  seguir: "Seguir",
  unMomento: "Un momento…",
  faltaNombre: "Falta su nombre.",
  faltaComoLeDecis: "Falta cómo le decís.",
  faltaGenero: "Falta elegir si es hombre o mujer.",
  faltaMensaje: "Falta tu mensaje para la tarjeta.",
  faltaTuNombre: "Falta tu nombre.",
  faltaQueEsTuyo: "Falta qué es tuyo.",
  correoMal: "Ese correo parece mal escrito. Revisalo, ahí te llega la tarjeta.",
  errorPago: "No pudimos ir al pago. Probá de nuevo.",
  yaCompre: "Ya compré · Entrar",
  pagoSeguro: "Pago único y seguro con Mercado Pago. Al pagar aceptás los",
  terminos: "términos",
};

const CLAVES_ABUELO = [
  "tapaSlogan",
  "esUnRegalo",
  "explica",
  "apunta",
  "respaldo",
  "titulo",
  "empezar",
  "mensajeWhatsApp",
  "yaEmpezo",
  "escucharAudioDe",
].sort();

// Llama a las funciones con argumentos fijos, así todo queda en strings comparables.
function aplanar(t: Record<string, unknown>): Record<string, unknown> {
  const fuera: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(t)) {
    if (typeof v !== "function") {
      fuera[k] = v;
      continue;
    }
    const f = v as (...a: unknown[]) => string;
    switch (k) {
      case "respaldo":
        fuera[k] = f("+54 9 11 1234-5678");
        break;
      case "titulo":
        fuera[k] = f("Rosa", "Lucía");
        break;
      case "mensajeWhatsApp":
        fuera[k] = f("VF-7K3M2Q");
        break;
      case "escucharAudioDe":
        fuera[k] = f("Lucía");
        break;
      case "mailAsunto":
      case "mailCuerpo":
        fuera[k] = f("abuela");
        break;
      case "contador":
        fuera[k] = f(3, 280);
        break;
      case "pagoSeguro":
        fuera[k] = f("Mercado Pago");
        break;
      default:
        throw new Error(`Función sin argumentos de prueba: ${k}`);
    }
  }
  return fuera;
}

function todosLosStrings(v: unknown): string[] {
  if (typeof v === "string") return [v];
  if (Array.isArray(v)) return v.flatMap(todosLosStrings);
  if (v && typeof v === "object") return Object.values(v).flatMap(todosLosStrings);
  return [];
}

const IDIOMAS: IdiomaRegalo[] = ["es-AR", "es-ES", "ca"];
const TRATOS: TratoComprador[] = ["vos", "tu"];
// \b de JS no ve las letras con tilde: se usan lookarounds de letra Unicode.
const PALABRAS_DE_VOS =
  /(?<!\p{L})(vos|querés|contás|mandá|apuntá|decís|podés|aceptás|probá|revisalo|elegí|grabale|descargá|regalás|imprimila|mandala)(?!\p{L})/iu;

describe("textos del regalo: es-AR y vos quedan como los aprobó Naza", () => {
  it("textosAbuelo('es-AR') es exactamente lo aprobado", () => {
    expect(aplanar(textosAbuelo("es-AR"))).toEqual(ABUELO_AR);
  });

  it("textosComprador('vos') es lo aprobado, más la pregunta del idioma", () => {
    const { idioma, idiomas, ...resto } = aplanar(textosComprador("vos")) as Record<string, unknown>;
    expect(resto).toEqual(COMPRADOR_VOS);
    expect(idioma).toBe("¿En qué idioma le hablamos?");
    expect(idiomas).toEqual({
      "es-AR": "Castellano de Argentina",
      "es-ES": "Castellano de España",
      ca: "Català",
    });
  });

  it("TEXTOS_REGALO sigue siendo abuelo es-AR más comprador vos", () => {
    expect(aplanar(TEXTOS_REGALO)).toEqual({
      ...ABUELO_AR,
      ...COMPRADOR_VOS,
      idioma: "¿En qué idioma le hablamos?",
      idiomas: { "es-AR": "Castellano de Argentina", "es-ES": "Castellano de España", ca: "Català" },
    });
  });
});

describe("textos del regalo: las mismas claves en todos los idiomas y tratos", () => {
  it("el abuelo tiene sus 10 claves en los 3 idiomas, sin strings vacíos", () => {
    for (const idioma of IDIOMAS) {
      const t = aplanar(textosAbuelo(idioma));
      expect(Object.keys(t).sort()).toEqual(CLAVES_ABUELO);
      for (const s of todosLosStrings(t)) expect(s.trim()).not.toBe("");
    }
  });

  it("vos y tú tienen las mismas claves, sin strings vacíos", () => {
    const vos = aplanar(textosComprador("vos"));
    const tu = aplanar(textosComprador("tu"));
    expect(Object.keys(tu).sort()).toEqual(Object.keys(vos).sort());
    expect(Object.keys(tu.generos as object).sort()).toEqual(Object.keys(vos.generos as object).sort());
    expect((tu.pasos as string[]).length).toBe((vos.pasos as string[]).length);
    for (const s of todosLosStrings(tu)) expect(s.trim()).not.toBe("");
  });

  it("ninguna clave del abuelo está en el comprador ni al revés", () => {
    const comprador = Object.keys(textosComprador("vos"));
    for (const k of CLAVES_ABUELO) expect(comprador).not.toContain(k);
  });
});

describe("textos del regalo: es-ES, ca y tú no hablan de vos", () => {
  it("el filtro de vos agarra las formas con tilde y deja pasar las de tú", () => {
    expect("mandá un WhatsApp").toMatch(PALABRAS_DE_VOS);
    expect("Probá de nuevo.").toMatch(PALABRAS_DE_VOS);
    expect("Revisalo, ahí te llega.").toMatch(PALABRAS_DE_VOS);
    expect("Vos le contestás").toMatch(PALABRAS_DE_VOS);
    expect("manda un WhatsApp").not.toMatch(PALABRAS_DE_VOS);
    expect("Prueba de nuevo.").not.toMatch(PALABRAS_DE_VOS);
    expect("Revísalo, ahí te llega.").not.toMatch(PALABRAS_DE_VOS);
  });

  it("ningún texto nuevo usa formas de vos", () => {
    const nuevos = [
      ...todosLosStrings(aplanar(textosAbuelo("es-ES"))),
      ...todosLosStrings(aplanar(textosAbuelo("ca"))),
      ...todosLosStrings(aplanar(textosComprador("tu"))),
    ];
    for (const s of nuevos) expect(s).not.toMatch(PALABRAS_DE_VOS);
  });

  it("ningún texto nuevo usa dos puntos ni «usted», y España dice móvil", () => {
    const nuevos = [
      ...todosLosStrings(aplanar(textosAbuelo("es-ES"))),
      ...todosLosStrings(aplanar(textosAbuelo("ca"))),
      ...todosLosStrings(aplanar(textosComprador("tu"))),
    ];
    for (const s of nuevos) {
      expect(s).not.toMatch(/:/);
      expect(s).not.toMatch(/\busted\b/i);
      expect(s).not.toMatch(/celular/i);
    }
  });

  it("el WhatsApp en catalán termina en el código", () => {
    expect(textosAbuelo("ca").mensajeWhatsApp("VF-7K3M2Q")).toMatch(/VF-7K3M2Q$/);
    expect(textosAbuelo("es-ES").mensajeWhatsApp("VF-7K3M2Q")).toMatch(/VF-7K3M2Q$/);
  });

  it("el abuelo de España y el catalán dicen lo propuesto", () => {
    expect(textosAbuelo("es-ES").apunta).toBe("Apunta la cámara del móvil aquí para empezar.");
    expect(textosAbuelo("es-ES").titulo("Rosa", "Lucía")).toBe("Rosa, Lucía te ha hecho un regalo.");
    expect(textosAbuelo("ca").tapaSlogan).toBe("A cada família hi ha un llibre per escriure.");
    expect(textosAbuelo("ca").mensajeWhatsApp("VF-7K3M2Q")).toBe("Hola, vull començar el meu llibre. VF-7K3M2Q");
  });
});

describe("región de quien compra", () => {
  it("AR habla de vos y regala en es-AR; ES habla de tú y regala en es-ES", () => {
    expect(tratoDeRegion("AR")).toBe("vos");
    expect(tratoDeRegion("ES")).toBe("tu");
    expect(idiomaPorDefecto("AR")).toBe("es-AR");
    expect(idiomaPorDefecto("ES")).toBe("es-ES");
  });
});

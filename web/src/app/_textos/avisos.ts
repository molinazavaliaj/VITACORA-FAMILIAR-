import type { Textos } from "@/lib/idioma-web";

// Los textos de las hojas de aviso (rediseño 2026-10, fase 3, maqueta `Casos`
// 5): la página que no existe (404) y los enlaces que ya no sirven. La frase
// del 404 es de la lista «se pueden usar tal cual» (TEXTOS-Y-REGLAS.md §5); el
// resto está para aprobar en docs/rediseno-2026-10/fase-3/textos.md.
// ca: PENDIENTE REVISIÓN NATIVA

export type TextosAviso = {
  /** La etiqueta chica de arriba; vacía, no se pinta. */
  etiqueta: string;
  titulo: string;
  /** La línea en cursiva bajo el título (el 404) o el párrafo que explica. */
  frase?: string;
  bajada?: string;
};

export type TextosAvisos = {
  inicio: string;
  volverAlInicio: string;
  comprar: string;
  escribirnos: string;
  entrar: string;
  /** El botón de la página de error 500. */
  reintentar: string;
  /** La página que no existe. */
  noExiste: TextosAviso;
  /** Un enlace firmado que no verifica: el libro, su voz, el anticipo. */
  enlace: TextosAviso;
  /** El código de un regalo que no existe o no está pagado. */
  regalo: TextosAviso;
  /** Algo se rompió en el servidor (app/error.tsx, app/global-error.tsx). */
  falla: TextosAviso;
};

export const TEXTOS_AVISOS: Textos<TextosAvisos> = {
  es: {
    inicio: "Vitácora, inicio",
    volverAlInicio: "Volver al inicio",
    comprar: "Iniciar Vitácora",
    escribirnos: "Escríbenos",
    entrar: "Entrar con mi correo",
    noExiste: {
      etiqueta: "Error 404",
      titulo: "Esta página se ha perdido.",
      frase: "Como algunos recuerdos, si nadie los apunta.",
    },
    // TEXTO A APROBAR (Naza). Castellano neutro: no dice «tú» ni «vos», así
    // sirve igual en España y en Argentina. Frases cortas, sin pedir perdón de
    // más.
    reintentar: "Probar de nuevo",
    falla: {
      etiqueta: "Error 500",
      titulo: "Se nos cruzó un error.",
      frase: "Fue un error nuestro.",
      bajada: "Algo falló al armar esta página. Suele durar poco. Si vuelve a pasar, escríbenos y lo miramos.",
    },
    enlace: {
      etiqueta: "Enlace caducado",
      titulo: "Este enlace ya no sirve.",
      bajada:
        "Puede que esté incompleto o mal copiado. Ábrelo otra vez desde el mensaje donde te llegó. Si sigue sin abrir, escríbenos y lo miramos.",
    },
    regalo: {
      etiqueta: "",
      titulo: "No encontramos este regalo.",
      bajada:
        "Puede que el código esté mal copiado o que el pago todavía no se haya completado. Si te lo han regalado, pide a quien te lo dio que lo revise. Si sigue sin abrir, escríbenos y lo miramos.",
    },
  },
  ca: {
    inicio: "Vitácora, inici",
    volverAlInicio: "Tornar a l'inici",
    comprar: "Iniciar Vitácora",
    escribirnos: "Escriu-nos",
    entrar: "Entrar amb el meu correu",
    noExiste: {
      etiqueta: "Error 404",
      titulo: "Aquesta pàgina s'ha perdut.",
      frase: "Com alguns records, si ningú no els apunta.",
    },
    // TEXTO A APROBAR (Naza). PENDIENTE REVISIÓN NATIVA (como el resto del ca).
    reintentar: "Tornar-ho a provar",
    falla: {
      etiqueta: "Error 500",
      titulo: "Se'ns ha creuat un error.",
      frase: "Ha estat un error nostre.",
      bajada: "Alguna cosa ha fallat en muntar aquesta pàgina. Sol durar poc. Si torna a passar, escriu-nos i ho mirem.",
    },
    enlace: {
      etiqueta: "Enllaç caducat",
      titulo: "Aquest enllaç ja no serveix.",
      bajada:
        "Potser està incomplet o mal copiat. Torna'l a obrir des del missatge on et va arribar. Si continua sense obrir-se, escriu-nos i ho mirem.",
    },
    regalo: {
      etiqueta: "",
      titulo: "No trobem aquest regal.",
      bajada:
        "Potser el codi està mal copiat o el pagament encara no s'ha completat. Si te l'han regalat, demana a qui te'l va donar que el revisi. Si continua sense obrir-se, escriu-nos i ho mirem.",
    },
  },
  ar: {
    inicio: "Vitácora, inicio",
    volverAlInicio: "Volver al inicio",
    comprar: "Iniciar Vitácora",
    escribirnos: "Escribinos",
    entrar: "Entrar con mi correo",
    noExiste: {
      etiqueta: "Error 404",
      titulo: "Esta página se ha perdido.",
      frase: "Como algunos recuerdos, si nadie los apunta.",
    },
    // TEXTO A APROBAR (Naza).
    reintentar: "Probar de nuevo",
    falla: {
      etiqueta: "Error 500",
      titulo: "Se nos cruzó un error.",
      frase: "Fue un error nuestro.",
      bajada: "Algo falló al armar esta página. Suele durar poco. Si vuelve a pasar, escribinos y lo miramos.",
    },
    enlace: {
      etiqueta: "Enlace caducado",
      titulo: "Este enlace ya no sirve.",
      bajada:
        "Puede que esté incompleto o mal copiado. Abrilo otra vez desde el mensaje donde te llegó. Si sigue sin abrir, escribinos y lo miramos.",
    },
    regalo: {
      etiqueta: "",
      titulo: "No encontramos este regalo.",
      bajada:
        "Puede que el código esté mal copiado o que el pago todavía no se haya completado. Si te lo regalaron, pedile a quien te lo dio que lo revise. Si sigue sin abrir, escribinos y lo miramos.",
    },
  },
};

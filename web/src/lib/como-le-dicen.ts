// «¿Cómo le escribimos?» de la compra (textos web V3, Naza 06/10): así lo saluda el biógrafo por WhatsApp.
// Viene completado con el nombre de pila y no acepta «papá», «abuela» y parecidos: así le dice la familia,
// no el biógrafo.

const PALABRAS_DE_FAMILIA = new Set(["papa", "mama", "abuelo", "abuela", "abu", "nono", "nona", "tio", "tia", "viejo", "vieja"]);

const sinTildes = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** ¿Tiene alguna de las palabras de la familia como palabra suelta? («Babu» o «Nonato» no cuentan.) */
export function esPalabraDeFamilia(texto: string): boolean {
  return sinTildes(texto).split(/[^a-zñ]+/).some((p) => PALABRAS_DE_FAMILIA.has(p));
}

/** El nombre de pila de «Su nombre completo»: la primera palabra, con mayúscula inicial ("IMMACULADA COLELL" → "Immaculada"). */
export function nombreDePila(nombreCompleto: string): string {
  const primera = nombreCompleto.trim().split(/\s+/)[0] ?? "";
  return primera ? primera.charAt(0).toLocaleUpperCase("es") + primera.slice(1).toLocaleLowerCase("es") : "";
}

/** El error de la compra cuando pusieron una palabra de la familia. ⚠️ Texto a aprobar por Naza. */
export const MENSAJE_PALABRA_DE_FAMILIA = 'Poné su nombre o su apodo. Nada de "papá" ni "abuela".';

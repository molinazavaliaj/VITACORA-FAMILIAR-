// Quién presta el servicio, por mercado. ES EL ÚNICO ARCHIVO QUE HAY QUE
// RELLENAR para que los legales queden completos: la identificación fiscal y
// el domicilio de cada titular son obligatorios (LSSI-CE art. 10 en España,
// ley 24.240 y Res. 424/2020 en Argentina). Mientras estén vacíos, las páginas
// los pintan en amarillo para que no se olvide.
//
// El titular que le aplica a cada cliente lo decide la región que eligió en
// el checkout (la misma que decide moneda y pasarela): España → Immaculada,
// Argentina → Joaquín.

export type Region = "ES" | "AR";

export type Titular = {
  region: Region;
  nombre: string;
  pais: string;
  documento: { etiqueta: "NIF" | "CUIT"; valor: string };
  domicilio: string;
  /** Qué ley rige el contrato con este titular, en una frase. */
  ley: string;
  /** Autoridad de protección de datos ante la que se puede reclamar. */
  autoridad: { nombre: string; url: string };
};

export const TITULARES: Record<Region, Titular> = {
  ES: {
    region: "ES",
    nombre: "Immaculada Collel",
    pais: "España",
    documento: { etiqueta: "NIF", valor: "" },
    domicilio: "",
    ley: "la ley española y la normativa de la Unión Europea (RGPD, LOPDGDD, LSSI-CE y el texto refundido de la Ley General para la Defensa de los Consumidores y Usuarios, RDL 1/2007)",
    autoridad: { nombre: "Agencia Española de Protección de Datos (AEPD)", url: "https://www.aepd.es" },
  },
  AR: {
    region: "AR",
    nombre: "Joaquín Molina",
    pais: "Argentina",
    documento: { etiqueta: "CUIT", valor: "" },
    domicilio: "",
    ley: "la ley argentina (ley 25.326 de Protección de los Datos Personales, ley 24.240 de Defensa del Consumidor y Resolución 424/2020 de la Secretaría de Comercio Interior)",
    autoridad: { nombre: "Agencia de Acceso a la Información Pública (AAIP)", url: "https://www.argentina.gob.ar/aaip" },
  },
};

export const CONTACTO = {
  hola: "hola@vitacorafamiliar.com",
  soporte: "soporte@vitacorafamiliar.com",
};

export const ACTUALIZADO = "16 de septiembre de 2026";

/** Campos del titular que todavía no se completaron (se pintan en amarillo). */
export function faltan(t: Titular): string[] {
  const lista: string[] = [];
  if (!t.documento.valor.trim()) lista.push(t.documento.etiqueta);
  if (!t.domicilio.trim()) lista.push("domicilio");
  return lista;
}

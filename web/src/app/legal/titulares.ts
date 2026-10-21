// Quién presta el servicio, por mercado. ES EL ÚNICO ARCHIVO QUE HAY QUE
// RELLENAR para que los legales queden completos: la identificación fiscal y
// el domicilio de cada titular son obligatorios (LSSI-CE art. 10 en España,
// ley 24.240 y Res. 424/2020 en Argentina). Mientras estén vacíos, las páginas
// los pintan en amarillo para que no se olvide.
//
// El titular que le aplica a cada cliente lo decide la región que eligió en
// el checkout (la misma que decide moneda y pasarela). Desde el 17/10 (decisión
// de Joaquín, docs/ROADMAP.md bloque 8) es la misma persona en los dos países,
// Joaquín: en Argentina con su CUIT de monotributo, en España con su NIF de
// autónomo (alta en trámite; hasta entonces España no vende).

import type { Region } from "@/lib/precios";

export type { Region };

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
    nombre: "Joaquín Molina",
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
    documento: { etiqueta: "CUIT", valor: "20-41835629-5" },
    domicilio: "",
    ley: "la ley argentina (ley 25.326 de Protección de los Datos Personales, ley 24.240 de Defensa del Consumidor y Resolución 424/2020 de la Secretaría de Comercio Interior)",
    autoridad: { nombre: "Agencia de Acceso a la Información Pública (AAIP)", url: "https://www.argentina.gob.ar/aaip" },
  },
};

export const CONTACTO = {
  hola: "hola@vitacorafamiliar.com",
  soporte: "soporte@vitacorafamiliar.com",
};

/** La fecha de la última versión de los legales (la pinta _textos/legal.ts en cada idioma). */
export const ACTUALIZADO = "19 de octubre de 2026";

/**
 * Quién da el cupón de bienvenida y quién firma sus mails (rasca y gana,
 * 20/10): nombre, documento y domicilio del titular del país, lo que esté
 * cargado (LSSI arts. 10 y 20; art. 13.1.a RGPD en el popup).
 */
export function quienEs(region: Region): string {
  const t = TITULARES[region];
  const partes = [t.nombre];
  if (t.documento.valor.trim()) partes.push(`${t.documento.etiqueta} ${t.documento.valor.trim()}`);
  if (t.domicilio.trim()) partes.push(t.domicilio.trim());
  return partes.join(", ");
}

/** Campos del titular que todavía no se completaron (se pintan en amarillo). */
export function faltan(t: Titular): string[] {
  const lista: string[] = [];
  if (!t.documento.valor.trim()) lista.push(t.documento.etiqueta);
  if (!t.domicilio.trim()) lista.push("domicilio");
  return lista;
}

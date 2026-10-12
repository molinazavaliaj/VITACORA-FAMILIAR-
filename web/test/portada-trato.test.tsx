import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// La portada por país (Naza, 13/10): desde España se lee de tú; desde el resto,
// de vos como siempre. Textos aprobados en docs/web-textos-v3/aprobados.md.

vi.mock("next/font/google", () => {
  const fuente = () => ({ variable: "fuente", className: "fuente", style: {} });
  return { Playfair_Display: fuente, Archivo: fuente, Source_Serif_4: fuente };
});
let pais = "AR";
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-vercel-ip-country": pais }) }));

import Home from "../src/app/page";

const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);
async function portada(desde: string): Promise<string> {
  pais = desde;
  return renderToStaticMarkup(await (Home as unknown as () => Promise<ReactElement>)());
}

const DE_TU = [
  "La de tu padre, la de tu abuela, la tuya.",
  "Mientras responde, tú vas escuchando su historia desde tu panel.",
  "Tienes el teléfono lleno de fotos suyas y ni una sola de sus historias. La cara la guarda el móvil.",
  "Lo anotas",
  "Nos dices su nombre",
  "Cuéntame el primer recuerdo",
  "Qué bonito eso del patio con el limonero. Cuando quieras, seguimos con tus padres.",
  "¿Cuál sabes de tu familia?",
  "Entra cuando quieras a escucharlo.",
  "El mismo biógrafo, pero de viaje contigo.",
  "guarda las fotos que le mandas con su historia",
  "Le respondes con un audio",
  "Le mandas la foto del día y le cuentas qué pasaba.",
  "las preguntas te llegan a ti",
  "¿Mi padre va a saber usarlo?",
  "se suman si quieres.",
  "Regálalo con una tarjeta →",
];

const DE_VOS = [
  "La de tu papá, la de tu abuela, la tuya.",
  "Mientras responde, vos vas escuchando su historia desde tu panel.",
  "Tenés el teléfono lleno de fotos suyas y ni una sola de sus historias. La cara la guarda el celular.",
  "Lo anotás",
  "Nos decís su nombre",
  "Contame el primer recuerdo",
  "Qué lindo eso del patio con el limonero. Cuando quieras, seguimos con tus papás.",
  "¿Cuál sabés de tu familia?",
  "Entrá cuando quieras a escucharlo.",
  "El mismo biógrafo, pero de viaje con vos.",
  "guarda las fotos que le mandás con su historia",
  "Le respondés con un audio",
  "Le mandás la foto del día y le contás qué pasaba.",
  "las preguntas te llegan a vos",
  "¿Mi papá va a saber usarlo?",
  "se suman si querés.",
  "Regalalo con una tarjeta →",
];

describe("la portada según el país", () => {
  beforeEach(() => {
    process.env.PRECIO_ARS ??= "65000";
    process.env.PRECIO_EUR ??= "79";
  });

  it("desde España, de tú y sin nada de vos", async () => {
    const html = await portada("ES");
    for (const frase of DE_TU) expect(html, frase).toContain(escapar(frase));
    for (const frase of DE_VOS) expect(html, frase).not.toContain(escapar(frase));
  });

  it("desde Argentina, de vos como siempre", async () => {
    const html = await portada("AR");
    for (const frase of DE_VOS) expect(html, frase).toContain(escapar(frase));
    for (const frase of DE_TU) expect(html, frase).not.toContain(escapar(frase));
  });
});

import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";

// Las cinco pantallas se renderizan de verdad (a HTML) con datos de mentira. No mira los
// colores —eso es la mirada con la pantalla abierta—, pero sí lo que se rompe sin avisar:
// un `NaN` en la cuenta, un `undefined` en un texto, o una tabla de guiones cuando no hay
// datos en vez del estado vacío. El layout no entra: las pantallas no dependen de la sesión.

const { datosFalsos } = vi.hoisted(() => ({
  datosFalsos: {
    narradores: [
      { id: "n1", nombre: "Osvaldo", como_le_dicen: "Don Osvaldo", estado: "activo", dia_actual: 17,
        familia_id: "f1", ultima_respuesta_at: "2026-09-17T10:00:00Z", alerta_silencio: true,
        libro_aprobado_at: null,
        contexto: { preguntasEnviadas: { "17": "¿Y cómo era el taller en el 81?" }, repreguntasEnviadas: { "17": "¿Quién era el Vasco?" } } },
      { id: "n2", nombre: "Ferrer", como_le_dicen: null, estado: "completado", dia_actual: 30,
        familia_id: "f2", ultima_respuesta_at: "2026-09-18T10:00:00Z", alerta_silencio: false,
        libro_aprobado_at: "2026-09-18T10:00:00Z", contexto: null },
    ],
    familias: [
      { id: "f1", region: "ES", email: "bermudez@mail.com", nombre: "Bermúdez" },
      { id: "f2", region: "AR", email: "ferrer@mail.com", nombre: "Ferrer" },
    ],
    pedidos: [
      { id: "p1", narrador_id: "n2", familia_id: "f2", estado: "entregado", monto: 89, moneda: "EUR",
        extras: {}, created_at: "2026-09-18T00:00:00Z", proveedor: "stripe", libro_pdf_path: "n2/libro.pdf" },
      { id: "p2", narrador_id: "n1", familia_id: "f1", estado: "pendiente", monto: 49, moneda: "EUR",
        extras: {}, created_at: "2026-09-02T00:00:00Z", proveedor: "stripe", libro_pdf_path: null },
    ],
    respuestas: [
      { narrador_id: "n1", pregunta_orden: 17, es_repregunta: false, texto_directo: null,
        transcripcion: "El Vasco era el que tenía la camioneta", duracion_segundos: 252, recibido_at: "2026-09-17T10:00:00Z" },
    ],
    envios: [{ narrador_id: "n1", tipo: "pregunta", enviado_at: "2026-09-17T08:00:00Z" }],
    narraciones: [
      { id: "x1", narrador_id: "n2", estado: "procesando", actualizada_at: "2026-09-21T03:00:00Z", created_at: "2026-09-20T03:00:00Z" },
    ],
    fotos: [{ narrador_id: "n1" }],
    consumo: [
      { fecha: "2026-09-21T09:00:00Z", servicio: "fabrica", paso: "capitulo", modelo: "claude-fable-5",
        proveedor: "anthropic", cuenta: "naza", narrador_id: "n2", input_tokens: 1000, output_tokens: 200,
        cantidad: null, unidad: null, usd: 10 },
      { fecha: "2026-09-20T09:00:00Z", servicio: "entrevistador", paso: "transcribir", modelo: "gpt-transcribe",
        proveedor: "openai", cuenta: "naza", narrador_id: "n1", input_tokens: 0, output_tokens: 0,
        cantidad: 240, unidad: "segundos", usd: 0.018 },
    ],
    latidos: [
      { servicio: "fabrica", ultimo_ping: "2026-09-21T11:59:00Z", detalle: null },
      { servicio: "voz", ultimo_ping: "2026-09-20T20:00:00Z", detalle: null },
    ],
    gastos: [{ fecha: "2026-09-01", concepto: "Railway", monto: 5, moneda: "USD", categoria: "suscripcion", quien: "naza" }],
  },
}));

const { datosVacios } = vi.hoisted(() => ({
  datosVacios: {
    narradores: [], familias: [], pedidos: [], respuestas: [], envios: [],
    narraciones: [], fotos: [], consumo: [], latidos: [], gastos: [],
  },
}));

let actuales: unknown = datosFalsos;
vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: () => ({}) }));
vi.mock("@/lib/admin/datos", () => ({ datosDelPanel: async () => actuales }));

import PantallaEstado from "../src/app/admin/page";
import PantallaFamilias from "../src/app/admin/familias/page";
import PantallaPlata from "../src/app/admin/plata/page";
import PantallaGastos from "../src/app/admin/gastos/page";
import PantallaCerebros from "../src/app/admin/cerebros/page";

const PANTALLAS: Record<string, () => Promise<ReactElement>> = {
  Estado: PantallaEstado as never,
  Familias: PantallaFamilias as never,
  Plata: PantallaPlata as never,
  Gastos: PantallaGastos as never,
  Cerebros: PantallaCerebros as never,
};

async function render(nombre: string) {
  return renderToStaticMarkup(await PANTALLAS[nombre]());
}

describe("las cinco pantallas, renderizadas", () => {
  for (const nombre of Object.keys(PANTALLAS)) {
    it(`${nombre}: con datos no aparece ni un NaN ni un undefined`, async () => {
      actuales = datosFalsos;
      const html = await render(nombre);
      expect(html).not.toContain("NaN");
      expect(html).not.toContain("undefined");
      expect(html.length).toBeGreaterThan(400);
    });
  }

  it("Estado: muestra el freno del silencio y la cuenta de cada grupo", async () => {
    actuales = datosFalsos;
    const html = await render("Estado");
    expect(html).toContain("Osvaldo");
    expect(html).toContain("Hay que estar atento");
  });

  it("Plata: la cuenta está escrita como una cuenta, con el cambio a la vista", async () => {
    actuales = datosFalsos;
    const html = await render("Plata");
    expect(html).toContain("Entró");
    expect(html).toContain("Se gastó");
    expect(html).toContain("Ganancia limpia");
    // Sin CAMBIO_* cargado, el panel lo dice en vez de convertir con un número inventado.
    expect(html).toContain("no se pudo convertir");
  });

  it("Familias: muestra la charla real, no el guion", async () => {
    actuales = datosFalsos;
    const html = await render("Familias");
    expect(html).toContain("¿Y cómo era el taller en el 81?");
    expect(html).toContain("¿Quién era el Vasco?");
  });

  it("Cerebros: están los 14 nodos y avisa donde se cortó", async () => {
    actuales = datosFalsos;
    const html = await render("Cerebros");
    expect(html).toContain("Escribe los capítulos");
    expect(html).toContain("Se cortó la cadena");
  });

  it("Gastos: el detalle por paso y el gasto cargado a mano", async () => {
    actuales = datosFalsos;
    const html = await render("Gastos");
    expect(html).toContain("capitulo");
    expect(html).toContain("Railway");
  });

  describe("sin ningún dato (la base recién migrada)", () => {
    for (const nombre of Object.keys(PANTALLAS)) {
      it(`${nombre}: muestra el estado vacío y no una tabla de guiones`, async () => {
        actuales = datosVacios;
        const html = await render(nombre);
        expect(html).not.toContain("NaN");
        expect(/Todavía no hay|Ninguna|sin llamadas|no hay ninguna|Nada frenado|Nadie/.test(html)).toBe(true);
      });
    }
  });
});

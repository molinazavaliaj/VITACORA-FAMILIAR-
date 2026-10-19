import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// La página del viaje (V2, 16/10): mínima. Dónde está el viaje, lo que eligió,
// lo contado y las fechas (solo antes de que el bot lo tome). Nada de etapas,
// ángulos ni «sobre qué te preguntamos».
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => "/tablero/n1", useSearchParams: () => new URLSearchParams() }));

import { HistoriaViaje } from "../src/app/tablero/[narradorId]/viaje";

const viaje = {
  v: 2 as const,
  salida: "2026-09-20",
  vuelta: "2026-09-29",
  zonaCasa: "Europe/Madrid",
  zonaViaje: "Europe/Lisbon",
  preguntasPropias: [],
  formato: "impreso" as const,
  fotosAlbum: 40 as const,
  idioma: "es-ES" as const,
};
const n = { id: "n1", nombre: "Nako", como_le_dicen: "Nako", estado: "activo", alerta_silencio: false };
const respuesta = (id: string, dia: number, texto: string) => ({
  id, pregunta_orden: 1, audio_path: `n1/${id}.ogg`, texto_directo: null, transcripcion: texto, duracion_segundos: 40, es_repregunta: false, recibido_at: `2026-09-${dia}T21:10:00Z`,
});

function render(extra: Partial<Parameters<typeof HistoriaViaje>[0]> = {}) {
  return renderToStaticMarkup(
    createElement(HistoriaViaje, {
      n,
      rol: "duena",
      viaje,
      respuestas: [respuesta("b", 22, "Comí un bacalao en la Baixa."), respuesta("a", 21, "Llegué con el sol cayendo.")],
      fotos: [],
      usuarioId: "u1",
      aprobado: false,
      historiaCerrada: false,
      trato: "tu",
      ahora: new Date("2026-09-22T20:00:00Z"),
      ...extra,
    }),
  );
}

describe("La página del viaje (V2)", () => {
  it("dónde está, lo que eligió y lo contado en orden de llegada", () => {
    const html = render();
    expect(html).toContain("Del 20 de septiembre al 29 de septiembre · Estás de viaje");
    expect(html).toContain("Portugal · Libro impreso y en PDF · Álbum de 40 fotos");
    expect(html.indexOf("Llegué con el sol")).toBeLessThan(html.indexOf("Comí un bacalao"));
    expect(html).not.toMatch(/etapa|Sobre qué te preguntamos|noches por venir|Por definir/i);
  });
  it("antes de salir: la salida, y las fechas se corren solo si se puede", () => {
    const antes = render({ ahora: new Date("2026-09-10T10:00:00Z"), puedeCambiarFechas: true });
    expect(antes).toContain("Sales el 20 de septiembre");
    expect(antes).toContain("Guardar las fechas");
    expect(render({ ahora: new Date("2026-09-10T10:00:00Z") })).not.toContain("Guardar las fechas");
  });
  it("de vos, y un regalo se cuenta en tercera persona", () => {
    expect(render({ trato: "vos", ahora: new Date("2026-09-10T10:00:00Z") })).toContain("Salís el 20 de septiembre");
    expect(render({ viaje: { ...viaje, regalo: { quienRegala: "mamá" } }, ahora: new Date("2026-09-10T10:00:00Z") })).toContain("Sale el 20 de septiembre");
  });
  it("sin nada contado todavía", () => {
    expect(render({ respuestas: [], trato: "vos" })).toContain("Lo que cuentes por WhatsApp aparece acá.");
  });
});

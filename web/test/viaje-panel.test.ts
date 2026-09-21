import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// El panel de viaje (3t.19): se renderiza en el servidor con datos falsos y se
// mira el HTML. Lo que importa: las etapas son los capítulos, las noches
// contadas muestran la pregunta real del bot, no hay lista de preguntas por
// venir, y "Por definir" junta lo que no tiene etapa.
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => "/tablero/n1", useSearchParams: () => new URLSearchParams() }));

import { HistoriaViaje } from "../src/app/tablero/[narradorId]/viaje";

const viaje = { salida: "2026-09-20", vuelta: "2026-09-29", etapas: [{ nombre: "Lisboa", desde: "2026-09-20", hasta: "2026-09-23" }, { nombre: "Oporto", desde: "2026-09-24", hasta: "2026-09-27" }], angulos: ["comida", "persona"] };
const n = { id: "n1", nombre: "Nako", como_le_dicen: "Nako", estado: "activo", dia_actual: 2, alerta_silencio: false };
const respuesta = (orden: number, texto: string) => ({ id: `r${orden}`, pregunta_orden: orden, audio_path: `n1/${orden}.ogg`, texto_directo: null, transcripcion: texto, duracion_segundos: 40, es_repregunta: false, recibido_at: `2026-09-${19 + orden}T23:10:00Z` });

function render(extra: Partial<Parameters<typeof HistoriaViaje>[0]> = {}) {
  return renderToStaticMarkup(
    createElement(HistoriaViaje, {
      n, rol: "duena", viaje, zonaHoraria: "Europe/Lisbon",
      respuestas: [respuesta(1, "Llegué a Lisboa con el sol cayendo."), respuesta(2, "Comí un bacalao en la Baixa.")],
      fotos: [
        { id: "f1", capitulo: "Lisboa", epigrafe: "El tranvía 28", principal: false, orden: 0, subida_por: null },
        { id: "f2", capitulo: null, epigrafe: null, principal: false, orden: 0, subida_por: null },
      ],
      preguntasEnviadas: { "2": "Segunda noche en Lisboa: ¿qué comiste hoy que no vas a olvidar?" },
      repreguntasEnviadas: {},
      usuarioId: "u1", historiasRiel: [{ id: "n1", nombre: "Nako", rol: "duena", estado: "activo" }],
      aprobado: false, historiaCerrada: false, linkPublico: null, invitados: [], ritmo: "diario", evitar: "",
      horario: { hora: "21:30", zona: "Europe/Lisbon" },
      ...extra,
    }),
  );
}

describe("El panel de viaje (3t.19)", () => {
  // Hoy es la noche 3 del viaje (22/09 en Lisboa), pase el tiempo que pase.
  beforeAll(() => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-09-22T20:00:00Z")); });
  afterAll(() => vi.useRealTimers());
  it("los capítulos son las etapas, con sus fechas; nada del guion del Familiar", () => {
    const html = render();
    expect(html).toContain("Tu viaje");
    expect(html).toContain("Lisboa");
    expect(html).toContain("Oporto");
    expect(html).toContain("20 sept – 23 sept");
    expect(html).toContain("estás acá · 2 de 4 noches");
    expect(html).not.toContain("¿Cómo era su casa?");
    expect(html).not.toContain("Las cuatro finales");
    expect(html).not.toContain("Agregar/Editar preguntas");
    expect(html).not.toContain("todavía no</span>");
  });
  it("cada noche contada trae la fecha, la pregunta real del bot y la respuesta; las que faltan son un contador", () => {
    const html = render();
    expect(html).toContain("Noche 1 · 20 de septiembre");
    expect(html).toContain("Noche 2 · 21 de septiembre");
    expect(html).toContain("Te preguntamos: «Segunda noche en Lisboa: ¿qué comiste hoy que no vas a olvidar?»");
    expect(html).toContain("Comí un bacalao en la Baixa.");
    expect(html).toContain("esta noche te escribimos · 1 noche por venir");
    expect(html).toContain("4 noches por venir");
    expect(html).toContain("2 de 10 noches contadas");
  });
  it("las fotos van a su etapa y las sin etapa a 'Por definir'; los ángulos elegidos aparecen marcados", () => {
    const html = render();
    expect(html).toContain("El tranvía 28");
    expect(html).toContain("Por definir");
    expect(html).toContain("/api/fotos/f2");
    expect(html).toContain("Agregar fotos de Lisboa");
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("Sobre qué te preguntamos");
    expect(html).toContain("Las etapas del viaje");
    // 3t.23: la hora a la vista, en segunda persona, sin el ritmo.
    expect(html).toContain("A qué hora te llega la pregunta");
    expect(html).toContain("hora de Portugal, Reino Unido, Irlanda");
    expect(html).not.toContain("Dos por día");
  });
  it("sin 'Por definir' cuando todo tiene etapa; un invitado no ve los ajustes", () => {
    const html = render({ viaje: { ...viaje, etapas: [{ nombre: "Lisboa", desde: "2026-09-20" }] }, fotos: [], rol: "invitado" });
    expect(html).not.toContain("Por definir");
    expect(html).toContain("El viaje de Nako");
    expect(html).not.toContain("Sobre qué te preguntamos");
  });
  it("terminado el viaje: primero cerrar la edición, después encargar el libro", () => {
    const abierto = render({ n: { ...n, estado: "completado" } });
    expect(abierto).toContain("Cerrar edición del libro");
    expect(abierto).not.toContain("Sobre qué te preguntamos");
    expect(abierto).not.toContain("por venir");
    const cerrado = render({ n: { ...n, estado: "completado" }, historiaCerrada: true });
    expect(cerrado).toContain("encargá tu libro de viaje");
  });
});

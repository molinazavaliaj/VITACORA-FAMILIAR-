import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// «Vitácora de una historia» en el panel (Naza, 23/10; textos H42 a H44): el bloque de preguntas no dice «la
// familia» (las suma también quien se compró el libro para sí), lleva su ejemplo y, con la entrevista en la
// última pregunta, el aviso de que ya no entran. La V3 sigue igual.

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => "/tablero/n1", useSearchParams: () => new URLSearchParams() }));

import { HistoriaV3 } from "../src/app/tablero/[narradorId]/v3";

const props = {
  n: { id: "n1", nombre: "Marta", como_le_dicen: "Marta", estado: "activo", alerta_silencio: false },
  rol: "duena" as const, propia: false, fotos: [], usuarioId: "u1", historiasRiel: [], bloques: [],
  aprobado: false, historiaCerrada: false, linkPublico: null, invitados: [], ritmo: "diario" as const, alFinal: false, trato: "vos" as const, enMarco: true,
};
const unaSumada = [{ id: "p1", texto: "¿Seguís viendo a alguien?", estado: "por hacer" as const }];

describe("el panel de historia", () => {
  it("el bloque se llama «Preguntas sumadas desde acá», con su bajada (el ejemplo va en el campo, que se abre con el botón)", () => {
    const html = renderToStaticMarkup(<HistoriaV3 {...props} historia preguntasFamilia={unaSumada} />);
    expect(html).toContain("Preguntas sumadas desde acá");
    expect(html).toContain("Le llegan cerca del final de la entrevista.");
    expect(html).toContain("«¿Seguís viendo a alguien?»");
    expect(html).toContain("Sumar una pregunta");
    expect(html).not.toContain("Las preguntas de la familia");
  });

  it("si es la propia, «Te llegan»; de tú, en castellano de España", () => {
    expect(renderToStaticMarkup(<HistoriaV3 {...props} historia propia preguntasFamilia={unaSumada} />)).toContain("Te llegan cerca del final");
    expect(renderToStaticMarkup(<HistoriaV3 {...props} historia trato="tu" preguntasFamilia={unaSumada} />)).toContain("Preguntas añadidas desde aquí");
  });

  it("en la última pregunta: en lugar de sumar, el aviso", () => {
    const html = renderToStaticMarkup(<HistoriaV3 {...props} historia alFinal />);
    expect(html).toContain("La entrevista ya está en la última pregunta, así que no entran preguntas nuevas. Lo que contó es lo que va al libro.");
    expect(html).not.toContain("Sumar una pregunta");
  });

  it("la V3 sigue con sus textos y sin el aviso", () => {
    const html = renderToStaticMarkup(<HistoriaV3 {...props} preguntasFamilia={unaSumada} alFinal />);
    expect(html).toContain("Las preguntas de la familia");
    expect(html).not.toContain("última pregunta");
  });
});

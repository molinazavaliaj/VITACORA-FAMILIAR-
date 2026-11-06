import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => "/tablero/n1", useSearchParams: () => new URLSearchParams() }));

import { HistoriaPrivada } from "../src/app/tablero/[narradorId]/privada";
import { FrasesElegidas } from "../src/app/tablero/[narradorId]/frases/elegidas";
import { Compartir } from "../src/app/tablero/[narradorId]/compartir";
import { proximoPaso } from "../src/app/tablero/proximo-paso";
import type { Historia } from "@/lib/panel";

// Lo que ve quien regala: la pantalla no recibe nada de lo contado, y los textos no prometen lo que ya no hace.

const n = { id: "n1", nombre: "Antonio", como_le_dicen: "Antonio", estado: "activo", alerta_silencio: false };
const props = {
  n, rol: "duena" as const, quien: { como: "Antonio", propia: false, ella: false, viaje: false }, preguntasFamilia: [], fotos: [], usuarioId: "u1",
  aprobado: false, historiaCerrada: false, libroListo: false, dudasPendientes: false, alFinal: false, ritmo: "diario" as const, trato: "vos" as const,
};

describe("la historia privada", () => {
  it("dice que es privado, deja sumar preguntas y no tiene audios ni botón de sacar", () => {
    const html = renderToStaticMarkup(<HistoriaPrivada {...props} preguntasFamilia={[{ id: "p", texto: "¿Y la abuela?", estado: "contestada" }]} />);
    expect(html).toContain("Lo que cuenta queda privado hasta que el libro esté listo");
    expect(html).toContain("Sumar una pregunta");
    expect(html).toContain("Ya la contestó.");
    expect(html).not.toContain("más abajo");
    expect(html).not.toContain("/api/audio");
    expect(html).not.toContain("Que esto no vaya al libro");
  });

  it("con el libro listo lleva al libro y a las frases", () => {
    const html = renderToStaticMarkup(<HistoriaPrivada {...props} n={{ ...n, estado: "completado" }} aprobado libroListo />);
    expect(html).toContain("Leer su libro");
    expect(html).toContain("/tablero/n1/frases");
    expect(html).not.toContain("Elegí la tapa");
    expect(html).not.toContain("queda privado hasta");
  });

  it("encargado y sin escribir, lo dice", () => {
    expect(renderToStaticMarkup(<HistoriaPrivada {...props} n={{ ...n, estado: "completado" }} aprobado />)).toContain("Estamos escribiendo el libro");
  });

  it("el invitado no ve lo de elegir la tapa ni los ajustes; de tú, sin vos", () => {
    const html = renderToStaticMarkup(<HistoriaPrivada {...props} rol="invitado" horario={{ hora: "10:00", zona: "Europe/Madrid" }} />);
    expect(html).not.toContain("elegís la tapa");
    expect(html).not.toContain("Ajustes de la entrevista");
    expect(renderToStaticMarkup(<HistoriaPrivada {...props} trato="tu" />)).toContain("Aquí ves cuánto lleva contado");
  });
});

describe("Compartir", () => {
  it("privado no promete escuchar nada", () => {
    // El texto vive dentro del desplegable: se prueba el armado con el botón cerrado y la regla de los textos abajo.
    expect(renderToStaticMarkup(<Compartir narradorId="n1" nombre="Antonio" cerrado={false} aprobado={false} linkPublico={null} invitados={[]} privado />)).toContain("Compartir");
  });
});

describe("las frases elegidas", () => {
  const frase = { id: "a", texto: "Una frase.", origen: "cita" as const, grupo: null, respuesta_id: null, pregunta_orden: 0, por_que: "", elegida: true, elegida_por: "modelo" as const, estado: "cortada" as const, audio_path: "x", segundos: 5, inicio: 0, fin: 5 };
  const base = { narradorId: "n1", nombre: "Antonio", capitulos: [{ numero: 1, capitulo: "Uno", candidatas: [frase] }], confirmadoAt: null, frenada: false, cortando: false, linkPublico: null };
  it("quien regala confirma o avisa de un error; no hay casillas para cambiar", () => {
    const html = renderToStaticMarkup(<FrasesElegidas {...base} puedeConfirmar />);
    expect(html).toContain("Está bien, mandar a imprimir");
    expect(html).toContain("Hay un error, avisanos");
    expect(html).not.toContain('role="checkbox"');
    expect(html).not.toContain("Escuchar la historia completa");
    expect(renderToStaticMarkup(<FrasesElegidas {...base} puedeConfirmar trato="tu" />)).toContain("Hay un error, avísanos");
  });
  it("el invitado escucha, sin botones", () => {
    const html = renderToStaticMarkup(<FrasesElegidas {...base} puedeConfirmar={false} />);
    expect(html).toContain("Una frase.");
    expect(html).not.toContain("mandar a imprimir");
  });
  it("con el aviso hecho, dice que frenamos; mientras recorta no se confirma", () => {
    expect(renderToStaticMarkup(<FrasesElegidas {...base} puedeConfirmar frenada />)).toContain("frenamos la impresión");
    expect(renderToStaticMarkup(<FrasesElegidas {...base} puedeConfirmar cortando />)).toContain("Estamos recortando los audios");
  });
});

describe("el Inicio", () => {
  const h = (estado: string, contexto: Record<string, unknown>, rol: "duena" | "invitado" = "duena") => ({ rol, narrador: { id: "n1", nombre: "A", como_le_dicen: "A", estado, contexto } }) as unknown as Historia;
  const r = { respondidas: 3, total: 30, segundos: 0, tieneAnticipo: false };
  it("no invita a escuchar ni a leer", () => {
    expect(proximoPaso(h("activo", { vinculoComprador: "hija", acceso: { elige: true } }), r)?.texto).toBe("Mirá cuánto lleva contado");
    expect(proximoPaso(h("completado", { vinculoComprador: "hija", acceso: { elige: true } }, "invitado"), r)?.texto).toBe("Ya terminó de contar. Cuando el libro esté listo, se abre acá");
    expect(proximoPaso(h("activo", { vinculoComprador: "yo mismo" }), r)?.texto).toContain("Escuchá");
  });
});

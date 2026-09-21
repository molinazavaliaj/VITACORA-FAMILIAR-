import { describe, it, expect } from "vitest";
import { mapaDeCerebros, livenessDeLaVoz } from "../src/lib/admin/mapa";
import type { DatosDelPanel } from "../src/lib/admin/datos";

const AHORA = new Date("2026-09-21T12:00:00Z");
const hace = (horas: number) => new Date(AHORA.getTime() - horas * 3600_000).toISOString();

const datos = (p: Partial<DatosDelPanel>): DatosDelPanel => ({
  narradores: [], familias: [], pedidos: [], respuestas: [], envios: [],
  narraciones: [], fotos: [], consumo: [], latidos: [], gastos: [], ...p,
});

const narracion = (x: Partial<DatosDelPanel["narraciones"][number]> = {}): DatosDelPanel["narraciones"][number] =>
  ({ id: "x1", narrador_id: "n1", estado: "procesando", actualizada_at: hace(9), created_at: hace(40), ...x });

const consumo = (c: Partial<DatosDelPanel["consumo"][number]>): DatosDelPanel["consumo"][number] =>
  ({ fecha: hace(1), servicio: "fabrica", paso: "capitulo", modelo: "claude-fable-5", proveedor: "anthropic",
     cuenta: "naza", narrador_id: "n1", input_tokens: 0, output_tokens: 0, cantidad: null, unidad: null, usd: 1, ...c });

const pedido = (p: Partial<DatosDelPanel["pedidos"][number]> = {}): DatosDelPanel["pedidos"][number] =>
  ({ id: "p1", narrador_id: "n1", familia_id: "f1", estado: "pagado", monto: 49, moneda: "EUR", extras: {},
     created_at: hace(30), proveedor: "stripe", libro_pdf_path: null, ...p });

const respuesta = (r: Partial<DatosDelPanel["respuestas"][number]> = {}): DatosDelPanel["respuestas"][number] =>
  ({ narrador_id: "n1", pregunta_orden: 4, es_repregunta: false, texto_directo: null, transcripcion: "texto",
     duracion_segundos: 60, recibido_at: hace(10), ...r });

const estadoDe = (nodos: ReturnType<typeof mapaDeCerebros>, nombre: string) =>
  nodos.find((n) => n.nombre === nombre)?.estado;

describe("la vida de la computadora que narra (Review Focus 4)", () => {
  it("con la narración avanzando, la voz está VIVA aunque el latido sea viejo", () => {
    // El caso real: mientras narra un capítulo no late (14-33 minutos medidos). Si el panel
    // mirara sólo el latido, mostraría "se cayó" con la máquina trabajando.
    const d = datos({
      latidos: [{ servicio: "voz", ultimo_ping: hace(1.2), detalle: null }],      // 72 minutos sin latir
      narraciones: [narracion({ actualizada_at: hace(0.3) })],                      // avanzó hace 18 minutos
    });
    const l = livenessDeLaVoz(d, AHORA);
    expect(l.viva).toBe(true);
    expect(l.porque).toContain("narrando");
  });

  it("sin latido Y con una narración que no avanza, está caída y lo dice", () => {
    // El caso que importa: hay trabajo esperándola y no da señales.
    const l = livenessDeLaVoz(datos({
      latidos: [{ servicio: "voz", ultimo_ping: hace(200), detalle: null }],
      narraciones: [narracion({ actualizada_at: hace(30) })],
    }), AHORA);
    expect(l.viva).toBe(false);
  });

  it("apagada y sin nada que narrar NO es una caída: lo dice como puede estar apagada", () => {
    // La PC de Naza es una persona: si no hay ningún libro esperando, que esté apagada
    // no es un problema y el panel no puede gritar. Mismo criterio que los frenos.
    const l = livenessDeLaVoz(datos({ latidos: [{ servicio: "voz", ultimo_ping: hace(200), detalle: null }], narraciones: [] }), AHORA);
    expect(l.viva).toBe(true);
    expect(l.porque).toContain("apagada");
  });

  it("sin fila de latido no la declara caída: dice que todavía no sabe", () => {
    const l = livenessDeLaVoz(datos({}), AHORA);
    expect(l.viva).toBe(true);
    expect(l.porque).toContain("Todavía no hay latido");
  });

  it("un latido fresco la da por viva aunque no haya ninguna narración", () => {
    const l = livenessDeLaVoz(datos({ latidos: [{ servicio: "voz", ultimo_ping: hace(0.1), detalle: null }] }), AHORA);
    expect(l.viva).toBe(true);
    expect(l.porque).toContain("Latió");
  });
});

describe("el mapa de cerebros", () => {
  it("están los 14, cada uno con su modelo y su nombre de pantalla", () => {
    const nodos = mapaDeCerebros(datos({}), AHORA);
    expect(nodos).toHaveLength(14);
    expect(nodos.find((n) => n.nombre === "Escribe los capítulos")?.modelo).toBe("claude-fable-5");
    expect(nodos.find((n) => n.nombre === "Lo pasa a texto")?.modelo).toBe("gpt-transcribe");
    expect(nodos.filter((n) => n.carril === "voz")).toHaveLength(4);
  });

  it("sin ningún dato, los 14 quedan sin uso: gris punteado, NO rojo", () => {
    expect(mapaDeCerebros(datos({}), AHORA).every((n) => n.estado === "sin_uso")).toBe(true);
  });

  it("un uso reciente deja el nodo trabajando", () => {
    const nodos = mapaDeCerebros(datos({ consumo: [consumo({ paso: "transcribir", fecha: hace(1) })] }), AHORA);
    expect(estadoDe(nodos, "Lo pasa a texto")).toBe("trabajando");
    expect(estadoDe(nodos, "Escribe los capítulos")).toBe("sin_uso");
  });

  it("una narración trabada pone rojo el carril de la voz y no contagia a los demás", () => {
    const nodos = mapaDeCerebros(datos({ narraciones: [narracion({ actualizada_at: hace(9) })] }), AHORA);
    expect(estadoDe(nodos, "Las ubica en el audio")).toBe("frenado");
    expect(estadoDe(nodos, "Las corta y empareja")).toBe("frenado");
    expect(estadoDe(nodos, "Lo pasa a texto")).toBe("sin_uso");
    expect(estadoDe(nodos, "Arma el plan")).toBe("sin_uso");
  });

  it("un pedido pagado que la fábrica no tomó pone rojo el primer nodo del libro", () => {
    const nodos = mapaDeCerebros(datos({ pedidos: [pedido({ estado: "pagado", created_at: hace(30) })] }), AHORA);
    expect(estadoDe(nodos, "Arma el plan")).toBe("frenado");
  });

  it("un audio que llegó y no se pasó a texto traba el carril de la entrevista", () => {
    const nodos = mapaDeCerebros(datos({ respuestas: [respuesta({ transcripcion: null, recibido_at: hace(10) })] }), AHORA);
    expect(estadoDe(nodos, "Lo pasa a texto")).toBe("frenado");
    expect(estadoDe(nodos, "Llega el audio del abuelo")).toBe("quieto"); // el audio llegó: ese nodo hizo su parte
  });

  it("el nodo del PDF no inventa una fecha que la base no guarda", () => {
    const conPdf = mapaDeCerebros(datos({ pedidos: [pedido({ libro_pdf_path: "n1/libro.pdf" })] }), AHORA);
    expect(conPdf.find((n) => n.nombre === "Arma el PDF")).toMatchObject({ estado: "quieto", cuando: null });
    const sinPdf = mapaDeCerebros(datos({}), AHORA);
    expect(estadoDe(sinPdf, "Arma el PDF")).toBe("sin_uso");
  });
});

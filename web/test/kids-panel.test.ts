import { describe, it, expect } from "vitest";
import bancoJson from "../src/lib/kids-banco.json";
import bancoEsEsJson from "../src/lib/kids-banco-es-ES.json";
import { HORAS_KIDS } from "../src/lib/kids";
import { validarFichaKids, type FichaKids } from "../src/lib/kids-compra";
import {
  BANCO_KIDS,
  armarBancoIdioma,
  bancoKidsDe,
  botonArranque,
  idiomaDeFila,
  MENSAJES_DEL_PANEL,
  conCorreccion,
  diceEstaEn,
  esKids,
  fusionarCambioKids,
  itemDeClave,
  leerCambioKids,
  leerCorreccion,
  loQueCuenta,
  preguntasAbiertas,
  sinCorreccion,
  tituloCapitulo,
  valoresDelPanel,
} from "../src/lib/kids-panel";
import { guardarCambiosPanel, guardarCorreccion, leerFilaKids, leerPanelKids } from "../src/lib/kids-panel-base";
import { estadoCortoKids, estadoKids } from "../src/app/_textos/panel-kids";
import { FICHA, baseFalsa, fila, resp } from "./kids-datos";

// El panel de Kids (K5): lo puro (qué se muestra, qué se guarda) y el
// compare-and-swap contra kids_v2 con una base de mentira.

const banco = BANCO_KIDS;

describe("la copia del banco del motor", () => {
  it("dice de dónde salió (rama, commit) y no se edita a mano", () => {
    const origen = (bancoJson as { _origen?: string })._origen ?? "";
    expect(origen).toContain("fabrica/src/kids-v2/banco.json");
    expect(origen).toMatch(/commit [0-9a-f]{40}/);
  });

  it("tiene los ids que usa el panel: capítulos 1 a 5, K1 a K47, las extras y los mensajes de cierre", () => {
    expect(banco.capitulos.map((c) => c.n)).toEqual([1, 2, 3, 4, 5]);
    for (let i = 1; i <= 47; i++) expect(banco.preguntas.some((p) => p.id === `K${i}`), `K${i}`).toBe(true);
    for (const id of MENSAJES_DEL_PANEL) expect(banco.mensajes.some((m) => m.id === id), id).toBe(true);
    // Las de la cápsula son K41 a K47 (flujo §9).
    expect(banco.preguntas.filter((p) => p.cap === 5).map((p) => p.id)).toEqual(["K41", "K42", "K43", "K44", "K45", "K46", "K47"]);
    for (const x of banco.extras) expect(x.id).toMatch(/^X[1-5]-\d+$/);
    // K12 tiene sus dos ramas (K12-R1, K12-R2 y K12-R2-2) y K18 la frase que se borra por tema.
    const k12 = banco.preguntas.find((p) => p.id === "K12")!;
    expect(k12.ramas.length).toBe(2);
    expect(banco.preguntas.find((p) => p.id === "K18")!.texto).toContain("como la pareja de tu mamá o de tu papá, o alguien");
  });

  it("los títulos de los capítulos son los aprobados", () => {
    expect(tituloCapitulo(2)).toBe("Mi gente");
    expect(tituloCapitulo(5)).toBe("Para cuando seas grande (la cápsula)");
  });
});

describe("el banco de España (tú)", () => {
  const es = bancoKidsDe("es-ES");

  it("es copia del banco del motor de España (rama, commit) y no se edita a mano", () => {
    const origen = (bancoEsEsJson as { _origen?: string })._origen ?? "";
    expect(origen).toContain("fabrica/src/kids-v2/banco-es-ES.json");
    expect(origen).toMatch(/commit [0-9a-f]{40}/);
  });

  it("tiene los mismos ids que usa el panel, con los textos de España", () => {
    expect(es.capitulos.map((c) => c.n)).toEqual([1, 2, 3, 4, 5]);
    for (let i = 1; i <= 47; i++) expect(es.preguntas.some((p) => p.id === `K${i}`), `K${i}`).toBe(true);
    for (const id of MENSAJES_DEL_PANEL) expect(es.mensajes.some((m) => m.id === id), id).toBe(true);
    expect(es.preguntas.filter((p) => p.cap === 5).map((p) => p.id)).toEqual(["K41", "K42", "K43", "K44", "K45", "K46", "K47"]);
    expect(es.extras.map((x) => x.id)).toEqual(banco.extras.map((x) => x.id));
    expect(es.preguntas.find((p) => p.id === "K12")!.ramas.length).toBe(2);
    expect(es.preguntas.find((p) => p.id === "K18")!.texto).toContain("como la pareja de tu madre o de tu padre, o alguien");
    // Ningún texto quedó en vos: cada pregunta, rama, foto, extra y mensaje es el de España.
    const todo = JSON.stringify(es);
    expect(todo).not.toMatch(/Contame|Mostrame|tenés|querés/);
  });

  it("si al banco de España le falta un id, no arma nada (nunca un texto en vos para un chico de España)", () => {
    const { K10: _sin, ...falta } = bancoEsEsJson as unknown as Record<string, string>;
    expect(() => armarBancoIdioma(falta, "es-ES")).toThrow(/K10/);
  });

  it("un chico de España ve K10 con «tu madre» y la parte 1 con su título", () => {
    const f = { ...FICHA, genero: "chica" as const, idioma: "es-ES" as const, zona: "Europe/Madrid" };
    expect(itemDeClave("K10", f)).toEqual({ cap: 2, texto: "Tu madre. Cuéntame cómo es, y una vez que te cuidó cuando estabas enferma." });
    expect(tituloCapitulo(1, "es-ES")).toBe("De pequeño");
    const caps = loQueCuenta([resp("K1"), resp("K10")], [], f);
    expect(caps.map((c) => c.titulo)).toEqual(["De pequeño", "Mi gente"]);
    expect(caps[1].preguntas[0].texto).toMatch(/^Tu madre\. Cuéntame/);
    const sinPadre = itemDeClave("K18", { ...f, temasSacados: ["papa"] })!.texto!;
    expect(sinPadre).toContain("como la pareja de tu madre, o alguien");
    expect(sinPadre).not.toContain("tu padre");
    expect(botonArranque("es-ES")).toBe("Vale, vamos");
  });

  it("un chico de Argentina, igual que hoy", () => {
    expect(itemDeClave("K10", FICHA)?.texto).toBe("Tu mamá. Contame cómo es, y una vez que te cuidó cuando estabas enfermo.");
    expect(itemDeClave("K10", { ...FICHA, idioma: "es-AR" })?.texto).toBe("Tu mamá. Contame cómo es, y una vez que te cuidó cuando estabas enfermo.");
    expect(tituloCapitulo(1)).toBe("De chiquito");
    expect(tituloCapitulo(1, "es-AR")).toBe("De chiquito");
    expect(botonArranque("es-AR")).toBe("Dale, vamos");
  });

  it("el idioma del banco es el de la ficha, si no el de kids_v2, si no es-AR", () => {
    expect(idiomaDeFila(fila())).toBe("es-AR");
    expect(idiomaDeFila(fila({ idioma: "es-ES" }))).toBe("es-ES");
    expect(idiomaDeFila(fila({ ficha: { ...FICHA, idioma: "es-ES" } }))).toBe("es-ES");
    expect(idiomaDeFila(fila({ ficha: { ...FICHA, idioma: "es-ES" }, idioma: "es-AR" }))).toBe("es-ES");
    expect(idiomaDeFila(fila({ fichaMotor: { ...FICHA, idioma: "es-ES" } }))).toBe("es-ES");
  });
});

describe("a qué pregunta responde cada clave", () => {
  it("principal, rama, otra puerta, foto, extra, una más, cierre, pregunta del padre", () => {
    const f = { ...FICHA, genero: "chica" as const, preguntasPadre: [{ texto: "Contame el día de la bici.", conLinea: true }] };
    expect(itemDeClave("K10", f)).toEqual({ cap: 2, texto: "Tu mamá. Contame cómo es, y una vez que te cuidó cuando estabas enferma." });
    expect(itemDeClave("K12-R1", f)?.texto).toMatch(/^Contame la última vez que te reíste mucho con un hermano/);
    expect(itemDeClave("K12-R2-2", f)?.texto).toMatch(/^¿Y alguien que sea casi como un hermano/);
    expect(itemDeClave("K12-OP", f)?.texto).toMatch(/^¿Y algo tuyo que un hermano/);
    expect(itemDeClave("K10-FOTO", f)).toMatchObject({ cap: 2, texto: expect.stringMatching(/^Si tenés mascota/) });
    expect(itemDeClave("X1-2", f)).toMatchObject({ cap: 1 });
    expect(itemDeClave("UNA-MAS-3", f)).toEqual({ cap: 3, texto: "Antes de cerrar esta parte, ¿querés una más de estas?" });
    expect(itemDeClave("CIERRE-2", f)?.cap).toBe(2);
    expect(itemDeClave("CIERRE-FINAL", f)?.cap).toBe(5);
    expect(itemDeClave("PADRE-1", f)).toEqual({ cap: 4, texto: "Contame el día de la bici.", padre: 1 });
    expect(itemDeClave("PADRE-2", f)).toEqual({ cap: 4, texto: null, padre: 2 });
    expect(itemDeClave("BIEN-CHICO", f)).toEqual({ cap: 0, texto: null });
  });

  it("∅, null y las que no se conocen no se muestran", () => {
    expect(itemDeClave("∅", FICHA)).toBeNull();
    expect(itemDeClave(null, FICHA)).toBeNull();
    expect(itemDeClave("K99", FICHA)).toBeNull();
    expect(itemDeClave("CUALQUIERA", FICHA)).toBeNull();
  });

  it("K18 sale como le llegó, con el tema sacado (solo borra palabras)", () => {
    const sinPapa = itemDeClave("K18", { ...FICHA, temasSacados: ["papa"] })!.texto!;
    expect(sinPapa).toContain("como la pareja de tu mamá, o alguien");
    expect(sinPapa).not.toContain("tu papá");
  });
});

describe("lo que cuenta", () => {
  it("agrupa por capítulo y pregunta, en orden, con la cápsula marcada y sin ∅ ni null", () => {
    const r = [
      resp("BIEN-CHICO", { audio_path: null, transcripcion: null, texto_directo: "⟦botón:Dale, vamos⟧" }),
      resp("K1"),
      resp("K1", { transcripcion: "y además el perro" }),
      resp("∅", { audio_path: null, transcripcion: null, texto_directo: "⟦botón:Paso⟧" }),
      resp(null, { transcripcion: "de noche, sin procesar" }),
      resp("K12-R1"),
      resp("K10-FOTO", { audio_path: null, transcripcion: null, texto_directo: "⟦foto⟧" }),
      resp("K41", { transcripcion: "para cuando sea grande" }),
      resp("K2", { audio_path: null, transcripcion: null, texto_directo: "lo escribí" }),
    ];
    const fotoDe = r[6].pregunta_orden;
    const caps = loQueCuenta(r, [{ id: "foto1", pregunta_orden: fotoDe }], FICHA);
    expect(caps.map((c) => c.n)).toEqual([0, 1, 2, 5]);
    const [antes, uno, dos, cinco] = caps;
    expect(antes.preguntas[0].entradas[0].boton).toBe("Dale, vamos");
    expect(uno.titulo).toBe("De chiquito");
    expect(uno.preguntas.map((p) => p.clave)).toEqual(["K1", "K2"]);
    expect(uno.preguntas[0].entradas.map((e) => e.texto)).toEqual([r[1].transcripcion, "y además el perro"]);
    expect(uno.preguntas[1].entradas[0]).toMatchObject({ texto: "lo escribí", audio: false });
    expect(dos.preguntas.map((p) => p.clave)).toEqual(["K12-R1", "K10-FOTO"]);
    expect(dos.preguntas[1].entradas[0]).toMatchObject({ fotos: ["foto1"], texto: null });
    expect(cinco).toMatchObject({ capsula: true, titulo: "Para cuando seas grande (la cápsula)" });
    expect(cinco.preguntas[0].entradas[0].texto).toBe("para cuando sea grande");
    const todo = JSON.stringify(caps);
    expect(todo).not.toContain("de noche, sin procesar");
    expect(todo).not.toContain('"boton":"Paso"');
    expect(capsulaFueraDe(caps)).toBe(true);
  });

  it("un audio sin transcripción todavía se marca, y las correcciones van con su respuesta", () => {
    const a = resp("K3", { transcripcion: null });
    const b = resp("K3", { transcripcion: "con Yaco" });
    const caps = loQueCuenta([a, b], [], FICHA, [{ respuesta_id: b.id, dice: "Yaco", es: "Jaco", at: "2026-10-15T10:00:00Z" }]);
    const [e1, e2] = caps[0].preguntas[0].entradas;
    expect(e1).toMatchObject({ transcribiendo: true, texto: null });
    expect(e2.correcciones).toEqual([{ respuesta_id: b.id, dice: "Yaco", es: "Jaco", at: "2026-10-15T10:00:00Z" }]);
    expect(e1.correcciones).toEqual([]);
  });
});

function capsulaFueraDe(caps: ReturnType<typeof loQueCuenta>) {
  return caps.filter((c) => c.capsula).every((c) => c.n === 5);
}

describe("preguntas abiertas o cerradas", () => {
  it("antes del arranque (estado null), abiertas", () => {
    expect(preguntasAbiertas(fila())).toBe(true);
    expect(preguntasAbiertas(fila({ avance: { preguntasPadreAbiertas: false } }))).toBe(true);
  });
  it("después, lo que diga el avance; terminado, cerradas", () => {
    expect(preguntasAbiertas(fila({ fichaMotor: FICHA, avance: { capitulo: 3, preguntasPadreAbiertas: true } }))).toBe(true);
    expect(preguntasAbiertas(fila({ fichaMotor: FICHA, avance: { capitulo: 4, preguntasPadreAbiertas: false } }))).toBe(false);
    expect(preguntasAbiertas(fila({ fichaMotor: FICHA, avance: { terminado: true } }))).toBe(false);
    expect(preguntasAbiertas(fila({ termino_at: "2026-10-15T00:00:00Z" }))).toBe(false);
  });
});

describe("leer y fusionar los cambios del panel", () => {
  it("lee solo las tres claves, con su forma", () => {
    expect(leerCambioKids({ hora: "10:00", otra: 1 })).toEqual({ ok: true, cambio: { hora: "10:00" } });
    expect(leerCambioKids({ hora: "10:30" })).toEqual({ ok: false, falla: "hora" }); // no es una opción de la compra
    expect(leerCambioKids({ hora: "23:00" })).toEqual({ ok: false, falla: "hora" });
    expect(leerCambioKids({ temasSacados: ["escuela", "mama", "mama"] })).toEqual({ ok: true, cambio: { temasSacados: ["mama", "escuela"] } });
    expect(leerCambioKids({ temasSacados: ["novia"] })).toEqual({ ok: false, falla: "temas" });
    expect(leerCambioKids({ preguntasPadre: [{ texto: "x", conLinea: "si" }] })).toEqual({ ok: false, falla: "preguntas" });
    expect(leerCambioKids({ preguntasPadre: [{ texto: "x".repeat(401), conLinea: true }] })).toEqual({ ok: false, falla: "preguntas" });
    expect(leerCambioKids({})).toEqual({ ok: false, falla: "malFormado" });
    expect(leerCambioKids(null)).toEqual({ ok: false, falla: "malFormado" });
    for (const h of HORAS_KIDS) expect(leerCambioKids({ hora: h }).ok).toBe(true);
  });

  it("fusiona con lo pendiente: la hora de antes y los temas de ahora van juntos, con la fecha nueva", () => {
    const f = fila({ cambios_panel: { hora: "10:00", pedido_at: "2026-10-15T09:00:00Z" } });
    const r = fusionarCambioKids(f, { temasSacados: ["papa"] }, "2026-10-15T10:00:00Z");
    expect(r).toEqual({ ok: true, cambios: { hora: "10:00", temasSacados: ["papa"], pedido_at: "2026-10-15T10:00:00Z" } });
  });

  it("valida con las reglas de validarFicha y normaliza las preguntas (texto, quien en minúscula, vacías afuera)", () => {
    const r = fusionarCambioKids(
      fila(),
      { preguntasPadre: [{ texto: "  Contame la vez que…  ", conLinea: false, quien: "Tu papá" }, { texto: "   ", conLinea: true }] },
      "2026-10-15T10:00:00Z",
    );
    expect(r).toEqual({ ok: true, cambios: { preguntasPadre: [{ texto: "Contame la vez que…", conLinea: false, quien: "tu papá" }], pedido_at: "2026-10-15T10:00:00Z" } });
    // Lo mismo que haría el motor con esa ficha.
    expect(validarFichaKids({ ...FICHA, preguntasPadre: [{ texto: "  Contame la vez que…  ", conLinea: false, quien: "Tu papá" }] }).preguntasPadre).toEqual(
      (r as { cambios: { preguntasPadre: unknown } }).cambios.preguntasPadre,
    );
  });

  it("más de tres preguntas no pasa", () => {
    const cuatro = [1, 2, 3, 4].map((i) => ({ texto: `p${i}`, conLinea: true }));
    expect(fusionarCambioKids(fila(), { preguntasPadre: cuatro }, "x")).toEqual({ ok: false, falla: "preguntas" });
  });

  it("con las preguntas cerradas, las preguntas no; la hora sí", () => {
    const cerrada = fila({ fichaMotor: FICHA, avance: { capitulo: 4, preguntasPadreAbiertas: false } });
    expect(fusionarCambioKids(cerrada, { preguntasPadre: [] }, "x")).toEqual({ ok: false, falla: "preguntas-cerradas" });
    expect(fusionarCambioKids(cerrada, { hora: "20:00" }, "x").ok).toBe(true);
  });

  it("si terminó, nada", () => {
    expect(fusionarCambioKids(fila({ termino_at: "2026-10-15T00:00:00Z" }), { hora: "20:00" }, "x")).toEqual({ ok: false, falla: "terminado" });
  });

  it("valida contra la ficha del motor si ya arrancó, y el formulario muestra lo pendiente", () => {
    const motor = { ...FICHA, hora: "17:00", temasSacados: ["mudanza" as const] };
    const f = fila({ fichaMotor: motor, avance: { capitulo: 2, preguntasPadreAbiertas: true }, cambios_panel: { hora: "19:00", pedido_at: "x" } });
    expect(valoresDelPanel(f)).toEqual({ hora: "19:00", temasSacados: ["mudanza"], preguntasPadre: [] });
    expect(valoresDelPanel(fila({ fichaMotor: motor }))).toMatchObject({ hora: "17:00" });
  });
});

describe("correcciones de nombres", () => {
  it("lee, pisa la del mismo nombre y quita", () => {
    expect(leerCorreccion({ respuestaId: "r1", dice: " Yaco ", es: "Jaco" })).toEqual({ ok: true, respuestaId: "r1", dice: "Yaco", es: "Jaco" });
    expect(leerCorreccion({ respuestaId: "r1", dice: "Yaco", es: " " })).toEqual({ ok: false, falla: "vacio" });
    expect(leerCorreccion({ respuestaId: "r1", dice: "Yaco" }, true)).toMatchObject({ ok: true });
    expect(leerCorreccion({ dice: "Yaco", es: "Jaco" })).toEqual({ ok: false, falla: "malFormado" });
    const una = { respuesta_id: "r1", dice: "Yaco", es: "Jaco", at: "1" };
    const lista = conCorreccion([una, { respuesta_id: "r2", dice: "Yaco", es: "Yago", at: "1" }], { respuesta_id: "r1", dice: "yaco", es: "Jacobo", at: "2" });
    expect(lista).toEqual([{ respuesta_id: "r2", dice: "Yaco", es: "Yago", at: "1" }, { respuesta_id: "r1", dice: "yaco", es: "Jacobo", at: "2" }]);
    expect(sinCorreccion(lista, "r1", "YACO")).toEqual([{ respuesta_id: "r2", dice: "Yaco", es: "Yago", at: "1" }]);
    expect(diceEstaEn("Fuimos con yaco al río", "Yaco")).toBe(true);
    expect(diceEstaEn("Fuimos al río", "Yaco")).toBe(false);
  });
});

describe("cómo va, en palabras", () => {
  const base = { estado: "activo", canal: "A" as const, apodo: "Tomi", arranco: true, capitulo: 2, titulo: "Mi gente", termino: false };
  it("por parte, antes, esperando y al terminar", () => {
    expect(estadoKids(base)).toBe("Va por la parte 2, «Mi gente».");
    expect(estadoKids({ ...base, arranco: false, estado: "invitado" })).toBe("Todavía no empezó. Le vamos a escribir a Tomi a la hora que elegiste.");
    expect(estadoKids({ ...base, arranco: false, estado: "invitado", canal: "B" })).toBe("Todavía no empezó. El primer mensaje te llega a tu WhatsApp.");
    expect(estadoKids({ ...base, capitulo: 0, titulo: null })).toContain("«Dale, vamos»");
    expect(estadoKids({ ...base, termino: true })).toBe("Tomi terminó de contar. Ahora empieza el armado del libro.");
    expect(estadoCortoKids("invitado")).toBe("todavía no empezó");
  });
  it("esKids mira contexto.modo", () => {
    expect(esKids({ contexto: { modo: "kids" } })).toBe(true);
    expect(esKids({ contexto: { modo: "viaje" } })).toBe(false);
    expect(esKids({ contexto: null })).toBe(false);
  });
});

const FILA_BASE = { narrador_id: "n1", canal: "A", ficha: FICHA, fichaMotor: null, cambios_panel: null, cambios_error: null, avance: {}, correcciones: [], termino_at: null };

describe("guardar los cambios del panel (compare-and-swap del CONTRATO)", () => {
  it("con nada pendiente, escribe WHERE cambios_panel IS NULL, borra el error y no toca version", async () => {
    const { admin, llamadas } = baseFalsa({ kids_v2: [{ data: { ...FILA_BASE, cambios_error: "preguntas-cerradas" }, error: null }, { data: [{ narrador_id: "n1" }], error: null }] });
    const r = await guardarCambiosPanel(admin, "n1", { hora: "20:00" }, "2026-10-15T10:00:00Z");
    expect(r).toEqual({ ok: true, cambios: { hora: "20:00", pedido_at: "2026-10-15T10:00:00Z" } });
    const update = llamadas.find((l) => l.metodo === "update")!;
    expect(update.args[0]).toEqual({ cambios_panel: { hora: "20:00", pedido_at: "2026-10-15T10:00:00Z" }, cambios_error: null });
    expect(JSON.stringify(update.args[0])).not.toContain("version");
    expect(llamadas).toContainEqual({ tabla: "kids_v2", metodo: "is", args: ["cambios_panel", null] });
  });

  it("si pierde el CAS (el entrevistador tomó lo pendiente en el medio), relee y reintenta con lo nuevo", async () => {
    const pendiente = { hora: "10:00", pedido_at: "2026-10-15T09:00:00Z" };
    const { admin, llamadas } = baseFalsa({
      kids_v2: [
        { data: { ...FILA_BASE, cambios_panel: pendiente }, error: null },
        { data: [], error: null }, // perdió: ya no estaba eso
        { data: { ...FILA_BASE, cambios_panel: null }, error: null }, // lo tomó el entrevistador
        { data: [{ narrador_id: "n1" }], error: null },
      ],
    });
    const r = await guardarCambiosPanel(admin, "n1", { temasSacados: ["mama"] }, "2026-10-15T10:00:00Z");
    expect(r).toEqual({ ok: true, cambios: { temasSacados: ["mama"], pedido_at: "2026-10-15T10:00:00Z" } });
    const updates = llamadas.filter((l) => l.metodo === "update").map((l) => l.args[0]);
    expect(updates[0]).toEqual({ cambios_panel: { hora: "10:00", temasSacados: ["mama"], pedido_at: "2026-10-15T10:00:00Z" }, cambios_error: null });
    expect(updates[1]).toEqual({ cambios_panel: { temasSacados: ["mama"], pedido_at: "2026-10-15T10:00:00Z" }, cambios_error: null });
    // La primera condición fue sobre lo leído; la segunda, IS NULL.
    expect(llamadas).toContainEqual({ tabla: "kids_v2", metodo: "eq", args: ["cambios_panel", JSON.stringify(pendiente)] });
    expect(llamadas).toContainEqual({ tabla: "kids_v2", metodo: "is", args: ["cambios_panel", null] });
  });

  it("si pierde siempre, se rinde con «ocupado» sin escribir de más", async () => {
    const vueltas = Array.from({ length: 4 }, () => [{ data: FILA_BASE, error: null }, { data: [], error: null }]).flat();
    const { admin, llamadas } = baseFalsa({ kids_v2: vueltas });
    expect(await guardarCambiosPanel(admin, "n1", { hora: "20:00" }, "x")).toEqual({ ok: false, falla: "ocupado" });
    expect(llamadas.filter((l) => l.metodo === "update").length).toBe(4);
  });

  it("un cambio inválido o con las preguntas cerradas no escribe", async () => {
    const cerrada = { ...FILA_BASE, fichaMotor: FICHA, avance: { capitulo: 4, preguntasPadreAbiertas: false } };
    const { admin, llamadas } = baseFalsa({ kids_v2: [{ data: cerrada, error: null }] });
    expect(await guardarCambiosPanel(admin, "n1", { preguntasPadre: [{ texto: "hola", conLinea: true }] }, "x")).toEqual({ ok: false, falla: "preguntas-cerradas" });
    expect(llamadas.some((l) => l.metodo === "update")).toBe(false);
  });

  it("sin fila (no es de Kids) o sin la tabla, no escribe", async () => {
    const sinFila = baseFalsa({ kids_v2: [{ data: null, error: null }] });
    expect(await guardarCambiosPanel(sinFila.admin, "n1", { hora: "20:00" }, "x")).toEqual({ ok: false, falla: "noKids" });
    const sinTabla = baseFalsa({ kids_v2: [{ data: null, error: { code: "42P01", message: 'relation "kids_v2" does not exist' } }] });
    expect(await guardarCambiosPanel(sinTabla.admin, "n1", { hora: "20:00" }, "x")).toEqual({ ok: false, falla: "noKids" });
  });
});

describe("guardar una corrección (compare-and-swap sobre correcciones)", () => {
  const respuesta = { data: { id: "r1", transcripcion: "Fui con Yaco", texto_directo: null }, error: null };

  it("agrega con WHERE correcciones = lo leído, y reintenta si perdió", async () => {
    const previa = { respuesta_id: "r9", dice: "Tini", es: "Tiny", at: "1" };
    const { admin, llamadas } = baseFalsa({
      respuestas: [respuesta],
      kids_v2: [
        { data: { ...FILA_BASE, correcciones: [] }, error: null },
        { data: [], error: null },
        { data: { ...FILA_BASE, correcciones: [previa] }, error: null },
        { data: [{ narrador_id: "n1" }], error: null },
      ],
    });
    const r = await guardarCorreccion(admin, "n1", { respuestaId: "r1", dice: "Yaco", es: "Jaco" }, "agregar", "2026-10-15T10:00:00Z");
    expect(r).toEqual({ ok: true, correcciones: [previa, { respuesta_id: "r1", dice: "Yaco", es: "Jaco", at: "2026-10-15T10:00:00Z" }] });
    expect(llamadas).toContainEqual({ tabla: "kids_v2", metodo: "eq", args: ["correcciones", "[]"] });
    expect(llamadas).toContainEqual({ tabla: "kids_v2", metodo: "eq", args: ["correcciones", JSON.stringify([previa])] });
    // La respuesta tiene que ser de este chico.
    expect(llamadas).toContainEqual({ tabla: "respuestas", metodo: "eq", args: ["narrador_id", "n1"] });
    expect(llamadas.filter((l) => l.metodo === "update").every((l) => !JSON.stringify(l.args[0]).includes("version"))).toBe(true);
  });

  it("un nombre que no está en la respuesta, o una respuesta de otro, no escribe", async () => {
    const noEsta = baseFalsa({ respuestas: [respuesta] });
    expect(await guardarCorreccion(noEsta.admin, "n1", { respuestaId: "r1", dice: "Pepe", es: "Pepa" }, "agregar", "x")).toEqual({ ok: false, falla: "no-esta" });
    const ajena = baseFalsa({ respuestas: [{ data: null, error: null }] });
    expect(await guardarCorreccion(ajena.admin, "n1", { respuestaId: "rX", dice: "Yaco", es: "Jaco" }, "agregar", "x")).toEqual({ ok: false, falla: "respuesta" });
    expect([...noEsta.llamadas, ...ajena.llamadas].some((l) => l.tabla === "kids_v2")).toBe(false);
  });

  it("con la transcripción vacía, valida contra lo escrito (como la vista)", async () => {
    const { admin } = baseFalsa({
      respuestas: [{ data: { id: "r1", transcripcion: "   ", texto_directo: "Fui con Yaco" }, error: null }],
      kids_v2: [{ data: FILA_BASE, error: null }, { data: [{ narrador_id: "n1" }], error: null }],
    });
    expect(await guardarCorreccion(admin, "n1", { respuestaId: "r1", dice: "Yaco", es: "Jaco" }, "agregar", "x")).toMatchObject({ ok: true });
  });

  it("quitar saca la del nombre", async () => {
    const una = { respuesta_id: "r1", dice: "Yaco", es: "Jaco", at: "1" };
    const { admin, llamadas } = baseFalsa({ respuestas: [respuesta], kids_v2: [{ data: { ...FILA_BASE, correcciones: [una] }, error: null }, { data: [{ narrador_id: "n1" }], error: null }] });
    expect(await guardarCorreccion(admin, "n1", { respuestaId: "r1", dice: "yaco", es: "" }, "quitar", "x")).toEqual({ ok: true, correcciones: [] });
    expect(llamadas.find((l) => l.metodo === "update")!.args[0]).toEqual({ correcciones: [] });
  });
});

describe("leer la fila", () => {
  it("sin la tabla, null sin error (el tablero sigue como hoy)", async () => {
    const { admin } = baseFalsa({ kids_v2: [{ data: null, error: { code: "PGRST205", message: "Could not find the table 'public.kids_v2'" } }] });
    expect(await leerFilaKids(admin, "n1")).toEqual({ fila: null, error: null });
  });
  it("otro error de la base, sí es error", async () => {
    const { admin } = baseFalsa({ kids_v2: [{ data: null, error: { code: "57014", message: "timeout" } }] });
    expect((await leerFilaKids(admin, "n1")).error).toBe("timeout");
  });
  it("leerPanelKids arma lo que cuenta con la ficha del motor", async () => {
    const motor = { ...FICHA, preguntasPadre: [{ texto: "Contame la bici.", conLinea: true }] };
    const { admin } = baseFalsa({
      kids_v2: [{ data: { ...FILA_BASE, fichaMotor: motor }, error: null }],
      respuestas: [{ data: [resp("PADRE-1", { transcripcion: "la bici roja" })], error: null }],
      fotos: [{ data: [], error: null }],
    });
    const { vista } = await leerPanelKids(admin, "n1");
    expect(vista!.capitulos[0]).toMatchObject({ n: 4, preguntas: [{ clave: "PADRE-1", texto: "Contame la bici." }] });
  });
});

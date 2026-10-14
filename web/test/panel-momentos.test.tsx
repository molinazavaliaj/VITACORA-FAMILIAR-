import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// El panel del rediseño (fase 2): los tres momentos, la línea de tiempo, lo
// último que contó, «Tu pedido» y el femenino. Se renderiza en el servidor con
// datos falsos y se mira el HTML, como los demás tests del panel.

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => "/tablero/n1", useSearchParams: () => new URLSearchParams() }));

import { esElla, lineaDeTiempo, momentoDe, primerNombre, titularDe } from "../src/app/tablero/momento";
import { resumirPedido } from "../src/app/tablero/_historia/pedido";
import { diasDesde, mmss, vozClasica, vozV3, vozViaje } from "../src/app/tablero/_historia/voz";
import { CifrasHistoria, PortadaHistoria } from "../src/app/tablero/_historia/portada";
import { HojaFotos, HojaPedido, HojaUltimo, HojaWhatsApp, HojaFamilia, EnlaceDudas } from "../src/app/tablero/_historia/lateral";
import { PANEL, type Quien } from "../src/app/_textos/panel";
import { EditorGuion, SugerirPreguntas } from "../src/app/tablero/[narradorId]/preguntas/acciones";
import { HistoriaV3 } from "../src/app/tablero/[narradorId]/v3";
import { rutaDeOtraHistoria } from "../src/app/tablero/nav";
import type { BloqueHistoriaV3 } from "@/lib/v3";

const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);
const VOSEO = /\b(acá|Acá|podés|Podés|querés|Escribinos|escribinos|Invitá|Sumá|sumá|tenés)\b/;
// Lo que el sistema hoy no cumple (DECISIONES D4) y la garantía fuera de lugar (D1).
const PROHIBIDO = /Anticipo|anticipo|escribiéndose|9 días|nueve días|te devolvemos|devolvemos el dinero/;

const el: Quien = { como: "Antonio", propia: false, ella: false, viaje: false };
const ella: Quien = { ...el, como: "Carmen", ella: true };
const yo: Quien = { ...el, propia: true };
const viajera: Quien = { como: "Sara", propia: true, ella: true, viaje: true };

describe("los tres momentos (narradores.estado)", () => {
  it("antes de empezar, en marcha y libro listo", () => {
    for (const e of ["pendiente_pago", "regalo_pendiente", "invitado", "acepto"]) expect(momentoDe(e, false)).toBe("antes");
    for (const e of ["activo", "pausado"]) expect(momentoDe(e, false)).toBe("marcha");
    // Terminó de contar pero no lo encargaron: el libro todavía no se escribe.
    expect(momentoDe("completado", false)).toBe("marcha");
    expect(momentoDe("cerrado_anticipado", false)).toBe("marcha");
    expect(momentoDe("completado", true)).toBe("listo");
    expect(momentoDe("cerrado_anticipado", true)).toBe("listo");
    // Un estado que no se conoce promete lo menos.
    expect(momentoDe("raro", false)).toBe("marcha");
  });

  it("el titular de cada momento", () => {
    expect(titularDe("regalo_pendiente", false, false)).toBe("antes");
    expect(titularDe("activo", false, false)).toBe("creciendo");
    expect(titularDe("pausado", false, false)).toBe("pausa");
    expect(titularDe("completado", false, false)).toBe("termino");
    expect(titularDe("completado", true, false)).toBe("escribiendo");
    expect(titularDe("completado", true, true)).toBe("listo");
  });

  it("los textos de la cabecera, en tú y en vos, sin «él»", () => {
    expect(PANEL.es.titular("antes", el)).toBe("Todo listo para su primer mensaje.");
    expect(PANEL.es.titular("creciendo", el)).toBe("El libro de Antonio va creciendo.");
    expect(PANEL.es.titular("creciendo", yo)).toBe("Tu libro va creciendo.");
    expect(PANEL.es.titular("listo", el)).toBe("El libro de Antonio está listo.");
    expect(PANEL.es.titular("creciendo", viajera)).toBe("Tu viaje ya se está guardando.");
    expect(PANEL.ar.titular("creciendo", el)).toBe("El libro de Antonio va creciendo.");
    for (const t of ["antes", "creciendo", "pausa", "termino", "escribiendo", "listo"] as const) {
      for (const q of [el, ella, yo, viajera]) {
        expect(PANEL.es.titular(t, q)).not.toMatch(/\bél\b|\bella\b/);
        expect(PANEL.es.titular(t, q)).not.toMatch(VOSEO);
      }
    }
    expect(primerNombre("Laura Gómez Pardo")).toBe("Laura");
    expect(primerNombre("  ")).toBeNull();
    expect(primerNombre(null)).toBeNull();
  });
});

describe("la línea de tiempo", () => {
  const nombres = (p: ReturnType<typeof lineaDeTiempo>) => p.map((x) => `${x.clave}:${x.estado}`).join(" ");

  it("Pagado → Primer mensaje → Contándolo → Libro listo → Impreso en casa, sin anticipo", () => {
    expect(nombres(lineaDeTiempo({ estado: "regalo_pendiente", aprobado: false, libroEntregado: false, conImpreso: true, impresoEnCasa: false }))).toBe(
      "pagado:hecho primer:actual contando:pendiente listo:pendiente impreso:pendiente",
    );
    expect(nombres(lineaDeTiempo({ estado: "activo", aprobado: false, libroEntregado: false, conImpreso: false, impresoEnCasa: false }))).toBe(
      "pagado:hecho primer:hecho contando:actual listo:pendiente",
    );
    expect(nombres(lineaDeTiempo({ estado: "completado", aprobado: true, libroEntregado: false, conImpreso: true, impresoEnCasa: false }))).toBe(
      "pagado:hecho primer:hecho contando:hecho listo:actual impreso:pendiente",
    );
    expect(nombres(lineaDeTiempo({ estado: "completado", aprobado: true, libroEntregado: true, conImpreso: true, impresoEnCasa: true }))).toBe(
      "pagado:hecho primer:hecho contando:hecho listo:hecho impreso:hecho",
    );
    expect(nombres(lineaDeTiempo({ estado: "pendiente_pago", aprobado: false, libroEntregado: false, conImpreso: false, impresoEnCasa: false }))).toBe(
      "pagado:actual primer:pendiente contando:pendiente listo:pendiente",
    );
  });

  it("se pinta con sus nombres; en viaje, «De viaje»", () => {
    const pasos = lineaDeTiempo({ estado: "activo", aprobado: false, libroEntregado: false, conImpreso: true, impresoEnCasa: false });
    const html = renderToStaticMarkup(<PortadaHistoria idioma="es" quien={el} hola="Laura" titular="creciendo" estado="Está respondiendo, a su ritmo" tapa={{ titulo: "Antonio García", fotoSrc: null, idioma: "es" }} pasos={pasos} />);
    for (const t of ["Pagado", "Primer mensaje", "Contándolo", "Libro listo", "Impreso en casa", "Hola, Laura.", "El libro de Antonio va creciendo.", "EL LIBRO DE SU VIDA"]) {
      expect(html, t).toContain(escapar(t));
    }
    expect(html).toContain('aria-current="step"');
    expect(html).not.toMatch(PROHIBIDO);
    const deViaje = renderToStaticMarkup(<PortadaHistoria idioma="es" quien={viajera} hola="Sara" titular="creciendo" estado="" tapa={{ titulo: "Sara", fotoSrc: null, idioma: "es" }} pasos={pasos} />);
    expect(deViaje).toContain("De viaje");
    expect(deViaje).not.toContain("Contándolo");
  });

  it("un invitado no recibe saludo (no es quien compró)", () => {
    const html = renderToStaticMarkup(<PortadaHistoria idioma="es" quien={el} hola={null} titular="creciendo" estado="" tapa={{ titulo: "Antonio", fotoSrc: null, idioma: "es" }} pasos={[]} />);
    expect(html).not.toContain("Hola,");
  });
});

describe("lo último que contó y las cifras", () => {
  const fila = (id: string, orden: number, dias: number, extra: Partial<{ audio_path: string | null; es_repregunta: boolean; duracion_segundos: number }> = {}) => ({
    id, pregunta_orden: orden, audio_path: "a.ogg", duracion_segundos: 60, es_repregunta: false, recibido_at: new Date(Date.UTC(2026, 9, 14 - dias)).toISOString(), ...extra,
  });

  it("guion clásico: las tres más nuevas con audio, con la pregunta como título", () => {
    const voz = vozClasica([fila("a", 1, 9), fila("b", 2, 5), fila("c", 2, 4, { es_repregunta: true }), fila("d", 3, 2, { audio_path: null }), fila("e", 4, 1)], (o) => `Pregunta ${o}`);
    expect(voz.respuestas).toBe(4);
    expect(voz.segundos).toBe(300);
    expect(voz.ultimas.map((u) => u.id)).toEqual(["e", "c", "b"]);
    expect(voz.ultimas[0].titulo).toBe("Pregunta 4");
  });

  it("viaje: cuenta solo las noches del viaje", () => {
    const voz = vozViaje([fila("a", 1, 3), fila("b", 2, 2), fila("c", 9, 1)], 8, (o) => `Noche ${o}`);
    expect(voz.respuestas).toBe(2);
    expect(voz.ultimas[0].titulo).toBe("Noche 9");
  });

  it("V3: lo reservado cuenta para el cierre pero no suena ni se ve", () => {
    const r = (id: string, dias: number) => ({ id, texto: "x", audio: true, duracion: 60, recibidoAt: new Date(Date.UTC(2026, 9, 14 - dias)).toISOString() });
    const bloques: BloqueHistoriaV3[] = [
      { nombre: null, preguntas: [
        { clave: "OR1", pregunta: "¿Dónde naciste?", estado: "contestada", reservada: false, respuestas: [r("a", 5)] },
        { clave: "CA1", pregunta: "Algo reservado", estado: "contestada", reservada: true, respuestas: [] },
        { clave: "CA2", pregunta: "¿Qué recuerdas de la escuela?", estado: "contestada", reservada: false, respuestas: [r("b", 1)] },
        { clave: "CA3", pregunta: "La que espera", estado: "esperando", reservada: false, respuestas: [] },
      ] },
    ];
    const voz = vozV3(bloques);
    expect(voz.respuestas).toBe(3);
    expect(voz.ultimas.map((u) => u.titulo)).toEqual(["¿Qué recuerdas de la escuela?", "¿Dónde naciste?"]);
  });

  it("«Hoy», «Ayer», «Hace 4 días» y la duración", () => {
    const ahora = new Date("2026-10-14T12:00:00Z");
    expect(diasDesde("2026-10-14T08:00:00Z", ahora)).toBe(0);
    expect(diasDesde("2026-10-13T23:00:00Z", ahora)).toBe(1);
    expect(diasDesde("2026-10-10T08:00:00Z", ahora)).toBe(4);
    expect(mmss(348)).toBe("5:48");
    expect(mmss(null)).toBe("");
    const html = renderToStaticMarkup(
      <HojaUltimo idioma="es" quien={el} ahora={ahora} hrefTodo="#lo-contado" ultimas={[{ id: "a", titulo: "¿Dónde naciste?", duracion: 348, recibidoAt: "2026-10-10T08:00:00Z" }]} />,
    );
    for (const t of ["Lo último que contó", "¿Dónde naciste?", "5:48", "Hace 4 días", "Ver todo"]) expect(html, t).toContain(escapar(t));
    // Un solo <audio> para todos, que no baja nada hasta tocar play.
    expect(html.match(/<audio/g)?.length).toBe(1);
    expect(html).toContain('preload="none"');
    expect(renderToStaticMarkup(<HojaUltimo idioma="es" quien={el} ahora={ahora} hrefTodo="#" ultimas={[]} />)).toBe("");
  });

  it("las cifras: sin respuestas no hay nada", () => {
    expect(renderToStaticMarkup(<CifrasHistoria idioma="es" quien={el} respuestas={0} segundos={0} />)).toBe("");
    const html = renderToStaticMarkup(<CifrasHistoria idioma="es" quien={el} respuestas={11} segundos={34 * 60} />);
    expect(html).toContain(">11<");
    expect(html).toContain("min de su voz");
  });
});

describe("tu pedido: pausar y cancelar abren contacto, sin tocar la base", () => {
  const contacto = { whatsapp: "https://wa.me/34600000000", correo: "hola@vitacorafamiliar.com" };

  it("lo comprado, de la familia dueña y sin pedidos fallidos", () => {
    const pedidos = [
      { estado: "pagado", extras: { pdf: true, impreso: "color", copias: 2, marcos: 1 }, familia_id: "f1" },
      { estado: "fallido", extras: { pdf: true, impreso: "color", copias: 5, marcos: 3 }, familia_id: "f1" },
      { estado: "entregado", extras: { pdf: true }, familia_id: "otra" },
    ];
    expect(resumirPedido(pedidos, [{ estado: "lista" }], "f1")).toEqual({ impresos: 2, marcos: 1, libroEntregado: false, impresoEnCasa: false, direccionEditable: true });
    expect(resumirPedido([{ estado: "entregado", extras: { pdf: true }, familia_id: "f1" }], [{ estado: "entregado" }], "f1")).toMatchObject({ libroEntregado: true, impresoEnCasa: true, direccionEditable: false });
  });

  it("en marcha: pausar o cerrar; antes: cancelar. Sin garantía ni promesas", () => {
    const marcha = renderToStaticMarkup(<HojaPedido idioma="es" quien={el} momento="marcha" lineas={{ impresos: 1, marcos: 0 }} hrefDireccion="/x#envio" hrefMarco="/x" contacto={contacto} />);
    for (const t of ["Tu pedido", "Entrevista + libro digital", "Libro impreso, tapa dura", "Cambiar la dirección de envío", "Añadir el marco", "Pausar o cerrar el libro"]) expect(marcha, t).toContain(escapar(t));
    expect(marcha).not.toContain("Cancelar el pedido");
    expect(marcha).not.toMatch(PROHIBIDO);
    // Ningún botón del pedido llama a la API: solo abre la hoja.
    expect(marcha).not.toContain("/api/");
    const antes = renderToStaticMarkup(<HojaPedido idioma="es" quien={el} momento="antes" lineas={{ impresos: 0, marcos: 0 }} contacto={contacto} />);
    expect(antes).toContain("Cancelar el pedido");
    expect(antes).not.toContain("Pausar o cerrar");
    expect(antes).not.toContain("Libro impreso");
    expect(PANEL.es.cancelarTexto).not.toMatch(PROHIBIDO);
    expect(PANEL.es.pausarTexto(el)).not.toMatch(PROHIBIDO);
    const listo = renderToStaticMarkup(<HojaPedido idioma="es" quien={el} momento="listo" lineas={{ impresos: 1, marcos: 1 }} contacto={contacto} />);
    expect(listo).not.toContain("Pausar");
    expect(listo).not.toContain("Cancelar");
  });

  it("España de tú y Argentina de vos en las hojas", () => {
    const todo = (idioma: "es" | "ar") =>
      [
        renderToStaticMarkup(<HojaPedido idioma={idioma} quien={el} momento="marcha" lineas={{ impresos: 1, marcos: 0 }} hrefMarco="/x" contacto={contacto} />),
        renderToStaticMarkup(<HojaFotos idioma={idioma} quien={el} fotos={[]} hayPortada={false} />),
        renderToStaticMarkup(<HojaWhatsApp idioma={idioma} quien={el} telefono={null} hrefTarjeta="/t" />),
        renderToStaticMarkup(<HojaFamilia idioma={idioma} quien={el}>x</HojaFamilia>),
        renderToStaticMarkup(<EnlaceDudas idioma={idioma} contacto={contacto} />),
        PANEL[idioma].pausarTexto(el),
        PANEL[idioma].cancelarTexto,
      ].join("\n");
    const es = todo("es");
    expect(es).not.toMatch(VOSEO);
    for (const t of ["Puedes añadirla hasta que cerremos su libro.", "Invita a tus hermanos", "¿Dudas? Escríbenos, te contesta una persona.", "Escríbenos y paramos"]) expect(es, t).toContain(escapar(t));
    const ar = todo("ar");
    for (const t of ["Podés sumarla hasta que cerremos su libro.", "Invitá a tus hermanos", "¿Dudas? Escribinos, te contesta una persona.", "Sumar el marco"]) expect(ar, t).toContain(escapar(t));
    expect(ar).not.toMatch(/Escríbenos|Puedes|Invita a/);
  });

  it("sin WhatsApp de dudas, el correo", () => {
    const html = renderToStaticMarkup(<EnlaceDudas idioma="es" contacto={{ whatsapp: null, correo: "hola@vitacorafamiliar.com" }} />);
    expect(html).toContain("mailto:hola@vitacorafamiliar.com");
  });
});

describe("femenino: los textos con «él» pasan por contexto.genero", () => {
  it("esElla lee contexto.genero", () => {
    expect(esElla({ genero: "mujer" })).toBe(true);
    expect(esElla({ genero: "varon" })).toBe(false);
    expect(esElla({})).toBe(false);
    expect(esElla(null)).toBe(false);
  });

  it("las preguntas finales y las sugeridas dicen «ella»", () => {
    const futuras = [{ id: "p1", orden: 30, texto: "Final", capitulo: "La sabiduría", tipo: "adaptativa" as const }];
    const deEl = renderToStaticMarkup(<EditorGuion narradorId="n1" futuras={futuras} puedeEditar puedeSaltar={false} />);
    const deElla = renderToStaticMarkup(<EditorGuion narradorId="n1" futuras={futuras} puedeEditar puedeSaltar={false} ella />);
    expect(deEl).toContain("con lo que él haya contado");
    expect(deElla).toContain("con lo que ella haya contado");
    expect(deElla).not.toContain("él haya");
    expect(renderToStaticMarkup(<SugerirPreguntas narradorId="n1" lugarLibre={3} ella />)).toContain("con lo que ella contó hasta hoy");
    expect(renderToStaticMarkup(<SugerirPreguntas narradorId="n1" lugarLibre={3} />)).toContain("con lo que él contó hasta hoy");
  });

  it("ningún texto nuevo del panel dice «él»", () => {
    for (const idioma of ["es", "ar"] as const) {
      const T = PANEL[idioma];
      const textos = [T.pausarTexto(ella), T.familiaTexto(ella), T.fotos(ella), T.faltaPortada(ella), T.fotosTexto(ella), T.ultimo(ella), T.whatsapp(ella), T.whatsappFalta, T.minutosDeVoz(ella)];
      for (const t of textos) expect(t, t).not.toMatch(/\bél\b/);
    }
  });
});

describe("la historia V3 adentro del marco nuevo", () => {
  const props = {
    n: { id: "n1", nombre: "Antonio García", como_le_dicen: "Antonio", estado: "activo", alerta_silencio: false },
    rol: "duena" as const, propia: false, bloques: [], fotos: [], usuarioId: "u1", historiasRiel: [{ id: "n1", nombre: "Antonio García", rol: "duena" as const, estado: "activo" }],
    aprobado: false, historiaCerrada: false, linkPublico: null, invitados: [], ritmo: "diario" as const, alFinal: false, trato: "tu" as const,
  };
  it("sin el marco, como siempre: riel, título y Compartir", () => {
    const html = renderToStaticMarkup(<HistoriaV3 {...props} />);
    expect(html).toContain("La historia de Antonio García");
    expect(html).toContain("Compartir");
  });
  it("en el marco: sin título ni riel, Compartir y subir fotos van al lateral", () => {
    const html = renderToStaticMarkup(<HistoriaV3 {...props} enMarco />);
    expect(html).not.toContain("La historia de Antonio García");
    expect(html).not.toContain("Compartir");
    expect(html).not.toContain("Agregar fotos");
    expect(html).toContain("Cuando conteste la primera pregunta, lo que cuente aparece aquí.");
  });
});

describe("cambiar de historia desde la cabecera", () => {
  it("se queda en la misma pantalla si existe en todas; si no, la historia", () => {
    expect(rutaDeOtraHistoria("/tablero/a/libro", "b")).toBe("/tablero/b/libro");
    expect(rutaDeOtraHistoria("/tablero/a/leer", "b")).toBe("/tablero/b/leer");
    expect(rutaDeOtraHistoria("/tablero/a/dudas", "b")).toBe("/tablero/b");
    expect(rutaDeOtraHistoria("/tablero", "b")).toBe("/tablero/b");
  });
});

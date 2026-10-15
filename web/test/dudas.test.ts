import { describe, it, expect } from "vitest";
import {
  validarCorreccionesFamilia,
  estadoDelPlazo,
  fusionarCorrecciones,
  leerDudas,
  leerCorreccionesGuardadas,
  correccionesPorDuda,
  hayDudasSinContestar,
  zonaParaFechas,
  fechaDelPlazo,
  fechaDeRespuesta,
  horasPlazoDudas,
  HORAS_PLAZO_DUDAS,
  type DudaFamilia,
} from "../src/lib/dudas";
import { pedidosDeLoQueCambio } from "../src/lib/dudas-formulario";

// La pantalla de dudas (CONTRATO, "Escritor V3 en la fábrica"): la Etapa A deja
// sus dudas de datos y la familia las contesta antes de que el libro se escriba.
// Lo puro: qué se puede guardar y cuánto tiempo queda.

const DUDAS: DudaFamilia[] = [
  { id: "D01", pregunta: "¿Cómo se llamaba la Negra?", tipo: "nombre", que: "", ids: [], citas: [] },
  { id: "D02", pregunta: "¿En qué año se mudaron?", tipo: "fecha", que: "", ids: [], citas: [] },
];

describe("validarCorreccionesFamilia", () => {
  it("acepta las que contestan una duda que existe, y las limpia", () => {
    const r = validarCorreccionesFamilia([{ dudaId: "D01", texto: "  Ofelia  " }], DUDAS);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.correcciones).toHaveLength(1);
      expect(r.correcciones[0]).toMatchObject({ dudaId: "D01", texto: "Ofelia" });
    }
  });

  it("descarta las vacías en vez de guardar una respuesta en blanco", () => {
    const r = validarCorreccionesFamilia(
      [{ dudaId: "D01", texto: "   " }, { dudaId: "D02", texto: "1972" }],
      DUDAS,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.correcciones).toHaveLength(1);
      expect(r.correcciones[0]).toMatchObject({ dudaId: "D02", texto: "1972" });
    }
  });

  it("rechaza una duda que no existe: el archivo lo lee la fábrica y un id inventado la confunde", () => {
    const r = validarCorreccionesFamilia([{ dudaId: "D99", texto: "algo" }], DUDAS);
    expect(r.ok).toBe(false);
  });

  it("se queda con la última cuando dos personas contestan la misma duda", () => {
    const r = validarCorreccionesFamilia(
      [{ dudaId: "D01", texto: "Ofelia" }, { dudaId: "D01", texto: "Ofelia Rodríguez" }],
      DUDAS,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.correcciones).toHaveLength(1);
      expect(r.correcciones[0]).toMatchObject({ dudaId: "D01", texto: "Ofelia Rodríguez" });
    }
  });

  it("una vacía marcada como borrada sí viaja: el familiar vació un campo que tenía texto", () => {
    const r = validarCorreccionesFamilia([{ dudaId: "D01", texto: "", borrar: true, antes: "Ofelia" }], DUDAS);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.correcciones).toEqual([{ dudaId: "D01", texto: "", borrar: true, antes: "Ofelia" }]);
  });

  it("el quien que manda el navegador no se usa: lo pone el servidor", () => {
    const r = validarCorreccionesFamilia([{ dudaId: "D01", texto: "Ofelia", quien: "otro" }], DUDAS);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.correcciones[0]).not.toHaveProperty("quien");
  });

  it("rechaza lo que no es una lista, o una respuesta sin texto", () => {
    expect(validarCorreccionesFamilia("no", DUDAS).ok).toBe(false);
    expect(validarCorreccionesFamilia([{ dudaId: "D01" }], DUDAS).ok).toBe(false);
  });

  it("corta un texto larguísimo en vez de rechazarlo: lo escribió una persona, no se le pierde", () => {
    const r = validarCorreccionesFamilia([{ dudaId: "D01", texto: "x".repeat(3000) }], DUDAS);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.correcciones[0].texto.length).toBeLessThanOrEqual(2000);
  });
});

describe("estadoDelPlazo", () => {
  const aviso = "2026-10-12T10:00:00.000Z";

  it("mientras no venció, dice hasta cuándo", () => {
    const r = estadoDelPlazo(aviso, false, new Date("2026-10-12T12:00:00.000Z"));
    expect(r.estado).toBe("abierto");
    expect(r.venceAt).toEqual(new Date(Date.parse(aviso) + HORAS_PLAZO_DUDAS * 3600_000));
  });

  it("vencido pero sin libro todavía: se puede contestar igual", () => {
    const r = estadoDelPlazo(aviso, false, new Date("2026-10-14T10:00:00.000Z"));
    expect(r.estado).toBe("vencido");
  });

  it("con el libro escrito ya no sirve contestar, aunque el plazo no haya vencido", () => {
    const r = estadoDelPlazo(aviso, true, new Date("2026-10-12T12:00:00.000Z"));
    expect(r.estado).toBe("libro_escrito");
  });

  it("sin fecha de aviso no inventa un plazo", () => {
    expect(estadoDelPlazo(null, false, new Date()).estado).toBe("abierto");
    expect(estadoDelPlazo(null, false, new Date()).venceAt).toBeNull();
  });

  it("una fecha de aviso rota se trata como si no estuviera", () => {
    const r = estadoDelPlazo("cualquier cosa", false, new Date());
    expect(r.estado).toBe("abierto");
    expect(r.venceAt).toBeNull();
  });

  it("usa las horas que se le pasan (ESCRITOR_ESPERA_DUDAS_HORAS)", () => {
    const r = estadoDelPlazo(aviso, false, new Date("2026-10-12T12:00:00.000Z"), 1);
    expect(r.estado).toBe("vencido");
  });
});

// Dos familiares contestando a la vez (revisión del PR #22): el archivo se
// arma juntando lo guardado con lo que llega, duda por duda.
describe("fusionarCorrecciones", () => {
  const ahora = new Date("2026-10-12T15:00:00.000Z");
  const antes = "2026-10-11T09:00:00.000Z";
  const hija = { quien: "Laura", mail: "laura@mail.com" };

  it("una duda que no viene en el pedido se conserva: lo que contestó otro no se pierde", () => {
    const guardadas = [{ dudaId: "D01", texto: "Ofelia", quien: "Laura", cuando: antes }];
    const r = fusionarCorrecciones(guardadas, [{ dudaId: "D02", texto: "1972" }], DUDAS, { mail: "tio@mail.com" }, ahora);
    expect(r).toEqual([
      { dudaId: "D01", texto: "Ofelia", quien: "Laura", cuando: antes },
      { dudaId: "D02", texto: "1972", mail: "tio@mail.com", cuando: ahora.toISOString() },
    ]);
  });

  it("si el texto no cambió, conserva quién la contestó y cuándo", () => {
    const guardadas = [{ dudaId: "D01", texto: "Ofelia", quien: "Laura", cuando: antes }];
    const r = fusionarCorrecciones(guardadas, [{ dudaId: "D01", texto: "Ofelia" }], DUDAS, { quien: "Pedro" }, ahora);
    expect(r).toEqual(guardadas);
  });

  it("si el texto cambió, la respuesta pasa a ser de quien la cambió, con la fecha de ahora", () => {
    const guardadas = [{ dudaId: "D01", texto: "Ofelia", quien: "Pedro", cuando: antes }];
    const r = fusionarCorrecciones(guardadas, [{ dudaId: "D01", texto: "Ofelia Rodríguez" }], DUDAS, hija, ahora);
    expect(r).toEqual([{ dudaId: "D01", texto: "Ofelia Rodríguez", quien: "Laura", mail: "laura@mail.com", cuando: ahora.toISOString() }]);
  });

  it("una borrada explícita se saca", () => {
    const guardadas = [{ dudaId: "D01", texto: "Ofelia", cuando: antes }, { dudaId: "D02", texto: "1972", cuando: antes }];
    const r = fusionarCorrecciones(guardadas, [{ dudaId: "D01", texto: "", borrar: true, antes: "Ofelia" }], DUDAS, hija, ahora);
    expect(r).toEqual([{ dudaId: "D02", texto: "1972", cuando: antes }]);
  });

  it("no borra lo que otro cambió mientras tanto: el que vació el campo no lo había visto", () => {
    const guardadas = [{ dudaId: "D01", texto: "Ofelia Rodríguez", cuando: antes }];
    const r = fusionarCorrecciones(guardadas, [{ dudaId: "D01", texto: "", borrar: true, antes: "Ofelia" }], DUDAS, hija, ahora);
    expect(r).toEqual(guardadas);
  });

  it("conserva siempre las de los socios: sin dudaId o con un id que no está en las dudas", () => {
    const guardadas = [
      { texto: "El abuelo nació en Salto, no en Paysandú." },
      { dudaId: "VIEJA-7", texto: "Se llamaba Tito." },
    ];
    const r = fusionarCorrecciones(guardadas, [{ dudaId: "D01", texto: "Ofelia" }], DUDAS, hija, ahora);
    expect(r.slice(0, 2)).toEqual(guardadas);
    expect(r).toHaveLength(3);
  });
});

// El formulario manda solo lo que cambió este familiar (revisión del PR #22).
describe("pedidosDeLoQueCambio", () => {
  const ids = [{ id: "D01" }, { id: "D02" }];

  it("no manda lo que no tocó, aunque tenga texto: eso lo pudo haber contestado otro", () => {
    expect(pedidosDeLoQueCambio(ids, { D01: "Ofelia", D02: "" }, { D01: "Ofelia", D02: "1972" })).toEqual([
      { dudaId: "D02", texto: "1972", antes: "" },
    ]);
  });

  it("un campo que tenía texto y quedó vacío va como borrado, con lo que decía antes", () => {
    expect(pedidosDeLoQueCambio(ids, { D01: "Ofelia", D02: "" }, { D01: "  ", D02: "" })).toEqual([
      { dudaId: "D01", texto: "", borrar: true, antes: "Ofelia" },
    ]);
  });

  it("sin cambios, no manda nada", () => {
    expect(pedidosDeLoQueCambio(ids, { D01: "Ofelia" }, { D01: "Ofelia " })).toEqual([]);
  });
});

describe("leer los archivos del escritor", () => {
  it("dudas-familia.json con `dudas` que no es lista es un archivo roto, no una pantalla rota", () => {
    expect(leerDudas('{"dudas": {"D01": "x"}}')).toBeNull();
    expect(leerDudas("no es json")).toBeNull();
    expect(leerDudas('{"dudas": [{"id": "D01", "pregunta": "¿Quién?"}]}')).toHaveLength(1);
    expect(leerDudas("{}")).toEqual([]);
  });

  it("una duda sin id o sin pregunta no se muestra", () => {
    expect(leerDudas('{"dudas": [{"id": "D01"}, "x", {"id": "D02", "pregunta": "¿Cuándo?"}]}')).toEqual([{ id: "D02", pregunta: "¿Cuándo?" }]);
  });

  it("correcciones.json se lee como lo lee la fábrica: objeto con lista o lista sola; roto, null", () => {
    expect(leerCorreccionesGuardadas('{"correcciones": [{"texto": "a"}]}')).toEqual([{ texto: "a" }]);
    expect(leerCorreccionesGuardadas('[{"texto": "a"}]')).toEqual([{ texto: "a" }]);
    expect(leerCorreccionesGuardadas('{"correcciones": "a"}')).toBeNull();
    expect(leerCorreccionesGuardadas("{roto")).toBeNull();
  });

  it("correccionesPorDuda ignora lo que no es de una duda", () => {
    const m = correccionesPorDuda([{ texto: "de los socios" }, null, { dudaId: "D01", texto: "Ofelia" }]);
    expect([...m.keys()]).toEqual(["D01"]);
  });
});

// El aviso del Inicio (revisión del PR #22): sigue mientras falte alguna.
describe("hayDudasSinContestar", () => {
  it("con una contestada y otra no, sigue habiendo", () => {
    expect(hayDudasSinContestar(DUDAS, [{ dudaId: "D01", texto: "Ofelia" }])).toBe(true);
  });
  it("con todas contestadas, no", () => {
    expect(hayDudasSinContestar(DUDAS, [{ dudaId: "D01", texto: "Ofelia" }, { dudaId: "D02", texto: "1972" }])).toBe(false);
  });
  it("una corrección de los socios sin dudaId no cuenta como respuesta", () => {
    expect(hayDudasSinContestar(DUDAS, [{ texto: "algo" }, { dudaId: "D01", texto: "Ofelia" }])).toBe(true);
  });
});

// La hora del plazo se renderiza en Vercel (UTC): la zona va siempre explícita.
describe("fechas en la zona de la historia", () => {
  it("usa la zona del narrador si es válida; si no, la de la región de la familia", () => {
    expect(zonaParaFechas("Europe/Madrid", "AR")).toBe("Europe/Madrid");
    expect(zonaParaFechas("cualquier/cosa", "ES")).toBe("Europe/Madrid");
    expect(zonaParaFechas(null, null)).toBe("America/Argentina/Buenos_Aires");
  });

  it("el plazo dice el día de la semana, el número y la hora de esa zona", () => {
    const vence = new Date("2026-10-13T17:00:00.000Z");
    expect(fechaDelPlazo(vence, "America/Argentina/Buenos_Aires")).toBe("martes 13, 14:00");
    expect(fechaDelPlazo(vence, "Europe/Madrid")).toBe("martes 13, 19:00");
  });

  it("la fecha de una respuesta sale en la zona dada, no en la del servidor", () => {
    expect(fechaDeRespuesta("2026-10-13T01:00:00.000Z", "America/Argentina/Buenos_Aires")).toBe("12/10/2026");
    expect(fechaDeRespuesta("2026-10-13T01:00:00.000Z", "Europe/Madrid")).toBe("13/10/2026");
    expect(fechaDeRespuesta("roto", "Europe/Madrid")).toBeNull();
  });
});

describe("horasPlazoDudas", () => {
  it("lee ESCRITOR_ESPERA_DUDAS_HORAS como la fábrica: 24 por defecto, 0 vale, basura es 24", () => {
    expect(horasPlazoDudas(undefined)).toBe(24);
    expect(horasPlazoDudas("48")).toBe(48);
    expect(horasPlazoDudas("0")).toBe(0);
    expect(horasPlazoDudas("x")).toBe(24);
    expect(horasPlazoDudas("-3")).toBe(24);
  });
});

// «Para mí» (15/10): si la dueña compró el libro para sí, la pantalla le habla
// de lo que contó ella, como el resto del panel. Los textos de primera persona
// esperan el OK de Naza (docs/pendiente-aprobar-2026-10-15.md).
import { textosPantallaDudas } from "../src/lib/dudas-textos";

describe("textosPantallaDudas", () => {
  it("de otra persona: los textos aprobados el 12/10, con su nombre", () => {
    const t = textosPantallaDudas(false, "Babu");
    expect(t.titulo).toBe("Dudas sobre lo que contó Babu");
    expect(t.loQueDijo).toBe("Lo que dijo");
    expect(t.sinDudas).toBe("Todavía no hay dudas sobre lo que contó Babu.");
    expect(t.intro).toContain("queda tal como lo contó.");
  });

  it("para mí: primera persona, sin el nombre y sin dos puntos", () => {
    const t = textosPantallaDudas(true, "Naza");
    expect(t.titulo).toBe("Dudas sobre lo que contaste");
    expect(t.loQueDijo).toBe("Lo que dijiste");
    expect(t.sinDudas).toBe("Todavía no hay dudas sobre lo que contaste.");
    expect(t.ningunaDuda).toBe("No quedó ninguna duda. El biógrafo entendió todo lo que contaste.");
    for (const texto of Object.values(t)) {
      expect(texto).not.toContain("Naza");
      expect(texto).not.toMatch(/\bcontó\b|\bdijo\b/);
      expect(texto).not.toContain(":");
    }
  });
});

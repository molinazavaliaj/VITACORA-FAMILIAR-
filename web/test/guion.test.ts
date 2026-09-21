import { describe, it, expect } from "vitest";
import {
  esEditable, validarTexto, lugarLibre, puedeAgregar, puedeSaltar, siguienteOrden,
  renumerar, reordenar, calidadDeFoto, errorDeTipoDeFoto, totalDelGuion, armarGuion, capitulosDelGuion, MENSAJE_HEIC, MAXIMO_FAMILIA, PISO, type PreguntaGuion,
} from "../src/lib/guion";

const fija = (orden: number, extra: Partial<PreguntaGuion> = {}): PreguntaGuion => ({
  id: `p${orden}`, orden, texto: `Pregunta ${orden} del guion, bien larga`, capitulo: "La infancia", tipo: "fija", ...extra,
});
const guionDe = (n: number) => Array.from({ length: n }, (_, i) => fija(i + 1));

describe("esEditable", () => {
  it("lo enviado está congelado; lo futuro se puede tocar", () => {
    expect(esEditable(fija(3), 3)).toBe(false);
    expect(esEditable(fija(4), 3)).toBe(true);
  });
  it("las adaptativas nunca, aunque sean futuras", () => {
    expect(esEditable(fija(27, { tipo: "adaptativa" }), 26)).toBe(false);
  });
});

describe("validarTexto", () => {
  it("limpia espacios y acepta", () => {
    const r = validarTexto("  ¿Cómo   era su   barrio?  ");
    expect(r).toEqual({ ok: true, texto: "¿Cómo era su barrio?" });
  });
  it("rechaza lo muy corto y lo muy largo", () => {
    expect(validarTexto("¿Y?").ok).toBe(false);
    expect(validarTexto("x".repeat(301)).ok).toBe(false);
    expect(validarTexto(42).ok).toBe(false);
  });
});

describe("tope y piso", () => {
  it("con las 26 del guion hay lugar para 10 más (36 + 4 adaptativas = 40)", () => {
    expect(lugarLibre(guionDe(26))).toBe(10);
    expect(puedeAgregar(guionDe(26)).ok).toBe(true);
  });
  it("con 36 de la familia ya no entra otra", () => {
    expect(lugarLibre(guionDe(36))).toBe(0);
    expect(puedeAgregar(guionDe(36)).ok).toBe(false);
  });
  it("las adaptativas no cuentan como lugar ocupado por la familia", () => {
    const g = [...guionDe(30), ...[31, 32, 33, 34].map((o) => fija(o, { tipo: "adaptativa" }))];
    expect(lugarLibre(g)).toBe(6);
  });
  it("no se puede bajar de 15", () => {
    expect(puedeSaltar(guionDe(16)).ok).toBe(true);
    expect(puedeSaltar(guionDe(PISO)).ok).toBe(false);
  });
  it("la que se agrega va al final", () => {
    expect(siguienteOrden(guionDe(26))).toBe(27);
    expect(siguienteOrden([])).toBe(1);
  });
});

describe("renumerar", () => {
  it("después de saltar la 5 (con 3 enviadas), la 6 pasa a ser 5 y así", () => {
    const g = guionDe(8).filter((p) => p.orden !== 5);
    expect(renumerar(g, 3)).toEqual([
      { id: "p6", orden: 5 }, { id: "p7", orden: 6 }, { id: "p8", orden: 7 },
    ]);
  });
  it("no toca las enviadas aunque haya huecos antes de dia_actual", () => {
    const g = guionDe(6).filter((p) => p.orden !== 2);
    expect(renumerar(g, 3)).toEqual([]); // 4,5,6 ya están contiguas después de 3
  });
});

describe("reordenar", () => {
  it("aplica el orden nuevo a las futuras y deja las adaptativas al final", () => {
    const g = [...guionDe(6), fija(7, { tipo: "adaptativa" })];
    const r = reordenar(g, 3, ["p6", "p4", "p5"]);
    expect(r).toEqual({ ok: true, cambios: [{ id: "p6", orden: 4 }, { id: "p4", orden: 5 }, { id: "p5", orden: 6 }] });
  });
  it("rechaza si falta o sobra alguna", () => {
    expect(reordenar(guionDe(6), 3, ["p4", "p5"]).ok).toBe(false);
    expect(reordenar(guionDe(6), 3, ["p4", "p5", "p6", "p2"]).ok).toBe(false);
  });
});

describe("calidadDeFoto", () => {
  it("clasifica por el lado largo y el corto, sin importar la orientación", () => {
    expect(calidadDeFoto(3000, 2400)).toBe("marco");
    expect(calidadDeFoto(2400, 3000)).toBe("marco");
    expect(calidadDeFoto(1800, 1200)).toBe("libro");
    expect(calidadDeFoto(800, 600)).toBe("baja");
  });
  it("una tapa de disco de 1500×1500 o una foto de 1920×1080 no son 'pixeladas': alcanzan a tamaño chico (Naza, 17/09)", () => {
    expect(calidadDeFoto(1500, 1500)).toBe("chica");
    expect(calidadDeFoto(1920, 1080)).toBe("chica");
    expect(calidadDeFoto(1080, 1080)).toBe("chica");
    expect(calidadDeFoto(640, 480)).toBe("baja");
  });
  it(`la familia puede armar hasta ${MAXIMO_FAMILIA}`, () => {
    expect(MAXIMO_FAMILIA).toBe(36);
  });
});

describe("errorDeTipoDeFoto", () => {
  it("acepta JPG, PNG y WebP", () => {
    expect(errorDeTipoDeFoto("image/jpeg")).toBeNull();
    expect(errorDeTipoDeFoto("image/png")).toBeNull();
    expect(errorDeTipoDeFoto("image/webp")).toBeNull();
  });
  it("HEIC/HEIF se rechaza con el aviso de exportar a JPG (el navegador que imprime no lo decodifica)", () => {
    expect(errorDeTipoDeFoto("image/heic")).toBe(MENSAJE_HEIC);
    expect(errorDeTipoDeFoto("image/heif")).toBe(MENSAJE_HEIC);
    expect(MENSAJE_HEIC).toContain("Ajustes → Cámara → Formatos → Más compatible");
  });
  it("cualquier otra cosa se rechaza como no-imagen", () => {
    expect(errorDeTipoDeFoto("application/pdf")).toBe("Tiene que ser una imagen (JPG, PNG o WebP).");
  });
});

describe("totalDelGuion — el mismo número en Inicio y en Historias", () => {
  it("narrador de la puerta manual: 4 adaptativas propias + 26 fijas de la plantilla = 30 (no 4)", () => {
    const propias = [27, 28, 29, 30].map((orden) => ({ orden }));
    const globales = Array.from({ length: 26 }, (_, i) => ({ orden: i + 1 }));
    expect(totalDelGuion(propias, globales)).toBe(30);
  });

  it("una propia que pisa un orden de la plantilla no cuenta dos veces", () => {
    expect(totalDelGuion([{ orden: 3 }, { orden: 31 }], [{ orden: 1 }, { orden: 2 }, { orden: 3 }])).toBe(4);
  });

  it("sin filas de ningún lado, vale la base", () => {
    expect(totalDelGuion([], [], 30)).toBe(30);
  });
});

describe("armarGuion + capitulosDelGuion — cerrar libro y muestra arman los capítulos con el guion entero", () => {
  const globales = [
    { orden: 1, capitulo: "A" },
    { orden: 2, capitulo: "A" },
    { orden: 3, capitulo: "B" },
  ];
  const propias = [
    { orden: 27, capitulo: "B" },
    { orden: 28, capitulo: "A" },
  ];

  it("une base + propias, ordenado por orden (Joaquín: 4 adaptativas propias no son el guion)", () => {
    const guion = armarGuion(globales, propias);
    expect(guion.map((p) => p.orden)).toEqual([1, 2, 3, 27, 28]);
  });

  it("los capítulos salen únicos y en el orden del guion, no en el de las adaptativas", () => {
    expect(capitulosDelGuion(armarGuion(globales, propias))).toEqual(["A", "B"]);
    expect(capitulosDelGuion(propias)).toEqual(["B", "A"]); // lo que veía Joaquín
  });

  it("una propia pisa a la global del mismo orden", () => {
    const guion = armarGuion(globales, [{ orden: 2, capitulo: "Z" }]);
    expect(guion).toEqual([{ orden: 1, capitulo: "A" }, { orden: 2, capitulo: "Z" }, { orden: 3, capitulo: "B" }]);
  });

  it("acepta null de Supabase en cualquiera de los dos lados", () => {
    expect(armarGuion(null, propias)).toEqual(propias);
    expect(armarGuion(globales, null)).toEqual(globales);
  });
});

// 3t.24 (21/09): reordenar arrastrando. Lo puro: dado el orden actual de ids,
// el que se arrastra y sobre cuál se suelta, el orden nuevo.
import { idsTrasArrastrar } from "../src/lib/guion";

describe("idsTrasArrastrar", () => {
  const ids = ["a", "b", "c", "d", "e"];
  it("hacia abajo: el arrastrado queda DESPUÉS del destino", () => {
    expect(idsTrasArrastrar(ids, "a", "c")).toEqual(["b", "c", "a", "d", "e"]);
    expect(idsTrasArrastrar(ids, "a", "e")).toEqual(["b", "c", "d", "e", "a"]);
  });
  it("hacia arriba: el arrastrado queda ANTES del destino", () => {
    expect(idsTrasArrastrar(ids, "d", "b")).toEqual(["a", "d", "b", "c", "e"]);
    expect(idsTrasArrastrar(ids, "e", "a")).toEqual(["e", "a", "b", "c", "d"]);
  });
  it("sobre sí mismo o con ids desconocidos no cambia nada", () => {
    expect(idsTrasArrastrar(ids, "c", "c")).toEqual(ids);
    expect(idsTrasArrastrar(ids, "zz", "c")).toEqual(ids);
    expect(idsTrasArrastrar(ids, "c", "zz")).toEqual(ids);
  });
});

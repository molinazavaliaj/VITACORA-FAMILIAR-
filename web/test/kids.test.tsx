import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";

// Vitácora Kids en la web nueva (15/10): /kids, la compra (/comprar/kids) y
// las dos landings, en los tres idiomas. Kids vende en Argentina y en España
// (KIDS_REGIONES, desde el 16/10: el bot ya habla es-ES), nunca en catalán,
// con KIDS_VENTA="1" y PRECIO_KIDS_* válido. La compra en sí se prueba en
// compra-kids.test.ts.

import KidsEs, { metadata as metaEs } from "../src/app/kids/page";
import KidsCa from "../src/app/ca/kids/page";
import KidsAr from "../src/app/ar/kids/page";
import ComprarKidsEs from "../src/app/comprar/kids/page";
import ComprarKidsCa from "../src/app/ca/comprar/kids/page";
import ComprarKidsAr from "../src/app/ar/comprar/kids/page";
import MundoEs from "../src/app/kids/su-mundo/page";
import MundoAr from "../src/app/ar/kids/su-mundo/page";
import OnceEs from "../src/app/kids/a-los-once/page";
import OnceCa from "../src/app/ca/kids/a-los-once/page";
import { CheckoutKids } from "../src/app/comprar/kids/formulario";
import { TEXTOS_KIDS } from "../src/app/_textos/kids";
import { CHECKOUT_KIDS } from "../src/app/_textos/checkout-kids";
import { TEXTOS_LANDING_KIDS } from "../src/app/_textos/landing-kids";
import { POST } from "../src/app/api/compra/route";
import {
  KIDS_TODAVIA_NO,
  catalogoKids,
  compraKids,
  cuerpoKids,
  fallaEnvioKids,
  estadoKidsInicial,
  fallaKids,
  fichaDeCompra,
  kidsVende,
  kidsVendeEn,
  quienRegalaTexto,
  type EstadoKids,
} from "../src/lib/kids";
import { obtenerPrecioKids } from "../src/lib/precios";
import { CHECKOUT } from "../src/app/_textos/checkout";
import { KIDS_IMPRESO } from "../src/app/_textos/checkout-kids";
import type { Catalogo } from "../src/lib/productos";

const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);
const pagina = (p: () => React.ReactElement) => renderToStaticMarkup(p());

const CLAVES = ["KIDS_VENTA", "PRECIO_KIDS_EUR", "PRECIO_KIDS_ARS", "NEXT_PUBLIC_WHATSAPP_DUDAS"] as const;
const viejos: Record<string, string | undefined> = {};
beforeEach(() => {
  for (const k of CLAVES) {
    viejos[k] = process.env[k];
    delete process.env[k];
  }
});
afterEach(() => {
  for (const k of CLAVES) {
    if (viejos[k] === undefined) delete process.env[k];
    else process.env[k] = viejos[k];
  }
});

const vender = () => {
  process.env.KIDS_VENTA = "1";
  process.env.PRECIO_KIDS_EUR = "59";
  process.env.PRECIO_KIDS_ARS = "90000";
};

const LLENO: EstadoKids = {
  ...estadoKidsInicial(),
  tuNombre: "Laura Gómez",
  tuWhatsapp: "+34 612 34 56 78",
  email: "laura@ejemplo.com",
  nombre: "Nico Rivas",
  apodo: "Nico",
  genero: "chico",
  edad: "11",
  quien: "papas",
  canal: "B",
  temas: ["escuela", "mama"],
};

describe("lib/kids: cuándo se vende y qué ficha arma", () => {
  it("se vende en Argentina y en España (nunca en catalán), con KIDS_VENTA=1 y un precio válido", () => {
    expect(kidsVende("AR")).toBe(false);
    process.env.PRECIO_KIDS_ARS = "90000";
    expect(kidsVende("AR")).toBe(false);
    process.env.KIDS_VENTA = "1";
    expect(kidsVende("AR")).toBe(true);
    // España sin precio no; con precio sí (Naza 16/10, tanda 8). Catalán, con el precio de España (tanda 10).
    expect(kidsVende("ES")).toBe(false);
    process.env.PRECIO_KIDS_EUR = "59";
    expect(kidsVende("ES")).toBe(true);
    expect(kidsVendeEn("es")).toBe(true);
    expect(kidsVendeEn("ar")).toBe(true);
    expect(kidsVendeEn("ca")).toBe(true);
    process.env.PRECIO_KIDS_ARS = "85.750,00";
    expect(obtenerPrecioKids("AR")).toBeNull();
    expect(kidsVende("AR")).toBe(false);
  });

  it("cada paso pide lo suyo", () => {
    const vacio = estadoKidsInicial();
    expect(fallaKids(1, vacio)?.clave).toBe("faltaTuNombre");
    expect(fallaKids(1, { ...LLENO, email: "laura@" })?.clave).toBe("correoMal");
    expect(fallaKids(1, LLENO)).toBeNull();
    expect(fallaKids(2, { ...LLENO, edad: "once" })?.clave).toBe("edadMal");
    expect(fallaKids(2, { ...LLENO, quien: "otra", quienOtra: " " })?.clave).toBe("faltaQuien");
    expect(fallaKids(2, { ...LLENO, canal: "A" })?.clave).toBe("faltaSuWhatsapp");
    expect(fallaKids(2, LLENO)).toBeNull();
  });

  it("quién se lo regala va como lo lee el motor («tu mamá», «tus abuelos»)", () => {
    expect(quienRegalaTexto({ quien: "papas", quienOtra: "" })).toBe("tus papás");
    expect(quienRegalaTexto({ quien: "otra", quienOtra: "Tus padrinos" })).toBe("tus padrinos");
    // En España, «tu madre», «tu padre», «tus padres» (Naza 16/10, tanda 8).
    expect(quienRegalaTexto({ quien: "mama", quienOtra: "" }, "ES")).toBe("tu madre");
    expect(quienRegalaTexto({ quien: "papa", quienOtra: "" }, "ES")).toBe("tu padre");
    expect(quienRegalaTexto({ quien: "papas", quienOtra: "" }, "ES")).toBe("tus padres");
    expect(quienRegalaTexto({ quien: "mama", quienOtra: "" }, "AR")).toBe("tu mamá");
    // En catalán, «la teva mare», «els teus pares» (Naza 16/10, tanda 10), y «Otra persona» con el posesivo en minúscula.
    expect(quienRegalaTexto({ quien: "mama", quienOtra: "" }, "ca")).toBe("la teva mare");
    expect(quienRegalaTexto({ quien: "papas", quienOtra: "" }, "ca")).toBe("els teus pares");
    expect(quienRegalaTexto({ quien: "abuela", quienOtra: "" }, "ca")).toBe("la teva àvia");
    expect(quienRegalaTexto({ quien: "otra", quienOtra: "El teu padrí" }, "ca")).toBe("el teu padrí");
    expect(quienRegalaTexto({ quien: "otra", quienOtra: "Les teves ties" }, "ca")).toBe("les teves ties");
  });

  it("la ficha es la del motor: temas en el orden de la pantalla, zona e idioma del país, hora por defecto 18:00 en Argentina y 20:00 en España", () => {
    const f = fichaDeCompra(LLENO, "ES");
    expect(f).toMatchObject({ nombre: "Nico Rivas", apodo: "Nico", genero: "chico", edad: 11, quienRegala: "tus padres", canal: "B", nombrePadre: "Laura Gómez", hora: "18:00", zona: "Europe/Madrid", fotosConOtrosChicos: false, idioma: "es-ES" });
    expect(f.temasSacados).toEqual(["mama", "escuela"]);
    expect(fichaDeCompra(LLENO, "AR")).toMatchObject({ zona: "America/Argentina/Buenos_Aires", idioma: "es-AR", quienRegala: "tus papás" });
    expect(estadoKidsInicial().hora).toBe("18:00");
    expect(estadoKidsInicial(undefined, "AR").hora).toBe("18:00");
    expect(estadoKidsInicial(undefined, "ES").hora).toBe("20:00");
    // Desde /ca: región ES (zona de Madrid, 20:00 por defecto), idioma ca (tanda 10).
    expect(fichaDeCompra(LLENO, "ES", "ca")).toMatchObject({ zona: "Europe/Madrid", idioma: "ca", quienRegala: "els teus pares" });
    expect(cuerpoKids(LLENO, "ES", "ca").kids).toMatchObject({ idioma: "ca", quienRegala: "els teus pares" });
  });

  it("el cuerpo lleva producto kids y el WhatsApp del chico solo con el canal A", () => {
    expect(cuerpoKids(LLENO, "ES", "es")).toMatchObject({ producto: "kids", whatsappChico: null, email: "laura@ejemplo.com" });
    expect(cuerpoKids({ ...LLENO, canal: "A", suWhatsapp: "+34 600 00 00 00" }, "ES", "es").whatsappChico).toBe("+34 600 00 00 00");
  });

  it("/api/compra no vende Kids con un idioma de web que no es el de la región", async () => {
    vender();
    const r2 = await POST(new NextRequest("http://localhost/api/compra", { method: "POST", body: JSON.stringify(cuerpoKids(LLENO, "ES", "ar")) }));
    expect(r2.status).toBe(409);
    expect((await r2.json()).error).toBe(KIDS_TODAVIA_NO);
  });
});

describe("/kids por idioma", () => {
  it("es estática y lleva el idioma, hreflang y la paleta de Kids", () => {
    for (const p of [KidsEs, KidsCa, KidsAr]) expect(p()).not.toBeInstanceOf(Promise);
    expect(pagina(KidsCa)).toContain('lang="ca-ES"');
    expect(pagina(KidsAr)).toContain('lang="es-AR"');
    expect(pagina(KidsEs)).toContain('class="kids ');
    expect(metaEs.alternates).toMatchObject({ canonical: "/kids", languages: { "ca-ES": "/ca/kids", "es-AR": "/ar/kids" } });
  });

  it("sin KIDS_VENTA no vende: «Próximamente», «Escríbenos» y ningún enlace a la compra", () => {
    process.env.PRECIO_KIDS_EUR = "59";
    const html = pagina(KidsEs);
    expect(html).not.toContain("/comprar/kids");
    expect(html).not.toContain("59");
    expect(html).toContain("Próximamente");
    expect(html).toContain("mailto:hola@vitacorafamiliar.com?subject=Vit%C3%A1cora%20Kids");
    process.env.NEXT_PUBLIC_WHATSAPP_DUDAS = "+34611222333";
    expect(pagina(KidsAr)).toContain('href="https://wa.me/34611222333"');
  });

  it("con KIDS_VENTA y precio, /ar, España y /ca llevan a su compra (KIDS_IDIOMAS_WEB, tanda 10)", () => {
    vender();
    expect(pagina(KidsAr)).toContain('href="/ar/comprar/kids"');
    expect(pagina(KidsAr)).toContain("90");
    expect(pagina(KidsEs)).toContain('href="/comprar/kids"');
    expect(pagina(KidsEs)).toContain("59");
    expect(pagina(KidsCa)).toContain('href="/ca/comprar/kids"');
    expect(pagina(KidsCa)).toContain("59");
  });

  it("los textos aprobados de la rama de Kids, en vos, en /ar", () => {
    const html = pagina(KidsAr);
    expect(html).toContain(escapar("Imaginate tener un libro de cómo era tu vida de chico."));
    for (const cap of ["De chiquito", "Mi gente", "Mi mundo ahora", "Lo que me pasó", "Para cuando seas grande"]) expect(html).toContain(escapar(cap));
    expect(html).toContain(escapar("Eso va al libro, con tus palabras."));
    expect(html).toContain(escapar("Hacele una pregunta a la persona que vas a ser cuando abras el sobre. La que quieras."));
  });

  it("nada que Kids no define, ni afecto del bot al chico, en ningún idioma", () => {
    // «te devolvemos» salió de la lista el 25/10: Kids tiene garantía (Naza), la misma que Familiar.
    const PROHIBIDO = ["9 días", "semanas", "setmanes", "RESEÑA", "Lo que dicen los padres", "Su voz", "marco", "13 × 18", "VITACORA10", "anticipo", "me gusta", "Me encanta", "me alegra", "con cariño", "tu hijo"];
    for (const p of [KidsEs, KidsCa, KidsAr]) {
      // El texto visible (las clases kids-marco no cuentan).
      const visible = pagina(p).replace(/<[^>]+>/g, " ");
      for (const frase of PROHIBIDO) expect(visible, frase).not.toContain(escapar(frase));
    }
  });

  it("los textos nuevos no llevan dos puntos ni rayas (regla de Naza)", () => {
    for (const idioma of ["es", "ca", "ar"] as const) {
      const t = TEXTOS_KIDS[idioma];
      const todos = [t.titulo, t.bajada, t.dibujos.frase, t.dibujos.texto, t.como.titulo, ...t.como.pasos.flatMap((p) => [p.titulo, p.texto]), t.chat.titulo, t.chat.texto, t.libro.titulo, t.libro.texto, t.panel.texto, t.panel.pedido, t.temas.texto, ...t.faq.preguntas.map((d) => d.respuesta)].flat();
      for (const s of todos) {
        expect(s, s).not.toMatch(/:/);
        expect(s, s).not.toMatch(/[—–]/);
      }
    }
  });
});

describe("/comprar/kids", () => {
  it("es estática en las tres versiones y arranca en el paso 1 con los textos aprobados", () => {
    for (const p of [ComprarKidsEs, ComprarKidsCa, ComprarKidsAr]) expect(p()).not.toBeInstanceOf(Promise);
    const ar = pagina(ComprarKidsAr);
    const K = CHECKOUT_KIDS.ar;
    expect(ar).toContain(escapar(K.tuTitulo));
    expect(ar).toContain(escapar(K.tuBajada));
    expect(ar).toContain(escapar("Acá te avisamos si hace falta y cuando el libro esté listo."));
    expect(ar).toContain('data-producto="kids"');
    expect(ar).toContain("kids-chk");
  });

  it("sin KIDS_VENTA avisa «Próximamente» desde el paso 1 y el paso 3 no tiene botón de pagar", () => {
    const html = pagina(ComprarKidsEs);
    expect(html).toContain("Próximamente");
    const paso3 = renderToStaticMarkup(<CheckoutKids idioma="es" precio={null} moneda="EUR" escribir={{ href: "mailto:hola@vitacorafamiliar.com", externo: false }} pasoInicial={3} />);
    expect(paso3).not.toContain("Pagar");
    expect(paso3).toContain(escapar(CHECKOUT_KIDS.es.proximamenteTexto));
    expect(paso3).toContain('href="mailto:hola@vitacorafamiliar.com"');
  });

  it("el paso 2 y el 3, con los textos aprobados (en /ar tal cual)", () => {
    const K = CHECKOUT_KIDS.ar;
    const paso2 = renderToStaticMarkup(<CheckoutKids idioma="ar" precio={null} moneda="ARS" escribir={{ href: "#", externo: false }} pasoInicial={2} />);
    for (const s of [K.quienTitulo, K.quienBajada, K.canalA.titulo, K.canalA.detalle, K.canalB.titulo, K.canalB.detalle, K.horaAyuda, K.regalaAyuda, ...Object.values(K.quienes)]) expect(paso2, s).toContain(escapar(s));
    const paso3 = renderToStaticMarkup(<CheckoutKids idioma="ar" precio={90000} moneda="ARS" escribir={{ href: "#", externo: false }} pasoInicial={3} />);
    for (const s of [K.temasTitulo, K.temasBajada, K.temasDebajo, K.fotos, K.fotosAyuda, K.despuesTexto, ...Object.values(K.temas)]) expect(paso3, s).toContain(escapar(s));
    expect(paso3).toMatch(/Pagar \$\s?90\.000/);
  });
});

// El libro impreso en Kids (Naza 15/10, tanda 3, punto 10): las opciones y la
// dirección de la casa, en el paso 3, con el impreso arriba y elegido.
describe("/comprar/kids con el libro impreso", () => {
  const CASA: Catalogo = {
    moneda: "ARS",
    base: { nombre: "El libro en PDF + Su voz", detalle: "", precio: 85750 },
    viaje: null,
    viajeAlbum40: null,
    impreso: { precio: 85750, precioCopia: 40000 },
    marco: { precio: 30000, precioAdicional: 20000 },
    pack: { precio: 180000 },
  };
  const cat = catalogoKids(CASA, 90000);
  const paso3 = () =>
    renderToStaticMarkup(<CheckoutKids idioma="ar" precio={90000} moneda="ARS" catalogo={cat} escribir={{ href: "#", externo: false }} pasoInicial={3} />);

  it("el catálogo de Kids es su precio con el impreso de la casa, sin marco ni pack", () => {
    expect(cat).toMatchObject({ base: { precio: 90000 }, impreso: { precio: 85750, precioCopia: 40000 }, marco: null, pack: null, viaje: null });
    expect(compraKids(cat, "AR", 2).total).toBe(90000 + 85750 + 40000);
    expect(compraKids(cat, "AR", 0).lineas).toEqual([{ id: "pdf", nombre: "Vitácora Kids", cantidad: 1, precioUnitario: 90000 }]);
  });

  it("arranca con el impreso elegido y arriba, pide la dirección de la casa y cobra la suma", () => {
    const html = paso3();
    const T = CHECKOUT.ar;
    expect(html).toContain(escapar(T.libroTitulo));
    // El impreso primero y elegido; después el digital; ningún marco.
    const impreso = html.indexOf('value="impreso"');
    const digital = html.indexOf('value="digital"');
    expect(impreso).toBeGreaterThan(-1);
    expect(digital).toBeGreaterThan(impreso);
    expect(html).not.toContain('value="marco"');
    expect(html).toMatch(/checked="" value="impreso"/);
    expect(html).toContain(escapar(KIDS_IMPRESO.impresoDetalle));
    for (const s of [T.direccionTitulo, T.direccionAyuda, T.recibe, T.copiasTitulo]) expect(html, s).toContain(escapar(s));
    expect(html).not.toContain(escapar("Su voz"));
    // Los textos aprobados del paso 3 siguen.
    for (const s of [CHECKOUT_KIDS.ar.temasTitulo, CHECKOUT_KIDS.ar.despuesTexto]) expect(html, s).toContain(escapar(s));
    expect(html).toMatch(/Pagar \$\s?175\.750/);
  });

  it("sin catálogo (o sin impreso en la región), el paso 3 de siempre", () => {
    const html = renderToStaticMarkup(<CheckoutKids idioma="ar" precio={90000} moneda="ARS" escribir={{ href: "#", externo: false }} pasoInicial={3} />);
    expect(html).not.toContain('value="impreso"');
    expect(html).not.toContain(escapar(CHECKOUT.ar.direccionTitulo));
    expect(html).toMatch(/Pagar \$\s?90\.000/);
  });

  it("con el impreso, el paso 3 pide quién recibe, un teléfono y la dirección, con los avisos de la casa", () => {
    const T = CHECKOUT.ar;
    const conImpreso = { ...estadoKidsInicial(cat), ...LLENO, formato: "impreso" as const };
    expect(fallaEnvioKids(conImpreso, T)).toEqual({ texto: T.faltaRecibe, campo: "recibe" });
    expect(fallaEnvioKids({ ...conImpreso, recibe: "Laura" }, T)).toEqual({ texto: T.faltaTelefonoRecibe, campo: "telefono-recibe" });
    expect(fallaEnvioKids({ ...conImpreso, recibe: "Laura", telefonoRecibe: "11 5555 1234" }, T)?.campo).toBe("direccion");
    const completo = { ...conImpreso, recibe: "Laura", telefonoRecibe: "11 5555 1234", direccion: { linea1: "Pelliza 1234", ciudad: "Vicente López", cp: "1638", pais: "Argentina" } };
    expect(fallaEnvioKids(completo, T)).toBeNull();
    expect(fallaEnvioKids({ ...conImpreso, formato: "digital" }, T)).toBeNull();
  });
});

describe("las landings de Kids", () => {
  it("son estáticas, con su titular recomendado y sin compra si no se vende", () => {
    for (const p of [MundoEs, MundoAr, OnceEs, OnceCa]) expect(p()).not.toBeInstanceOf(Promise);
    expect(pagina(MundoEs)).toContain(escapar(TEXTOS_LANDING_KIDS.es.mundo.titulo));
    expect(pagina(OnceCa)).toContain(escapar(TEXTOS_LANDING_KIDS.ca.once.titulo));
    for (const p of [MundoEs, MundoAr, OnceEs, OnceCa]) expect(pagina(p)).not.toContain("/comprar/kids");
  });

  it("tres titulares para elegir, el primero es el que se usa", () => {
    for (const idioma of ["es", "ca", "ar"] as const) {
      for (const l of ["mundo", "once"] as const) {
        const t = TEXTOS_LANDING_KIDS[idioma][l];
        expect(t.titulares).toHaveLength(3);
        expect(t.titulares[0]).toBe(t.titulo);
      }
    }
  });
});

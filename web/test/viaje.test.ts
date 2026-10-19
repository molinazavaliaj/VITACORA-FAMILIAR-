import { describe, it, expect, afterEach } from "vitest";
import { carritoDeViaje, diasDelViaje, MINIMO_DIAS, PAISES, esZona, validarFechas, validarViaje, viajeDelContexto } from "../src/lib/viaje";
import { validarYConstruir } from "../src/lib/registro";
import { armarCompra, calcularCompra, catalogo, productosParaPedido, validarCarrito } from "../src/lib/productos";

// La Vitácora de Viaje V2 en la web (16/10): lo puro de la compra. El
// contrato con el bot (docs/viajes-v2/compra-contrato.md, rama viaje-v2-solo):
// contexto.modo = 'viaje' y contexto.viaje con los nombres del tipo `Compra`.

const HOY = "2027-06-01";
const entrada = {
  salida: "2027-06-02",
  vuelta: "2027-06-09",
  zonaCasa: "Europe/Madrid",
  zonaViaje: "Asia/Tokyo",
  horaNoche: "22:30",
  preguntasPropias: ["  ¿Qué   comiste? ", ""],
  formato: "impreso",
  fotosAlbum: 20,
  idioma: "es-ES",
};

describe("validarViaje", () => {
  it("limpia y devuelve exactamente las claves del contrato, con v: 2 y sin nombre", () => {
    const r = validarViaje(entrada, { nombre: "Sara", hoy: HOY });
    expect(r).toEqual({
      ok: true,
      viaje: { v: 2, salida: "2027-06-02", vuelta: "2027-06-09", zonaCasa: "Europe/Madrid", zonaViaje: "Asia/Tokyo", horaNoche: "22:30", preguntasPropias: ["¿Qué comiste?"], formato: "impreso", fotosAlbum: 20, idioma: "es-ES" },
    });
  });
  it("el regalo va como regalo.quienRegala", () => {
    const r = validarViaje({ ...entrada, regalo: { quienRegala: " mamá " } }, { nombre: "Sara", hoy: HOY });
    expect(r.ok && r.viaje.regalo).toEqual({ quienRegala: "mamá" });
    expect(validarViaje({ ...entrada, regalo: { quienRegala: " " } }, { nombre: "Sara", hoy: HOY }).ok).toBe(false);
  });
  it("rechaza lo que el bot no acepta: menos de 3 días, salida pasada, noche fuera de franja, más de 5 preguntas, álbum raro", () => {
    const ok = (cambios: Record<string, unknown>) => validarViaje({ ...entrada, ...cambios }, { nombre: "Sara", hoy: HOY }).ok;
    expect(ok({ vuelta: "2027-06-03" })).toBe(false);
    expect(ok({ vuelta: "2027-06-04" })).toBe(true);
    expect(ok({ salida: "2027-05-31" })).toBe(false);
    expect(ok({ vuelta: "2027-06-01" })).toBe(false);
    expect(ok({ horaNoche: "23:00" })).toBe(false);
    expect(ok({ horaNoche: "08:30" })).toBe(false);
    expect(ok({ preguntasPropias: ["1", "2", "3", "4", "5", "6"] })).toBe(false);
    expect(ok({ fotosAlbum: 30 })).toBe(false);
    expect(ok({ formato: "digital" })).toBe(false);
    expect(ok({ idioma: "en" })).toBe(false);
    expect(ok({ zonaViaje: "Marte/Olympus" })).toBe(false);
    // Lo del viaje viejo se ignora: no llega al contexto.
    const r = validarViaje({ ...entrada, etapas: [{ nombre: "Lisboa" }], compania: "pareja" }, { nombre: "Sara", hoy: HOY });
    expect(r.ok && Object.keys(r.viaje)).not.toContain("etapas");
    expect(r.ok && Object.keys(r.viaje)).not.toContain("compania");
  });
  it("mínimo 3 días, salida y vuelta incluidas (el MINIMO_DIAS del bot)", () => {
    expect(MINIMO_DIAS).toBe(3);
    expect(diasDelViaje({ salida: "2027-06-02", vuelta: "2027-06-04" })).toBe(3);
    expect(validarFechas("2027-02-30", "2027-03-05", HOY).ok).toBe(false);
  });
  it("todos los países tienen una zona que el sistema conoce", () => {
    for (const p of PAISES) expect(esZona(p.zona)).toBe(true);
    expect(new Set(PAISES.map((p) => p.id)).size).toBe(PAISES.length);
  });
});

describe("registro y carrito de un viaje", () => {
  afterEach(() => {
    delete process.env.PRECIO_VIAJE_EUR;
    delete process.env.PRECIO_VIAJE_ALBUM40_EUR;
    delete process.env.PRECIO_IMPRESO_EUR;
  });
  const cuerpo = (viaje: Record<string, unknown>) => ({
    nombreComprador: "Sara Ruiz",
    vinculoComprador: "yo mismo",
    region: "ES",
    narrador: { nombre: "Sara Ruiz", comoLeDicen: "Sara", telefonoWhatsapp: "+34600000000", horaPreferida: "21:30", zonaHoraria: "Europe/Madrid", contexto: { viaje } },
  });
  const futuro = { ...entrada, salida: "2099-06-02", vuelta: "2099-06-09" };

  it("contexto: modo viaje, el viaje validado, y el idioma manda el trato", () => {
    const es = validarYConstruir(cuerpo(futuro));
    expect(es.ok).toBe(true);
    if (!es.ok) return;
    expect(es.narrador.contexto).toMatchObject({ modo: "viaje", idioma: "es-ES", viaje: { v: 2, formato: "impreso", fotosAlbum: 20 } });
    expect(es.narrador.contexto.trato).toBeUndefined();
    const ar = validarYConstruir({ ...cuerpo({ ...futuro, idioma: "es-AR" }), region: "AR", narrador: { ...cuerpo(futuro).narrador, telefonoWhatsapp: "+5491155551234", contexto: { viaje: { ...futuro, idioma: "es-AR" } } } });
    expect(ar.ok && ar.narrador.contexto).toMatchObject({ modo: "viaje", trato: "vos" });
    expect(ar.ok && ar.narrador.contexto.idioma).toBeUndefined();
  });
  it("la hora y la zona del narrador salen del viaje validado, no del navegador", () => {
    const c = cuerpo({ ...futuro, horaNoche: "20:30" });
    const r = validarYConstruir({ ...c, narrador: { ...c.narrador, horaPreferida: "03:00", zonaHoraria: "Asia/Tokyo" } });
    expect(r.ok && [r.narrador.hora_preferida, r.narrador.zona_horaria]).toEqual(["20:30", "Europe/Madrid"]);
    expect(validarViaje({ ...futuro, zonaCasa: "+01:00" }, { nombre: "Sara" }).ok).toBe(false);
  });
  it("un viaje con fechas malas no se registra", () => {
    expect(validarYConstruir(cuerpo({ ...futuro, vuelta: "2099-06-03" })).ok).toBe(false);
  });
  it("el carrito sale del viaje validado: formato → impreso, álbum → precio", () => {
    process.env.PRECIO_VIAJE_EUR = "49";
    process.env.PRECIO_IMPRESO_EUR = "30";
    const c = carritoDeViaje({ modo: "viaje", viaje: { v: 2, formato: "impreso", fotosAlbum: 40 } });
    expect(c).toEqual({ base: "viaje", impresos: 1, marcos: 0, album: 40 });
    expect(carritoDeViaje({ modo: "viaje", viaje: { salida: "x" } })).toBeNull();
    // Sin precio del álbum de 40: no se puede cobrar.
    expect(validarCarrito("ES", c!).ok).toBe(false);
    process.env.PRECIO_VIAJE_ALBUM40_EUR = "59";
    expect(validarCarrito("ES", c!).ok).toBe(true);
    const compra = calcularCompra("ES", c!);
    expect(compra.total).toBe(89);
    expect(compra.lineas.map((l) => l.id)).toEqual(["viaje", "impreso"]);
    expect(productosParaPedido(compra)).toMatchObject({ tipo: "viaje", pdf: true, copias: 1 });
    // El de 20, al precio de siempre.
    expect(calcularCompra("ES", { ...c!, album: 20 }).total).toBe(79);
  });
  it("un precio de 40 que no supera al de 20 es un error de carga: la opción no existe", () => {
    process.env.PRECIO_VIAJE_EUR = "49";
    process.env.PRECIO_VIAJE_ALBUM40_EUR = "40";
    const cat = catalogo("ES");
    expect(cat.viajeAlbum40).toBeNull();
    expect(armarCompra(cat, "ES", { base: "viaje", impresos: 0, marcos: 0, album: 40 }).total).toBe(49);
  });
  it("viajeDelContexto lee salida y vuelta, y nada si no es un viaje", () => {
    expect(viajeDelContexto({ modo: "viaje", viaje: { v: 2, salida: "2027-06-02", vuelta: "2027-06-09" } })?.salida).toBe("2027-06-02");
    expect(viajeDelContexto({ viaje: { salida: "2027-06-02", vuelta: "2027-06-09" } })).toBeNull();
  });
});

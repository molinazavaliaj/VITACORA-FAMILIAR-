import { describe, it, expect } from "vitest";
import {
  coincide,
  datosEtiqueta,
  destinatarioDe,
  envioDe,
  estadoAnterior,
  estadoDelPago,
  faltaDespachar,
  filtrar,
  lineasDelProducto,
  numeroDePedido,
  puedePasar,
  resumen,
  sinMailDeEnvio,
  validarBulto,
  validarDespacho,
  type EntregaAdmin,
  type PedidoAdmin,
} from "../src/lib/pedidos-admin";

const entrega = (cambios: Partial<EntregaAdmin> = {}): EntregaAdmin => ({
  id: "e1",
  estado: "impreso",
  origen: "ES",
  destinatario_nombre: "Ana Pérez",
  destinatario_telefono: "+34 600 000 000",
  destinatario_email: "ana@mail.com",
  direccion: { linea1: "Calle Mayor 12", linea2: "3º B", ciudad: "Valladolid", provincia: "Castilla y León", cp: "47001", pais: "España" },
  nota: "timbre roto",
  transportista: null,
  seguimiento: null,
  seguimiento_url: null,
  peso_g: 750,
  dimensiones: "24x18x5",
  problema: null,
  direccion_at: "2026-11-01T00:00:00Z",
  produccion_at: "2026-11-02T00:00:00Z",
  impreso_at: "2026-11-03T00:00:00Z",
  enviado_at: null,
  entregado_at: null,
  ...cambios,
});

const pedido = (cambios: Partial<PedidoAdmin> = {}): PedidoAdmin => ({
  id: "p1",
  numero: 1001,
  estado: "pagado",
  monto: 99,
  moneda: "EUR",
  proveedor: "stripe",
  extras: { pdf: true, impreso: "color", copias: 1, marcos: 0 },
  created_at: "2026-11-01T10:00:00Z",
  familia_id: "f1",
  narrador_id: "n1",
  comprador: { nombre: "Laura Gómez", email: "laura@mail.com", region: "ES" },
  narrador: { nombre: "Roberto", como_le_dicen: "Abuelo", modo: null },
  entrega: entrega(),
  ...cambios,
});

describe("el número de pedido", () => {
  it("lleva el prefijo y, sin número, un guion", () => {
    expect(numeroDePedido(1001)).toBe("VF-1001");
    expect(numeroDePedido(null)).toBe("—");
  });
});

describe("el estado del pago", () => {
  it("un pedido cobrado se ve pagado, también con el libro ya entregado", () => {
    expect(estadoDelPago(pedido({ estado: "pagado" })).texto).toBe("pagado");
    expect(estadoDelPago(pedido({ estado: "entregado" })).texto).toBe("pagado");
  });
  it("pendiente es sin pagar", () => {
    expect(estadoDelPago(pedido({ estado: "pendiente", numero: null })).texto).toBe("sin pagar");
  });
  it("fallido con número es un cobro con el libro trabado; sin número, un pago que no se completó", () => {
    expect(estadoDelPago(pedido({ estado: "fallido", numero: 1002 })).texto).toBe("pagado, falló el libro");
    expect(estadoDelPago(pedido({ estado: "fallido", numero: null })).texto).toBe("no se completó");
  });
});

describe("el producto", () => {
  it("dice el libro, cuántos impresos y cuántos marcos", () => {
    expect(lineasDelProducto(pedido({ extras: { pdf: true, impreso: "color", copias: 2, marcos: 1 } }))).toEqual(["Libro", "2 impresos", "1 marco"]);
  });
  it("distingue regalo, tarjeta y productos", () => {
    const tarjeta = { aNombreDe: "Ana", direccion: { linea1: "x", ciudad: "y", cp: "1", pais: "España" } };
    expect(lineasDelProducto(pedido({ extras: { pdf: true, regalo: true, tarjeta, copias: 0, marcos: 0 } }))).toEqual(["Libro", "regalo", "tarjeta por correo"]);
    expect(lineasDelProducto(pedido({ extras: { tipo: "viaje", pdf: true } }))[0]).toBe("Viaje");
    expect(lineasDelProducto(pedido({ extras: { tipo: "kids", pdf: true } }))[0]).toBe("Kids");
    expect(lineasDelProducto(pedido({ narrador: { nombre: "R", como_le_dicen: "R", modo: "historia" } }))[0]).toBe("Historia");
    expect(lineasDelProducto(pedido({ extras: { pdf: false, copias: 1, marcos: 0 } }))[0]).toBe("Extras");
  });
});

describe("el envío", () => {
  it("un pedido sin nada físico no tiene envío", () => {
    expect(envioDe(pedido({ extras: { pdf: true, copias: 0, marcos: 0 }, entrega: null }))).toBe("nada");
  });
  it("cobrado, con algo físico y sin fila de entrega: se avisa", () => {
    expect(envioDe(pedido({ entrega: null }))).toBe("sin_fila");
  });
  it("sin pagar no reclama entrega", () => {
    expect(envioDe(pedido({ estado: "pendiente", numero: null, entrega: null }))).toBe("nada");
    expect(envioDe(pedido({ estado: "fallido", numero: null, entrega: null }))).toBe("nada");
  });
  it("falta despachar es lo cobrado y físico que todavía no salió", () => {
    for (const estado of ["sin_direccion", "lista", "en_produccion", "impreso", "con_problema"] as const) {
      expect(faltaDespachar(pedido({ entrega: entrega({ estado }) }))).toBe(true);
    }
    for (const estado of ["enviado", "entregado"] as const) {
      expect(faltaDespachar(pedido({ entrega: entrega({ estado }) }))).toBe(false);
    }
    expect(faltaDespachar(pedido({ entrega: null }))).toBe(true);
    expect(faltaDespachar(pedido({ extras: { pdf: true, copias: 0, marcos: 0 }, entrega: null }))).toBe(false);
  });
});

describe("el filtro y la búsqueda", () => {
  const pedidos = [
    pedido({ id: "listo", numero: 1003, entrega: entrega({ estado: "impreso" }) }),
    pedido({ id: "espera", numero: 1002, entrega: entrega({ estado: "sin_direccion", destinatario_nombre: null, direccion: null }) }),
    pedido({ id: "salio", numero: 1001, entrega: entrega({ estado: "enviado" }) }),
    pedido({ id: "impago", numero: null, estado: "pendiente", entrega: null }),
  ];
  it("las compras son lo cobrado", () => {
    expect(filtrar(pedidos, "compras", "").map((p) => p.id)).toEqual(["listo", "espera", "salio"]);
  });
  it("lo que falta despachar va con lo que se puede despachar ya primero", () => {
    const orden = [pedidos[1], pedidos[0], pedidos[2]];
    expect(filtrar(orden, "falta", "").map((p) => p.id)).toEqual(["listo", "espera"]);
  });
  it("sin pagar se ve aparte", () => {
    expect(filtrar(pedidos, "sin_pagar", "").map((p) => p.id)).toEqual(["impago"]);
  });
  it("busca por número como se dicta, por nombre sin tildes y por mail", () => {
    const p = pedido();
    expect(coincide(p, "VF-1001")).toBe(true);
    expect(coincide(p, "vf 1001")).toBe(true);
    expect(coincide(p, "1001")).toBe(true);
    expect(coincide(p, "1002")).toBe(false);
    expect(coincide(p, "gomez")).toBe(true);
    expect(coincide(p, "ANA PEREZ")).toBe(true);
    expect(coincide(p, "laura@")).toBe(true);
    expect(coincide(p, "roberto")).toBe(true);
    expect(coincide(p, "")).toBe(true);
  });
  it("las cuentas de arriba no mezclan los sin pagar", () => {
    expect(resumen(pedidos)).toEqual({ compras: 3, paraDespachar: 1, esperando: 1, enCamino: 1 });
  });
});

describe("quién va en el paquete", () => {
  it("con dirección, quien recibe; sin dirección, el narrador", () => {
    expect(destinatarioDe(pedido())).toBe("Ana Pérez");
    expect(destinatarioDe(pedido({ entrega: entrega({ destinatario_nombre: null }) }))).toBe("Roberto");
    expect(destinatarioDe(pedido({ entrega: null, narrador: null }))).toBe("—");
  });
});

describe("la etiqueta", () => {
  it("lleva referencia, remitente, destinatario, teléfono, dirección, contenido, peso y medidas", () => {
    const e = datosEtiqueta(pedido({ extras: { pdf: true, impreso: "color", copias: 2, marcos: 1 } }), "Vitácora Familiar|Calle Falsa 1|08600 Berga");
    expect(e).toEqual({
      referencia: "VF-1001",
      de: ["Vitácora Familiar", "Calle Falsa 1", "08600 Berga"],
      para: ["Ana Pérez", "Calle Mayor 12", "3º B", "47001 Valladolid", "Castilla y León", "España"],
      telefono: "+34 600 000 000",
      nota: "timbre roto",
      contenido: "2 libros, 1 marco",
      peso: "750 g",
      medidas: "24 × 18 × 5 cm",
    });
  });
  it("sin remitente cargado no inventa uno", () => {
    expect(datosEtiqueta(pedido(), undefined).de).toEqual([]);
    expect(datosEtiqueta(pedido(), "  ").de).toEqual([]);
  });
  it("sin dirección ni peso, deja en claro lo que falta", () => {
    const e = datosEtiqueta(pedido({ entrega: entrega({ direccion: null, destinatario_nombre: null, destinatario_telefono: null, peso_g: null, dimensiones: null, nota: null }) }), undefined);
    expect(e.para).toEqual([]);
    expect(e.telefono).toBeNull();
    expect(e.peso).toBeNull();
    expect(e.medidas).toBeNull();
  });
});

describe("los cambios de estado", () => {
  it("sigue el camino del contrato", () => {
    expect(puedePasar("en_produccion", "impreso", false)).toBe(true);
    expect(puedePasar("impreso", "enviado", false)).toBe(true);
    expect(puedePasar("enviado", "entregado", false)).toBe(true);
  });
  it("se puede saltear impreso: el paquete sale el mismo día que llega", () => {
    expect(puedePasar("en_produccion", "enviado", false)).toBe(true);
  });
  it("no se despacha lo que la fábrica todavía no mandó a imprenta", () => {
    expect(puedePasar("sin_direccion", "enviado", false)).toBe(false);
    expect(puedePasar("lista", "enviado", false)).toBe(false);
    expect(puedePasar("lista", "impreso", false)).toBe(false);
    expect(puedePasar("entregado", "enviado", false)).toBe(false);
    expect(puedePasar("enviado", "impreso", false)).toBe(false);
  });
  it("una historia sale de lista porque el portón no la toca, pero nunca sin dirección", () => {
    expect(puedePasar("lista", "impreso", true)).toBe(true);
    expect(puedePasar("lista", "enviado", true)).toBe(true);
    expect(puedePasar("sin_direccion", "enviado", true)).toBe(false);
  });
  it("con problema se puede marcar salvo si ya se entregó", () => {
    for (const estado of ["sin_direccion", "lista", "en_produccion", "impreso", "enviado"] as const) {
      expect(puedePasar(estado, "con_problema", false)).toBe(true);
    }
    expect(puedePasar("con_problema", "con_problema", false)).toBe(false);
  });
  it("de un problema se vuelve al estado más avanzado que tenga fecha", () => {
    const base = { direccion_at: null, produccion_at: null, impreso_at: null, enviado_at: null, entregado_at: null };
    expect(estadoAnterior(base)).toBe("sin_direccion");
    expect(estadoAnterior({ ...base, direccion_at: "x" })).toBe("lista");
    expect(estadoAnterior({ ...base, direccion_at: "x", produccion_at: "x" })).toBe("en_produccion");
    expect(estadoAnterior({ ...base, direccion_at: "x", produccion_at: "x", impreso_at: "x" })).toBe("impreso");
    expect(estadoAnterior({ ...base, direccion_at: "x", produccion_at: "x", enviado_at: "x" })).toBe("enviado");
    expect(estadoAnterior({ ...base, entregado_at: "x" })).toBe("entregado");
  });
});

describe("a quién no le sale el mail de «va en camino»", () => {
  it("Kids e Historia lo tienen apagado en la fábrica; el resto no", () => {
    expect(sinMailDeEnvio(pedido({ extras: { tipo: "kids" } }))).toBe(true);
    expect(sinMailDeEnvio(pedido({ narrador: { nombre: "R", como_le_dicen: "R", modo: "historia" } }))).toBe(true);
    expect(sinMailDeEnvio(pedido())).toBe(false);
    expect(sinMailDeEnvio(pedido({ extras: { tipo: "viaje" } }))).toBe(false);
  });
});

describe("los datos del despacho", () => {
  it("el transportista es obligatorio y el seguimiento no", () => {
    expect(validarDespacho({ transportista: "", seguimiento: "", url: "" })).toEqual({ error: "Falta el transportista." });
    expect(validarDespacho({ transportista: " Correos ", seguimiento: "", url: "" })).toEqual({ transportista: "Correos", seguimiento: null, seguimiento_url: null });
  });
  it("el link tiene que ser http o https: la familia lo abre desde su panel", () => {
    expect(validarDespacho({ transportista: "Correos", seguimiento: "PK1", url: "javascript:alert(1)" })).toEqual({ error: "El link de seguimiento tiene que empezar con https://" });
    expect(validarDespacho({ transportista: "Correos", seguimiento: "PK1", url: "https://correos.es/x?n=PK1" })).toEqual({ transportista: "Correos", seguimiento: "PK1", seguimiento_url: "https://correos.es/x?n=PK1" });
  });
});

describe("el peso y las medidas", () => {
  it("acepta como lo escribe una persona y lo guarda como lo piden los correos", () => {
    expect(validarBulto("820", "30 x 18 x 8,4")).toEqual({ peso_g: 820, dimensiones: "30x18x8.4" });
    expect(validarBulto("820", "30×18×8")).toEqual({ peso_g: 820, dimensiones: "30x18x8" });
  });
  it("rechaza lo que no se entiende", () => {
    expect(validarBulto("", "30x18x8")).toEqual({ error: "El peso va en gramos, un número entero." });
    expect(validarBulto("0", "30x18x8")).toEqual({ error: "El peso va en gramos, un número entero." });
    expect(validarBulto("1,5", "30x18x8")).toEqual({ error: "El peso va en gramos, un número entero." });
    expect(validarBulto("800", "30x18")).toEqual({ error: "Las medidas van como largo x ancho x alto, en cm." });
  });
});

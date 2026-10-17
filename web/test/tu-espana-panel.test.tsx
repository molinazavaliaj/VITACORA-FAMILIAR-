import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// Panel, errores de la API, /comprar y mail de tú para España (Naza, 13/10). Argentina
// queda igual letra por letra, salvo los mensajes que estaban en tú y ahora le hablan
// de vos (punto C). Textos en docs/web-textos-v3/aprobados.md.

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh() {}, push() {} }), useSearchParams: () => new URLSearchParams() }));
vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));
vi.mock("@/lib/supabase/sesion", () => ({ crearClienteSesion: vi.fn() }));
vi.mock("@/lib/panel", async (original) => ({ ...(await original<typeof import("@/lib/panel")>()), narradorDeLaSesion: vi.fn() }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { narradorDeLaSesion, type Historia } from "@/lib/panel";
import { proximoPaso } from "../src/app/tablero/proximo-paso";
import { EstadoError, estadoEnHumano } from "../src/app/tablero/ui";
import { BannerAlertaSilencio, CierreAnticipado } from "../src/app/tablero/acciones";
import { Ajustes } from "../src/app/tablero/[narradorId]/preguntas/acciones";
import { Envio, type EntregaVista } from "../src/app/tablero/[narradorId]/libro/envio";
import { FormularioNombres } from "../src/app/tablero/[narradorId]/nombres/acciones";
import { FormularioDudas } from "../src/app/tablero/[narradorId]/dudas/acciones";
import { FotosDelLibro } from "../src/app/tablero/[narradorId]/libro/fotos-del-libro";
import FormularioEntrar from "../src/app/entrar/formulario";
import { Checkout } from "../src/app/comprar/formulario";
import { SugerenciaRegalo } from "../src/app/link-regalar";
import { PATCH as patchEntrega } from "../src/app/api/entrega/route";
import { validarTexto, puedeAgregar, errorDeTipoDeFoto, NOMBRE_RITMO, NOMBRE_RITMO_TU, AVISO_CALIDAD, AVISO_CALIDAD_TU, MAXIMO_FAMILIA, type PreguntaGuion } from "@/lib/guion";
import { DIRECCION_CAMPOS, DIRECCION_CAMPOS_ES } from "@/lib/entregas";
import { validarYConstruir } from "@/lib/registro";
import { catalogo } from "@/lib/productos";
import { tratoDeLaFamilia, intenta } from "@/lib/trato";
import type { TratoComprador } from "@/lib/regalo-textos";
import { crearAdmin } from "./dobles";

const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);
/** Todas las frases están en el HTML, y ninguna de las del otro trato. */
function soloEste(html: string, esperadas: string[], prohibidas: string[]) {
  for (const f of esperadas) expect(html, f).toContain(escapar(f));
  for (const f of prohibidas) expect(html, f).not.toContain(escapar(f));
}
/** Las palabras que delatan el vos: en España no puede aparecer ninguna. */
const VOSEO = /\b(vos|Vos|acá|Acá|recién|Recién|celular|podés|Podés|tenés|querés|Elegí|elegí|Tocá|tocá|Intentá|intentá|Revisá|Actualizá|escribinos|Decinos|Contanos|Sos|Entrá|entrá|Volvé|volvé)\b/;

const historia = (estado: string, rol: Historia["rol"] = "duena", contexto: Record<string, unknown> = {}): Historia =>
  ({ narrador: { id: "n1", estado, como_le_dicen: "la abuela", contexto }, rol }) as unknown as Historia;
const resumen = { respondidas: 3, total: 30, segundos: 60, tieneAnticipo: false };

describe("panel: el próximo paso y el estado", () => {
  it("España, de tú", () => {
    expect(proximoPaso(historia("pausado"), resumen, "ES")?.texto).toBe("Pidió una pausa — mira qué pasó");
    expect(proximoPaso(historia("activo"), { ...resumen, tieneAnticipo: true }, "ES")?.texto).toBe("Ya puedes leer el capítulo 1");
    expect(proximoPaso(historia("acepto"), { ...resumen, v3: true }, "ES")?.texto).toBe("Mientras esperas, suma fotos o una pregunta tuya");
    expect(proximoPaso(historia("completado"), { ...resumen, v3: true }, "ES")?.texto).toBe("Ya terminó de contar. Elige la tapa y encarga su libro");
    expect(proximoPaso(historia("completado", "visitante"), resumen, "ES")?.texto).toBe("Pide tu copia impresa");
    expect(estadoEnHumano("pausado", false, "tu")).toBe("Pidió una pausa — una llamada tuya ayuda");
    expect(estadoEnHumano("pausado", true, "tu")).toBe("Pediste una pausa — retomas cuando quieras");
  });

  it("Argentina, igual que siempre", () => {
    expect(proximoPaso(historia("pausado"), resumen, "AR")?.texto).toBe("Pidió una pausa — mirá qué pasó");
    expect(proximoPaso(historia("activo"), { ...resumen, tieneAnticipo: true })?.texto).toBe("Ya podés leer el capítulo 1");
    expect(proximoPaso(historia("acepto"), { ...resumen, v3: true }, "AR")?.texto).toBe("Mientras esperás, sumá fotos o una pregunta tuya");
    expect(proximoPaso(historia("completado"), { ...resumen, v3: true }, "AR")?.texto).toBe("Ya terminó de contar. Elegí la tapa y encargá su libro");
    expect(estadoEnHumano("pausado", false)).toBe("Pidió una pausa — un llamado tuyo ayuda");
    expect(estadoEnHumano("pausado", true, "vos")).toBe("Pediste una pausa — retomás cuando quieras");
  });

  it("ningún próximo paso de España se escapa en vos (sin contar el viaje, que no se tocó)", () => {
    for (const estado of ["completado", "pausado", "activo", "acepto", "regalo_pendiente"]) {
      for (const r of [resumen, { ...resumen, v3: true }, { ...resumen, dudasPendientes: true }, { ...resumen, tieneAnticipo: true }]) {
        const texto = proximoPaso(historia(estado), r, "ES")?.texto ?? "";
        expect(texto, texto).not.toMatch(VOSEO);
        expect(texto, texto).not.toMatch(/esperás|sumá|encargá|leé|retomá|mirá|Escuchá|Contestalas/);
      }
    }
  });
});

describe("panel: las pantallas", () => {
  const ajustes = (trato: TratoComprador) =>
    renderToStaticMarkup(<Ajustes narradorId="n1" ritmo="diario" evitar="" horario={{ hora: "10:00", zona: "Europe/Madrid" }} propia pedirFotos tratoPanel={trato} />);
  const envio = (trato: TratoComprador, e: Partial<EntregaVista> = {}) =>
    renderToStaticMarkup(
      <Envio narradorId="n1" queViaja="El libro impreso" trato={trato} entrega={{ id: "e1", estado: "sin_direccion", destinatarioNombre: null, destinatarioTelefono: null, direccion: null, nota: null, transportista: null, seguimiento: null, seguimientoUrl: null, problema: null, ...e }} />,
    );
  const fotos = (trato: TratoComprador) =>
    renderToStaticMarkup(<FotosDelLibro narradorId="n1" fotos={[]} capitulos={[]} elegidas={{ portadaFotoId: null, contratapaFotoId: null }} marcosFotoIds={[]} marcosComprados={0} editable trato={trato} />);
  const todo = (trato: TratoComprador) =>
    [
      renderToStaticMarkup(<EstadoError trato={trato} />),
      renderToStaticMarkup(<BannerAlertaSilencio narradorId="n1" comoLeDicen="Dora" trato={trato} />),
      renderToStaticMarkup(<CierreAnticipado narradorId="n1" trato={trato} />),
      ajustes(trato),
      envio(trato),
      envio(trato, { estado: "con_problema", problema: "No existe" }),
      renderToStaticMarkup(<FormularioNombres narradorId="n1" entidades={[]} trato={trato} />),
      renderToStaticMarkup(<FormularioDudas narradorId="n1" dudas={[{ id: "d1", pregunta: "¿Marta o Martha?" } as never]} soloLectura={false} trato={trato} />),
      fotos(trato),
    ].join("\n");

  it("España, de tú y sin nada de vos", () => {
    const html = todo("tu");
    soloEste(
      html,
      [
        "No pudimos cargar esta pantalla. Actualiza en un momento.",
        "una llamada tuya ayuda más que",
        "¿Necesitas cerrar la bitácora antes de tiempo?",
        "Una por la mañana y otra por la tarde. Para quien tiene ganas de contar.",
        "Si quieres que te llegue antes o después",
        "cámbiala aquí",
        "apágalo",
        "Dinos",
        "escríbenos",
        "Piso y puerta",
        "Calle Mayor 12",
        "Valladolid",
        "47001",
        "España",
        "612 345 678",
        "El timbre no funciona, llamar al llegar.",
        "Puedes",
        "Lo que sepas. Si no sabes, déjalo vacío.",
        "Toca un lugar de abajo",
        "elígela de la lista",
      ],
      ["Actualizá", "un llamadito tuyo", "Una a la mañana", "cambiala acá", "Decinos", "escribinos", "Piso, departamento", "Pelliza 1234", "11 5555 1234", "El timbre no anda"],
    );
    expect(html).not.toMatch(VOSEO);
  });

  it("Argentina, igual que siempre, y de vos lo que estaba en tú", () => {
    const html = todo("vos");
    soloEste(
      html,
      [
        "No pudimos cargar esta pantalla. Actualizá en un momento.",
        "un llamadito tuyo ayuda más que",
        "¿Necesitás cerrar la bitácora antes de tiempo?",
        "Una a la mañana y otra a la tarde. Para quien tiene ganas de contar.",
        "Si querés que te llegue antes o después",
        "cambiala acá",
        "apagalo",
        "Decinos",
        "escribinos",
        "Piso, departamento",
        "Pelliza 1234",
        "Vicente López",
        "11 5555 1234",
        "El timbre no anda, llamar al llegar.",
        "Podés",
        "Lo que sepas. Si no sabés, dejalo vacío.",
        "Tocá un lugar de abajo",
      ],
      ["Actualiza en", "una llamada tuya", "¿Necesitas", "Una por la mañana", "cámbiala aquí", "Dinos", "escríbenos", "Piso y puerta", "Calle Mayor 12", "612 345 678"],
    );
  });

  it("sin trato, el panel queda en vos", () => {
    expect(renderToStaticMarkup(<EstadoError />)).toContain("Actualizá en un momento.");
    expect(renderToStaticMarkup(<CierreAnticipado narradorId="n1" />)).toContain(escapar("¿Necesitás cerrar"));
  });
});

describe("las reglas del guion y la foto", () => {
  const guionLleno = Array.from({ length: MAXIMO_FAMILIA }, (_, i) => ({ id: `p${i}`, orden: i + 1, texto: "x", capitulo: "C", tipo: "base" })) as unknown as PreguntaGuion[];

  it("España, de tú", () => {
    expect(validarTexto("¿Y?", "tu")).toEqual({ ok: false, mensaje: "La pregunta es muy corta. Cuéntale un poco más qué quieres que cuente." });
    const larga = validarTexto("x".repeat(400), "tu");
    expect(larga.ok ? "" : larga.mensaje).toContain("Piensa que la va a leer en el móvil");
    const lleno = puedeAgregar(guionLleno, "tu");
    expect(lleno.ok ? "" : lleno.mensaje).toContain("Para sumar una, saca otra.");
    expect(errorDeTipoDeFoto("image/heic", "tu")).toContain("Exporta la foto como JPG");
    expect(errorDeTipoDeFoto("image/heic", "tu")).toContain("vuelve a subirla");
    expect(AVISO_CALIDAD_TU.baja).toContain("sácale otra foto");
    expect(NOMBRE_RITMO_TU.dos_por_dia.detalle).toBe("Una por la mañana y otra por la tarde. Para quien tiene ganas de contar.");
    expect(DIRECCION_CAMPOS_ES.map((c) => c.ejemplo)).toEqual(["Calle Mayor 12", "3º B", "Valladolid", "Valladolid", "47001", "España"]);
  });

  it("Argentina, igual que siempre", () => {
    expect(validarTexto("¿Y?")).toEqual({ ok: false, mensaje: "La pregunta es muy corta. Contale un poco más qué querés que cuente." });
    const larga = validarTexto("x".repeat(400), "vos");
    expect(larga.ok ? "" : larga.mensaje).toContain("Pensá que la va a leer en el celular");
    const lleno = puedeAgregar(guionLleno);
    expect(lleno.ok ? "" : lleno.mensaje).toContain("Para sumar una, sacá otra.");
    expect(errorDeTipoDeFoto("image/heic")).toContain("Exportá la foto como JPG");
    expect(AVISO_CALIDAD.baja).toContain("sacale otra foto");
    expect(NOMBRE_RITMO.dos_por_dia.detalle).toBe("Una a la mañana y otra a la tarde. Para quien tiene ganas de contar.");
    expect(DIRECCION_CAMPOS.map((c) => c.ejemplo)).toEqual(["Pelliza 1234", "3º B", "Vicente López", "Buenos Aires", "1638", "Argentina"]);
  });
});

describe("la API: el trato sale de la familia de la historia", () => {
  it("tratoDeLaFamilia: tú solo para España; vos si es de Argentina, si no hay familia o si la base falla", async () => {
    const { admin } = crearAdmin({ familias: [{ id: "f-es", region: "ES" }, { id: "f-ar", region: "AR" }] });
    expect(await tratoDeLaFamilia(admin, "f-es")).toBe("tu");
    expect(await tratoDeLaFamilia(admin, "f-ar")).toBe("vos");
    expect(await tratoDeLaFamilia(admin, "otra")).toBe("vos");
    expect(await tratoDeLaFamilia(admin, null)).toBe("vos");
    const rota = { from: () => { throw new Error("sin base"); } } as never;
    expect(await tratoDeLaFamilia(rota, "f-es")).toBe("vos");
    expect(intenta("tu")).toBe("Intenta");
    expect(intenta("vos")).toBe("Intentá");
  });

  describe("PATCH /api/entrega", () => {
    function admin(region: string, opciones: { estado?: string; falla?: boolean } = {}) {
      return {
        from: (tabla: string) => {
          const b: Record<string, unknown> = {};
          const enc = () => b;
          b.select = enc; b.eq = enc; b.ilike = enc;
          b.maybeSingle = async () => ({
            data: tabla === "entregas" ? { id: "e1", familia_id: "fam-1", estado: opciones.estado ?? "sin_direccion" } : { id: "fam-1", region },
            error: null,
          });
          b.update = () => ({ eq: async () => ({ error: opciones.falla ? { message: "falla" } : null }) });
          return b;
        },
      };
    }
    const peticion = (body: unknown) => ({ json: async () => body, nextUrl: { searchParams: new URLSearchParams("narrador=n1&entrega=e1") } }) as never;
    const pedir = async (region: string, body: unknown, opciones: { estado?: string; falla?: boolean } = {}) => {
      (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin(region, opciones));
      return (await (await patchEntrega(peticion(body))).json()) as { error?: string };
    };

    beforeEach(() => {
      (crearClienteSesion as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
      (narradorDeLaSesion as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, narrador: { id: "n1", familia_id: "fam-1" }, user: { id: "u1", email: "m@x.com" } });
    });

    it("España: escríbenos, aquí e Intenta", async () => {
      expect((await pedir("ES", {}, { estado: "en_produccion" })).error).toBe("El libro ya entró en producción con esta dirección: escríbenos si hay que cambiarla.");
      expect((await pedir("ES", { accion: "ya_llego" })).error).toBe("Todavía no salió de aquí: cuando se despache vas a poder marcarlo.");
      expect((await pedir("ES", { accion: "ya_llego" }, { estado: "enviado", falla: true })).error).toBe("No pudimos guardar la dirección. Intenta de nuevo.");
    });

    it("Argentina: escribinos, acá, y el genérico pasa a Intentá (punto C)", async () => {
      expect((await pedir("AR", {}, { estado: "en_produccion" })).error).toBe("El libro ya entró en producción con esta dirección: escribinos si hay que cambiarla.");
      expect((await pedir("AR", { accion: "ya_llego" })).error).toBe("Todavía no salió de acá: cuando se despache vas a poder marcarlo.");
      expect((await pedir("AR", { accion: "ya_llego" }, { estado: "enviado", falla: true })).error).toBe("No pudimos guardar la dirección. Intentá de nuevo.");
    });
  });

  it("la compra: la palabra de familia y el WhatsApp, por la región del formulario", () => {
    const body = (region: string, extra: Record<string, unknown> = {}) =>
      ({
        region, nombreComprador: "Marta", vinculoComprador: "hija",
        narrador: { nombre: "Dora Pérez", comoLeDicen: "Dora", telefonoWhatsapp: "123", genero: "mujer", ...extra },
        contexto: {},
      }) as never;
    const mensaje = (r: ReturnType<typeof validarYConstruir>) => (r.ok ? "" : r.mensaje);
    expect(mensaje(validarYConstruir(body("ES")))).toBe("El WhatsApp no parece un número válido. Revísalo e intenta de nuevo.");
    expect(mensaje(validarYConstruir(body("AR")))).toBe("El WhatsApp no parece un número válido. Revisalo e intentá de nuevo.");
  });
});

describe("/entrar", () => {
  it("España, de tú; Argentina, de vos", () => {
    soloEste(renderToStaticMarkup(<FormularioEntrar trato="tu" />), ["Entra", "Te mandamos un código de 6 números"], ["Entrá"]);
    soloEste(renderToStaticMarkup(<FormularioEntrar />), ["Entrá"], []);
  });
});

describe("/comprar", () => {
  beforeEach(() => {
    process.env.PRECIO_ARS ??= "65000";
    process.env.PRECIO_EUR ??= "79";
  });
  // Rediseño 2026-10: la región sale de la versión de la web (/comprar es España,
  // /ar/comprar Argentina) y el checkout tiene tres pasos. «Mi padre, mi abuela,
  // mi tío» y «Lo lees y lo escuchas…» eran del checkout de cinco pasos: ahora
  // las opciones son «Mi padre / Mi papá» y el resumen dice «Escuchas / Escuchás
  // sus audios mientras cuenta» (TEXTOS-Y-REGLAS §5).
  const checkout = (idioma: "es" | "ar", paso: 1 | 2 | 3 = 1) =>
    renderToStaticMarkup(<Checkout idioma={idioma} catalogo={catalogo(idioma === "es" ? "ES" : "AR")} pasoInicial={paso} />);

  it("España, de tú y sin nada de vos", () => {
    const html = checkout("es");
    soloEste(html, ["¿Cómo quieres su libro?", "Escuchas sus audios mientras cuenta, desde la página de su historia"], ["¿Cómo querés", "Escuchás"]);
    expect(html).not.toMatch(VOSEO);
    soloEste(checkout("es", 2), ["Mi padre", "Mi madre"], ["Mi papá", "Mi mamá"]);
    expect(checkout("es", 2)).not.toMatch(VOSEO);
    expect(checkout("es", 3)).not.toMatch(VOSEO);
    soloEste(renderToStaticMarkup(<SugerenciaRegalo trato="tu" />), ["¿Quieres que sea una sorpresa?", "Regálalo con una tarjeta"], ["¿Querés", "Regalalo"]);
  });

  it("Argentina, de vos", () => {
    soloEste(checkout("ar"), ["¿Cómo querés su libro?", "Escuchás sus audios mientras cuenta, desde la página de su historia"], ["¿Cómo quieres", "Escuchas sus"]);
    soloEste(checkout("ar", 2), ["Mi papá", "Mi mamá"], ["Mi padre", "Mi madre"]);
    soloEste(renderToStaticMarkup(<SugerenciaRegalo />), ["¿Querés que sea una sorpresa?", "Regalalo con una tarjeta"], ["¿Quieres"]);
  });
});

describe("el mail de acceso", () => {
  it("España: por aquí; Argentina: por acá", async () => {
    const enviados: { html: string }[] = [];
    vi.stubEnv("RESEND_API_KEY", "clave-prueba");
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init: { body: string }) => {
      enviados.push(JSON.parse(init.body));
      return new Response("{}", { status: 200 });
    }));
    try {
      const { enviarMailAcceso } = await import("../src/lib/mail");
      await enviarMailAcceso({ para: "e@x.com", comoLeDicen: "abuela", region: "ES" });
      await enviarMailAcceso({ para: "a@x.com", comoLeDicen: "abuela", region: "AR" });
      const [es, ar] = enviados.map((m) => m.html.replace(/\s+/g, " "));
      expect(es).toContain("te avisamos por aquí, y vas a poder");
      expect(es).not.toMatch(/acá|entrá/);
      expect(ar).toContain("te avisamos por acá, y vas a poder");
    } finally {
      vi.unstubAllEnvs();
      vi.unstubAllGlobals();
    }
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/lib/mail", () => ({ enviarMailSocios: vi.fn() }));

import { enviarMailSocios } from "@/lib/mail";
import { POST } from "../src/app/api/eventos/route";
import PaginaEventos from "../src/app/eventos/page";
import EventosCa from "../src/app/ca/eventos/page";
import EventosAr from "../src/app/ar/eventos/page";
import { Pie } from "../src/app/_publico";
import { TEXTOS_EVENTOS } from "../src/app/_textos/eventos";
import { entradasSitemap } from "../src/lib/sitemap";
import { esRobot, mailConsultaEvento, validarConsultaEvento } from "../src/lib/eventos";

// Vitácora Eventos (17/10): /eventos es un «cuéntanos tu evento». El
// formulario manda a /api/eventos, que avisa a los socios por mail. Los datos
// de prueba son inventados.

const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);

const BUENA = {
  nombre: "Pruebalia Testina",
  email: "prueba@ejemplo.com",
  telefono: "+34 600 000 000",
  tipo: "boda",
  fecha: "junio de 2027",
  lugar: "Ciudad Prueba",
  invitados: "80",
  mensaje: "Queremos un libro con lo que digan los abuelos.",
  idioma: "es",
};

const pedir = (cuerpo: unknown) =>
  POST(
    new Request("http://localhost/api/eventos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo),
    }) as never,
  );

describe("la consulta de un evento", () => {
  it("pide nombre, email y qué celebra; lo demás puede faltar", () => {
    expect(validarConsultaEvento({ ...BUENA, nombre: " " })).toEqual({ ok: false, error: "faltan" });
    expect(validarConsultaEvento({ ...BUENA, tipo: "bautismo-raro" })).toEqual({ ok: false, error: "faltan" });
    expect(validarConsultaEvento({ ...BUENA, email: "no-es-un-mail" })).toEqual({ ok: false, error: "email" });
    const r = validarConsultaEvento({ nombre: "A", email: "a@b.co", tipo: "otro" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.consulta).toMatchObject({ idioma: "es", telefono: "", mensaje: "" });
  });

  it("recorta lo largo y no acepta un idioma inventado", () => {
    const r = validarConsultaEvento({ ...BUENA, mensaje: "x".repeat(10_000), idioma: "fr" });
    expect(r.ok && r.consulta.mensaje.length).toBe(3000);
    expect(r.ok && r.consulta.idioma).toBe("es");
  });

  it("el mail a los socios lleva todos los datos y dice de qué web vino", () => {
    const r = validarConsultaEvento({ ...BUENA, idioma: "ar", telefono: "" });
    if (!r.ok) throw new Error("debería validar");
    const { asunto, texto } = mailConsultaEvento(r.consulta);
    expect(asunto).toContain("Boda / casamiento");
    expect(asunto).toContain("Pruebalia Testina");
    expect(texto).toContain("prueba@ejemplo.com");
    expect(texto).toContain("Invitados: 80");
    expect(texto).toContain("Teléfono: (no lo puso)");
    expect(texto).toContain("Argentina");
  });

  it("el campo trampa delata al robot", () => {
    expect(esRobot({ ...BUENA, sitio: "http://spam" })).toBe(true);
    expect(esRobot({ ...BUENA, sitio: "" })).toBe(false);
    expect(esRobot(BUENA)).toBe(false);
  });
});

describe("POST /api/eventos", () => {
  beforeEach(() => vi.mocked(enviarMailSocios).mockReset());

  it("con todo bien, avisa a los socios y contesta ok", async () => {
    vi.mocked(enviarMailSocios).mockResolvedValue(true);
    const r = await pedir(BUENA);
    expect(r.status).toBe(200);
    expect(enviarMailSocios).toHaveBeenCalledOnce();
    expect(vi.mocked(enviarMailSocios).mock.calls[0][1]).toContain("Pruebalia Testina");
  });

  it("si falta algo o el cuerpo no es JSON, 400 y no manda nada", async () => {
    expect((await pedir({ ...BUENA, email: "" })).status).toBe(400);
    expect((await pedir("esto no es json")).status).toBe(400);
    expect(enviarMailSocios).not.toHaveBeenCalled();
  });

  it("si el mail no sale, 502 para que la persona sepa que no llegó", async () => {
    vi.mocked(enviarMailSocios).mockResolvedValue(false);
    const r = await pedir(BUENA);
    expect(r.status).toBe(502);
    expect(await r.json()).toEqual({ error: "envio" });
  });

  it("al robot le dice que sí pero no manda nada", async () => {
    const r = await pedir({ ...BUENA, sitio: "spam" });
    expect(r.status).toBe(200);
    expect(enviarMailSocios).not.toHaveBeenCalled();
  });
});

describe("la página /eventos", () => {
  it("se ve en los tres idiomas, con su trato y el formulario", () => {
    const es = renderToStaticMarkup(<PaginaEventos />);
    const ca = renderToStaticMarkup(<EventosCa />);
    const ar = renderToStaticMarkup(<EventosAr />);
    expect(es).toContain(escapar(TEXTOS_EVENTOS.es.formulario.titulo));
    expect(es).toContain("Bodas");
    expect(ar).toContain("Contanos tu evento");
    expect(ar).toContain("Casamientos");
    expect(ca).toContain(escapar(TEXTOS_EVENTOS.ca.titulo[1]));
    for (const html of [es, ca, ar]) {
      expect(html).toContain('id="contacto"');
      expect(html).toContain('name="email"');
      expect(html).toContain('name="sitio"');
    }
    expect(ar).toContain('href="/ar/legal/privacidad"');
  });

  it("no promete precio, plazos ni audiolibro", () => {
    const todo = JSON.stringify(TEXTOS_EVENTOS);
    expect(todo).not.toMatch(/€|\$|\bdías\b|semanas|audiolibro/i);
  });

  it("el pie la enlaza en cada idioma y entra al sitemap", () => {
    expect(renderToStaticMarkup(<Pie idioma="es" camino="/" />)).toMatch(/href="\/eventos"[^>]*>Eventos</);
    expect(renderToStaticMarkup(<Pie idioma="ca" camino="/" />)).toMatch(/href="\/ca\/eventos"[^>]*>Esdeveniments</);
    expect(renderToStaticMarkup(<Pie idioma="ar" camino="/" />)).toMatch(/href="\/ar\/eventos"[^>]*>Eventos</);
    const urls = entradasSitemap().map((e) => e.url);
    expect(urls).toContain("https://www.vitacorafamiliar.com/eventos");
    expect(urls).toContain("https://www.vitacorafamiliar.com/ar/eventos");
  });
});

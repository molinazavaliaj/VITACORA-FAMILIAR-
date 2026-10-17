import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { textosCartaComprador } from "../src/lib/carta-textos";
import type { CodigoImpreso } from "../src/lib/cartas";

// Regalo en locales: /regalar abierto desde la página de una carta (?codigo=).
const estado = vi.hoisted(() => ({ carta: null as CodigoImpreso | null, props: null as unknown }));

vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-vercel-ip-country": "ES" }) }));
vi.mock("next/font/google", () => {
  const fuente = () => ({ variable: "fuente", className: "fuente", style: {} });
  return { Playfair_Display: fuente, Archivo: fuente, Source_Serif_4: fuente };
});
vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: () => ({}) }));
vi.mock("@/lib/cartas", () => ({ leerCodigoImpreso: async () => estado.carta }));
// El formulario es un componente de cliente con estado: acá solo importa lo que recibe.
vi.mock("../src/app/regalar/formulario", () => ({
  FormularioRegalo: (props: { carta?: { codigo: string } | null; idiomaInicial?: string }) => {
    estado.props = props;
    return <div data-carta={props.carta?.codigo ?? ""} data-idioma={props.idiomaInicial} />;
  },
}));

import PaginaRegalar from "../src/app/regalar/page";

const T = textosCartaComprador("tu");
const carta = (extra: Partial<CodigoImpreso> = {}): CodigoImpreso => ({
  codigo: "VF-7K3M2Q", pagado: false, localId: "l-1", idioma: "ca", comisionPct: 10, localActivo: true, ...extra,
});

async function render(searchParams: { codigo?: string | string[] } = {}) {
  const el = await (PaginaRegalar as unknown as (p: { searchParams: Promise<typeof searchParams> }) => Promise<ReactElement>)({
    searchParams: Promise.resolve(searchParams),
  });
  return renderToStaticMarkup(el);
}

beforeEach(() => { estado.carta = null; estado.props = null; });

describe("PaginaRegalar con ?codigo", () => {
  it("carta libre: pasa la carta al formulario con su idioma", async () => {
    estado.carta = carta();
    const html = await render({ codigo: "VF-7K3M2Q" });
    expect(html).toContain('data-carta="VF-7K3M2Q"');
    expect(html).toContain('data-idioma="ca"');
    expect(html).not.toContain(T.cartaUsada);
  });

  it("carta pagada: avisa que ya se regaló y no la pasa al formulario", async () => {
    estado.carta = carta({ pagado: true });
    const html = await render({ codigo: "VF-7K3M2Q" });
    expect(html).toContain(T.cartaUsada);
    expect(html).not.toContain(T.cartaNoExiste);
    expect(html).toContain('data-carta=""');
  });

  it("código que no existe: avisa que no la encontró, no que ya se regaló", async () => {
    estado.carta = null;
    const html = await render({ codigo: "VF-NOEXISTE" });
    expect(html).toContain(T.cartaNoExiste);
    expect(html).not.toContain(T.cartaUsada);
    expect(html).toContain('data-carta=""');
  });

  it("sin código: ni carta ni aviso", async () => {
    const html = await render();
    expect(html).not.toContain(T.cartaUsada);
    expect(html).toContain('data-carta=""');
    expect(html).toContain('data-idioma="es-ES"');
  });
});

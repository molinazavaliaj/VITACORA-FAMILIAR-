import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import path from "node:path";

import ErrorEs from "../src/app/error";
import ErrorCa from "../src/app/ca/error";
import ErrorAr from "../src/app/ar/error";
import GlobalError from "../src/app/global-error";
import { PaginaDeError } from "../src/app/_publico/pagina-error";
import { TEXTOS_AVISOS } from "../src/app/_textos/avisos";

// Página de error 500 (18/10). Lo que se cuida acá:
//   · que el mensaje técnico del error NO llegue a la pantalla (puede traer la
//     ruta con el token de una familia);
//   · que estén las dos salidas: reintentar y volver al inicio;
//   · que el botón llame de verdad al retry() del límite de error;
//   · que las tres versiones (es, ca, ar) usen sus textos y su ruta;
//   · que el global-error no dependa de CSS de afuera, porque Next lo pinta
//     solo cuando el layout se rompió.

const SECRETO = "no se pudo leer el token de la familia 7f3a-secreto";
const errorConMensaje = (digest?: string) => Object.assign(new TypeError(SECRETO), digest ? { digest } : {});

const paginas = [
  { nombre: "es", Pagina: ErrorEs, idioma: "es" as const, inicio: "/" },
  { nombre: "ca", Pagina: ErrorCa, idioma: "ca" as const, inicio: "/ca" },
  { nombre: "ar", Pagina: ErrorAr, idioma: "ar" as const, inicio: "/ar" },
];

/** Cómo queda un texto en el HTML (React escapa las comillas y los acentos). */
const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);

describe("página de error 500", () => {
  for (const { nombre, Pagina, idioma, inicio } of paginas) {
    it(`${nombre}: no muestra el mensaje técnico del error`, () => {
      const html = renderToStaticMarkup(<Pagina error={errorConMensaje()} retry={() => {}} />);
      expect(html).not.toContain(SECRETO);
      expect(html).not.toContain("TypeError");
      expect(html).not.toContain("7f3a-secreto");
    });

    it(`${nombre}: tiene reintentar y volver al inicio, con los textos de su idioma`, () => {
      const html = renderToStaticMarkup(<Pagina error={errorConMensaje()} retry={() => {}} />);
      const t = TEXTOS_AVISOS[idioma];
      expect(html).toContain(escapar(t.reintentar));
      expect(html).toContain(escapar(t.falla.etiqueta));
      expect(html).toContain(escapar(t.falla.titulo));
      expect(html).toContain(escapar(t.volverAlInicio));
      // El enlace al inicio va a la portada de su idioma.
      expect(html).toContain(`href="${inicio}"`);
    });
  }

  it("el botón llama al retry() del límite de error", () => {
    const retry = vi.fn();
    // PaginaDeError no usa hooks: se puede llamar y mirar el árbol que arma.
    const arbol = PaginaDeError({ idioma: "es", alReintentar: retry }) as unknown as {
      props: { accion: { props: { onClick: () => void } } };
    };
    arbol.props.accion.props.onClick();
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("acepta reset() si la versión de Next todavía lo manda con ese nombre", () => {
    const reset = vi.fn();
    const html = renderToStaticMarkup(<ErrorEs error={errorConMensaje()} reset={reset} />);
    expect(html).toContain(TEXTOS_AVISOS.es.reintentar);
  });

  it("no pinta el digest", () => {
    const html = renderToStaticMarkup(<ErrorEs error={errorConMensaje("abc123digest")} retry={() => {}} />);
    expect(html).not.toContain("abc123digest");
  });
});

describe("global-error", () => {
  it("trae su propio html y body, y no el mensaje del error", () => {
    const html = renderToStaticMarkup(<GlobalError error={errorConMensaje()} retry={() => {}} />);
    expect(html).toContain('<html lang="es-ES">');
    expect(html).toContain("<body");
    expect(html).not.toContain(SECRETO);
    expect(html).toContain(TEXTOS_AVISOS.es.falla.titulo);
    expect(html).toContain(TEXTOS_AVISOS.es.reintentar);
  });

  it("no depende de CSS de afuera: Next lo pinta cuando el layout se rompió", () => {
    const fuente = readFileSync(path.join(process.cwd(), "src/app/global-error.tsx"), "utf8");
    expect(fuente).not.toMatch(/import\s+["'][^"']+\.css["']/);
    expect(fuente).toContain("style={{");
  });
});

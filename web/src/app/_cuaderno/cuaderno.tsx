import { Cabecera, Pie } from "../_publico";
import { Coreografia } from "../_direccion/coreografia";
import { LogoTrazo } from "../_direccion/logo-trazo";
import { conVar } from "../_direccion/piezas";
import { TEXTOS_CUADERNO } from "../_textos/cuaderno";
import "../_portada/portada.css";
import "../_eventos/eventos.css";

// /cuaderno (21/10): adonde lleva el QR de la última página de «El cuaderno de
// su vida» (el diario en papel de Amazon). Una sola pantalla sobre tinta, con
// la estética de /eventos y /colabora: el logo que se dibuja, la etiqueta, el
// título, dos párrafos y un botón a la portada de España. Pensada para el
// celular, que es con lo que se escanea el QR.
//
// Solo castellano de España: la cabecera y el pie apuntan a la portada al
// cambiar de idioma, porque /ca/cuaderno y /ar/cuaderno no existen. Sin menú,
// sin sitemap y con noindex (app/cuaderno/page.tsx).
//
// El botón es un <a> y no un Link de Next a propósito: el origen de la visita
// (lib/origen.ts) se lee una vez por carga, con la URL de llegada. Con una
// carga nueva de la portada, los utm del QR quedan registrados.

export const ENLACE_CUADERNO = "/?utm_source=cuaderno&utm_medium=qr";

export function Cuaderno() {
  const t = TEXTOS_CUADERNO;
  return (
    <div lang="es-ES" className="dir-pagina dir-portada evt flex flex-1 flex-col">
      <Coreografia />

      <section data-capa className="dir-tinta relative z-[1]">
        <div className="dir-hunde dir-hunde--1 relative flex min-h-[100svh] flex-col items-center justify-center px-4 pb-16 pt-32 text-center sm:px-8 sm:pb-20 sm:pt-36">
          <div className="absolute inset-x-0 top-0">
            <Cabecera idioma="es" camino="/" sobreHero />
          </div>
          <LogoTrazo id="trazo-cuaderno" halo="var(--dir-tinta)" className="w-[112px] sm:w-[160px]" />
          <span className="dir-micro prt-etiqueta mt-8">{t.etiqueta}</span>
          <h1 className="dir-titular dir-t1 dir-asienta mt-5 max-w-[14ch]">{t.titulo}</h1>
          <div className="dir-entra mt-6 flex max-w-[34rem] flex-col gap-4 sm:mt-8" style={conVar({ "--e": "0.7s" })}>
            {t.parrafos.map((p) => (
              <p key={p} className="dir-bajada-hero">
                {p}
              </p>
            ))}
          </div>
          <div className="dir-entra mt-10 flex w-full max-w-[358px] flex-col sm:w-auto sm:max-w-none" style={conVar({ "--e": "0.85s" })}>
            <a href={ENLACE_CUADERNO} className="dir-boton dir-boton--lleno">
              {t.boton}
            </a>
          </div>
        </div>
      </section>

      <section className="dir-tinta dir-hoja dir-diferido relative z-[2]">
        <Pie idioma="es" camino="/" />
      </section>
    </div>
  );
}

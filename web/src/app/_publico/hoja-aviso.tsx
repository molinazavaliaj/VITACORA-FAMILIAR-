import Link from "next/link";
import type { ReactNode } from "react";
import { langDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { urlWhatsAppDudas } from "@/lib/whatsapp-dudas";
import { CONTACTO } from "../legal/titulares";
import { TEXTOS_AVISOS, type TextosAviso } from "../_textos/avisos";
import { TEXTOS_PUBLICO } from "../_textos/publico";
import { Toroide } from "../marca";
import "./aviso.css";

// La hoja de aviso (rediseño 2026-10, fase 3, maqueta `Casos` 5): el 404 y los
// enlaces que ya no sirven. Componente de servidor, sin JS: la franja de tinta
// con el logo que vuelve a la portada de su idioma, y la hoja de papel con la
// etiqueta, el título, la frase o la explicación y una o dos salidas. Los
// textos, en ../_textos/avisos.ts; los estilos, en ./aviso.css.

export type Salida =
  | { tipo: "inicio" }
  | { tipo: "comprar" }
  | { tipo: "entrar" }
  /** WhatsApp de dudas si está NEXT_PUBLIC_WHATSAPP_DUDAS; si no, un correo a hola@. */
  | { tipo: "escribirnos" };

/** Adónde lleva cada salida, en el idioma de la hoja. */
export function hrefDeSalida(salida: Salida, idioma: IdiomaWeb): string {
  switch (salida.tipo) {
    case "inicio":
      return ruta(idioma, "/");
    case "comprar":
      return ruta(idioma, "/comprar");
    case "entrar":
      return "/entrar";
    case "escribirnos":
      return urlWhatsAppDudas() ?? `mailto:${CONTACTO.hola}`;
  }
}

export function HojaAviso({
  idioma,
  aviso,
  salidas,
  folio,
  accion,
}: {
  idioma: IdiomaWeb;
  aviso: TextosAviso;
  /** La primera va como botón lleno; las demás, como enlace (salvo que haya `accion`). */
  salidas: Salida[];
  /** El número grande en cursiva (el 404). */
  folio?: string;
  /**
   * Un botón propio delante de las salidas: en la página de error 500 es
   * «Probar de nuevo» (el `retry()` de Next). Si viene, las salidas bajan a
   * enlace para que haya un solo botón lleno.
   */
  accion?: ReactNode;
}) {
  const t = TEXTOS_AVISOS[idioma];
  const texto: Record<Salida["tipo"], string> = {
    inicio: t.volverAlInicio,
    comprar: t.comprar,
    entrar: t.entrar,
    escribirnos: t.escribirnos,
  };
  return (
    <div lang={langDeIdioma(idioma)} className="dir-pagina avi">
      <header className="dir-tinta avi-cabecera">
        <div className="mx-auto flex w-full max-w-[1240px] items-center px-4 pb-4 pt-5 sm:px-8 sm:pb-6 sm:pt-6">
          <Link href={ruta(idioma, "/")} aria-label={t.inicio} prefetch={false} className="flex min-h-11 items-center gap-3 text-[var(--dir-sobre-tinta)]">
            <Toroide className="h-6 w-auto" />
            <span aria-hidden className="dir-micro tracking-[0.22em]">
              VITÁCORA
            </span>
          </Link>
        </div>
      </header>
      <main className="dir-deckle avi-hoja">
        <div className="avi-cuerpo" data-folio={folio ? "" : undefined}>
          <div>
            {aviso.etiqueta ? <p className="avi-etiqueta">{aviso.etiqueta}</p> : null}
            <h1 className="avi-titulo">{aviso.titulo}</h1>
            {aviso.frase ? <p className="avi-frase">{aviso.frase}</p> : null}
            {aviso.bajada ? <p className="avi-bajada">{aviso.bajada}</p> : null}
            <div className="avi-acciones">
              {accion ?? null}
              {salidas.map((salida, i) => {
                const href = hrefDeSalida(salida, idioma);
                const clase = i === 0 && !accion ? "avi-boton" : "avi-enlace";
                // Afuera (WhatsApp, correo) va con <a>; adentro, con Link sin prefetch.
                return href.startsWith("/") ? (
                  <Link key={salida.tipo} href={href} prefetch={false} className={clase}>
                    {texto[salida.tipo]}
                  </Link>
                ) : (
                  <a key={salida.tipo} href={href} className={clase} {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>
                    {texto[salida.tipo]}
                  </a>
                );
              })}
            </div>
          </div>
          {folio ? (
            <p aria-hidden className="avi-folio">
              {folio}
            </p>
          ) : null}
        </div>
        <footer className="avi-pie">
          <p>{TEXTOS_PUBLICO[idioma].lema}</p>
        </footer>
      </main>
    </div>
  );
}

/** El 404 de una versión de la web: «Esta página se ha perdido», al inicio o a comprar. */
export function PaginaNoEncontrada({ idioma }: { idioma: IdiomaWeb }) {
  return <HojaAviso idioma={idioma} aviso={TEXTOS_AVISOS[idioma].noExiste} salidas={[{ tipo: "inicio" }, { tipo: "comprar" }]} folio="404" />;
}

/** Un enlace firmado que no verifica (libro, su voz, anticipo): escribirnos o entrar. */
export function EnlaceQueNoSirve({ idioma }: { idioma: IdiomaWeb }) {
  return <HojaAviso idioma={idioma} aviso={TEXTOS_AVISOS[idioma].enlace} salidas={[{ tipo: "escribirnos" }, { tipo: "entrar" }]} />;
}

/** El código de un regalo que no existe o no está pagado: escribirnos o volver al inicio. */
export function RegaloQueNoSeEncuentra({ idioma }: { idioma: IdiomaWeb }) {
  return <HojaAviso idioma={idioma} aviso={TEXTOS_AVISOS[idioma].regalo} salidas={[{ tipo: "escribirnos" }, { tipo: "inicio" }]} />;
}

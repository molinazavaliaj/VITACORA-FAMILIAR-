import Image from "next/image";
import type { ReactNode } from "react";
import { IconoWhatsApp } from "../_publico";
import { conVar } from "../_direccion/piezas";

// Las piezas de la portada que repiten las páginas de cada producto (/viaje,
// /historia, /kids, /eventos): el inicio en dos columnas, la tienda con su
// franja de confianza, la banda de fotos, los pasos grandes, las preguntas y el
// cierre. De servidor. Los estilos, en acuarela.css. Los textos llegan por
// props: acá no hay ninguno.

/** El inicio: una pantalla, el texto a la izquierda y el producto a la derecha. Es la única capa: la hoja de abajo sube y lo tapa. */
export function InicioAcuarela({
  cabecera,
  titulo,
  bajada,
  botones,
  dato,
  visual,
  arriba = "pt-36 md:pt-28",
}: {
  cabecera: ReactNode;
  titulo: ReactNode;
  bajada: ReactNode;
  botones: ReactNode;
  /** Una línea chica debajo de los botones (el precio, «Próximamente», el aviso de privacidad). */
  dato?: ReactNode;
  visual: ReactNode;
  /** El aire de arriba: en el teléfono la cabecera lleva dos filas y el texto no puede pisarla. */
  arriba?: string;
}) {
  return (
    <section data-capa className="acu-lavado relative z-[1]">
      <div className={`dir-hunde dir-hunde--1 relative flex min-h-[100svh] flex-col items-center justify-center px-4 pb-8 text-center sm:px-8 lg:px-12 ${arriba}`}>
        <div className="absolute inset-x-0 top-0">{cabecera}</div>
        <div className="acu-inicio">
          <div className="acu-inicio-texto">
            <h1 className="dir-titular dir-t2 dir-asienta">{titulo}</h1>
            <p className="acu-inicio-bajada dir-entra" style={conVar({ "--e": "0.35s" })}>{bajada}</p>
            <div className="acu-inicio-botones dir-entra" style={conVar({ "--e": "0.5s" })}>{botones}</div>
            {dato ? <p className="acu-inicio-dato dir-entra" style={conVar({ "--e": "0.55s" })}>{dato}</p> : null}
          </div>
          <div className="acu-inicio-visual dir-entra" style={conVar({ "--e": "0.6s" })}>{visual}</div>
        </div>
      </div>
    </section>
  );
}

/** La tienda: la franja de confianza pegada arriba, el título, la bajada y lo que se vende. Es la hoja que tapa el inicio. */
export function TiendaAcuarela({
  confianza,
  titulo,
  bajada,
  ctaPropio = false,
  children,
}: {
  confianza: readonly string[];
  titulo: ReactNode;
  bajada?: ReactNode;
  /** Si la sección lleva botón de compra, la barra fija del teléfono se esconde sobre ella. */
  ctaPropio?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id="tienda"
      data-cta-propio={ctaPropio ? "" : undefined}
      className="acu-iman acu-hoja-lisa dir-hoja dir-sobre-1 relative z-[2] -mt-px scroll-mt-0 px-4 py-14 text-center sm:px-8 md:py-20"
    >
      <ul className="acu-confianza -mx-4 -mt-14 mb-12 sm:-mx-8 md:-mt-20 md:mb-16">
        {confianza.map((c) => <li key={c}>{c}</li>)}
      </ul>
      <h2 className="dir-titular dir-t3 mx-auto max-w-[20ch]">{titulo}</h2>
      {bajada ? <p className="acu-bajada mt-4">{bajada}</p> : null}
      {children}
    </section>
  );
}

/**
 * La foto de ancho completo. Con dos fotos, una al lado de la otra: lo que hay
 * cuando el producto no tiene ninguna ancha. Ilustran: las personas son generadas
 * y nunca se presentan como clientes.
 */
export function BandaFotos({ fotos, alt = "", posicion = "50% 40%", z = "z-[3]" }: { fotos: readonly string[]; alt?: string; posicion?: string; z?: string }) {
  return (
    <section aria-hidden={alt ? undefined : true} className={`acu-banda relative ${z} aspect-[4/3] w-full overflow-hidden bg-[var(--acu-banda)] sm:aspect-[21/9]`}>
      {fotos.map((foto) => (
        <div key={foto} className="relative">
          <Image src={foto} alt={alt} fill sizes={fotos.length > 1 ? "50vw" : "100vw"} className="object-cover" style={{ objectPosition: posicion }} />
        </div>
      ))}
    </section>
  );
}

/** Una pieza grande (foto o video) y fotos más chicas al lado, en vez de una banda a todo lo ancho. */
export function BandaMedios({ grande, chicas, z = "z-[3]" }: { grande: ReactNode; chicas: readonly string[]; z?: string }) {
  return (
    <section aria-hidden className={`acu-hoja-lisa relative ${z} px-4 py-10 sm:px-8 md:py-14`}>
      <div className="acu-medios">
        <div className="acu-medios-grande">{grande}</div>
        {chicas.map((foto) => (
          <div key={foto} className="acu-medios-chica">
            <Image src={foto} alt="" fill sizes="(min-width: 820px) 30vw, 50vw" />
          </div>
        ))}
      </div>
    </section>
  );
}

export type PasoFoto = { titulo: string; texto: string; foto?: string | null; alt?: string; ilustracion?: ReactNode };

/** Los pasos grandes, con su foto. Con tres pasos, tres columnas. */
export function PasosFotos({
  titulo,
  pasos,
  etiqueta,
  z = "z-[4]",
  clase = "acu-hoja-lisa",
}: {
  titulo: ReactNode;
  pasos: readonly PasoFoto[];
  etiqueta: (n: number) => string;
  z?: string;
  clase?: string;
}) {
  return (
    <section id="como-funciona" className={`acu-iman ${clase} relative ${z} scroll-mt-6 px-4 py-14 text-center sm:px-8 md:py-20`}>
      <h2 className="dir-titular dir-t3 mx-auto max-w-[24ch]">{titulo}</h2>
      <ol className={`acu-pasos${pasos.length === 3 ? " acu-pasos--tres" : ""}`}>
        {pasos.map((paso, i) => (
          <li key={paso.titulo} className="acu-paso">
            <div className="acu-paso-img">
              {paso.foto ? <Image src={paso.foto} alt={paso.alt ?? ""} fill sizes="(min-width: 900px) 25vw, 50vw" /> : paso.ilustracion}
            </div>
            <small>{etiqueta(i + 1)}</small>
            <h3>{paso.titulo}</h3>
            <p>{paso.texto}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * Las preguntas, con el bloque de WhatsApp. La garantía vive acá y solo acá
 * (DECISIONES D1). dir-papel da las variables claras del acordeón; el fondo lo
 * fija acuarela.css.
 */
export function PreguntasAcuarela({
  titulo,
  duda,
  whatsapp,
  z = "z-[7]",
  children,
}: {
  titulo: ReactNode;
  duda?: { titulo: string; texto: string; boton: string };
  whatsapp: string | null;
  z?: string;
  children: ReactNode;
}) {
  return (
    <section id="preguntas" className={`dir-papel acu-hoja-lisa relative ${z} scroll-mt-6`}>
      <div className="mx-auto grid max-w-[1160px] grid-cols-1 gap-10 px-4 py-14 sm:px-8 md:grid-cols-12 md:gap-8 md:py-20">
        <div className="md:col-span-4">
          <h2 className="dir-titular dir-t3">{titulo}</h2>
        </div>
        <div className="flex flex-col gap-12 md:col-span-7 md:col-start-6">
          <div className="border-t border-[var(--dir-hilo-papel)]">{children}</div>
          {whatsapp && duda ? (
            <div className="flex flex-col gap-3">
              <span className="dir-pie">{duda.titulo}</span>
              <p className="text-[16px] font-light leading-[1.55] text-[var(--dir-sobre-papel-suave)]">{duda.texto}</p>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="dir-boton dir-boton--lleno acu-boton self-start">
                <IconoWhatsApp className="mr-2 h-4 w-4" />
                {duda.boton}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** El cierre: la acuarela, una frase y el botón. El pie va aparte, abajo. */
export function CierreAcuarela({ titulo, z = "z-[8]", marca, children }: { titulo: ReactNode; z?: string; marca?: ReactNode; children: ReactNode }) {
  return (
    <section data-cta-propio className={`acu-lavado relative ${z} flex flex-col items-center gap-6 px-4 py-20 text-center sm:px-8`}>
      {marca}
      <h2 className="dir-titular dir-t3 max-w-[18ch]">{titulo}</h2>
      {children}
    </section>
  );
}

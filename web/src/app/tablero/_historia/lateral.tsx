import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { PANEL, type IdiomaPanel, type Quien } from "../../_textos/panel";
import type { Momento } from "../momento";
import { FilaConHoja, type Contacto } from "./contacto";
import { UltimoQueConto } from "./ultimo";
import { diasDesde, mmss, type AudioReciente } from "./voz";

// Las hojas del lateral de una historia (rediseño 2026-10, fase 2; maqueta
// Panel): lo último que contó, sus fotos, su WhatsApp, la familia y tu pedido.
// Componentes de servidor y sin datos propios: la página les pasa lo que ya
// leyó (y la muestra del panel, datos de prueba). Cada una va en su Suspense.

/** Una hoja suelta del lateral, con su título en Playfair y, si hace falta, algo a la derecha. */
export function HojaLateral({ titulo, extra, children, id }: { titulo: string; extra?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <section aria-labelledby={id} className="pnl-hoja px-5 pb-5 pt-5 sm:px-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id={id} className="pnl-h3">
          {titulo}
        </h2>
        {extra}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function HojaUltimo({ idioma, quien, ultimas, hrefTodo, ahora }: { idioma: IdiomaPanel; quien: Quien; ultimas: AudioReciente[]; hrefTodo: string; ahora: Date }) {
  if (ultimas.length === 0) return null;
  const T = PANEL[idioma];
  const cuando = (iso: string) => {
    const d = diasDesde(iso, ahora);
    return d === 0 ? T.hoy : d === 1 ? T.ayer : T.haceDias(d);
  };
  return (
    <HojaLateral
      id="lo-ultimo"
      titulo={T.ultimo(quien)}
      extra={
        <a href={hrefTodo} className="pnl-dato shrink-0 underline decoration-[var(--linea-fuerte)] underline-offset-4 hover:text-[var(--texto)]">
          {T.verTodo}
        </a>
      }
    >
      <UltimoQueConto
        escuchar={T.escuchar}
        pausar={T.pausar}
        items={ultimas.map((u) => ({ id: u.id, titulo: u.titulo ?? T.sinTexto, duracion: mmss(u.duracion), cuando: cuando(u.recibidoAt) }))}
      />
    </HojaLateral>
  );
}

export function HojaFotos({
  idioma,
  quien,
  fotos,
  hayPortada,
  subir,
  hrefTapa,
}: {
  idioma: IdiomaPanel;
  quien: Quien;
  /** `src`: otra dirección para la imagen (la muestra del panel); sin ella, /api/fotos/<id>. */
  fotos: { id: string; epigrafe: string | null; src?: string }[];
  hayPortada: boolean;
  /** El botón para subir (SubirFoto), si puede. */
  subir?: ReactNode;
  /** Encargar libro, donde se elige la tapa (solo la dueña). */
  hrefTapa?: string;
}) {
  const T = PANEL[idioma];
  const muestra = fotos.slice(0, 4);
  return (
    <HojaLateral id="sus-fotos" titulo={T.fotos(quien)} extra={fotos.length > 0 ? <span className="pnl-dato shrink-0">{T.cuantasFotos(fotos.length)}</span> : null}>
      <p className="text-[17px] leading-snug [font-family:var(--fuente-titulo)]">{hayPortada ? T.hayPortada(quien) : T.faltaPortada(quien)}</p>
      {!hayPortada ? <p className="pnl-parrafo mt-2 text-[15px]">{T.fotosTexto(quien)}</p> : null}
      {muestra.length > 0 ? (
        <ul className="mt-4 grid grid-cols-4 gap-2">
          {muestra.map((f) => (
            <li key={f.id} className="pnl-miniatura">
              {/* /api/fotos responde con una redirección firmada y pide sesión: sin el optimizador de Next. */}
              <Image src={f.src ?? `/api/fotos/${f.id}`} alt={f.epigrafe ?? ""} fill sizes="80px" unoptimized className="object-cover" />
            </li>
          ))}
        </ul>
      ) : null}
      {subir || (hrefTapa && fotos.length > 0) ? (
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
          {subir}
          {hrefTapa && fotos.length > 0 ? (
            <Link href={hrefTapa} className="pnl-dato underline decoration-[var(--linea-fuerte)] underline-offset-4 hover:text-[var(--texto)]">
              {T.elegirTapa}
            </Link>
          ) : null}
        </div>
      ) : null}
    </HojaLateral>
  );
}

/** Su WhatsApp: el número al que le llegan las preguntas, o por qué todavía no está (regalo sin abrir). */
export function HojaWhatsApp({ idioma, quien, telefono, hrefTarjeta }: { idioma: IdiomaPanel; quien: Quien; telefono: string | null; hrefTarjeta?: string }) {
  const T = PANEL[idioma];
  return (
    <HojaLateral id="su-whatsapp" titulo={T.whatsapp(quien)}>
      {telefono ? (
        <p className="text-[19px] tabular-nums [font-family:var(--fuente-titulo)]">{telefono}</p>
      ) : (
        <>
          <p className="pnl-parrafo text-[15px]">{T.whatsappFalta}</p>
          {hrefTarjeta ? (
            <Link href={hrefTarjeta} className="pnl-boton pnl-boton--hilo mt-4">
              {T.verTarjeta}
            </Link>
          ) : null}
        </>
      )}
    </HojaLateral>
  );
}

export function HojaFamilia({ idioma, quien, children }: { idioma: IdiomaPanel; quien: Quien; children: ReactNode }) {
  const T = PANEL[idioma];
  return (
    <HojaLateral id="la-familia" titulo={T.familia}>
      <p className="pnl-parrafo text-[15px]">{T.familiaTexto(quien)}</p>
      <div className="mt-4">{children}</div>
    </HojaLateral>
  );
}

export type LineasPedido = { impresos: number; marcos: number };

export function HojaPedido({
  idioma,
  quien,
  momento,
  lineas,
  hrefDireccion,
  fecha,
  contacto,
  cierre,
}: {
  idioma: IdiomaPanel;
  quien: Quien;
  momento: Momento;
  lineas: LineasPedido;
  /** Encargar libro, donde está la dirección (solo si hay algo que viaja). */
  hrefDireccion?: string;
  /** «Cambiar la fecha de inicio» (CambiarFecha), si es un regalo que todavía no se abrió. */
  fecha?: ReactNode;
  contacto: Contacto;
  /** El cierre anticipado (CierreAnticipado), si se puede: va adentro de «Pausar o cerrar». */
  cierre?: ReactNode;
}) {
  const T = PANEL[idioma];
  const textosHoja = { whatsapp: T.escribirWhatsApp, correo: T.escribirCorreo, cerrar: T.cerrarHoja };
  return (
    <HojaLateral id="tu-pedido" titulo={T.pedido}>
      <ul className="flex flex-col gap-2.5">
        <li className="pnl-renglon">
          <span>{T.lineaBase}</span>
        </li>
        {lineas.impresos > 0 ? (
          <li className="pnl-renglon">
            <span>{T.lineaImpreso(lineas.impresos)}</span>
            </li>
        ) : null}
        {lineas.marcos > 0 ? (
          <li className="pnl-renglon">
            <span>{T.lineaMarco(lineas.marcos)}</span>
            </li>
        ) : null}
      </ul>
      <div className="mt-5 flex flex-col">
        {fecha}
        {hrefDireccion ? (
          <Link href={hrefDireccion} className="pnl-fila">
            <span>{T.cambiarDireccion}</span>
            <span aria-hidden>›</span>
          </Link>
        ) : null}
        {momento === "marcha" ? (
          <FilaConHoja etiqueta={T.pausarOCerrar} titulo={T.pausarTitulo} texto={T.pausarTexto(quien)} contacto={contacto} asunto={T.asuntoPausa} textos={textosHoja}>
            {cierre ? (
              <>
                <p className="pnl-h3">{T.cerrarTitulo}</p>
                <div className="pnl-cierre">{cierre}</div>
              </>
            ) : null}
          </FilaConHoja>
        ) : null}
        {momento === "antes" ? (
          <FilaConHoja etiqueta={T.cancelar} titulo={T.cancelar} texto={T.cancelarTexto} contacto={contacto} asunto={T.asuntoCancelar} textos={textosHoja} />
        ) : null}
      </div>
    </HojaLateral>
  );
}

/**
 * El marco, con su foto (arreglos chicos, maqueta Panel): en vez del renglón
 * suelto «Añadir el marco» de «Tu pedido», una hoja con la foto del marco en
 * casa, qué es y el enlace a Encargar libro. La página la pone solo si hay
 * impreso y todavía no hay marco.
 */
export function TarjetaMarco({ idioma, quien, href }: { idioma: IdiomaPanel; quien: Quien; href: string }) {
  const T = PANEL[idioma];
  return (
    <section aria-labelledby="el-marco" className="pnl-hoja overflow-hidden">
      <div className="relative aspect-[16/10] w-full">
        <Image src="/rediseno/marco-en-casa.jpg" alt={T.altMarco} fill sizes="(min-width: 1024px) 340px, 100vw" className="object-cover [object-position:center_40%]" />
      </div>
      <div className="flex flex-col gap-2 px-5 pb-5 pt-5 sm:px-6">
        <h2 id="el-marco" className="text-[21px] font-medium leading-tight [font-family:var(--fuente-titulo)]">
          {T.marcoTitulo(quien)}
        </h2>
        <p className="pnl-parrafo text-[15px]">{T.marcoTexto(quien)}</p>
        <Link href={href} className="mt-1 self-start py-1.5 text-[14.5px] underline decoration-[var(--linea-fuerte)] underline-offset-4 hover:decoration-[var(--texto)] [font-family:var(--fuente-micro)]">
          {T.anadirMarco} <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}

/** «¿Dudas? Escríbenos, te contesta una persona.»: al WhatsApp de Vitácora si está, si no al correo. */
export function EnlaceDudas({ idioma, contacto }: { idioma: IdiomaPanel; contacto: Contacto }) {
  const T = PANEL[idioma];
  const href = contacto.whatsapp ?? `mailto:${contacto.correo}`;
  return (
    <a href={href} target={contacto.whatsapp ? "_blank" : undefined} rel={contacto.whatsapp ? "noreferrer" : undefined} className="group flex items-center gap-3 px-1 py-2 text-[14.5px] text-[var(--texto-suave)] transition-colors hover:text-[var(--texto)] [font-family:var(--fuente-micro)]">
      <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 19.5 5.6 16A8 8 0 1 1 8 18.4z" />
      </svg>
      <span className="underline decoration-[var(--linea-fuerte)] underline-offset-4 group-hover:decoration-[var(--texto)]">{T.dudas}</span>
    </a>
  );
}

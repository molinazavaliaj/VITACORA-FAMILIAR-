import Image from "next/image";
import type { ReactNode } from "react";
import type { Catalogo } from "@/lib/productos";
import type { IdiomaLibro } from "@/lib/tapa";
import { TapaLibro } from "../tapa-libro";
import {
  conMarcosParaRegalar,
  contadorDeMarcos,
  marcosParaRegalar,
  opcionDe,
  opcionesDeLibro,
  precioDeOpcion,
  sumaSinPack,
  type OpcionLibro,
} from "./opciones-libro";

// Las opciones del paso 1 de /comprar y /comprar/viaje (Naza 14/10), en este
// orden: el libro completo (impreso + digital + su foto enmarcada), el impreso
// + digital, y el digital. Cada una con su miniatura, una frase de valor y su
// precio; la elegida se abre y muestra su detalle y, si lleva impreso, los
// extras (copias y marcos para regalar) como filas adentro: se marcan con un
// toque y ahí mismo aparece el contador para sumar más. Radios nativos del
// mismo grupo (`formato`): una sola elegida, con el dedo o las flechas. El
// libro completo lleva la cinta de marcapáginas «Para regalar» y, si hay pack
// con descuento real, su precio y la suma tachada al lado. Sin texto propio:
// todo llega del diccionario de cada compra. Estilos: .chk-op* en checkout.css.

type ConLibro = { formato: "digital" | "impreso"; marcos: number; copias: number; opcion?: OpcionLibro };

export type TextosOpciones = {
  titulo: string;
  digitalTitulo: string;
  digitalDetalle: string;
  impresoTitulo: string;
  impresoDetalle: string;
  marcoOpcionTitulo: string;
  marcoOpcionDetalle: string;
  /** La cinta del libro completo («Para regalar»). */
  cinta?: string;
  /** Las frases de valor de cada opción (cabeza y bajada). Sin ellas, la cabeza es el título. */
  frases?: Record<OpcionLibro, { cabeza: string; bajada: string }>;
  copiasTitulo: string;
  marcoRegaloTitulo: string;
  marcoRegaloDetalle: string;
  primeroYDemas: (primero: string, demas: string) => string;
  unoMenos: (t: string) => string;
  unoMas: (t: string) => string;
};

type Tapa = { titulo: string; idioma: IdiomaLibro };

/** La foto de tapa chica, ya optimizada (la tapa de las miniaturas mide ~60 px). */
// q=75: la única calidad que acepta el optimizador de imágenes (Next 16, sin `images.qualities`).
const TAPA_CHICA = "/_next/image?url=%2Frediseno%2Flibro-tapa-foto.jpg&w=128&q=75";

/** Las miniaturas: el libro en 3/4, el libro con su marco al lado, una pantalla con la tapa, o solo el marco. */
function Miniatura({ tipo, tapa, foto }: { tipo: OpcionLibro | "copia" | "marco-solo"; tapa: Tapa; foto: string }) {
  const libro = (
    <span className="chk-mini-libro">
      <TapaLibro titulo={tapa.titulo} fotoSrc={TAPA_CHICA} idioma={tapa.idioma} />
    </span>
  );
  const marco = (
    <span className="dir-marco dir-marco--arco chk-mini-marco">
      <span className="dir-foto dir-foto--arco block">
        <Image src={foto} alt="" fill sizes="40px" className="object-cover object-[50%_42%]" />
      </span>
    </span>
  );
  if (tipo === "digital")
    return (
      <span aria-hidden className="chk-mini chk-mini--pantalla">
        <span className="chk-mini-pantalla">
          <TapaLibro titulo={tapa.titulo} fotoSrc={TAPA_CHICA} idioma={tapa.idioma} llenar />
        </span>
      </span>
    );
  if (tipo === "marco" || tipo === "marco-solo")
    return (
      <span aria-hidden className={`chk-mini ${tipo === "marco" ? "chk-mini--pack" : "chk-mini--fila"}`}>
        {tipo === "marco" ? libro : null}
        {marco}
      </span>
    );
  return (
    <span aria-hidden className={`chk-mini ${tipo === "copia" ? "chk-mini--fila" : ""}`}>
      {libro}
    </span>
  );
}

export function OpcionesLibro({
  cat,
  base,
  estado,
  onElegir,
  onCambio,
  textos: T,
  foto,
  tapa,
  conPack = false,
  formatear: f,
}: {
  cat: Pick<Catalogo, "impreso" | "marco" | "pack">;
  /** El precio de la base (el libro de una vida o el viaje). */
  base: number;
  estado: ConLibro;
  onElegir: (o: OpcionLibro) => void;
  /** Los cambios de los extras: copias y marcos. */
  onCambio: (cambios: Partial<ConLibro>) => void;
  textos: TextosOpciones;
  /** La foto del marco de esta compra. */
  foto: string;
  /** Lo que dice la tapa de las miniaturas (el nombre que se va escribiendo, o nada). */
  tapa: Tapa;
  /** Si el libro completo puede ir con el precio de pack (solo el libro de una vida). */
  conPack?: boolean;
  formatear: (n: number) => string;
}) {
  const elegida = opcionDe(estado);
  const tachado = conPack ? sumaSinPack(base, cat) : null;
  const titulos: Record<OpcionLibro, { titulo: string; detalle: string }> = {
    marco: { titulo: T.marcoOpcionTitulo, detalle: T.marcoOpcionDetalle },
    impreso: { titulo: T.impresoTitulo, detalle: T.impresoDetalle },
    digital: { titulo: T.digitalTitulo, detalle: T.digitalDetalle },
  };
  return (
    <fieldset className="flex flex-col gap-3.5">
      <legend className="sr-only">{T.titulo}</legend>
      {opcionesDeLibro(cat).map((o) => {
        const precio = precioDeOpcion(o, base, cat, conPack);
        const frase = T.frases?.[o];
        const esta = elegida === o;
        const cinta = o === "marco" && T.cinta ? T.cinta : null;
        return (
          <div key={o} className="chk-op" data-opcion={o}>
            {cinta ? (
              <span aria-hidden className="chk-cinta">
                {cinta}
              </span>
            ) : null}
            <label className={`chk-op-tarjeta ${cinta ? "chk-op-tarjeta--cinta" : ""}`.trim()}>
              <input type="radio" className="sr-only" name="formato" value={o} checked={esta} onChange={() => onElegir(o)} />
              <span aria-hidden className="chk-op-punto" />
              <Miniatura tipo={o} tapa={tapa} foto={foto} />
              <span className="chk-op-textos">
                {cinta ? <span className="sr-only">{cinta}. </span> : null}
                <span className="chk-op-cabeza">{frase ? frase.cabeza : titulos[o].titulo}</span>
                {frase ? <span className="chk-op-bajada">{frase.bajada}</span> : null}
                {frase ? <span className="chk-op-meta">{titulos[o].titulo}</span> : null}
                {esta ? <span className="chk-op-detalle">{titulos[o].detalle}</span> : null}
              </span>
              <span className="chk-op-precio">
                {o === "marco" && tachado !== null ? <s className="chk-op-tachado">{f(tachado)}</s> : null}
                <span className="chk-op-cifra">{precio === null ? "" : f(precio)}</span>
              </span>
            </label>
            {esta && o !== "digital" ? <Extras cat={cat} estado={estado} onCambio={onCambio} textos={T} foto={foto} tapa={tapa} formatear={f} /> : null}
          </div>
        );
      })}
    </fieldset>
  );
}

/**
 * Los extras de la opción elegida, como filas adentro de su tarjeta: la copia
 * del impreso y el marco con foto para regalar. Cada fila se marca con un toque
 * (una unidad) y, marcada, muestra su contador para sumar más; bajar a cero la
 * desmarca. Los precios salen del catálogo, como los cobra `armarCompra`: el
 * marco, en la 2 el primero a precio de marco y los demás a precio adicional;
 * en la 3 solo adicionales (el primero ya va en la opción).
 */
function Extras({
  cat,
  estado,
  onCambio,
  textos: T,
  foto,
  tapa,
  formatear: f,
}: {
  cat: Pick<Catalogo, "impreso" | "marco">;
  estado: ConLibro;
  onCambio: (cambios: Partial<ConLibro>) => void;
  textos: TextosOpciones;
  foto: string;
  tapa: Tapa;
  formatear: (n: number) => string;
}) {
  const copia = cat.impreso?.precioCopia ?? null;
  const marco = contadorDeMarcos(opcionDe(estado), cat);
  if (copia === null && !marco) return null;
  return (
    <div className="chk-extras">
      {copia !== null ? (
        <FilaExtra
          nombre="copias"
          titulo={T.copiasTitulo}
          precio={`+${f(copia)}`}
          valor={estado.copias}
          max={19}
          onValor={(n) => onCambio({ copias: n })}
          menos={T.unoMenos(T.copiasTitulo)}
          mas={T.unoMas(T.copiasTitulo)}
          miniatura={<Miniatura tipo="copia" tapa={tapa} foto={foto} />}
        />
      ) : null}
      {marco ? (
        <FilaExtra
          nombre="marcos"
          titulo={T.marcoRegaloTitulo}
          detalle={T.marcoRegaloDetalle}
          precio={`+${f(marco.primero)}`}
          regla={marco.demas !== null && marco.demas !== marco.primero ? T.primeroYDemas(f(marco.primero), f(marco.demas)) : undefined}
          valor={marcosParaRegalar(estado)}
          max={marco.max}
          onValor={(n) => onCambio(conMarcosParaRegalar(estado, n))}
          menos={T.unoMenos(T.marcoRegaloTitulo)}
          mas={T.unoMas(T.marcoRegaloTitulo)}
          miniatura={<Miniatura tipo="marco-solo" tapa={tapa} foto={foto} />}
        />
      ) : null}
    </div>
  );
}

function FilaExtra({
  nombre,
  titulo,
  detalle,
  precio,
  regla,
  valor,
  max,
  onValor,
  menos,
  mas,
  miniatura,
}: {
  nombre: string;
  titulo: string;
  detalle?: string;
  precio: string;
  /** «+20 € el primero, +15 € los demás», si el primero y los demás no cuestan lo mismo. */
  regla?: string;
  valor: number;
  max: number;
  onValor: (n: number) => void;
  menos: string;
  mas: string;
  miniatura: ReactNode;
}) {
  const marcado = valor > 0;
  const boton =
    "m-ghost flex h-10 w-10 items-center justify-center rounded-full border border-[var(--borde-oscuro-fuerte)] text-lg text-[var(--texto-oscuro-fuerte)] disabled:opacity-40 [touch-action:manipulation]";
  return (
    <div className="chk-extra" data-marcado={marcado || undefined}>
      <label className="chk-extra-marca">
        <input type="checkbox" className="sr-only" name={nombre} checked={marcado} onChange={(ev) => onValor(ev.target.checked ? 1 : 0)} />
        <span aria-hidden className="chk-extra-caja">
          {marcado ? (
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.2 4.2L19 7" />
            </svg>
          ) : null}
        </span>
        {miniatura}
        <span className="chk-extra-textos">
          <span className="chk-extra-titulo">{titulo}</span>
          {detalle ? <span className="chk-extra-detalle">{detalle}</span> : null}
          {regla ? <span className="chk-extra-detalle">{regla}</span> : null}
        </span>
        <span className="chk-extra-precio">{precio}</span>
      </label>
      {marcado ? (
        <div className="chk-extra-contador">
          <button type="button" aria-label={menos} onClick={() => onValor(Math.max(0, valor - 1))} className={boton}>
            −
          </button>
          <span className="w-6 text-center text-[16px] tabular-nums text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-micro)]">{valor}</span>
          <button type="button" aria-label={mas} disabled={valor >= max} onClick={() => onValor(Math.min(max, valor + 1))} className={boton}>
            +
          </button>
        </div>
      ) : null}
    </div>
  );
}

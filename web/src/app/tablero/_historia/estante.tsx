import Link from "next/link";
import { esPropia, type Historia } from "@/lib/panel";
import { tratoDeRegion, type RegionComprador } from "@/lib/regalo-textos";
import { idiomaDelLibro } from "@/lib/tapa";
import { TapaLibro } from "../../tapa-libro";
import { idiomaDelTrato, type Quien } from "../../_textos/panel";
import { BannerAlertaSilencio } from "../acciones";
import { proximoPaso, viajeDe, type Resumen } from "../proximo-paso";
import { esElla, lineaDeTiempo } from "../momento";
import { estadoEnHumano, formatearDuracion, ProximoPaso, tituloHistoria } from "../ui";
import { LineaDeTiempo } from "./portada";
import type { DatosPedido } from "./pedido";
import { tituloCapitulo } from "@/lib/kids-panel";
import { estadoKids, textosPanelKids } from "../../_textos/panel-kids";
import type { IdiomaKids } from "@/lib/kids";

// Un libro del estante del Inicio (rediseño 2026-10, fase 2): la tapa de
// verdad a la izquierda y, al lado, el título, cómo va, su línea de tiempo y
// UN solo próximo paso. Sin datos propios: el Inicio le pasa lo que leyó (y la
// muestra del panel, datos de prueba).

/** Vitácora Kids (K5): cómo va el chico, de su fila de kids_v2. */
export type ResumenKids = { canal: "A" | "B"; arranco: boolean; capitulo: number; terminado: boolean; abiertas: boolean; /** El castellano del chico (kids_v2.idioma); sin él, es-AR. */ idioma?: IdiomaKids };

export type Extra = { aprobado: boolean; portadaFotoId: string | null; titulo: string | null; pedido: DatosPedido; kids?: ResumenKids | null };

export function LibroDelEstante({ h, r, region, fotoSrc }: { h: Historia; r: Resumen & Extra; region: RegionComprador; /** Otra dirección para la foto de tapa (la muestra). */ fotoSrc?: string }) {
  if (r.kids) return <LibroKids h={h} r={r} kids={r.kids} fotoSrc={fotoSrc} />;
  const paso = proximoPaso(h, r, region);
  const trato = tratoDeRegion(region);
  const n = h.narrador;
  const viaje = viajeDe(h);
  const propia = esPropia(n);
  const quien: Quien = { como: n.como_le_dicen, propia, ella: esElla(n.contexto), viaje: Boolean(viaje) };
  const idioma = idiomaDelTrato(trato);
  const titulo = viaje ? (h.rol === "duena" ? "Tu viaje" : `El viaje de ${n.nombre}`) : tituloHistoria(n.nombre, propia);
  const contexto = (n.contexto ?? {}) as { idioma?: unknown };
  return (
    <li data-producto={viaje ? "viaje" : undefined} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-5 border-t border-[var(--linea)] py-8 sm:gap-x-10 md:py-10">
      <Link href={`/tablero/${n.id}`} aria-label={titulo} className="block self-start">
        <div className="pnl-libro w-[78px] sm:w-[118px]">
          <TapaLibro
            titulo={r.titulo ?? n.nombre}
            fotoSrc={fotoSrc ?? (r.portadaFotoId ? `/api/fotos/${r.portadaFotoId}` : null)}
            idioma={idiomaDelLibro(contexto.idioma === "ca" ? "ca" : null)}
          />
        </div>
      </Link>

      <div className="flex min-w-0 flex-col">
        {h.rol !== "duena" || viaje ? (
          <p className="pnl-micro mb-2">{h.rol === "invitado" ? (viaje ? "Te invitaron a este viaje" : "Te invitaron a esta historia") : h.rol === "visitante" ? "Lo guardaste" : "Vitácora de viaje"}</p>
        ) : null}
        <Link href={`/tablero/${n.id}`} className="block w-fit">
          <h2 className="pnl-h2 underline decoration-transparent underline-offset-[6px] transition-colors hover:decoration-[var(--linea-fuerte)]">{titulo}</h2>
        </Link>
        <p className="pnl-parrafo mt-2">{estadoEnHumano(n.estado, propia, trato)}</p>
        {/* V3 (10/10): sin total ni barra; el guion clásico y el viaje, con su total como antes. */}
        {r.v3 ? (
          r.segundos > 0 ? <p className="pnl-dato mt-1">{formatearDuracion(r.segundos)} {propia ? "de tu voz" : "de su voz"}</p> : null
        ) : (
          <p className="pnl-dato mt-1">
            {r.respondidas} de {r.total} respuestas
            {r.segundos > 0 ? ` · ${formatearDuracion(r.segundos)} ${propia ? "de tu voz" : "de su voz"}` : ""}
          </p>
        )}

        {n.alerta_silencio && h.rol === "duena" ? (
          <div className="mt-5">
            <BannerAlertaSilencio narradorId={n.id} comoLeDicen={n.como_le_dicen} trato={trato} />
          </div>
        ) : null}

        <div className="mt-6 max-w-[640px]">
          <LineaDeTiempo
            idioma={idioma}
            quien={quien}
            compacta
            pasos={lineaDeTiempo({ estado: n.estado, aprobado: r.aprobado, libroEntregado: r.pedido.libroEntregado, conImpreso: h.rol === "duena" && r.pedido.impresos > 0, impresoEnCasa: r.pedido.impresoEnCasa })}
          />
        </div>

        {paso ? (
          <div className="mt-6 max-w-[640px]">
            <ProximoPaso href={paso.href}>{paso.texto}</ProximoPaso>
          </div>
        ) : null}
      </div>
    </li>
  );
}

/**
 * Un chico de Vitácora Kids en el estante (K5): su libro, cómo va (las mismas
 * palabras que su panel) y un solo paso. Sin «X de 30 respuestas» ni la línea
 * de tiempo de la biografía: Kids va por partes.
 */
function LibroKids({ h, r, kids, fotoSrc }: { h: Historia; r: Resumen & Extra; kids: ResumenKids; fotoSrc?: string }) {
  const n = h.narrador;
  const apodo = n.como_le_dicen?.trim() || n.nombre;
  const PANEL_KIDS = textosPanelKids(kids.idioma).panel;
  const titulo = PANEL_KIDS.titulo(apodo);
  const estado = estadoKids({ estado: n.estado, canal: kids.canal, apodo, arranco: kids.arranco, capitulo: kids.capitulo, titulo: tituloCapitulo(kids.capitulo), termino: kids.terminado, idioma: kids.idioma });
  const paso = kids.abiertas
    ? { href: `/tablero/${n.id}#tus-preguntas`, texto: PANEL_KIDS.inicio.preguntas }
    : { href: `/tablero/${n.id}#lo-contado`, texto: PANEL_KIDS.inicio.ver };
  return (
    <li data-producto="kids" className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-5 border-t border-[var(--linea)] py-8 sm:gap-x-10 md:py-10">
      <Link href={`/tablero/${n.id}`} aria-label={titulo} className="block self-start">
        <div className="pnl-libro w-[78px] sm:w-[118px]">
          <TapaLibro titulo={r.titulo ?? n.nombre} fotoSrc={fotoSrc ?? (r.portadaFotoId ? `/api/fotos/${r.portadaFotoId}` : null)} idioma={idiomaDelLibro(null)} />
        </div>
      </Link>
      <div className="flex min-w-0 flex-col">
        <p className="pnl-micro mb-2">{PANEL_KIDS.etiqueta}</p>
        <Link href={`/tablero/${n.id}`} className="block w-fit">
          <h2 className="pnl-h2 underline decoration-transparent underline-offset-[6px] transition-colors hover:decoration-[var(--linea-fuerte)]">{titulo}</h2>
        </Link>
        <p className="pnl-parrafo mt-2">{estado}</p>
        <div className="mt-6 max-w-[640px]">
          <ProximoPaso href={paso.href}>{paso.texto}</ProximoPaso>
        </div>
      </div>
    </li>
  );
}

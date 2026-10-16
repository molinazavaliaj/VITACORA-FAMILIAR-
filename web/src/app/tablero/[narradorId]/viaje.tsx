import { PUEDE, type Rol } from "@/lib/panel";
import { momentoDelViaje, hoyEn, nombreDePais, type CompraViaje } from "@/lib/viaje";
import type { TratoComprador } from "@/lib/regalo-textos";
import { BannerAlertaSilencio } from "../acciones";
import { GaleriaCapitulo, type FotoVista } from "./fotos";
import { ReabrirEdicion } from "./cerrar-edicion";
import { FechasDelViaje } from "./fechas-viaje";
import { ReproductorRespuesta } from "../reproductor";
import { Etiqueta, ProximoPaso, estadoEnHumano, type RespuestaVista } from "../ui";

// La página del viaje (Vitácora de Viaje V2, 16/10). Mínima a propósito: el
// viaje lo lleva el bot de la V2 (banco fijo, su propio reloj y su fila en
// `viajes_v2`), así que acá no hay etapas, ciudades ni «sobre qué te
// preguntamos» que editar. Se ve dónde está el viaje (antes de salir, de
// viaje, de vuelta), lo que eligió en la compra, lo contado en orden de
// llegada y sus fotos. Las fechas se corren desde acá solo mientras el bot
// todavía no tomó el viaje (FechasDelViaje); después, se escribe al equipo.
//
// TEXTO PARA NAZA: los textos de esta pantalla están en
// docs/rediseno-2026-10/viaje-v2/textos.md.

const ESTADOS_CERRADOS = ["completado", "cerrado_anticipado"];

/** "22 de septiembre" desde YYYY-MM-DD, sin que la zona del servidor corra el día. */
function fechaLarga(ymd: string): string {
  return new Date(`${ymd}T00:00:00Z`).toLocaleDateString("es", { day: "numeric", month: "long", timeZone: "UTC" });
}

export type NarradorViaje = {
  id: string;
  nombre: string;
  como_le_dicen: string;
  estado: string;
  alerta_silencio: boolean;
};

/** Lo que se lee de `contexto.viaje` (V2; uno anterior trae solo salida y vuelta). */
export type ViajeVista = Partial<CompraViaje> & { salida: string; vuelta: string };

export function HistoriaViaje({
  n,
  rol,
  viaje,
  respuestas,
  fotos,
  usuarioId,
  aprobado,
  historiaCerrada,
  puedeCambiarFechas = false,
  trato = "vos",
  ahora = new Date(),
}: {
  n: NarradorViaje;
  rol: Rol;
  viaje: ViajeVista;
  respuestas: RespuestaVista[];
  fotos: FotoVista[];
  usuarioId: string;
  aprobado: boolean;
  historiaCerrada: boolean;
  /** Antes de que el bot tome el viaje (sin fila en `viajes_v2`) y solo quien viaja o compró. */
  puedeCambiarFechas?: boolean;
  trato?: TratoComprador;
  /** Para probar sin reloj. */
  ahora?: Date;
}) {
  const duena = rol === "duena";
  const tu = trato === "tu";
  const cerrado = ESTADOS_CERRADOS.includes(n.estado);
  const arranco = !["pendiente_pago", "regalo_pendiente", "invitado"].includes(n.estado);
  const zonaCasa = viaje.zonaCasa ?? "UTC";
  const momento = momentoDelViaje(viaje, hoyEn(zonaCasa, ahora));
  const propio = duena && viaje.regalo === undefined;

  // TEXTO PARA NAZA: dónde está el viaje, en una línea.
  let estadoLinea: string;
  if (cerrado || !arranco) estadoLinea = estadoEnHumano(n.estado, duena, trato);
  else if (momento === "antes") estadoLinea = propio ? `${tu ? "Sales" : "Salís"} el ${fechaLarga(viaje.salida)}` : `Sale el ${fechaLarga(viaje.salida)}`;
  else if (momento === "viaje") estadoLinea = propio ? "Estás de viaje" : "Está de viaje";
  else estadoLinea = propio ? `Ya ${tu ? "has vuelto" : "volviste"}. Falta llegar a casa y el álbum` : "Ya volvió. Falta llegar a casa y el álbum";

  // TEXTO PARA NAZA: lo que eligió en la compra.
  const ficha = [
    viaje.zonaViaje ? `${nombreDePais(viaje.zonaViaje)}` : null,
    viaje.formato ? (viaje.formato === "impreso" ? "Libro impreso y en PDF" : "Libro en PDF") : null,
    viaje.fotosAlbum ? `Álbum de ${viaje.fotosAlbum} fotos` : null,
  ].filter(Boolean);

  // Lo contado, en el orden en que llegó (la V2 no tiene «noches» numeradas en la web).
  const contado = [...respuestas].sort((a, b) => (a.recibido_at < b.recibido_at ? -1 : a.recibido_at > b.recibido_at ? 1 : 0));

  return (
    <div className="min-w-0 flex-1">
      {n.alerta_silencio && duena ? (
        <div className="mb-8">
          <BannerAlertaSilencio narradorId={n.id} comoLeDicen={n.como_le_dicen} />
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <p className="pnl-dato">
          Del {fechaLarga(viaje.salida)} al {fechaLarga(viaje.vuelta)}
          {cerrado || !arranco ? "" : ` · ${estadoLinea}`}
        </p>
        {ficha.length > 0 ? <p className="text-[14px] text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">{ficha.join(" · ")}</p> : null}
      </div>

      {/* Terminó el viaje: el paso siguiente (igual que en el Familiar). */}
      {cerrado && (historiaCerrada || aprobado || !PUEDE.cerrarLibro(rol)) ? (
        <div className="mt-8 flex flex-col gap-3">
          <ProximoPaso href={aprobado || !PUEDE.cerrarLibro(rol) ? `/tablero/${n.id}/leer` : `/tablero/${n.id}/libro`}>
            {aprobado
              ? duena ? "Leer el libro del viaje" : "Leer su libro de viaje"
              : PUEDE.cerrarLibro(rol)
                ? tu ? "Dale los últimos retoques y encarga el libro del viaje" : "Dale los últimos retoques y encargá el libro del viaje"
                : "Leer su libro de viaje"}
          </ProximoPaso>
          {historiaCerrada && !aprobado && PUEDE.cerrarLibro(rol) ? (
            <div className="flex items-center gap-3 text-[13px] text-[var(--texto-menor)]">
              <span>Edición cerrada. Las fotos se siguen sumando en Encargar libro.</span>
              <ReabrirEdicion narradorId={n.id} />
            </div>
          ) : null}
        </div>
      ) : null}

      <section aria-labelledby="lo-contado" className="mt-10">
        <div className="border-b border-[var(--texto)] pb-4">
          <h2 id="lo-contado" className="text-2xl font-medium leading-none [font-family:var(--fuente-titulo)]">
            {/* TEXTO PARA NAZA */}
            Lo contado
          </h2>
        </div>
        <GaleriaCapitulo fotos={fotos} usuarioId={usuarioId} esDuena={duena} />
        {contado.length > 0 ? (
          <div className="mt-6 flex flex-col gap-4">
            {contado.map((r) => (
              <Contado key={r.id} respuesta={r} />
            ))}
          </div>
        ) : (
          <p className="mt-5 text-[15px] leading-relaxed text-[var(--texto-suave)]">
            {/* TEXTO PARA NAZA */}
            {`${propio ? "Lo que cuentes" : "Lo que cuente"} por WhatsApp aparece ${tu ? "aquí" : "acá"}.`}
          </p>
        )}
      </section>

      {puedeCambiarFechas && !cerrado ? (
        <section className="mt-16 border-t border-[var(--linea)] pt-10">
          {/* TEXTO PARA NAZA */}
          <Etiqueta>Las fechas del viaje</Etiqueta>
          <div className="mt-6">
            <FechasDelViaje narradorId={n.id} salida={viaje.salida} vuelta={viaje.vuelta} trato={trato} />
          </div>
        </section>
      ) : null}
    </div>
  );
}

/** Un mensaje contado: la fecha, el texto y el audio. */
function Contado({ respuesta: r }: { respuesta: RespuestaVista }) {
  const texto = (r.transcripcion ?? r.texto_directo ?? "").trim();
  const fecha = fechaLarga(r.recibido_at.slice(0, 10));
  return (
    <article className="grid grid-cols-1 items-start gap-3 rounded-xl border border-[var(--linea)] p-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:gap-4 sm:px-5 sm:py-5">
      <div className="flex min-w-0 flex-col gap-2.5">
        <h3 className="text-[16.5px] font-medium leading-[1.4] [font-family:var(--fuente-titulo)]">{fecha}</h3>
        {texto ? (
          <p className="text-[15.5px] leading-[1.7] text-[var(--texto-suave)] [font-family:var(--fuente-cuerpo)] font-light">{texto}</p>
        ) : r.audio_path ? (
          <p className="text-sm text-[var(--texto-menor)]">Estamos transcribiendo el audio…</p>
        ) : null}
      </div>
      {r.audio_path ? <ReproductorRespuesta src={`/api/audio/${r.id}`} duracion={r.duracion_segundos} etiqueta={fecha} /> : null}
    </article>
  );
}

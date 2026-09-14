import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { historiaAccesible, PUEDE } from "@/lib/panel";
import { productosDelPedido, NOMBRE_VOZ } from "@/lib/productos";
import { ReproductorRespuesta } from "../../reproductor";
import { EstadoError, Etiqueta, ProximoPaso, Tarjeta, Titulo } from "../../ui";
import { ConRiel } from "../../riel";

// El lector (docs/panel-usuario.md §15.1): el libro terminado se LEE y se
// ESCUCHA acá. Nada se descarga — es lo que hace que el impreso sea "el que
// queda en la repisa". El PDF se muestra adentro de la página; el audiolibro
// suena capítulo por capítulo con el reproductor de la casa.
//
// ⚠️ Pendiente de Naza (3t.8): reemplazar el visor del PDF por el HTML
// paginado de la fábrica. Esta pantalla ya está lista para recibirlo.

type AudiolibroPaths = { capitulos: string[]; bonus?: string; completo: string };
type Pedido = { id: string; estado: string; extras: unknown; audiolibro_paths: AudiolibroPaths | null; libro_pdf_path: string | null };

export default async function PaginaLeer({ params }: PageProps<"/tablero/[narradorId]/leer">) {
  const { narradorId } = await params;

  const supabase = await crearClienteSesion();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const admin = crearClienteServidor();
  const { historia, error } = await historiaAccesible(admin, user, narradorId);
  if (error) {
    console.error("tablero/leer: fallo el acceso", error);
    return <EstadoError />;
  }
  if (!historia || !PUEDE.descargar(historia.rol)) notFound();
  const n = historia.narrador;

  const { data: pedidosData, error: errorPedidos } = await admin
    .from("pedidos")
    .select("id, estado, extras, audiolibro_paths, libro_pdf_path")
    .eq("narrador_id", n.id)
    .eq("familia_id", n.familia_id)
    .order("created_at", { ascending: true });
  if (errorPedidos) {
    console.error("tablero/leer: fallo la busqueda de pedidos", errorPedidos);
    return <EstadoError />;
  }
  const pedidos = (pedidosData as Pedido[] | null) ?? [];
  const validos = pedidos.filter((p) => p.estado !== "fallido" && p.estado !== "pendiente");
  const compro = {
    pdf: validos.some((p) => productosDelPedido(p.extras).pdf),
    audiolibro: validos.map((p) => productosDelPedido(p.extras).audiolibro).find((v) => v !== null) ?? null,
  };
  const entregado = validos.find((p) => p.estado === "entregado") ?? null;
  const enFabricacion = !entregado && validos.some((p) => p.estado === "pagado" || p.estado === "generando");

  const cabecera = (
    <>
      <Etiqueta>Su libro · La historia de {n.nombre}</Etiqueta>
      <div className="mt-1">
        <Titulo>Leer y escuchar</Titulo>
      </div>
    </>
  );

  if (validos.length === 0) {
    return (
      <ConRiel admin={admin} user={user} actual={n.id} sufijo="/leer">
        {cabecera}
        <Tarjeta className="mt-6">
          <p className="text-[15px] leading-relaxed text-[var(--texto-suave)]">No encontramos ningún pedido de esta historia.</p>
        </Tarjeta>
        <div className="mt-8"><ProximoPaso href={`/tablero/${n.id}/libro`}>Ir a Encargar libro</ProximoPaso></div>
      </ConRiel>
    );
  }

  if (!entregado) {
    return (
      <ConRiel admin={admin} user={user} actual={n.id} sufijo="/leer">
        {/* Nadie se queda mirando esta pantalla — se refresca sola cada 60 s. */}
        {enFabricacion ? <meta httpEquiv="refresh" content="60" /> : null}
        {cabecera}
        <Tarjeta className="mt-6">
          <p className="text-[16px] leading-relaxed text-[var(--texto-suave)]">
            {enFabricacion
              ? "Estamos armando el libro. Tarda unos minutos: vuelve a esta página en un rato."
              : "Cuando el libro esté cerrado y producido, se lee y se escucha acá."}
          </p>
        </Tarjeta>
        <div className="mt-8"><ProximoPaso href={`/tablero/${n.id}/libro`}>Ver el estado en Encargar libro</ProximoPaso></div>
      </ConRiel>
    );
  }

  const capitulos = entregado.audiolibro_paths?.capitulos ?? [];
  const tieneAudio = compro.audiolibro !== null && Boolean(entregado.audiolibro_paths?.completo || capitulos.length > 0);
  const tienePdf = compro.pdf && Boolean(entregado.libro_pdf_path);

  return (
    <ConRiel admin={admin} user={user} actual={n.id} sufijo="/leer">
      {cabecera}
      <p className="mt-2 text-[15px] text-[var(--texto-suave)]">Queda acá para siempre. Volvé cuando quieras.</p>

      {/* ── El libro ─────────────────────────────────────────────────── */}
      <section className="mt-10" aria-labelledby="leer-libro">
        <div className="flex items-end justify-between gap-4 border-b border-[var(--texto)] pb-4">
          <h2 id="leer-libro" className="text-2xl font-medium leading-none [font-family:var(--fuente-titulo)]">El libro</h2>
          {tienePdf ? <span className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.18em]">se lee acá</span> : null}
        </div>
        {tienePdf ? (
          <div className="mt-6 overflow-hidden rounded-xl border border-[var(--linea)] bg-[var(--relieve)]">
            <iframe
              src={`/api/libro/pdf?narrador=${n.id}#toolbar=0&navpanes=0&view=FitH`}
              title={`El libro de ${n.nombre}`}
              className="h-[75dvh] w-full"
            />
          </div>
        ) : (
          <Tarjeta className="mt-6">
            <p className="text-[15px] leading-relaxed text-[var(--texto-suave)]">
              {compro.pdf ? "El libro todavía no está listo para leer." : "No compraste el libro en PDF. Se puede sumar desde Encargar libro."}
            </p>
            {!compro.pdf ? <div className="mt-4"><Link href={`/tablero/${n.id}/libro`} className="text-sm text-[var(--acento)] underline decoration-[var(--linea-fuerte)] underline-offset-4 [font-family:var(--fuente-micro)]">Sumar el libro en PDF</Link></div> : null}
          </Tarjeta>
        )}
      </section>

      {/* ── El audiolibro ────────────────────────────────────────────── */}
      <section className="mt-14" aria-labelledby="leer-audio">
        <div className="flex items-end justify-between gap-4 border-b border-[var(--texto)] pb-4">
          <h2 id="leer-audio" className="text-2xl font-medium leading-none [font-family:var(--fuente-titulo)]">El audiolibro</h2>
          {tieneAudio && compro.audiolibro ? (
            <span className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.18em]">{NOMBRE_VOZ[compro.audiolibro]}</span>
          ) : null}
        </div>
        {tieneAudio ? (
          <div className="mt-6 flex flex-col gap-4">
            {entregado.audiolibro_paths?.completo ? (
              <div className="rounded-xl border border-[var(--texto)] p-4 sm:p-5">
                <p className="mb-3 text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.18em]">Completo</p>
                <ReproductorRespuesta src={`/api/libro/audio/completo?narrador=${n.id}`} etiqueta="el audiolibro completo" />
              </div>
            ) : null}
            {capitulos.map((_ruta, i) => (
              <div key={i} className="flex flex-col gap-3 rounded-xl border border-[var(--linea)] p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
                <p className="w-28 shrink-0 text-[15px] [font-family:var(--fuente-titulo)]">Capítulo {i + 1}</p>
                <div className="min-w-0 flex-1">
                  <ReproductorRespuesta src={`/api/libro/audio/${i}?narrador=${n.id}`} etiqueta={`capítulo ${i + 1}`} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Tarjeta className="mt-6">
            <p className="text-[15px] leading-relaxed text-[var(--texto-suave)]">
              {compro.audiolibro ? "El audiolibro todavía no está listo." : "No compraste el audiolibro. Se puede sumar desde Encargar libro: con su voz o con un narrador."}
            </p>
            {!compro.audiolibro ? <div className="mt-4"><Link href={`/tablero/${n.id}/libro`} className="text-sm text-[var(--acento)] underline decoration-[var(--linea-fuerte)] underline-offset-4 [font-family:var(--fuente-micro)]">Sumar el audiolibro</Link></div> : null}
          </Tarjeta>
        )}
      </section>
    </ConRiel>
  );
}

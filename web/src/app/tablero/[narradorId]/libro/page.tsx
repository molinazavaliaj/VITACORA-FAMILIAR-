import { notFound, redirect } from "next/navigation";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { historiaAccesible, PUEDE } from "@/lib/panel";
import { extrasDisponibles, productosDelPedido, NOMBRE_VOZ, type ProductosDelPedido } from "@/lib/productos";
import { obtenerPrecio, obtenerPrecioAudiolibro } from "@/lib/precios";
import { propuestaPorDefecto, type Edicion } from "@/lib/edicion";
import { Contenedor, EstadoError, Etiqueta, ProximoPaso, Tarjeta, Titulo, fechaCorta } from "../../ui";
import { Wizard, type RespuestaResumen } from "./wizard";
import { LibroMiniatura, type LibroDatos } from "./miniatura";
import { FotosDelLibro, type FotoElegible } from "./fotos-del-libro";
import { Extras, type PrecioExtra } from "./extras";

// Encargar libro (docs/panel-usuario.md §7 y §15.4): arriba "Su libro" y el
// estado; el libro en miniatura para hojear cómo va quedando; Tapa ·
// Contratapa · Marco; al terminar, los últimos retoques y el cierre (solo
// dueña); y siempre, abajo, lo comprado y lo que se puede sumar.

type Pedido = {
  id: string;
  familia_id: string;
  estado: string;
  extras: unknown; // lo normaliza productosDelPedido (pedidos viejos y nuevos)
  created_at: string;
};

const NOMBRE_ESTADO_PEDIDO: Record<string, string> = {
  pendiente: "esperando el pago",
  pagado: "pagado",
  generando: "armando el libro",
  entregado: "entregado",
  fallido: "el pago no se completó",
};

export default async function PaginaLibro({ params }: PageProps<"/tablero/[narradorId]/libro">) {
  const { narradorId } = await params;

  const supabase = await crearClienteSesion();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const admin = crearClienteServidor();
  const { historia, error } = await historiaAccesible(admin, user, narradorId);
  if (error) return <EstadoError />;
  if (!historia) notFound();
  const { narrador: n, rol } = historia;

  const terminado = ["completado", "cerrado_anticipado"].includes(n.estado);

  const [{ data: filaN }, { data: familiaDuena }, { data: pedidos }] = await Promise.all([
    admin.from("narradores").select("edicion, libro_aprobado_at").eq("id", n.id).maybeSingle(),
    admin.from("familias").select("region").eq("id", n.familia_id).maybeSingle(),
    admin.from("pedidos").select("id, familia_id, estado, extras, created_at").eq("narrador_id", n.id).order("created_at", { ascending: true }),
  ]);
  const edicionGuardada = ((filaN as { edicion?: Edicion | null } | null)?.edicion) ?? {};
  const libroAprobadoAt = (filaN as { libro_aprobado_at?: string | null } | null)?.libro_aprobado_at ?? null;
  const region = ((familiaDuena as { region?: "ES" | "AR" } | null)?.region) ?? "AR";
  const { moneda } = obtenerPrecio(region);
  const todosLosPedidos = (pedidos as Pedido[] | null) ?? [];
  // Cada uno ve sus pedidos; la dueña ve los suyos (los de los primos son de los primos).
  const misPedidos = todosLosPedidos.filter((p) => rol === "duena" ? p.familia_id === n.familia_id : false);
  const pedidoBase = rol === "duena" ? todosLosPedidos.find((p) => p.familia_id === n.familia_id) ?? null : null;
  // Lo que ya tiene, sumando todos sus pedidos que no fallaron (13/09: tres productos).
  const productosPagados = misPedidos.filter((p) => p.estado !== "fallido").map((p) => productosDelPedido(p.extras));
  const yaTiene = {
    pdf: productosPagados.some((p) => p.pdf),
    audiolibro: productosPagados.some((p) => p.audiolibro !== null),
    impreso: productosPagados.some((p) => p.impreso !== null),
  };
  const yaTieneImpreso = yaTiene.impreso;

  const extras: PrecioExtra[] = extrasDisponibles(region).map((e) => ({ id: e.id, nombre: e.nombre, detalle: e.detalle, precio: e.precio }));
  const precioAudiolibro = obtenerPrecioAudiolibro(region);
  const nube = { pdf: obtenerPrecio(region).monto, audiolibro: precioAudiolibro };

  // ── Invitado: solo su copia ─────────────────────────────────────────
  if (!PUEDE.verLoQuePago(rol)) {
    return (
      <Contenedor>
        <Etiqueta>Encargar libro · La historia de {n.nombre}</Etiqueta>
        <div className="mt-1">
          <Titulo>Tu copia</Titulo>
        </div>
        <Tarjeta className="mt-6">
          <p className="text-[16px] leading-relaxed text-[var(--texto-suave)]">
            {libroAprobadoAt
              ? "El libro está cerrado y en producción. Podés pedir tu copia impresa con envío a tu casa."
              : "Cuando la historia termine y el libro esté cerrado, tu copia se imprime con la versión final. Podés encargarla desde ahora."}
          </p>
        </Tarjeta>
        <div className="mt-10">
          <Extras narradorId={n.id} moneda={moneda} region={region} extras={extras} yaTieneImpreso={false} titulo="Tu copia y tus marcos" />
        </div>
      </Contenedor>
    );
  }

  // ── Dueña ───────────────────────────────────────────────────────────
  // Todo lo que hace falta para el libro en miniatura, las tres fotos y el
  // wizard: el guion, lo contado, las fotos, la edición guardada.
  const [{ data: preguntas }, { data: respuestas }, { data: fotosData }, { data: paquete }] = await Promise.all([
    admin.from("preguntas").select("orden, texto, capitulo").eq("narrador_id", n.id),
    admin.from("respuestas").select("id, pregunta_orden, transcripcion, texto_directo, es_repregunta").eq("narrador_id", n.id).order("pregunta_orden"),
    admin.from("fotos").select("id, epigrafe, capitulo, principal, orden, ancho_px, alto_px").eq("narrador_id", n.id).order("principal", { ascending: false }).order("orden"),
    admin.storage.from("audios").list(`${n.id}/paquete`),
  ]);
  // Sin guion propio (anterior a la migración), se usa la plantilla global.
  let guion = (preguntas as { orden: number; texto: string; capitulo: string }[] | null) ?? [];
  if (guion.length === 0) {
    const { data: globales } = await admin.from("preguntas").select("orden, texto, capitulo").is("narrador_id", null);
    guion = (globales as typeof guion | null) ?? [];
  }
  guion.sort((a, b) => a.orden - b.orden);
  const porOrden = new Map(guion.map((p) => [p.orden, p]));
  const capitulos = [...new Set(guion.map((p) => p.capitulo))];
  const fotos = (fotosData as (FotoElegible & { principal: boolean })[] | null) ?? [];

  const propuesta = propuestaPorDefecto(n.nombre, n.nombre, capitulos);
  const edicion = {
    titulo: edicionGuardada.titulo ?? propuesta.titulo,
    subtitulo: edicionGuardada.subtitulo ?? propuesta.subtitulo,
    portadaFotoId: edicionGuardada.portadaFotoId ?? null,
    contratapaFotoId: edicionGuardada.contratapaFotoId ?? null,
    marcoFotoId: edicionGuardada.marcoFotoId ?? null,
    ordenCapitulos: edicionGuardada.ordenCapitulos?.length ? edicionGuardada.ordenCapitulos : capitulos,
    excluidas: edicionGuardada.excluidas ?? [],
    correcciones: edicionGuardada.correcciones ?? "",
  };

  const contestadas = (((respuestas as { id: string; pregunta_orden: number; transcripcion: string | null; texto_directo: string | null; es_repregunta: boolean }[] | null) ?? []))
    .filter((r) => !r.es_repregunta && !edicion.excluidas.includes(r.id));
  const resumen: RespuestaResumen[] = contestadas.map((r) => {
    const p = porOrden.get(r.pregunta_orden);
    const texto = (r.transcripcion ?? r.texto_directo ?? "").trim();
    return { id: r.id, orden: r.pregunta_orden, capitulo: p?.capitulo ?? "Otros", pregunta: p?.texto ?? `Pregunta ${r.pregunta_orden}`, fragmento: texto.slice(0, 140) + (texto.length > 140 ? "…" : "") };
  });

  // El libro en miniatura: capítulos en el orden elegido, con sus fotos y lo contado.
  const datosLibro: LibroDatos = {
    titulo: edicion.titulo,
    subtitulo: edicion.subtitulo,
    portadaFotoId: edicion.portadaFotoId,
    contratapaFotoId: edicion.contratapaFotoId,
    capitulos: edicion.ordenCapitulos.map((nombre) => ({
      nombre,
      fotos: fotos.filter((f) => f.capitulo === nombre).map((f) => ({ id: f.id, epigrafe: f.epigrafe, principal: f.principal })),
      textos: contestadas
        .filter((r) => porOrden.get(r.pregunta_orden)?.capitulo === nombre)
        .map((r) => ({ pregunta: porOrden.get(r.pregunta_orden)?.texto ?? "", texto: (r.transcripcion ?? r.texto_directo ?? "").trim() }))
        .filter((t) => t.texto.length > 0),
    })),
  };
  const nombresRevisados = (paquete ?? []).some((a) => a.name === "nombres.json");

  let estado: React.ReactNode;
  if (!terminado) {
    estado = (
      <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-[var(--texto-suave)]">
        Así va quedando, con lo que contó hasta hoy. Cuando termine, te avisamos por mail para que le des los últimos
        retoques y lo cierres. Recién ahí se produce.
      </p>
    );
  } else if (libroAprobadoAt) {
    estado = (
      <Tarjeta className="mt-6 border-[var(--texto)]">
        <Etiqueta>Cerrado el {fechaCorta(libroAprobadoAt)}</Etiqueta>
        <p className="mt-3 text-[16px] leading-relaxed text-[var(--texto-suave)]">
          El libro de {n.nombre} está en producción. Te avisamos por mail cuando esté listo.
        </p>
        <div className="mt-5">
          <ProximoPaso href={`/tablero/${n.id}/leer`}>Leer el libro y escuchar el audiolibro</ProximoPaso>
        </div>
      </Tarjeta>
    );
  } else {
    estado = (
      <Tarjeta className="mt-6 border-[var(--acento)]">
        <p className="text-[16px] leading-relaxed text-[var(--texto-suave)]">
          <strong className="font-medium text-[var(--texto)]">{n.nombre} terminó de contar su historia.</strong> Hojeá cómo
          quedó, elegí las fotos, dale los últimos retoques — o dejá nuestra propuesta tal cual — y cerrá el libro. Recién
          ahí se produce.
        </p>
        <div className="mt-4">
          <a href="#cerrar" className="text-[15px] text-[var(--acento)] underline decoration-[var(--linea-fuerte)] underline-offset-4 [font-family:var(--fuente-micro)]">Ir a los últimos retoques ↓</a>
        </div>
      </Tarjeta>
    );
  }

  return (
    <Contenedor ancho="max-w-5xl">
      <Etiqueta>Encargar libro · La historia de {n.nombre}</Etiqueta>
      <div className="mt-1">
        <Titulo>Su libro</Titulo>
      </div>
      {estado}

      {/* ── El libro en miniatura ──────────────────────────────────────── */}
      <section className="mt-12" aria-label="El libro en miniatura">
        <LibroMiniatura datos={datosLibro} />
      </section>

      {/* ── Tapa · Contratapa · Marco ──────────────────────────────────── */}
      <section className="mt-12">
        <div className="flex items-end justify-between gap-4 border-b border-[var(--linea)] pb-4">
          <h2 className="text-2xl font-medium leading-none [font-family:var(--fuente-titulo)]">Las fotos del libro</h2>
          <span className="shrink-0 text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.18em]">tapa · contratapa · marco</span>
        </div>
        <div className="mt-6">
          <FotosDelLibro
            narradorId={n.id}
            fotos={fotos.map(({ id, epigrafe, capitulo, ancho_px, alto_px }) => ({ id, epigrafe, capitulo, ancho_px, alto_px }))}
            elegidas={{ portadaFotoId: edicion.portadaFotoId, contratapaFotoId: edicion.contratapaFotoId, marcoFotoId: edicion.marcoFotoId }}
            editable={!libroAprobadoAt}
          />
        </div>
      </section>

      {/* ── Los últimos retoques y el cierre (solo al terminar) ──────────── */}
      {terminado && !libroAprobadoAt ? (
        <section id="cerrar" className="mt-14 scroll-mt-20 border-t border-[var(--linea)] pt-10">
          <Etiqueta>Los últimos retoques</Etiqueta>
          <Wizard
            narradorId={n.id}
            nombre={n.nombre}
            edicion={edicion}
            capitulos={capitulos}
            respuestas={resumen}
            fotos={fotos.map(({ id, epigrafe, capitulo }) => ({ id, epigrafe, capitulo }))}
            nombresRevisados={nombresRevisados}
          />
        </section>
      ) : null}

      <section className="mt-14 border-t border-[var(--linea)] pt-10">
        <Etiqueta>Lo que compraste</Etiqueta>
        {pedidoBase ? (
          <Tarjeta className="mt-4">
            <ul className="flex flex-col gap-2 text-[15px]">
              {misPedidos.flatMap((p) => {
                const q: ProductosDelPedido = productosDelPedido(p.extras);
                const estado = ` · ${NOMBRE_ESTADO_PEDIDO[p.estado] ?? p.estado}`;
                const filas: React.ReactNode[] = [];
                const fila = (clave: string, texto: string) => (
                  <li key={`${p.id}-${clave}`} className="flex justify-between gap-4">
                    <span>{texto}</span>
                    <span className="text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">{estado.slice(3)}</span>
                  </li>
                );
                if (q.pdf) filas.push(fila("pdf", "El libro en PDF, para leer acá"));
                if (q.audiolibro) filas.push(fila("audio", `El audiolibro, ${NOMBRE_VOZ[q.audiolibro]}`));
                if (q.impreso) filas.push(fila("impreso", `${q.copias > 1 ? `${q.copias} copias impresas` : "El libro impreso"}${q.impreso === "color" ? " a color" : " en blanco y negro"}`));
                if (q.marcos) filas.push(fila("marcos", `${q.marcos} marco${q.marcos > 1 ? "s" : ""} con su voz`));
                return filas;
              })}
            </ul>
          </Tarjeta>
        ) : (
          <p className="mt-4 text-sm text-[var(--texto-menor)]">No encontramos el pedido de esta historia.</p>
        )}
      </section>

      <section className="mt-14 border-t border-[var(--linea)] pt-10">
        <Extras narradorId={n.id} moneda={moneda} region={region} extras={extras} yaTieneImpreso={yaTieneImpreso} nube={nube} yaTiene={yaTiene} />
      </section>
    </Contenedor>
  );
}

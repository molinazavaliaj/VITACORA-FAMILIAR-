import { notFound, redirect } from "next/navigation";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { historiaAccesible, PUEDE } from "@/lib/panel";
import { extrasDisponibles } from "@/lib/productos";
import { obtenerPrecio } from "@/lib/precios";
import { propuestaPorDefecto, type Edicion } from "@/lib/edicion";
import { Contenedor, EstadoError, Etiqueta, ProximoPaso, Tarjeta, Titulo, fechaCorta } from "../../ui";
import { Wizard, type FotoResumen, type RespuestaResumen } from "./wizard";
import { Extras, type PrecioExtra } from "./extras";

// Encargar libro (docs/panel-usuario.md §7). Tres momentos:
//   - la entrevista sigue → qué compró y qué va a pasar
//   - terminó y no cerró → la edición final en 4 pasos (solo dueña)
//   - cerrado → se está produciendo / listo, y las descargas
// Y siempre, abajo, los extras: copias con descuento, marcos, color.

type Pedido = {
  id: string;
  familia_id: string;
  estado: string;
  extras: { impreso?: "bn" | "color" | null; marcos?: number; copias?: number } | null;
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
  const yaTieneImpreso = misPedidos.some((p) => p.extras?.impreso && p.estado !== "fallido");

  const extras: PrecioExtra[] = extrasDisponibles(region).map((e) => ({ id: e.id, nombre: e.nombre, detalle: e.detalle, precio: e.precio }));

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
  let cuerpo: React.ReactNode;

  if (!terminado) {
    cuerpo = (
      <Tarjeta className="mt-6">
        <p className="text-[16px] leading-relaxed text-[var(--texto-suave)]">
          Cuando termine de contar su historia, te avisamos por mail para que le des los últimos
          retoques y lo cierres. Recién ahí se produce.
        </p>
      </Tarjeta>
    );
  } else if (libroAprobadoAt) {
    cuerpo = (
      <Tarjeta className="mt-6 border-[var(--texto)]">
        <Etiqueta>Cerrado el {fechaCorta(libroAprobadoAt)}</Etiqueta>
        <p className="mt-3 text-[16px] leading-relaxed text-[var(--texto-suave)]">
          El libro de {n.nombre} está en producción. Te avisamos por mail cuando esté listo.
        </p>
        <div className="mt-5">
          <ProximoPaso href={`/tablero/${n.id}/descarga`}>Ver el libro y las descargas</ProximoPaso>
        </div>
      </Tarjeta>
    );
  } else {
    // La edición final: lo que hace falta para el wizard.
    const [{ data: preguntas }, { data: respuestas }, { data: fotos }, { data: paquete }] = await Promise.all([
      admin.from("preguntas").select("orden, texto, capitulo").eq("narrador_id", n.id),
      admin.from("respuestas").select("id, pregunta_orden, transcripcion, texto_directo, es_repregunta").eq("narrador_id", n.id).order("pregunta_orden"),
      admin.from("fotos").select("id, epigrafe, capitulo").eq("narrador_id", n.id).order("principal", { ascending: false }),
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

    const resumen: RespuestaResumen[] = (((respuestas as { id: string; pregunta_orden: number; transcripcion: string | null; texto_directo: string | null; es_repregunta: boolean }[] | null) ?? []))
      .filter((r) => !r.es_repregunta)
      .map((r) => {
        const p = porOrden.get(r.pregunta_orden);
        const texto = (r.transcripcion ?? r.texto_directo ?? "").trim();
        return { id: r.id, orden: r.pregunta_orden, capitulo: p?.capitulo ?? "Otros", pregunta: p?.texto ?? `Pregunta ${r.pregunta_orden}`, fragmento: texto.slice(0, 140) + (texto.length > 140 ? "…" : "") };
      });

    const propuesta = propuestaPorDefecto(n.nombre, n.nombre, capitulos);
    const edicion = {
      titulo: edicionGuardada.titulo ?? propuesta.titulo,
      subtitulo: edicionGuardada.subtitulo ?? propuesta.subtitulo,
      portadaFotoId: edicionGuardada.portadaFotoId ?? null,
      ordenCapitulos: edicionGuardada.ordenCapitulos?.length ? edicionGuardada.ordenCapitulos : capitulos,
      excluidas: edicionGuardada.excluidas ?? [],
      correcciones: edicionGuardada.correcciones ?? "",
    };
    const nombresRevisados = (paquete ?? []).some((a) => a.name === "nombres.json");

    cuerpo = (
      <>
        <Tarjeta className="mt-6 border-[var(--acento)]">
          <p className="text-[16px] leading-relaxed text-[var(--texto-suave)]">
            <strong className="font-medium text-[var(--texto)]">{n.nombre} terminó de contar su historia.</strong> Dale los
            últimos retoques — o dejá nuestra propuesta tal cual — y cerrá el libro. Recién ahí se produce.
          </p>
        </Tarjeta>
        <Wizard
          narradorId={n.id}
          nombre={n.nombre}
          edicion={edicion}
          capitulos={capitulos}
          respuestas={resumen}
          fotos={(fotos as FotoResumen[] | null) ?? []}
          nombresRevisados={nombresRevisados}
        />
      </>
    );
  }

  return (
    <Contenedor>
      <Etiqueta>Encargar libro · La historia de {n.nombre}</Etiqueta>
      <div className="mt-1">
        <Titulo>Su libro</Titulo>
      </div>

      {cuerpo}

      <section className="mt-14 border-t border-[var(--linea)] pt-10">
        <Etiqueta>Lo que compraste</Etiqueta>
        {pedidoBase ? (
          <Tarjeta className="mt-4">
            <ul className="flex flex-col gap-2 text-[15px]">
              <li className="flex justify-between gap-4">
                <span>El libro en PDF y el audiolibro con su voz</span>
                <span className="text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">{NOMBRE_ESTADO_PEDIDO[pedidoBase.estado] ?? pedidoBase.estado}</span>
              </li>
              {misPedidos.flatMap((p) => {
                const filas: React.ReactNode[] = [];
                if (p.extras?.impreso) {
                  const copias = p.extras.copias ?? 1;
                  filas.push(<li key={`${p.id}-i`}>{copias > 1 ? `${copias} copias impresas` : "El libro impreso"}{p.extras.impreso === "color" ? " a color" : " en blanco y negro"}{p.id !== pedidoBase.id ? ` · ${NOMBRE_ESTADO_PEDIDO[p.estado] ?? p.estado}` : ""}</li>);
                }
                if (p.extras?.marcos) {
                  filas.push(<li key={`${p.id}-m`}>{p.extras.marcos} marco{p.extras.marcos > 1 ? "s" : ""} con su voz{p.id !== pedidoBase.id ? ` · ${NOMBRE_ESTADO_PEDIDO[p.estado] ?? p.estado}` : ""}</li>);
                }
                return filas;
              })}
            </ul>
          </Tarjeta>
        ) : (
          <p className="mt-4 text-sm text-[var(--texto-menor)]">No encontramos el pedido de esta historia.</p>
        )}
      </section>

      <section className="mt-14 border-t border-[var(--linea)] pt-10">
        <Extras narradorId={n.id} moneda={moneda} region={region} extras={extras} yaTieneImpreso={yaTieneImpreso} />
      </section>
    </Contenedor>
  );
}

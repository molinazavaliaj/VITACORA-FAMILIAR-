import { notFound, redirect } from "next/navigation";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { historiaAccesible, PUEDE } from "@/lib/panel";
import { Contenedor, EstadoError, Etiqueta, ProximoPaso, Tarjeta, Titulo } from "../../ui";

// Encargar libro (docs/panel-usuario.md §7). HOY: lo que compró y en qué
// estado está el libro. El wizard de edición final, la aprobación y los
// extras con descuento vienen en los siguientes pasos de construcción.

type Pedido = {
  id: string;
  estado: string;
  extras: { impreso?: "bn" | "color" | null; marcos?: number } | null;
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

  const cerrado = ["completado", "cerrado_anticipado"].includes(n.estado);

  // Los invitados no ven lo que pagó la dueña ni deciden sobre el libro:
  // para ellos esta sección es solo "comprar mi copia".
  if (!PUEDE.verLoQuePago(rol)) {
    return (
      <Contenedor>
        <Etiqueta>Encargar libro · La historia de {n.nombre}</Etiqueta>
        <div className="mt-1">
          <Titulo>Tu copia</Titulo>
        </div>
        <Tarjeta className="mt-6">
          <p className="text-[16px] leading-relaxed text-[var(--texto-suave)]">
            {cerrado
              ? "El libro está terminado. Pronto vas a poder pedir tu copia impresa desde acá, con envío a tu casa."
              : "Cuando la historia termine y el libro esté cerrado, vas a poder pedir tu copia impresa desde acá."}
          </p>
        </Tarjeta>
      </Contenedor>
    );
  }

  const { data: pedidos } = await admin
    .from("pedidos")
    .select("id, estado, extras, created_at")
    .eq("narrador_id", n.id)
    .order("created_at", { ascending: true });
  const lista = (pedidos as Pedido[] | null) ?? [];
  const principal = lista[0];

  return (
    <Contenedor>
      <Etiqueta>Encargar libro · La historia de {n.nombre}</Etiqueta>
      <div className="mt-1">
        <Titulo>Su libro</Titulo>
      </div>

      {cerrado ? (
        <div className="mt-6">
          <ProximoPaso href={`/tablero/${n.id}/nombres`}>
            Ya terminó de contar — empezá los últimos retoques: revisá los nombres
          </ProximoPaso>
          <p className="mt-3 text-sm text-[var(--texto-menor)]">
            Pronto: portada, orden de capítulos, qué dejar afuera, y el botón de cerrar el libro.
          </p>
        </div>
      ) : (
        <Tarjeta className="mt-6">
          <p className="text-[16px] leading-relaxed text-[var(--texto-suave)]">
            Cuando termine de contar su historia, te avisamos por mail para que le des los últimos
            retoques y lo cierres. Recién ahí se produce.
          </p>
        </Tarjeta>
      )}

      <section className="mt-10">
        <Etiqueta>Lo que compraste</Etiqueta>
        {principal ? (
          <Tarjeta className="mt-4">
            <ul className="flex flex-col gap-2 text-[15px]">
              <li className="flex justify-between gap-4">
                <span>El libro en PDF y el audiolibro con su voz</span>
                <span className="text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
                  {NOMBRE_ESTADO_PEDIDO[principal.estado] ?? principal.estado}
                </span>
              </li>
              {principal.extras?.impreso ? (
                <li>El libro impreso{principal.extras.impreso === "color" ? " a color" : " en blanco y negro"}</li>
              ) : null}
              {principal.extras?.marcos ? (
                <li>
                  {principal.extras.marcos} marco{principal.extras.marcos > 1 ? "s" : ""} con su voz
                </li>
              ) : null}
            </ul>
          </Tarjeta>
        ) : (
          <p className="mt-4 text-sm text-[var(--texto-menor)]">No encontramos el pedido de esta historia.</p>
        )}
      </section>

      <section className="mt-10">
        <Etiqueta>Sumar</Etiqueta>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--texto-suave)]">
          Pronto: el libro impreso si todavía no lo pediste, pasar a color, marcos para cada primo y
          copias con descuento por cantidad.
        </p>
      </section>
    </Contenedor>
  );
}

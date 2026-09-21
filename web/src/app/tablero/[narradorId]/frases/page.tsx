import { notFound, redirect } from "next/navigation";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { esPropia, historiaAccesible, PUEDE } from "@/lib/panel";
import { leerFrases, resumenDeCorte } from "@/lib/frases";
import { firmarTokenVoz } from "@/lib/token-libro";
import { EstadoError, Etiqueta, ProximoPaso, Tarjeta, Titulo } from "../../ui";
import { ConRiel } from "../../riel";
import { SelectorDeFrases } from "./acciones";

// «Su voz» en el panel (spec 2026-09-20-su-voz-design, "El panel de la
// familia"): las mejores frases del narrador, en su voz real, elegidas por el
// biógrafo leyendo el libro. La familia las escucha, saca, reemplaza por otra
// candidata y reordena; si nadie toca nada, va lo del biógrafo. Es hermana de
// "nombres": revisar lo que propuso el sistema. Leen dueña e invitados; cambia
// la dueña. La selección se cierra cuando aprieta "imprimir" (o al confirmar
// acá), con recordatorio a los 15 días.

export default async function PaginaFrases({ params }: PageProps<"/tablero/[narradorId]/frases">) {
  const { narradorId } = await params;

  const supabase = await crearClienteSesion();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const admin = crearClienteServidor();
  const { historia, error } = await historiaAccesible(admin, user, narradorId);
  if (error) {
    console.error("tablero/frases: fallo el acceso", error);
    return <EstadoError />;
  }
  if (!historia || !PUEDE.verHistoriaCompleta(historia.rol)) notFound();
  const n = historia.narrador;
  const propia = esPropia(n);
  const puedeEditar = PUEDE.cerrarLibro(historia.rol);

  const [frases, { data: cierre }] = await Promise.all([
    leerFrases(admin, n.id),
    admin.from("narradores").select("libro_aprobado_at").eq("id", n.id).maybeSingle(),
  ]);
  const libroCerrado = Boolean((cierre as { libro_aprobado_at?: string | null } | null)?.libro_aprobado_at);

  const cabecera = (
    <>
      <Etiqueta>Su voz · {propia ? "Tu historia" : `La historia de ${n.nombre}`}</Etiqueta>
      <div className="mt-1">
        <Titulo>{propia ? "Tus mejores frases" : "Sus mejores frases"}</Titulo>
      </div>
    </>
  );

  if (!frases) {
    return (
      <ConRiel admin={admin} user={user} actual={n.id} sufijo="/frases">
        {cabecera}
        <Tarjeta className="mt-6">
          <p className="text-[16px] leading-relaxed text-[var(--texto-suave)]">
            {libroCerrado
              ? "El biógrafo está eligiendo las frases: aparecen acá apenas termine de armar el libro."
              : "Cuando el libro esté cerrado, el biógrafo elige sus mejores frases y se escuchan acá, en su voz."}
          </p>
        </Tarjeta>
        <div className="mt-8"><ProximoPaso href={`/tablero/${n.id}/leer`}>Ir a Leer y escuchar</ProximoPaso></div>
      </ConRiel>
    );
  }

  const resumen = resumenDeCorte(frases);
  // Mientras el worker corta, la página se refresca sola: nadie se queda mirando.
  const cortando = resumen.pendientes > 0;
  const urlBase = process.env.URL_BASE ?? "https://www.vitacorafamiliar.com";
  const linkPublico = puedeEditar ? `${urlBase}/voz/${firmarTokenVoz(n.id)}` : null;

  return (
    <ConRiel admin={admin} user={user} actual={n.id} sufijo="/frases">
      {cortando ? <meta httpEquiv="refresh" content="120" /> : null}
      {cabecera}
      <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-[var(--texto-suave)]">
        {propia
          ? "El biógrafo eligió, leyendo tu libro, las frases que más suenan a vos: se imprimen en el libro con un código para escucharlas, tal como las dijiste. Podés cambiarlas por otras de la lista, sacar una o reordenarlas."
          : `El biógrafo eligió, leyendo el libro, las frases que más suenan a ${n.como_le_dicen}: se imprimen en el libro con un código para escucharlas, tal como las dijo. ${puedeEditar ? "Podés cambiarlas por otras de la lista, sacar una o reordenarlas." : ""}`}
      </p>
      {cortando ? (
        <p className="mt-3 text-[13px] text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
          Estamos recortando los audios: {resumen.cortadas} de {resumen.total} listos. Los que faltan aparecen solos.
        </p>
      ) : null}

      <div className="mt-8">
        <SelectorDeFrases
          narradorId={n.id}
          capitulos={frases.capitulos}
          confirmadoAt={frases.confirmado_at}
          puedeEditar={puedeEditar}
          linkPublico={linkPublico}
        />
      </div>
    </ConRiel>
  );
}

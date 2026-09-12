import Link from "next/link";
import { redirect } from "next/navigation";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { historiasDelUsuario, type Historia } from "@/lib/panel";
import { BannerAlertaSilencio } from "./acciones";
import {
  BarraProgreso,
  Contenedor,
  ESTADO_EN_HUMANO,
  EstadoError,
  Etiqueta,
  ProximoPaso,
  Tarjeta,
  Titulo,
  TOTAL_PREGUNTAS_BASE,
  formatearDuracion,
} from "./ui";

// Inicio (docs/panel-usuario.md §4): una tarjeta por historia con su estado,
// su progreso, UN solo próximo paso, y el dato emocional de cuánta voz hay
// guardada. Las historias donde es invitada van después, marcadas.

type Resumen = {
  respondidas: number;
  total: number;
  segundos: number;
  tieneAnticipo: boolean;
};

async function resumirHistoria(
  admin: ReturnType<typeof crearClienteServidor>,
  narradorId: string,
): Promise<Resumen> {
  const [{ data: respuestas }, { count: totalPreguntas }, { data: paquete }] = await Promise.all([
    admin
      .from("respuestas")
      .select("pregunta_orden, duracion_segundos, es_repregunta")
      .eq("narrador_id", narradorId),
    admin.from("preguntas").select("id", { count: "exact", head: true }).eq("narrador_id", narradorId),
    admin.storage.from("audios").list(`${narradorId}/paquete`),
  ]);

  const filas = (respuestas as { pregunta_orden: number; duracion_segundos: number | null; es_repregunta: boolean }[] | null) ?? [];
  const ordenes = new Set(filas.filter((r) => !r.es_repregunta).map((r) => r.pregunta_orden));
  const segundos = filas.reduce((acc, r) => acc + (r.duracion_segundos ?? 0), 0);
  // Si el guion propio todavía no se copió (narrador anterior a la migración), vale el de 30.
  const total = totalPreguntas && totalPreguntas > 0 ? totalPreguntas : TOTAL_PREGUNTAS_BASE;
  const tieneAnticipo = (paquete ?? []).some((a) => a.name.startsWith("anticipo"));

  return { respondidas: ordenes.size, total, segundos, tieneAnticipo };
}

/** El único próximo paso de una historia, según dónde está. */
function proximoPaso(h: Historia, r: Resumen): { href: string; texto: string } | null {
  const id = h.narrador.id;
  const esDuena = h.rol === "duena";
  switch (h.narrador.estado) {
    case "completado":
    case "cerrado_anticipado":
      return esDuena
        ? { href: `/tablero/${id}/libro`, texto: "Ya terminó de contar — dale los últimos retoques y cerrá su libro" }
        : { href: `/tablero/${id}`, texto: "Ya terminó de contar — leé su historia" };
    case "pausado":
      return { href: `/tablero/${id}`, texto: "Pidió una pausa — mirá qué pasó" };
    case "activo":
      if (r.tieneAnticipo && r.respondidas < 6) return { href: `/tablero/${id}`, texto: "Ya podés leer el capítulo 1" };
      if (r.respondidas > 0) return { href: `/tablero/${id}`, texto: "Escuchá lo último que contó" };
      return null;
    case "acepto":
    case "invitado":
      return { href: `/tablero/${id}/preguntas`, texto: "Mientras esperás, repasá las preguntas y sumá fotos" };
    default:
      return null;
  }
}

export default async function Inicio() {
  const supabase = await crearClienteSesion();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const admin = crearClienteServidor();
  const { panel, error } = await historiasDelUsuario(admin, user);
  if (error) {
    console.error("inicio: fallo la carga", error);
    return <EstadoError />;
  }

  if (panel.historias.length === 0) {
    return (
      <Contenedor>
        <Etiqueta>Inicio</Etiqueta>
        <div className="mt-3">
          <Titulo>Todavía no hay ninguna historia</Titulo>
        </div>
        <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-[var(--texto-suave)] font-light">
          Cuando compres el libro de alguien de tu familia, su historia aparece acá.
        </p>
        <div className="mt-8">
          <ProximoPaso href="/comprar">Empezar una historia</ProximoPaso>
        </div>
      </Contenedor>
    );
  }

  const resumenes = await Promise.all(panel.historias.map((h) => resumirHistoria(admin, h.narrador.id)));
  const segundosTotales = resumenes.reduce((acc, r) => acc + r.segundos, 0);

  return (
    <Contenedor>
      <Etiqueta>Inicio</Etiqueta>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <Titulo>{panel.historias.length === 1 ? "Tu historia" : "Tus historias"}</Titulo>
        {segundosTotales > 0 ? (
          <p className="text-sm text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
            <span className="text-[var(--texto)] tabular-nums">{formatearDuracion(segundosTotales)}</span> de su voz
            guardadas
          </p>
        ) : null}
      </div>

      <div className="mt-8 flex flex-col gap-6">
        {panel.historias.map((h, i) => {
          const r = resumenes[i];
          const paso = proximoPaso(h, r);
          const n = h.narrador;
          return (
            <Tarjeta key={n.id}>
              {n.alerta_silencio && h.rol === "duena" ? (
                <div className="mb-5">
                  <BannerAlertaSilencio narradorId={n.id} comoLeDicen={n.como_le_dicen} />
                </div>
              ) : null}

              <div className="flex items-start justify-between gap-4">
                <div>
                  <Etiqueta>{h.rol === "invitado" ? "Te invitaron a esta historia" : "Historia"}</Etiqueta>
                  <Link href={`/tablero/${n.id}`} className="mt-1 block">
                    <Titulo nivel={2}>La historia de {n.nombre}</Titulo>
                  </Link>
                  <p className="mt-2 text-[15px] text-[var(--texto-suave)]">
                    {ESTADO_EN_HUMANO[n.estado] ?? n.estado}
                  </p>
                </div>
                {r.segundos > 0 ? (
                  <p className="shrink-0 text-right text-sm text-[var(--texto-menor)] [font-family:var(--fuente-micro)] tabular-nums">
                    {formatearDuracion(r.segundos)}
                    <br />
                    <span className="text-[11px] uppercase [letter-spacing:0.2em]">de su voz</span>
                  </p>
                ) : null}
              </div>

              <div className="mt-5">
                <BarraProgreso respondidas={r.respondidas} total={r.total} />
              </div>

              {paso ? (
                <div className="mt-5">
                  <ProximoPaso href={paso.href}>{paso.texto}</ProximoPaso>
                </div>
              ) : null}
            </Tarjeta>
          );
        })}
      </div>

      <div className="mt-10">
        <Link
          href="/comprar"
          className="text-[15px] text-[var(--acento)] underline decoration-[var(--linea-fuerte)] underline-offset-4 [font-family:var(--fuente-micro)]"
        >
          + Empezar otra historia
        </Link>
      </div>
    </Contenedor>
  );
}

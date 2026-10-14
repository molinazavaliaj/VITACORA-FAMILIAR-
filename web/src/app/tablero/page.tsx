import Link from "next/link";
import { redirect } from "next/navigation";
import { usuarioDeLaSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { historiasDelUsuario, type Historia } from "@/lib/panel";
import { viajeDe, type Resumen } from "./proximo-paso";
import { totalDelGuion } from "@/lib/guion";
import { diasDelViaje } from "@/lib/viaje";
import { entrevistaV3 } from "@/lib/v3";
import { hayDudasPendientes } from "@/lib/dudas-archivos";
import { regionDeLaFamilia } from "@/lib/trato";
import { tratoDeRegion } from "@/lib/regalo-textos";
import { PANEL, idiomaDelTrato } from "../_textos/panel";
import { leerPedido } from "./_historia/pedido";
import { LibroDelEstante, type Extra } from "./_historia/estante";
import { primerNombre } from "./momento";
import { Contenedor, EstadoError, Etiqueta, ProximoPaso, Titulo, TOTAL_PREGUNTAS_BASE, formatearDuracion } from "./ui";

// Inicio (docs/panel-usuario.md §4). Rediseño 2026-10 (fase 2): un estante.
// Cada historia es su libro —la tapa de verdad, con la foto y el nombre—, con
// cómo va, su línea de tiempo y UN solo próximo paso. Las historias donde es
// invitada van después, marcadas.

async function resumirHistoria(
  admin: ReturnType<typeof crearClienteServidor>,
  h: Historia,
): Promise<Resumen & Extra> {
  const narradorId = h.narrador.id;
  const viaje = viajeDe(h);
  const [{ data: respuestas }, { data: propias }, { data: globales }, { data: paquete }, dudasPendientes, v3, { data: fila }, pedido] = await Promise.all([
    admin
      .from("respuestas")
      .select("pregunta_orden, duracion_segundos, es_repregunta")
      .eq("narrador_id", narradorId),
    admin.from("preguntas").select("orden").eq("narrador_id", narradorId),
    admin.from("preguntas").select("orden").is("narrador_id", null),
    admin.storage.from("audios").list(`${narradorId}/paquete`),
    // Dudas del escritor sin contestar (lib/dudas-archivos.ts).
    hayDudasPendientes(admin, narradorId),
    // V3 (10/10): sin total ni barra. Si la base falla acá, la tarjeta sale como antes en vez de romper el Inicio.
    // No depende de nada de arriba: va en la misma ronda (RENDIMIENTO.md §3.4).
    viaje ? false : entrevistaV3(admin, narradorId).then((e) => e !== null, () => false),
    // La tapa (la foto y el título que eligieron) y si ya lo encargaron: también en la misma ronda.
    admin.from("narradores").select("libro_aprobado_at, edicion").eq("id", narradorId).maybeSingle(),
    // Lo comprado, para la línea de tiempo (nunca rechaza).
    leerPedido(admin, h.narrador),
  ]);

  const filas = (respuestas as { pregunta_orden: number; duracion_segundos: number | null; es_repregunta: boolean }[] | null) ?? [];
  const ordenes = new Set(filas.filter((r) => !r.es_repregunta).map((r) => r.pregunta_orden));
  const segundos = filas.reduce((acc, r) => acc + (r.duracion_segundos ?? 0), 0);
  // El mismo total que Historias: propias + plantilla global (un narrador manual
  // puede tener solo las 4 adaptativas como propias). Sin nada, vale el de 30.
  // En viaje (3t.19) el total son las noches: la plantilla global no cuenta.
  const total = viaje
    ? diasDelViaje(viaje)
    : totalDelGuion(
        (propias as { orden: number }[] | null) ?? [],
        (globales as { orden: number }[] | null) ?? [],
        TOTAL_PREGUNTAS_BASE,
      );
  const tieneAnticipo = (paquete ?? []).some((a) => a.name.startsWith("anticipo"));
  const f = (fila as { libro_aprobado_at?: string | null; edicion?: { portadaFotoId?: string | null; titulo?: string } | null } | null) ?? {};
  return {
    respondidas: ordenes.size,
    total,
    segundos,
    tieneAnticipo,
    v3,
    dudasPendientes,
    aprobado: Boolean(f.libro_aprobado_at),
    portadaFotoId: f.edicion?.portadaFotoId ?? null,
    titulo: f.edicion?.titulo?.trim() || null,
    pedido,
  };
}

export default async function Inicio() {
  const user = await usuarioDeLaSesion();
  if (!user) redirect("/entrar");

  const admin = crearClienteServidor();
  const { panel, error } = await historiasDelUsuario(admin, user);
  if (error) {
    console.error("inicio: fallo la carga", error);
    return <EstadoError />;
  }

  const tratoFamilia = tratoDeRegion(panel.familia?.region === "ES" ? "ES" : "AR");
  const hola = primerNombre(panel.familia?.nombre);

  if (panel.historias.length === 0) {
    return (
      <Contenedor ancho="max-w-[1040px]">
        <Etiqueta>Inicio</Etiqueta>
        <div className="mt-3">
          <Titulo>Todavía no hay ninguna historia</Titulo>
        </div>
        <p className="pnl-parrafo mt-4 max-w-lg">
          {panel.familia?.region === "ES"
            ? "Cuando compres el libro de alguien de tu familia, su historia aparece aquí."
            : "Cuando compres el libro de alguien de tu familia, su historia aparece acá."}
        </p>
        <div className="mt-8 max-w-lg">
          <ProximoPaso href="/comprar">Empezar una historia</ProximoPaso>
        </div>
      </Contenedor>
    );
  }

  // Los resúmenes y las regiones no dependen unos de otros: una sola ronda (RENDIMIENTO.md §3.4).
  const [resumenes, regiones] = await Promise.all([
    Promise.all(panel.historias.map((h) => resumirHistoria(admin, h))),
    // Cada tarjeta habla con el trato de la familia dueña de esa historia: la del
    // panel si es propia, la de quien invitó si no.
    Promise.all(
      panel.historias.map((h) =>
        panel.familia && h.narrador.familia_id === panel.familia.id ? panel.familia.region : regionDeLaFamilia(admin, h.narrador.familia_id),
      ),
    ),
  ]);
  const segundosTotales = resumenes.reduce((acc, r) => acc + r.segundos, 0);
  const T = PANEL[idiomaDelTrato(tratoFamilia)];

  return (
    <Contenedor ancho="max-w-[1040px]">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <h1 className="pnl-titular">
          {hola ? <span className="block italic text-[var(--texto-suave)]">{T.hola(hola)}</span> : null}
          {panel.historias.length === 1 ? "Tu historia" : "Tus historias"}
        </h1>
        {segundosTotales > 0 ? (
          <p className="pnl-dato pb-2">
            <span className="text-[var(--texto)]">{formatearDuracion(segundosTotales)}</span> de su voz guardadas
          </p>
        ) : null}
      </div>

      <ol className="pnl-entra mt-10 flex flex-col md:mt-14">
        {panel.historias.map((h, i) => (
          <LibroDelEstante key={h.narrador.id} h={h} r={resumenes[i]} region={regiones[i]} />
        ))}
      </ol>

      <div className="border-t border-[var(--linea)] pt-8">
        <Link href="/comprar" className="pnl-boton pnl-boton--hilo">
          + Empezar otra historia
        </Link>
      </div>
    </Contenedor>
  );
}

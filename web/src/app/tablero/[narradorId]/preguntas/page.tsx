import { notFound, redirect } from "next/navigation";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { historiaAccesible, PUEDE } from "@/lib/panel";
import { Contenedor, EstadoError, Etiqueta, Tarjeta, Titulo } from "../../ui";

// Preguntas (docs/panel-usuario.md §6): el guion de esta historia. Lo enviado
// está congelado; lo futuro se edita, salta, reordena o se suma (hasta 40 con
// las 4 adaptativas). HOY: la vista. Editar, agregar, foto, ritmo y evitar
// vienen en el siguiente paso de construcción.

type Pregunta = { id: string; orden: number; texto: string; capitulo: string; tipo: string; narrador_id: string | null };

const TOPE = 40;
const ADAPTATIVAS = 4;

export default async function PaginaPreguntas({ params, searchParams }: PageProps<"/tablero/[narradorId]/preguntas">) {
  const { narradorId } = await params;
  const { sobre } = await searchParams;

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

  const [{ data: propias }, { data: globales }] = await Promise.all([
    admin.from("preguntas").select("id, orden, texto, capitulo, tipo, narrador_id").eq("narrador_id", n.id),
    admin.from("preguntas").select("id, orden, texto, capitulo, tipo, narrador_id").is("narrador_id", null),
  ]);
  const porOrden = new Map<number, Pregunta>();
  for (const p of (globales as Pregunta[] | null) ?? []) porOrden.set(p.orden, p);
  for (const p of (propias as Pregunta[] | null) ?? []) porOrden.set(p.orden, p);
  const guion = [...porOrden.values()].sort((a, b) => a.orden - b.orden);

  const enviadas = guion.filter((p) => p.orden <= n.dia_actual);
  const futuras = guion.filter((p) => p.orden > n.dia_actual);
  const cerrado = ["completado", "cerrado_anticipado"].includes(n.estado);
  const lugarLibre = TOPE - ADAPTATIVAS - guion.filter((p) => p.tipo !== "adaptativa").length;
  const sobreOrden = typeof sobre === "string" ? Number(sobre) : null;
  const preguntaSobre = sobreOrden ? porOrden.get(sobreOrden) : null;

  return (
    <Contenedor>
      <Etiqueta>Preguntas · La historia de {n.nombre}</Etiqueta>
      <div className="mt-1">
        <Titulo>El guion</Titulo>
      </div>

      {!cerrado ? (
        <Tarjeta className="mt-6 border-[var(--acento)]">
          <p className="text-[16px] leading-relaxed text-[var(--texto-suave)]">
            <strong className="font-medium text-[var(--texto)]">Cuanto más personal es el guion, mejor queda el libro.</strong>{" "}
            Repasá las preguntas, sumá las tuyas y agregá fotos de cada época. Las que ya se
            mandaron no se tocan; las que vienen, sí.
          </p>
          <p className="mt-3 text-sm text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
            {guion.length} preguntas · lugar para {Math.max(0, lugarLibre)} más · las 4 finales las escribe el
            biógrafo con lo que él haya contado
          </p>
        </Tarjeta>
      ) : (
        <Tarjeta className="mt-6">
          <p className="text-[15px] text-[var(--texto-suave)]">
            La entrevista terminó. El guion quedó así; lo que sigue es cerrar el libro.
          </p>
        </Tarjeta>
      )}

      {preguntaSobre ? (
        <Tarjeta className="mt-6 bg-[var(--papel)]">
          <Etiqueta>Pedirle que cuente más sobre</Etiqueta>
          <p className="mt-2 text-[15px] italic text-[var(--texto-suave)]">“{preguntaSobre.texto}”</p>
          <p className="mt-3 text-sm text-[var(--texto-menor)]">
            Pronto: escribís la pregunta y el biógrafo se la hace al final, como propia.
          </p>
        </Tarjeta>
      ) : null}

      {enviadas.length > 0 ? (
        <section className="mt-10">
          <Etiqueta>Ya se mandaron · no se tocan</Etiqueta>
          <ol className="mt-4 flex flex-col gap-3">
            {enviadas.map((p) => (
              <li key={p.orden} className="flex gap-4 text-[var(--texto-menor)]">
                <span className="w-6 shrink-0 text-right text-sm tabular-nums [font-family:var(--fuente-micro)]">{p.orden}</span>
                <div>
                  <p className="text-[15px] leading-relaxed">{p.texto}</p>
                  <p className="mt-0.5 text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">{p.capitulo}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <Etiqueta>{cerrado ? "El resto del guion" : "Las que vienen"}</Etiqueta>
          {!cerrado && PUEDE.editarGuion(rol) ? (
            <span className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">
              editar · saltar · reordenar — pronto
            </span>
          ) : null}
        </div>
        <ol className="mt-4 flex flex-col gap-3">
          {futuras.map((p) => (
            <li key={p.orden} className="flex gap-4">
              <span className="w-6 shrink-0 text-right text-sm text-[var(--texto-menor)] tabular-nums [font-family:var(--fuente-micro)]">{p.orden}</span>
              <div>
                <p className="text-[16px] leading-relaxed">{p.texto}</p>
                <p className="mt-0.5 text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">
                  {p.capitulo}
                  {p.tipo === "familia" ? " · agregada por la familia" : ""}
                </p>
              </div>
            </li>
          ))}
          {!cerrado ? (
            <li className="flex gap-4 text-[var(--texto-menor)]">
              <span className="w-6 shrink-0 text-right text-sm tabular-nums [font-family:var(--fuente-micro)]">+4</span>
              <p className="text-[15px] italic">Las cuatro finales las escribe el biógrafo con todo lo que él haya contado.</p>
            </li>
          ) : null}
        </ol>
      </section>

      {!cerrado && PUEDE.agregarPreguntasYFotos(rol) ? (
        <div className="mt-10 flex flex-wrap gap-3">
          <span className="inline-flex h-11 cursor-not-allowed items-center rounded-full bg-[var(--bruma)] px-6 text-sm text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
            + Agregar una pregunta — pronto
          </span>
          <span className="inline-flex h-11 cursor-not-allowed items-center rounded-full bg-[var(--bruma)] px-6 text-sm text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
            + Subir una foto — pronto
          </span>
        </div>
      ) : null}
    </Contenedor>
  );
}

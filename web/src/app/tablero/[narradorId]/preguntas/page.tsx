import { notFound, redirect } from "next/navigation";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { historiaAccesible, PUEDE } from "@/lib/panel";
import { ADAPTATIVAS, lugarLibre, puedeSaltar, validarRitmo, type PreguntaGuion, type Ritmo } from "@/lib/guion";
import { Contenedor, EstadoError, Etiqueta, Tarjeta, Titulo } from "../../ui";
import { AgregarPregunta, Ajustes, EditorGuion, SubirFoto } from "./acciones";

// Preguntas (docs/panel-usuario.md §6): el guion de esta historia. Lo enviado
// está congelado; lo futuro se edita, salta, reordena o se suma. Las 4
// adaptativas siempre existen y cuentan para el tope de 40.

type Fila = PreguntaGuion & { narrador_id: string | null };

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

  const [{ data: propias }, { data: globales }, { data: filaContexto }] = await Promise.all([
    admin.from("preguntas").select("id, orden, texto, capitulo, tipo, foto_id, narrador_id").eq("narrador_id", n.id),
    admin.from("preguntas").select("id, orden, texto, capitulo, tipo, narrador_id").is("narrador_id", null),
    admin.from("narradores").select("contexto").eq("id", n.id).maybeSingle(),
  ]);

  // El guion propio manda; la plantilla global solo rellena si todavía no se copió.
  const porOrden = new Map<number, Fila>();
  for (const p of (globales as Fila[] | null) ?? []) porOrden.set(p.orden, p);
  for (const p of (propias as Fila[] | null) ?? []) porOrden.set(p.orden, p);
  const guion = [...porOrden.values()].sort((a, b) => a.orden - b.orden);
  const tieneGuionPropio = guion.some((p) => p.narrador_id === n.id && p.tipo === "fija");

  const enviadas = guion.filter((p) => p.orden <= n.dia_actual);
  const futuras = guion.filter((p) => p.orden > n.dia_actual);
  const cerrado = ["completado", "cerrado_anticipado"].includes(n.estado);
  const capitulos = [...new Set(guion.map((p) => p.capitulo))];
  const lugar = lugarLibre(guion);
  const contexto = ((filaContexto as { contexto?: Record<string, unknown> } | null)?.contexto) ?? {};
  const ritmo: Ritmo = validarRitmo(contexto.ritmo) ? contexto.ritmo : contexto.modoRapido === true ? "seguido" : "diario";
  const evitar = typeof contexto.evitar === "string" ? contexto.evitar : "";

  const sobreOrden = typeof sobre === "string" ? Number(sobre) : null;
  const preguntaSobre = sobreOrden ? porOrden.get(sobreOrden) : null;
  const puedeAgregar = !cerrado && PUEDE.agregarPreguntasYFotos(rol);

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
            {guion.filter((p) => p.tipo !== "adaptativa").length} preguntas · lugar para {lugar} más · las {ADAPTATIVAS} finales las escribe
            el biógrafo con lo que él haya contado
          </p>
          {!tieneGuionPropio ? (
            <p className="mt-2 text-sm text-[var(--texto-menor)]">
              Este es el guion base. En cuanto lo toques, pasa a ser el de {n.nombre}.
            </p>
          ) : null}
        </Tarjeta>
      ) : (
        <Tarjeta className="mt-6">
          <p className="text-[15px] text-[var(--texto-suave)]">La entrevista terminó. El guion quedó así; lo que sigue es cerrar el libro.</p>
        </Tarjeta>
      )}

      {puedeAgregar ? (
        <div className="mt-8 flex flex-col gap-4">
          <AgregarPregunta
            narradorId={n.id}
            capitulos={capitulos}
            lugarLibre={lugar}
            textoInicial={preguntaSobre ? `Me gustaría que me cuente más sobre esto: "${preguntaSobre.texto}"` : ""}
            capituloInicial={preguntaSobre?.capitulo}
          />
          <SubirFoto narradorId={n.id} capitulos={capitulos}>+ Subir una foto a un capítulo</SubirFoto>
        </div>
      ) : null}

      {enviadas.length > 0 ? (
        <section className="mt-12">
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

      <section className="mt-12">
        <div className="flex items-baseline justify-between">
          <Etiqueta>{cerrado ? "El resto del guion" : "Las que vienen"}</Etiqueta>
          {!cerrado && PUEDE.editarGuion(rol) ? (
            <span className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">
              editar · sacar · ↑↓ mover
            </span>
          ) : null}
        </div>
        <EditorGuion
          narradorId={n.id}
          futuras={futuras}
          puedeEditar={!cerrado && PUEDE.editarGuion(rol)}
          puedeSaltar={puedeSaltar(guion).ok}
        />
        {!cerrado && !futuras.some((p) => p.tipo === "adaptativa") ? (
          <p className="mt-4 flex gap-4 text-[var(--texto-menor)]">
            <span className="w-6 shrink-0 text-right text-sm tabular-nums [font-family:var(--fuente-micro)]">+{ADAPTATIVAS}</span>
            <span className="text-[15px] italic">Las cuatro finales las escribe el biógrafo con todo lo que él haya contado.</span>
          </p>
        ) : null}
      </section>

      {!cerrado && PUEDE.cambiarRitmo(rol) ? (
        <section className="mt-14 border-t border-[var(--linea)] pt-10">
          <Etiqueta>Ajustes de la entrevista</Etiqueta>
          <div className="mt-6">
            <Ajustes narradorId={n.id} ritmo={ritmo} evitar={evitar} />
          </div>
        </section>
      ) : null}
    </Contenedor>
  );
}

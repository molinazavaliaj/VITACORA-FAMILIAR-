import { notFound, redirect } from "next/navigation";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { historiaAccesible, PUEDE } from "@/lib/panel";
import {
  correccionesPorDuda,
  estadoDelPlazo,
  fechaDelPlazo,
  fechaDeRespuesta,
  leerCorreccionesGuardadas,
  leerDudas,
  zonaParaFechas,
} from "@/lib/dudas";
import { archivosDelEscritor, leerDelEscritor } from "@/lib/dudas-archivos";
import type { Region } from "@/lib/registro";
import { FormularioDudas, type DudaPrefill } from "./acciones";
import { VolverAlTablero } from "../../pasos";

// Las dudas del escritor V3 (CONTRATO, "Escritor V3 en la fábrica"). Al terminar
// la entrevista, la Etapa A deja lo que no pudo resolver de los audios: un nombre
// que se oye de dos formas, un año que no cierra. La familia lo contesta acá y la
// Etapa B lo usa al escribir el libro.
//
// No hay mail automático todavía (decisión del 12/10): los socios pasan el link.

const MENSAJE_ERROR_CARGA = "No pudimos cargar las dudas. Actualizá la página en un momento.";

/**
 * La zona en la que se muestran las fechas (la página corre en Vercel, en UTC):
 * la del narrador y, si no sirve, la región de la familia. Si la base falla,
 * `zonaParaFechas` cae en Argentina antes que romper la pantalla.
 */
async function zonaDeLaHistoria(
  admin: ReturnType<typeof crearClienteServidor>,
  narrador: { id: string; familia_id: string },
): Promise<string> {
  const [{ data: n }, { data: f }] = await Promise.all([
    admin.from("narradores").select("zona_horaria").eq("id", narrador.id).maybeSingle(),
    admin.from("familias").select("region").eq("id", narrador.familia_id).maybeSingle(),
  ]);
  return zonaParaFechas(
    (n as { zona_horaria?: string | null } | null)?.zona_horaria,
    (f as { region?: Region | null } | null)?.region,
  );
}

export default async function TableroDudas({ params }: PageProps<"/tablero/[narradorId]/dudas">) {
  const { narradorId } = await params;

  const supabase = await crearClienteSesion();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/entrar");
  }

  const admin = crearClienteServidor();
  const { historia, error: errorHistoria } = await historiaAccesible(admin, user, narradorId);
  if (errorHistoria) {
    console.error("tablero/dudas: fallo el acceso", errorHistoria);
    return <EstadoError />;
  }
  // La dueña y los invitados: son los que conocen los datos. El visitante no.
  if (!historia || !PUEDE.contestarDudas(historia.rol)) {
    notFound();
  }
  const narrador = historia.narrador;

  // "No existe" es un estado (todavía no hay dudas); no poder leerlo es un error.
  const archivoDudas = await leerDelEscritor(admin, narrador.id, "dudas-familia.json");
  if (archivoDudas.error) {
    console.error("tablero/dudas: fallo la descarga de dudas-familia.json", archivoDudas.error);
    return <EstadoError />;
  }
  if (archivoDudas.texto === null) {
    return <EstadoSinDudas narradorId={narrador.id} comoLeDicen={narrador.como_le_dicen} />;
  }

  // Roto incluye un `dudas` que no es lista: la pantalla no se cae, dice que no pudo.
  const dudas = leerDudas(archivoDudas.texto);
  if (!dudas) {
    console.error("tablero/dudas: dudas-familia.json invalido");
    return <EstadoError />;
  }

  const [archivoCorrecciones, archivoAvisadas, escritor, zona] = await Promise.all([
    leerDelEscritor(admin, narrador.id, "correcciones.json"),
    leerDelEscritor(admin, narrador.id, "dudas-avisadas.txt"),
    archivosDelEscritor(admin, narrador.id),
    zonaDeLaHistoria(admin, narrador),
  ]);
  if (archivoCorrecciones.error || archivoAvisadas.error || escritor.error) {
    console.error(
      "tablero/dudas: fallo la lectura del escritor",
      archivoCorrecciones.error ?? archivoAvisadas.error ?? escritor.error,
    );
    return <EstadoError />;
  }

  let guardadas: unknown[] = [];
  if (archivoCorrecciones.texto !== null) {
    const leidas = leerCorreccionesGuardadas(archivoCorrecciones.texto);
    // Un archivo roto no tapa la pantalla, pero la API no lo pisa (perdería lo
    // de los socios): guardar va a fallar hasta que los socios lo arreglen.
    if (leidas) guardadas = leidas;
    else console.error("tablero/dudas: correcciones.json invalido");
  }

  // El plazo corre desde el mail a los socios; el libro escrito lo cierra.
  const plazo = estadoDelPlazo(archivoAvisadas.texto, escritor.nombres.has("libro.md"));

  // A los otros familiares se les muestra el nombre (si la base lo tenía) y la
  // fecha ya armada en la zona de la historia. El mail no sale del servidor.
  const porDuda = correccionesPorDuda(guardadas);
  const conGuardadas: DudaPrefill[] = dudas.map((duda) => {
    const g = porDuda.get(duda.id);
    return {
      ...duda,
      guardada: g
        ? { texto: g.texto, ...(g.quien ? { quien: g.quien } : {}), fecha: fechaDeRespuesta(g.cuando, zona) }
        : undefined,
    };
  });

  return (
    <div className="flex flex-1 flex-col items-center bg-[var(--fondo)] px-6 py-16 text-[var(--texto)]">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <VolverAlTablero narradorId={narrador.id} />
        </div>
        <h1 className="text-2xl font-semibold text-[var(--texto)]">
          Dudas sobre lo que contó {narrador.como_le_dicen}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--texto-suave)]">
          Al escuchar los audios quedaron algunas cosas sin resolver: un nombre que se oye de dos
          formas, una fecha que no cierra. Lo que sepas entra al libro. Lo que dejes vacío queda
          tal como lo contó.
        </p>

        <AvisoDelPlazo estado={plazo.estado} venceAt={plazo.venceAt} zona={zona} />

        <div className="mt-8">
          <FormularioDudas
            dudas={conGuardadas}
            narradorId={narrador.id}
            soloLectura={plazo.estado === "libro_escrito"}
          />
        </div>
      </div>
    </div>
  );
}

function AvisoDelPlazo({
  estado,
  venceAt,
  zona,
}: {
  estado: "abierto" | "vencido" | "libro_escrito";
  venceAt: Date | null;
  zona: string;
}) {
  if (estado === "libro_escrito") {
    return (
      <p className="mt-6 rounded-md border border-[var(--linea-fuerte)] px-4 py-3 text-sm leading-relaxed text-[var(--texto-suave)]">
        El libro ya está escrito, así que esto queda como estaba. Si algo salió mal, escribinos a{" "}
        <a href="mailto:hola@vitacorafamiliar.com" className="underline">
          hola@vitacorafamiliar.com
        </a>{" "}
        y lo corregimos a mano.
      </p>
    );
  }
  if (estado === "vencido") {
    return (
      <p className="mt-6 rounded-md border border-[var(--linea-fuerte)] px-4 py-3 text-sm leading-relaxed text-[var(--texto-suave)]">
        El plazo ya pasó, pero el libro todavía no se escribió. Si contestás ahora, todavía puede
        entrar.
      </p>
    );
  }
  if (!venceAt) return null;
  const cuando = fechaDelPlazo(venceAt, zona);
  return (
    <p className="mt-6 rounded-md border border-[var(--linea-fuerte)] px-4 py-3 text-sm leading-relaxed text-[var(--texto-suave)]">
      Contestá antes del {cuando}. Lo que llegue después puede quedar afuera del libro.
    </p>
  );
}

function EstadoError() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[var(--fondo)] px-6 py-16 text-center text-[var(--texto)]">
      <p className="text-sm text-[var(--texto-suave)]">{MENSAJE_ERROR_CARGA}</p>
    </div>
  );
}

function EstadoSinDudas({ comoLeDicen, narradorId }: { comoLeDicen: string; narradorId: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[var(--fondo)] px-6 py-16 text-center text-[var(--texto)]">
      <p className="text-sm text-[var(--texto-suave)]">
        Todavía no hay dudas sobre lo que contó {comoLeDicen}.
      </p>
      <div className="mt-6">
        <VolverAlTablero narradorId={narradorId} />
      </div>
    </div>
  );
}

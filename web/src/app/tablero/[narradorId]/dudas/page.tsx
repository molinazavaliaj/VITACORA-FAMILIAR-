import { notFound, redirect } from "next/navigation";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { historiaAccesible, PUEDE } from "@/lib/panel";
import { correccionesPorDuda, estadoDelPlazo, type CorreccionFamilia, type DudaFamilia } from "@/lib/dudas";
import { FormularioDudas } from "./acciones";
import { VolverAlTablero } from "../../pasos";

// Las dudas del escritor V3 (CONTRATO, "Escritor V3 en la fábrica"). Al terminar
// la entrevista, la Etapa A deja lo que no pudo resolver de los audios: un nombre
// que se oye de dos formas, un año que no cierra. La familia lo contesta acá y la
// Etapa B lo usa al escribir el libro.
//
// No hay mail automático todavía (decisión del 12/10): los socios pasan el link.

const MENSAJE_ERROR_CARGA = "No pudimos cargar las dudas. Actualizá la página en un momento.";

/** Lee un archivo del escritor. Null si no está: la fábrica los crea a su ritmo. */
async function leerDelEscritor(
  admin: ReturnType<typeof crearClienteServidor>,
  narradorId: string,
  archivo: string,
): Promise<string | null> {
  const { data } = await admin.storage.from("audios").download(`${narradorId}/escritor/${archivo}`);
  return data ? await data.text() : null;
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

  const crudoDudas = await leerDelEscritor(admin, narrador.id, "dudas-familia.json");
  if (!crudoDudas) {
    return <EstadoSinDudas narradorId={narrador.id} comoLeDicen={narrador.como_le_dicen} />;
  }

  let dudas: DudaFamilia[];
  try {
    dudas = (JSON.parse(crudoDudas) as { dudas?: DudaFamilia[] }).dudas ?? [];
  } catch (err) {
    console.error("tablero/dudas: dudas-familia.json invalido", err);
    return <EstadoError />;
  }

  let guardadas: CorreccionFamilia[] = [];
  const crudoCorrecciones = await leerDelEscritor(admin, narrador.id, "correcciones.json");
  if (crudoCorrecciones) {
    try {
      guardadas = (JSON.parse(crudoCorrecciones) as { correcciones?: CorreccionFamilia[] }).correcciones ?? [];
    } catch (err) {
      // Un archivo roto no tapa la pantalla: se contesta de nuevo y se reescribe.
      console.error("tablero/dudas: correcciones.json invalido", err);
    }
  }

  // El plazo corre desde el mail a los socios; el libro escrito lo cierra.
  const avisadas = await leerDelEscritor(admin, narrador.id, "dudas-avisadas.txt");
  const libroEscrito = (await leerDelEscritor(admin, narrador.id, "libro.md")) !== null;
  const plazo = estadoDelPlazo(avisadas, libroEscrito);

  const porDuda = correccionesPorDuda(guardadas);
  const conGuardadas = dudas.map((duda) => ({ ...duda, guardada: porDuda.get(duda.id) }));
  const quien = (user.email ?? "").split("@")[0] || "alguien de la familia";

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
          formas, una fecha que no cierra. Lo que sepas entra al libro; lo que dejes vacío lo
          escribimos tal como lo contó.
        </p>

        <AvisoDelPlazo estado={plazo.estado} venceAt={plazo.venceAt} />

        <div className="mt-8">
          <FormularioDudas
            dudas={conGuardadas}
            narradorId={narrador.id}
            quien={quien}
            soloLectura={plazo.estado === "libro_escrito"}
          />
        </div>
      </div>
    </div>
  );
}

function AvisoDelPlazo({ estado, venceAt }: { estado: "abierto" | "vencido" | "libro_escrito"; venceAt: Date | null }) {
  if (estado === "libro_escrito") {
    return (
      <p className="mt-6 rounded-md border border-[var(--linea-fuerte)] px-4 py-3 text-sm leading-relaxed text-[var(--texto-suave)]">
        El libro ya está escrito, así que esto queda como estaba. Si algo salió mal, escribinos y
        lo corregimos a mano.
      </p>
    );
  }
  if (estado === "vencido") {
    return (
      <p className="mt-6 rounded-md border border-[var(--linea-fuerte)] px-4 py-3 text-sm leading-relaxed text-[var(--texto-suave)]">
        Pasó el tiempo que esperábamos, pero el libro todavía no se escribió: si contestás ahora,
        llegamos.
      </p>
    );
  }
  if (!venceAt) return null;
  const cuando = venceAt.toLocaleString("es-AR", { weekday: "long", hour: "2-digit", minute: "2-digit" });
  return (
    <p className="mt-6 rounded-md border border-[var(--linea-fuerte)] px-4 py-3 text-sm leading-relaxed text-[var(--texto-suave)]">
      Tenés tiempo hasta el {cuando}. Después escribimos el libro con lo que haya.
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
        Todavía no hay dudas sobre lo que contó {comoLeDicen}. Si aparecen, te avisamos.
      </p>
      <div className="mt-6">
        <VolverAlTablero narradorId={narradorId} />
      </div>
    </div>
  );
}

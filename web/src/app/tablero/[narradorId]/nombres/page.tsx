import { notFound, redirect } from "next/navigation";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { historiaAccesible, PUEDE } from "@/lib/panel";
import { FormularioNombres } from "./acciones";
import { PasosDelLibro, VolverAlTablero } from "../../pasos";

const MENSAJE_ERROR_CARGA = "No pudimos cargar los nombres. Actualiza la página en un momento.";

type Narrador = {
  id: string;
  como_le_dicen: string;
};

type Entidad = {
  texto: string;
  tipo: "persona" | "lugar";
  contexto: string;
};

type Estructura = {
  titulo: string;
  entidades: Entidad[];
};

type Nombres = {
  correcciones: { original: string; corregido: string }[];
};

export default async function TableroNombres({ params }: PageProps<"/tablero/[narradorId]/nombres">) {
  const { narradorId } = await params;

  const supabase = await crearClienteSesion();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  const admin = crearClienteServidor();

  // Revisar los nombres es parte de la edición final: solo la dueña.
  const { historia, error: errorHistoria } = await historiaAccesible(admin, user, narradorId);
  if (errorHistoria) {
    console.error("tablero/nombres: fallo el acceso", errorHistoria);
    return <EstadoError />;
  }
  if (!historia || !PUEDE.cerrarLibro(historia.rol)) {
    notFound();
  }
  const narrador = historia.narrador;

  const { data: descargaEstructura, error: errorDescargaEstructura } = await admin.storage
    .from("audios")
    .download(`${narrador.id}/paquete/estructura.json`);

  if (errorDescargaEstructura || !descargaEstructura) {
    return <EstadoSinEstructura narradorId={narrador.id} comoLeDicen={narrador.como_le_dicen} />;
  }

  let estructura: Estructura;
  try {
    estructura = JSON.parse(await descargaEstructura.text());
  } catch (err) {
    console.error("tablero/nombres: estructura.json invalido", err);
    return <EstadoError />;
  }

  let nombres: Nombres = { correcciones: [] };
  const { data: descargaNombres } = await admin.storage
    .from("audios")
    .download(`${narrador.id}/paquete/nombres.json`);

  if (descargaNombres) {
    try {
      nombres = JSON.parse(await descargaNombres.text());
    } catch (err) {
      console.error("tablero/nombres: nombres.json invalido", err);
    }
  }

  // Cola por nombre original, no un valor único: dos entidades detectadas
  // con el mismo texto (dos "Juan" distintos) pueden tener correcciones
  // distintas guardadas. Un Map de un solo valor por clave haría que ambas
  // filas se prellenen con la misma corrección — acá cada fila consume, en
  // orden, la siguiente corrección guardada para ese nombre.
  const corregidosPorOriginal = new Map<string, string[]>();
  for (const correccion of nombres.correcciones ?? []) {
    const cola = corregidosPorOriginal.get(correccion.original) ?? [];
    cola.push(correccion.corregido);
    corregidosPorOriginal.set(correccion.original, cola);
  }

  const entidades = (estructura.entidades ?? []).map((entidad) => {
    const cola = corregidosPorOriginal.get(entidad.texto);
    const valorInicial = cola && cola.length > 0 ? cola.shift()! : entidad.texto;
    return {
      texto: entidad.texto,
      contexto: entidad.contexto,
      valorInicial,
    };
  });

  return (
    <div className="flex flex-1 flex-col items-center bg-white px-6 py-16 text-zinc-900">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col gap-4">
          <VolverAlTablero narradorId={narrador.id} />
          <PasosDelLibro actual={2} />
        </div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Nombres de {narrador.como_le_dicen}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Revisa que estén bien escritos antes de que imprimamos el libro — la transcripción
          automática a veces oye mal un nombre o un lugar.
        </p>

        <div className="mt-8">
          <FormularioNombres narradorId={narrador.id} entidades={entidades} />
        </div>
      </div>
    </div>
  );
}

function EstadoError() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-16 text-center text-zinc-900">
      <p className="text-sm text-zinc-600">{MENSAJE_ERROR_CARGA}</p>
    </div>
  );
}

function EstadoSinEstructura({ comoLeDicen, narradorId }: { comoLeDicen: string; narradorId: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-16 text-center text-zinc-900">
      <p className="text-sm text-zinc-600">
        Todavía estamos armando el libro de {comoLeDicen}. La revisión de nombres va a estar
        lista pronto.
      </p>
      <div className="mt-6">
        <VolverAlTablero narradorId={narradorId} />
      </div>
    </div>
  );
}

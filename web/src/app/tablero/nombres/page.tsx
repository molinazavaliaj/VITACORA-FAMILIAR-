import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { FormularioNombres } from "./acciones";

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

export default async function TableroNombres() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  const admin = crearClienteServidor();

  const { data: familia, error: errorFamilia } = await admin
    .from("familias")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (errorFamilia) {
    console.error("tablero/nombres: fallo la busqueda de familia", errorFamilia);
    return <EstadoError />;
  }

  if (!familia) {
    redirect("/registro");
  }

  const { data: narradores, error: errorNarradores } = await admin
    .from("narradores")
    .select("id, como_le_dicen")
    .eq("familia_id", (familia as { id: string }).id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (errorNarradores) {
    console.error("tablero/nombres: fallo la busqueda de narradores", errorNarradores);
    return <EstadoError />;
  }

  const narrador = (narradores as Narrador[] | null)?.[0];

  if (!narrador) {
    redirect("/registro");
  }

  const { data: descargaEstructura, error: errorDescargaEstructura } = await admin.storage
    .from("audios")
    .download(`${narrador.id}/paquete/estructura.json`);

  if (errorDescargaEstructura || !descargaEstructura) {
    return <EstadoSinEstructura comoLeDicen={narrador.como_le_dicen} />;
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
        <h1 className="text-2xl font-semibold text-zinc-900">
          Nombres de {narrador.como_le_dicen}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Revisa que estén bien escritos antes de que imprimamos el libro — la transcripción
          automática a veces oye mal un nombre o un lugar.
        </p>

        <div className="mt-8">
          <FormularioNombres entidades={entidades} />
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

function EstadoSinEstructura({ comoLeDicen }: { comoLeDicen: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-16 text-center text-zinc-900">
      <p className="text-sm text-zinc-600">
        Todavía estamos armando el libro de {comoLeDicen}. La revisión de nombres va a estar
        lista pronto.
      </p>
    </div>
  );
}

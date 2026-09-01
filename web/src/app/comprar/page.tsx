import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { obtenerPrecio } from "@/lib/precios";
import { BotonComprar } from "./acciones";

const MENSAJE_ERROR_CARGA = "No pudimos cargar la previsualización. Actualiza la página en un momento.";
const ESTADOS_CON_LIBRO_EN_MARCHA = ["completado", "cerrado_anticipado"];

type Familia = { id: string; region: "ES" | "AR" };
type Narrador = { id: string; como_le_dicen: string; estado: string };

export default async function Comprar() {
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
    .select("id, region")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (errorFamilia) {
    console.error("comprar: fallo la busqueda de familia", errorFamilia);
    return <EstadoError />;
  }

  if (!familia) {
    redirect("/registro");
  }

  const datosFamilia = familia as Familia;

  const { data: narradores, error: errorNarradores } = await admin
    .from("narradores")
    .select("id, como_le_dicen, estado")
    .eq("familia_id", datosFamilia.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (errorNarradores) {
    console.error("comprar: fallo la busqueda de narrador", errorNarradores);
    return <EstadoError />;
  }

  const narrador = (narradores as Narrador[] | null)?.[0];

  if (!narrador) {
    redirect("/registro");
  }

  if (!ESTADOS_CON_LIBRO_EN_MARCHA.includes(narrador.estado)) {
    return <EstadoAunNoListo comoLeDicen={narrador.como_le_dicen} />;
  }

  const { data: archivos, error: errorArchivos } = await admin.storage
    .from("audios")
    .list(`${narrador.id}/paquete`);

  if (errorArchivos) {
    console.error("comprar: fallo listar el paquete", errorArchivos);
    return <EstadoError />;
  }

  const nombresArchivos = new Set((archivos ?? []).map((archivo) => archivo.name));
  const previewListo = nombresArchivos.has("preview.pdf");

  const { monto: montoPrecio, moneda: monedaPrecio } = obtenerPrecio(datosFamilia.region);
  const precio = monedaPrecio === "EUR" ? `${montoPrecio} €` : `$${montoPrecio} ARS`;

  return (
    <div className="flex flex-1 flex-col items-center bg-white px-6 py-16 text-zinc-900">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-zinc-900">
          El libro y el audiolibro de {narrador.como_le_dicen}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Así va a quedar. Revisa la previsualización antes de confirmar.
        </p>

        <div className="mt-8">
          {previewListo ? (
            <div className="flex flex-col gap-6">
              <object
                data="/api/preview-pdf"
                type="application/pdf"
                className="h-96 w-full rounded-lg border border-zinc-200"
              >
                <p className="p-4 text-sm text-zinc-500">
                  Tu navegador no puede mostrar el PDF acá —{" "}
                  <a className="underline" href="/api/preview-pdf">
                    ábrelo en una pestaña nueva
                  </a>
                  .
                </p>
              </object>
              <div>
                <p className="mb-2 text-sm font-medium text-zinc-700">
                  Escucha una muestra de la voz
                </p>
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <audio controls src="/api/preview-audio" className="w-full" />
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
              Tu previsualización se está preparando… vuelve en un rato.
            </p>
          )}
        </div>

        <div className="mt-10 flex flex-col items-start gap-3 border-t border-zinc-100 pt-8">
          <p className="text-lg font-semibold text-zinc-900">{precio}</p>
          <p className="text-sm text-zinc-600">Libro impreso + audiolibro con su voz real.</p>
          <BotonComprar />
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

function EstadoAunNoListo({ comoLeDicen }: { comoLeDicen: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-16 text-center text-zinc-900">
      <p className="text-sm text-zinc-600">
        Todavía estamos armando el libro de {comoLeDicen}. Te avisamos apenas esté listo para
        comprar.
      </p>
    </div>
  );
}

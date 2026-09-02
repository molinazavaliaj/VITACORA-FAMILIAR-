import Link from "next/link";
import { redirect } from "next/navigation";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const MENSAJE_ERROR_CARGA = "No pudimos cargar tu descarga. Actualiza la página en un momento.";

type Familia = { id: string };
type Narrador = { id: string; como_le_dicen: string };
type AudiolibroPaths = { capitulos: string[]; bonus?: string; completo: string };
type Pedido = { id: string; estado: string; audiolibro_paths: AudiolibroPaths | null };

export default async function TableroDescarga() {
  const supabase = await crearClienteSesion();

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
    console.error("tablero/descarga: fallo la busqueda de familia", errorFamilia);
    return <EstadoError />;
  }

  if (!familia) {
    redirect("/registro");
  }

  const { data: narradores, error: errorNarradores } = await admin
    .from("narradores")
    .select("id, como_le_dicen")
    .eq("familia_id", (familia as Familia).id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (errorNarradores) {
    console.error("tablero/descarga: fallo la busqueda de narrador", errorNarradores);
    return <EstadoError />;
  }

  const narrador = (narradores as Narrador[] | null)?.[0];

  if (!narrador) {
    redirect("/registro");
  }

  const { data: pedidos, error: errorPedidos } = await admin
    .from("pedidos")
    .select("id, estado, audiolibro_paths")
    .eq("narrador_id", narrador.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (errorPedidos) {
    console.error("tablero/descarga: fallo la busqueda de pedido", errorPedidos);
    return <EstadoError />;
  }

  const pedido = (pedidos as Pedido[] | null)?.[0];

  if (!pedido) {
    return <SinPedido />;
  }

  if (pedido.estado === "pendiente") {
    return <PagoIncompleto />;
  }

  if (pedido.estado === "pagado" || pedido.estado === "generando") {
    return <EnFabricacion />;
  }

  if (pedido.estado === "fallido") {
    return <Fallido />;
  }

  if (pedido.estado === "entregado") {
    return (
      <Entregado comoLeDicen={narrador.como_le_dicen} audiolibroPaths={pedido.audiolibro_paths} />
    );
  }

  console.error("tablero/descarga: pedido en estado inesperado", pedido.estado);
  return <EstadoError />;
}

function Contenedor({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center bg-white px-6 py-16 text-zinc-900">
      <div className="w-full max-w-lg">{children}</div>
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

function SinPedido() {
  return (
    <Contenedor>
      <h1 className="text-2xl font-semibold text-zinc-900">Todavía no compraste el libro</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
        Cuando lo compres, tus descargas van a aparecer aquí.
      </p>
      <Link
        href="/comprar"
        className="mt-6 inline-block rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
      >
        Ir a comprar
      </Link>
    </Contenedor>
  );
}

function PagoIncompleto() {
  return (
    <Contenedor>
      <h1 className="text-2xl font-semibold text-zinc-900">Tu pago no se completó</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
        Puedes intentar de nuevo cuando quieras — no perdiste nada de lo ya armado.
      </p>
      <Link
        href="/comprar"
        className="mt-6 inline-block rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
      >
        Intentar de nuevo
      </Link>
    </Contenedor>
  );
}

function EnFabricacion() {
  return (
    <>
      {/* Nadie se queda mirando esta pantalla activamente — se refresca sola
          cada 60s hasta que el estado cambie a 'entregado' o 'fallido'. */}
      <meta httpEquiv="refresh" content="60" />
      <Contenedor>
        <h1 className="text-2xl font-semibold text-zinc-900">Estamos imprimiendo su historia</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Esto tarda unos minutos. Vuelve a esta página en un rato.
        </p>
      </Contenedor>
    </>
  );
}

function Fallido() {
  return (
    <Contenedor>
      <h1 className="text-2xl font-semibold text-zinc-900">Algo salió mal de nuestro lado</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">Estamos en ello.</p>
    </Contenedor>
  );
}

function Entregado({
  comoLeDicen,
  audiolibroPaths,
}: {
  comoLeDicen: string;
  audiolibroPaths: AudiolibroPaths | null;
}) {
  const capitulos = audiolibroPaths?.capitulos ?? [];
  const tieneBonus = Boolean(audiolibroPaths?.bonus);
  const tieneCompleto = Boolean(audiolibroPaths?.completo);

  return (
    <Contenedor>
      <h1 className="text-2xl font-semibold text-zinc-900">
        El libro y el audiolibro de {comoLeDicen}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
        Ya está listo. Queda aquí para siempre — vuelve cuando quieras.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        <a
          href="/api/descarga/libro"
          className="inline-block rounded-lg bg-zinc-900 px-5 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Descargar el libro (PDF)
        </a>
      </div>

      {tieneCompleto ? (
        <div className="mt-10 border-t border-zinc-100 pt-8">
          <p className="mb-2 text-sm font-medium text-zinc-700">Audiolibro completo</p>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls src="/api/descarga/audio/completo" className="w-full" />
          <a href="/api/descarga/audio/completo" className="mt-2 inline-block text-xs text-zinc-500 underline">
            Descargar
          </a>
        </div>
      ) : null}

      {capitulos.length > 0 ? (
        <div className="mt-8 flex flex-col gap-6">
          <p className="text-sm font-medium text-zinc-700">Por capítulo</p>
          {capitulos.map((_ruta, indice) => (
            <div key={indice}>
              <p className="mb-2 text-sm text-zinc-600">Capítulo {indice + 1}</p>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio controls src={`/api/descarga/audio/${indice}`} className="w-full" />
              <a
                href={`/api/descarga/audio/${indice}`}
                className="mt-2 inline-block text-xs text-zinc-500 underline"
              >
                Descargar
              </a>
            </div>
          ))}
        </div>
      ) : null}

      {tieneBonus ? (
        <div className="mt-8 border-t border-zinc-100 pt-8">
          <p className="mb-2 text-sm font-medium text-zinc-700">Mensajes para usted (saludos de la familia)</p>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls src="/api/descarga/audio/bonus" className="w-full" />
          <a href="/api/descarga/audio/bonus" className="mt-2 inline-block text-xs text-zinc-500 underline">
            Descargar
          </a>
        </div>
      ) : null}
    </Contenedor>
  );
}

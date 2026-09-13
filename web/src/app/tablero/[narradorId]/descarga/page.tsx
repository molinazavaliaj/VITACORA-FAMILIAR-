import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { historiaAccesible, PUEDE } from "@/lib/panel";
import { PasosDelLibro, VolverAlTablero } from "../../pasos";

const MENSAJE_ERROR_CARGA = "No pudimos cargar tu descarga. Actualiza la página en un momento.";

type Familia = { id: string };
type Narrador = { id: string; como_le_dicen: string };
type AudiolibroPaths = { capitulos: string[]; bonus?: string; completo: string };
type Pedido = { id: string; estado: string; audiolibro_paths: AudiolibroPaths | null };

export default async function TableroDescarga({ params }: PageProps<"/tablero/[narradorId]/descarga">) {
  const { narradorId } = await params;

  const supabase = await crearClienteSesion();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  const admin = crearClienteServidor();

  // Cualquiera con acceso a la historia entra y lee el libro en el lector
  // online; bajar el PDF y los audios es solo de la dueña (§2 y §5 del spec).
  const { historia, error: errorHistoria } = await historiaAccesible(admin, user, narradorId);
  if (errorHistoria) {
    console.error("tablero/descarga: fallo el acceso", errorHistoria);
    return <EstadoError />;
  }
  if (!historia) {
    notFound();
  }
  const narrador = historia.narrador;
  const puedeDescargar = PUEDE.descargar(historia.rol);

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
    return <SinPedido narradorId={narrador.id} />;
  }

  if (pedido.estado === "pendiente") {
    return <PagoIncompleto narradorId={narrador.id} />;
  }

  if (pedido.estado === "pagado" || pedido.estado === "generando") {
    return <EnFabricacion narradorId={narrador.id} />;
  }

  if (pedido.estado === "fallido") {
    return <Fallido narradorId={narrador.id} />;
  }

  if (pedido.estado === "entregado") {
    return (
      <Entregado
        narradorId={narrador.id}
        comoLeDicen={narrador.como_le_dicen}
        audiolibroPaths={pedido.audiolibro_paths}
        puedeDescargar={puedeDescargar}
      />
    );
  }

  console.error("tablero/descarga: pedido en estado inesperado", pedido.estado);
  return <EstadoError />;
}

function Contenedor({
  children,
  paso,
  narradorId,
}: {
  children: React.ReactNode;
  paso?: 4;
  narradorId: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center bg-white px-6 py-16 text-zinc-900">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col gap-4">
          <VolverAlTablero narradorId={narradorId} />
          {paso ? <PasosDelLibro actual={paso} /> : null}
        </div>
        {children}
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

function SinPedido({ narradorId }: { narradorId: string }) {
  return (
    <Contenedor narradorId={narradorId}>
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

function PagoIncompleto({ narradorId }: { narradorId: string }) {
  return (
    <Contenedor narradorId={narradorId}>
      <h1 className="text-2xl font-semibold text-zinc-900">Tu pago no se completó</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
        No perdiste nada de lo ya cargado. Escríbenos y te mandamos un enlace para
        terminar el pago sin volver a empezar.
      </p>
      {/* Volver al checkout público crearía OTRO narrador con el mismo WhatsApp.
          Hasta tener un "reintentar este pedido", la salida es el correo. */}
      <a
        href="mailto:hola@vitacorafamiliar.com?subject=Terminar%20el%20pago"
        className="mt-6 inline-block rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
      >
        Escribirnos
      </a>
    </Contenedor>
  );
}

function EnFabricacion({ narradorId }: { narradorId: string }) {
  return (
    <>
      {/* Nadie se queda mirando esta pantalla activamente — se refresca sola
          cada 60s hasta que el estado cambie a 'entregado' o 'fallido'. */}
      <meta httpEquiv="refresh" content="60" />
      <Contenedor paso={4} narradorId={narradorId}>
        <h1 className="text-2xl font-semibold text-zinc-900">Estamos imprimiendo su historia</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Esto tarda unos minutos. Vuelve a esta página en un rato.
        </p>
      </Contenedor>
    </>
  );
}

function Fallido({ narradorId }: { narradorId: string }) {
  return (
    <Contenedor narradorId={narradorId}>
      <h1 className="text-2xl font-semibold text-zinc-900">Algo salió mal de nuestro lado</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">Estamos en ello.</p>
    </Contenedor>
  );
}

function Entregado({
  comoLeDicen,
  audiolibroPaths,
  narradorId,
  puedeDescargar,
}: {
  narradorId: string;
  comoLeDicen: string;
  audiolibroPaths: AudiolibroPaths | null;
  puedeDescargar: boolean;
}) {
  const capitulos = audiolibroPaths?.capitulos ?? [];
  const tieneCompleto = Boolean(audiolibroPaths?.completo);

  return (
    <Contenedor paso={4} narradorId={narradorId}>
      <h1 className="text-2xl font-semibold text-zinc-900">
        El libro y el audiolibro de {comoLeDicen}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
        Ya está listo. Queda aquí para siempre — vuelve cuando quieras.
      </p>

      {/* El lector online: el libro.html que sube la fábrica, servido por la
          ruta firmada. `allow-scripts` porque el HTML pagina con su propio
          script; sin `allow-same-origin` el iframe no toca cookies ni la página. */}
      <div className="mt-8">
        <p className="mb-2 text-sm font-medium text-zinc-700">Leer el libro</p>
        <iframe
          title={`El libro de ${comoLeDicen}`}
          src={`/api/descarga/libro-html?narrador=${narradorId}`}
          sandbox="allow-scripts"
          className="h-[80vh] w-full rounded-lg border border-zinc-200 bg-white"
        />
      </div>

      {puedeDescargar ? (
        <div className="mt-8 flex flex-col gap-3">
          <a
            href={`/api/descarga/libro?narrador=${narradorId}`}
            className="inline-block rounded-lg bg-zinc-900 px-5 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Descargar el libro (PDF)
          </a>
        </div>
      ) : null}

      {tieneCompleto ? (
        <div className="mt-10 border-t border-zinc-100 pt-8">
          <p className="mb-2 text-sm font-medium text-zinc-700">Audiolibro completo</p>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls src={`/api/descarga/audio/completo?narrador=${narradorId}`} className="w-full" />
          {puedeDescargar ? (
            <a href={`/api/descarga/audio/completo?narrador=${narradorId}`} className="mt-2 inline-block text-xs text-zinc-500 underline">
              Descargar
            </a>
          ) : null}
        </div>
      ) : null}

      {capitulos.length > 0 ? (
        <div className="mt-8 flex flex-col gap-6">
          <p className="text-sm font-medium text-zinc-700">Por capítulo</p>
          {capitulos.map((_ruta, indice) => (
            <div key={indice}>
              <p className="mb-2 text-sm text-zinc-600">Capítulo {indice + 1}</p>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio controls src={`/api/descarga/audio/${indice}?narrador=${narradorId}`} className="w-full" />
              {puedeDescargar ? (
                <a
                  href={`/api/descarga/audio/${indice}?narrador=${narradorId}`}
                  className="mt-2 inline-block text-xs text-zinc-500 underline"
                >
                  Descargar
                </a>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

    </Contenedor>
  );
}

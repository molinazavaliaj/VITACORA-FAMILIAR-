import { notFound, redirect } from "next/navigation";
import { usuarioDeLaSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { esPropia, historiaAccesible, PUEDE } from "@/lib/panel";
import { textosPantallaDudas, type TextosPantallaDudas } from "@/lib/dudas-textos";
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
import { tratoDeLaFamilia } from "@/lib/trato";
import type { TratoComprador } from "@/lib/regalo-textos";
import { FormularioDudas, type DudaPrefill } from "./acciones";
import { VolverAlTablero } from "../../pasos";

// Las dudas del escritor V3 (CONTRATO, "Escritor V3 en la fábrica"). Al terminar
// la entrevista, la Etapa A deja lo que no pudo resolver de los audios: un nombre
// que se oye de dos formas, un año que no cierra. La familia lo contesta acá y la
// Etapa B lo usa al escribir el libro.
//
// No hay mail automático todavía (decisión del 12/10): los socios pasan el link.

const MENSAJE_ERROR_CARGA: Record<TratoComprador, string> = {
  vos: "No pudimos cargar las dudas. Actualizá la página en un momento.",
  tu: "No pudimos cargar las dudas. Actualiza la página en un momento.",
};

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

  const user = await usuarioDeLaSesion();
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
  // «Para mí»: la dueña compró el libro para sí. Le habla de lo que contó ella.
  const textos = textosPantallaDudas(esPropia(narrador) && historia.rol === "duena", narrador.como_le_dicen);
  // Vos o tú: el de la familia dueña de la historia.
  const trato = await tratoDeLaFamilia(admin, narrador.familia_id);

  // "No existe" es un estado (todavía no hay dudas); no poder leerlo es un error.
  const archivoDudas = await leerDelEscritor(admin, narrador.id, "dudas-familia.json");
  if (archivoDudas.error) {
    console.error("tablero/dudas: fallo la descarga de dudas-familia.json", archivoDudas.error);
    return <EstadoError trato={trato} />;
  }
  if (archivoDudas.texto === null) {
    return <EstadoSinDudas narradorId={narrador.id} textos={textos} />;
  }

  // Roto incluye un `dudas` que no es lista: la pantalla no se cae, dice que no pudo.
  const dudas = leerDudas(archivoDudas.texto);
  if (!dudas) {
    console.error("tablero/dudas: dudas-familia.json invalido");
    return <EstadoError trato={trato} />;
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
    return <EstadoError trato={trato} />;
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
          {textos.titulo}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--texto-suave)]">
          {textos.intro}
        </p>

        <AvisoDelPlazo estado={plazo.estado} venceAt={plazo.venceAt} zona={zona} trato={trato} />

        <div className="mt-8">
          <FormularioDudas
            dudas={conGuardadas}
            narradorId={narrador.id}
            soloLectura={plazo.estado === "libro_escrito"}
            trato={trato}
            textos={textos}
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
  trato,
}: {
  estado: "abierto" | "vencido" | "libro_escrito";
  venceAt: Date | null;
  zona: string;
  trato: TratoComprador;
}) {
  const tu = trato === "tu";
  if (estado === "libro_escrito") {
    return (
      <p className="mt-6 rounded-md border border-[var(--linea-fuerte)] px-4 py-3 text-sm leading-relaxed text-[var(--texto-suave)]">
        El libro ya está escrito, así que esto queda como estaba. Si algo salió mal, {tu ? "escríbenos" : "escribinos"} a{" "}
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
        El plazo ya pasó, pero el libro todavía no se escribió. Si {tu ? "contestas" : "contestás"} ahora, todavía puede
        entrar.
      </p>
    );
  }
  if (!venceAt) return null;
  const cuando = fechaDelPlazo(venceAt, zona);
  return (
    <p className="mt-6 rounded-md border border-[var(--linea-fuerte)] px-4 py-3 text-sm leading-relaxed text-[var(--texto-suave)]">
      {tu ? "Contesta" : "Contestá"} antes del {cuando}. Lo que llegue después puede quedar afuera del libro.
    </p>
  );
}

function EstadoError({ trato = "vos" }: { trato?: TratoComprador }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[var(--fondo)] px-6 py-16 text-center text-[var(--texto)]">
      <p className="text-sm text-[var(--texto-suave)]">{MENSAJE_ERROR_CARGA[trato]}</p>
    </div>
  );
}

function EstadoSinDudas({ textos, narradorId }: { textos: TextosPantallaDudas; narradorId: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[var(--fondo)] px-6 py-16 text-center text-[var(--texto)]">
      <p className="text-sm text-[var(--texto-suave)]">
        {textos.sinDudas}
      </p>
      <div className="mt-6">
        <VolverAlTablero narradorId={narradorId} />
      </div>
    </div>
  );
}

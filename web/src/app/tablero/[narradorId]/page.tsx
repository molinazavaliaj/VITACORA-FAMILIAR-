import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { usuarioDeLaSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { esPropia, historiaAccesible, historiasDelUsuario, PUEDE, tratoEditable, type NarradorPanel, type Rol } from "@/lib/panel";
import { tratoDeLaFamilia } from "@/lib/trato";
import { hayDudasPendientes } from "@/lib/dudas-archivos";
import { textoDudas } from "../proximo-paso";
import { ADAPTATIVAS, armarGuion, lugarLibre, puedeSaltar, validarRitmo, type PreguntaGuion, type Ritmo, objetosDelGuion } from "@/lib/guion";
import { BannerAlertaSilencio, CierreAnticipado } from "../acciones";
import { AgregarPregunta, Ajustes, EditorGuion, SubirFoto, SugerirPreguntas } from "./preguntas/acciones";
import { GaleriaCapitulo, type FotoVista } from "./fotos";
import { Compartir, type InvitadoVista } from "./compartir";
import { CerrarEdicion, ReabrirEdicion } from "./cerrar-edicion";
import { HistoriaViaje } from "./viaje";
import { HistoriaV3 } from "./v3";
import { PanelKids } from "./kids";
import { esKids } from "@/lib/kids-panel";
import { leerPanelKids } from "@/lib/kids-panel-base";
import { entrevistaV3, historiaV3, llegoAlFinalV3, preguntasDeLaFamiliaV3, respuestasFuera, type FilaHistoriaV3, type FilaPreguntaFamiliaV3 } from "@/lib/v3";
import { puedeVolverAPreguntar } from "@/lib/fuera-del-libro";
import { viajeDelContexto } from "@/lib/viaje";
import { type CapituloRiel } from "../riel";
import { firmarTokenLibro } from "@/lib/token-libro";
import { armarMuestra } from "@/lib/muestra";
import { VistaMuestra } from "../../muestra";
import { ReproductorRespuesta } from "../reproductor";
import { idiomaDelLibro } from "@/lib/tapa";
import { urlWhatsAppDudas } from "@/lib/whatsapp-dudas";
import type { TratoComprador } from "@/lib/regalo-textos";
import { CONTACTO } from "../../legal/titulares";
import { idiomaDelTrato, PANEL, type Quien } from "../../_textos/panel";
import { MarcoHistoria } from "../_historia/marco";
import { CifrasHistoria, PortadaHistoria } from "../_historia/portada";
import { EnlaceDudas, HojaFamilia, HojaFotos, HojaPedido, HojaUltimo, HojaWhatsApp, TarjetaMarco } from "../_historia/lateral";
import { CambiarFecha } from "../_historia/fecha";
import { fechaCambiable, type RegaloConFecha } from "@/lib/regalo-fecha";
import { leerPedido, type DatosPedido } from "../_historia/pedido";
import { vozClasica, vozV3, vozViaje, type ResumenVoz } from "../_historia/voz";
import { CabeceraHueca, CuerpoHueco, HojaHueca } from "../esqueleto";
import { esElla, lineaDeTiempo, momentoDe, primerNombre, titularDe } from "../momento";
import {
  Contenedor,
  estadoEnHumano,
  EstadoError,
  Etiqueta,
  ProximoPaso,
  Respuesta,
  Titulo,
  fechaCorta,
  type RespuestaVista,
} from "../ui";

// Una historia (docs/panel-usuario.md §5 y §15.3). Rediseño 2026-10 (fase 2):
// arriba su libro (la tapa, el saludo, la línea de tiempo), a la izquierda lo
// contado y a la derecha las hojas del lateral (lo último que contó, sus
// fotos, la familia, tu pedido). Lo contado sigue siendo lo de siempre, en sus
// tres formas: el guion clásico (abajo, en esta página: el guion completo por
// capítulo, con ?editar=1 para editar las que vienen), la entrevista V3
// (v3.tsx) y el viaje (viaje.tsx).
//
// Rendimiento (RENDIMIENTO.md P2, 3.14): todas las consultas salen juntas al
// principio, como antes, pero la página ya no espera a todas para pintar. La
// cabecera (dos consultas cortas) llega primero; lo contado, lo último que
// contó, sus fotos y el pedido llegan cada uno en su Suspense apenas está lo
// suyo. Ninguna consulta nueva va en serie.

const MINIMO_RESPUESTAS_CIERRE_ANTICIPADO = 10;
const ESTADOS_QUE_PERMITEN_CIERRE = ["activo", "pausado"];
const ESTADOS_CERRADOS = ["completado", "cerrado_anticipado"];

type Pregunta = PreguntaGuion & { narrador_id: string | null };

type FilaNarrador = {
  contexto?: Record<string, unknown>;
  libro_aprobado_at?: string | null;
  edicion?: { historiaCerradaEl?: string | null; portadaFotoId?: string | null; titulo?: string } | null;
  zona_horaria?: string | null;
  hora_preferida?: string | null;
  telefono_whatsapp?: string | null;
};

const botonBarra = "inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-[14px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 [font-family:var(--fuente-micro)] [touch-action:manipulation]";
const botonBarraSec = `${botonBarra} border border-[var(--linea-fuerte)] text-[var(--texto)] hover:bg-[var(--hueco)] focus-visible:outline-[var(--texto)]`;
const botonBarraPri = `${botonBarra} bg-[var(--acento)] text-[var(--sobre-acento)] hover:opacity-90 focus-visible:outline-[var(--acento)]`;

function IconoBarra({ nombre }: { nombre: "lapiz" | "foto" | "check" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {nombre === "lapiz" ? <path d="M4 20h4l10.5-10.5a1.5 1.5 0 0 0 0-2.1l-1.9-1.9a1.5 1.5 0 0 0-2.1 0L4 16zM13 7l4 4" /> : null}
      {nombre === "foto" ? <><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M20 15l-4.5-4.5L8 18" /></> : null}
      {nombre === "check" ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : null}
    </svg>
  );
}

type LecturaV3 = {
  v3: Awaited<ReturnType<typeof entrevistaV3>>;
  filasV3: unknown[] | null;
  /** Las respuestas que la dueña sacó del libro (respuestas_fuera, 21/10). */
  fuera?: Set<string>;
  e4: { message: string } | null;
  /** entrevistaV3 tiró: la página muestra el error, salvo en un viaje (que no la mira). */
  fallo?: unknown;
};

/** La entrevista V3 y, si hay, sus respuestas en el orden en que llegaron. Nunca rechaza. */
async function leerV3(admin: SupabaseClient, narradorId: string): Promise<LecturaV3> {
  let v3: Awaited<ReturnType<typeof entrevistaV3>>;
  try {
    v3 = await entrevistaV3(admin, narradorId);
  } catch (e) {
    return { v3: null, filasV3: null, e4: null, fallo: e };
  }
  if (!v3) return { v3, filasV3: null, e4: null };
  const [{ data, error }, fuera] = await Promise.all([
    admin
      .from("respuestas")
      .select("id, clave_v3, audio_path, transcripcion, texto_directo, duracion_segundos, recibido_at, reservada, reservado_tramo")
      .eq("narrador_id", narradorId)
      .order("recibido_at", { ascending: true }),
    respuestasFuera(admin, narradorId).catch((e: unknown) => e as Error),
  ]);
  if (fuera instanceof Error) return { v3, filasV3: null, e4: { message: fuera.message } };
  return { v3, filasV3: data, fuera, e4: error };
}

/** "22 de septiembre" desde YYYY-MM-DD, sin que la zona del servidor corra el día (como en viaje.tsx). */
function fechaLarga(ymd: string): string {
  return new Date(`${ymd}T00:00:00Z`).toLocaleDateString("es", { day: "numeric", month: "long", timeZone: "UTC" });
}

export default async function PaginaHistoria({ params, searchParams }: PageProps<"/tablero/[narradorId]">) {
  const { narradorId } = await params;
  const { editar, sobre } = await searchParams;

  const user = await usuarioDeLaSesion();
  if (!user) redirect("/entrar");

  const admin = crearClienteServidor();
  const { historia, error } = await historiaAccesible(admin, user, narradorId);
  if (error) {
    console.error("historia: fallo el acceso", error);
    return <EstadoError />;
  }
  if (!historia) notFound();

  const { narrador: n, rol } = historia;
  const propia = esPropia(n); // "para mí": el panel le habla de vos

  // Vitácora Kids (K5, 15/10): si el narrador tiene fila en kids_v2, va su panel en lugar del de
  // biografía, y solo para quien compró. Se pregunta solo cuando la compra lo marcó
  // (contexto.modo = "kids"): una biografía no hace ninguna consulta de más. Sin la tabla
  // (migración sin aplicar), sigue como hoy.
  if (esKids(n)) {
    const { vista, error: errorKids } = await leerPanelKids(admin, n.id);
    if (errorKids) {
      console.error("historia: fallo la carga de kids", errorKids);
      return <EstadoError />;
    }
    if (vista) {
      if (rol !== "duena") notFound();
      return <PanelKids n={n} fila={vista.fila} capitulos={vista.capitulos} libro={vista.libro} />;
    }
  }

  // El visitante (guardó el link del libro cerrado) ve la muestra, no la historia.
  if (!PUEDE.verHistoriaCompleta(rol)) {
    const muestra = await armarMuestra(admin, n.id);
    return (
      <Contenedor>
        <Etiqueta>Lo guardaste · La historia de {n.nombre}</Etiqueta>
        <div className="mt-1">
          <Titulo>La historia de {n.nombre}</Titulo>
        </div>
        {muestra ? (
          <>
            <div className="mt-8">
              <VistaMuestra muestra={muestra} urlAudio={`/api/preview-audio?narrador=${n.id}`} urlPortada={muestra.portadaFotoId ? `/api/fotos/${muestra.portadaFotoId}` : null} />
            </div>
            <div className="mt-10">
              <ProximoPaso href={`/tablero/${n.id}/libro`}>Pedir mi copia impresa</ProximoPaso>
            </div>
          </>
        ) : (
          <p className="mt-6 text-[15px] text-[var(--texto-suave)]">Este libro todavía no está cerrado.</p>
        )}
      </Contenedor>
    );
  }

  // Todas las consultas salen ahora, juntas; cada parte de la página espera solo lo suyo.
  const pFila: Promise<FilaNarrador> = Promise.resolve(
    admin.from("narradores").select("contexto, libro_aprobado_at, edicion, zona_horaria, hora_preferida, telefono_whatsapp").eq("id", n.id).maybeSingle(),
  ).then((r) => (r.data as FilaNarrador | null) ?? {}, () => ({}));
  // Los textos del panel van con el trato de la familia dueña de la historia.
  const pTrato = tratoDeLaFamilia(admin, n.familia_id);
  const pPedido = leerPedido(admin, n);
  // La fecha de inicio de un regalo sin abrir (arreglos chicos): solo la dueña
  // y solo en regalo_pendiente, así que casi nunca consulta. `*`: las columnas
  // de la entrega llegaron con otra migración. Si falla, la fila no sale.
  const pRegalo: Promise<RegaloConFecha | null> =
    rol === "duena" && n.estado === "regalo_pendiente"
      ? Promise.resolve(admin.from("regalos").select("*").eq("narrador_id", n.id).maybeSingle()).then(
          (r) => (r.error ? null : ((r.data as RegaloConFecha | null) ?? null)),
          () => null,
        )
      : Promise.resolve(null);
  // Tolerante: la tabla la crea la migración del 12/09; sin ella, no hay fotos.
  const pFotos: Promise<FotoVista[]> = Promise.resolve(
    admin.from("fotos").select("id, capitulo, epigrafe, principal, orden, subida_por").eq("narrador_id", n.id).order("principal", { ascending: false }).order("orden"),
  ).then((r) => (r.data as FotoVista[] | null) ?? [], () => []);
  const pInvitados: Promise<(InvitadoVista & { rol?: string })[]> =
    rol === "duena"
      ? Promise.resolve(admin.from("invitados").select("id, email, aceptado_at, rol").eq("narrador_id", n.id).order("created_at")).then(
          (r) => (r.data as (InvitadoVista & { rol?: string })[] | null) ?? [],
          () => [],
        )
      : Promise.resolve([]);
  // Terminó de contar y el escritor dejó dudas sin contestar (13/10). Solo depende del rol y del estado.
  const pDudas: Promise<boolean> =
    PUEDE.contestarDudas(rol) && ESTADOS_CERRADOS.includes(n.estado) ? hayDudasPendientes(admin, n.id).catch(() => false) : Promise.resolve(false);
  const pLectura = leerHistoria({ admin, user, n, rol, propia, editar, sobre, pFila, pFotos, pInvitados, pDudas, pTrato });

  const contexto = (n.contexto ?? {}) as Record<string, unknown>;
  const quien: Quien = { como: n.como_le_dicen, propia, ella: esElla(contexto), viaje: contexto.modo === "viaje" && Boolean(contexto.viaje) };
  const contacto = { whatsapp: urlWhatsAppDudas(), correo: CONTACTO.hola };

  return (
    <MarcoHistoria
      producto={quien.viaje ? "viaje" : undefined}
      cabecera={
        <Suspense fallback={<CabeceraHueca />}>
          <Cabecera admin={admin} user={user} n={n} rol={rol} quien={quien} pFila={pFila} pPedido={pPedido} pTrato={pTrato} pLectura={pLectura} />
        </Suspense>
      }
      arriba={
        <Suspense fallback={<HojaHueca />}>
          <LateralArriba n={n} rol={rol} quien={quien} pFila={pFila} pFotos={pFotos} pTrato={pTrato} pLectura={pLectura} />
        </Suspense>
      }
      cuerpo={
        <Suspense fallback={<CuerpoHueco />}>
          <Cuerpo pLectura={pLectura} />
        </Suspense>
      }
      abajo={
        <Suspense fallback={<HojaHueca />}>
          <LateralAbajo n={n} rol={rol} quien={quien} pFila={pFila} pPedido={pPedido} pRegalo={pRegalo} pTrato={pTrato} pLectura={pLectura} contacto={contacto} />
        </Suspense>
      }
    />
  );
}

// ── Las partes, cada una en su Suspense ───────────────────────────────────

async function Cabecera({
  admin, user, n, rol, quien, pFila, pPedido, pTrato, pLectura,
}: {
  admin: SupabaseClient; user: User; n: NarradorPanel; rol: Rol; quien: Quien;
  pFila: Promise<FilaNarrador>; pPedido: Promise<DatosPedido>; pTrato: Promise<TratoComprador>; pLectura: Promise<Lectura>;
}) {
  // historiasDelUsuario ya está en la memoria del request (la cargó el layout): no consulta.
  const [fila, pedido, trato, { panel }] = await Promise.all([pFila, pPedido, pTrato, historiasDelUsuario(admin, user)]);
  const idioma = idiomaDelTrato(trato);
  const aprobado = Boolean(fila.libro_aprobado_at);
  const edicion = fila.edicion ?? {};
  const portada = edicion.portadaFotoId ?? null;
  const contexto = fila.contexto ?? n.contexto ?? {};
  return (
    <PortadaHistoria
      idioma={idioma}
      quien={quien}
      // «Hola, Laura.»: solo a quien compró (un invitado no es Laura).
      hola={rol === "duena" ? primerNombre(panel.familia?.nombre) : null}
      titular={titularDe(n.estado, aprobado, pedido.libroEntregado)}
      estado={estadoEnHumano(n.estado, quien.propia || (quien.viaje && rol === "duena"), trato)}
      tapa={{
        titulo: edicion.titulo?.trim() || n.nombre,
        fotoSrc: portada ? `/api/fotos/${portada}` : null,
        idioma: idiomaDelLibro(contexto.idioma === "ca" ? "ca" : null),
      }}
      pasos={lineaDeTiempo({ estado: n.estado, aprobado, libroEntregado: pedido.libroEntregado, conImpreso: rol === "duena" && pedido.impresos > 0, impresoEnCasa: pedido.impresoEnCasa })}
      cifras={
        <Suspense fallback={null}>
          <Cifras pLectura={pLectura} idioma={idioma} quien={quien} />
        </Suspense>
      }
      hrefTapa={rol === "duena" ? `/tablero/${n.id}/libro` : undefined}
    />
  );
}

async function Cifras({ pLectura, idioma, quien }: { pLectura: Promise<Lectura>; idioma: ReturnType<typeof idiomaDelTrato>; quien: Quien }) {
  const { voz } = await pLectura;
  return voz ? <CifrasHistoria idioma={idioma} quien={quien} respuestas={voz.respuestas} segundos={voz.segundos} /> : null;
}

async function Cuerpo({ pLectura }: { pLectura: Promise<Lectura> }) {
  return (await pLectura).cuerpo;
}

async function LateralArriba({
  n, rol, quien, pFila, pFotos, pTrato, pLectura,
}: {
  n: NarradorPanel; rol: Rol; quien: Quien;
  pFila: Promise<FilaNarrador>; pFotos: Promise<FotoVista[]>; pTrato: Promise<TratoComprador>; pLectura: Promise<Lectura>;
}) {
  const [fila, fotos, trato, lectura] = await Promise.all([pFila, pFotos, pTrato, pLectura]);
  const idioma = idiomaDelTrato(trato);
  const aprobado = Boolean(fila.libro_aprobado_at);
  const momento = momentoDe(n.estado, aprobado);
  const portada = fila.edicion?.portadaFotoId ?? null;
  return (
    <>
      {momento === "antes" && rol === "duena" ? (
        <HojaWhatsApp idioma={idioma} quien={quien} telefono={fila.telefono_whatsapp ?? null} hrefTarjeta={n.estado === "regalo_pendiente" ? `/tablero/${n.id}/regalo` : undefined} />
      ) : null}
      {lectura.voz ? <HojaUltimo idioma={idioma} quien={quien} ultimas={lectura.voz.ultimas} hrefTodo="#lo-contado" ahora={new Date()} /> : null}
      {!aprobado ? (
        <HojaFotos
          idioma={idioma}
          quien={quien}
          fotos={fotos}
          hayPortada={Boolean(portada)}
          subir={lectura.subirFoto ?? undefined}
          hrefTapa={rol === "duena" ? `/tablero/${n.id}/libro` : undefined}
        />
      ) : null}
    </>
  );
}

async function LateralAbajo({
  n, rol, quien, pFila, pPedido, pRegalo, pTrato, pLectura, contacto,
}: {
  n: NarradorPanel; rol: Rol; quien: Quien;
  pFila: Promise<FilaNarrador>; pPedido: Promise<DatosPedido>; pRegalo: Promise<RegaloConFecha | null>; pTrato: Promise<TratoComprador>; pLectura: Promise<Lectura>;
  contacto: { whatsapp: string | null; correo: string };
}) {
  const [fila, pedido, regalo, trato, lectura] = await Promise.all([pFila, pPedido, pRegalo, pTrato, pLectura]);
  const idioma = idiomaDelTrato(trato);
  const T = PANEL[idioma];
  const momento = momentoDe(n.estado, Boolean(fila.libro_aprobado_at));
  const conMarco = rol === "duena" && pedido.impresos > 0 && pedido.marcos === 0;
  return (
    <>
      {lectura.familia ? (
        <HojaFamilia idioma={idioma} quien={quien}>
          {lectura.familia}
        </HojaFamilia>
      ) : null}
      {rol === "duena" ? (
        <HojaPedido
          idioma={idioma}
          quien={quien}
          momento={momento}
          lineas={{ impresos: pedido.impresos, marcos: pedido.marcos }}
          hrefDireccion={pedido.direccionEditable ? `/tablero/${n.id}/libro#envio` : undefined}
          fecha={
            fechaCambiable(n.estado, regalo) ? (
              <CambiarFecha
                narradorId={n.id}
                fecha={regalo.fecha_entrega}
                textos={{ fila: T.cambiarFecha, titulo: T.cambiarFecha, texto: T.fechaTexto, campo: T.fechaCampo, guardar: T.guardarFecha, guardando: T.guardando, guardado: T.guardado, cerrar: T.cerrarHoja, error: T.errorFecha }}
              />
            ) : undefined
          }
          contacto={contacto}
          cierre={lectura.cierre ?? undefined}
        />
      ) : null}
      {conMarco ? <TarjetaMarco idioma={idioma} quien={quien} href={`/tablero/${n.id}/libro`} /> : null}
      <EnlaceDudas idioma={idioma} contacto={contacto} />
    </>
  );
}

// ── Lo contado ──────────────────────────────────────────────────────────

type Lectura = {
  cuerpo: ReactNode;
  /** Respuestas, minutos y lo último que contó, sacados de lo mismo que se muestra. Null si falló la carga. */
  voz: ResumenVoz | null;
  /** El botón de subir fotos (va a «Sus fotos»), si puede. */
  subirFoto: ReactNode | null;
  /** Compartir (va a «La familia»), si puede invitar. */
  familia: ReactNode | null;
  /** El cierre anticipado (va a «Tu pedido», adentro de «Pausar o cerrar»), si se puede. */
  cierre: ReactNode | null;
};

/**
 * Lee todo lo contado y arma su vista (clásica, V3 o viaje). Es lo mismo que
 * hacía esta página antes del rediseño, con las mismas consultas en la misma
 * ronda; ahora devuelve las piezas en vez de la página entera. Nunca rechaza.
 */
async function leerHistoria({
  admin, user, n, rol, propia, editar, sobre, pFila, pFotos, pInvitados, pDudas, pTrato,
}: {
  admin: SupabaseClient; user: User; n: NarradorPanel; rol: Rol; propia: boolean;
  editar: string | string[] | undefined; sobre: string | string[] | undefined;
  pFila: Promise<FilaNarrador>; pFotos: Promise<FotoVista[]>; pInvitados: Promise<(InvitadoVista & { rol?: string })[]>;
  pDudas: Promise<boolean>; pTrato: Promise<TratoComprador>;
}): Promise<Lectura> {
  const sinNada = { voz: null, subirFoto: null, familia: null, cierre: null };
  try {
    return await armarLectura({ admin, user, n, rol, propia, editar, sobre, pFila, pFotos, pInvitados, pDudas, pTrato });
  } catch (e) {
    console.error("historia: fallo la carga", e);
    return { cuerpo: <EstadoError trato={await pTrato.catch(() => "vos" as const)} />, ...sinNada };
  }
}

async function armarLectura({
  admin, user, n, rol, propia, editar, sobre, pFila, pFotos, pInvitados, pDudas, pTrato,
}: Parameters<typeof leerHistoria>[0]): Promise<Lectura> {
  const [
    { data: propias, error: e1 },
    { data: globales, error: e2 },
    { data: respuestas, error: e3 },
    fotosData,
    invitadosData,
    fila,
    { panel },
    tratoPanel,
    dudasPendientes,
    lecturaV3,
  ] = await Promise.all([
    admin.from("preguntas").select("id, orden, texto, capitulo, tipo, foto_id, narrador_id").eq("narrador_id", n.id),
    admin.from("preguntas").select("id, orden, texto, capitulo, tipo, narrador_id").is("narrador_id", null),
    admin
      .from("respuestas")
      .select("id, pregunta_orden, audio_path, texto_directo, transcripcion, duracion_segundos, es_repregunta, recibido_at")
      .eq("narrador_id", n.id)
      .order("pregunta_orden", { ascending: true })
      .order("recibido_at", { ascending: true }),
    pFotos,
    pInvitados,
    pFila,
    historiasDelUsuario(admin, user),
    pTrato,
    pDudas,
    // Entrevista V3 y sus respuestas, también en esta ronda (RENDIMIENTO.md §3.4).
    // Las respuestas V3 se piden solo si hay entrevista V3 (encadenadas acá
    // adentro): así una historia vieja no baja dos veces sus respuestas. El
    // error no corta acá: en un viaje no se mira la V3, igual que antes.
    leerV3(admin, n.id),
  ]);

  const error = () => ({ cuerpo: <EstadoError trato={tratoPanel} />, voz: null, subirFoto: null, familia: null, cierre: null });
  if (e1 || e2 || e3) {
    console.error("historia: fallo la carga", { e1, e2, e3 });
    return error();
  }

  // La hora de la pregunta (3t.23): la base guarda "HH:MM:SS"; el panel muestra "HH:MM".
  const horario = fila.hora_preferida && fila.zona_horaria ? { hora: fila.hora_preferida.slice(0, 5), zona: fila.zona_horaria } : undefined;
  const aprobado = Boolean(fila.libro_aprobado_at);
  // "Cerrar edición del libro" (17/09): la historia terminó y la familia dio por
  // cerrada esta etapa. Reversible; lo definitivo sigue siendo `libro_aprobado_at`.
  const historiaCerrada = Boolean(fila.edicion?.historiaCerradaEl);
  // El aviso que lleva a la pantalla de dudas (13/10): la dueña y los invitados, mientras el libro no esté escrito
  // (aunque ya lo hayan encargado: el libro espera las respuestas). Invitar, solo con el libro sin cerrar.
  const dudasAbiertas = dudasPendientes && rol === "duena" && !aprobado;
  const urlBase = process.env.URL_BASE ?? "https://www.vitacorafamiliar.com";
  const linkPublico = rol === "duena" && aprobado ? `${urlBase}/libro/${firmarTokenLibro(n.id)}` : null;
  // Los que guardaron el link no cuentan como invitados en la lista de Compartir.
  const soloInvitados = invitadosData.filter((i) => i.rol !== "visitante");
  const cerrado = ESTADOS_CERRADOS.includes(n.estado);

  const contexto = fila.contexto ?? {};
  const ella = esElla(contexto);
  const ritmo: Ritmo = validarRitmo(contexto.ritmo) ? contexto.ritmo : contexto.modoRapido === true ? "seguido" : "diario";
  const evitar = typeof contexto.evitar === "string" ? contexto.evitar : "";
  // Lo que el biógrafo le mandó de verdad (entrevistador, 14/09): la pregunta
  // preparada del día y la repregunta. Viven en contexto, provisorio (CONTRATO.md).
  const preguntasEnviadas = (contexto.preguntasEnviadas ?? {}) as Record<string, string>;
  const repreguntasEnviadas = (contexto.repreguntasEnviadas ?? {}) as Record<string, string>;
  // El trato (3t.22): se ve siempre; se cambia solo hasta la primera pregunta.
  const trato = {
    valor: (contexto.trato === "usted" || contexto.trato === "vos" ? contexto.trato : null) as "usted" | "vos" | null,
    editable: tratoEditable(n),
  };
  const historiasRiel = panel.historias.map((h) => ({ id: h.narrador.id, nombre: h.narrador.nombre, rol: h.rol, estado: h.narrador.estado, propia: esPropia(h.narrador) }));

  // Las piezas que van al lateral: Compartir (la familia), subir fotos, el cierre anticipado.
  const deshabilitarCompartir = historiaCerrada && !aprobado && !dudasAbiertas;
  const familia = PUEDE.invitar(rol) ? (
    <span className={deshabilitarCompartir ? "pointer-events-none opacity-50" : ""} aria-disabled={deshabilitarCompartir ? true : undefined}>
      <Compartir narradorId={n.id} nombre={n.nombre} cerrado={cerrado} aprobado={aprobado} dudasAbiertas={dudasAbiertas} linkPublico={linkPublico} invitados={soloInvitados} trato={tratoPanel} />
    </span>
  ) : null;
  // Las fotos siguen entrando después de terminar — hasta cerrar la edición
  // acá o el libro en Encargar libro (Joaquín, 17/09: es donde se ve cómo queda).
  const puedeAgregarFotos = !aprobado && !historiaCerrada && PUEDE.agregarPreguntasYFotos(rol);
  const subir = (capitulos: string[]) =>
    puedeAgregarFotos ? (
      <SubirFoto narradorId={n.id} capitulos={capitulos} variante="barra" trato={tratoPanel} paraTapa={rol === "duena" && !fila.edicion?.portadaFotoId}>
        <IconoBarra nombre="foto" />
        Agregar fotos
      </SubirFoto>
    ) : null;
  const cierre = (contadas: number) =>
    rol === "duena" && ESTADOS_QUE_PERMITEN_CIERRE.includes(n.estado) && contadas >= MINIMO_RESPUESTAS_CIERRE_ANTICIPADO ? <CierreAnticipado narradorId={n.id} trato={tratoPanel} /> : null;

  // Vitácora de Viaje V2 (16/10): otra pantalla, mínima (viaje.tsx). Sin
  // guion ni etapas: lo contado en orden de llegada y las fotos. Las fechas se
  // corren desde acá solo mientras el bot no creó su fila en `viajes_v2`.
  const viaje = viajeDelContexto(contexto);
  if (viaje) {
    const lista = (respuestas as RespuestaVista[] | null) ?? [];
    const voz = vozViaje(lista, (r) => fechaLarga(r.recibido_at.slice(0, 10)));
    let puedeCambiarFechas = false;
    if (rol === "duena" && !cerrado) {
      const { data: filaV2, error: errorV2 } = await admin.from("viajes_v2").select("narrador_id").eq("narrador_id", n.id).maybeSingle();
      puedeCambiarFechas = !filaV2 && (!errorV2 || errorV2.code === "42P01" || errorV2.code === "PGRST205");
    }
    return {
      cuerpo: (
        <HistoriaViaje
          n={n}
          rol={rol}
          viaje={viaje}
          respuestas={lista}
          fotos={fotosData}
          usuarioId={user.id}
          aprobado={aprobado}
          historiaCerrada={historiaCerrada}
          puedeCambiarFechas={puedeCambiarFechas}
          trato={tratoPanel}
        />
      ),
      voz,
      subirFoto: subir([]),
      familia,
      cierre: cierre(voz.respuestas),
    };
  }

  // Entrevista V3 (WhatsApp, 10/10): otra pantalla. Sin guion de 30 ni capítulos: lo que se le preguntó y lo
  // que contestó, por bloque (lib/v3.ts).
  if ("fallo" in lecturaV3) {
    console.error("historia: fallo la lectura V3", lecturaV3.fallo);
    return error();
  }
  const { v3, filasV3, e4, fuera } = lecturaV3;
  if (v3) {
    if (e4) {
      console.error("historia: fallo la carga V3", e4);
      return error();
    }
    const bloques = historiaV3(v3.estado, (filasV3 as FilaHistoriaV3[] | null) ?? [], fuera);
    const alFinal = llegoAlFinalV3(v3.estado);
    const preguntasDeFamilia = ((propias as FilaPreguntaFamiliaV3[] | null) ?? []).filter((p) => p.tipo === "familia").length;
    const voz = vozV3(bloques);
    return {
      cuerpo: (
        <HistoriaV3
          enMarco
          n={n}
          rol={rol}
          propia={propia}
          bloques={bloques}
          preguntasFamilia={preguntasDeLaFamiliaV3(v3.estado, (propias as FilaPreguntaFamiliaV3[] | null) ?? [])}
          fotos={fotosData}
          usuarioId={user.id}
          historiasRiel={historiasRiel}
          aprobado={aprobado}
          historiaCerrada={historiaCerrada}
          linkPublico={linkPublico}
          invitados={soloInvitados}
          dudasAbiertas={dudasAbiertas}
          dudasPendientes={dudasPendientes}
          ritmo={ritmo}
          horario={horario}
          alFinal={alFinal}
          puedeVolverAPreguntar={puedeVolverAPreguntar({ estadoNarrador: n.estado, alFinal, preguntasFamilia: preguntasDeFamilia })}
          trato={tratoPanel}
        />
      ),
      voz,
      subirFoto: subir([]),
      familia,
      cierre: cierre(voz.respuestas),
    };
  }

  // El guion del narrador: sus filas propias; si todavía no tiene (anterior a la
  // migración), la plantilla global. Las propias siempre pisan a la global del mismo orden.
  const guion = armarGuion(globales as Pregunta[] | null, propias as Pregunta[] | null);
  // «Sus objetos preciados» (3t.30): van aparte, no son parte del recorrido.
  const objetos = objetosDelGuion(globales as Pregunta[] | null, propias as Pregunta[] | null);
  const porOrden = new Map(guion.map((p) => [p.orden, p]));
  const listaRespuestas = (respuestas as RespuestaVista[] | null) ?? [];
  const voz = vozClasica(listaRespuestas, (o) => preguntasEnviadas[String(o)] ?? porOrden.get(o)?.texto ?? null);

  return {
    cuerpo: (
      <HistoriaClasica
        n={n}
        rol={rol}
        propia={propia}
        ella={ella}
        editar={editar}
        sobre={sobre}
        guion={guion}
        objetos={objetos}
        respuestas={listaRespuestas}
        fotos={fotosData}
        usuarioId={user.id}
        aprobado={aprobado}
        historiaCerrada={historiaCerrada}
        dudasAbiertas={dudasAbiertas}
        dudasPendientes={dudasPendientes}
        cerrado={cerrado}
        preguntasEnviadas={preguntasEnviadas}
        repreguntasEnviadas={repreguntasEnviadas}
        ritmo={ritmo}
        evitar={evitar}
        horario={horario}
        trato={trato}
        pedirFotos={contexto.sinFotos !== true}
        tratoPanel={tratoPanel}
      />
    ),
    voz,
    subirFoto: subir([...new Set(guion.map((p) => p.capitulo))]),
    familia,
    cierre: cierre(voz.respuestas),
  };
}

/** El guion clásico, por capítulo (lo que era esta página antes de V3), sin riel ni título: va adentro del marco. */
function HistoriaClasica({
  n, rol, propia, ella, editar, sobre, guion, objetos, respuestas, fotos, usuarioId, aprobado, historiaCerrada, dudasAbiertas, dudasPendientes, cerrado,
  preguntasEnviadas, repreguntasEnviadas, ritmo, evitar, horario, trato, pedirFotos, tratoPanel,
}: {
  n: NarradorPanel; rol: Rol; propia: boolean; ella: boolean;
  editar: string | string[] | undefined; sobre: string | string[] | undefined;
  guion: Pregunta[]; objetos: Pregunta[]; respuestas: RespuestaVista[]; fotos: FotoVista[]; usuarioId: string;
  aprobado: boolean; historiaCerrada: boolean; dudasAbiertas: boolean; dudasPendientes: boolean; cerrado: boolean;
  preguntasEnviadas: Record<string, string>; repreguntasEnviadas: Record<string, string>;
  ritmo: Ritmo; evitar: string; horario?: { hora: string; zona: string };
  trato: { valor: "usted" | "vos" | null; editable: boolean }; pedirFotos: boolean; tratoPanel: TratoComprador;
}): ReactNode {
  const porOrden = new Map(guion.map((p) => [p.orden, p]));

  const respuestasPorOrden = new Map<number, RespuestaVista[]>();
  for (const r of respuestas) {
    const lista = respuestasPorOrden.get(r.pregunta_orden) ?? [];
    lista.push(r);
    respuestasPorOrden.set(r.pregunta_orden, lista);
  }

  // Los capítulos, en el orden en que aparecen en el guion (el del biógrafo).
  const capitulos: { nombre: string; preguntas: Pregunta[] }[] = [];
  for (const p of guion) {
    const cap = capitulos.find((c) => c.nombre === p.capitulo);
    if (cap) cap.preguntas.push(p);
    else capitulos.push({ nombre: p.capitulo, preguntas: [p] });
  }
  const capitulosRiel: CapituloRiel[] = capitulos.map((c) => ({
    nombre: c.nombre,
    contestadas: c.preguntas.filter((p) => respuestasPorOrden.has(p.orden)).length,
    total: c.preguntas.length,
  }));

  const fotosPorCapitulo = new Map<string, FotoVista[]>();
  const fotosDelLibro: FotoVista[] = []; // sin capítulo: tapa, contratapa, marco (§15.2)
  for (const f of fotos) {
    if (f.capitulo === null) {
      fotosDelLibro.push(f);
      continue;
    }
    const lista = fotosPorCapitulo.get(f.capitulo) ?? [];
    lista.push(f);
    fotosPorCapitulo.set(f.capitulo, lista);
  }
  const capitulosConocidos = [...new Set(guion.map((p) => p.capitulo))];

  // El modo edición: las que vienen se editan, sacan, mueven y suman. El guion
  // se cierra solo al terminar de contar (el biógrafo ya se despidió).
  const puedeAgregar = !cerrado && PUEDE.agregarPreguntasYFotos(rol);
  const editando = puedeAgregar && editar === "1";
  const futuras = guion.filter((p) => p.orden > n.dia_actual);
  const lugar = lugarLibre(guion);
  const sobreOrden = typeof sobre === "string" ? Number(sobre) : null;
  const preguntaSobre = sobreOrden ? porOrden.get(sobreOrden) : null;

  const botonPreguntas = puedeAgregar ? (
    <Link href={`/tablero/${n.id}?editar=1`} className={botonBarraSec}>
      <IconoBarra nombre="lapiz" />
      {PUEDE.editarGuion(rol) ? "Agregar/Editar preguntas" : "Sumar preguntas"}
    </Link>
  ) : cerrado && !aprobado && PUEDE.agregarPreguntasYFotos(rol) ? (
    // Terminó de contar: el guion queda cerrado. El botón se queda, en gris, para que se entienda por qué.
    <span aria-disabled className={`${botonBarraSec} cursor-not-allowed opacity-50`} title="El guion se cerró al terminar de contar: no se agregan más preguntas.">
      <IconoBarra nombre="lapiz" />
      {PUEDE.editarGuion(rol) ? "Agregar/Editar preguntas" : "Sumar preguntas"}
    </span>
  ) : null;
  const botonCerrar = cerrado && !aprobado && !historiaCerrada && PUEDE.cerrarLibro(rol) ? <CerrarEdicion narradorId={n.id} propia={propia} trato={tratoPanel} /> : null;

  return (
    <div className="min-w-0">
      {n.alerta_silencio && rol === "duena" ? (
        <div className="mb-8">
          <BannerAlertaSilencio narradorId={n.id} comoLeDicen={n.como_le_dicen} trato={tratoPanel} />
        </div>
      ) : null}

      {/* Editando: el "Listo" va abajo, después de Sugerime preguntas (Joaquín, 17/09). */}
      {editando ? (
        <div>
          <Etiqueta>Historia · editando el guion</Etiqueta>
          <p className="mt-2 text-[15px] text-[var(--texto-suave)]">
            {tratoPanel === "tu"
              ? "Las que ya se mandaron no se tocan. Las que vienen, sí: edita, saca, mueve."
              : "Las que ya se mandaron no se tocan. Las que vienen, sí: editá, sacá, mové."}
          </p>
        </div>
      ) : botonPreguntas || botonCerrar ? (
        <div className={`flex flex-wrap items-center gap-2 ${historiaCerrada && !aprobado && !dudasAbiertas ? "opacity-50" : ""}`}>
          {botonPreguntas}
          {botonCerrar}
        </div>
      ) : null}

      {/* ── El índice de capítulos, en pastillas (el riel de antes) ──────── */}
      <nav aria-label="Capítulos" className="-mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ol className="flex gap-2 pb-1">
          {capitulosRiel.map((cap, i) => {
            const completo = cap.contestadas === cap.total;
            return (
              <li key={cap.nombre} className="shrink-0">
                <a
                  href={`#cap-${i}`}
                  className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] transition-colors hover:border-[var(--texto)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--texto)] [font-family:var(--fuente-micro)] ${
                    completo ? "border-[var(--texto)] bg-[var(--texto)] text-[var(--fondo)]" : cap.contestadas > 0 ? "border-[var(--texto)]" : "border-[var(--linea)] text-[var(--texto-menor)]"
                  }`}
                >
                  <span className="italic opacity-70 [font-family:var(--fuente-titulo)]">{i + 1}</span>
                  {cap.nombre}
                  <span className="tabular-nums opacity-60">
                    {cap.contestadas}/{cap.total}
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </nav>

      {dudasPendientes ? (
        <div className="mt-8">
          <ProximoPaso href={`/tablero/${n.id}/dudas`}>{textoDudas(propia && rol === "duena", n.como_le_dicen, tratoPanel === "tu")}</ProximoPaso>
        </div>
      ) : null}

      {/* Terminó de contar: mientras la edición está abierta, la barra manda (fotos,
          compartir, cerrar). Al cerrarla aparece el paso siguiente. Los invitados
          ven "Leer su libro" cuando el libro está cerrado. */}
      {cerrado && (historiaCerrada || aprobado || !PUEDE.cerrarLibro(rol)) ? (
        <div className="mt-8 flex flex-col gap-3">
          {/* Libro encargado: dueña e invitados van al lector (que avisa si todavía se está armando). */}
          <ProximoPaso href={aprobado || !PUEDE.cerrarLibro(rol) ? `/tablero/${n.id}/leer` : `/tablero/${n.id}/libro`}>
            {aprobado
              ? (propia ? "Leer tu libro y escuchar tu voz" : "Leer su libro y escuchar su voz")
              : PUEDE.cerrarLibro(rol)
                ? tratoPanel === "tu"
                  ? (propia ? "Dale los últimos retoques y encarga tu libro" : "Dale los últimos retoques y encarga su libro")
                  : (propia ? "Dale los últimos retoques y encargá tu libro" : "Dale los últimos retoques y encargá su libro")
                : "Leer su libro"}
          </ProximoPaso>
          {historiaCerrada && !aprobado && PUEDE.cerrarLibro(rol) ? (
            <div className="flex items-center gap-3 text-[13px] text-[var(--texto-menor)]">
              <span>Edición cerrada. Las fotos se siguen sumando en Encargar libro.</span>
              <ReabrirEdicion narradorId={n.id} />
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ── Primero: cómo arranca la entrevista, hora y ritmo (solo dueña). Naza, 19/10:
          personalizar la entrevista va antes de corregir las preguntas. ── */}
      {!cerrado && PUEDE.cambiarRitmo(rol) ? (
        <section className="mt-10 border-b border-[var(--linea)] pb-10">
          <Etiqueta>Ajustes de la entrevista</Etiqueta>
          <div className="mt-6">
            <Ajustes narradorId={n.id} ritmo={ritmo} evitar={evitar} horario={horario} propia={propia} trato={trato} pedirFotos={pedirFotos} objetos={objetos.map((o) => ({ orden: o.orden, capitulo: o.capitulo, texto: o.texto }))} tratoPanel={tratoPanel} />
          </div>
        </section>
      ) : null}

      {editando ? (
        <div className="mt-8">
          <AgregarPregunta
            narradorId={n.id}
            capitulos={capitulosConocidos}
            lugarLibre={lugar}
            textoInicial={preguntaSobre ? (propia ? `Quiero contar más sobre esto: "${preguntaSobre.texto}"` : `Me gustaría que me cuente más sobre esto: "${preguntaSobre.texto}"`) : ""}
            propia={propia}
            capituloInicial={preguntaSobre?.capitulo}
            trato={tratoPanel}
          />
          <div className="mt-3">
            <SugerirPreguntas narradorId={n.id} lugarLibre={lugar} propia={propia} trato={tratoPanel} ella={ella} />
          </div>
          <div className="mt-5 flex justify-end">
            <Link href={`/tablero/${n.id}`} className={botonBarraPri}>
              <IconoBarra nombre="check" />
              Listo
            </Link>
          </div>
        </div>
      ) : null}

      {/* ── Los capítulos ───────────────────────────────────────────────── */}
      <div className="mt-10 flex flex-col gap-14">
        {capitulos.map((cap, i) => {
          const contestadas = capitulosRiel[i].contestadas;
          const porVenir = cap.preguntas.filter((p) => p.orden > n.dia_actual);
          const todoEnviado = porVenir.length === 0;
          return (
            <section key={cap.nombre} id={`cap-${i}`} aria-labelledby={`cap-titulo-${i}`} className="scroll-mt-24">
              <div className="flex items-end justify-between gap-4 border-b border-[var(--texto)] pb-4">
                <div className="flex items-baseline gap-3">
                  <span aria-hidden className="pnl-num text-3xl leading-none">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 id={`cap-titulo-${i}`} className="text-2xl font-medium leading-none [font-family:var(--fuente-titulo)]">{cap.nombre}</h2>
                </div>
                <span className="shrink-0 text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.18em] tabular-nums">
                  {editando ? (todoEnviado ? "ya se mandaron · no se tocan" : "las que vienen") : `${contestadas} de ${cap.preguntas.length}`}
                </span>
              </div>

              {!editando ? <GaleriaCapitulo fotos={fotosPorCapitulo.get(cap.nombre) ?? []} usuarioId={usuarioId} esDuena={rol === "duena"} /> : null}

              <div className="mt-6 flex flex-col gap-4">
                {cap.preguntas.map((p) => {
                  const lista = respuestasPorOrden.get(p.orden);
                  const porVenirEsta = p.orden > n.dia_actual;

                  // En edición, las que vienen las dibuja el editor (abajo).
                  if (editando && porVenirEsta) return null;

                  if (!lista) {
                    return (
                      <div
                        key={p.orden}
                        className="grid grid-cols-[32px_minmax(0,1fr)] items-start gap-3 rounded-xl border border-dashed border-[var(--linea-fuerte)] px-4 py-3.5 text-[var(--texto-menor)] sm:grid-cols-[40px_minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:px-5"
                      >
                        <span className="pnl-num text-[22px] leading-[1.2] opacity-60">{p.orden}</span>
                        <p className="text-[14.5px] leading-[1.55] [font-family:var(--fuente-cuerpo)] font-light">{p.texto}</p>
                        <span className="col-start-2 text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.18em] sm:col-start-3">
                          {porVenirEsta ? "todavía no" : propia ? "enviada · esperando tu audio" : "enviada · esperando su audio"}
                        </span>
                      </div>
                    );
                  }

                  const principales = lista.filter((r) => !r.es_repregunta);
                  const ampliaciones = lista.filter((r) => r.es_repregunta);
                  const principal = principales[0] ?? lista[0];
                  const texto = (principal.transcripcion ?? principal.texto_directo ?? "").trim();
                  return (
                    <article
                      key={p.orden}
                      className="grid grid-cols-[32px_minmax(0,1fr)] items-start gap-x-3 gap-y-3 rounded-xl border border-[var(--linea)] bg-[var(--relieve)] p-4 sm:grid-cols-[40px_minmax(0,1fr)_220px] sm:gap-x-4 sm:px-5 sm:py-5"
                    >
                      <span className="pnl-num text-[22px] leading-[1.2]">{p.orden}</span>
                      <div className="min-w-0 flex flex-col gap-2.5">
                        <h3 className="text-[16.5px] font-medium leading-[1.4] [font-family:var(--fuente-titulo)]">{p.texto}</h3>
                        {preguntasEnviadas[String(p.orden)] && preguntasEnviadas[String(p.orden)] !== p.texto ? (
                          <p className="text-[14px] leading-relaxed text-[var(--texto-suave)] [font-family:var(--fuente-titulo)]">
                            Se lo preguntamos así: «{preguntasEnviadas[String(p.orden)]}»
                          </p>
                        ) : null}
                        {p.foto_id ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`/api/fotos/${p.foto_id}`} alt="" className="max-h-64 self-start rounded-lg border border-[var(--linea)] object-contain" />
                        ) : null}
                        {texto ? (
                          <p className="text-[15.5px] leading-[1.7] text-[var(--texto-suave)] [font-family:var(--fuente-cuerpo)] font-light">{texto}</p>
                        ) : principal.audio_path ? (
                          <p className="text-sm text-[var(--texto-menor)]">Estamos transcribiendo el audio…</p>
                        ) : null}
                        {ampliaciones.length > 0 ? (
                          <div className="mt-1 flex flex-col gap-4 border-l-2 border-[var(--linea)] pl-4">
                            {repreguntasEnviadas[String(p.orden)] ? (
                              <p className="text-[14px] leading-relaxed text-[var(--texto-suave)] [font-family:var(--fuente-titulo)]">
                                Le repreguntamos: «{repreguntasEnviadas[String(p.orden)]}»
                              </p>
                            ) : null}
                            <Etiqueta>y agregó</Etiqueta>
                            {ampliaciones.map((r) => (
                              <Respuesta key={r.id} respuesta={r} />
                            ))}
                          </div>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.18em]">{fechaCorta(principal.recibido_at)}</span>
                          {puedeAgregar ? (
                            <Link
                              href={`/tablero/${n.id}?editar=1&sobre=${p.orden}`}
                              className="text-[13px] text-[var(--acento)] underline decoration-[var(--linea-fuerte)] underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--acento)] [font-family:var(--fuente-micro)]"
                            >
                              {propia ? "Contar más sobre esto" : "Pedirle que cuente más"}
                            </Link>
                          ) : null}
                        </div>
                      </div>
                      {principal.audio_path ? (
                        <div className="col-start-2 sm:col-start-3 sm:row-start-1">
                          <ReproductorRespuesta src={`/api/audio/${principal.id}`} duracion={principal.duracion_segundos} etiqueta={`respuesta ${p.orden}`} />
                        </div>
                      ) : null}
                    </article>
                  );
                })}

                {editando ? (
                  <EditorGuion
                    narradorId={n.id}
                    futuras={futuras}
                    puedeEditar={PUEDE.editarGuion(rol)}
                    puedeSaltar={puedeSaltar(guion).ok}
                    capitulo={cap.nombre}
                    trato={tratoPanel}
                    ella={ella}
                  />
                ) : null}
              </div>

              {!editando && puedeAgregar ? (
                <div className="mt-5">
                  <SubirFoto narradorId={n.id} capitulos={capitulosConocidos} capituloInicial={cap.nombre} trato={tratoPanel}>
                    + Agregar una foto de esta época
                  </SubirFoto>
                </div>
              ) : null}
            </section>
          );
        })}

        {!cerrado && !guion.some((p) => p.tipo === "adaptativa") ? (
          <p className="flex gap-4 text-[var(--texto-menor)]">
            <span className="w-8 shrink-0 text-right text-sm tabular-nums [font-family:var(--fuente-micro)]">+{ADAPTATIVAS}</span>
            <span className="text-[15px] italic">Las cuatro finales las escribe el biógrafo con todo lo que {propia ? "hayas" : ella ? "ella haya" : "él haya"} contado.</span>
          </p>
        ) : null}

        {!editando && (fotosDelLibro.length > 0 || puedeAgregar) ? (
          <section aria-labelledby="fotos-del-libro">
            <div className="flex items-end justify-between gap-4 border-b border-[var(--linea)] pb-4">
              <h2 id="fotos-del-libro" className="text-2xl font-medium leading-none [font-family:var(--fuente-titulo)]">El álbum del libro</h2>
              <span className="shrink-0 text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.18em]">sin lugar todavía</span>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--texto-suave)]">
              Las fotos que todavía no tienen lugar. En{" "}
              <Link href={`/tablero/${n.id}/libro`} className="underline decoration-[var(--linea-fuerte)] underline-offset-4">Encargar libro</Link>{" "}
              {tratoPanel === "tu" ? "las arrastras" : "las arrastrás"} a la portada de un capítulo, a la tapa, a la contratapa o a un marco, y ves cómo queda en la previsualización.
            </p>
            <GaleriaCapitulo fotos={fotosDelLibro} usuarioId={usuarioId} esDuena={rol === "duena"} />
            {puedeAgregar ? (
              <div className="mt-5">
                <SubirFoto narradorId={n.id} capitulos={capitulosConocidos} trato={tratoPanel}>+ Agregar una foto al álbum</SubirFoto>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>

    </div>
  );
}

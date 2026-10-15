import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { regionDelRequest } from "@/lib/region";
import { esIdiomaWeb, type IdiomaWeb } from "@/lib/idioma-web";
import { usuarioDeLaSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { esPropia, historiaAccesible } from "@/lib/panel";
import { CONFIRMADO, momentosKids, type CanalConfirmadoKids, type Momento } from "../../_textos/pedido-confirmado";
import { CascaronCheckout } from "../../_checkout/cascaron";
import { clasesBoton } from "../../_ui";
import { AlConfirmar } from "./al-confirmar";

// «Pedido confirmado» (rediseño 2026-10, paso 4 de la maqueta Checkout).
// Adonde vuelve la pasarela: /api/pago/vuelta confirma el pago, abre la sesión
// y trae acá a quien compró con su narrador (`?n=`) y el idioma de la web
// (`?idioma=`). Con la sesión se lee lo justo para hablarle bien (cómo le
// dicen, si es un regalo, si es su propio libro, si algo viaja). Si la vuelta
// no pudo abrir la sesión o confirmar (pago pendiente), se cae acá sin `n`: la
// pantalla de respaldo de siempre, que no muestra nada de la base y manda a
// entrar con el correo. El mail de acceso puede llegar unos segundos después:
// por eso no se promete «ya te llegó».
//
// Es dinámica a propósito (lee la sesión y la URL): no es una página de entrada.

export const metadata: Metadata = { title: "Pedido confirmado", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Confirmado = {
  narradorId: string;
  nombre: string;
  propia: boolean;
  regalo: boolean;
  /** Hay algo que viaja (impreso o marcos): la entrega existe. */
  impreso: boolean;
  /** La entrega todavía sin dirección (para guardar la del checkout). */
  entregaSinDireccion: string | null;
  /** Vitácora Kids: el canal de su fila en kids_v2 (A = su WhatsApp, B = «Lo hago yo»); null si no es de Kids. */
  kids: CanalConfirmadoKids | null;
};

/** Lo que se muestra de la compra, si la sesión es de la dueña de ese narrador; si no, null. */
async function leerConfirmado(narradorId: string): Promise<Confirmado | null> {
  try {
    const user = await usuarioDeLaSesion();
    if (!user) return null;
    const admin = crearClienteServidor();
    const { historia } = await historiaAccesible(admin, user, narradorId);
    if (!historia || historia.rol !== "duena") return null;
    const n = historia.narrador;
    // Las tres consultas no dependen una de la otra. kids_v2 puede no existir
    // todavía (migración sin aplicar): entonces no es de Kids.
    const [{ data: regalo }, { data: entrega }, { data: kids }] = await Promise.all([
      admin.from("regalos").select("codigo").eq("narrador_id", n.id).maybeSingle(),
      admin.from("entregas").select("id, estado").eq("narrador_id", n.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      admin.from("kids_v2").select("canal").eq("narrador_id", n.id).maybeSingle(),
    ]);
    const canal = (kids as { canal?: unknown } | null)?.canal;
    const e = entrega as { id: string; estado: string } | null;
    return {
      narradorId: n.id,
      nombre: (n.como_le_dicen || n.nombre || "").trim(),
      propia: esPropia(n),
      regalo: Boolean((regalo as { codigo?: string } | null)?.codigo) || n.estado === "regalo_pendiente",
      impreso: Boolean(e),
      entregaSinDireccion: e && e.estado === "sin_direccion" ? e.id : null,
      kids: canal === "A" || canal === "B" ? canal : null,
    };
  } catch (err) {
    console.error("gracias: no pude leer la compra confirmada", err);
    return null;
  }
}

export default async function Gracias({ searchParams }: PageProps<"/comprar/gracias">) {
  const { viaje, idioma: crudo, n } = await searchParams;
  const esViaje = viaje === "1";
  // El idioma lo trae la vuelta del pago; sin él, el país de quien compró, como antes.
  const idioma: IdiomaWeb = esIdiomaWeb(crudo) ? crudo : regionDelRequest(await headers()) === "ES" ? "es" : "ar";
  const T = CONFIRMADO[idioma];
  const confirmado = typeof n === "string" && UUID.test(n) ? await leerConfirmado(n) : null;
  // El número del biógrafo, para que el viajero le escriba primero mientras no hay plantilla aprobada.
  const numero = process.env.NEXT_PUBLIC_WA_NUMERO ?? null;

  const titulo = confirmado ? (confirmado.propia ? T.tituloPropio : confirmado.nombre ? T.tituloDe(confirmado.nombre) : T.tituloGenerico) : T.tituloGenerico;
  const momentos: Momento[] = esViaje
    ? []
    : confirmado
      ? confirmado.propia
        ? T.propio(confirmado.impreso)
        : confirmado.kids
          ? momentosKids(confirmado.nombre, confirmado.kids, confirmado.impreso)
          : confirmado.regalo
          ? T.regalo(confirmado.nombre, confirmado.impreso)
          : T.otro(confirmado.nombre, confirmado.impreso)
      : T.generico;

  return (
    <CascaronCheckout idioma={idioma} inicio={esViaje ? "/viaje" : "/"} viaje={esViaje}>
      <main className="mx-auto flex w-full max-w-[760px] flex-col gap-10 px-4 pb-28 pt-14 sm:px-8 sm:pt-20">
        <div className="flex flex-col gap-4">
          <span aria-hidden className="chk-sello m-up mb-3">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.2 4.2L19 7" />
            </svg>
          </span>
          <span className="chk-antetitulo">{T.antetitulo}</span>
          <h1 className="chk-h1">{titulo}</h1>
          <p className="chk-bajada">
            {esViaje ? T.viaje(numero) : confirmado?.regalo ? T.correoRegalo : T.correo}
          </p>
        </div>

        {momentos.length > 0 ? (
          <ol className="flex flex-col border-t border-[var(--texto-oscuro-fuerte)]">
            {momentos.map((m) => (
              <li key={m.cuando} className="m-up grid gap-1 border-b border-[var(--borde-oscuro)] py-5 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6">
                <span className="chk-momento-cuando">{m.cuando}</span>
                <span className="text-[17px] leading-[1.55] text-[var(--texto-oscuro)]">{m.que}</span>
              </li>
            ))}
          </ol>
        ) : null}

        <AlConfirmar
          narradorId={confirmado?.narradorId ?? null}
          entregaId={confirmado?.entregaSinDireccion ?? null}
          textos={{ guardada: T.direccionGuardada, falta: T.faltaDireccion, poner: T.ponerDireccion }}
        />

        <div className="flex flex-wrap gap-3">
          {confirmado?.regalo ? (
            <Link href={`/tablero/${confirmado.narradorId}/regalo`} className={clasesBoton("primario", "min-h-14 px-8 text-[16px]")}>
              {T.descargarTarjeta}
            </Link>
          ) : null}
          {confirmado ? (
            <Link href={`/tablero/${confirmado.narradorId}`} className={clasesBoton(confirmado.regalo ? "fantasma" : "primario", "min-h-14 px-7")}>
              {T.irAlPanel}
            </Link>
          ) : (
            <div className="flex flex-col gap-3">
              <Link href="/entrar" className={clasesBoton("primario", "min-h-14 self-start px-8 text-[16px]")}>
                {T.entrarAlPanel}
              </Link>
              <p className="text-[13px] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">{T.sinContrasenas}</p>
            </div>
          )}
        </div>
      </main>
    </CascaronCheckout>
  );
}

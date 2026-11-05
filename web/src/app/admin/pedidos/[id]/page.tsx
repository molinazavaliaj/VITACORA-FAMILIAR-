import Link from "next/link";
import { notFound } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { datosEtiqueta, direccionEnLineas, envioDe, esHistoria, estadoAnterior, estadoDelPago, lineasDelProducto, numeroDePedido, puedeCargarBulto, puedePasar, sinMailDeEnvio, tarjetaDe, type EntregaAdmin, type PedidoAdmin } from "@/lib/pedidos-admin";
import { leerPedido, mailDeEntregaSalio } from "@/lib/pedidos-admin-base";
import { Chip, Tarjeta, Titulo, fechaCorta } from "../../ui";
import { FormPedido } from "../formulario";
import { corregirSeguimiento, crearEntrega, guardarBulto, marcarEntregado, marcarEnviado, marcarImpreso, marcarProblema, resolverProblema } from "../acciones";
import { ChipEnvio } from "../envio-ui";
import { EtiquetaDelPaquete } from "../etiqueta";

// La ficha de un pedido: la etiqueta para el paquete y lo que hay que ir marcando hasta que
// llega. Todo lo que cambia pasa por acciones.ts, que vuelve a chequear permiso y estado.

export const dynamic = "force-dynamic";

const CAMPO = "adm-campo";
const ETIQUETA = "flex flex-col gap-1 text-xs text-[var(--texto-menor)]";
const H2 = "adm-micro mt-10 mb-4";

/** Hasta que se elija un correo: los que se sugieren al escribir, según de dónde sale. */
const CORREOS: Record<string, string[]> = {
  ES: ["Correos", "SEUR", "GLS"],
  AR: ["Correo Argentino", "Andreani", "OCA"],
};

export default async function FichaDelPedido({ params }: PageProps<"/admin/pedidos/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const admin = crearClienteServidor();
  const r = await leerPedido(admin, id);

  if (!r.ok) {
    return (
      <div className="adm-entra">
        <Titulo ruta="/admin/pedidos" />
        <p className="adm-alerta">
          {r.falla === "sin_migracion" ? "Falta aplicar la migración 20261105000000_numero_de_pedido.sql en Supabase." : "No pude leer el pedido. Probá de nuevo en un rato."}
        </p>
      </div>
    );
  }
  if (!r.valor) notFound();
  const p = r.valor;
  const e = p.entrega;

  const [mailEnviado, mailEntregado] = e
    ? await Promise.all([
        e.enviado_at ? mailDeEntregaSalio(admin, p.narrador_id, e.id, "enviado") : null,
        e.entregado_at ? mailDeEntregaSalio(admin, p.narrador_id, e.id, "entregado") : null,
      ])
    : [null, null];

  const pago = estadoDelPago(p);
  const tarjeta = tarjetaDe(p);

  return (
    <div className="adm-entra">
      <p className="adm-sin-imprimir mb-4 text-sm">
        <Link href="/admin/pedidos" className="underline decoration-[var(--linea-fuerte)] underline-offset-4">← Pedidos</Link>
      </p>
      <header className="adm-sin-imprimir mb-8">
        <p className="adm-micro">Pedido del {fechaCorta(p.created_at, true)}</p>
        <h1 className="adm-h1 mt-3">{numeroDePedido(p.numero)}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Chip color={pago.color}>{pago.texto}</Chip>
          <ChipEnvio estado={envioDe(p)} />
        </div>
      </header>

      <Tarjeta className="adm-sin-imprimir">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <Dato nombre="Comprador">{[p.comprador?.nombre, p.comprador?.email].filter(Boolean).join(" · ") || "—"}</Dato>
          <Dato nombre="Narrador">{p.narrador?.nombre ?? "—"}</Dato>
          <Dato nombre="Producto">{lineasDelProducto(p).join(" · ")}</Dato>
          <Dato nombre="Cobrado">{p.monto !== null && p.moneda ? `${p.monto} ${p.moneda}${p.proveedor ? ` (${p.proveedor})` : ""}` : "—"}</Dato>
        </dl>
      </Tarjeta>

      {envioDe(p) === "sin_fila" ? (
        <div className="mt-6">
          <p className="adm-alerta">Se cobró algo físico y no se creó su entrega, así que la familia no puede cargar la dirección.</p>
          <FormPedido accion={crearEntrega} boton="crear la entrega" className="mt-3">
            <input type="hidden" name="id" value={p.id} />
          </FormPedido>
        </div>
      ) : null}

      {e ? <Envio p={p} e={e} mailEnviado={mailEnviado} mailEntregado={mailEntregado} /> : null}

      {tarjeta ? (
        <section className="adm-sin-imprimir">
          <h2 className={H2}>La tarjeta del regalo</h2>
          <Tarjeta>
            <p className="text-sm text-[var(--texto-menor)]">Viaja aparte, en su sobre. No tiene estado de envío.</p>
            <div className="mt-3 text-sm leading-relaxed">
              <p className="font-semibold">{tarjeta.aNombreDe}</p>
              {direccionEnLineas(tarjeta.direccion).map((l, i) => <p key={`${l}-${i}`}>{l}</p>)}
            </div>
          </Tarjeta>
        </section>
      ) : null}
    </div>
  );
}

function Dato({ nombre, children }: { nombre: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-[var(--texto-menor)]">{nombre}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function Envio({ p, e, mailEnviado, mailEntregado }: { p: PedidoAdmin; e: EntregaAdmin; mailEnviado: boolean | null; mailEntregado: boolean | null }) {
  const origen = e.origen === "AR" ? "AR" : "ES";
  const remitente = process.env[`REMITENTE_${origen}`];
  const historia = esHistoria(p);
  const sinMail = sinMailDeEnvio(p);

  return (
    <>
      <section>
        <h2 className={`${H2} adm-sin-imprimir`}>La etiqueta</h2>
        <EtiquetaDelPaquete
          etiqueta={datosEtiqueta(p, remitente)}
          faltaRemitente={remitente?.trim() ? null : `Falta cargar REMITENTE_${origen} en Vercel, con | entre renglones. Hasta entonces el remitente queda en blanco para escribirlo a mano.`}
        />
      </section>

      <section className="adm-sin-imprimir">
        <h2 className={H2}>Peso y medidas</h2>
        <Tarjeta>
          <p className="text-sm text-[var(--texto-menor)]">
            {!puedeCargarBulto(e.estado, historia)
              ? "La fábrica los calcula al mandar a imprenta. Recién ahí se pueden corregir."
              : e.peso_g || e.dimensiones
                ? "Los calcula la fábrica con valores estimados. Corregilos cuando peses y midas la caja: de esto depende lo que cobra el correo."
                : "Todavía no hay. Cargalos cuando peses y midas la caja."}
          </p>
          {puedeCargarBulto(e.estado, historia) ? (
          <FormPedido accion={guardarBulto} boton="guardar" estilo="hilo" className="mt-3">
            <input type="hidden" name="id" value={p.id} />
            <label className={ETIQUETA}>
              Peso (g)
              <input className={CAMPO} key={`peso-${e.peso_g}`} name="peso" inputMode="numeric" defaultValue={e.peso_g ?? ""} required size={8} />
            </label>
            <label className={ETIQUETA}>
              Medidas (cm)
              <input className={CAMPO} key={`medidas-${e.dimensiones}`} name="medidas" defaultValue={e.dimensiones ?? ""} placeholder="30x18x8" required size={12} />
            </label>
          </FormPedido>
          ) : null}
        </Tarjeta>
      </section>

      <section className="adm-sin-imprimir">
        <h2 className={H2}>El envío</h2>
        {e.estado === "con_problema" ? (
          <p className="adm-alerta mb-4">{e.problema ?? "Marcado con problema, sin detalle."}</p>
        ) : null}
        {sinMail ? (
          <p className="adm-alerta mb-4">
            A {p.extras.tipo === "kids" ? "Kids" : "Vitácora de una historia"} no le salen los mails de entrega: a esta familia hay que avisarle a mano.
          </p>
        ) : null}

        <Tarjeta>
          <Pasos p={p} e={e} historia={historia} sinMail={sinMail} mailEnviado={mailEnviado} mailEntregado={mailEntregado} />
        </Tarjeta>

        {e.estado === "con_problema" ? (
          <FormPedido accion={resolverProblema} boton={`resolver y volver a «${estadoAnterior(e).replace("_", " ")}»`} estilo="hilo" className="mt-4">
            <input type="hidden" name="id" value={p.id} />
          </FormPedido>
        ) : puedePasar(e.estado, "con_problema", historia) ? (
          <FormPedido
            accion={marcarProblema}
            boton="marcar con problema"
            estilo="hilo"
            className="mt-4"
            confirmar="La familia va a ver este texto en su panel y no recibe ningún mail. Si corrige la dirección, se guarda sin imprimir otro libro. ¿Seguimos?"
          >
            <input type="hidden" name="id" value={p.id} />
            <label className={`${ETIQUETA} min-w-[280px] flex-1`}>
              Qué pasó (la familia lo ve en su panel)
              <input className={CAMPO} name="problema" maxLength={300} required />
            </label>
          </FormPedido>
        ) : null}
      </section>
    </>
  );
}

function Pasos({ p, e, historia, sinMail, mailEnviado, mailEntregado }: { p: PedidoAdmin; e: EntregaAdmin; historia: boolean; sinMail: boolean; mailEnviado: boolean | null; mailEntregado: boolean | null }) {
  const correos = CORREOS[e.origen === "AR" ? "AR" : "ES"];
  const camposDespacho = (
    <>
      <input type="hidden" name="id" value={p.id} />
      <label className={ETIQUETA}>
        Transportista
        <input className={CAMPO} name="transportista" list="correos" defaultValue={e.transportista ?? ""} required maxLength={80} />
        <datalist id="correos">
          {correos.map((c) => <option key={c} value={c} />)}
        </datalist>
      </label>
      <label className={ETIQUETA}>
        Número de seguimiento
        <input className={CAMPO} name="seguimiento" defaultValue={e.seguimiento ?? ""} maxLength={120} />
      </label>
      <label className={`${ETIQUETA} min-w-[240px] flex-1`}>
        Link de seguimiento (opcional)
        <input className={CAMPO} name="url" type="url" defaultValue={e.seguimiento_url ?? ""} maxLength={500} placeholder="https://" />
      </label>
    </>
  );

  const puedeImprimir = puedePasar(e.estado, "impreso", historia);
  const puedeEnviar = puedePasar(e.estado, "enviado", historia);

  return (
    <div className="flex flex-col gap-5 text-sm">
      {e.estado === "sin_direccion" ? <p>La familia todavía no cargó la dirección. Si pasan 3 días, le sale un mail pidiéndola.</p> : null}
      {e.estado === "lista" && !historia ? (
        <p>Hay dirección. La fábrica lo manda a imprenta sola cuando la familia cierra el libro y confirma las frases; recién ahí se puede despachar.</p>
      ) : null}

      {puedeImprimir ? (
        <FormPedido accion={marcarImpreso} boton="ya llegó de la imprenta" estilo="hilo">
          <input type="hidden" name="id" value={p.id} />
        </FormPedido>
      ) : null}

      {puedeEnviar ? (
        <div>
          <p className="mb-3">
            {sinMail
              ? "Al marcarlo enviado, la familia lo ve en su panel."
              : "Al marcarlo enviado, a la familia le sale el mail «va en camino», con el número si lo cargaste. Ese mail sale una sola vez: cargá el número antes."}
          </p>
          <FormPedido
            accion={marcarEnviado}
            boton="marcar enviado"
            confirmar={sinMail ? "¿Marcar este paquete como enviado?" : "Esto le manda a la familia el mail «va en camino». ¿Seguimos?"}
          >
            {camposDespacho}
          </FormPedido>
        </div>
      ) : null}

      {e.estado === "enviado" || e.estado === "entregado" ? (
        <div>
          <p className="mb-3">
            Salió el {fechaCorta(e.enviado_at, true)}. {avisoMail(sinMail, mailEnviado, "va en camino")}
          </p>
          <FormPedido accion={corregirSeguimiento} boton="corregir" estilo="hilo">
            {camposDespacho}
          </FormPedido>
        </div>
      ) : null}

      {e.estado === "enviado" ? (
        <FormPedido
          accion={marcarEntregado}
          boton="marcar entregado"
          confirmar={sinMail ? "¿Marcar este paquete como entregado?" : "Esto le manda a la familia el mail «ya está en casa», con el pedido de reseña. ¿Seguimos?"}
        >
          <input type="hidden" name="id" value={p.id} />
        </FormPedido>
      ) : null}

      {e.estado === "entregado" ? (
        <p>Llegó el {fechaCorta(e.entregado_at, true)}. {avisoMail(sinMail, mailEntregado, "ya está en casa")}</p>
      ) : null}
    </div>
  );
}

/** Lo que se sabe de verdad del mail: el candado que deja la fábrica cuando Resend lo confirmó. */
function avisoMail(sinMail: boolean, salio: boolean | null, cual: string): string {
  if (sinMail) return "";
  if (salio === null) return `No pude comprobar si salió el mail «${cual}».`;
  return salio ? `El mail «${cual}» ya salió.` : `El mail «${cual}» sale en la próxima vuelta de la fábrica.`;
}

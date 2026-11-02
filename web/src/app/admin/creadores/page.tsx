import { crearClienteServidor } from "@/lib/supabase/servidor";
import { COMISION_SUGERIDA, DESCUENTO_SUGERIDO, DIAS_EN_ESPERA, creadoresPrendido, estadoDeComision, resumenDeComisiones, sugerirCodigo, type EstadoVisibleComision, type FilaComision, type FilaCreador, type PorMoneda } from "@/lib/creadores";
import { datosCreadores } from "@/lib/creadores-base";
import { urlCompartirCreador, urlPanelCreador } from "@/lib/mail-creadores";
import { Chip, Cifra, Nota, SinDatos, Tarjeta, Titulo, fechaCorta, type Color } from "../ui";
import { FormAccion } from "./formulario";
import { anular, aprobar, cambiar, marcarPagado, pausar, rechazar, reactivar } from "./acciones";

// 05 · Creadores — «quién se anotó, quién vende y cuánto se les debe»
// (programa de creadores, 21/10; spec 2026-10-21-programa-creadores-design.md §5).
// Arriba los pendientes con el formulario de aprobar (código sugerido,
// comisión y descuento editables); después los activos y pausados con sus
// números editables, ventas y lo que se les debe; al final todas las
// comisiones, con la opción de anular una (devoluciones). Cada botón es una
// server action que vuelve a chequear ADMIN_EMAILS (acciones.ts).

export const dynamic = "force-dynamic";

const CAMPO = "adm-campo";
const ETIQUETA = "flex flex-col gap-1 text-xs text-[var(--texto-menor)]";
const H2 = "adm-micro mt-12";

const ESTADO: Record<FilaCreador["estado"], { texto: string; color: Color }> = {
  pendiente: { texto: "pendiente", color: "ambar" },
  activo: { texto: "activo", color: "verde" },
  pausado: { texto: "pausado", color: "neutro" },
  rechazado: { texto: "rechazado", color: "rojo" },
};

/** La `pendiente` de la base se ve partida: en espera (los 14 días) o por cobrar. */
const ESTADO_COMISION: Record<EstadoVisibleComision, { texto: string; color: Color }> = {
  en_espera: { texto: "en espera", color: "neutro" },
  por_cobrar: { texto: "por cobrar", color: "ambar" },
  pagada: { texto: "pagada", color: "verde" },
  anulada: { texto: "anulada", color: "neutro" },
};

const plata = (p: PorMoneda) => {
  const partes = Object.entries(p).map(([moneda, n]) => new Intl.NumberFormat(moneda === "ARS" ? "es-AR" : "es-ES", { style: "currency", currency: moneda }).format(n));
  return partes.length === 0 ? "—" : partes.join(" + ");
};

export default async function PantallaCreadores() {
  const prendido = creadoresPrendido();
  const r = await datosCreadores(crearClienteServidor());

  return (
    <div className="adm-entra">
      <Titulo ruta="/admin/creadores">
        Arriba los que se anotaron en /colabora y esperan respuesta; después los que ya tienen código, con lo que
        vendieron y lo que se les debe. Desde acá se aprueba, se pausa y se marca lo pagado.
      </Titulo>

      {!prendido ? (
        <p className="adm-alerta mb-5">
          El programa está apagado: falta CREADORES=1 en Vercel. /colabora da 404, los códigos no valen y los botones no hacen nada.
        </p>
      ) : null}

      {!r.ok ? (
        <p className="adm-alerta">
          {r.falla === "tabla_ausente"
            ? "Falta aplicar la migración 20261021000000_creadores.sql en Supabase."
            : "No pude leer los creadores. Probá de nuevo en un rato."}
        </p>
      ) : (
        <Contenido creadores={r.valor.creadores} comisiones={r.valor.comisiones} />
      )}

      <Nota>
        La comisión se calcula sobre lo que pagó el cliente (ya con el descuento) y queda congelada en la venta: cambiar
        el porcentaje no toca ventas viejas. Cada comisión queda {DIAS_EN_ESPERA} días en espera (por si devuelven la
        compra) y después pasa a por cobrar. El pago es a mano, por transferencia; el día 1 de cada mes llega un mail con
        lo que ya se puede pagar. «Marcar pagado» pasa a pagadas solo las por cobrar de ese creador, no las en espera.
        Las compras de un creador con su propio código no dejan comisión: si aparece una, anúlenla.
      </Nota>
    </div>
  );
}

function Contenido({ creadores, comisiones }: { creadores: FilaCreador[]; comisiones: FilaComision[] }) {
  const pendientes = creadores.filter((c) => c.estado === "pendiente");
  const conCodigo = creadores.filter((c) => c.estado === "activo" || c.estado === "pausado");
  const rechazados = creadores.filter((c) => c.estado === "rechazado");
  const porId = new Map(creadores.map((c) => [c.id, c]));
  const total = resumenDeComisiones(comisiones);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <Cifra
          etiqueta="Por aprobar"
          valor={pendientes.length}
          color={pendientes.length > 0 ? "ambar" : undefined}
          detalle={`${conCodigo.length} con código`}
        />
        <Cifra etiqueta="Ventas con código" valor={total.ventas} detalle="sin contar las anuladas" />
        <Cifra
          etiqueta="Se les debe"
          valor={plata(total.porCobrar)}
          detalle={`en espera: ${plata(total.enEspera)} · pagado: ${plata(total.pagado)}`}
        />
      </div>

      <h2 className={H2}>Pendientes de aprobar</h2>
      {pendientes.length === 0 ? (
        <div className="mt-4">
          <SinDatos que="Nadie esperando: las altas de /colabora aparecen acá." />
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {pendientes.map((c) => (
            <Tarjeta key={c.id}>
              <Datos c={c} />
              <FormAccion accion={aprobar} boton="aprobar y mandar la bienvenida" className="mt-4">
                <input type="hidden" name="id" value={c.id} />
                <label className={ETIQUETA}>
                  Código
                  <input className={CAMPO} name="codigo" defaultValue={sugerirCodigo(c.nombre)} required maxLength={20} />
                </label>
                <label className={ETIQUETA}>
                  Comisión %
                  <input className={`${CAMPO} w-20`} name="comision" defaultValue={COMISION_SUGERIDA} inputMode="numeric" required />
                </label>
                <label className={ETIQUETA}>
                  Descuento %
                  <input className={`${CAMPO} w-20`} name="descuento" defaultValue={DESCUENTO_SUGERIDO} inputMode="numeric" required />
                </label>
              </FormAccion>
              <FormAccion accion={rechazar} boton="rechazar" estilo="hilo" confirmar={`¿Rechazar a ${c.nombre}? No le llega ningún mail.`} className="mt-2">
                <input type="hidden" name="id" value={c.id} />
              </FormAccion>
            </Tarjeta>
          ))}
        </div>
      )}

      <h2 className={H2}>Con código</h2>
      {conCodigo.length === 0 ? (
        <div className="mt-4">
          <SinDatos que="Todavía no hay ningún creador aprobado." />
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {conCodigo.map((c) => {
            const r = resumenDeComisiones(comisiones.filter((k) => k.creador_id === c.id));
            return (
              <Tarjeta key={c.id}>
                <Datos c={c} />
                <p className="mt-3 text-sm">
                  {r.ventas} ventas · se le debe <b>{plata(r.porCobrar)}</b> · en espera {plata(r.enEspera)} · pagado {plata(r.pagado)}
                </p>
                {c.codigo && c.token_panel ? (
                  <p className="mt-1 break-all text-xs text-[var(--texto-menor)]">
                    link: {urlCompartirCreador(c.idioma, c.codigo)} · panel: {urlPanelCreador(c.token_panel)}
                  </p>
                ) : null}
                <FormAccion accion={cambiar} boton="guardar" className="mt-4">
                  <input type="hidden" name="id" value={c.id} />
                  <label className={ETIQUETA}>
                    Código
                    <input className={CAMPO} name="codigo" defaultValue={c.codigo ?? ""} required maxLength={20} />
                  </label>
                  <label className={ETIQUETA}>
                    Comisión %
                    <input className={`${CAMPO} w-20`} name="comision" defaultValue={c.comision ?? COMISION_SUGERIDA} inputMode="numeric" required />
                  </label>
                  <label className={ETIQUETA}>
                    Descuento %
                    <input className={`${CAMPO} w-20`} name="descuento" defaultValue={c.descuento ?? DESCUENTO_SUGERIDO} inputMode="numeric" required />
                  </label>
                  <label className={`${ETIQUETA} min-w-[200px] flex-1`}>
                    Notas (no las ve el creador)
                    <input className={CAMPO} name="notas" defaultValue={c.notas ?? ""} maxLength={2000} />
                  </label>
                </FormAccion>
                <div className="mt-2 flex flex-wrap gap-2">
                  {c.estado === "activo" ? (
                    <FormAccion accion={pausar} boton="pausar" estilo="hilo" confirmar={`¿Pausar a ${c.nombre}? Su código deja de valer.`}>
                      <input type="hidden" name="id" value={c.id} />
                    </FormAccion>
                  ) : (
                    <FormAccion accion={reactivar} boton="reactivar" estilo="hilo">
                      <input type="hidden" name="id" value={c.id} />
                    </FormAccion>
                  )}
                  {Object.keys(r.porCobrar).length > 0 ? (
                    <FormAccion accion={marcarPagado} boton="marcar pagado" estilo="hilo" confirmar={`¿Ya le transfirieron ${plata(r.porCobrar)} a ${c.nombre}?`}>
                      <input type="hidden" name="id" value={c.id} />
                    </FormAccion>
                  ) : null}
                </div>
              </Tarjeta>
            );
          })}
        </div>
      )}

      <h2 className={H2}>Comisiones</h2>
      {comisiones.length === 0 ? (
        <div className="mt-4">
          <SinDatos que="Todavía no hay ventas con código de creador." />
        </div>
      ) : (
        <div className="adm-hoja mt-3 overflow-x-auto">
          <table className="adm-tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Creador</th>
                <th>Código</th>
                <th>Pagó el cliente</th>
                <th>%</th>
                <th>Comisión</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {comisiones.map((k) => {
                const estado = estadoDeComision(k);
                return (
                <tr key={k.id}>
                  <td>{fechaCorta(k.created_at, true)}</td>
                  <td>{porId.get(k.creador_id)?.nombre ?? "—"}</td>
                  <td>{k.codigo}</td>
                  <td>{plata({ [k.moneda]: Number(k.total) })}</td>
                  <td>{k.porcentaje}</td>
                  <td>{plata({ [k.moneda]: Number(k.importe) })}</td>
                  <td>
                    <Chip color={ESTADO_COMISION[estado].color}>
                      {ESTADO_COMISION[estado].texto}
                      {k.estado === "pagada" && k.pagada_at ? ` ${fechaCorta(k.pagada_at)}` : ""}
                    </Chip>
                  </td>
                  <td>
                    {k.estado !== "anulada" ? (
                      <FormAccion
                        accion={anular}
                        boton="anular"
                        estilo="hilo"
                        confirmar={k.estado === "pagada" ? "Esta ya se pagó: anularla no devuelve la plata, hay que descontarla a mano. ¿Anular?" : "¿Anular esta comisión (devolución)?"}
                      >
                        <input type="hidden" name="id" value={k.id} />
                      </FormAccion>
                    ) : null}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rechazados.length > 0 ? (
        <>
          <h2 className={H2}>Rechazados</h2>
          <p className="mt-3 text-sm text-[var(--texto-suave)]">{rechazados.map((c) => `${c.nombre} (${c.email})`).join(" · ")}</p>
        </>
      ) : null}
    </>
  );
}

/** Lo que mandó en el alta y en qué estado está. */
function Datos({ c }: { c: FilaCreador }) {
  const e = ESTADO[c.estado];
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <b className="text-lg font-medium [font-family:var(--fuente-titulo)]">{c.nombre}</b>
        <Chip color={e.color}>{e.texto}</Chip>
        {c.codigo ? <span className="rounded border border-[var(--linea-fuerte)] px-2 py-0.5 text-sm tracking-wider [font-family:var(--fuente-micro)]">{c.codigo}</span> : null}
        {c.comision !== null ? (
          <span className="text-sm text-[var(--texto-menor)]">
            comisión {c.comision} % · descuento {c.descuento ?? 0} %
          </span>
        ) : null}
        <span className="ml-auto text-xs text-[var(--texto-menor)]">se anotó el {fechaCorta(c.created_at, true)} · web {c.idioma}</span>
      </div>
      <p className="mt-1 break-all text-sm text-[var(--texto-suave)]">
        {c.email} · {c.red} · {c.perfil}
        {c.seguidores ? ` · ${c.seguidores} seguidores` : ""}
      </p>
      {c.mensaje ? <p className="mt-1 text-sm italic text-[var(--texto-suave)]">«{c.mensaje}»</p> : null}
    </div>
  );
}

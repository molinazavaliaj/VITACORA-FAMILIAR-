import { crearClienteServidor } from "@/lib/supabase/servidor";
import { COMISION_SUGERIDA, DESCUENTO_SUGERIDO, creadoresPrendido, resumenDeComisiones, sugerirCodigo, type FilaComision, type FilaCreador, type PorMoneda } from "@/lib/creadores";
import { datosCreadores } from "@/lib/creadores-base";
import { urlCompartirCreador, urlPanelCreador } from "@/lib/mail-creadores";
import { Chip, Nota, SinDatos, Tarjeta, Titulo, fechaCorta, type Color } from "../ui";
import { FormAccion } from "./formulario";
import { anular, aprobar, cambiar, marcarPagado, pausar, rechazar, reactivar } from "./acciones";

// 07 · Creadores — «quién se anotó, quién vende y cuánto se les debe»
// (programa de creadores, 21/10; spec 2026-10-21-programa-creadores-design.md §5).
// Arriba los pendientes con el formulario de aprobar (código sugerido,
// comisión y descuento editables); después los activos y pausados con sus
// números editables, ventas y lo que se les debe; al final todas las
// comisiones, con la opción de anular una (devoluciones). Cada botón es una
// server action que vuelve a chequear ADMIN_EMAILS (acciones.ts).

export const dynamic = "force-dynamic";

const CAMPO = "rounded border border-[var(--linea)] bg-[var(--fondo)] px-2 py-1 text-sm";
const ETIQUETA = "flex flex-col gap-1 text-xs text-[var(--texto-menor)]";
const H2 = "mt-8 text-xs uppercase tracking-wide text-[var(--texto-menor)] [font-family:var(--fuente-micro)]";

const ESTADO: Record<FilaCreador["estado"], { texto: string; color: Color }> = {
  pendiente: { texto: "pendiente", color: "ambar" },
  activo: { texto: "activo", color: "verde" },
  pausado: { texto: "pausado", color: "neutro" },
  rechazado: { texto: "rechazado", color: "rojo" },
};

const plata = (p: PorMoneda) => {
  const partes = Object.entries(p).map(([moneda, n]) => new Intl.NumberFormat(moneda === "ARS" ? "es-AR" : "es-ES", { style: "currency", currency: moneda }).format(n));
  return partes.length === 0 ? "—" : partes.join(" + ");
};

export default async function PantallaCreadores() {
  const prendido = creadoresPrendido();
  const r = await datosCreadores(crearClienteServidor());

  return (
    <div>
      <Titulo numero="07" nombre="Creadores" aclara="quién se anotó, quién vende y cuánto se les debe" />

      {!prendido ? (
        <p className="mt-4 rounded border border-[var(--alerta)] px-4 py-3 text-sm text-[var(--alerta)]">
          El programa está apagado: falta CREADORES=1 en Vercel. /colabora da 404, los códigos no valen y los botones no hacen nada.
        </p>
      ) : null}

      {!r.ok ? (
        <p className="mt-4 rounded border border-[var(--alerta)] px-4 py-3 text-sm text-[var(--alerta)]">
          {r.falla === "tabla_ausente"
            ? "Falta aplicar la migración 20261021000000_creadores.sql en Supabase."
            : "No pude leer los creadores. Probá de nuevo en un rato."}
        </p>
      ) : (
        <Contenido creadores={r.valor.creadores} comisiones={r.valor.comisiones} />
      )}

      <Nota>
        La comisión se calcula sobre lo que pagó el cliente (ya con el descuento) y queda congelada en la venta: cambiar
        el porcentaje no toca ventas viejas. El pago es a mano, por transferencia; el día 1 de cada mes llega un mail con
        lo pendiente. «Marcar pagado» pasa a pagadas todas las pendientes de ese creador.
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
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Tarjeta>
          <p className="text-xs uppercase tracking-wide text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">Por aprobar</p>
          <p className="mt-1 text-2xl [font-family:var(--fuente-titulo)]">{pendientes.length}</p>
          <span className="text-xs text-[var(--texto-menor)]">{conCodigo.length} con código</span>
        </Tarjeta>
        <Tarjeta>
          <p className="text-xs uppercase tracking-wide text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">Ventas con código</p>
          <p className="mt-1 text-2xl [font-family:var(--fuente-titulo)]">{total.ventas}</p>
          <span className="text-xs text-[var(--texto-menor)]">sin contar las anuladas</span>
        </Tarjeta>
        <Tarjeta>
          <p className="text-xs uppercase tracking-wide text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">Se les debe</p>
          <p className="mt-1 text-2xl [font-family:var(--fuente-titulo)]">{plata(total.pendiente)}</p>
          <span className="text-xs text-[var(--texto-menor)]">pagado: {plata(total.pagado)}</span>
        </Tarjeta>
      </div>

      <h2 className={H2}>Pendientes de aprobar</h2>
      {pendientes.length === 0 ? (
        <div className="mt-3">
          <SinDatos que="Nadie esperando: las altas de /colabora aparecen acá." />
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
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
        <div className="mt-3">
          <SinDatos que="Todavía no hay ningún creador aprobado." />
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {conCodigo.map((c) => {
            const r = resumenDeComisiones(comisiones.filter((k) => k.creador_id === c.id));
            return (
              <Tarjeta key={c.id}>
                <Datos c={c} />
                <p className="mt-3 text-sm">
                  {r.ventas} ventas · se le debe <b>{plata(r.pendiente)}</b> · pagado {plata(r.pagado)}
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
                  {Object.keys(r.pendiente).length > 0 ? (
                    <FormAccion accion={marcarPagado} boton="marcar pagado" estilo="hilo" confirmar={`¿Ya le transfirieron ${plata(r.pendiente)} a ${c.nombre}?`}>
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
        <div className="mt-3">
          <SinDatos que="Todavía no hay ventas con código de creador." />
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
                <th className="border-b border-[var(--linea)] py-2 pr-4">Fecha</th>
                <th className="border-b border-[var(--linea)] py-2 pr-4">Creador</th>
                <th className="border-b border-[var(--linea)] py-2 pr-4">Código</th>
                <th className="border-b border-[var(--linea)] py-2 pr-4">Pagó el cliente</th>
                <th className="border-b border-[var(--linea)] py-2 pr-4">%</th>
                <th className="border-b border-[var(--linea)] py-2 pr-4">Comisión</th>
                <th className="border-b border-[var(--linea)] py-2 pr-4">Estado</th>
                <th className="border-b border-[var(--linea)] py-2" />
              </tr>
            </thead>
            <tbody>
              {comisiones.map((k) => (
                <tr key={k.id}>
                  <td className="border-b border-[var(--linea)] py-2 pr-4">{fechaCorta(k.created_at, true)}</td>
                  <td className="border-b border-[var(--linea)] py-2 pr-4">{porId.get(k.creador_id)?.nombre ?? "—"}</td>
                  <td className="border-b border-[var(--linea)] py-2 pr-4">{k.codigo}</td>
                  <td className="border-b border-[var(--linea)] py-2 pr-4">{plata({ [k.moneda]: Number(k.total) })}</td>
                  <td className="border-b border-[var(--linea)] py-2 pr-4">{k.porcentaje}</td>
                  <td className="border-b border-[var(--linea)] py-2 pr-4">{plata({ [k.moneda]: Number(k.importe) })}</td>
                  <td className="border-b border-[var(--linea)] py-2 pr-4">
                    <Chip color={k.estado === "pendiente" ? "ambar" : k.estado === "pagada" ? "verde" : "neutro"}>
                      {k.estado}
                      {k.estado === "pagada" && k.pagada_at ? ` ${fechaCorta(k.pagada_at)}` : ""}
                    </Chip>
                  </td>
                  <td className="border-b border-[var(--linea)] py-2">
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
              ))}
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
        <b>{c.nombre}</b>
        <Chip color={e.color}>{e.texto}</Chip>
        {c.codigo ? <span className="[font-family:var(--fuente-micro)]">{c.codigo}</span> : null}
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
